import type { Dream, WeeklyCacheEntry, WeeklyReportData } from '../types';
import { apiSaveDream, apiDeleteDream, isApiConfigured } from './api';
import { getIdToken } from './auth';

const KEY = 'dream-journal-v1';
const WEEKLY_KEY_PREFIX = 'dream-weekly-';

export function clearLocalDreams(): void {
  localStorage.removeItem(KEY);
  // Weekly report caches are preserved across logout and invalidated per-week via saveDream
}

export function getCachedWeeklyReport(weekStart: string): WeeklyCacheEntry | null {
  try {
    const raw = localStorage.getItem(`${WEEKLY_KEY_PREFIX}${weekStart}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate old format (direct WeeklyReportData without wrapper)
    if (parsed.weekStart && !parsed.reportData) {
      return {
        weekId: weekStart,
        generated: true,
        generatedAt: parsed.generatedAt || new Date().toISOString(),
        reportData: parsed as WeeklyReportData,
      };
    }
    return parsed as WeeklyCacheEntry;
  } catch {
    return null;
  }
}

export function setCachedWeeklyReport(weekStart: string, entry: WeeklyCacheEntry): void {
  localStorage.setItem(`${WEEKLY_KEY_PREFIX}${weekStart}`, JSON.stringify(entry));
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

function getWeekStartForDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function saveDream(dream: Dream): Promise<{ synced: boolean }> {
  if (!dream.content?.trim()) return { synced: false };
  localSave(dream);
  // Invalidate weekly report cache so next view re-fetches with updated dream count
  localStorage.removeItem(`${WEEKLY_KEY_PREFIX}${getWeekStartForDate(dream.date)}`);
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
  const merged = [...cloudDreams, ...localOnly].filter(d => d.content?.trim());
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
