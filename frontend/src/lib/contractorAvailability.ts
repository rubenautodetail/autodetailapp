/**
 * Shared helpers for matching a contractor's stored availability JSON against
 * a specific date+hour. Used by both the availability API (deciding which
 * date/time slots to expose to customers) and admin/audit code so the rules
 * never drift.
 *
 * Schema: profiles.availability JSONB
 *   { days: ("Mon"|"Tue"|...|"Sun")[]; start_hour: number; end_hour: number }
 *
 * NULL availability is treated as "available every day, every hour" — preserves
 * existing contractors who never opened the settings page.
 */

export const WEEKDAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export type ContractorAvailability = {
  days: string[];
  start_hour: number;
  end_hour: number;
} | null;

export function weekdayCodeFor(date: Date): WeekdayCode {
  return WEEKDAY_CODES[date.getDay()];
}

// Maps JS Date.getDay() (0=Sun..6=Sat) → settings JSON key (sun..sat) used
// in platform_schedule_settings.weekday_defaults.
const WEEKDAY_SETTINGS_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export type WeekdaySettingsKey = (typeof WEEKDAY_SETTINGS_KEY)[number];

export function weekdaySettingsKeyFor(date: Date): WeekdaySettingsKey {
  return WEEKDAY_SETTINGS_KEY[date.getDay()];
}

export function matchesSlot(
  availability: ContractorAvailability,
  date: Date,
  hour: number,
): boolean {
  if (!availability) return true;
  const code = weekdayCodeFor(date);
  if (!availability.days?.includes(code)) return false;
  if (hour < availability.start_hour) return false;
  if (hour >= availability.end_hour) return false;
  return true;
}
