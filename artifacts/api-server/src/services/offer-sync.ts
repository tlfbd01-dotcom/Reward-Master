import { db, offersTable, networksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

type NotikOffer = {
  offer_id: number | string;
  title?: string;
  name?: string;
  description?: string;
  payout?: number | string;
  revenue?: number | string;
  icon?: string;
  icon_hd?: string;
  image?: string;
  click_url?: string;
  tracking_url?: string;
  countries?: string[] | string;
  country?: string;
  device?: string;
  device_type?: string;
  platform?: string;
  category?: string;
  genre?: string;
  status?: string;
};

type NotikPage = {
  data?: NotikOffer[] | { data?: NotikOffer[]; current_page?: number; next_page_url?: string | null; [k: string]: any };
  offers?: NotikOffer[];
  result?: NotikOffer[];
  items?: NotikOffer[];
  next_page_url?: string | null;
  current_page?: number;
  last_page?: number;
  [key: string]: any;
};

function normalizeDevice(raw?: string): "all" | "mobile" | "desktop" {
  if (!raw) return "all";
  const d = raw.toLowerCase();
  if (d.includes("mobile") || d === "ios" || d === "android") return "mobile";
  if (d.includes("desktop") || d === "web" || d === "pc") return "desktop";
  return "all";
}

function normalizeCountries(raw?: string[] | string): string[] {
  if (!raw) return ["US"];
  if (Array.isArray(raw)) return raw.length > 0 ? raw : ["US"];
  if (typeof raw === "string") {
    const parts = raw.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    return parts.length > 0 ? parts : ["US"];
  }
  return ["US"];
}

function normalizePayout(raw?: number | string): string {
  const n = typeof raw === "string" ? parseFloat(raw) : (raw ?? 0);
  if (isNaN(n) || n <= 0) return "0.01";
  // Notik payouts are in USD; if > 100, assume it's in cents
  return (n > 100 ? n / 100 : n).toFixed(2);
}

function normalizeClickUrl(raw?: string): string | null {
  if (!raw) return null;
  return raw
    .replace(/\[user_id\]/gi, "{userid}")
    .replace(/\{USER_ID\}/g, "{userid}")
    .replace(/\[userid\]/gi, "{userid}");
}

async function fetchNotikPage(url: string): Promise<NotikPage> {
  const resp = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "OfferLoots/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) {
    throw new Error(`Notik API HTTP ${resp.status}: ${await resp.text().catch(() => "")}`);
  }
  return resp.json() as Promise<NotikPage>;
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

    // Notik wraps paginated results in a nested object: { data: { data: [...], next_page_url: ... } }
    // or returns offers directly under data/offers/result/items keys, or as a root array
    let rawData = page.data;
    if (rawData && !Array.isArray(rawData) && typeof rawData === "object") {
      // Nested pagination wrapper — extract the inner array and next_page_url
      const inner = rawData as { data?: NotikOffer[]; next_page_url?: string | null; [k: string]: any };
      if (Array.isArray(inner.data)) {
        // carry the inner next_page_url forward
        if (inner.next_page_url !== undefined) {
          (page as any)._inner_next = inner.next_page_url;
        }
        rawData = inner.data;
      } else {
        rawData = undefined;
      }
    }

    const offers: NotikOffer[] = Array.isArray(rawData)
      ? (rawData as NotikOffer[])
      : Array.isArray(page.offers) ? page.offers
      : Array.isArray(page.result) ? page.result
      : Array.isArray(page.items) ? page.items
      : Array.isArray(page) ? (page as unknown as NotikOffer[])
      : [];

    for (const o of offers) {
      const externalId = String(o.offer_id ?? "");
      if (!externalId) continue;

      const title = o.title ?? o.name ?? "Untitled Offer";
      const payout = normalizePayout(o.payout ?? o.revenue);
      const clickUrl = normalizeClickUrl(o.click_url ?? o.tracking_url);
      const imageUrl = o.icon_hd ?? o.icon ?? o.image ?? null;
      const countries = normalizeCountries(o.countries ?? o.country);
      const device = normalizeDevice(o.device ?? o.device_type ?? o.platform);
      const category = o.category ?? o.genre ?? "survey";
      const description = o.description ?? "";

      // Check if offer already exists for this network
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
        }).where(eq(offersTable.id, existing[0].id));
        updated++;
      } else {
        await db.insert(offersTable).values({
          name: title, payout, description, imageUrl, offerUrl: clickUrl,
          device, countries, category, status: "active",
          network: network.name, networkId, offerExternalId: externalId,
        });
        added++;
      }
      total++;
    }

    nextUrl = (page as any)._inner_next !== undefined
      ? ((page as any)._inner_next as string | null)
      : (page.next_page_url ?? null);

    // Rate limit guard
    if (nextUrl) await new Promise(r => setTimeout(r, 500));
  }

  // Update network sync metadata
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
