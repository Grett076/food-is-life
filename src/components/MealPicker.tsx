import { useState } from 'react';
import type { Recipe, Ingredient, MealHistory, Preferences } from '../types';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';
import { rankRecipes } from '../lib/suggestions';
import { daysSinceCooked } from '../lib/history';
import { RecipeForm } from './RecipeForm';

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

interface Props {
  date: string;
  isWeekend: boolean;
  recipes: Recipe[];
  ingredients: Ingredient[];
  history: MealHistory[];
  month: number;
  currentRecipeId: string | null;
  preferences: Preferences;
  stock: string[];
  onPick: (recipeId: string | null, note?: string) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onClose: () => void;
}

export function MealPicker({ date, isWeekend, recipes, ingredients, history, month, currentRecipeId, preferences, stock, onPick, onAddRecipe, onClose }: Props) {
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const ranked = rankRecipes(recipes, history, ingredients, month, preferences, stock);

  const weekendProjects = recipes.filter((r) => r.cookingStyle === 'weekendProject');
  const weekendRec = recipes.filter((r) => r.cookingStyle === 'weekend');
  const favorites = recipes.filter((r) => r.favorite);

  const searchFiltered = search
    ? ranked.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : ranked;

  function PickerItem({ recipe }: { recipe: Recipe }) {
    const fit = seasonFit(recipe.ingredients, ingredients, month);
    const days = daysSinceCooked(recipe.id, history);
    const isExcluded = (preferences.excludedRecipes ?? []).includes(recipe.id);
    return (
      <div
        className={`picker-item ${recipe.id === currentRecipeId ? 'active' : ''}`}
        style={recipe.id === currentRecipeId ? { background: 'var(--accent-light)', borderColor: 'var(--accent)' } : {}}
        onClick={() => onPick(recipe.id)}
      >
        {recipe.favorite && <span title="Favoriet">★</span>}
        <span className="name">{recipe.name}</span>
        <span className="meta">
          {formatMinutes(recipe.activePrepMinutes)}
          {recipe.totalTimeMinutes !== recipe.activePrepMinutes && ` / ${formatMinutes(recipe.totalTimeMinutes)}`}
        </span>
        <span className={`season-badge ${fit}`} style={{ fontSize: '.7rem' }}>{SEASON_FIT_LABEL[fit]}</span>
        {days !== null && days < 7 && (
          <span className="meta" style={{ color: '#c00' }}>recent</span>
        )}
        {isExcluded && (
          <span className="meta" title="Niet mijn ding">🚫</span>
        )}
      </div>
    );
  }

  return (
    <>
      {showForm && (
        <RecipeForm
          allIngredients={ingredients}
          onSave={(recipe) => {
            onAddRecipe(recipe);
            onPick(recipe.id);
            onClose();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>Maaltijd kiezen — {date}</h2>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{ fontSize: '.8rem', padding: '.3rem .65rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' }}
            >
              + Recept
            </button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="modal-body">

          {/* Notitie (restjes, afhalen, etc.) */}
          <div className="picker-note-row">
            <input
              type="text"
              placeholder="Notitie: restjes, afhalen, broodjes…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button onClick={() => { onPick(null, note); onClose(); }}>Opslaan</button>
          </div>

          {/* Weekend suggesties */}
          {isWeekend && !search && (
            <div className="picker-section">
              <h3>🍳 Zin om uitgebreider te koken?</h3>
              {weekendProjects.length > 0 && (
                <>
                  <p className="text-muted" style={{ marginBottom: '.5rem' }}>Weekendprojecten</p>
                  <div className="picker-list">
                    {weekendProjects.map((r) => <PickerItem key={r.id} recipe={r} />)}
                  </div>
                </>
              )}
              {weekendRec.length > 0 && (
                <>
                  <p className="text-muted" style={{ marginTop: '.75rem', marginBottom: '.5rem' }}>Weekendgerechten</p>
                  <div className="picker-list">
                    {weekendRec.map((r) => <PickerItem key={r.id} recipe={r} />)}
                  </div>
                </>
              )}
              {favorites.length > 0 && (
                <>
                  <p className="text-muted" style={{ marginTop: '.75rem', marginBottom: '.5rem' }}>Favorieten</p>
                  <div className="picker-list">
                    {favorites.map((r) => <PickerItem key={r.id} recipe={r} />)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Zoeken + alle gerechten */}
          <div className="picker-section">
            <h3>Alle gerechten</h3>
            <input
              type="search"
              placeholder="Zoeken…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', marginBottom: '.75rem', padding: '.4rem .7rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '.9rem' }}
            />
            <div className="picker-list">
              {searchFiltered.map((r) => <PickerItem key={r.id} recipe={r} />)}
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
