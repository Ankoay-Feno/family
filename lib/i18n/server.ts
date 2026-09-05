import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDictionary, isLocale, type Dictionary } from "./index";

/** Langue courante côté serveur (pages, layouts, server actions) : lue depuis
 *  le cookie, jamais depuis un state client — chaque requête est autonome. */
export async function getLocale() {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerDictionary(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
