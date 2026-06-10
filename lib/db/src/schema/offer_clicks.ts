import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const offerClicksTable = pgTable("offer_clicks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  offerId: integer("offer_id").notNull(),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOfferClickSchema = createInsertSchema(offerClicksTable).omit({ id: true, createdAt: true });
export type InsertOfferClick = z.infer<typeof insertOfferClickSchema>;
export type OfferClick = typeof offerClicksTable.$inferSelect;
