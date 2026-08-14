import './app.css';
import { useState } from 'react';
import { useAppState } from './lib/useAppState';
import { WeekPlanner } from './components/WeekPlanner';
import { RecipeLibrary } from './components/RecipeLibrary';
import { IngredientEditor } from './components/IngredientEditor';
import { currentSeasonLabel } from './lib/season';

type View = 'planner' | 'library' | 'ingredients';

export default function App() {
  const [view, setView] = useState<View>('planner');
  const state = useAppState();
  const month = new Date().getMonth() + 1;

  return (
    <div className="app">
      <header>
        <h1>🍽 Food is Life</h1>
        <nav>
          <button className={view === 'planner' ? 'active' : ''} onClick={() => setView('planner')}>
            Weekplanning
          </button>
          <button className={view === 'library' ? 'active' : ''} onClick={() => setView('library')}>
            Recepten
          </button>
          <button className={view === 'ingredients' ? 'active' : ''} onClick={() => setView('ingredients')}>
            Ingrediënten
          </button>
        </nav>
        <span className="text-muted" style={{ marginLeft: 'auto' }}>
          {currentSeasonLabel(month)}
        </span>
      </header>

      <main>
        {view === 'planner' && (
          <WeekPlanner
            week={state.week}
            weekStart={state.weekStart}
            recipes={state.recipes}
            ingredients={state.ingredients}
            history={state.history}
            month={month}
            preferences={state.preferences}
            onAssign={state.assignMeal}
            onNavigate={(delta) => delta === 0 ? state.goToCurrentWeek() : state.navigateWeek(delta)}
          />
        )}

        {view === 'library' && (
          <>
            <div className="section-title">Recepten</div>
            <RecipeLibrary
              recipes={state.recipes}
              ingredients={state.ingredients}
              history={state.history}
              month={month}
              preferences={state.preferences}
              onFavorite={state.toggleFavorite}
              onAdd={state.addRecipe}
              onUpdate={state.updateRecipe}
              onDelete={state.deleteRecipe}
            />
          </>
        )}

        {view === 'ingredients' && (
          <>
            <div className="section-title">Seizoeningrediënten</div>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Pas aan wanneer iets niet klopt voor jouw regio. Seizoensscore en ranking houden hier rekening mee.
            </p>

            {/* Voorkeurenpaneel */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem',
            }}>
              <h3 style={{ fontSize: '.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: '.6rem' }}>
                Voorkeur — vermijden
              </h3>
              <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                Ingrediënten hieronder komen lager in suggesties. Nooit geblokkeerd — je kunt ze altijd kiezen.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                {state.ingredients.sort((a, b) => a.name.localeCompare(b.name)).map((ing) => {
                  const isDisliked = state.preferences.dislikedIngredients.includes(ing.id);
                  return (
                    <button
                      key={ing.id}
                      onClick={() => state.toggleDisliked(ing.id)}
                      style={{
                        padding: '.25rem .6rem', borderRadius: 5, cursor: 'pointer', fontSize: '.82rem',
                        background: isDisliked ? '#fee2e2' : 'var(--tag-bg)',
                        border: isDisliked ? '1px solid #fca5a5' : '1px solid transparent',
                        color: isDisliked ? '#991b1b' : 'var(--text-muted)',
                        fontWeight: isDisliked ? 600 : 400,
                      }}
                    >
                      {isDisliked ? '✕ ' : ''}{ing.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <IngredientEditor
              ingredients={state.ingredients}
              onUpdate={state.updateIngredient}
              onAdd={state.addIngredient}
              onClose={() => {}}
              inline
            />
          </>
        )}
      </main>
    </div>
  );
}
