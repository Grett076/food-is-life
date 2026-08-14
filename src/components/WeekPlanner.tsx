import { useState } from 'react';
import type { PlannedDay, Recipe, Ingredient, MealHistory, Preferences, TedSchedule } from '../types';
import { MealPicker } from './MealPicker';
import { RecipeDetail } from './RecipeDetail';
import { CookedModal } from './CookedModal';
import { ShoppingList } from './ShoppingList';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';
import { isTedSchoolDay, tedWeekInfo, isArrivedWednesday } from '../lib/ted';

const DAY_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAY_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

function isoToDisplay(date: string): string {
  // Parse als lokale datum (YYYY-MM-DD), niet UTC
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
  tedSchedule: TedSchedule;
  onAssign: (date: string, recipeId: string | null, note?: string) => void;
  onNavigate: (delta: number) => void;
  onAddToStock: (ids: string[]) => void;
  onCookMeal: (ingredientIds: string[]) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onSetLunch: (date: string, value: 'boterham' | 'skip' | null) => void;
  onToggleTedWeek?: never; // vervangen door expliciete aankomst-controls
  onAddTedArrival: (wednesdayStr: string) => void;
  onSkipTedArrival: (wednesdayStr: string) => void;
  onClearTedOverride: (wednesdayStr: string) => void;
  onSetTedReference: (wednesday: string) => void;
  onResetTed: () => void;
}

export function WeekPlanner({ week, weekStart, recipes, ingredients, history, month, preferences, stock, tedSchedule, onAssign, onNavigate, onAddToStock, onCookMeal, onAddRecipe, onSetLunch, onAddTedArrival, onSkipTedArrival, onClearTedOverride, onSetTedReference, onResetTed }: Props) {
  const [picking, setPicking] = useState<string | null>(null);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [showShopping, setShowShopping] = useState(false);
  const [cookedRecipe, setCookedRecipe] = useState<Recipe | null>(null);
  const [showTedSetup, setShowTedSetup] = useState(false);

  const mondayStr = (() => { const d = weekStart; return localDateStr(d); })();
  const tedInfo = tedWeekInfo(mondayStr, tedSchedule);
  const today = localDateStr(new Date());

  const weekEndStr = (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return isoToDisplay(localDateStr(d));
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
        <h2>{isoToDisplay(localDateStr(weekStart))} – {weekEndStr}</h2>
        <button onClick={() => onNavigate(1)}>Volgende →</button>
        <button className="nav-today" onClick={() => onNavigate(0)}>Vandaag</button>
        {/* Ted aankomst controls */}
        {tedSchedule.referenceWednesday ? (
          <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {tedInfo.arrivalWed && (
              // Ted arriveert deze week (wo) → do/vr zijn schooldagen
              isArrivedWednesday(tedInfo.arrivalWed, tedSchedule) && !(tedInfo.arrivalWed in (tedSchedule.arrivalOverrides ?? {})) ? (
                // Ingepland, geen override: toon overslaan-knop
                <button
                  onClick={() => onSkipTedArrival(tedInfo.arrivalWed!)}
                  style={btnStyle('#dbeafe', '#93c5fd', '#1e40af')}
                  title="Ted arriveert woensdag — klik om deze week over te slaan"
                >
                  👦 Ted wo {fmt(tedInfo.arrivalWed)} ✕
                </button>
              ) : (
                // Geforceerde aankomst: toon wissen-knop
                <button
                  onClick={() => onClearTedOverride(tedInfo.arrivalWed!)}
                  style={btnStyle('#d1fae5', '#6ee7b7', '#065f46')}
                  title="Geforceerde aankomst — klik om te wissen"
                >
                  👦 Ted wo {fmt(tedInfo.arrivalWed)} ✓
                </button>
              )
            )}
            {tedInfo.departureWed && !tedInfo.arrivalWed && (
              // Ted is er (ma/di) maar de aankomst was vorige week — toon info
              <span style={{ fontSize: '.78rem', padding: '.15rem .45rem', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}>
                👦 Ted vertrekt wo {fmt(tedInfo.departureWed)}
              </span>
            )}
            {!tedInfo.hasSchoolDays && (
              // Geen Ted deze week — toon toevoegen-knop voor de woensdag van deze week
              <button
                onClick={() => onAddTedArrival((() => { const d = weekStart; const wed = new Date(d); wed.setDate(wed.getDate() + 2); return localDateStr(wed); })())}
                style={btnStyle('var(--tag-bg)', 'var(--border)', 'var(--text-muted)')}
                title="Ted toevoegen voor deze week"
              >
                👦 Ted toevoegen
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowTedSetup(true)}
            style={{ padding: '.35rem .7rem', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '.82rem', color: 'var(--text-muted)', background: 'var(--tag-bg)' }}
          >
            👦 Ted instellen
          </button>
        )}
        <button
          className="nav-shopping"
          onClick={() => setShowShopping(true)}
          style={{ padding: '.35rem .8rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '.85rem' }}
        >
          🛒 Boodschappenlijst
        </button>
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
          const isWorkday = i < 5;
          const isToday = day.date === today;
          const isPast = day.date <= today;
          const recipe = recipes.find((r) => r.id === day.recipeId);
          const fit = recipe ? seasonFit(recipe.ingredients, ingredients, month) : null;
          // Lunch: gebruik opgeslagen waarde, of default 'boterham' voor werkdagen bij ontbrekende waarde
          const effectiveLunch = day.lunch !== undefined ? day.lunch : (isWorkday ? 'boterham' : null);

          return (
            <div
              key={day.date}
              className={`day-card${isWeekend ? ' weekend' : ''}${isToday ? ' today' : ''}`}
            >
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

              {/* Lunch + Ted indicators */}
              {(effectiveLunch !== null || isTedSchoolDay(day.date, tedSchedule)) && (
                <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {effectiveLunch !== null && (
                    <button
                      onClick={() => onSetLunch(day.date, effectiveLunch === 'boterham' ? 'skip' : 'boterham')}
                      title={effectiveLunch === 'boterham' ? 'Klik om over te slaan' : 'Klik voor boterham'}
                      style={{
                        fontSize: '.72rem', padding: '.15rem .45rem', borderRadius: 4, cursor: 'pointer', border: '1px solid',
                        background: effectiveLunch === 'boterham' ? '#fef9c3' : 'var(--tag-bg)',
                        borderColor: effectiveLunch === 'boterham' ? '#fde68a' : 'var(--border)',
                        color: effectiveLunch === 'boterham' ? '#854d0e' : 'var(--text-muted)',
                      }}
                    >
                      {effectiveLunch === 'boterham' ? '🥪 Boterham' : '🥪 —'}
                    </button>
                  )}
                  {isTedSchoolDay(day.date, tedSchedule) && (
                    <span style={{
                      fontSize: '.72rem', padding: '.15rem .45rem', borderRadius: 4,
                      background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af',
                    }}>
                      👦 Ted
                    </span>
                  )}
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

      {showTedSetup && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowTedSetup(false); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>👦 Ted-schema instellen</h2>
              <button className="modal-close" onClick={() => setShowTedSetup(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.88rem' }}>
                Geef de woensdag op waarop Ted voor het eerst aankomt. De app berekent daarna automatisch
                alle Ted-weken (elke 2 weken). Schoollunch: do, vr, ma, di.
              </p>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', fontSize: '.85rem', fontWeight: 600 }}>
                Eerste aankomst (woensdag):
                <input
                  type="date"
                  style={{ padding: '.4rem .6rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.9rem' }}
                  onChange={(e) => { if (e.target.value) { onSetTedReference(e.target.value); setShowTedSetup(false); } }}
                />
              </label>
              {tedSchedule.referenceWednesday && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <p className="text-muted" style={{ fontSize: '.82rem', marginBottom: '.5rem' }}>
                    Huidig schema: Ted arriveert elke 2 weken vanaf <strong>{tedSchedule.referenceWednesday}</strong>.
                  </p>
                  <button
                    onClick={() => { onResetTed(); setShowTedSetup(false); }}
                    style={{ fontSize: '.82rem', padding: '.35rem .7rem', border: '1px solid #fca5a5', borderRadius: 5, cursor: 'pointer', background: 'none', color: '#c00' }}
                  >
                    Schema wissen
                  </button>
                </div>
              )}
            </div>
          </div>
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
          preferences={preferences}
          stock={stock}
          onAddRecipe={onAddRecipe}
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
          tedSchedule={tedSchedule}
          onAddToStock={onAddToStock}
          onClose={() => setShowShopping(false)}
        />
      )}
    </div>
  );
}

function fmt(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} ${['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][m-1]}`;
}

function btnStyle(bg: string, border: string, color: string): React.CSSProperties {
  return { padding: '.3rem .65rem', border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer', fontSize: '.8rem', background: bg, color };
}
