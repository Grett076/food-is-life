import { fetchBackup, restoreBackup } from './centralApi';

export async function exportData(): Promise<void> {
  const data = await fetchBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `food-is-life-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target!.result as string) as Record<string, unknown>;
        await restoreBackup(data);
        resolve();
      } catch (cause) {
        reject(cause instanceof Error ? cause : new Error('Ongeldig bestand'));
      }
    };
    reader.onerror = () => reject(new Error('Kon bestand niet lezen'));
    reader.readAsText(file);
  });
}


