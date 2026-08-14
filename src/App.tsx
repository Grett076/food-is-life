import './app.css';
import { useState } from 'react';
import { useAppState } from './lib/useAppState';
import { WeekPlanner } from './components/WeekPlanner';
import { RecipeLibrary } from './components/RecipeLibrary';
import { IngredientEditor } from './components/IngredientEditor';
import { currentSeasonLabel } from './lib/season';

type View = 'planner' | 'library' | 'voorraad' | 'ingredients';

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
          <button className={view === 'voorraad' ? 'active' : ''} onClick={() => setView('voorraad')}>
            Voorraad
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
            stock={state.stock}
            onAssign={state.assignMeal}
            onNavigate={(delta) => delta === 0 ? state.goToCurrentWeek() : state.navigateWeek(delta)}
            onAddToStock={state.addToStock}
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
              onToggleExcluded={state.toggleExcluded}
            />
          </>
        )}

        {view === 'voorraad' && (
          <>
            <div className="section-title">Voorraad</div>
            <p className="text-muted" style={{ marginBottom: '1.25rem' }}>
              Wat heb je in huis? Ingrediënten in voorraad scoren hoger in suggesties en worden afgestreept op de boodschappenlijst.
            </p>

            {/* Zoekbalk */}
            <StockPanel
              ingredients={state.ingredients}
              stock={state.stock}
              onToggle={state.toggleStock}
            />
          </>
        )}

        {view === 'ingredients' && (
          <>
            <div className="section-title">Seizoeningrediënten</div>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Pas aan wanneer iets niet klopt voor jouw regio.
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
                Lager in suggesties, nooit geblokkeerd.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                {state.ingredients.sort((a, b) => a.name.localeCompare(b.name)).map((ing) => {
                  const isDisliked = state.preferences.dislikedIngredients.includes(ing.id);
                  return (
                    <button key={ing.id} onClick={() => state.toggleDisliked(ing.id)} style={{
                      padding: '.25rem .6rem', borderRadius: 5, cursor: 'pointer', fontSize: '.82rem',
                      background: isDisliked ? '#fee2e2' : 'var(--tag-bg)',
                      border: isDisliked ? '1px solid #fca5a5' : '1px solid transparent',
                      color: isDisliked ? '#991b1b' : 'var(--text-muted)',
                      fontWeight: isDisliked ? 600 : 400,
                    }}>
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

// Inline component — te klein voor eigen bestand
function StockPanel({ ingredients, stock, onToggle }: {
  ingredients: { id: string; name: string }[];
  stock: string[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const stockSet = new Set(stock);
  const filtered = ingredients
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const inStock = filtered.filter((i) => stockSet.has(i.id));
  const notInStock = filtered.filter((i) => !stockSet.has(i.id));

  return (
    <div>
      <input
        type="search"
        placeholder="Zoeken…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', maxWidth: 360, padding: '.45rem .75rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.9rem', marginBottom: '1rem' }}
      />

      {inStock.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={sh}>In huis ({inStock.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
            {inStock.map((ing) => (
              <button key={ing.id} onClick={() => onToggle(ing.id)} style={{
                padding: '.3rem .7rem', borderRadius: 20, cursor: 'pointer', fontSize: '.85rem',
                background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontWeight: 500,
              }}>
                ✓ {ing.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 style={sh}>Niet in huis ({notInStock.length})</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
          {notInStock.map((ing) => (
            <button key={ing.id} onClick={() => onToggle(ing.id)} style={{
              padding: '.3rem .7rem', borderRadius: 20, cursor: 'pointer', fontSize: '.85rem',
              background: 'var(--tag-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)',
            }}>
              {ing.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const sh: React.CSSProperties = {
  fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: '.5rem',
};
