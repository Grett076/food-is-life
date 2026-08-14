import { useState } from 'react';
import type { PlannedDay, Recipe, Ingredient, TedSchedule } from '../types';
import { isTedSchoolDay } from '../lib/ted';

interface ShoppingItem {
  ingredientId: string;
  ingredientName: string;
  // amount per recipe, met recept als context
  entries: { amount?: string; recipeName: string }[];
}

interface Props {
  week: PlannedDay[];
  recipes: Recipe[];
  allIngredients: Ingredient[];
  stock: string[];
  tedSchedule: TedSchedule;
  onAddToStock: (ids: string[]) => void;
  onClose: () => void;
}

export function ShoppingList({ week, recipes, allIngredients, stock, tedSchedule, onAddToStock, onClose }: Props) {
  const stockSet = new Set(stock);

  // Verzamel alle benodigde ingrediënten uit geplande recepten
  const needed = new Map<string, ShoppingItem>();

  for (const day of week) {
    if (!day.recipeId) continue;
    const recipe = recipes.find((r) => r.id === day.recipeId);
    if (!recipe) continue;

    for (const ri of recipe.recipeIngredients ?? []) {
      if (!ri.ingredientId) continue;
      const existing = needed.get(ri.ingredientId);
      const entry = { amount: ri.amount, recipeName: recipe.name };
      if (existing) {
        existing.entries.push(entry);
      } else {
        const ing = allIngredients.find((i) => i.id === ri.ingredientId);
        needed.set(ri.ingredientId, {
          ingredientId: ri.ingredientId,
          ingredientName: ing?.name ?? ri.ingredientId,
          entries: [entry],
        });
      }
    }
  }

  const toBuy = Array.from(needed.values()).filter((i) => !stockSet.has(i.ingredientId));
  const alreadyHave = Array.from(needed.values()).filter((i) => stockSet.has(i.ingredientId));

  // Lokale check-state voor "koop ik vandaag"
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggleChecked(id: string) {
    setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function markBoughtAsStock() {
    onAddToStock(Array.from(checked));
    onClose();
  }

  const plannedCount = week.filter((d) => d.recipeId).length;
  const boterhamDagen = week.filter((d) => d.lunch === 'boterham').length;
  const tedDagen = week.filter((d) => isTedSchoolDay(d.date, tedSchedule)).length;

  // Seizoensfruit suggestie voor Ted
  const fruitInSeizoen = allIngredients
    .filter((i) => ['mango','grape','blueberry','kiwi','banana','orange','strawberry','apple','pear','melon'].includes(i.id))
    .filter((i) => {
      if (!i.seasonStartMonth || !i.seasonEndMonth) return true; // heel jaar
      const m = new Date().getMonth() + 1;
      return i.seasonStartMonth <= i.seasonEndMonth
        ? m >= i.seasonStartMonth && m <= i.seasonEndMonth
        : m >= i.seasonStartMonth || m <= i.seasonEndMonth;
    })
    .slice(0, 3)
    .map((i) => i.name);

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>Boodschappenlijst</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">

          {plannedCount === 0 ? (
            <p className="text-muted">Geen recepten gepland deze week.</p>
          ) : (
            <>
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.85rem' }}>
                Op basis van {plannedCount} geplande maaltijd{plannedCount !== 1 ? 'en' : ''} deze week.
                Afvinken = kopen, daarna in je voorraad zetten.
              </p>

              {/* Te kopen */}
              {toBuy.length > 0 ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={sectionHead}>Nog te kopen ({toBuy.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                    {toBuy.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)).map((item) => (
                      <label key={item.ingredientId} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '.75rem',
                        padding: '.45rem .5rem', borderRadius: 6,
                        background: checked.has(item.ingredientId) ? '#f0fdf4' : 'var(--tag-bg)',
                        cursor: 'pointer',
                      }}>
                        <input
                          type="checkbox"
                          checked={checked.has(item.ingredientId)}
                          onChange={() => toggleChecked(item.ingredientId)}
                          style={{ marginTop: '.15rem', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontWeight: 500, fontSize: '.9rem',
                            textDecoration: checked.has(item.ingredientId) ? 'line-through' : 'none',
                            color: checked.has(item.ingredientId) ? 'var(--text-muted)' : 'var(--text)',
                          }}>
                            {item.ingredientName}
                          </span>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>
                            {item.entries.map((e, i) => (
                              <span key={i}>
                                {i > 0 && ' · '}
                                {e.amount && <b>{e.amount} </b>}
                                voor {e.recipeName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#15803d', fontWeight: 600, marginBottom: '1rem', fontSize: '.9rem' }}>
                  ✓ Je hebt alles al in huis.
                </p>
              )}

              {/* Al in huis — maar controleer hoeveel */}
              {alreadyHave.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={sectionHead}>In huis — controleer hoeveel ({alreadyHave.length})</h3>
                  <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                    Je hebt dit in huis, maar of je genoeg hebt weet de app niet. Even checken.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                    {alreadyHave.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)).map((item) => (
                      <span key={item.ingredientId} style={{
                        padding: '.2rem .55rem', borderRadius: 5, fontSize: '.82rem',
                        background: '#fef9c3', color: '#854d0e',
                        border: '1px solid #fde68a',
                      }}>
                        ⚠ {item.ingredientName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Niet gelinkte ingrediënten */}
              <UnlinkedNote week={week} recipes={recipes} />

              {/* Jouw lunch */}
              {boterhamDagen > 0 && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#fef9c3', borderRadius: 8, border: '1px solid #fde68a' }}>
                  <h3 style={{ ...sectionHead, color: '#854d0e', marginBottom: '.5rem' }}>
                    🥪 Jouw lunch — {boterhamDagen} dag{boterhamDagen !== 1 ? 'en' : ''} boterham
                  </h3>
                  <div style={{ fontSize: '.85rem', display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                    <span>🍞 Brood — {boterhamDagen * 2} sneden (~{Math.ceil(boterhamDagen / 7)} brood)</span>
                    <span>🍖 Ham — {boterhamDagen * 2} plakken</span>
                    <span>🧀 Kaas — {boterhamDagen * 2} plakken</span>
                    <span>🥒 Komkommer — {boterhamDagen <= 2 ? '½' : boterhamDagen <= 4 ? '1' : '1½'}</span>
                  </div>
                </div>
              )}

              {/* Ted's schoollunch */}
              {tedDagen > 0 && (
                <div style={{ marginTop: '.75rem', padding: '1rem', background: '#dbeafe', borderRadius: 8, border: '1px solid #93c5fd' }}>
                  <h3 style={{ ...sectionHead, color: '#1e40af', marginBottom: '.5rem' }}>
                    👦 Ted's schoollunch — {tedDagen} dag{tedDagen !== 1 ? 'en' : ''}
                  </h3>
                  <div style={{ fontSize: '.85rem', display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                    <span>🍞 Extra brood — {tedDagen * 3} sneden</span>
                    <span>🍎 Fruit — {tedDagen} portie{tedDagen !== 1 ? 's' : ''}</span>
                    {fruitInSeizoen.length > 0 && (
                      <span style={{ color: '#1e40af', fontSize: '.78rem' }}>
                        Nu in seizoen: {fruitInSeizoen.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Acties */}
              {checked.size > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                  <span className="text-muted">{checked.size} afgevinkt</span>
                  <button
                    onClick={markBoughtAsStock}
                    style={{ padding: '.45rem 1.1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Zet in voorraad & sluit
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Kleine hint als er receptingredïenten zijn zonder ingredientId-koppeling */
function UnlinkedNote({ week, recipes }: { week: PlannedDay[]; recipes: Recipe[] }) {
  const unlinkedRecipes = week
    .filter((d) => d.recipeId)
    .map((d) => recipes.find((r) => r.id === d.recipeId))
    .filter((r): r is Recipe => !!r)
    .filter((r) => (r.recipeIngredients ?? []).some((ri) => !ri.ingredientId));

  if (unlinkedRecipes.length === 0) return null;

  return (
    <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.75rem' }}>
      <b>Let op:</b> sommige ingrediënten van {unlinkedRecipes.map((r) => r.name).join(', ')} zijn niet gekoppeld en staan niet op de lijst.
      Bewerk het recept om koppelingen toe te voegen.
    </p>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: '.5rem',
};
