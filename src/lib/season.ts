import type { Ingredient, SeasonFit } from '../types';

/** Geeft true als maand `m` binnen het seizoensbereik valt (ook over de jaargrens) */
export function inSeason(ingredient: Ingredient, month: number): boolean {
  const { seasonStartMonth: start, seasonEndMonth: end } = ingredient;
  if (!start || !end) return true; // geen seizoensdata = het hele jaar
  if (start <= end) return month >= start && month <= end;
  // over de jaargrens: bijv. nov (11) t/m feb (2)
  return month >= start || month <= end;
}

export function inPeak(ingredient: Ingredient, month: number): boolean {
  return ingredient.peakMonths?.includes(month) ?? false;
}

/**
 * Berekent een menselijk seizoenslabel voor een recept.
 * Kijkt naar de ingrediënten die seizoensgebonden zijn.
 */
export function seasonFit(
  ingredientIds: string[],
  allIngredients: Ingredient[],
  month: number,
): SeasonFit {
  const seasonal = allIngredients.filter(
    (i) => ingredientIds.includes(i.id) && (i.seasonStartMonth != null),
  );
  if (seasonal.length === 0) return 'yearRound';

  let peak = 0;
  let inSeas = 0;
  for (const ing of seasonal) {
    if (inPeak(ing, month)) peak++;
    else if (inSeason(ing, month)) inSeas++;
  }

  const total = seasonal.length;
  const score = (peak * 2 + inSeas) / (total * 2); // 0–1

  if (peak > 0 && score >= 0.7) return 'perfect';
  if (score >= 0.4) return 'good';
  if (total === 0) return 'yearRound';
  return 'low';
}

export const SEASON_FIT_LABEL: Record<SeasonFit, string> = {
  perfect: 'Perfect voor nu',
  good: 'Goed voor dit seizoen',
  yearRound: 'Het hele jaar',
  low: 'Minder seizoensgebonden',
};

/** Maand → seizoen als string-label */
export function currentSeasonLabel(month: number): string {
  if (month >= 3 && month <= 5) return 'Lente';
  if (month >= 6 && month <= 8) return 'Zomer';
  if (month >= 9 && month <= 11) return 'Herfst';
  return 'Winter';
}

export type SeasonFilter = 'now' | 'spring' | 'summer' | 'autumn' | 'winter' | 'yearRound';

/** Geeft true als een recept qua seizoen matcht met het gekozen filter */
export function matchesSeasonFilter(
  filter: SeasonFilter,
  seasonFitResult: SeasonFit,
  recipeSeason: string[],
  _month: number,
): boolean {
  if (filter === 'now') return seasonFitResult === 'perfect' || seasonFitResult === 'good';
  if (filter === 'yearRound') return recipeSeason.includes('yearRound');
  const map: Record<string, string> = { spring: 'spring', summer: 'summer', autumn: 'autumn', winter: 'winter' };
  return recipeSeason.includes(map[filter] ?? filter);
}

