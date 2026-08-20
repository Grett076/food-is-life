import { useState } from 'react';
import type { Recipe, Ingredient, MealHistory } from '../types';
import { seasonFit, SEASON_FIT_LABEL } from '../lib/season';
import { totalTimesCooked } from '../lib/history';
import { scaleAmount } from '../lib/scale';

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}u ${rem}m` : `${h}u`;
}

const STYLE_LABEL: Record<string, string> = {
  quick: 'Snel', normal: 'Normaal', weekend: 'Weekend', weekendProject: 'Weekendproject',
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
  const baseServings = recipe.servings ?? 2;
  const [servings, setServings] = useState(2);
  const factor = servings / baseServings;
  const hasSeasoningWarning = factor !== 1 && recipe.recipeIngredients?.some(
    (ri) => ri.amount && /\btl\b|snuf/i.test(ri.amount),
  );

  const isDivider = (name: string) => name === '---';

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2>{recipe.name}</h2>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            {onEdit && (
              <button onClick={() => onEdit(recipe)}
                style={{ fontSize: '.8rem', padding: '.3rem .65rem', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: 'none', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                <i className="fi fi-rr-pencil" /> Bewerken
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(recipe.id)}
                style={{ fontSize: '.8rem', padding: '.3rem .65rem', border: '1px solid #fcc', borderRadius: 5, cursor: 'pointer', background: 'none', color: '#c00', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                <i className="fi fi-rr-trash" /> Verwijderen
              </button>
            )}
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body recipe-detail">

          {recipe.description && (
            <p style={{ marginBottom: '.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{recipe.description}</p>
          )}

          <div className="tags" style={{ marginBottom: '.75rem' }}>
            <span className={`tag style-${recipe.cookingStyle}`}>{STYLE_LABEL[recipe.cookingStyle]}</span>
            <span className={`season-badge ${fit}`}>{SEASON_FIT_LABEL[fit]}</span>
            {recipe.favorite && <span className="tag" style={{ background: '#fff3cd', color: '#856404' }}>★ Favoriet</span>}
            {recipe.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>

          {/* Tijden + portiewisselaar */}
          <div className="times" style={{ alignItems: 'center' }}>
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
            {/* Portiewisselaar */}
            <div className="time-block" style={{ marginLeft: 'auto' }}>
              <span className="label">Porties</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.15rem' }}>
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  style={counterBtn}
                >−</button>
                <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '1.5rem', textAlign: 'center' }}>{servings}</span>
                <button
                  onClick={() => setServings((s) => s + 1)}
                  style={counterBtn}
                >+</button>
                {factor !== 1 && (
                  <button
                    onClick={() => setServings(baseServings)}
                    style={{ ...counterBtn, fontSize: '.7rem', color: 'var(--text-muted)', padding: '.2rem .4rem' }}
                    title="Terug naar origineel"
                  >↺</button>
                )}
              </div>
            </div>
          </div>

          {/* Voorbereiding */}
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

          {/* Ingrediënten */}
          {recipe.recipeIngredients && recipe.recipeIngredients.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <h4 style={sectionHead}>
                Ingrediënten
                {factor !== 1 && (
                  <span style={{ marginLeft: '.5rem', fontWeight: 400, color: 'var(--accent)', fontSize: '.75rem' }}>
                    ×{factor % 1 === 0 ? factor : factor.toFixed(2).replace(/\.?0+$/, '')} aangepast
                  </span>
                )}
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                <tbody>
                  {recipe.recipeIngredients.map((ing, i) => {
                    if (isDivider(ing.name)) {
                      return (
                        <tr key={i}>
                          <td colSpan={2} style={{ paddingTop: '.6rem', paddingBottom: '.2rem', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)' }}>
                            {(ing as any).amount || ''}
                          </td>
                        </tr>
                      );
                    }
                    const scaled = scaleAmount(ing.amount, factor);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '.35rem .5rem .35rem 0', color: scaled.seasoning ? '#92400e' : 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', width: '30%' }}>
                          {scaled.text || ''}
                          {scaled.seasoning && factor !== 1 && (
                            <span title="Kleine maat — proef zelf" style={{ marginLeft: '.3rem', fontSize: '.75rem' }}>⚠</span>
                          )}
                        </td>
                        <td style={{ padding: '.35rem .5rem' }}>
                          {ing.name}
                          {ing.note && <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}> — {ing.note}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {hasSeasoningWarning && (
                <p style={{ fontSize: '.75rem', color: '#92400e', marginTop: '.5rem' }}>
                  ⚠ Kleine maten (tl, snuf) zijn geschaald als richtlijn — proef zelf en pas aan.
                </p>
              )}
            </div>
          )}

          {/* Bereiding */}
          {recipe.steps && recipe.steps.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={sectionHead}>Bereiding</h4>
              <ol style={{ paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {recipe.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: '.9rem', lineHeight: 1.6 }}>
                    {step.text}
                    {step.durationMinutes && (
                      <span style={{ marginLeft: '.5rem', fontSize: '.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        ⏱ {step.durationMinutes} min
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!recipe.recipeIngredients && recipe.ingredients.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={sectionHead}>Ingrediënten</h4>
              <div className="tags">
                {allIngredients
                  .filter((i) => recipe.ingredients.includes(i.id))
                  .map((ing) => <span key={ing.id} className="tag">{ing.name}</span>)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: '.5rem',
};

const counterBtn: React.CSSProperties = {
  width: '1.6rem', height: '1.6rem',
  border: '1px solid var(--border)', borderRadius: 5,
  background: 'var(--surface)', cursor: 'pointer',
  fontSize: '1rem', lineHeight: 1, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};
