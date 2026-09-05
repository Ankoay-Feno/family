"use client";

import { useActionState } from "react";
import { createFamily, type ActionState } from "@/app/actions";
import { useI18n } from "./I18nProvider";

const initial: ActionState = { ok: false };

export default function CreateFamilyForm({ userName }: { userName: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createFamily, initial);

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">{t.createFamily.welcomeEyebrow}</div>
        <h1 className="display">{t.createFamily.title}</h1>
      </div>
      <form className="login-card" action={formAction}>
        <label className="field">
          <span>{t.createFamily.treeName}</span>
          <input name="treeName" required placeholder="Fianakaviana Rakoto" />
        </label>
        <label className="field">
          <span>{t.createFamily.yourNameInTree}</span>
          <input name="name" required defaultValue={userName} />
        </label>
        <div className="field">
          <span>{t.createFamily.youAre}</span>
          <div className="radio-row">
            <label>
              <input type="radio" name="sex" value="F" required /> {t.createFamily.woman}
            </label>
            <label>
              <input type="radio" name="sex" value="M" /> {t.createFamily.man}
            </label>
          </div>
        </div>
        <label className="field">
          <span>{t.createFamily.birthYearOptional}</span>
          <input name="birthYear" type="number" min={1800} max={2100} placeholder="1979" />
        </label>
        {state.error && <p className="form-error">{state.error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t.createFamily.submitting : t.createFamily.submit}
        </button>
      </form>
      <p className="login-note">{t.createFamily.note}</p>
    </div>
  );
}
