import { useState } from 'react';
import type { PlannedDay, Recipe, Ingredient, MealHistory, Preferences } from '../types';
import { MealPicker } from './MealPicker';
import { RecipeDetail } from './RecipeDetail';
import { CookedModal } from './CookedModal';
import { ShoppingList } from './ShoppingList';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';

const DAY_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAY_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

function isoToDisplay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const local = new Date(y, m - 1, d);
  return `${local.getDate()} ${['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][local.getMonth()]}`;
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

interface Props {
  week: PlannedDay[];
  weekStart: Date;
  recipes: Recipe[];
  ingredients: Ingredient[];
  history: MealHistory[];
  month: number;
  preferences: Preferences;
  stock: string[];
  onAssign: (date: string, recipeId: string | null, note?: string) => void;
  onNavigate: (delta: number) => void;
  onAddToStock: (ids: string[]) => void;
  onCookMeal: (ingredientIds: string[]) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onSetLunch: (date: string, value: 'boterham' | 'skip' | null) => void;
}

export function WeekPlanner({ week, weekStart, recipes, ingredients, history, month, preferences, stock, onAssign, onNavigate, onAddToStock, onCookMeal, onAddRecipe, onSetLunch }: Props) {
  const [picking, setPicking] = useState<string | null>(null);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [showShopping, setShowShopping] = useState(false);
  const [cookedRecipe, setCookedRecipe] = useState<Recipe | null>(null);

  const today = localDateStr(new Date());
  const weekEndStr = isoToDisplay(localDateStr(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)));

  const weekendDays = week.filter((_, i) => i >= 5);
  const projectsThisWeekend = weekendDays
    .map((d) => recipes.find((r) => r.id === d.recipeId))
    .filter((r): r is Recipe => !!r && !!r.prepTasks?.length);

  return (
    <div>
      <div className="week-nav">
        <button onClick={() => onNavigate(-1)}>← Vorige</button>
        <h2>{isoToDisplay(localDateStr(weekStart))} – {weekEndStr}</h2>
        <button onClick={() => onNavigate(1)}>Volgende →</button>
        <button className="nav-today" onClick={() => onNavigate(0)}>Vandaag</button>
        <button
          className="nav-shopping"
          onClick={() => setShowShopping(true)}
          style={{ padding: '.35rem .8rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '.85rem' }}
        >
          🛒 Boodschappenlijst
        </button>
      </div>

      {projectsThisWeekend.length > 0 && (
        <div className="weekend-banner" style={{ marginBottom: '1rem' }}>
          <h3>📋 Voorbereiding dit weekend</h3>
          {projectsThisWeekend.map((r) => (
            <div key={r.id} style={{ marginBottom: '.5rem' }}>
              <strong>{r.name}</strong>
              {r.prepTasks?.map((t, i) => (
                <div key={i} className="prep-task" style={{ marginTop: '.25rem' }}>
                  <span className="when">{t.relativeTime}</span>
                  {t.durationMinutes && <span className="text-muted"> · {t.durationMinutes} min</span>}
                  {' '}{t.title}
                  {t.note && <div className="note">{t.note}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="week-grid">
        {week.map((day, i) => {
          const isWeekend = i >= 5;
          const isWorkday = i < 5;
          const isToday = day.date === today;
          const isPast = day.date <= today;
          const recipe = recipes.find((r) => r.id === day.recipeId);
          const fit = recipe ? seasonFit(recipe.ingredients, ingredients, month) : null;
          const effectiveLunch = day.lunch !== undefined ? day.lunch : (isWorkday ? 'boterham' : null);

          return (
            <div key={day.date} className={`day-card${isWeekend ? ' weekend' : ''}${isToday ? ' today' : ''}`}>
              <div>
                <div className="day-label">
                  <span>{DAY_NL[i]}</span>
                  <span className="day-label-full"> — {DAY_FULL[i]}</span>
                </div>
                <div className="day-date">{isoToDisplay(day.date)}</div>
              </div>

              {recipe ? (
                <>
                  <div className="day-meal" style={{ cursor: 'pointer' }} onClick={() => setDetail(recipe)}>
                    {recipe.name}
                  </div>
                  <div className="day-meta">
                    {formatMinutes(recipe.activePrepMinutes)} actief
                    {recipe.totalTimeMinutes !== recipe.activePrepMinutes &&
                      ` / ${formatMinutes(recipe.totalTimeMinutes)} totaal`}
                  </div>
                  {fit && <span className={`season-badge day-season ${fit}`}>{SEASON_FIT_LABEL[fit]}</span>}
                </>
              ) : day.note ? (
                <div className="day-meal">{day.note}</div>
              ) : (
                <div className="day-meal empty">Nog niets gepland</div>
              )}

              {effectiveLunch !== null && (
                <div>
                  <button
                    onClick={() => onSetLunch(day.date, effectiveLunch === 'boterham' ? 'skip' : 'boterham')}
                    title={effectiveLunch === 'boterham' ? 'Klik om over te slaan' : 'Klik voor boterham'}
                    style={{
                      fontSize: '.72rem', padding: '.15rem .45rem', borderRadius: 4, cursor: 'pointer', border: '1px solid',
                      background: effectiveLunch === 'boterham' ? 'var(--weekend-bg)' : 'var(--tag-bg)',
                      borderColor: effectiveLunch === 'boterham' ? 'var(--weekend-border)' : 'var(--border)',
                      color: effectiveLunch === 'boterham' ? '#7a5800' : 'var(--text-muted)',
                    }}
                  >
                    {effectiveLunch === 'boterham' ? '🥪 Boterham' : '🥪 —'}
                  </button>
                </div>
              )}

              <div className="day-actions">
                <button className="primary" onClick={() => setPicking(day.date)}>
                  {recipe || day.note ? 'Wijzigen' : 'Plannen'}
                </button>
                {recipe && isPast && (
                  <button onClick={() => setCookedRecipe(recipe)}>✓ Gekookt</button>
                )}
                {(recipe || day.note) && (
                  <button className="btn-secondary" onClick={() => onAssign(day.date, null, undefined)}>✕</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {picking && (
        <MealPicker
          date={picking}
          isWeekend={week.findIndex((d) => d.date === picking) >= 5}
          recipes={recipes}
          ingredients={ingredients}
          history={history}
          month={month}
          currentRecipeId={week.find((d) => d.date === picking)?.recipeId ?? null}
          preferences={preferences}
          stock={stock}
          onAddRecipe={onAddRecipe}
          onPick={(recipeId, note) => { onAssign(picking, recipeId, note); setPicking(null); }}
          onClose={() => setPicking(null)}
        />
      )}

      {detail && (
        <RecipeDetail
          recipe={detail}
          allIngredients={ingredients}
          history={history}
          month={month}
          onClose={() => setDetail(null)}
        />
      )}

      {cookedRecipe && (
        <CookedModal
          recipe={cookedRecipe}
          allIngredients={ingredients}
          stock={stock}
          onDeplete={(ids) => { onCookMeal(ids); setCookedRecipe(null); }}
          onClose={() => setCookedRecipe(null)}
        />
      )}

      {showShopping && (
        <ShoppingList
          week={week}
          recipes={recipes}
          allIngredients={ingredients}
          stock={stock}
          onAddToStock={onAddToStock}
          onClose={() => setShowShopping(false)}
        />
      )}
    </div>
  );
}
