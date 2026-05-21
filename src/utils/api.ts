import type { Dream, DreamAnalysis, WeeklyReportData } from '../types';
import { getIdToken } from './auth';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function isApiConfigured(): boolean {
  return !!import.meta.env.VITE_API_URL;
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `API ${res.status}`);
    }
    throw new Error(`API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiListDreams(): Promise<Dream[]> {
  return req<Dream[]>('/dreams');
}

export async function apiSaveDream(dream: Dream): Promise<void> {
  await req('/dreams', { method: 'POST', body: JSON.stringify(dream) });
}

export async function apiDeleteDream(id: string): Promise<void> {
  await req(`/dreams/${id}`, { method: 'DELETE' });
}

export async function apiAnalyzeDream(
  form: object
): Promise<{ analysis: DreamAnalysis; title: string }> {
  const result = await req<{
    success: boolean;
    analysis: DreamAnalysis;
    title: string;
    error?: string;
  }>('/analyze', { method: 'POST', body: JSON.stringify(form) });
  if (!result.success) throw new Error(result.error || '分析失敗');
  return { analysis: result.analysis, title: result.title || '' };
}

export async function apiGenerateTitle(
  content: string,
  mood: string,
  dreamType: string
): Promise<string> {
  const result = await req<{ success: boolean; title: string; error?: string }>(
    '/generate-title',
    { method: 'POST', body: JSON.stringify({ content, mood, dreamType }) }
  );
  if (!result.success) throw new Error(result.error || '標題生成失敗');
  return result.title;
}

export async function apiGetWeeklyReport(weekStart: string): Promise<WeeklyReportData> {
  return req<WeeklyReportData>(`/weekly-report?weekStart=${weekStart}`);
}
