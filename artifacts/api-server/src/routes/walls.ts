import { Router, type IRouter } from "express";
import { db, wallsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

function buildWallUrl(template: string, userId: number): string {
  return template.replace(/\{userid\}/gi, String(userId));
}

function serializeWall(w: typeof wallsTable.$inferSelect, userId?: number) {
  return {
    id: w.id,
    name: w.name,
    slug: w.slug,
    logoUrl: w.logoUrl,
    rating: parseFloat(w.rating),
    description: w.description,
    isActive: w.isActive,
    sortOrder: w.sortOrder,
    urlTemplate: w.urlTemplate,
    placementId: w.placementId,
    totalConversions: w.totalConversions,
    totalRevenue: parseFloat(w.totalRevenue),
    iframeUrl: userId != null ? buildWallUrl(w.urlTemplate, userId) : null,
  };
}

// Public: list active walls (with user ID if authenticated)
router.get("/walls", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const rows = await db.select().from(wallsTable)
    .where(eq(wallsTable.isActive, true))
    .orderBy(sql`sort_order ASC, id ASC`);
  res.json(rows.map(w => serializeWall(w, userId)));
});

// Admin: list all walls
router.get("/admin/walls", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(wallsTable).orderBy(sql`sort_order ASC, id ASC`);
  res.json(rows.map(w => serializeWall(w)));
});

// Admin: create wall
router.post("/admin/walls", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, logoUrl, urlTemplate, placementId, rating, description, isActive, sortOrder } = req.body;
  if (!name || !slug || !urlTemplate || !placementId) {
    res.status(400).json({ error: "name, slug, urlTemplate, and placementId are required" });
    return;
  }
  const [w] = await db.insert(wallsTable).values({
    name,
    slug,
    logoUrl: logoUrl ?? null,
    urlTemplate,
    placementId,
    rating: rating ? String(parseFloat(rating).toFixed(1)) : "4.0",
    description: description ?? "",
    isActive: isActive ?? true,
    sortOrder: sortOrder ?? 0,
  }).returning();

  res.status(201).json(serializeWall(w));
});

// Admin: update wall
router.patch("/admin/walls/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, logoUrl, urlTemplate, placementId, rating, description, isActive, sortOrder } = req.body;
  const updates: Partial<typeof wallsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (urlTemplate !== undefined) updates.urlTemplate = urlTemplate;
  if (placementId !== undefined) updates.placementId = placementId;
  if (rating !== undefined) updates.rating = String(parseFloat(rating).toFixed(1));
  if (description !== undefined) updates.description = description;
  if (isActive !== undefined) updates.isActive = isActive;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const [w] = await db.update(wallsTable).set(updates).where(eq(wallsTable.id, id)).returning();
  if (!w) { res.status(404).json({ error: "Wall not found" }); return; }
  res.json(serializeWall(w));
});

// Admin: delete wall
router.delete("/admin/walls/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(wallsTable).where(eq(wallsTable.id, id));
  res.sendStatus(204);
});

export default router;
