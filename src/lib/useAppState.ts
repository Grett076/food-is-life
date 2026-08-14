import { useState, useEffect } from 'react';
import type { PlannedDay, MealHistory, Recipe, Ingredient, Preferences } from '../types';
import { RECIPES } from '../data/recipes';
import { INGREDIENTS } from '../data/ingredients';

const DATA_VERSION = 6; // verhoog bij wijzigingen in seed-recepten of ingrediënten

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeek(monday: Date): PlannedDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: d.toISOString().slice(0, 10), recipeId: null };
  });
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useAppState() {
  // Seed-data migratie: als versie verouderd is, reset recepten en ingrediënten
  // maar bewaar gebruikersdata (geschiedenis, planning, voorraad, voorkeuren)
  const storedVersion = load<number>('dataVersion', 0);
  if (storedVersion < DATA_VERSION) {
    localStorage.setItem('recipes', JSON.stringify(RECIPES));
    localStorage.setItem('ingredients', JSON.stringify(INGREDIENTS));
    localStorage.setItem('dataVersion', String(DATA_VERSION));
  }

  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    load('recipes', RECIPES),
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(() =>
    load('ingredients', INGREDIENTS),
  );
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [week, setWeek] = useState<PlannedDay[]>(() => {
    const monday = getMonday(new Date());
    const key = `week-${monday.toISOString().slice(0, 10)}`;
    return load(key, buildWeek(monday));
  });
  const [history, setHistory] = useState<MealHistory[]>(() =>
    load('history', []),
  );
  const [preferences, setPreferences] = useState<Preferences>(() =>
    load('preferences', { excludedRecipes: [] }),
  );
  const [stock, setStock] = useState<string[]>(() =>
    load('stock', []),
  );

  // Persist
  useEffect(() => { save('recipes', recipes); }, [recipes]);
  useEffect(() => { save('ingredients', ingredients); }, [ingredients]);
  useEffect(() => {
    const key = `week-${weekStart.toISOString().slice(0, 10)}`;
    save(key, week);
  }, [week, weekStart]);
  useEffect(() => { save('history', history); }, [history]);
  useEffect(() => { save('preferences', preferences); }, [preferences]);
  useEffect(() => { save('stock', stock); }, [stock]);

  function navigateWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    const key = `week-${next.toISOString().slice(0, 10)}`;
    setWeekStart(next);
    setWeek(load(key, buildWeek(next)));
  }

  function assignMeal(date: string, recipeId: string | null, note?: string) {
    setWeek((w) =>
      w.map((d) => (d.date === date ? { ...d, recipeId, note } : d)),
    );
    // Voeg toe aan geschiedenis als recept gekozen
    if (recipeId) {
      setHistory((h) => {
        const without = h.filter((e) => !(e.date === date && e.recipeId === recipeId));
        return [...without, { recipeId, date }];
      });
    }
  }

  function toggleFavorite(recipeId: string) {
    setRecipes((rs) =>
      rs.map((r) => (r.id === recipeId ? { ...r, favorite: !r.favorite } : r)),
    );
  }

  function addRecipe(recipe: Recipe) {
    setRecipes((rs) => [...rs, recipe]);
  }

  function updateRecipe(recipe: Recipe) {
    setRecipes((rs) => rs.map((r) => (r.id === recipe.id ? recipe : r)));
  }

  function deleteRecipe(id: string) {
    setRecipes((rs) => rs.filter((r) => r.id !== id));
  }

  function updateIngredient(ingredient: Ingredient) {
    setIngredients((is) => is.map((i) => (i.id === ingredient.id ? ingredient : i)));
  }

  function addIngredient(ingredient: Ingredient) {
    setIngredients((is) => [...is, ingredient]);
  }

  function toggleExcluded(recipeId: string) {
    setPreferences((p) => {
      const set = new Set(p.excludedRecipes ?? []);
      set.has(recipeId) ? set.delete(recipeId) : set.add(recipeId);
      return { ...p, excludedRecipes: Array.from(set) };
    });
  }

  function toggleStock(ingredientId: string) {
    setStock((s) => {
      const set = new Set(s);
      set.has(ingredientId) ? set.delete(ingredientId) : set.add(ingredientId);
      return Array.from(set);
    });
  }

  function addToStock(ingredientIds: string[]) {
    setStock((s) => Array.from(new Set([...s, ...ingredientIds])));
  }

  function cookMeal(ingredientIds: string[]) {
    setStock((s) => s.filter((id) => !ingredientIds.includes(id)));
  }

  function goToCurrentWeek() {
    const monday = getMonday(new Date());
    const key = `week-${monday.toISOString().slice(0, 10)}`;
    setWeekStart(monday);
    setWeek(load(key, buildWeek(monday)));
  }

  return {
    recipes,
    ingredients,
    week,
    weekStart,
    history,
    navigateWeek,
    assignMeal,
    toggleFavorite,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    updateIngredient,
    addIngredient,
    goToCurrentWeek,
    preferences,
    toggleExcluded,
    stock,
    toggleStock,
    addToStock,
    cookMeal,
  };
}
