import { Router, type IRouter } from "express";
import { db, apiKeysTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { generateApiKey } from "../lib/auth";

const router: IRouter = Router();

router.get("/apikeys", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const rows = await db.select().from(apiKeysTable).where(eq(apiKeysTable.userId, userId));
  res.json(rows.map(k => ({
    id: k.id, name: k.name, key: k.key, isActive: k.isActive,
    usageCount: k.usageCount, lastUsedAt: k.lastUsedAt, createdAt: k.createdAt,
  })));
});

router.post("/apikeys", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const existing = await db.select({ count: sql<number>`count(*)` })
    .from(apiKeysTable).where(eq(apiKeysTable.userId, userId));
  if (Number(existing[0]?.count ?? 0) >= 5) {
    res.status(400).json({ error: "Maximum 5 API keys allowed" });
    return;
  }

  const [key] = await db.insert(apiKeysTable).values({
    userId, name, key: generateApiKey(), isActive: true,
  }).returning();

  res.status(201).json({
    id: key.id, name: key.name, key: key.key, isActive: key.isActive,
    usageCount: key.usageCount, lastUsedAt: key.lastUsedAt, createdAt: key.createdAt,
  });
});

router.delete("/apikeys/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(apiKeysTable)
    .where(sql`id = ${id} AND user_id = ${userId}`);
  if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(apiKeysTable).where(sql`id = ${id} AND user_id = ${userId}`);
  res.sendStatus(204);
});

export default router;
