import type { TedSchedule } from '../types';

/** Geeft aan of Ted fysiek aanwezig is op deze dag (wo-avond t/m di) */
export function isInTedPeriod(date: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;
  const d = new Date(date);
  const ref = new Date(schedule.referenceWednesday);
  const diffDays = Math.round((d.getTime() - ref.getTime()) / 86_400_000);
  const cycle = ((diffDays % 14) + 14) % 14;
  // Dag 0 = woensdag aankomst (avond, Ted is er niet overdag)
  // Dag 1–6 = do t/m di (Ted is er)
  // Dag 7 = woensdag vertrek ochtend (Ted weg)
  return cycle >= 1 && cycle <= 6;
}

/**
 * Geeft aan of een gegeven datum een Ted-schooldag is.
 * Schooldagen: do en vr van aankomstweek, ma en di van vertrekweek.
 * Woensdag zelf telt niet (aankomst is 's avonds, overdag bij oma).
 */
export function isTedSchoolDay(date: string, schedule: TedSchedule): boolean {
  if (!schedule.referenceWednesday) return false;

  // Kijk eerst of er een handmatige override is
  if (date in schedule.overrides) return schedule.overrides[date];

  const d = new Date(date);
  const dow = d.getDay(); // 0=zo, 1=ma, ..., 5=vr, 6=za

  // Ted is er alleen op werkdagen (ma-vr), niet za/zo
  // (weekend kan apart worden getoggeld via de dag-knop)
  if (dow === 0 || dow === 6) return false;

  // Bereken dagen t.o.v. de referentie-woensdag
  const ref = new Date(schedule.referenceWednesday);
  const diffMs = d.getTime() - ref.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  // Normaliseer naar de 14-daagse cyclus
  const cycle = ((diffDays % 14) + 14) % 14;

  // Cyclus dag 0 = woensdag (aankomst avond, geen schoollunch)
  // Dag 1 = donderdag ✓
  // Dag 2 = vrijdag ✓
  // Dag 3 = zaterdag
  // Dag 4 = zondag
  // Dag 5 = maandag ✓
  // Dag 6 = dinsdag ✓
  // Dag 7 = woensdag (vertrek ochtend, geen schoollunch)
  // Dag 8–13 = week zonder Ted
  return [1, 2, 5, 6].includes(cycle);
}

/** Geeft de dichtstbijzijnde komende woensdag (of vandaag als het woensdag is) */
export function nextWednesday(): string {
  const d = new Date();
  const dow = d.getDay();
  const daysUntilWed = dow <= 3 ? 3 - dow : 10 - dow;
  d.setDate(d.getDate() + daysUntilWed);
  return d.toISOString().slice(0, 10);
}
