import type { MealHistory } from '../types';

export interface Versioned<T> {
  value: T;
  version: number;
  updatedAt: string;
}

export interface ServerState {
  documents: Record<string, Versioned<unknown>>;
  localStorageImported: boolean;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new ApiError(payload.error ?? 'De server gaf een ongeldige reactie.', response.status);
  return payload;
}

export function getState(monday: string): Promise<ServerState> {
  return request(`/api/state?week=${encodeURIComponent(monday)}`);
}

export function putDocument<T>(key: string, value: T, version: number): Promise<Versioned<T>> {
  return request(`/api/state/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value, version }),
  });
}

export function cookOnServer(input: {
  date: string;
  recipeId: string;
  ingredientIds: string[];
  stockVersion: number;
  historyVersion: number;
}): Promise<{ stock: Versioned<string[]>; history: Versioned<MealHistory[]> }> {
  return request('/api/cook', { method: 'POST', body: JSON.stringify(input) });
}

function legacyData(): Record<string, unknown> | null {
  const output: Record<string, unknown> = {};
  const keys = ['recipes', 'ingredients', 'history', 'preferences', 'stock', 'dataVersion'];
  try {
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) output[key] = JSON.parse(raw);
    }
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith('week-')) continue;
      const raw = localStorage.getItem(key);
      if (raw) output[key] = JSON.parse(raw);
    }
  } catch {
    return null;
  }
  return Object.keys(output).some((key) => key !== 'dataVersion') ? output : null;
}

export function hasLegacyData(): boolean {
  return legacyData() !== null;
}

export async function importLegacyData(): Promise<void> {
  const data = legacyData();
  if (!data) throw new Error('Geen eerdere browsergegevens gevonden.');
  await request('/api/import', { method: 'POST', body: JSON.stringify(data) });
}

export function fetchBackup(): Promise<Record<string, unknown>> {
  return request('/api/backup');
}

export function restoreBackup(data: Record<string, unknown>): Promise<void> {
  return request('/api/restore', { method: 'POST', body: JSON.stringify(data) });
}

