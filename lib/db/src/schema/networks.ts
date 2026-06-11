import { pgTable, text, serial, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const networksTable = pgTable("networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  secretKey: text("secret_key"),
  // Auto-pull credentials
  pullEnabled: boolean("pull_enabled").notNull().default(false),
  apiKey: text("api_key"),
  pubId: text("pub_id"),
  appId: text("app_id"),
  pullUrl: text("pull_url"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncedOfferCount: integer("synced_offer_count").notNull().default(0),
  payoutPercent: integer("payout_percent").notNull().default(100),
  totalConversions: integer("total_conversions").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertNetworkSchema = createInsertSchema(networksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNetwork = z.infer<typeof insertNetworkSchema>;
export type Network = typeof networksTable.$inferSelect;
