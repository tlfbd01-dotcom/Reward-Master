import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, generateReferralCode, computeRank } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, email, password, referralCode } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: "username, email and password are required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }
  const existingUser = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUser.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  let referredById: number | null = null;
  if (referralCode) {
    const referrer = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode));
    if (referrer.length > 0) referredById = referrer[0].id;
  }

  const passwordHash = await hashPassword(password);
  const newReferralCode = generateReferralCode();

  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash,
    referralCode: newReferralCode,
    referredBy: referredById ?? undefined,
    emailVerified: true,
  }).returning();

  if (referredById) {
    const { transactionsTable } = await import("@workspace/db");
    await db.insert(transactionsTable).values({
      userId: referredById,
      type: "referral_bonus",
      amount: "0.50",
      description: `Referral bonus for inviting ${username}`,
      status: "completed",
    });
    const referrer = await db.select().from(usersTable).where(eq(usersTable.id, referredById));
    if (referrer.length > 0) {
      const newBalance = parseFloat(referrer[0].balance) + 0.5;
      const newTotalEarned = parseFloat(referrer[0].totalEarned) + 0.5;
      await db.update(usersTable).set({
        balance: newBalance.toFixed(2),
        totalEarned: newTotalEarned.toFixed(2),
        rank: computeRank(newTotalEarned),
      }).where(eq(usersTable.id, referredById));
    }
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      balance: parseFloat(user.balance),
      points: user.points,
      rank: user.rank,
      referralCode: user.referralCode,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (users.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const user = users[0];

  if (user.status === "banned") {
    res.status(401).json({ error: "Your account has been banned" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ip = req.ip ?? req.socket.remoteAddress ?? null;
  await db.update(usersTable).set({ lastIp: ip }).where(eq(usersTable.id, user.id));

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      balance: parseFloat(user.balance),
      points: user.points,
      rank: user.rank,
      referralCode: user.referralCode,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const user = users[0];
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    balance: parseFloat(user.balance),
    points: user.points,
    rank: user.rank,
    referralCode: user.referralCode,
    avatar: user.avatar,
    createdAt: user.createdAt,
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (users.length > 0) {
    const token = Math.random().toString(36).substring(2, 20);
    const expiry = new Date(Date.now() + 3600000);
    await db.update(usersTable).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(usersTable.id, users[0].id));
  }
  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.resetToken, token));
  if (users.length === 0) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  const user = users[0];
  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "Reset token has expired" });
    return;
  }
  const passwordHash = await hashPassword(password);
  await db.update(usersTable).set({ passwordHash, resetToken: null, resetTokenExpiry: null }).where(eq(usersTable.id, user.id));
  res.json({ message: "Password reset successfully" });
});

export default router;
