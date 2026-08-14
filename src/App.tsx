import './app.css';
import { useRef, useState } from 'react';
import { useAppState } from './lib/useAppState';
import { WeekPlanner } from './components/WeekPlanner';
import { RecipeLibrary } from './components/RecipeLibrary';
import { IngredientEditor } from './components/IngredientEditor';
import { currentSeasonLabel } from './lib/season';
import { exportData, importData } from './lib/backup';

type View = 'planner' | 'library' | 'voorraad' | 'ingredients';

export default function App() {
  const [view, setView] = useState<View>('planner');
  const state = useAppState();
  const month = new Date().getMonth() + 1;
  const importRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      window.location.reload();
    } catch {
      alert('Import mislukt — controleer het bestand.');
    }
  }

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
        <span className="text-muted header-season" style={{ marginLeft: 'auto' }}>
          {currentSeasonLabel(month)}
        </span>
        <div className="header-actions" style={{ display: 'flex', gap: '.4rem' }}>
          <button onClick={exportData} style={headerBtn} title="Exporteer alle data als JSON">
            ↓ Backup
          </button>
          <label style={{ ...headerBtn, cursor: 'pointer' }} title="Importeer een backup">
            ↑ Herstel
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
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
            onCookMeal={state.cookMeal}
            onAddRecipe={state.addRecipe}
            onSetLunch={state.setLunch}
            onSetTedSchool={state.setTedSchool}
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

const headerBtn: React.CSSProperties = {
  padding: '.3rem .65rem', fontSize: '.8rem',
  border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--surface)', cursor: 'pointer', color: 'var(--text-muted)',
};
