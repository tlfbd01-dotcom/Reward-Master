import { Router, type IRouter } from "express";
import { db, offersTable } from "@workspace/db";
import { eq, sql, and, ilike } from "drizzle-orm";

const router: IRouter = Router();

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
    db.select().from(offersTable).where(where)
      .orderBy(sql`payout DESC`).limit(limit).offset(offset),
  ]);

  const data = rows.filter(o => {
    if (country && !o.countries.includes(country) && !o.countries.includes("ALL")) return false;
    return true;
  });

  res.json({
    data: data.map(o => ({
      id: o.id, name: o.name, payout: parseFloat(o.payout), network: o.network,
      networkId: o.networkId, status: o.status, category: o.category, device: o.device,
      countries: o.countries, description: o.description, imageUrl: o.imageUrl,
      offerUrl: o.offerUrl, completions: o.completions, createdAt: o.createdAt,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page, limit,
  });
});

router.get("/offers/featured", async (_req, res): Promise<void> => {
  const rows = await db.select().from(offersTable)
    .where(eq(offersTable.status, "active"))
    .orderBy(sql`payout DESC`)
    .limit(8);

  res.json(rows.map(o => ({
    id: o.id, name: o.name, payout: parseFloat(o.payout), network: o.network,
    networkId: o.networkId, status: o.status, category: o.category, device: o.device,
    countries: o.countries, description: o.description, imageUrl: o.imageUrl,
    offerUrl: o.offerUrl, completions: o.completions, createdAt: o.createdAt,
  })));
});

router.get("/offers/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(offersTable).where(eq(offersTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Offer not found" }); return; }
  const o = rows[0];
  res.json({
    id: o.id, name: o.name, payout: parseFloat(o.payout), network: o.network,
    networkId: o.networkId, status: o.status, category: o.category, device: o.device,
    countries: o.countries, description: o.description, imageUrl: o.imageUrl,
    offerUrl: o.offerUrl, completions: o.completions, createdAt: o.createdAt,
  });
});

export default router;
