import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ingredient, MealHistory, PlannedDay, Preferences, Recipe } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import { cookOnServer, getState, hasLegacyData, importLegacyData, putDocument, type Versioned } from './centralApi';

function localDateStr(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function getMonday(date: Date): Date {
  const monday = new Date(date);
  monday.setDate(monday.getDate() + (monday.getDay() === 0 ? -6 : 1 - monday.getDay()));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function buildWeek(monday: Date): PlannedDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { date: localDateStr(date), recipeId: null, lunch: index < 5 ? 'boterham' : null };
  });
}

export function useAppState() {
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INGREDIENTS);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [week, setWeek] = useState<PlannedDay[]>(() => buildWeek(getMonday(new Date())));
  const [history, setHistory] = useState<MealHistory[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({ excludedRecipes: [] });
  const [stock, setStock] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverImported, setServerImported] = useState(false);
  const versions = useRef<Record<string, number>>({});

  const loadState = useCallback(async (monday: Date) => {
    const mondayKey = localDateStr(monday);
    try {
      const response = await getState(mondayKey);
      const document = <T,>(key: string) => response.documents[key] as Versioned<T>;
      setRecipes(document<Recipe[]>('recipes').value);
      setIngredients(document<Ingredient[]>('ingredients').value);
      setStock(document<string[]>('stock').value);
      setHistory(document<MealHistory[]>('history').value);
      setPreferences(document<Preferences>('preferences').value);
      setWeek(document<PlannedDay[]>(`week/${mondayKey}`).value);
      for (const [key, value] of Object.entries(response.documents)) versions.current[key] = value.version;
      setServerImported(response.localStorageImported);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Geen verbinding met de centrale opslag.');
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { void loadState(weekStart); }, [loadState, weekStart]);

  async function persist<T>(key: string, value: T) {
    const version = versions.current[key];
    if (!version) return setError('De centrale opslag is nog niet geladen.');
    try {
      const updated = await putDocument(key, value, version);
      versions.current[key] = updated.version;
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Opslaan is mislukt.');
      await loadState(weekStart);
    }
  }

  function navigateWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  }
  function assignMeal(date: string, recipeId: string | null, note?: string) {
    setWeek((current) => {
      const next = current.map((day) => day.date === date ? { ...day, recipeId, note } : day);
      void persist(`week/${localDateStr(weekStart)}`, next);
      return next;
    });
  }
  function setLunch(date: string, lunch: 'boterham' | 'skip' | null) {
    setWeek((current) => {
      const next = current.map((day) => day.date === date ? { ...day, lunch } : day);
      void persist(`week/${localDateStr(weekStart)}`, next);
      return next;
    });
  }
  function recipesChange(change: (current: Recipe[]) => Recipe[]) {
    setRecipes((current) => { const next = change(current); void persist('recipes', next); return next; });
  }
  function ingredientsChange(change: (current: Ingredient[]) => Ingredient[]) {
    setIngredients((current) => { const next = change(current); void persist('ingredients', next); return next; });
  }
  function stockChange(change: (current: string[]) => string[]) {
    setStock((current) => { const next = change(current); void persist('stock', next); return next; });
  }

  function toggleFavorite(recipeId: string) { recipesChange((current) => current.map((recipe) => recipe.id === recipeId ? { ...recipe, favorite: !recipe.favorite } : recipe)); }
  function addRecipe(recipe: Recipe) { recipesChange((current) => [...current, recipe]); }
  function updateRecipe(recipe: Recipe) { recipesChange((current) => current.map((item) => item.id === recipe.id ? recipe : item)); }
  function deleteRecipe(id: string) { recipesChange((current) => current.filter((recipe) => recipe.id !== id)); }
  function updateIngredient(ingredient: Ingredient) { ingredientsChange((current) => current.map((item) => item.id === ingredient.id ? ingredient : item)); }
  function addIngredient(ingredient: Ingredient) { ingredientsChange((current) => [...current, ingredient]); }
  function toggleExcluded(recipeId: string) {
    setPreferences((current) => {
      const ids = new Set(current.excludedRecipes);
      ids.has(recipeId) ? ids.delete(recipeId) : ids.add(recipeId);
      const next = { ...current, excludedRecipes: [...ids] };
      void persist('preferences', next);
      return next;
    });
  }
  function toggleStock(ingredientId: string) {
    stockChange((current) => {
      const ids = new Set(current);
      ids.has(ingredientId) ? ids.delete(ingredientId) : ids.add(ingredientId);
      return [...ids];
    });
  }
  function addToStock(ingredientIds: string[]) { stockChange((current) => [...new Set([...current, ...ingredientIds])]); }
  function uncookMeal(date: string, recipeId: string) {
    setHistory((current) => {
      const next = current.filter((entry) => !(entry.date === date && entry.recipeId === recipeId));
      void persist('history', next);
      return next;
    });
  }
  function cookMeal(date: string, recipeId: string, ingredientIds: string[]) {
    const nextStock = stock.filter((id) => !ingredientIds.includes(id));
    const nextHistory = [...history, { date, recipeId }];
    setStock(nextStock);
    setHistory(nextHistory);
    void (async () => {
      try {
        const result = await cookOnServer({ date, recipeId, ingredientIds, stockVersion: versions.current.stock, historyVersion: versions.current.history });
        versions.current.stock = result.stock.version;
        versions.current.history = result.history.version;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Kookactie is mislukt.');
        await loadState(weekStart);
      }
    })();
  }
  async function importOldBrowserData() { await importLegacyData(); await loadState(weekStart); }
  function goToCurrentWeek() { setWeekStart(getMonday(new Date())); }

  return {
    recipes, ingredients, week, weekStart, history, preferences, stock, ready, error, serverImported,
    hasLegacyData: hasLegacyData(), navigateWeek, assignMeal, toggleFavorite, addRecipe, updateRecipe, deleteRecipe,
    updateIngredient, addIngredient, goToCurrentWeek, toggleExcluded, toggleStock, addToStock, cookMeal, uncookMeal,
    setLunch, importOldBrowserData, refresh: () => loadState(weekStart),
  };
}


