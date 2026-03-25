import type { Partner } from "@shared/schema";

const STORAGE_KEY = "partner-chore-share-partners";

export function loadPartnersFromLocalStorage(): Partner[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as Partner[];
  } catch {
    return null;
  }
}

export function savePartnersToLocalStorage(partners: Partner[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(partners));
}

export async function fetchPartners(): Promise<Partner[]> {
  try {
    const res = await fetch("/api/partners", { credentials: "include" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Partner[];
    savePartnersToLocalStorage(data);
    return data;
  } catch {
    return loadPartnersFromLocalStorage() ?? [];
  }
}
