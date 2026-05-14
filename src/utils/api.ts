import type { Dream } from '../types';
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
  if (!res.ok) throw new Error(`API ${res.status}`);
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
