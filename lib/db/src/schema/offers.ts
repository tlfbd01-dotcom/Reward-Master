import { pgTable, text, serial, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  payout: decimal("payout", { precision: 10, scale: 2 }).notNull(),
  network: text("network").notNull(),
  networkId: integer("network_id"),
  status: text("status").notNull().default("active"),
  category: text("category").notNull().default("survey"),
  device: text("device").notNull().default("all"),
  countries: text("countries").array().notNull().default(["US"]),
  imageUrl: text("image_url"),
  offerUrl: text("offer_url"),
  completions: integer("completions").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
