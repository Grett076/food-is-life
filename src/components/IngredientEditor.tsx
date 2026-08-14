import { useState } from 'react';
import type { Ingredient } from '../types';

const MONTHS = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const MONTHS_FULL = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];

interface Props {
  ingredients: Ingredient[];
  onUpdate: (ingredient: Ingredient) => void;
  onAdd: (ingredient: Ingredient) => void;
  onClose: () => void;
  inline?: boolean;
}

export function IngredientEditor({ ingredients, onUpdate, onAdd, onClose, inline }: Props) {
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  function save(ing: Ingredient) {
    if (ingredients.some((i) => i.id === ing.id)) onUpdate(ing);
    else onAdd(ing);
    setEditing(null);
  }

  function startNew() {
    if (!newName.trim()) return;
    setEditing({ id: newName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: newName.trim() });
    setNewName('');
  }

  const body = editing ? (
    <IngredientEditForm ingredient={editing} onSave={save} onCancel={() => setEditing(null)} />
  ) : (
    <>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input type="search" placeholder="Zoeken…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 140, padding: '.4rem .7rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.9rem' }} />
        <input placeholder="Nieuw ingrediënt…" value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && startNew()}
          style={{ flex: 1, minWidth: 160, padding: '.4rem .7rem', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.9rem' }} />
        <button onClick={startNew}
          style={{ padding: '.4rem .9rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + Toevoegen
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Naam', 'Seizoen', 'Piek', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '.4rem .5rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.sort((a, b) => a.name.localeCompare(b.name)).map((ing) => (
              <tr key={ing.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '.4rem .5rem', fontWeight: 500 }}>{ing.name}</td>
                <td style={{ padding: '.4rem .5rem', color: 'var(--text-muted)' }}>
                  {ing.seasonStartMonth && ing.seasonEndMonth
                    ? `${MONTHS[ing.seasonStartMonth - 1]} – ${MONTHS[ing.seasonEndMonth - 1]}`
                    : 'Heel het jaar'}
                </td>
                <td style={{ padding: '.4rem .5rem', color: 'var(--text-muted)' }}>
                  {ing.peakMonths?.map((m) => MONTHS[m - 1]).join(', ') ?? '—'}
                </td>
                <td style={{ padding: '.4rem .5rem' }}>
                  <button onClick={() => setEditing({ ...ing })}
                    style={{ fontSize: '.78rem', padding: '.2rem .5rem', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, background: 'none' }}>
                    Bewerken
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (inline) return <div>{body}</div>;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2>Seizoeningrediënten</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{body}</div>
      </div>
    </div>
  );
}

function IngredientEditForm({ ingredient, onSave, onCancel }: {
  ingredient: Ingredient;
  onSave: (i: Ingredient) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(ingredient.name);
  const [start, setStart] = useState<number | ''>(ingredient.seasonStartMonth ?? '');
  const [end, setEnd] = useState<number | ''>(ingredient.seasonEndMonth ?? '');
  const [peak, setPeak] = useState<Set<number>>(new Set(ingredient.peakMonths ?? []));

  function togglePeak(m: number) {
    setPeak((p) => { const n = new Set(p); n.has(m) ? n.delete(m) : n.add(m); return n; });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={lbl}>Naam
        <input value={name} onChange={(e) => setName(e.target.value)} style={inp} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        <label style={lbl}>Seizoen start (leeg = heel jaar)
          <select value={start} onChange={(e) => setStart(e.target.value === '' ? '' : +e.target.value)} style={inp}>
            <option value="">— heel het jaar —</option>
            {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label style={lbl}>Seizoen eind
          <select value={end} onChange={(e) => setEnd(e.target.value === '' ? '' : +e.target.value)} style={inp}>
            <option value="">—</option>
            {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </label>
      </div>
      <div>
        <span style={{ ...lbl, display: 'block', marginBottom: '.3rem' }}>Piekmaanden</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
          {MONTHS_FULL.map((m, i) => (
            <label key={i} style={{
              padding: '.25rem .5rem', borderRadius: 5, cursor: 'pointer', fontSize: '.82rem',
              background: peak.has(i + 1) ? 'var(--accent)' : 'var(--tag-bg)',
              color: peak.has(i + 1) ? 'white' : 'var(--text-muted)',
            }}>
              <input type="checkbox" style={{ display: 'none' }} checked={peak.has(i + 1)} onChange={() => togglePeak(i + 1)} />
              {m.slice(0, 3)}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '.45rem 1rem', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}>
          Annuleren
        </button>
        <button onClick={() => onSave({ ...ingredient, name: name.trim(),
          seasonStartMonth: start !== '' ? +start : undefined,
          seasonEndMonth: end !== '' ? +end : undefined,
          peakMonths: peak.size > 0 ? Array.from(peak).sort((a, b) => a - b) : undefined,
        })} style={{ padding: '.45rem 1.25rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          Opslaan
        </button>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '.25rem',
  fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.04em', color: 'var(--text-muted)',
};
const inp: React.CSSProperties = {
  width: '100%', padding: '.4rem .6rem',
  border: '1px solid var(--border)', borderRadius: 6, fontSize: '.9rem',
  marginTop: '.2rem',
};
