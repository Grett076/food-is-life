import { useState } from 'react';
import type { Recipe, Ingredient } from '../types';

interface Props {
  recipe: Recipe;
  allIngredients: Ingredient[];
  stock: string[];
  onDeplete: (ingredientIds: string[]) => void;
  onClose: () => void;
}

export function CookedModal({ recipe, allIngredients, stock, onDeplete, onClose }: Props) {
  const stockSet = new Set(stock);

  // Ingrediënten van dit recept die in de voorraad zitten
  const inStock = recipe.ingredients
    .map((id) => allIngredients.find((i) => i.id === id))
    .filter((i): i is Ingredient => !!i && stockSet.has(i.id));

  // Niet-gekoppelde ingrediënten (recipeIngredients zonder ingredientId)
  const unlinked = (recipe.recipeIngredients ?? []).filter((ri) => !ri.ingredientId);

  const [depleted, setDepleted] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setDepleted((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function confirm() {
    onDeplete(Array.from(depleted));
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>✓ {recipe.name} gekookt</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">

          {inStock.length > 0 ? (
            <>
              <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.88rem' }}>
                Wat is er nu op? Vink aan wat je hebt verbruikt — dat gaat uit je voorraad.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', marginBottom: '1.25rem' }}>
                {inStock.map((ing) => (
                  <label key={ing.id} style={{
                    display: 'flex', alignItems: 'center', gap: '.75rem',
                    padding: '.45rem .6rem', borderRadius: 6, cursor: 'pointer',
                    background: depleted.has(ing.id) ? '#fee2e2' : 'var(--tag-bg)',
                  }}>
                    <input
                      type="checkbox"
                      checked={depleted.has(ing.id)}
                      onChange={() => toggle(ing.id)}
                    />
                    <span style={{
                      flex: 1, fontSize: '.9rem',
                      textDecoration: depleted.has(ing.id) ? 'line-through' : 'none',
                      color: depleted.has(ing.id) ? 'var(--text-muted)' : 'var(--text)',
                    }}>
                      {ing.name}
                    </span>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>op</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '.88rem' }}>
              Geen van de ingrediënten van dit recept stonden in je voorraad.
            </p>
          )}

          {unlinked.length > 0 && (
            <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Niet bijgehouden: {unlinked.map((r) => r.name).join(', ')}.
            </p>
          )}

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => onDeplete([])}
              style={{ padding: '.45rem 1rem', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
              <i className="fi fi-rr-cross-small" /> Niets op
            </button>
            <button onClick={confirm}
              style={{ padding: '.45rem 1.1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
              <i className="fi fi-rr-check" /> {depleted.size > 0 ? `${depleted.size} uit voorraad` : 'Klaar'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
