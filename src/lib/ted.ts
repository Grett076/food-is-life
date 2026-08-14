import type { TedSchedule } from '../types';

/** Parse YYYY-MM-DD als lokale datum en geef lokale dag van de week (0=zo…6=za) */
function localDow(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Tel n dagen op/af bij een YYYY-MM-DD string (lokale datum) */
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const result = new Date(y, m - 1, d + n);
  return [
    result.getFullYear(),
    String(result.getMonth() + 1).padStart(2, '0'),
    String(result.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Verschil in kalenderdagen tussen twee YYYY-MM-DD strings */
function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round(
    (Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000,
  );
}

/** Is deze woensdag een ingepland Ted-aankomst (op basis van schema)? */
function isScheduledArrival(wednesdayStr: string, referenceWednesday: string): boolean {
  return diffDays(wednesdayStr, referenceWednesday) % 14 === 0;
}

/** Is Ted op deze specifieke woensdag aangekomen (schema + overrides)? */
export function isArrivedWednesday(wednesdayStr: string, schedule: TedSchedule): boolean {
  const overrides = schedule.arrivalOverrides ?? {};
  if (wednesdayStr in overrides) return overrides[wednesdayStr];
  if (!schedule.referenceWednesday) return false;
  return isScheduledArrival(wednesdayStr, schedule.referenceWednesday);
}

/**
 * Geeft de woensdag die bij deze datum hoort als Ted-aankomst:
 * - do (4) / vr (5): de woensdag van déze week
 * - ma (1) / di (2): de woensdag van de vorige week
 */
function arrivalWednesdayFor(dateStr: string): string {
  const dow = localDow(dateStr);
  if (dow === 4 || dow === 5) return addDays(dateStr, 3 - dow); // do: -1, vr: -2
  if (dow === 1 || dow === 2) return addDays(dateStr, -(dow + 4)); // ma: -5, di: -6
  return ''; // niet relevant
}

/** Is dit een Ted-schooldag? */
export function isTedSchoolDay(date: string, schedule: TedSchedule): boolean {
  const dow = localDow(date);
  if (![1, 2, 4, 5].includes(dow)) return false; // alleen ma/di/do/vr
  const wed = arrivalWednesdayFor(date);
  return isArrivedWednesday(wed, schedule);
}

/**
 * Ted-info voor een week (maandag t/m zondag):
 * - arrivalWed: de woensdag van aankomst (als die in deze week valt)
 * - departureWed: de woensdag van vertrek (als ma/di in deze week Ted-schooldagen zijn)
 * - hasSchoolDays: zijn er schooldagen deze week?
 */
export function tedWeekInfo(mondayStr: string, schedule: TedSchedule) {
  const thisWed = addDays(mondayStr, 2);
  const prevWed = addDays(mondayStr, -5); // vorige woensdag = maandag - 5 dagen

  const arrivalThisWeek = isArrivedWednesday(thisWed, schedule);
  const arrivalPrevWeek = isArrivedWednesday(prevWed, schedule);

  return {
    /** Aankomst-woensdag als Ted dit week arriveert (do/vr) */
    arrivalWed: arrivalThisWeek ? thisWed : null,
    /** Vertrek-woensdag als Ted dit week vertrekt (ma/di) */
    departureWed: arrivalPrevWeek ? thisWed : null, // Ted vertrekt de woensdag ná zijn aankomstweek
    hasSchoolDays: arrivalThisWeek || arrivalPrevWeek,
  };
}

/** De dichtstbijzijnde aanstaande woensdag */
export function nextWednesday(): string {
  const now = new Date();
  const dow = now.getDay();
  const days = dow <= 3 ? 3 - dow : 10 - dow;
  return addDays(
    [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'),
    days,
  );
}
