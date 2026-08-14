import type { Recipe, Ingredient, MealHistory } from '../types';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';
import { totalTimesCooked } from '../lib/history';

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

interface Props {
  recipe: Recipe;
  allIngredients: Ingredient[];
  history: MealHistory[];
  month: number;
  onClose: () => void;
}

export function RecipeDetail({ recipe, allIngredients, history, month, onClose }: Props) {
  const fit = seasonFit(recipe.ingredients, allIngredients, month);
  const cooked = totalTimesCooked(recipe.id, history);

  const STYLE_LABEL: Record<string, string> = {
    quick: 'Snel',
    normal: 'Normaal',
    weekend: 'Weekend',
    weekendProject: 'Weekendproject',
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{recipe.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body recipe-detail">
          {recipe.description && <p style={{ marginBottom: '.75rem', color: 'var(--text-muted)' }}>{recipe.description}</p>}

          <div className="tags" style={{ marginBottom: '.75rem' }}>
            <span className={`tag style-${recipe.cookingStyle}`}>{STYLE_LABEL[recipe.cookingStyle]}</span>
            <span className={`season-badge ${fit}`}>{SEASON_FIT_LABEL[fit]}</span>
            {recipe.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>

          <div className="times">
            <div className="time-block">
              <span className="label">Actieve tijd</span>
              <span className="value">{formatMinutes(recipe.activePrepMinutes)}</span>
            </div>
            {recipe.totalTimeMinutes !== recipe.activePrepMinutes && (
              <div className="time-block">
                <span className="label">Totale tijd</span>
                <span className="value">{formatMinutes(recipe.totalTimeMinutes)}</span>
              </div>
            )}
            {cooked > 0 && (
              <div className="time-block">
                <span className="label">Gekookt</span>
                <span className="value">{cooked}×</span>
              </div>
            )}
          </div>

          {recipe.prepTasks && recipe.prepTasks.length > 0 && (
            <div className="prep-tasks">
              <h4>Voorbereiding</h4>
              {recipe.prepTasks.map((task, i) => (
                <div key={i} className="prep-task">
                  <div className="when">{task.relativeTime}{task.durationMinutes ? ` · ${task.durationMinutes} min` : ''}</div>
                  <div>{task.title}</div>
                  {task.note && <div className="note">{task.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
