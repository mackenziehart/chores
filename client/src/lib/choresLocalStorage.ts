import type { Chore, ChoreHistory } from "@shared/schema";

const CHORES_KEY = "partner-chore-share-chores";
const HISTORY_KEY = "partner-chore-share-chore-history";

function sortChoresDesc(chores: Chore[]): Chore[] {
  return [...chores].sort((a, b) => {
    const ta = new Date(a.createdAt as string | Date).getTime();
    const tb = new Date(b.createdAt as string | Date).getTime();
    return tb - ta;
  });
}

function sortHistoryDesc(history: ChoreHistory[]): ChoreHistory[] {
  return [...history].sort(
    (a, b) =>
      new Date(b.completedAt as string | Date).getTime() -
      new Date(a.completedAt as string | Date).getTime(),
  );
}

function getNextDueDate(currentDue: Date, recurrence: string): Date {
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
    default:
      break;
  }
  return next;
}

export function loadChoresFromLocalStorage(): Chore[] | null {
  try {
    const raw = localStorage.getItem(CHORES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as Chore[];
  } catch {
    return null;
  }
}

export function saveChoresToLocalStorage(chores: Chore[]): void {
  localStorage.setItem(CHORES_KEY, JSON.stringify(chores));
}

export function loadHistoryFromLocalStorage(): ChoreHistory[] | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as ChoreHistory[];
  } catch {
    return null;
  }
}

export function saveHistoryToLocalStorage(history: ChoreHistory[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function fetchChores(): Promise<Chore[]> {
  try {
    const res = await fetch("/api/chores", { credentials: "include" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Chore[];
    saveChoresToLocalStorage(data);
    return data;
  } catch {
    return loadChoresFromLocalStorage() ?? [];
  }
}

export async function fetchChoreHistory(): Promise<ChoreHistory[]> {
  try {
    const res = await fetch("/api/history", { credentials: "include" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as ChoreHistory[];
    saveHistoryToLocalStorage(data);
    return data;
  } catch {
    return loadHistoryFromLocalStorage() ?? [];
  }
}

export function appendChore(chores: Chore[], chore: Chore): Chore[] {
  return sortChoresDesc([...chores, chore]);
}

export function replaceChore(chores: Chore[], id: string, chore: Chore): Chore[] {
  return sortChoresDesc(chores.map((c) => (c.id === id ? chore : c)));
}

export function removeChore(chores: Chore[], id: string): Chore[] {
  return chores.filter((c) => c.id !== id);
}

/** Matches server toggle: complete → history; optional recurring copy; reopen clears completion. */
export function toggleChoreLocal(
  chores: Chore[],
  history: ChoreHistory[],
  choreId: string,
): { chores: Chore[]; history: ChoreHistory[] } {
  const chore = chores.find((c) => c.id === choreId);
  if (!chore) return { chores: sortChoresDesc(chores), history: sortHistoryDesc(history) };

  if (!chore.completed) {
    const completedAt = new Date().toISOString();
    const updated: Chore = {
      ...chore,
      completed: true,
      completedAt,
      completedById: chore.assigneeId ?? null,
    };
    const entry: ChoreHistory = {
      id: crypto.randomUUID(),
      choreTitle: chore.title,
      choreCategory: chore.category,
      completedById: chore.assigneeId ?? null,
      completedAt,
    };
    let nextChores = chores.map((c) => (c.id === choreId ? updated : c));
    if (chore.recurrence) {
      const nextDue =
        chore.dueDate != null
          ? getNextDueDate(new Date(chore.dueDate as string | Date), chore.recurrence)
          : null;
      const recurring: Chore = {
        id: crypto.randomUUID(),
        title: chore.title,
        description: chore.description ?? null,
        assigneeId: chore.assigneeId ?? null,
        completed: false,
        completedAt: null,
        completedById: null,
        dueDate: nextDue ? nextDue.toISOString() : null,
        recurrence: chore.recurrence,
        category: chore.category,
        priority: chore.priority,
        roomId: chore.roomId ?? null,
        createdAt: new Date().toISOString(),
      };
      nextChores = [recurring, ...nextChores];
    }
    const nextHistory = [entry, ...history];
    return {
      chores: sortChoresDesc(nextChores),
      history: sortHistoryDesc(nextHistory),
    };
  }

  const reopened: Chore = {
    ...chore,
    completed: false,
    completedAt: null,
    completedById: null,
  };
  return {
    chores: sortChoresDesc(chores.map((c) => (c.id === choreId ? reopened : c))),
    history: sortHistoryDesc(history),
  };
}

export function createChoreRecord(input: {
  title: string;
  description?: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  recurrence: string | null;
  category: string;
  priority: string;
  roomId: string | null;
}): Chore {
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() || null,
    assigneeId: input.assigneeId,
    completed: false,
    completedAt: null,
    completedById: null,
    dueDate: input.dueDate,
    recurrence: input.recurrence,
    category: input.category,
    priority: input.priority,
    roomId: input.roomId,
    createdAt: new Date().toISOString(),
  };
}

export function mergeChoreUpdate(
  existing: Chore,
  input: {
    title: string;
    description?: string | null;
    assigneeId: string | null;
    dueDate: string | null;
    recurrence: string | null;
    category: string;
    priority: string;
    roomId: string | null;
    completed: boolean;
  },
): Chore {
  return {
    ...existing,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    recurrence: input.recurrence,
    category: input.category,
    priority: input.priority,
    roomId: input.roomId,
    completed: input.completed,
    completedAt: input.completed ? existing.completedAt : null,
    completedById: input.completed ? existing.completedById : null,
  };
}
