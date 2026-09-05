"use client";

import { useActionState, type CSSProperties } from "react";
import { submitJoinRequest, type JoinState } from "@/app/actions/join-requests";
import { useI18n } from "./I18nProvider";

const initial: JoinState = { ok: false };

// globals.css ne style pas les textarea : style inline calqué sur les inputs.
const textareaStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 9,
  background: "var(--bg)",
  color: "var(--ink)",
  font: "inherit",
  minHeight: 90,
  resize: "vertical",
};

export default function JoinRequestForm({
  slug,
  treeName,
}: {
  slug: string;
  treeName: string;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(submitJoinRequest, initial);

  if (state.ok) {
    return (
      <div className="login-card">
        <p style={{ margin: 0 }}>{t.join.sentNotice(treeName)}</p>
      </div>
    );
  }

  return (
    <form className="login-card" action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <label className="field">
        <span>{t.join.whoAreYou}</span>
        <textarea
          name="message"
          required
          maxLength={500}
          placeholder={t.join.messagePlaceholder}
          style={textareaStyle}
        />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? t.join.sending : t.join.submit}
      </button>
    </form>
  );
}
