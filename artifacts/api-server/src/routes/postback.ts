import { Router, type IRouter } from "express";
import { db, usersTable, conversionsTable, transactionsTable, offersTable, networksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { computeRank } from "../lib/auth";

const router: IRouter = Router();

router.get("/postback", async (req, res): Promise<void> => {
  const { network, subid, amount, status, txid, offer_id, offer_name } = req.query as Record<string, string>;

  if (!network) { res.status(400).json({ error: "network is required" }); return; }

  const convStatus = (status === "approved" || status === "1" || status === "2" || !status) ? "approved" : "rejected";
  if (convStatus !== "approved") {
    res.send("OK");
    return;
  }

  if (!subid || !amount || !txid) { res.status(400).json({ error: "subid, amount, and txid are required" }); return; }

  const userId = parseInt(subid, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid subid" }); return; }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users.length === 0) { res.status(404).json({ error: "User not found" }); return; }

  // Duplicate protection
  const existing = await db.select().from(conversionsTable).where(eq(conversionsTable.txid, txid));
  if (existing.length > 0) { res.send("OK"); return; }

  const payoutAmount = parseFloat(amount);
  if (isNaN(payoutAmount) || payoutAmount <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }

  const ip = req.ip ?? req.socket.remoteAddress ?? null;

  let offerId: number | null = null;
  let resolvedOfferName = offer_name ?? "Unknown Offer";

  if (offer_id) {
    const oid = parseInt(offer_id, 10);
    if (!isNaN(oid)) {
      const offers = await db.select().from(offersTable).where(eq(offersTable.id, oid));
      if (offers.length > 0) {
        offerId = oid;
        resolvedOfferName = offers[0].name;
        await db.update(offersTable).set({ completions: sql`completions + 1` }).where(eq(offersTable.id, oid));
      }
    }
  }

  await db.insert(conversionsTable).values({
    userId,
    offerId,
    offerName: resolvedOfferName,
    network,
    amount: payoutAmount.toFixed(2),
    status: "approved",
    txid,
    ip,
  });

  const user = users[0];
  const newBalance = parseFloat(user.balance) + payoutAmount;
  const newTotalEarned = parseFloat(user.totalEarned) + payoutAmount;
  const newPoints = user.points + Math.floor(payoutAmount * 100);
  const newRank = computeRank(newTotalEarned);

  await db.update(usersTable).set({
    balance: newBalance.toFixed(2),
    totalEarned: newTotalEarned.toFixed(2),
    points: newPoints,
    rank: newRank,
  }).where(eq(usersTable.id, userId));

  await db.insert(transactionsTable).values({
    userId,
    type: "credit",
    amount: payoutAmount.toFixed(2),
    description: `Offer completion: ${resolvedOfferName} (${network})`,
    status: "completed",
  });

  // Update network stats
  const networks = await db.select().from(networksTable).where(eq(networksTable.slug, network));
  if (networks.length > 0) {
    await db.update(networksTable).set({
      totalConversions: sql`total_conversions + 1`,
      totalRevenue: sql`total_revenue + ${payoutAmount}`,
    }).where(eq(networksTable.slug, network));
  }

  res.send("OK");
});

export default router;
