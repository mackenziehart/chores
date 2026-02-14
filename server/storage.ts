import { eq, desc, asc } from "drizzle-orm";
import { db } from "./db";
import {
  partners, chores, choreHistory, settings, rooms,
  type Partner, type InsertPartner,
  type Chore, type InsertChore,
  type ChoreHistory, type InsertChoreHistory,
  type Settings, type InsertSettings,
  type Room, type InsertRoom,
} from "@shared/schema";

export interface IStorage {
  getPartners(): Promise<Partner[]>;
  getPartner(id: string): Promise<Partner | undefined>;
  createPartner(data: InsertPartner): Promise<Partner>;
  updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined>;
  deletePartner(id: string): Promise<void>;

  getChores(): Promise<Chore[]>;
  getChore(id: string): Promise<Chore | undefined>;
  createChore(data: InsertChore): Promise<Chore>;
  updateChore(id: string, data: Partial<InsertChore>): Promise<Chore | undefined>;
  deleteChore(id: string): Promise<void>;
  toggleChore(id: string): Promise<Chore | undefined>;

  getHistory(): Promise<ChoreHistory[]>;
  addHistory(data: InsertChoreHistory): Promise<ChoreHistory>;

  getSettings(): Promise<Settings>;
  updateSettings(data: Partial<InsertSettings>): Promise<Settings>;

  getRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(data: InsertRoom): Promise<Room>;
  updateRoom(id: string, data: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPartners(): Promise<Partner[]> {
    return db.select().from(partners);
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner;
  }

  async createPartner(data: InsertPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values(data).returning();
    return partner;
  }

  async updatePartner(id: string, data: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [partner] = await db.update(partners).set(data).where(eq(partners.id, id)).returning();
    return partner;
  }

  async deletePartner(id: string): Promise<void> {
    await db.update(chores).set({ assigneeId: null }).where(eq(chores.assigneeId, id));
    await db.delete(partners).where(eq(partners.id, id));
  }

  async getChores(): Promise<Chore[]> {
    return db.select().from(chores).orderBy(desc(chores.createdAt));
  }

  async getChore(id: string): Promise<Chore | undefined> {
    const [chore] = await db.select().from(chores).where(eq(chores.id, id));
    return chore;
  }

  async createChore(data: InsertChore): Promise<Chore> {
    const [chore] = await db.insert(chores).values(data).returning();
    return chore;
  }

  async updateChore(id: string, data: Partial<InsertChore>): Promise<Chore | undefined> {
    const [chore] = await db.update(chores).set(data).where(eq(chores.id, id)).returning();
    return chore;
  }

  async deleteChore(id: string): Promise<void> {
    await db.delete(chores).where(eq(chores.id, id));
  }

  async toggleChore(id: string): Promise<Chore | undefined> {
    const chore = await this.getChore(id);
    if (!chore) return undefined;

    if (!chore.completed) {
      const [updated] = await db
        .update(chores)
        .set({ completed: true, completedAt: new Date(), completedById: chore.assigneeId })
        .where(eq(chores.id, id))
        .returning();

      await this.addHistory({
        choreTitle: chore.title,
        choreCategory: chore.category,
        completedById: chore.assigneeId,
      });

      if (chore.recurrence) {
        const nextDue = chore.dueDate ? this.getNextDueDate(new Date(chore.dueDate), chore.recurrence) : null;
        await this.createChore({
          title: chore.title,
          description: chore.description,
          assigneeId: chore.assigneeId,
          category: chore.category,
          priority: chore.priority,
          recurrence: chore.recurrence,
          roomId: chore.roomId,
          dueDate: nextDue || null,
          completed: false,
        });
      }

      return updated;
    } else {
      const [updated] = await db
        .update(chores)
        .set({ completed: false, completedAt: null, completedById: null })
        .where(eq(chores.id, id))
        .returning();
      return updated;
    }
  }

  private getNextDueDate(currentDue: Date, recurrence: string): Date {
    const next = new Date(currentDue);
    switch (recurrence) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "biweekly":
        next.setDate(next.getDate() + 14);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next;
  }

  async getHistory(): Promise<ChoreHistory[]> {
    return db.select().from(choreHistory).orderBy(desc(choreHistory.completedAt));
  }

  async addHistory(data: InsertChoreHistory): Promise<ChoreHistory> {
    const [entry] = await db.insert(choreHistory).values(data).returning();
    return entry;
  }

  async getSettings(): Promise<Settings> {
    const [existing] = await db.select().from(settings).where(eq(settings.id, "default"));
    if (existing) return existing;
    const [created] = await db.insert(settings).values({ id: "default" }).returning();
    return created;
  }

  async updateSettings(data: Partial<InsertSettings>): Promise<Settings> {
    await this.getSettings();
    const [updated] = await db
      .update(settings)
      .set(data)
      .where(eq(settings.id, "default"))
      .returning();
    return updated;
  }

  async getRooms(): Promise<Room[]> {
    return db.select().from(rooms).orderBy(asc(rooms.sortOrder), asc(rooms.name));
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(data: InsertRoom): Promise<Room> {
    const existing = await this.getRooms();
    const [room] = await db.insert(rooms).values({ ...data, sortOrder: data.sortOrder ?? existing.length }).returning();
    return room;
  }

  async updateRoom(id: string, data: Partial<InsertRoom>): Promise<Room | undefined> {
    const [room] = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    return room;
  }

  async deleteRoom(id: string): Promise<void> {
    await db.update(chores).set({ roomId: null }).where(eq(chores.roomId, id));
    await db.delete(rooms).where(eq(rooms.id, id));
  }
}

export const storage = new DatabaseStorage();
