"use client";

// Fournit la langue et le dictionnaire courants à tout composant client de
// l'arbre, sans prop-drilling. Le layout racine (Server Component) ne
// transmet que `locale` (une simple chaîne, sérialisable) — le dictionnaire
// contient des fonctions (interpolation), qui ne peuvent PAS traverser la
// frontière serveur→client comme prop ; on le recalcule donc ici à partir du
// même module lib/i18n (pur, sans dépendance serveur) que lib/i18n/server.ts.

import { createContext, useContext, useMemo } from "react";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export default function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: getDictionary(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n() doit être appelé sous <I18nProvider>.");
  return ctx;
}
