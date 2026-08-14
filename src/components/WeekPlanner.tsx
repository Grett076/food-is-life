import { useState } from 'react';
import type { PlannedDay, Recipe, Ingredient, MealHistory, Preferences } from '../types';
import { MealPicker } from './MealPicker';
import { RecipeDetail } from './RecipeDetail';
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
  const d = new Date(date);
  return `${d.getDate()} ${['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][d.getMonth()]}`;
}

interface Props {
  week: PlannedDay[];
  weekStart: Date;
  recipes: Recipe[];
  ingredients: Ingredient[];
  history: MealHistory[];
  month: number;
  preferences: Preferences;
  onAssign: (date: string, recipeId: string | null, note?: string) => void;
  onNavigate: (delta: number) => void;
}

export function WeekPlanner({ week, weekStart, recipes, ingredients, history, month, preferences, onAssign, onNavigate }: Props) {
  const [picking, setPicking] = useState<string | null>(null); // date
  const [detail, setDetail] = useState<Recipe | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const weekEndStr = (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return isoToDisplay(d.toISOString().slice(0, 10));
  })();

  // Weekendprojecten met prepTasks die voor dit weekend relevant zijn
  const weekendDays = week.filter((_, i) => i >= 5);
  const projectsThisWeekend = weekendDays
    .map((d) => recipes.find((r) => r.id === d.recipeId))
    .filter((r): r is Recipe => !!r && !!r.prepTasks?.length);

  return (
    <div>
      <div className="week-nav">
        <button onClick={() => onNavigate(-1)}>← Vorige</button>
        <h2>{isoToDisplay(weekStart.toISOString().slice(0, 10))} – {weekEndStr}</h2>
        <button onClick={() => onNavigate(1)}>Volgende →</button>
        <button onClick={() => onNavigate(0)}>Vandaag</button>
      </div>

      {/* Prep-taken banner voor weekendprojecten */}
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
          const isToday = day.date === today;
          const recipe = recipes.find((r) => r.id === day.recipeId);
          const fit = recipe ? seasonFit(recipe.ingredients, ingredients, month) : null;

          return (
            <div
              key={day.date}
              className={`day-card${isWeekend ? ' weekend' : ''}${isToday ? ' today' : ''}`}
            >
              <div>
                <div className="day-label">{DAY_NL[i]} — {DAY_FULL[i]}</div>
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
                  {fit && <span className={`season-badge ${fit}`}>{SEASON_FIT_LABEL[fit]}</span>}
                </>
              ) : day.note ? (
                <div className="day-meal">{day.note}</div>
              ) : (
                <div className="day-meal empty">Nog niets gepland</div>
              )}

              <div className="day-actions">
                <button className="primary" onClick={() => setPicking(day.date)}>
                  {recipe || day.note ? 'Wijzigen' : 'Plannen'}
                </button>
                {(recipe || day.note) && (
                  <button onClick={() => onAssign(day.date, null, undefined)}>✕</button>
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
          onPick={(recipeId, note) => {
            onAssign(picking, recipeId, note);
            setPicking(null);
          }}
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
    </div>
  );
}
