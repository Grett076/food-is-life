import { useState } from 'react';
import type { Recipe, Ingredient, MealHistory, Preferences } from '../types';
import { seasonFit } from '../lib/season';
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
  currentNote?: string;
  preferences: Preferences;
  stock: string[];
  onPick: (recipeId: string | null, note?: string) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onClose: () => void;
}

export function MealPicker({ date, isWeekend, recipes, ingredients, history, month, currentRecipeId, currentNote, preferences, stock, onPick, onAddRecipe, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [note, setNote] = useState(currentNote ?? '');
  const [showForm, setShowForm] = useState(false);

  const ranked = rankRecipes(recipes, history, ingredients, month, preferences, stock);
  const excluded = new Set(preferences.excludedRecipes ?? []);

  const searchFiltered = search
    ? ranked.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : ranked;

  // Weekend suggesties — compacte chips, niet volledige lijsten
  const weekendChips = !search && isWeekend
    ? ranked.filter((r) => r.cookingStyle === 'weekendProject' || r.cookingStyle === 'weekend' || r.favorite).slice(0, 8)
    : [];

  function PickerItem({ recipe }: { recipe: Recipe }) {
    const fit = seasonFit(recipe.ingredients, ingredients, month);
    const days = daysSinceCooked(recipe.id, history);
    const isExcluded = excluded.has(recipe.id);
    const isCurrent = recipe.id === currentRecipeId;
    const recentlyEaten = days !== null && days < 7;

    return (
      <div
        className="picker-item"
        onClick={() => onPick(recipe.id, note.trim() || undefined)}
        style={{
          opacity: isExcluded ? .5 : 1,
          background: isCurrent ? 'var(--accent-light)' : undefined,
          borderColor: isCurrent ? 'var(--accent)' : undefined,
        }}
      >
        {/* Naam + favoriet */}
        <span className="name" style={{ color: recentlyEaten ? 'var(--text-muted)' : 'var(--text)' }}>
          {recipe.favorite && <span style={{ color: 'var(--accent)', marginRight: '.3rem', fontSize: '.85rem' }}>♥</span>}
          {recipe.name}
        </span>

        {/* Tijd */}
        <span className="meta">{formatMinutes(recipe.activePrepMinutes)}</span>

        {/* Seizoen dot — alleen als perfect */}
        {fit === 'perfect' && (
          <span title="Perfect voor dit seizoen" style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d6a4f', display: 'inline-block', flexShrink: 0 }} />
        )}
      </div>
    );
  }

  return (
    <>
      {showForm && (
        <RecipeForm
          allIngredients={ingredients}
          onSave={(recipe) => { onAddRecipe(recipe); onPick(recipe.id); onClose(); }}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal">

          {/* Header */}
          <div className="modal-header">
            <h2 style={{ fontSize: '.95rem' }}>Maaltijd — {date}</h2>
            <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
              {currentRecipeId && (
                <button onClick={() => { onPick(null); onClose(); }}
                  style={{ fontSize: '.78rem', padding: '.25rem .55rem', background: 'none', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                  <i className="fi fi-rr-trash" /> Dag wissen
                </button>
              )}
              <button onClick={() => setShowForm(true)}
                style={{ fontSize: '.78rem', padding: '.25rem .55rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                <i className="fi fi-rr-plus" /> Recept
              </button>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
          </div>

          <div className="modal-body" style={{ paddingTop: '.85rem' }}>

            {/* Zoeken — prominent, bovenaan */}
            <input
              type="search"
              placeholder="Zoek een gerecht…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '.55rem .85rem',
                border: '1px solid var(--border)', borderRadius: 8,
                fontSize: '.95rem', marginBottom: '1rem',
                background: 'var(--bg)',
              }}
            />

            {/* Weekend chips — alleen als geen zoekopdracht */}
            {weekendChips.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: '.45rem' }}>
                  🍳 Zin in uitgebreider?
                </p>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                  {weekendChips.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onPick(r.id, note.trim() || undefined)}
                      style={{
                        padding: '.3rem .7rem', borderRadius: 20,
                        border: '1px solid var(--weekend-border)',
                        background: r.cookingStyle === 'weekendProject' ? 'var(--project-bg)' : 'var(--weekend-bg)',
                        cursor: 'pointer', fontSize: '.82rem', color: 'var(--text)',
                        fontWeight: r.favorite ? 600 : 400,
                      }}
                    >
                      {r.favorite && '♥ '}{r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gerechtenlijst */}
            <div className="picker-list">
              {searchFiltered.map((r) => <PickerItem key={r.id} recipe={r} />)}
            </div>

            {/* Notitie — altijd zichtbaar onderaan */}
            <div style={{ marginTop: '.85rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)' }}>
              <input
                type="text"
                placeholder="Notitie (bijv. geen zout, restjes, afhalen…)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: '100%', padding: '.4rem .65rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.88rem', background: 'var(--bg)' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && note.trim() && !currentRecipeId) { onPick(null, note.trim()); onClose(); } }}
              />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
