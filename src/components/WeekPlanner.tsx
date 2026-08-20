import { useState, useRef, useEffect } from 'react';
import type { PlannedDay, Recipe, Ingredient, MealHistory, Preferences } from '../types';
import { MealPicker } from './MealPicker';
import { RecipeDetail } from './RecipeDetail';
import { CookedModal } from './CookedModal';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';

const DAY_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAY_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

function isoWeek(d: Date): number {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 3 - (t.getDay() + 6) % 7);
  const w1 = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
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
  onCookMeal: (date: string, recipeId: string, ingredientIds: string[]) => void;
  onUncookMeal: (date: string, recipeId: string) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onSetLunch: (date: string, value: 'boterham' | 'skip' | null) => void;
}

export function WeekPlanner({ week, weekStart, recipes, ingredients, history, month, preferences, stock, onAssign, onNavigate, onCookMeal, onUncookMeal, onAddRecipe, onSetLunch }: Props) {
  const [picking, setPicking] = useState<string | null>(null);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [cookedRecipe, setCookedRecipe] = useState<{ recipe: Recipe; date: string } | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      if (picking || detail || cookedRecipe || touchStartX.current === null) return;
      const delta = touchStartX.current - e.changedTouches[0].clientX;
      touchStartX.current = null;
      if (Math.abs(delta) > 50)
        setActiveDayIndex((i) => Math.min(6, Math.max(0, i + (delta > 0 ? 1 : -1))));
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [picking, detail, cookedRecipe]);

  const today = localDateStr(new Date());
  const todayIndex = week.findIndex((d) => d.date === today);
  const [activeDayIndex, setActiveDayIndex] = useState(todayIndex >= 0 ? todayIndex : 0);
  const clampedActive = Math.min(activeDayIndex, week.length - 1);

  // Active-card local state — reset when user swipes to a different day
  const [noteValue, setNoteValue] = useState(week[clampedActive]?.note ?? '');
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set());
  const [doneWeekendTasks, setDoneWeekendTasks] = useState<Set<string>>(new Set());
  useEffect(() => {
    setNoteValue(week[clampedActive]?.note ?? '');
    setDoneTasks(new Set());
  }, [clampedActive]);
  const weekEndStr = isoToDisplay(localDateStr(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)));

  const weekendDays = week.filter((_, i) => i >= 5);
  const projectsThisWeekend = weekendDays
    .map((d) => recipes.find((r) => r.id === d.recipeId))
    .filter((r): r is Recipe => !!r && !!r.prepTasks?.length);

  const weekNum = isoWeek(weekStart);

  return (
    <div>
      <div className="week-nav">
        <div />
        <div className="week-nav-center">
          <button className="week-nav-btn" title="Vorige week" onClick={() => { onNavigate(-1); setActiveDayIndex(0); }}>&#8249;</button>
          <div className="week-nav-label">
            <div className="week-num">Week {weekNum}</div>
            <h2>{isoToDisplay(localDateStr(weekStart))} – {weekEndStr}</h2>
          </div>
          <button className="week-nav-btn" title="Volgende week" onClick={() => { onNavigate(1); setActiveDayIndex(0); }}>&#8250;</button>
        </div>
        <div className="week-nav-right">
          <button className="nav-today"
            onClick={() => { onNavigate(0); setActiveDayIndex(todayIndex >= 0 ? todayIndex : 0); }}
            style={{ padding: '.35rem .7rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '.85rem', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}
          ><i className="fi fi-rr-calendar-day" />Vandaag</button>
        </div>
      </div>

      <div className="week-grid">
        {/* Week strip — mobile only, rendered via CSS */}
        <div className="week-strip">
          {week.map((day, i) => {
            const num = parseInt(day.date.split('-')[2], 10);
            const hasMeal = !!(week[i].recipeId || week[i].note);
            const isWorkday = i < 5;
            const lunchVal = week[i].lunch !== undefined ? week[i].lunch : (isWorkday ? 'boterham' : null);
            const hasLunch = lunchVal === 'boterham';
            return (
              <button
                key={day.date}
                onClick={() => setActiveDayIndex(i)}
                className={[
                  'week-strip-day',
                  i === clampedActive ? 'is-active' : '',
                  day.date === today ? 'is-today' : '',
                  i >= 5 ? 'is-weekend' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="strip-name">{DAY_NL[i]}</span>
                <span className="strip-num">{num}</span>
                <span className="strip-dots">
                  <span className="strip-dot" style={{ visibility: hasMeal ? 'visible' : 'hidden' }} />
                  <span className="strip-dot strip-dot-lunch" style={{ visibility: hasLunch ? 'visible' : 'hidden' }} />
                </span>
              </button>
            );
          })}
        </div>

        {week.map((day, i) => {
          const isWeekend = i >= 5;
          const isWorkday = i < 5;
          const isToday = day.date === today;
          const isPast = day.date <= today;
          const recipe = recipes.find((r) => r.id === day.recipeId);
          const fit = recipe ? seasonFit(recipe.ingredients, ingredients, month) : null;
          const effectiveLunch = day.lunch !== undefined ? day.lunch : (isWorkday ? 'boterham' : null);

          const isCooked = !!recipe && history.some((h) => h.date === day.date && h.recipeId === recipe.id);

          return (
            <div key={day.date} className={`day-card${isWeekend ? ' weekend' : ''}${isToday ? ' today' : ''}${isCooked ? ' cooked' : ''}${i === clampedActive ? ' mobile-active' : ''}`}>
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

              {/* Prep tasks + inline note — only for the active card */}
              {i === clampedActive && (
                <>
                  {recipe?.prepTasks && recipe.prepTasks.length > 0 && (
                    <div style={{ marginTop: '.25rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                      <span style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <i className="fi fi-rr-clipboard-list" /> Voorbereiding
                      </span>
                      {recipe.prepTasks.map((task, ti) => (
                          <label key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', cursor: 'pointer', fontSize: '.82rem' }}>
                            <input
                              type="checkbox"
                              checked={doneTasks.has(ti)}
                              onChange={() => setDoneTasks((s) => { const n = new Set(s); n.has(ti) ? n.delete(ti) : n.add(ti); return n; })}
                              style={{ marginTop: '.15rem', flexShrink: 0, accentColor: 'var(--accent)' }}
                            />
                            <span style={{ textDecoration: doneTasks.has(ti) ? 'line-through' : 'none', color: doneTasks.has(ti) ? 'var(--text-muted)' : 'var(--text)' }}>
                              <span style={{ color: doneTasks.has(ti) ? 'var(--text-muted)' : 'var(--accent)', fontWeight: 600 }}>{task.relativeTime}</span>{' — '}{task.title}
                              {task.note && <span style={{ color: 'var(--text-muted)' }}> ({task.note})</span>}
                            </span>
                          </label>
                        ))}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '.75rem' }}>
                    <input
                      type="text"
                      placeholder="+ Notitie (bijv. geen zout, voor gasten…)"
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      onBlur={() => onAssign(day.date, day.recipeId, noteValue.trim() || undefined)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      style={{ width: '100%', padding: '.4rem .6rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.82rem', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>
                </>
              )}

              {effectiveLunch !== null && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.78rem', color: effectiveLunch === 'boterham' ? 'var(--text)' : 'var(--text-muted)' }}>
                  <span style={{ position: 'relative', display: 'inline-block', width: '2rem', height: '1.1rem', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={effectiveLunch === 'boterham'}
                      onChange={() => onSetLunch(day.date, effectiveLunch === 'boterham' ? 'skip' : 'boterham')}
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    />
                    <span style={{
                      position: 'absolute', inset: 0, borderRadius: '1rem', cursor: 'pointer',
                      background: effectiveLunch === 'boterham' ? 'var(--accent)' : 'var(--border)',
                      transition: 'background .2s',
                    }} />
                    <span style={{
                      position: 'absolute', top: '.15rem',
                      left: effectiveLunch === 'boterham' ? 'calc(100% - .95rem)' : '.15rem',
                      width: '.8rem', height: '.8rem', borderRadius: '50%',
                      background: 'white', transition: 'left .2s',
                    }} />
                  </span>
                  Lunch
                </label>
              )}

              <div className="day-actions">
                <button className="primary" onClick={() => setPicking(day.date)}>
                  <i className={`fi ${recipe || day.note ? 'fi-rr-calendar-pen' : 'fi-rr-calendar-plus'}`} />
                  {recipe || day.note ? 'Wijzigen' : 'Plan maaltijd'}
                </button>
                {recipe && isPast && (
                  isCooked
                    ? <button className="cooked-badge" title="Ongedaan maken" onClick={() => onUncookMeal(day.date, recipe.id)}><i className="fi fi-rr-check" /> Gekookt</button>
                    : <button onClick={() => setCookedRecipe({ recipe, date: day.date })}>
                        Gekookt
                      </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {projectsThisWeekend.length > 0 && (clampedActive >= 5 || window.innerWidth > 800) && (
        <div className="weekend-banner" style={{ marginTop: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
            <i className="fi fi-rr-clipboard-list" /> Voorbereiding dit weekend
          </h3>
          {projectsThisWeekend.map((r) => {
            const visibleTasks = (r.prepTasks ?? []).filter((_, i) => !doneWeekendTasks.has(`${r.id}-${i}`));
            if (visibleTasks.length === 0) return null;
            return (
              <div key={r.id} style={{ marginBottom: '.5rem' }}>
                <strong>{r.name}</strong>
                {visibleTasks.map((t) => {
                  const origIndex = (r.prepTasks ?? []).indexOf(t);
                  const key = `${r.id}-${origIndex}`;
                  return (
                    <label key={key} className="prep-task" style={{ marginTop: '.25rem', display: 'flex', alignItems: 'flex-start', gap: '.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => setDoneWeekendTasks((s) => { const n = new Set(s); n.add(key); return n; })}
                        style={{ marginTop: '.2rem', flexShrink: 0, accentColor: 'var(--accent)' }}
                      />
                      <span>
                        <span className="when">{t.relativeTime}</span>
                        {t.durationMinutes && <span className="text-muted"> · {t.durationMinutes} min</span>}
                        {' '}{t.title}
                        {t.note && <div className="note">{t.note}</div>}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {picking && (
        <MealPicker
          date={picking}
          isWeekend={week.findIndex((d) => d.date === picking) >= 5}
          recipes={recipes}
          ingredients={ingredients}
          history={history}
          month={month}
          currentRecipeId={week.find((d) => d.date === picking)?.recipeId ?? null}
          currentNote={week.find((d) => d.date === picking)?.note}
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
          recipe={cookedRecipe.recipe}
          allIngredients={ingredients}
          stock={stock}
          onDeplete={(ids) => { onCookMeal(cookedRecipe.date, cookedRecipe.recipe.id, ids); setCookedRecipe(null); }}
          onClose={() => setCookedRecipe(null)}
        />
      )}
    </div>
  );
}