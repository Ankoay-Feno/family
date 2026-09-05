"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitAddMember, type SubmitState } from "@/app/actions/proposals";
import type { PersonDTO } from "@/lib/family";
import { MAX_NICKNAME_LENGTH } from "@/lib/limits";
import { useI18n } from "./I18nProvider";

const initial: SubmitState = { ok: false };

export default function AddMemberDialog({
  treeId,
  persons,
  onClose,
  role = "member",
}: {
  treeId: string;
  persons: PersonDTO[];
  onClose: () => void;
  role?: "admin" | "parent" | "member";
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(submitAddMember, initial);
  const router = useRouter();

  useEffect(() => {
    // Ajout appliqué directement (admin) : rafraîchir l'arbre et fermer.
    // Une proposition (state.applied === false) laisse la confirmation affichée.
    if (state.ok && state.applied) {
      router.refresh();
      onClose();
    }
  }, [state.ok, state.applied, router, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const proposalSent = state.ok && !state.applied;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={t.addMember.title}>
        <h2 className="display">{t.addMember.title}</h2>
        {proposalSent ? (
          <>
            <p>{t.addMember.proposalSentBody}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t.common.close}
              </button>
            </div>
          </>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="treeId" value={treeId} />
            <label className="field">
              <span>{t.addMember.name}</span>
              <input name="name" required placeholder="Voahangy" />
            </label>
            <label className="field">
              <span>{t.addMember.nickname}</span>
              <input name="nickname" maxLength={MAX_NICKNAME_LENGTH} placeholder="Bebe" />
            </label>
            <div className="field">
              <span>{t.addMember.sex}</span>
              <div className="radio-row">
                <label>
                  <input type="radio" name="sex" value="F" required /> {t.addMember.woman}
                </label>
                <label>
                  <input type="radio" name="sex" value="M" /> {t.addMember.man}
                </label>
              </div>
            </div>
            <label className="field">
              <span>{t.addMember.birthYearOptional}</span>
              <input name="birthYear" type="number" min={1800} max={2100} placeholder="1976" />
            </label>
            <label className="field">
              <span>{t.addMember.emailOptional}</span>
              <input name="email" type="email" placeholder="voahangy@exemple.mg" />
            </label>
            <label className="field">
              <span>{t.addMember.photoOptional}</span>
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
            <label className="field">
              <span>{t.addMember.relation}</span>
              <select name="relType" defaultValue="CHILD_OF">
                <option value="CHILD_OF">{t.addMember.relationChild}</option>
                <option value="PARENT_OF">{t.addMember.relationParent}</option>
                <option value="SPOUSE_OF">{t.addMember.relationSpouse}</option>
              </select>
            </label>
            <label className="field">
              <span>{t.addMember.relativeTo}</span>
              <select name="anchorId" defaultValue={persons[0]?.id}>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.birthYear ? ` (${p.birthYear})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
              {t.addMember.spouseHint}
            </p>
            {state.error && <p className="form-error">{state.error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {t.common.cancel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending
                  ? t.addMember.sending
                  : role === "member"
                    ? t.addMember.propose
                    : t.addMember.add}
              </button>
            </div>
            {role === "member" && (
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
                {t.addMember.memberHint}
              </p>
            )}
            {role === "parent" && (
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
                {t.addMember.parentHint}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
