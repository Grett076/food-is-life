import type { TedSchedule } from '../types';

function getMondayStr(date: Date): string {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Is Ted aanwezig op deze dag? (wo-avond t/m di, elke 2 weken)
 * Cyclus t.o.v. referentiewoensdag:
 *   0 = wo (aankomst avond, niet thuis overdag)
 *   1 = do ✓ school
 *   2 = vr ✓ school
 *   3 = za (Ted is er, geen school)
 *   4 = zo (Ted is er, geen school)
 *   5 = ma ✓ school
 *   6 = di ✓ school
 *   7 = wo (vertrek ochtend)
 *   8–13 = niet bij jou
 */
function cycleDay(date: string, referenceWednesday: string): number {
  const diff = Math.round(
    (new Date(date).getTime() - new Date(referenceWednesday).getTime()) / 86_400_000,
  );
  return ((diff % 14) + 14) % 14;
}

/** Geeft true als Ted een schoollunch nodig heeft op deze dag */
export function isTedSchoolDay(date: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;

  // Controleer week-override eerst
  const monday = getMondayStr(new Date(date));
  if (monday in schedule.weekOverrides) {
    const weekOn = schedule.weekOverrides[monday];
    if (!weekOn) return false;
    // Week geforceerd aan: alleen op echte schooldagen (ma=1, di=2, do=4, vr=5)
    const dow = new Date(date).getDay();
    return [1, 2, 4, 5].includes(dow);
  }

  return [1, 2, 5, 6].includes(cycleDay(date, schedule.referenceWednesday));
}

/** Geeft true als Ted fysiek aanwezig is (do t/m di van zijn week) */
export function isInTedPeriod(date: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;
  const monday = getMondayStr(new Date(date));
  if (monday in schedule.weekOverrides) return schedule.weekOverrides[monday];
  return [1, 2, 3, 4, 5, 6].includes(cycleDay(date, schedule.referenceWednesday));
}

/** Is deze week (geïdentificeerd door maandag-datum) een Ted-week? */
export function isTedWeek(mondayStr: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;
  if (mondayStr in schedule.weekOverrides) return schedule.weekOverrides[mondayStr];
  // Week is een Ted-week als er minstens één schooldag in zit
  for (let i = 1; i <= 7; i++) {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + i - 1);
    const date = d.toISOString().slice(0, 10);
    if ([1, 2, 5, 6].includes(cycleDay(date, schedule.referenceWednesday))) return true;
  }
  return false;
}

/** De dichtstbijzijnde aanstaande woensdag */
export function nextWednesday(): string {
  const d = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow <= 3 ? 3 - dow : 10 - dow));
  return d.toISOString().slice(0, 10);
}
