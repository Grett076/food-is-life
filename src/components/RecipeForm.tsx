import { useState } from 'react';
import type { Recipe, Ingredient, CookingStyle, SeasonTag, PrepTask, RecipeIngredient, RecipeStep } from '../types';

const STYLE_OPTIONS: { value: CookingStyle; label: string }[] = [
  { value: 'quick', label: 'Snel (< 30 min)' },
  { value: 'normal', label: 'Normaal (30–60 min)' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'weekendProject', label: 'Weekendproject' },
];

const SEASON_OPTIONS: { value: SeasonTag; label: string }[] = [
  { value: 'spring', label: 'Lente' },
  { value: 'summer', label: 'Zomer' },
  { value: 'autumn', label: 'Herfst' },
  { value: 'winter', label: 'Winter' },
  { value: 'yearRound', label: 'Heel het jaar' },
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface Props {
  existing?: Recipe;
  allIngredients: Ingredient[];
  onSave: (recipe: Recipe) => void;
  onClose: () => void;
}

export function RecipeForm({ existing, allIngredients, onSave, onClose }: Props) {
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [servings, setServings] = useState(existing?.servings ?? 4);
  const [activeMin, setActiveMin] = useState(existing?.activePrepMinutes ?? 30);
  const [totalMin, setTotalMin] = useState(existing?.totalTimeMinutes ?? 30);
  const [style, setStyle] = useState<CookingStyle>(existing?.cookingStyle ?? 'normal');
  const [seasons, setSeasons] = useState<Set<SeasonTag>>(new Set(existing?.seasonTags ?? []));
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '));
  const [selectedIngIds, setSelectedIngIds] = useState<Set<string>>(new Set(existing?.ingredients ?? []));
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(existing?.recipeIngredients ?? []);
  const [steps, setSteps] = useState<RecipeStep[]>(existing?.steps ?? []);
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>(existing?.prepTasks ?? []);
  const [favorite, setFavorite] = useState(existing?.favorite ?? false);
  const [error, setError] = useState('');

  function toggleSeason(s: SeasonTag) {
    setSeasons((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  }

  function toggleIng(id: string) {
    setSelectedIngIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function autoMatchIngredient(name: string): string | undefined {
    const lower = name.toLowerCase();
    const base = lower.split(',')[0].trim();
    return allIngredients.find((ing) => {
      const cat = ing.name.toLowerCase();
      return base.includes(cat) || cat.includes(base);
    })?.id;
  }

  function updateRI(i: number, partial: Partial<RecipeIngredient>) {
    setRecipeIngredients((rs) => rs.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, ...partial };
      // auto-match catalogus als naam verandert; leeg als geen match
      if ('name' in partial) {
        updated.ingredientId = autoMatchIngredient(updated.name);
      }
      return updated;
    }));
  }

  function updateStep(i: number, partial: Partial<RecipeStep>) {
    setSteps((ss) => ss.map((s, idx) => (idx === i ? { ...s, ...partial } : s)));
  }

  function updateTask(i: number, partial: Partial<PrepTask>) {
    setPrepTasks((ts) => ts.map((t, idx) => (idx === i ? { ...t, ...partial } : t)));
  }

  function submit() {
    if (!name.trim()) { setError('Naam is verplicht.'); return; }
    if (seasons.size === 0) { setError('Kies minimaal één seizoen.'); return; }

    // Voeg ingredientIds van recipeIngredients samen met handmatige selectie
    const ingFromRI = recipeIngredients
      .map((ri) => ri.ingredientId)
      .filter((id): id is string => !!id);
    const allIngIds = Array.from(new Set([...selectedIngIds, ...ingFromRI]));

    const recipe: Recipe = {
      id: existing?.id ?? slug(name) + '-' + Date.now(),
      name: name.trim(),
      description: description.trim() || undefined,
      servings,
      activePrepMinutes: activeMin,
      totalTimeMinutes: Math.max(activeMin, totalMin),
      cookingStyle: style,
      seasonTags: Array.from(seasons),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      ingredients: allIngIds,
      recipeIngredients: recipeIngredients.length > 0 ? recipeIngredients : undefined,
      steps: steps.filter((s) => s.text.trim()).length > 0 ? steps.filter((s) => s.text.trim()) : undefined,
      prepTasks: prepTasks.filter((t) => t.title.trim()).length > 0 ? prepTasks.filter((t) => t.title.trim()) : undefined,
      favorite,
    };
    onSave(recipe);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h2>{existing ? 'Recept bewerken' : 'Nieuw recept'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {error && <p style={{ color: '#c00', fontSize: '.85rem' }}>{error}</p>}

          <Field label="Naam">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boeuf bourguignon" style={inp} />
          </Field>

          <Field label="Omschrijving (optioneel)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Korte beschrijving" style={{ ...inp, resize: 'vertical' }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem' }}>
            <Field label="Porties">
              <input type="number" min={1} value={servings} onChange={(e) => setServings(+e.target.value)} style={inp} />
            </Field>
            <Field label="Actieve tijd (min)">
              <input type="number" min={1} value={activeMin} onChange={(e) => setActiveMin(+e.target.value)} style={inp} />
            </Field>
            <Field label="Totale tijd (min)">
              <input type="number" min={1} value={totalMin} onChange={(e) => setTotalMin(+e.target.value)} style={inp} />
            </Field>
          </div>

          <Field label="Kookstijl">
            <select value={style} onChange={(e) => setStyle(e.target.value as CookingStyle)} style={inp}>
              {STYLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="Seizoen">
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {SEASON_OPTIONS.map((o) => (
                <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', cursor: 'pointer', fontSize: '.88rem' }}>
                  <input type="checkbox" checked={seasons.has(o.value)} onChange={() => toggleSeason(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Tags (kommagescheiden)">
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="pasta, italiaans, winter" style={inp} />
          </Field>

          {/* Ingrediënten met hoeveelheden */}
          <Field label="Ingrediënten (met hoeveelheden)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {recipeIngredients.map((ri, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px auto', gap: '.3rem', alignItems: 'center' }}>
                  <input placeholder="Hoeveelheid" value={ri.amount ?? ''} onChange={(e) => updateRI(i, { amount: e.target.value })} style={{ ...inp, fontSize: '.82rem', padding: '.3rem .5rem' }} />
                  <input placeholder="Naam ingrediënt" value={ri.name} onChange={(e) => updateRI(i, { name: e.target.value })} style={{ ...inp, fontSize: '.82rem', padding: '.3rem .5rem' }} />
                  <select value={ri.ingredientId ?? ''} onChange={(e) => updateRI(i, { ingredientId: e.target.value || undefined })} style={{ ...inp, fontSize: '.78rem', padding: '.3rem .4rem' }}>
                    <option value="">— geen link —</option>
                    {allIngredients.sort((a, b) => a.name.localeCompare(b.name)).map((ing) => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                  <button onClick={() => setRecipeIngredients((rs) => rs.filter((_, idx) => idx !== i))}
                    style={removeBtn}>✕</button>
                </div>
              ))}
              <button onClick={() => setRecipeIngredients((rs) => [...rs, { name: '', amount: '' }])} style={addBtn}>
                <i className="fi fi-rr-plus" style={{ fontSize: '.8em' }} /> Ingrediënt
              </button>
            </div>
          </Field>

          {/* Bereidingsstappen */}
          <Field label="Bereidingsstappen">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: '.3rem', alignItems: 'start' }}>
                  <textarea value={step.text} onChange={(e) => updateStep(i, { text: e.target.value })}
                    rows={2} placeholder={`Stap ${i + 1}`}
                    style={{ ...inp, fontSize: '.85rem', resize: 'vertical' }} />
                  <input type="number" placeholder="Min" min={1} value={step.durationMinutes ?? ''}
                    onChange={(e) => updateStep(i, { durationMinutes: e.target.value ? +e.target.value : undefined })}
                    style={{ ...inp, fontSize: '.82rem', padding: '.3rem .5rem' }} />
                  <button onClick={() => setSteps((ss) => ss.filter((_, idx) => idx !== i))} style={removeBtn}>✕</button>
                </div>
              ))}
              <button onClick={() => setSteps((ss) => [...ss, { text: '' }])} style={addBtn}>
                <i className="fi fi-rr-plus" style={{ fontSize: '.8em' }} /> Stap
              </button>
            </div>
          </Field>

          {/* Prep-taken */}
          <Field label="Voorbereidingstaken (optioneel)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {prepTasks.map((task, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '.4rem', alignItems: 'start' }}>
                  <input placeholder="Moment (bv. Vrijdagavond)" value={task.relativeTime}
                    onChange={(e) => updateTask(i, { relativeTime: e.target.value })} style={{ ...inp, fontSize: '.85rem' }} />
                  <input placeholder="Taak" value={task.title}
                    onChange={(e) => updateTask(i, { title: e.target.value })} style={{ ...inp, fontSize: '.85rem' }} />
                  <button onClick={() => setPrepTasks((ts) => ts.filter((_, idx) => idx !== i))} style={removeBtn}>✕</button>
                  <input placeholder="Notitie" value={task.note ?? ''}
                    onChange={(e) => updateTask(i, { note: e.target.value })}
                    style={{ ...inp, gridColumn: '1 / 3', fontSize: '.82rem' }} />
                  <input type="number" placeholder="Min" min={1} value={task.durationMinutes ?? ''}
                    onChange={(e) => updateTask(i, { durationMinutes: e.target.value ? +e.target.value : undefined })}
                    style={{ ...inp, fontSize: '.82rem', padding: '.3rem .5rem' }} />
                </div>
              ))}
              <button onClick={() => setPrepTasks((ts) => [...ts, { title: '', relativeTime: '' }])} style={addBtn}>
                <i className="fi fi-rr-plus" style={{ fontSize: '.8em' }} /> Taak
              </button>
            </div>
          </Field>

          {/* Seizoensingrediënten (voor scoring) */}
          <Field label="Seizoensingrediënten (voor scoring)">
            <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.4rem' }}>
              Selecteer welke ingrediënten relevant zijn voor de seizoensscore. Worden automatisch overgenomen uit de ingrediëntenlijst als je een link instelt.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', maxHeight: 130, overflowY: 'auto', padding: '.25rem 0' }}>
              {allIngredients.sort((a, b) => a.name.localeCompare(b.name)).map((ing) => (
                <label key={ing.id} style={{
                  display: 'flex', alignItems: 'center', gap: '.3rem',
                  padding: '.2rem .45rem', borderRadius: 5,
                  background: selectedIngIds.has(ing.id) ? 'var(--accent-light)' : 'var(--tag-bg)',
                  cursor: 'pointer', fontSize: '.82rem',
                  border: selectedIngIds.has(ing.id) ? '1px solid var(--accent)' : '1px solid transparent',
                }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={selectedIngIds.has(ing.id)} onChange={() => toggleIng(ing.id)} />
                  {ing.name}
                </label>
              ))}
            </div>
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.9rem' }}>
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
            Markeer als favoriet
          </label>

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '.5rem 1rem', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
              <i className="fi fi-rr-cross-small" /> Annuleren
            </button>
            <button onClick={submit}
              style={{ padding: '.5rem 1.25rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}>
              <i className="fi fi-rr-check" /> {existing ? 'Opslaan' : 'Toevoegen'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
      <label style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '.4rem .6rem',
  border: '1px solid var(--border)', borderRadius: 6, fontSize: '.9rem',
};

const removeBtn: React.CSSProperties = {
  padding: '.3rem .5rem', cursor: 'pointer',
  border: '1px solid var(--border)', borderRadius: 5, background: 'none',
  alignSelf: 'center',
};

const addBtn: React.CSSProperties = {
  alignSelf: 'flex-start', padding: '.3rem .65rem',
  cursor: 'pointer', border: '1px solid var(--border)',
  borderRadius: 5, background: 'var(--tag-bg)', fontSize: '.82rem',
  display: 'inline-flex', alignItems: 'center', gap: '.3rem',
};
