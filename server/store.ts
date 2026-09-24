import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { INGREDIENTS } from '../src/data/ingredients.js';
import { RECIPES } from '../src/data/recipes.js';
import type { Ingredient, MealHistory, PlannedDay, Preferences, Recipe } from '../src/types.js';

export type StateKey = 'recipes' | 'ingredients' | 'stock' | 'preferences' | 'history' | `week/${string}`;

export interface VersionedDocument<T> {
  value: T;
  version: number;
  updatedAt: string;
}

export class VersionConflictError extends Error {
  constructor(public readonly current: VersionedDocument<unknown>) {
    super('Deze gegevens zijn intussen op een ander apparaat gewijzigd.');
  }
}

const compiledMigration = join(import.meta.dirname, 'migrations', '001_initial.sql');
const sourceMigration = join(process.cwd(), 'server', 'migrations', '001_initial.sql');
const MIGRATION_SQL = readFileSync(existsSync(compiledMigration) ? compiledMigration : sourceMigration, 'utf8');

const baseKeys = ['recipes', 'ingredients', 'stock', 'preferences', 'history'] as const;

function now(): string {
  return new Date().toISOString();
}

function defaultWeek(monday: string): PlannedDay[] {
  const start = new Date(`${monday}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      recipeId: null,
      lunch: index < 5 ? 'boterham' : null,
    };
  });
}

function isWeekKey(key: string): key is `week/${string}` {
  return /^week\/\d{4}-\d{2}-\d{2}$/.test(key);
}

export function assertStateKey(key: string): asserts key is StateKey {
  if (!baseKeys.includes(key as typeof baseKeys[number]) && !isWeekKey(key)) {
    throw new Error('Ongeldige gegevenssleutel.');
  }
}

export class HouseholdStore {
  private readonly db: DatabaseSync;

  constructor(databasePath = ':memory:') {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.db = new DatabaseSync(databasePath);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    this.migrate();
    this.seed();
  }

  private migrate(): void {
    this.db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);');
    const applied = this.db.prepare('SELECT 1 FROM schema_migrations WHERE version = 1').get();
    if (!applied) {
      this.db.exec(MIGRATION_SQL);
      this.db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)').run(now());
    }
  }

  private transaction<T>(work: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private seed(): void {
    this.ensure('recipes', RECIPES);
    this.ensure('ingredients', INGREDIENTS);
    this.ensure('stock', []);
    this.ensure('preferences', { excludedRecipes: [] });
    this.ensure('history', []);
  }

  private initialValue(key: StateKey): unknown {
    if (key === 'recipes') return RECIPES;
    if (key === 'ingredients') return INGREDIENTS;
    if (key === 'stock' || key === 'history') return [];
    if (key === 'preferences') return { excludedRecipes: [] };
    return defaultWeek(key.slice('week/'.length));
  }

  private ensure<T>(key: StateKey, fallback: T): VersionedDocument<T> {
    const existing = this.db.prepare('SELECT data, version, updated_at FROM documents WHERE key = ?').get(key) as
      | { data: string; version: number; updated_at: string }
      | undefined;
    if (!existing) {
      const updatedAt = now();
      this.db.prepare('INSERT INTO documents (key, data, version, updated_at) VALUES (?, ?, 1, ?)').run(
        key, JSON.stringify(fallback), updatedAt,
      );
      return { value: fallback, version: 1, updatedAt };
    }
    return { value: JSON.parse(existing.data) as T, version: existing.version, updatedAt: existing.updated_at };
  }

  get<T>(key: StateKey): VersionedDocument<T> {
    assertStateKey(key);
    return this.ensure(key, this.initialValue(key) as T);
  }

  getState(monday: string): Record<string, VersionedDocument<unknown>> {
    const keys: StateKey[] = [...baseKeys, `week/${monday}`];
    return Object.fromEntries(keys.map((key) => [key, this.get(key)]));
  }

  put<T>(key: StateKey, value: T, expectedVersion: number): VersionedDocument<T> {
    assertStateKey(key);
    const current = this.get<T>(key);
    if (current.version !== expectedVersion) throw new VersionConflictError(current);

    const updatedAt = now();
    const result = this.db.prepare(
      'UPDATE documents SET data = ?, version = version + 1, updated_at = ? WHERE key = ? AND version = ?',
    ).run(JSON.stringify(value), updatedAt, key, expectedVersion);
    if (result.changes !== 1) throw new VersionConflictError(this.get(key));

    return { value, version: expectedVersion + 1, updatedAt };
  }

  cook(input: {
    date: string;
    recipeId: string;
    ingredientIds: string[];
    stockVersion: number;
    historyVersion: number;
  }): { stock: VersionedDocument<string[]>; history: VersionedDocument<MealHistory[]> } {
    const stock = this.get<string[]>('stock');
    const history = this.get<MealHistory[]>('history');
    if (stock.version !== input.stockVersion) throw new VersionConflictError(stock);
    if (history.version !== input.historyVersion) throw new VersionConflictError(history);

    const nextStock = stock.value.filter((id) => !input.ingredientIds.includes(id));
    const nextHistory = [...history.value, { date: input.date, recipeId: input.recipeId }];
    return this.transaction(() => ({
      stock: this.put('stock', nextStock, stock.version),
      history: this.put('history', nextHistory, history.version),
    }));
  }

  isLocalStorageImported(): boolean {
    return this.db.prepare('SELECT 1 FROM metadata WHERE key = ?').get('localStorageImported') !== undefined;
  }

  importLegacy(data: Record<string, unknown>): void {
    if (this.isLocalStorageImported()) throw new Error('De eenmalige localStorage-import is al uitgevoerd.');
    this.transaction(() => {
      this.replaceFromBackup(data, true);
      this.db.prepare('INSERT INTO metadata (key, value) VALUES (?, ?)').run('localStorageImported', now());
    });
  }

  backup(): Record<string, unknown> {
    const output: Record<string, unknown> = { exportedAt: now(), dataVersion: 13 };
    for (const key of baseKeys) output[key] = this.get(key).value;
    const weeks = this.db.prepare("SELECT key, data FROM documents WHERE key LIKE 'week/%'").all() as { key: string; data: string }[];
    for (const week of weeks) output[`week-${week.key.slice('week/'.length)}`] = JSON.parse(week.data);
    return output;
  }

  restore(data: Record<string, unknown>): void {
    this.replaceFromBackup(data);
  }

  private replaceFromBackup(data: Record<string, unknown>, withinTransaction = false): void {
    const entries: Array<[StateKey, unknown]> = [];
    for (const key of baseKeys) if (key in data) entries.push([key, data[key]]);
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('week-') && /^week-\d{4}-\d{2}-\d{2}$/.test(key)) {
        entries.push([`week/${key.slice('week-'.length)}`, value]);
      }
    }
    if (entries.length === 0) throw new Error('De back-up bevat geen herkenbare Food is Life-gegevens.');

    const replace = () => {
      for (const [key, value] of entries) {
        const current = this.get(key);
        const updatedAt = now();
        this.db.prepare(
          'UPDATE documents SET data = ?, version = ?, updated_at = ? WHERE key = ?',
        ).run(JSON.stringify(value), current.version + 1, updatedAt, key);
      }
    };
    if (withinTransaction) replace();
    else this.transaction(replace);
  }

  close(): void {
    this.db.close();
  }
}

export type { Ingredient, MealHistory, Preferences, Recipe };

