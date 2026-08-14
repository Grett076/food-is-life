import type { Recipe, Ingredient, MealHistory } from '../types';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';
import { totalTimesCooked } from '../lib/history';

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

const STYLE_LABEL: Record<string, string> = {
  quick: 'Snel',
  normal: 'Normaal',
  weekend: 'Weekend',
  weekendProject: 'Weekendproject',
};

interface Props {
  recipe: Recipe;
  allIngredients: Ingredient[];
  history: MealHistory[];
  month: number;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function RecipeDetail({ recipe, allIngredients, history, month, onEdit, onDelete, onClose }: Props) {
  const fit = seasonFit(recipe.ingredients, allIngredients, month);
  const cooked = totalTimesCooked(recipe.id, history);

  const usedIngredients = allIngredients.filter((i) => recipe.ingredients.includes(i.id));

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{recipe.name}</h2>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            {onEdit && (
              <button onClick={() => onEdit(recipe)}
                style={{ fontSize: '.8rem', padding: '.3rem .65rem', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: 'none' }}>
                Bewerken
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(recipe.id)}
                style={{ fontSize: '.8rem', padding: '.3rem .65rem', border: '1px solid #fcc', borderRadius: 5, cursor: 'pointer', background: 'none', color: '#c00' }}>
                Verwijderen
              </button>
            )}
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="modal-body recipe-detail">

          {recipe.description && (
            <p style={{ marginBottom: '.75rem', color: 'var(--text-muted)' }}>{recipe.description}</p>
          )}

          <div className="tags" style={{ marginBottom: '.75rem' }}>
            <span className={`tag style-${recipe.cookingStyle}`}>{STYLE_LABEL[recipe.cookingStyle]}</span>
            <span className={`season-badge ${fit}`}>{SEASON_FIT_LABEL[fit]}</span>
            {recipe.favorite && <span className="tag" style={{ background: '#fff3cd', color: '#856404' }}>★ Favoriet</span>}
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

          {usedIngredients.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: '.4rem' }}>
                Ingrediënten
              </h4>
              <div className="tags">
                {usedIngredients.map((ing) => (
                  <span key={ing.id} className="tag">{ing.name}</span>
                ))}
              </div>
            </div>
          )}

          {recipe.prepTasks && recipe.prepTasks.length > 0 && (
            <div className="prep-tasks">
              <h4>Voorbereiding</h4>
              {recipe.prepTasks.map((task, i) => (
                <div key={i} className="prep-task">
                  <div className="when">
                    {task.relativeTime}
                    {task.durationMinutes ? ` · ${task.durationMinutes} min` : ''}
                  </div>
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
