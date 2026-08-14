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
              Pas aan wanneer iets niet klopt voor jouw regio. Wordt gebruikt voor de seizoensscore van recepten.
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
