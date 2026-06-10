import { Router, type IRouter } from "express";
import { db, usersTable, withdrawalsTable, transactionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const MIN_WITHDRAWAL = 5.00;

router.get("/withdrawals", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const rows = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, userId))
    .orderBy(desc(withdrawalsTable.createdAt));
  res.json(rows.map(w => ({
    id: w.id, userId: w.userId, amount: parseFloat(w.amount), method: w.method,
    accountInfo: w.accountInfo, status: w.status, notes: w.notes,
    createdAt: w.createdAt, updatedAt: w.updatedAt,
  })));
});

router.post("/withdrawals", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const { amount, method, accountInfo } = req.body;

  if (!amount || !method || !accountInfo) {
    res.status(400).json({ error: "amount, method, and accountInfo are required" });
    return;
  }

  const payoutAmount = parseFloat(amount);
  if (isNaN(payoutAmount) || payoutAmount < MIN_WITHDRAWAL) {
    res.status(400).json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }

  const user = users[0];
  if (parseFloat(user.balance) < payoutAmount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const newBalance = parseFloat(user.balance) - payoutAmount;
  await db.update(usersTable).set({ balance: newBalance.toFixed(2) }).where(eq(usersTable.id, userId));

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId,
    amount: payoutAmount.toFixed(2),
    method,
    accountInfo,
    status: "pending",
  }).returning();

  await db.insert(transactionsTable).values({
    userId,
    type: "withdrawal",
    amount: payoutAmount.toFixed(2),
    description: `Withdrawal via ${method}`,
    status: "pending",
    referenceId: withdrawal.id,
  });

  res.status(201).json({
    id: withdrawal.id, userId: withdrawal.userId, amount: parseFloat(withdrawal.amount),
    method: withdrawal.method, accountInfo: withdrawal.accountInfo,
    status: withdrawal.status, notes: withdrawal.notes,
    createdAt: withdrawal.createdAt, updatedAt: withdrawal.updatedAt,
  });
});

router.get("/withdrawals/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(withdrawalsTable)
    .where(sql`id = ${id} AND user_id = ${userId}`);
  if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const w = rows[0];
  res.json({
    id: w.id, userId: w.userId, amount: parseFloat(w.amount), method: w.method,
    accountInfo: w.accountInfo, status: w.status, notes: w.notes,
    createdAt: w.createdAt, updatedAt: w.updatedAt,
  });
});

export default router;
