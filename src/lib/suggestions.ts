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
): Recipe[] {
  const disliked = new Set(preferences?.dislikedIngredients ?? []);
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

    // Zachte penalty voor vermeden ingrediënten
    const hasDisliked = r.ingredients.some((id) => disliked.has(id));
    if (hasDisliked) score -= 3;

    return { recipe: r, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.recipe);
}
