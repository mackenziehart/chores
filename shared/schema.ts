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

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("home"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

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
  roomId: varchar("room_id"),
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

export const remindersSent = pgTable("reminders_sent", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  choreId: varchar("chore_id").notNull(),
  sentAt: timestamp("sent_at").notNull().default(sql`now()`),
  sentDate: text("sent_date").notNull(),
});

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

export const DEFAULT_ROOMS = [
  { name: "Living Room", icon: "sofa" },
  { name: "Kitchen", icon: "cooking-pot" },
  { name: "Bathroom", icon: "bath" },
  { name: "Master Bedroom", icon: "bed-double" },
  { name: "Guest Bedroom", icon: "bed-single" },
  { name: "Garage", icon: "warehouse" },
  { name: "Yard", icon: "trees" },
] as const;

export const ROOM_ICONS = [
  "home", "sofa", "cooking-pot", "bath", "bed-double", "bed-single",
  "warehouse", "trees", "washing-machine", "tv", "lamp", "door-open",
  "utensils", "shirt", "baby", "briefcase", "car", "dog",
] as const;
