import { Router, type IRouter } from "express";
import { db, networksTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/networks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(networksTable);
  res.json(rows.map(n => ({
    id: n.id, name: n.name, slug: n.slug, logoUrl: n.logoUrl,
    isActive: n.isActive,
    postbackUrl: `/api/postback?network=${n.slug}&subid={user_id}&amount={payout}&txid={txid}&status=approved`,
    secretKey: null,
    totalConversions: n.totalConversions,
    totalRevenue: parseFloat(n.totalRevenue),
  })));
});

export default router;
