import { pgTable, text, serial, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wallsTable = pgTable("walls", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  urlTemplate: text("url_template").notNull(),
  placementId: text("placement_id").notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull().default("4.0"),
  description: text("description").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  totalConversions: integer("total_conversions").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWallSchema = createInsertSchema(wallsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWall = z.infer<typeof insertWallSchema>;
export type Wall = typeof wallsTable.$inferSelect;
