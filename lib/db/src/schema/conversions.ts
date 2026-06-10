import { pgTable, text, serial, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversionsTable = pgTable("conversions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  offerId: integer("offer_id"),
  offerName: text("offer_name").notNull(),
  network: text("network").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("approved"),
  txid: text("txid").notNull().unique(),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConversionSchema = createInsertSchema(conversionsTable).omit({ id: true, createdAt: true });
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversionsTable.$inferSelect;
