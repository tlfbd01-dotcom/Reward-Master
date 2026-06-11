import { db, offersTable, networksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

// Actual Notik API offer shape (from live response)
type NotikOffer = {
  offer_id: number | string;
  name?: string;
  title?: string;
  image_url?: string;
  icon_hd?: string;
  icon?: string;
  image?: string;
  click_url?: string;
  tracking_url?: string;
  // Notik uses country_code (array) or countries/country
  country_code?: string[] | string;
  countries?: string[] | string;
  country?: string;
  // Notik uses devices (array) or device/device_type/platform
  devices?: string[] | string;
  device?: string;
  device_type?: string;
  platform?: string;
  // Notik uses categories (array) or category/genre
  categories?: string[] | string;
  category?: string;
  genre?: string;
  // Notik uses description1/description2/description3 or description
  description1?: string;
  description2?: string;
  description?: string;
  payout?: number | string;
  revenue?: number | string;
  events?: Array<{ id?: string | number; name?: string; payout?: number | string }>;
  status?: string;
};

// Actual Notik API top-level response
type NotikResponse = {
  status?: string;
  code?: string | number;
  // Main pagination wrapper — all possible locations
  offers?: {
    data?: NotikOffer[];
    next_page_url?: string | null;
    has_more_pages?: boolean;
    per_page?: number;
    total?: number;
  } | NotikOffer[];
  data?: NotikOffer[] | {
    data?: NotikOffer[];
    next_page_url?: string | null;
    [k: string]: any;
  };
  result?: NotikOffer[];
  items?: NotikOffer[];
  next_page_url?: string | null;
  [key: string]: any;
};

function normalizeDevice(raw?: string[] | string): "all" | "mobile" | "desktop" {
  if (!raw) return "all";
  const str = Array.isArray(raw) ? raw.join(" ") : raw;
  const d = str.toLowerCase();
  if (d.includes("mobile") || d.includes("tablet") || d === "ios" || d === "android") return "mobile";
  if (d.includes("desktop") || d === "web" || d === "pc") return "desktop";
  return "all";
}

function normalizeCountries(raw?: string[] | string): string[] {
  if (!raw) return ["US"];
  if (Array.isArray(raw)) return raw.length > 0 ? raw.map(s => s.trim().toUpperCase()).filter(Boolean) : ["US"];
  if (typeof raw === "string") {
    const parts = raw.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    return parts.length > 0 ? parts : ["US"];
  }
  return ["US"];
}

function normalizePayout(raw?: number | string): string {
  const n = typeof raw === "string" ? parseFloat(raw) : (raw ?? 0);
  if (isNaN(n) || n <= 0) return "0.01";
  // Notik payouts come in USD cents scaled — values > 1000 assume cents
  return (n > 1000 ? n / 100 : n).toFixed(2);
}

function normalizeClickUrl(raw?: string): string | null {
  if (!raw) return null;
  return raw
    .replace(/\[user_id\]/gi, "{userid}")
    .replace(/\{USER_ID\}/g, "{userid}")
    .replace(/\[userid\]/gi, "{userid}");
}

function normalizeCategory(raw?: string[] | string): string {
  if (!raw) return "survey";
  const str = Array.isArray(raw) ? raw[0] ?? "survey" : raw;
  return str.toLowerCase() || "survey";
}

async function fetchNotikPage(url: string): Promise<NotikResponse> {
  const resp = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "OfferLoots/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) {
    throw new Error(`Notik API HTTP ${resp.status}: ${await resp.text().catch(() => "")}`);
  }
  return resp.json() as Promise<NotikResponse>;
}

/**
 * Extract the offer array and next_page_url from whatever shape the API returns.
 * Handles:
 *   1. { status, offers: { data: [...], next_page_url } }   ← Notik actual format
 *   2. { data: [...], next_page_url }
 *   3. { data: { data: [...], next_page_url } }
 *   4. { offers: [...] }
 *   5. Root array
 */
function extractOffersAndNext(page: NotikResponse): { offers: NotikOffer[]; nextUrl: string | null } {
  // Case 1 (Notik actual): page.offers is an object with .data array
  if (page.offers && !Array.isArray(page.offers) && typeof page.offers === "object") {
    const wrapper = page.offers as { data?: NotikOffer[]; next_page_url?: string | null };
    if (Array.isArray(wrapper.data)) {
      return {
        offers: wrapper.data,
        nextUrl: wrapper.next_page_url ?? null,
      };
    }
  }

  // Case 2: page.data is a direct array
  if (Array.isArray(page.data)) {
    return { offers: page.data as NotikOffer[], nextUrl: page.next_page_url ?? null };
  }

  // Case 3: page.data is an object wrapper with inner .data array
  if (page.data && !Array.isArray(page.data) && typeof page.data === "object") {
    const wrapper = page.data as { data?: NotikOffer[]; next_page_url?: string | null };
    if (Array.isArray(wrapper.data)) {
      return { offers: wrapper.data, nextUrl: wrapper.next_page_url ?? null };
    }
  }

  // Case 4: page.offers is a direct array
  if (Array.isArray(page.offers)) {
    return { offers: page.offers as NotikOffer[], nextUrl: page.next_page_url ?? null };
  }

  // Case 5: result/items
  if (Array.isArray(page.result)) return { offers: page.result, nextUrl: page.next_page_url ?? null };
  if (Array.isArray(page.items)) return { offers: page.items, nextUrl: page.next_page_url ?? null };

  // Case 6: page itself is an array
  if (Array.isArray(page)) return { offers: page as unknown as NotikOffer[], nextUrl: null };

  return { offers: [], nextUrl: null };
}

export async function syncNetworkOffers(networkId: number): Promise<{ added: number; updated: number; total: number }> {
  const [network] = await db.select().from(networksTable).where(eq(networksTable.id, networkId));
  if (!network) throw new Error("Network not found");
  if (!network.pullEnabled) throw new Error("Auto-pull is not enabled for this network. Enable it and set credentials first.");
  if (!network.apiKey && !network.pubId && !network.appId) throw new Error("No API credentials configured. Please set at least an API Key, Publisher ID, or App ID.");

  // Build start URL — only append params that are set
  const baseUrl = network.pullUrl || "https://notik.me/api/v2/get-offers/all";
  const params = new URLSearchParams();
  if (network.apiKey) params.set("api_key", network.apiKey);
  if (network.pubId) params.set("pub_id", network.pubId);
  if (network.appId) params.set("app_id", network.appId);
  const startUrl = `${baseUrl}?${params.toString()}`;

  let added = 0;
  let updated = 0;
  let total = 0;
  let nextUrl: string | null = startUrl;
  let pageCount = 0;

  while (nextUrl && pageCount < 30) {
    pageCount++;
    logger.info({ networkId, page: pageCount, url: nextUrl }, "Syncing offers page");

    const page = await fetchNotikPage(nextUrl);
    const { offers, nextUrl: newNextUrl } = extractOffersAndNext(page);

    logger.info({ networkId, page: pageCount, offersFound: offers.length, nextUrl: newNextUrl }, "Offers page extracted");

    for (const o of offers) {
      const externalId = String(o.offer_id ?? "").trim();
      if (!externalId) continue;

      // Field mapping for Notik's actual response shape
      const title = o.name ?? o.title ?? "Untitled Offer";
      const payout = normalizePayout(o.payout ?? o.revenue);
      const clickUrl = normalizeClickUrl(o.click_url ?? o.tracking_url);
      const imageUrl = o.image_url ?? o.icon_hd ?? o.icon ?? o.image ?? null;
      const countries = normalizeCountries(o.country_code ?? o.countries ?? o.country);
      const device = normalizeDevice(o.devices ?? o.device ?? o.device_type ?? o.platform);
      const category = normalizeCategory(o.categories ?? o.category ?? o.genre);
      const description = o.description1 ?? o.description ?? "";

      // Normalize events if present
      const events = Array.isArray(o.events) && o.events.length > 0
        ? o.events.map(ev => ({
            id: String(ev.id ?? ""),
            name: ev.name ?? "",
            payout: parseFloat(String(ev.payout ?? "0")),
          }))
        : null;

      const existing = await db.select({ id: offersTable.id })
        .from(offersTable)
        .where(and(
          eq(offersTable.offerExternalId, externalId),
          eq(offersTable.networkId, networkId)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db.update(offersTable).set({
          name: title, payout, description, imageUrl, offerUrl: clickUrl,
          device, countries, category, status: "active",
          events,
        }).where(eq(offersTable.id, existing[0].id));
        updated++;
      } else {
        await db.insert(offersTable).values({
          name: title, payout, description, imageUrl, offerUrl: clickUrl,
          device, countries, category, status: "active",
          network: network.name, networkId, offerExternalId: externalId,
          events,
        });
        added++;
      }
      total++;
    }

    nextUrl = newNextUrl;

    // Rate limit guard: max 30 req / 15 min
    if (nextUrl) await new Promise(r => setTimeout(r, 500));
  }

  await db.update(networksTable).set({
    lastSyncedAt: new Date(),
    syncedOfferCount: total,
  }).where(eq(networksTable.id, networkId));

  logger.info({ networkId, added, updated, total }, "Offer sync complete");
  return { added, updated, total };
}

export async function syncAllEnabledNetworks(): Promise<void> {
  const networks = await db.select().from(networksTable)
    .where(and(eq(networksTable.pullEnabled, true), eq(networksTable.isActive, true)));

  for (const n of networks) {
    try {
      await syncNetworkOffers(n.id);
    } catch (err) {
      logger.error({ err, networkId: n.id, network: n.name }, "Failed to sync network offers");
    }
  }
}
