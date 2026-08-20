import { useState } from 'react';
import type { Recipe, Ingredient, MealHistory, Preferences } from '../types';
import { RecipeCard } from './RecipeCard';
import { RecipeForm } from './RecipeForm';
import { RecipeDetail } from './RecipeDetail';
import { type SeasonFilter, matchesSeasonFilter, seasonFit } from '../lib/season';

const STYLE_FILTERS = [
  { key: 'quick', label: 'Snel' },
  { key: 'normal', label: 'Normaal' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'weekendProject', label: 'Weekendproject' },
] as const;

const SEASON_FILTERS: { key: SeasonFilter; label: string }[] = [
  { key: 'now', label: '🌱 Nu in seizoen' },
  { key: 'spring', label: 'Lente' },
  { key: 'summer', label: 'Zomer' },
  { key: 'autumn', label: 'Herfst' },
  { key: 'winter', label: 'Winter' },
  { key: 'yearRound', label: 'Heel jaar' },
];

interface Props {
  recipes: Recipe[];
  ingredients: Ingredient[];
  history: MealHistory[];
  month: number;
  onFavorite: (id: string) => void;
  onAdd: (recipe: Recipe) => void;
  preferences: Preferences;
  onUpdate: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleExcluded: (id: string) => void;
}

export function RecipeLibrary({ recipes, ingredients, history, month, onFavorite, onAdd, onUpdate, onDelete, onToggleExcluded, preferences }: Props) {
  const [search, setSearch] = useState('');
  const [styleFilters, setStyleFilters] = useState<Set<string>>(new Set());
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);

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

  function handleSave(recipe: Recipe) {
    if (editingRecipe) {
      onUpdate(recipe);
    } else {
      onAdd(recipe);
    }
    setShowForm(false);
    setEditingRecipe(null);
  }

  function handleDelete(id: string) {
    if (confirm('Recept verwijderen?')) onDelete(id);
  }

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
        {STYLE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-btn ${styleFilters.has(key) ? 'active' : ''}`}
            onClick={() => toggleStyle(key)}
          >
            {label}
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
        <button
          onClick={() => { setEditingRecipe(null); setShowForm(true); }}
          style={{ marginLeft: 'auto', padding: '.4rem .9rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '.88rem', display: 'inline-flex', alignItems: 'center', gap: '.35rem', whiteSpace: 'nowrap' }}
        >
          <i className="fi fi-rr-plus" /> Recept
        </button>
      </div>

      <p className="text-muted" style={{ marginBottom: '.75rem' }}>
        {filtered.length} van {recipes.length} gerechten
      </p>

      <div className="recipe-grid">
        {filtered.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            allIngredients={ingredients}
            history={history}
            month={month}
            isExcluded={(preferences.excludedRecipes ?? []).includes(r.id)}
            onClick={() => setDetailRecipe(r)}
            onFavorite={() => onFavorite(r.id)}
            onToggleExcluded={() => onToggleExcluded(r.id)}
            showHistory
          />
        ))}
      </div>

      {(showForm || editingRecipe) && (
        <RecipeForm
          existing={editingRecipe ?? undefined}
          allIngredients={ingredients}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRecipe(null); }}
        />
      )}

      {detailRecipe && (
        <RecipeDetail
          recipe={detailRecipe}
          allIngredients={ingredients}
          history={history}
          month={month}
          onEdit={(r) => { setDetailRecipe(null); setEditingRecipe(r); }}
          onDelete={(id) => { setDetailRecipe(null); handleDelete(id); }}
          onClose={() => setDetailRecipe(null)}
        />
      )}
    </div>
  );
}
