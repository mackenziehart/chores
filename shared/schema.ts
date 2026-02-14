import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  avatarColor: text("avatar_color").notNull().default("#e57373"),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true });
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export const chores = pgTable("chores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assigneeId: varchar("assignee_id").references(() => partners.id),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  completedById: varchar("completed_by_id").references(() => partners.id),
  dueDate: timestamp("due_date"),
  recurrence: text("recurrence"),
  category: text("category").notNull().default("general"),
  priority: text("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
  completedAt: true,
  completedById: true,
  createdAt: true,
});
export type InsertChore = z.infer<typeof insertChoreSchema>;
export type Chore = typeof chores.$inferSelect;

export const choreHistory = pgTable("chore_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  choreTitle: text("chore_title").notNull(),
  choreCategory: text("chore_category").notNull().default("general"),
  completedById: varchar("completed_by_id").references(() => partners.id),
  completedAt: timestamp("completed_at").notNull().default(sql`now()`),
});

export const insertChoreHistorySchema = createInsertSchema(choreHistory).omit({ id: true });
export type InsertChoreHistory = z.infer<typeof insertChoreHistorySchema>;
export type ChoreHistory = typeof choreHistory.$inferSelect;

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`'default'`),
  primaryHue: integer("primary_hue").notNull().default(345),
  accentHue: integer("accent_hue").notNull().default(24),
  darkMode: boolean("dark_mode").notNull().default(false),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export const CATEGORIES = [
  "general",
  "cleaning",
  "cooking",
  "shopping",
  "laundry",
  "outdoor",
  "pets",
  "errands",
] as const;

export const PRIORITIES = ["low", "medium", "high"] as const;
export const RECURRENCES = ["daily", "weekly", "biweekly", "monthly"] as const;
