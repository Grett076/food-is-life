import type { TedSchedule } from '../types';

// Gebruik UTC overal om DST-problemen te vermijden
function getMondayStr(date: Date): string {
  const d = new Date(date);
  const dow = d.getUTCDay(); // 0=zo, 1=ma, ..., 6=za
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

/**
 * Is dit de aankomstweek van Ted?
 * De woensdag van deze week (maandag + 2) is een veelvoud van 14 dagen
 * verwijderd van de referentiewoensdag.
 */
function isArrivalWeek(mondayStr: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;
  const wed = addDays(mondayStr, 2); // woensdag = maandag + 2
  const diff = diffDays(wed, schedule.referenceWednesday);
  return diff % 14 === 0;
}

/**
 * Is dit een Ted-schooldag?
 * - Do (4) en vr (5): aankomstweek van die week
 * - Ma (1) en di (2): vertrekweek = week ná de aankomstweek
 */
export function isTedSchoolDay(date: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;

  const monday = getMondayStr(new Date(date));
  const overrides = schedule.weekOverrides ?? {};

  // Week-override heeft voorrang
  if (monday in overrides) {
    if (!overrides[monday]) return false;
    const dow = new Date(date).getUTCDay();
    return [1, 2, 4, 5].includes(dow); // ma, di, do, vr
  }

  const dow = new Date(date).getUTCDay();

  if (dow === 4 || dow === 5) {
    // Do en vr horen bij de aankomstweek
    return isArrivalWeek(monday, schedule);
  }
  if (dow === 1 || dow === 2) {
    // Ma en di horen bij de week NA de aankomstweek
    return isArrivalWeek(addDays(monday, -7), schedule);
  }
  return false;
}

/** Is Ted fysiek aanwezig op deze dag? (do t/m di van zijn verblijf) */
export function isInTedPeriod(date: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;
  const monday = getMondayStr(new Date(date));
  const overrides = schedule.weekOverrides ?? {};
  if (monday in overrides) return overrides[monday];
  const dow = new Date(date).getUTCDay();
  // Do(4), vr(5), za(6), zo(0) van aankomstweek + ma(1), di(2) van volgende week
  if ([4, 5, 6, 0].includes(dow)) return isArrivalWeek(monday, schedule);
  if ([1, 2].includes(dow)) return isArrivalWeek(addDays(monday, -7), schedule);
  return false;
}

/** Heeft deze week (ma-zo) minstens één Ted-schooldag? */
export function isTedWeek(mondayStr: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;
  const overrides = schedule.weekOverrides ?? {};
  if (mondayStr in overrides) return overrides[mondayStr];
  // Aankomstweek (do+vr) OF de week erna (ma+di)
  return isArrivalWeek(mondayStr, schedule) || isArrivalWeek(addDays(mondayStr, -7), schedule);
}

/** De dichtstbijzijnde aanstaande woensdag */
export function nextWednesday(): string {
  const d = new Date();
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow <= 3 ? 3 - dow : 10 - dow));
  return d.toISOString().slice(0, 10);
}
