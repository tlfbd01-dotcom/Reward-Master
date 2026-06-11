import { Router, type IRouter } from "express";
import { db, offersTable, offerClicksTable, networksTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function applyPayoutPct(rawPayout: string, payoutPercent: number | null): number {
  const pct = (payoutPercent != null && payoutPercent > 0) ? payoutPercent : 100;
  return Math.round(parseFloat(rawPayout) * (pct / 100) * 100) / 100;
}

function serializeOffer(
  o: typeof offersTable.$inferSelect,
  payoutPercent: number | null,
) {
  return {
    id: o.id,
    name: o.name,
    payout: applyPayoutPct(o.payout, payoutPercent),
    network: o.network,
    networkId: o.networkId,
    status: o.status,
    category: o.category,
    device: o.device,
    countries: o.countries,
    description: o.description,
    imageUrl: o.imageUrl,
    offerUrl: o.offerUrl,
    offerExternalId: o.offerExternalId,
    events: o.events ?? null,
    completions: o.completions,
    createdAt: o.createdAt,
  };
}

router.get("/offers", async (req, res): Promise<void> => {
  const { network, country, device, category, page: pageStr, limit: limitStr } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(limitStr ?? "20", 10)));
  const offset = (page - 1) * limit;

  const conditions = [eq(offersTable.status, "active")];
  if (network) conditions.push(eq(offersTable.network, network));
  if (device && device !== "all") conditions.push(eq(offersTable.device, device));
  if (category) conditions.push(eq(offersTable.category, category));

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(offersTable).where(where),
    db.select({
      offer: offersTable,
      payoutPercent: networksTable.payoutPercent,
    })
      .from(offersTable)
      .leftJoin(networksTable, sql`lower(${offersTable.network}) = lower(${networksTable.slug})`)
      .where(where)
      .orderBy(sql`${offersTable.payout} DESC`)
      .limit(limit)
      .offset(offset),
  ]);

  const data = rows.filter(r => {
    if (country && !r.offer.countries.includes(country) && !r.offer.countries.includes("ALL")) return false;
    return true;
  });

  res.json({
    data: data.map(r => serializeOffer(r.offer, r.payoutPercent ?? null)),
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
  });
});

router.get("/offers/countries", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT DISTINCT unnest(countries) AS country
    FROM offers
    WHERE status = 'active'
    ORDER BY country
  `);
  const codes = (result.rows as { country: string }[])
    .map(r => r.country)
    .filter(c => c && c !== "ALL" && c.length === 2);
  res.json(codes);
});

router.get("/offers/featured", async (_req, res): Promise<void> => {
  const rows = await db.select({
    offer: offersTable,
    payoutPercent: networksTable.payoutPercent,
  })
    .from(offersTable)
    .leftJoin(networksTable, sql`lower(${offersTable.network}) = lower(${networksTable.slug})`)
    .where(eq(offersTable.status, "active"))
    .orderBy(sql`${offersTable.payout} DESC`)
    .limit(8);
  res.json(rows.map(r => serializeOffer(r.offer, r.payoutPercent ?? null)));
});

router.get("/offers/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select({
    offer: offersTable,
    payoutPercent: networksTable.payoutPercent,
  })
    .from(offersTable)
    .leftJoin(networksTable, sql`lower(${offersTable.network}) = lower(${networksTable.slug})`)
    .where(eq(offersTable.id, id));

  if (rows.length === 0) { res.status(404).json({ error: "Offer not found" }); return; }
  res.json(serializeOffer(rows[0].offer, rows[0].payoutPercent ?? null));
});

// Click tracking — logs click and returns the redirect URL with USER_ID substituted
router.get("/offers/:id/click", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(offersTable).where(eq(offersTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Offer not found" }); return; }

  const offer = rows[0];
  const ip = req.ip ?? req.socket.remoteAddress ?? null;

  await db.insert(offerClicksTable).values({ userId, offerId: id, ip });

  if (!offer.offerUrl) {
    res.json({ url: null });
    return;
  }

  const finalUrl = offer.offerUrl.replace(/\{userid\}/gi, String(userId));

  res.json({ url: finalUrl });
});

export default router;
