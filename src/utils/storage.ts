import type { Dream } from '../types';
import { apiSaveDream, apiDeleteDream, isApiConfigured } from './api';
import { getIdToken } from './auth';

const KEY = 'dream-journal-v1';
const WEEKLY_KEY_PREFIX = 'dream-weekly-';

export function clearLocalDreams(): void {
  localStorage.removeItem(KEY);
  // Also clear cached weekly reports
  Object.keys(localStorage)
    .filter(k => k.startsWith(WEEKLY_KEY_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

export function getCachedWeeklyReport(weekStart: string): object | null {
  try {
    const raw = localStorage.getItem(`${WEEKLY_KEY_PREFIX}${weekStart}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedWeeklyReport(weekStart: string, data: object): void {
  localStorage.setItem(`${WEEKLY_KEY_PREFIX}${weekStart}`, JSON.stringify(data));
}

// ── Local storage (always available) ─────────────────────────────────────────

function localGetAll(): Dream[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function localSave(dream: Dream): void {
  const all = localGetAll().filter(d => d.id !== dream.id);
  localStorage.setItem(KEY, JSON.stringify([dream, ...all]));
}

function localDelete(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(localGetAll().filter(d => d.id !== id)));
}

// ── Hybrid: local + cloud ─────────────────────────────────────────────────────

async function isCloudAvailable(): Promise<boolean> {
  if (!isApiConfigured()) return false;
  const token = await getIdToken();
  return !!token;
}

export function getDream(id: string): Dream | undefined {
  return localGetAll().find(d => d.id === id);
}

export function getDreams(): Dream[] {
  return localGetAll();
}

export async function saveDream(dream: Dream): Promise<{ synced: boolean }> {
  localSave(dream);
  if (await isCloudAvailable()) {
    try {
      await apiSaveDream(dream);
      return { synced: true };
    } catch (err) {
      console.warn('Cloud sync failed:', err);
      return { synced: false };
    }
  }
  return { synced: false };
}

export async function deleteDream(id: string): Promise<void> {
  localDelete(id);
  if (await isCloudAvailable()) {
    apiDeleteDream(id).catch(err => console.warn('Cloud sync failed:', err));
  }
}

// Pull all dreams from DynamoDB and merge into localStorage
export async function syncFromCloud(): Promise<Dream[]> {
  const { apiListDreams } = await import('./api');
  const cloudDreams = await apiListDreams();
  // Merge: cloud is source of truth, keep any local-only entries
  const local = localGetAll();
  const cloudIds = new Set(cloudDreams.map(d => d.id));
  const localOnly = local.filter(d => !cloudIds.has(d.id));
  const merged = [...cloudDreams, ...localOnly];
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
