import { db } from "./db";
import { partners, chores, settings } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seed() {
  const existingPartners = await db.select().from(partners);
  if (existingPartners.length > 0) return;

  const [partner1] = await db.insert(partners).values({
    name: "Alex",
    email: "",
    avatarColor: "#7986cb",
  }).returning();

  const [partner2] = await db.insert(partners).values({
    name: "Jordan",
    email: "",
    avatarColor: "#f06292",
  }).returning();

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  await db.insert(chores).values([
    {
      title: "Vacuum the living room",
      description: "Don't forget under the couch and around the coffee table",
      assigneeId: partner1.id,
      category: "cleaning",
      priority: "medium",
      dueDate: tomorrow,
      recurrence: "weekly",
      completed: false,
    },
    {
      title: "Grocery shopping",
      description: "Milk, eggs, bread, fruits, and veggies for the week",
      assigneeId: partner2.id,
      category: "shopping",
      priority: "high",
      dueDate: dayAfter,
      completed: false,
    },
    {
      title: "Cook dinner",
      description: "Try the new pasta recipe we found",
      assigneeId: partner1.id,
      category: "cooking",
      priority: "medium",
      dueDate: now,
      recurrence: "daily",
      completed: false,
    },
    {
      title: "Walk the dog",
      description: "Morning and evening, 20 minutes each",
      assigneeId: partner2.id,
      category: "pets",
      priority: "high",
      dueDate: now,
      recurrence: "daily",
      completed: false,
    },
    {
      title: "Do the laundry",
      description: "Whites and colors separately",
      assigneeId: partner1.id,
      category: "laundry",
      priority: "medium",
      dueDate: nextWeek,
      recurrence: "weekly",
      completed: false,
    },
    {
      title: "Water the garden",
      description: "Focus on the tomatoes and herbs",
      assigneeId: partner2.id,
      category: "outdoor",
      priority: "low",
      dueDate: dayAfter,
      recurrence: "biweekly",
      completed: false,
    },
    {
      title: "Clean the bathroom",
      description: "Scrub the tub, clean the mirror, mop the floor",
      category: "cleaning",
      priority: "medium",
      dueDate: nextWeek,
      recurrence: "weekly",
      completed: false,
    },
    {
      title: "Pick up dry cleaning",
      description: "The suits should be ready by Thursday",
      assigneeId: partner1.id,
      category: "errands",
      priority: "low",
      dueDate: yesterday,
      completed: false,
    },
  ]);

  await db.insert(settings).values({ id: "default" }).onConflictDoNothing();

  console.log("Seed data inserted successfully");
}
