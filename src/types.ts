export type CookingStyle = 'quick' | 'normal' | 'weekend' | 'weekendProject';

export type SeasonTag = 'spring' | 'summer' | 'autumn' | 'winter' | 'yearRound';

export type SeasonFit = 'perfect' | 'good' | 'yearRound' | 'low';

export interface PrepTask {
  title: string;
  relativeTime: string; // bijv. "Vrijdagavond", "1 dag van tevoren"
  durationMinutes?: number;
  note?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  seasonStartMonth?: number; // 1–12
  seasonEndMonth?: number;
  peakMonths?: number[];
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  activePrepMinutes: number;
  totalTimeMinutes: number;
  cookingStyle: CookingStyle;
  seasonTags: SeasonTag[];
  tags: string[];
  ingredients: string[]; // ingredient ids
  prepTasks?: PrepTask[];
  favorite?: boolean;
  image?: string;
}

export interface PlannedDay {
  date: string; // 'YYYY-MM-DD'
  recipeId: string | null;
  note?: string; // voor boterham, restjes, etc.
}

export interface MealHistory {
  recipeId: string;
  date: string; // 'YYYY-MM-DD'
}

export interface AppState {
  recipes: Recipe[];
  ingredients: Ingredient[];
  week: PlannedDay[];
  history: MealHistory[];
}
