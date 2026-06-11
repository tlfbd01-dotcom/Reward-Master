import { Router, type IRouter } from "express";
import { db, usersTable, conversionsTable, transactionsTable, withdrawalsTable, offersTable, networksTable } from "@workspace/db";
import { eq, desc, sql, ilike, and, or } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth";
import { computeRank } from "../lib/auth";

const router: IRouter = Router();

// Admin dashboard stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers, totalRevenue, totalWithdrawals, totalConversions,
    activeOffers, pendingWithdrawals, todaySignups, todayConversions, todayRevenue,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(conversionsTable).where(sql`status = 'approved'`),
    db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(withdrawalsTable).where(sql`status = 'approved'`),
    db.select({ count: sql<number>`count(*)` }).from(conversionsTable).where(sql`status = 'approved'`),
    db.select({ count: sql<number>`count(*)` }).from(offersTable).where(eq(offersTable.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(withdrawalsTable).where(sql`status = 'pending'`),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(sql`created_at >= ${today}`),
    db.select({ count: sql<number>`count(*)` }).from(conversionsTable).where(sql`created_at >= ${today} AND status = 'approved'`),
    db.select({ sum: sql<string>`coalesce(sum(amount), 0)` }).from(conversionsTable).where(sql`created_at >= ${today} AND status = 'approved'`),
  ]);

  res.json({
    totalUsers: Number(totalUsers[0]?.count ?? 0),
    totalRevenue: parseFloat(totalRevenue[0]?.sum ?? "0"),
    totalWithdrawals: parseFloat(totalWithdrawals[0]?.sum ?? "0"),
    totalConversions: Number(totalConversions[0]?.count ?? 0),
    activeOffers: Number(activeOffers[0]?.count ?? 0),
    pendingWithdrawals: Number(pendingWithdrawals[0]?.count ?? 0),
    todaySignups: Number(todaySignups[0]?.count ?? 0),
    todayConversions: Number(todayConversions[0]?.count ?? 0),
    todayRevenue: parseFloat(todayRevenue[0]?.sum ?? "0"),
  });
});

// Admin users list
router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const { search, page: pageStr, limit: limitStr, status } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitStr ?? "20", 10)));
  const offset = (page - 1) * limit;

  let whereClause = sql`1=1`;
  if (search) whereClause = sql`(username ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})`;
  if (status) whereClause = sql`${whereClause} AND status = ${status}`;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(whereClause),
    db.select().from(usersTable).where(whereClause).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
  ]);

  const convCounts = await db.select({
    userId: conversionsTable.userId,
    count: sql<number>`count(*)`,
  }).from(conversionsTable).where(sql`status = 'approved'`)
    .groupBy(conversionsTable.userId);
  const convMap = new Map(convCounts.map(c => [c.userId, Number(c.count)]));

  res.json({
    data: rows.map(u => ({
      id: u.id, username: u.username, email: u.email, status: u.status, role: u.role,
      balance: parseFloat(u.balance), points: u.points, rank: u.rank,
      totalEarned: parseFloat(u.totalEarned),
      totalConversions: convMap.get(u.id) ?? 0,
      createdAt: u.createdAt,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page, limit,
  });
});

// Admin user detail
router.get("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }
  const u = users[0];

  const convCount = await db.select({ count: sql<number>`count(*)` })
    .from(conversionsTable).where(sql`user_id = ${id} AND status = 'approved'`);

  res.json({
    id: u.id, username: u.username, email: u.email, status: u.status, role: u.role,
    balance: parseFloat(u.balance), points: u.points, rank: u.rank,
    totalEarned: parseFloat(u.totalEarned), totalWithdrawn: parseFloat(u.totalWithdrawn),
    totalConversions: Number(convCount[0]?.count ?? 0),
    referralCode: u.referralCode, avatar: u.avatar, country: u.country,
    lastIp: u.lastIp, createdAt: u.createdAt,
  });
});

// Admin update user
router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const requesterId = (req as any).userId as number;

  // Protect the main admin (ID=1) from being banned or demoted by other admins
  if (id === 1 && requesterId !== 1) {
    const { status, role } = req.body;
    if (status === "banned" || (role && role !== "admin")) {
      res.status(403).json({ error: "The main admin account cannot be banned or demoted." });
      return;
    }
  }

  const { status, balance, points, role } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (status) updates.status = status;
  if (balance !== undefined) updates.balance = parseFloat(balance).toFixed(2);
  if (points !== undefined) updates.points = parseInt(points, 10);
  if (role) updates.role = role;

  const [u] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!u) { res.status(404).json({ error: "User not found" }); return; }

  const convCount = await db.select({ count: sql<number>`count(*)` })
    .from(conversionsTable).where(sql`user_id = ${id} AND status = 'approved'`);

  res.json({
    id: u.id, username: u.username, email: u.email, status: u.status, role: u.role,
    balance: parseFloat(u.balance), points: u.points, rank: u.rank,
    totalEarned: parseFloat(u.totalEarned), totalWithdrawn: parseFloat(u.totalWithdrawn),
    totalConversions: Number(convCount[0]?.count ?? 0),
    referralCode: u.referralCode, avatar: u.avatar, country: u.country,
    lastIp: u.lastIp, createdAt: u.createdAt,
  });
});

// Admin offers CRUD
router.get("/admin/offers", requireAdmin, async (req, res): Promise<void> => {
  const { search, page: pageStr, status } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  let whereClause = sql`1=1`;
  if (search) whereClause = sql`name ILIKE ${'%' + search + '%'}`;
  if (status) whereClause = sql`${whereClause} AND status = ${status}`;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(offersTable).where(whereClause),
    db.select().from(offersTable).where(whereClause).orderBy(desc(offersTable.createdAt)).limit(limit).offset(offset),
  ]);

  res.json({
    data: rows.map(o => ({
      id: o.id, name: o.name, payout: parseFloat(o.payout), network: o.network,
      networkId: o.networkId, status: o.status, category: o.category, device: o.device,
      countries: o.countries, description: o.description, imageUrl: o.imageUrl,
      offerUrl: o.offerUrl, offerExternalId: o.offerExternalId, events: o.events ?? null,
      completions: o.completions, createdAt: o.createdAt,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page, limit,
  });
});

router.post("/admin/offers", requireAdmin, async (req, res): Promise<void> => {
  const { name, payout, network, networkId, category, device, countries, description, imageUrl, offerUrl, offerExternalId, events } = req.body;
  if (!name || payout == null || !network) {
    res.status(400).json({ error: "name, payout, and network are required" });
    return;
  }
  const [o] = await db.insert(offersTable).values({
    name, payout: parseFloat(payout).toFixed(2), network,
    networkId: networkId ?? null, category: category ?? "survey",
    device: device ?? "all", countries: countries ?? ["US"],
    description: description ?? "", imageUrl: imageUrl ?? null, offerUrl: offerUrl ?? null,
    offerExternalId: offerExternalId ?? null,
    events: Array.isArray(events) && events.length > 0 ? events : null,
  }).returning();

  res.status(201).json({
    id: o.id, name: o.name, payout: parseFloat(o.payout), network: o.network,
    networkId: o.networkId, status: o.status, category: o.category, device: o.device,
    countries: o.countries, description: o.description, imageUrl: o.imageUrl,
    offerUrl: o.offerUrl, offerExternalId: o.offerExternalId, events: o.events ?? null,
    completions: o.completions, createdAt: o.createdAt,
  });
});

router.patch("/admin/offers/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, payout, status, category, device, countries, description, imageUrl, offerUrl, offerExternalId, events } = req.body;
  const updates: Partial<typeof offersTable.$inferInsert> = {};
  if (name) updates.name = name;
  if (payout !== undefined) updates.payout = parseFloat(payout).toFixed(2);
  if (status) updates.status = status;
  if (category) updates.category = category;
  if (device) updates.device = device;
  if (countries) updates.countries = countries;
  if (description !== undefined) updates.description = description;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (offerUrl !== undefined) updates.offerUrl = offerUrl;
  if (offerExternalId !== undefined) updates.offerExternalId = offerExternalId;
  if (events !== undefined) updates.events = Array.isArray(events) && events.length > 0 ? events : null;

  const [o] = await db.update(offersTable).set(updates).where(eq(offersTable.id, id)).returning();
  if (!o) { res.status(404).json({ error: "Offer not found" }); return; }

  res.json({
    id: o.id, name: o.name, payout: parseFloat(o.payout), network: o.network,
    networkId: o.networkId, status: o.status, category: o.category, device: o.device,
    countries: o.countries, description: o.description, imageUrl: o.imageUrl,
    offerUrl: o.offerUrl, offerExternalId: o.offerExternalId, events: o.events ?? null,
    completions: o.completions, createdAt: o.createdAt,
  });
});

router.delete("/admin/offers/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(offersTable).set({ status: "deleted" }).where(eq(offersTable.id, id));
  res.sendStatus(204);
});

// Admin withdrawals
router.get("/admin/withdrawals", requireAdmin, async (req, res): Promise<void> => {
  const { status, page: pageStr } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  let whereClause = sql`1=1`;
  if (status) whereClause = sql`status = ${status}`;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(withdrawalsTable).where(whereClause),
    db.select().from(withdrawalsTable).where(whereClause).orderBy(desc(withdrawalsTable.createdAt)).limit(limit).offset(offset),
  ]);

  res.json({
    data: rows.map(w => ({
      id: w.id, userId: w.userId, amount: parseFloat(w.amount), method: w.method,
      accountInfo: w.accountInfo, status: w.status, notes: w.notes,
      createdAt: w.createdAt, updatedAt: w.updatedAt,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page, limit,
  });
});

router.patch("/admin/withdrawals/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status, notes } = req.body;
  if (!status) { res.status(400).json({ error: "status is required" }); return; }

  const rows = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
  if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const withdrawal = rows[0];

  if (status === "rejected" && withdrawal.status === "pending") {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId));
    if (users.length > 0) {
      const user = users[0];
      const refundedBalance = parseFloat(user.balance) + parseFloat(withdrawal.amount);
      await db.update(usersTable).set({ balance: refundedBalance.toFixed(2) }).where(eq(usersTable.id, withdrawal.userId));
    }
  }

  if (status === "approved" && withdrawal.status === "pending") {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId));
    if (users.length > 0) {
      const user = users[0];
      const newWithdrawn = parseFloat(user.totalWithdrawn) + parseFloat(withdrawal.amount);
      await db.update(usersTable).set({ totalWithdrawn: newWithdrawn.toFixed(2) }).where(eq(usersTable.id, withdrawal.userId));
    }
  }

  const [w] = await db.update(withdrawalsTable).set({ status, notes: notes ?? null }).where(eq(withdrawalsTable.id, id)).returning();
  res.json({
    id: w.id, userId: w.userId, amount: parseFloat(w.amount), method: w.method,
    accountInfo: w.accountInfo, status: w.status, notes: w.notes,
    createdAt: w.createdAt, updatedAt: w.updatedAt,
  });
});

// Admin conversions
router.get("/admin/conversions", requireAdmin, async (req, res): Promise<void> => {
  const { network, page: pageStr, limit: limitStr } = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitStr ?? "20", 10)));
  const offset = (page - 1) * limit;

  let whereClause = sql`1=1`;
  if (network) whereClause = sql`c.network = ${network}`;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(conversionsTable).where(whereClause),
    db.execute(sql`
      SELECT c.*, u.username FROM conversions c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
  ]);

  res.json({
    data: (rows.rows as any[]).map((c: any) => ({
      id: c.id, userId: c.user_id, username: c.username ?? "Unknown",
      offerId: c.offer_id, offerName: c.offer_name, network: c.network,
      amount: parseFloat(c.amount), status: c.status, txid: c.txid,
      ip: c.ip, createdAt: c.created_at,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page, limit,
  });
});

// Admin activity feed
router.get("/admin/activity", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT 'conversion' as type, c.id, c.amount, c.offer_name as description, u.username, c.created_at
    FROM conversions c LEFT JOIN users u ON c.user_id = u.id
    WHERE c.status = 'approved'
    UNION ALL
    SELECT 'withdrawal' as type, w.id, w.amount, ('Withdrawal via ' || w.method) as description, u.username, w.created_at
    FROM withdrawals w LEFT JOIN users u ON w.user_id = u.id
    UNION ALL
    SELECT 'registration' as type, u.id, 0 as amount, 'New user registered' as description, u.username, u.created_at
    FROM users u
    ORDER BY created_at DESC
    LIMIT 20
  `);

  res.json((rows.rows as any[]).map((r: any, i: number) => ({
    id: i + 1,
    type: r.type,
    description: r.description,
    amount: r.amount ? parseFloat(r.amount) : null,
    username: r.username ?? "Unknown",
    createdAt: r.created_at,
  })));
});

// Admin revenue chart
router.get("/admin/revenue", requireAdmin, async (req, res): Promise<void> => {
  const period = (req.query.period as string) ?? "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  const rows = await db.execute(sql`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(amount), 0) as revenue,
      COUNT(*) as conversions
    FROM conversions
    WHERE status = 'approved'
      AND created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  res.json((rows.rows as any[]).map((r: any) => ({
    date: r.date,
    revenue: parseFloat(r.revenue),
    conversions: Number(r.conversions),
  })));
});

// Admin networks
function serializeNetwork(n: typeof networksTable.$inferSelect) {
  return {
    id: n.id, name: n.name, slug: n.slug, logoUrl: n.logoUrl,
    isActive: n.isActive,
    postbackUrl: `/api/postback?network=${n.slug}&subid={user_id}&amount={payout}&txid={txid}&status=approved`,
    secretKey: n.secretKey,
    payoutPercent: n.payoutPercent,
    pullEnabled: n.pullEnabled,
    apiKey: n.apiKey,
    pubId: n.pubId,
    appId: n.appId,
    pullUrl: n.pullUrl,
    lastSyncedAt: n.lastSyncedAt,
    syncedOfferCount: n.syncedOfferCount,
    totalConversions: n.totalConversions,
    totalRevenue: parseFloat(n.totalRevenue),
  };
}

router.get("/admin/networks", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(networksTable);
  res.json(rows.map(serializeNetwork));
});

router.post("/admin/networks", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, logoUrl, secretKey, isActive, pullEnabled, apiKey, pubId, appId, pullUrl, payoutPercent } = req.body;
  if (!name || !slug) { res.status(400).json({ error: "name and slug are required" }); return; }

  const pct = typeof payoutPercent === "number" ? Math.min(100, Math.max(1, Math.round(payoutPercent))) : 100;

  const [n] = await db.insert(networksTable).values({
    name, slug, logoUrl: logoUrl ?? null, secretKey: secretKey ?? null,
    isActive: isActive ?? true,
    payoutPercent: pct,
    pullEnabled: pullEnabled ?? false,
    apiKey: apiKey ?? null, pubId: pubId ?? null,
    appId: appId ?? null, pullUrl: pullUrl ?? null,
  }).returning();

  res.status(201).json(serializeNetwork(n));
});

router.patch("/admin/networks/:id", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, logoUrl, secretKey, isActive, pullEnabled, apiKey, pubId, appId, pullUrl, payoutPercent } = req.body;
  const updates: Partial<typeof networksTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (secretKey !== undefined) updates.secretKey = secretKey;
  if (isActive !== undefined) updates.isActive = isActive;
  if (pullEnabled !== undefined) updates.pullEnabled = pullEnabled;
  if (apiKey !== undefined) updates.apiKey = apiKey;
  if (pubId !== undefined) updates.pubId = pubId;
  if (appId !== undefined) updates.appId = appId;
  if (pullUrl !== undefined) updates.pullUrl = pullUrl;
  if (payoutPercent !== undefined) updates.payoutPercent = Math.min(100, Math.max(1, Math.round(Number(payoutPercent))));

  const [n] = await db.update(networksTable).set(updates).where(eq(networksTable.id, id)).returning();
  if (!n) { res.status(404).json({ error: "Network not found" }); return; }

  res.json(serializeNetwork(n));
});

// Manual sync trigger
router.post("/admin/networks/:id/sync", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { syncNetworkOffers } = await import("../services/offer-sync");
  try {
    const result = await syncNetworkOffers(id);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Sync failed" });
  }
});

// Create a new admin account
router.post("/admin/create-admin", requireAdmin, async (req, res): Promise<void> => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: "username, email and password are required" });
    return;
  }

  const { hashPassword, generateReferralCode } = await import("../lib/auth");

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) { res.status(400).json({ error: "Email already in use" }); return; }
  const existingUser = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUser.length > 0) { res.status(400).json({ error: "Username already taken" }); return; }

  const passwordHash = await hashPassword(password);
  const [u] = await db.insert(usersTable).values({
    username, email, passwordHash,
    role: "admin",
    referralCode: generateReferralCode(),
    emailVerified: true,
  }).returning();

  res.status(201).json({
    id: u.id, username: u.username, email: u.email, role: u.role, status: u.status,
    balance: parseFloat(u.balance), createdAt: u.createdAt,
  });
});

// Admin updates own profile (email and/or password)
router.patch("/admin/profile", requireAdmin, async (req, res): Promise<void> => {
  const requesterId = (req as any).userId as number;
  const { email, currentPassword, newPassword } = req.body;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, requesterId));
  if (users.length === 0) { res.status(404).json({ error: "Admin not found" }); return; }
  const admin = users[0];

  const { comparePassword, hashPassword } = await import("../lib/auth");
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (email && email !== admin.email) {
    const emailExists = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (emailExists.length > 0) { res.status(400).json({ error: "Email already in use" }); return; }
    updates.email = email;
  }

  if (newPassword) {
    if (!currentPassword) { res.status(400).json({ error: "Current password is required to set a new password" }); return; }
    const valid = await comparePassword(currentPassword, admin.passwordHash);
    if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }
    updates.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) {
    res.json({ message: "No changes made" });
    return;
  }

  const [u] = await db.update(usersTable).set(updates).where(eq(usersTable.id, requesterId)).returning();
  res.json({
    id: u.id, username: u.username, email: u.email, role: u.role, status: u.status,
    balance: parseFloat(u.balance), createdAt: u.createdAt,
  });
});

// ─── Seed 1000 demo users ────────────────────────────────────────────────────

router.post("/admin/seed-users", requireAdmin, async (_req, res): Promise<void> => {
  const { hashPassword, generateReferralCode, computeRank } = await import("../lib/auth");
  const FIRST = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Drew", "Jamie", "Blake",
    "Quinn", "Avery", "Sage", "Hayden", "Parker", "Hunter", "Logan", "Dylan", "Cameron", "Reese"];
  const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson",
    "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Young", "King"];
  const COUNTRIES = ["US", "GB", "CA", "AU", "DE", "IN", "BR", "PH", "NG", "MX", "ID", "ZA", "PK", "TR", "FR"];
  const passwordHash = await hashPassword("user123");

  const users: typeof usersTable.$inferInsert[] = [];
  for (let i = 0; i < 1000; i++) {
    const first = FIRST[Math.floor(Math.random() * FIRST.length)];
    const last = LAST[Math.floor(Math.random() * LAST.length)];
    const suffix = Math.floor(Math.random() * 9999);
    const username = `${first}${last}${suffix}`.toLowerCase();
    const email = `${username}@demo.offerloots.com`;
    const totalEarned = parseFloat((Math.random() * 250).toFixed(2));
    const withdrawn = parseFloat((Math.random() * totalEarned * 0.6).toFixed(2));
    const balance = parseFloat(Math.max(0, totalEarned - withdrawn).toFixed(2));
    users.push({
      username,
      email,
      passwordHash,
      referralCode: generateReferralCode() + i,
      country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
      balance: balance.toFixed(2),
      totalEarned: totalEarned.toFixed(2),
      totalWithdrawn: withdrawn.toFixed(2),
      points: Math.floor(Math.random() * 5000),
      rank: computeRank(totalEarned),
      emailVerified: Math.random() > 0.7,
    });
  }

  let inserted = 0;
  const BATCH = 100;
  for (let i = 0; i < users.length; i += BATCH) {
    const batch = users.slice(i, i + BATCH);
    const result = await db.insert(usersTable).values(batch).onConflictDoNothing().returning({ id: usersTable.id });
    inserted += result.length;
  }

  res.json({ ok: true, inserted, attempted: users.length });
});

export default router;
