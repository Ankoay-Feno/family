"use client";

import { useActionState, useState } from "react";
import { createFamilyPlatform, type CreateFamilyState } from "@/app/actions/platform";
import { useI18n } from "@/components/I18nProvider";

const initial: CreateFamilyState = { ok: false };

export default function PlatformCreateFamily() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createFamilyPlatform, initial);
  const [copied, setCopied] = useState(false);

  if (state.ok && state.path) {
    const link = `${window.location.origin}${state.path}`;
    return (
      <>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
          {t.platform.createForm.createdNotice}
        </p>
        <div className="link-box">
          <code>{link}</code>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      </>
    );
  }

  return (
    <form action={formAction}>
      <label className="field">
        <span>{t.platform.createForm.familyName}</span>
        <input name="treeName" required placeholder="Fianakaviana Rabe" />
      </label>
      <label className="field">
        <span>{t.platform.createForm.founderName}</span>
        <input name="name" required placeholder="Rabe" />
      </label>
      <div className="field">
        <span>{t.platform.createForm.sex}</span>
        <div className="radio-row">
          <label>
            <input type="radio" name="sex" value="F" required /> {t.platform.createForm.woman}
          </label>
          <label>
            <input type="radio" name="sex" value="M" /> {t.platform.createForm.man}
          </label>
        </div>
      </div>
      <label className="field">
        <span>{t.platform.createForm.birthYearOptional}</span>
        <input name="birthYear" type="number" min={1800} max={2100} />
      </label>
      <label className="field">
        <span>{t.platform.createForm.emailOptional}</span>
        <input name="email" type="email" placeholder="rabe@exemple.mg" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? t.platform.createForm.submitting : t.platform.createForm.submit}
      </button>
    </form>
  );
}
