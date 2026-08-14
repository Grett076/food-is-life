import { useState } from 'react';
import type { Recipe, Ingredient, CookingStyle, SeasonTag, PrepTask } from '../types';

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

function emptyTask(): PrepTask {
  return { title: '', relativeTime: '', durationMinutes: undefined, note: '' };
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
  const [activeMin, setActiveMin] = useState(existing?.activePrepMinutes ?? 30);
  const [totalMin, setTotalMin] = useState(existing?.totalTimeMinutes ?? 30);
  const [style, setStyle] = useState<CookingStyle>(existing?.cookingStyle ?? 'normal');
  const [seasons, setSeasons] = useState<Set<SeasonTag>>(new Set(existing?.seasonTags ?? []));
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '));
  const [selectedIngIds, setSelectedIngIds] = useState<Set<string>>(new Set(existing?.ingredients ?? []));
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>(existing?.prepTasks ?? []);
  const [favorite, setFavorite] = useState(existing?.favorite ?? false);
  const [error, setError] = useState('');

  function toggleSeason(s: SeasonTag) {
    setSeasons((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function toggleIng(id: string) {
    setSelectedIngIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateTask(i: number, partial: Partial<PrepTask>) {
    setPrepTasks((ts) => ts.map((t, idx) => (idx === i ? { ...t, ...partial } : t)));
  }

  function submit() {
    if (!name.trim()) { setError('Naam is verplicht.'); return; }
    if (seasons.size === 0) { setError('Kies minimaal één seizoen.'); return; }

    const recipe: Recipe = {
      id: existing?.id ?? slug(name) + '-' + Date.now(),
      name: name.trim(),
      description: description.trim() || undefined,
      activePrepMinutes: activeMin,
      totalTimeMinutes: Math.max(activeMin, totalMin),
      cookingStyle: style,
      seasonTags: Array.from(seasons),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      ingredients: Array.from(selectedIngIds),
      prepTasks: prepTasks.filter((t) => t.title.trim()),
      favorite,
    };
    onSave(recipe);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2>{existing ? 'Recept bewerken' : 'Nieuw recept'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {error && <p style={{ color: '#c00', fontSize: '.85rem' }}>{error}</p>}

          <Field label="Naam">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Boeuf bourguignon" />
          </Field>

          <Field label="Omschrijving (optioneel)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Korte beschrijving van het gerecht" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <Field label="Actieve tijd (min)">
              <input type="number" min={1} value={activeMin} onChange={(e) => setActiveMin(+e.target.value)} />
            </Field>
            <Field label="Totale tijd (min)">
              <input type="number" min={1} value={totalMin} onChange={(e) => setTotalMin(+e.target.value)} />
            </Field>
          </div>

          <Field label="Kookstijl">
            <select value={style} onChange={(e) => setStyle(e.target.value as CookingStyle)}>
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
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="pasta, italiaans, winter" />
          </Field>

          <Field label="Ingrediënten">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', maxHeight: 160, overflowY: 'auto', padding: '.25rem 0' }}>
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

          <Field label="Voorbereidingstaken">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {prepTasks.map((task, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '.4rem', alignItems: 'start' }}>
                  <input placeholder="Moment (bv. Vrijdagavond)" value={task.relativeTime}
                    onChange={(e) => updateTask(i, { relativeTime: e.target.value })} />
                  <input placeholder="Taak" value={task.title}
                    onChange={(e) => updateTask(i, { title: e.target.value })} />
                  <button onClick={() => setPrepTasks((ts) => ts.filter((_, idx) => idx !== i))}
                    style={{ padding: '.3rem .5rem', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 5, background: 'none' }}>✕</button>
                  <input placeholder="Notitie (optioneel)" value={task.note ?? ''}
                    onChange={(e) => updateTask(i, { note: e.target.value })}
                    style={{ gridColumn: '1 / 3' }} />
                  <input type="number" placeholder="Min" min={1} value={task.durationMinutes ?? ''}
                    onChange={(e) => updateTask(i, { durationMinutes: e.target.value ? +e.target.value : undefined })} />
                </div>
              ))}
              <button onClick={() => setPrepTasks((ts) => [...ts, emptyTask()])}
                style={{ alignSelf: 'flex-start', padding: '.3rem .65rem', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--tag-bg)', fontSize: '.82rem' }}>
                + Taak toevoegen
              </button>
            </div>
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.9rem' }}>
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
            Markeer als favoriet
          </label>

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '.5rem 1rem', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}>
              Annuleren
            </button>
            <button onClick={submit}
              style={{ padding: '.5rem 1.25rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              {existing ? 'Opslaan' : 'Toevoegen'}
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
      <label style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
