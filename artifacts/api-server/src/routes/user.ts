import { Router, type IRouter } from "express";
import { db, usersTable, conversionsTable, transactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { computeRank, computeRankProgress, getNextRank } from "../lib/auth";

const router: IRouter = Router();

router.get("/user/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const user = users[0];
  const totalEarned = parseFloat(user.totalEarned);

  const referralCount = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.referredBy, userId));

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    balance: parseFloat(user.balance),
    points: user.points,
    rank: user.rank,
    rankProgress: computeRankProgress(totalEarned),
    nextRank: getNextRank(user.rank),
    referralCode: user.referralCode,
    totalEarned,
    totalWithdrawn: parseFloat(user.totalWithdrawn),
    totalReferrals: Number(referralCount[0]?.count ?? 0),
    avatar: user.avatar,
    country: user.country,
    createdAt: user.createdAt,
  });
});

router.patch("/user/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const { username, country, avatar } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (username) updates.username = username;
  if (country !== undefined) updates.country = country;
  if (avatar !== undefined) updates.avatar = avatar;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  const totalEarned = parseFloat(user.totalEarned);
  const referralCount = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.referredBy, userId));
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    balance: parseFloat(user.balance),
    points: user.points,
    rank: user.rank,
    rankProgress: computeRankProgress(totalEarned),
    nextRank: getNextRank(user.rank),
    referralCode: user.referralCode,
    totalEarned,
    totalWithdrawn: parseFloat(user.totalWithdrawn),
    totalReferrals: Number(referralCount[0]?.count ?? 0),
    avatar: user.avatar,
    country: user.country,
    createdAt: user.createdAt,
  });
});

router.get("/user/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const user = users[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayConv = await db.select({ sum: sql<string>`coalesce(sum(amount), 0)` })
    .from(conversionsTable)
    .where(sql`user_id = ${userId} AND status = 'approved' AND created_at >= ${today}`);

  const totalConv = await db.select({ count: sql<number>`count(*)` })
    .from(conversionsTable)
    .where(sql`user_id = ${userId} AND status = 'approved'`);

  const { withdrawalsTable } = await import("@workspace/db");
  const pendingWithd = await db.select({ sum: sql<string>`coalesce(sum(amount), 0)` })
    .from(withdrawalsTable)
    .where(sql`user_id = ${userId} AND status = 'pending'`);

  const recentConversions = await db.select().from(conversionsTable)
    .where(eq(conversionsTable.userId, userId))
    .orderBy(desc(conversionsTable.createdAt))
    .limit(5);

  const recentTransactions = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(5);

  const totalEarned = parseFloat(user.totalEarned);

  res.json({
    balance: parseFloat(user.balance),
    points: user.points,
    totalEarned,
    todayEarned: parseFloat(todayConv[0]?.sum ?? "0"),
    totalConversions: Number(totalConv[0]?.count ?? 0),
    pendingWithdrawals: parseFloat(pendingWithd[0]?.sum ?? "0"),
    rank: user.rank,
    rankProgress: computeRankProgress(totalEarned),
    recentConversions: recentConversions.map(c => ({
      id: c.id, userId: c.userId, offerId: c.offerId, offerName: c.offerName,
      network: c.network, amount: parseFloat(c.amount), status: c.status,
      txid: c.txid, ip: c.ip, createdAt: c.createdAt,
    })),
    recentTransactions: recentTransactions.map(t => ({
      id: t.id, userId: t.userId, type: t.type, amount: parseFloat(t.amount),
      description: t.description, status: t.status, referenceId: t.referenceId,
      createdAt: t.createdAt,
    })),
  });
});

router.get("/user/balance", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const user = users[0];

  const { withdrawalsTable } = await import("@workspace/db");
  const pending = await db.select({ sum: sql<string>`coalesce(sum(amount), 0)` })
    .from(withdrawalsTable)
    .where(sql`user_id = ${userId} AND status = 'pending'`);

  res.json({
    balance: parseFloat(user.balance),
    points: user.points,
    pendingBalance: parseFloat(pending[0]?.sum ?? "0"),
  });
});

router.get("/user/transactions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(transactionsTable).where(eq(transactionsTable.userId, userId)),
    db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId))
      .orderBy(desc(transactionsTable.createdAt)).limit(limit).offset(offset),
  ]);

  res.json({
    data: rows.map(t => ({
      id: t.id, userId: t.userId, type: t.type, amount: parseFloat(t.amount),
      description: t.description, status: t.status, referenceId: t.referenceId,
      createdAt: t.createdAt,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page, limit,
  });
});

router.get("/user/referrals", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const referrals = await db.select().from(usersTable).where(eq(usersTable.referredBy, userId))
    .orderBy(desc(usersTable.createdAt));

  res.json(referrals.map(u => ({
    id: u.id,
    username: u.username,
    createdAt: u.createdAt,
    totalEarnings: parseFloat(u.totalEarned),
    status: u.status,
  })));
});

router.get("/user/conversions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(conversionsTable).where(eq(conversionsTable.userId, userId)),
    db.select().from(conversionsTable).where(eq(conversionsTable.userId, userId))
      .orderBy(desc(conversionsTable.createdAt)).limit(limit).offset(offset),
  ]);

  res.json({
    data: rows.map(c => ({
      id: c.id, userId: c.userId, offerId: c.offerId, offerName: c.offerName,
      network: c.network, amount: parseFloat(c.amount), status: c.status,
      txid: c.txid, ip: c.ip, createdAt: c.createdAt,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page, limit,
  });
});

export default router;
