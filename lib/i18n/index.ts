import { fr } from "./dictionaries/fr";
import { mg } from "./dictionaries/mg";
import type { Dictionary, Locale } from "./dictionary";

export type { Dictionary, Locale, RelationKey } from "./dictionary";
export { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "./dictionary";
export { formatLongDate } from "./format";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, mg };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "fr" || value === "mg";
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
