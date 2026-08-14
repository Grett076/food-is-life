import type { Recipe, MealHistory, Ingredient, Preferences } from '../types';
import { seasonFit } from './season';
import { daysSinceCooked, timesThisMonth } from './history';

/**
 * Rangschikt recepten voor een specifieke dag.
 * Heuristiek (licht, geen ML):
 * 1. Favorieten  +2
 * 2. Seizoen fit: perfect +3, good +1
 * 3. Recent gegeten: <7 dagen -3, <14 dagen -1
 * 4. Vaker dan 2x deze maand: -2
 * 5. Lang niet gegeten (>30 dagen): +1
 */
export function rankRecipes(
  recipes: Recipe[],
  history: MealHistory[],
  allIngredients: Ingredient[],
  month: number,
  preferences?: Preferences,
  stock?: string[],
): Recipe[] {
  const excluded = new Set(preferences?.excludedRecipes ?? []);
  const inStock = new Set(stock ?? []);
  const scored = recipes.map((r) => {
    let score = 0;
    if (r.favorite) score += 2;

    const fit = seasonFit(r.ingredients, allIngredients, month);
    if (fit === 'perfect') score += 3;
    else if (fit === 'good') score += 1;

    const days = daysSinceCooked(r.id, history);
    if (days !== null) {
      if (days < 7) score -= 3;
      else if (days < 14) score -= 1;
      else if (days > 30) score += 1;
    }

    const thisMonth = timesThisMonth(r.id, history);
    if (thisMonth >= 2) score -= 2;

    // Penalty voor uitgesloten recepten
    if (excluded.has(r.id)) score -= 4;

    // Bonus als veel ingrediënten in voorraad
    if (inStock.size > 0 && r.ingredients.length > 0) {
      const ratio = r.ingredients.filter((id) => inStock.has(id)).length / r.ingredients.length;
      if (ratio >= 0.7) score += 2;
      else if (ratio >= 0.4) score += 1;
    }

    return { recipe: r, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.recipe);
}
