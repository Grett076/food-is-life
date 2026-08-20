import { useState } from 'react';
import type { PlannedDay, Recipe, Ingredient } from '../types';

interface ShoppingItem {
  ingredientId: string;
  ingredientName: string;
  entries: { amount?: string; recipeName: string }[];
}

interface Props {
  week: PlannedDay[];
  recipes: Recipe[];
  allIngredients: Ingredient[];
  stock: string[];
  onAddToStock: (ids: string[]) => void;
}

export function ShoppingList({ week, recipes, allIngredients, stock, onAddToStock }: Props) {
  const stockSet = new Set(stock);
  const needed = new Map<string, ShoppingItem>();

  for (const day of week) {
    if (!day.recipeId) continue;
    const recipe = recipes.find((r) => r.id === day.recipeId);
    if (!recipe) continue;
    for (const ri of recipe.recipeIngredients ?? []) {
      if (!ri.ingredientId) continue;
      const existing = needed.get(ri.ingredientId);
      const entry = { amount: ri.amount, recipeName: recipe.name };
      if (existing) { existing.entries.push(entry); }
      else {
        const ing = allIngredients.find((i) => i.id === ri.ingredientId);
        needed.set(ri.ingredientId, { ingredientId: ri.ingredientId, ingredientName: ing?.name ?? ri.ingredientId, entries: [entry] });
      }
    }
  }

  const toBuy = Array.from(needed.values()).filter((i) => !stockSet.has(i.ingredientId));
  const alreadyHave = Array.from(needed.values()).filter((i) => stockSet.has(i.ingredientId));
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggleChecked(id: string) {
    setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const plannedCount = week.filter((d) => d.recipeId).length;
  const boterhamDagen = week.filter((d) => d.lunch === 'boterham').length;

  if (plannedCount === 0) {
    return <p className="text-muted">Geen recepten gepland deze week.</p>;
  }

  return (
    <div>
      <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.85rem' }}>
        Op basis van {plannedCount} geplande maaltijd{plannedCount !== 1 ? 'en' : ''} deze week.
      </p>

      {toBuy.length > 0 ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={sh}>Nog te kopen ({toBuy.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
            {toBuy.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)).map((item) => (
              <label key={item.ingredientId} style={{
                display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.45rem .5rem',
                borderRadius: 6, background: checked.has(item.ingredientId) ? '#f0fdf4' : 'var(--tag-bg)', cursor: 'pointer',
              }}>
                <input type="checkbox" checked={checked.has(item.ingredientId)} onChange={() => toggleChecked(item.ingredientId)} style={{ marginTop: '.15rem', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, fontSize: '.9rem', textDecoration: checked.has(item.ingredientId) ? 'line-through' : 'none', color: checked.has(item.ingredientId) ? 'var(--text-muted)' : 'var(--text)' }}>
                    {item.ingredientName}
                  </span>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>
                    {item.entries.map((e, i) => <span key={i}>{i > 0 && ' · '}{e.amount && <b>{e.amount} </b>}voor {e.recipeName}</span>)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ color: '#15803d', fontWeight: 600, marginBottom: '1rem', fontSize: '.9rem' }}>✓ Je hebt alles al in huis.</p>
      )}

      {alreadyHave.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={sh}>In huis — controleer hoeveel ({alreadyHave.length})</h3>
          <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>Je hebt dit in huis, maar of je genoeg hebt weet de app niet.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
            {alreadyHave.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)).map((item) => (
              <span key={item.ingredientId} style={{ padding: '.2rem .55rem', borderRadius: 5, fontSize: '.82rem', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>
                ⚠ {item.ingredientName}
              </span>
            ))}
          </div>
        </div>
      )}

      <UnlinkedNote week={week} recipes={recipes} />

      {boterhamDagen > 0 && (
        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--weekend-bg)', borderRadius: 8, border: '1px solid var(--weekend-border)' }}>
          <h3 style={{ ...sh, color: '#7a5800', marginBottom: '.5rem' }}>🥪 Lunch — {boterhamDagen} dag{boterhamDagen !== 1 ? 'en' : ''}</h3>
          <div style={{ fontSize: '.85rem', display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
            <span>Brood — {boterhamDagen * 2} sneden</span>
            <span>Ham — {boterhamDagen * 2} plakken</span>
            <span>Kaas — {boterhamDagen * 2} plakken</span>
            <span>Komkommer — {boterhamDagen <= 2 ? '½' : boterhamDagen <= 4 ? '1' : '1½'}</span>
          </div>
        </div>
      )}

      {checked.size > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <span className="text-muted">{checked.size} afgevinkt</span>
          <button
            onClick={() => onAddToStock(Array.from(checked))}
            style={{ padding: '.45rem 1.1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}
          >
            <i className="fi fi-rr-basket" /> In voorraad
          </button>
        </div>
      )}
    </div>
  );
}

function UnlinkedNote({ week, recipes }: { week: PlannedDay[]; recipes: Recipe[] }) {
  const unlinked = week.filter((d) => d.recipeId).map((d) => recipes.find((r) => r.id === d.recipeId))
    .filter((r): r is Recipe => !!r).filter((r) => (r.recipeIngredients ?? []).some((ri) => !ri.ingredientId));
  if (unlinked.length === 0) return null;
  return <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.75rem' }}><b>Let op:</b> {unlinked.map((r) => r.name).join(', ')} — niet alle ingrediënten zijn gekoppeld.</p>;
}

const sh: React.CSSProperties = { fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: '.5rem' };
