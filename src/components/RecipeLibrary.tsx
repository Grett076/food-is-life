import { useState } from 'react';
import type { Recipe, Ingredient, MealHistory } from '../types';
import { RecipeCard } from './RecipeCard';
import { type SeasonFilter, matchesSeasonFilter, seasonFit } from '../lib/season';

const STYLE_FILTERS = ['quick', 'normal', 'weekend', 'weekendProject'] as const;
const SEASON_FILTERS: { key: SeasonFilter; label: string }[] = [
  { key: 'now', label: 'Nu in seizoen' },
  { key: 'spring', label: 'Lente' },
  { key: 'summer', label: 'Zomer' },
  { key: 'autumn', label: 'Herfst' },
  { key: 'winter', label: 'Winter' },
  { key: 'yearRound', label: 'Hele jaar' },
];

interface Props {
  recipes: Recipe[];
  ingredients: Ingredient[];
  history: MealHistory[];
  month: number;
  onSelect?: (recipe: Recipe) => void;
  onFavorite: (id: string) => void;
}

export function RecipeLibrary({ recipes, ingredients, history, month, onSelect, onFavorite }: Props) {
  const [search, setSearch] = useState('');
  const [styleFilters, setStyleFilters] = useState<Set<string>>(new Set());
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  function toggleStyle(s: string) {
    setStyleFilters((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  const filtered = recipes.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (styleFilters.size > 0 && !styleFilters.has(r.cookingStyle)) return false;
    if (favOnly && !r.favorite) return false;
    if (seasonFilter) {
      const fit = seasonFit(r.ingredients, ingredients, month);
      if (!matchesSeasonFilter(seasonFilter, fit, r.seasonTags, month)) return false;
    }
    return true;
  });

  const STYLE_LABEL: Record<string, string> = {
    quick: 'Snel',
    normal: 'Normaal',
    weekend: 'Weekend',
    weekendProject: 'Weekendproject',
  };

  return (
    <div>
      <div className="library-controls">
        <input
          type="search"
          placeholder="Zoeken…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className={`filter-btn ${favOnly ? 'active' : ''}`}
          onClick={() => setFavOnly((v) => !v)}
        >
          ★ Favorieten
        </button>
        {STYLE_FILTERS.map((s) => (
          <button
            key={s}
            className={`filter-btn ${styleFilters.has(s) ? 'active' : ''}`}
            onClick={() => toggleStyle(s)}
          >
            {STYLE_LABEL[s]}
          </button>
        ))}
        {SEASON_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-btn ${seasonFilter === key ? 'active' : ''}`}
            onClick={() => setSeasonFilter((v) => (v === key ? null : key))}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-muted" style={{ marginBottom: '.75rem' }}>
        {filtered.length} gerecht{filtered.length !== 1 ? 'en' : ''}
      </p>
      <div className="recipe-grid">
        {filtered.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            allIngredients={ingredients}
            history={history}
            month={month}
            onClick={onSelect ? () => onSelect(r) : undefined}
            onFavorite={() => onFavorite(r.id)}
            showHistory
          />
        ))}
      </div>
    </div>
  );
}
