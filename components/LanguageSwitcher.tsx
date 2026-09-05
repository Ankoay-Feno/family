"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

const LABELS: Record<Locale, string> = { mg: "MG", fr: "FR" };
const OTHER: Record<Locale, Locale> = { mg: "fr", fr: "mg" };

export default function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Locale | null>(null);
  const shown = optimistic ?? locale;
  const next = OTHER[shown];

  function switchTo(target: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; SameSite=Lax`;
    setOptimistic(target);
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      className="btn-link"
      aria-label={t.languageSwitcher.label}
      disabled={pending}
      onClick={() => switchTo(next)}
    >
      {LABELS[shown]} → {LABELS[next]}
    </button>
  );
}
