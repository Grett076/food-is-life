import './app.css';
import { useState } from 'react';
import { useAppState } from './lib/useAppState';
import { WeekPlanner } from './components/WeekPlanner';
import { RecipeLibrary } from './components/RecipeLibrary';
import { RecipeDetail } from './components/RecipeDetail';
import { currentSeasonLabel } from './lib/season';
import type { Recipe } from './types';

type View = 'planner' | 'library';

export default function App() {
  const [view, setView] = useState<View>('planner');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const state = useAppState();

  const month = new Date().getMonth() + 1; // 1–12
  const season = currentSeasonLabel(month);

  function handleNavigate(delta: number) {
    if (delta === 0) {
      // "Vandaag" — reset door opnieuw te laden
      window.location.reload();
      return;
    }
    state.navigateWeek(delta);
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
        </nav>
        <span className="text-muted" style={{ marginLeft: 'auto' }}>
          {season}
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
            onNavigate={handleNavigate}
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
              onSelect={setSelectedRecipe}
              onFavorite={state.toggleFavorite}
            />
          </>
        )}
      </main>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          allIngredients={state.ingredients}
          history={state.history}
          month={month}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
