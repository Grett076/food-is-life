import './app.css';
import { useEffect, useRef, useState } from 'react';

// ── Themes ──────────────────────────────────────────────────────────────────
const THEMES = [
  { id: 'forest',      label: 'Bos',        header: '#1a3d2b', accent: '#2d6a4f' },
  { id: 'terracotta',  label: 'Terracotta', header: '#4a2318', accent: '#b85c3a' },
  { id: 'slate-amber', label: 'Leisteen',   header: '#1e293b', accent: '#c47d0e' },
  { id: 'warm-olive',  label: 'Olijf',      header: '#2a2810', accent: '#6b6818' },
  { id: 'plum-rose',   label: 'Pruim',      header: '#2a1440', accent: '#8b3a8f' },
] as const;
type ThemeId = typeof THEMES[number]['id'];
import { useAppState } from './lib/useAppState';
import { WeekPlanner } from './components/WeekPlanner';
import { RecipeLibrary } from './components/RecipeLibrary';
import { IngredientEditor } from './components/IngredientEditor';
import { ShoppingList } from './components/ShoppingList';
import { currentSeasonLabel } from './lib/season';
import { exportData, importData } from './lib/backup';

type View = 'planner' | 'library' | 'voorraad' | 'ingredients' | 'shopping' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('planner');
  const state = useAppState();
  const migrationPrompted = useRef(false);

  // Theme
  const [theme, setTheme] = useState<ThemeId>(
    () => (localStorage.getItem('theme') as ThemeId | null) ?? 'forest'
  );
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'forest') delete el.dataset.theme;
    else el.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!state.ready || state.serverImported || !state.hasLegacyData || migrationPrompted.current) return;
    migrationPrompted.current = true;
    if (!window.confirm('Bestaande gegevens uit deze browser gevonden. Eenmalig naar de centrale opslag overzetten?')) return;
    void state.importOldBrowserData().catch(() => alert('De eenmalige import is mislukt. Je browsergegevens zijn niet verwijderd.'));
  }, [state.ready, state.serverImported, state.hasLegacyData]);
  const month = new Date().getMonth() + 1;
  const importRef = useRef<HTMLInputElement>(null);
  const prevView = useRef<View>('planner');

  function openSettings() {
    if (view !== 'settings') prevView.current = view;
    setView('settings');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      await state.refresh();
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : 'Import mislukt — controleer het bestand.');
    }
  }

  async function handleExport() {
    try {
      await exportData();
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : 'Export mislukt.');
    }
  }

  return (
    <div className="app">
      <header>
        <h1><i className="fi fi-rr-utensils" style={{ marginRight: '.4rem', fontSize: '.95em', verticalAlign: 'middle' }} />Food is Life</h1>
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
          <button className={view === 'shopping' ? 'active' : ''} onClick={() => setView('shopping')}>
            Boodschappen
          </button>
        </nav>
        <span className="text-muted header-season">
          {currentSeasonLabel(month)}
        </span>
        <button
          onClick={openSettings}
          title="Instellingen"
          style={{
            position: 'absolute', right: '1.25rem',
            width: 34, height: 34, borderRadius: '50%',
            background: view === 'settings' ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.12)',
            border: '1.5px solid rgba(255,255,255,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1, flexShrink: 0,
            color: '#c8e6d4',
          }}
        >
          <i className="fi fi-rr-circle-user" style={{ display: 'block', lineHeight: 1 }} />
        </button>
        <input ref={importRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      </header>

      <main>
        {state.error && (
          <p role="alert" style={{ margin: '0 0 1rem', padding: '.75rem 1rem', borderRadius: 8, background: '#fff1f2', color: '#9f1239' }}>
            Centrale opslag: {state.error}
          </p>
        )}
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
            onCookMeal={state.cookMeal}
            onUncookMeal={state.uncookMeal}
            onAddRecipe={state.addRecipe}
            onSetLunch={state.setLunch}
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
        {view === 'shopping' && (
          <>
            <div className="section-title">Boodschappenlijst</div>
            <ShoppingList
              week={state.week}
              recipes={state.recipes}
              allIngredients={state.ingredients}
              stock={state.stock}
              history={state.history}
              onAddToStock={state.addToStock}
            />
          </>
        )}

        {view === 'settings' && (
          <SettingsPanel
            theme={theme}
            onSetTheme={setTheme}
            onBack={() => setView(prevView.current)}
            onExport={handleExport}
            onImport={() => importRef.current?.click()}
          />
        )}
      </main>

      <nav className="tab-bar" role="tablist">
        {([
          { id: 'planner',     icon: 'fi-rr-calendar',       label: 'Planning' },
          { id: 'library',     icon: 'fi-rr-recipe-book',     label: 'Recepten' },
          { id: 'shopping',    icon: 'fi-rr-shopping-cart',   label: 'Boodschappen' },
          { id: 'voorraad',    icon: 'fi-rr-basket',          label: 'Voorraad' },
          { id: 'ingredients', icon: 'fi-rr-leaf',            label: 'Ingrediënten' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={view === tab.id}
            className={view === tab.id ? 'active' : ''}
            onClick={() => setView(tab.id)}
          >
            <span className="tab-icon"><i className={`fi ${tab.icon}`} /></span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────
function SettingsPanel({ theme, onSetTheme, onBack, onExport, onImport }: {
  theme: ThemeId;
  onSetTheme: (t: ThemeId) => void;
  onBack: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  return (
    <div style={{ maxWidth: 420 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: '1.5rem', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
        <i className="fi fi-rr-arrow-left" /> Terug
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--accent)' }}>
          <i className="fi fi-rr-circle-user" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Gebruiker</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Lokaal account</div>
        </div>
      </div>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={sh}>Thema</h2>
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', paddingTop: '.25rem' }}>
          {THEMES.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSetTheme(t.id)}
                title={t.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '.25rem', borderRadius: 8,
                }}
              >
                <span style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: t.header,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active
                    ? `0 0 0 3px var(--surface), 0 0 0 5px ${t.accent}`
                    : '0 1px 4px rgba(0,0,0,.18)',
                  transition: 'box-shadow 150ms ease-out',
                }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent, opacity: .9 }} />
                </span>
                <span style={{ fontSize: '.72rem', fontWeight: active ? 700 : 400, color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={sh}>Gegevens</h2>
        <div style={settingsRow}>
          <span>Naam</span>
          <input defaultValue="Gebruiker" style={settingsInput} />
        </div>
      </section>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={sh}>Back-up &amp; herstel</h2>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <button onClick={onExport} style={{ ...actionBtn, display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
            <i className="fi fi-rr-download" /> Exporteer back-up
          </button>
          <button onClick={onImport} style={{ ...actionBtn, display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
            <i className="fi fi-rr-upload" /> Importeer back-up
          </button>
        </div>
      </section>

      <section>
        <h2 style={sh}>Account</h2>
        <button style={{ ...actionBtn, color: '#b91c1c', borderColor: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
          <i className="fi fi-rr-sign-out-alt" /> Uitloggen
        </button>
      </section>
    </div>
  );
}

const settingsRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '.6rem 0', borderBottom: '1px solid var(--border)',
};
const settingsInput: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: 6, padding: '.3rem .6rem',
  fontSize: '.9rem', background: 'var(--surface)', color: 'var(--text)',
};
const actionBtn: React.CSSProperties = {
  padding: '.45rem 1rem', border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--surface)', cursor: 'pointer', fontSize: '.9rem', color: 'var(--text)',
};

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


