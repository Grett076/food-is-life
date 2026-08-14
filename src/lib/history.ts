import type { MealHistory } from '../types';

/** Hoeveel dagen geleden was het meest recente kookmoment? null = nooit. */
export function daysSinceCooked(recipeId: string, history: MealHistory[]): number | null {
  const dates = history
    .filter((h) => h.recipeId === recipeId)
    .map((h) => new Date(h.date).getTime());
  if (dates.length === 0) return null;
  const latest = Math.max(...dates);
  return Math.floor((Date.now() - latest) / 86_400_000);
}

/** Hoe vaak deze maand gegeten? */
export function timesThisMonth(recipeId: string, history: MealHistory[]): number {
  const now = new Date();
  return history.filter((h) => {
    const d = new Date(h.date);
    return h.recipeId === recipeId && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

export function totalTimesCooked(recipeId: string, history: MealHistory[]): number {
  return history.filter((h) => h.recipeId === recipeId).length;
}
