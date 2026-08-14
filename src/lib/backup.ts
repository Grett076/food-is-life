/** Exporteer alle app-data als JSON-download */
export function exportData(): void {
  const keys = ['recipes', 'ingredients', 'history', 'preferences', 'stock', 'dataVersion'];
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString() };

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
    }
  }

  // Weekplanning: alle week-* keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith('week-')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)!); } catch { /* skip */ }
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `food-is-life-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Importeer een eerder geëxporteerd JSON-bestand */
export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target!.result as string) as Record<string, unknown>;
        const skip = new Set(['exportedAt']);
        for (const [key, value] of Object.entries(data)) {
          if (!skip.has(key)) localStorage.setItem(key, JSON.stringify(value));
        }
        resolve();
      } catch {
        reject(new Error('Ongeldig bestand'));
      }
    };
    reader.onerror = () => reject(new Error('Kon bestand niet lezen'));
    reader.readAsText(file);
  });
}
