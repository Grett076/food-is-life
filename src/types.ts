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

export interface RecipeIngredient {
  name: string;          // displaynaam incl. snijwijze: "ui, fijngesnipperd"
  amount?: string;       // "400g", "2 el", "1 teen", "naar smaak"
  ingredientId?: string; // koppeling aan Ingredient voor seizoensscore
  note?: string;         // "op kamertemperatuur", optioneel
}

export interface RecipeStep {
  text: string;
  durationMinutes?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings?: number;
  activePrepMinutes: number;
  totalTimeMinutes: number;
  cookingStyle: CookingStyle;
  seasonTags: SeasonTag[];
  tags: string[];
  ingredients: string[];             // ingredient ids voor seizoensscore
  recipeIngredients?: RecipeIngredient[]; // volledig met hoeveelheden
  steps?: RecipeStep[];              // bereidingsstappen
  prepTasks?: PrepTask[];
  favorite?: boolean;
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

export interface Preferences {
  excludedRecipes: string[]; // per recept: niet mijn ding
}

export interface AppState {
  recipes: Recipe[];
  ingredients: Ingredient[];
  week: PlannedDay[];
  history: MealHistory[];
}
