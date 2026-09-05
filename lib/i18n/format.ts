// Formatage de date écrit à la main (jour mois année) : la locale "mg" n'a
// pas de données ICU fiables dans tous les runtimes, alors qu'on veut un
// rendu garanti dans les deux langues.

import type { Locale } from "./dictionary";

const MONTHS: Record<Locale, string[]> = {
  fr: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  mg: [
    "Janoary",
    "Febroary",
    "Martsa",
    "Aprily",
    "Mey",
    "Jona",
    "Jolay",
    "Aogositra",
    "Septambra",
    "Oktobra",
    "Novambra",
    "Desambra",
  ],
};

export function formatLongDate(date: Date, locale: Locale): string {
  return `${date.getDate()} ${MONTHS[locale][date.getMonth()]} ${date.getFullYear()}`;
}
