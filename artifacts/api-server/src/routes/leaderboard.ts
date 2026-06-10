import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (_req, res): Promise<void> => {
  const rows = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    totalEarned: usersTable.totalEarned,
    avatar: usersTable.avatar,
  }).from(usersTable)
    .where(sql`status = 'active'`)
    .orderBy(sql`total_earned DESC`)
    .limit(20);

  res.json(rows.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    username: u.username,
    totalEarned: parseFloat(u.totalEarned),
    avatar: u.avatar,
  })));
});

export default router;
