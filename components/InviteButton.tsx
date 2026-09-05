"use client";

import { useActionState, useEffect, useState } from "react";
import { createInvitation, type InviteState } from "@/app/actions/invitations";
import { useI18n } from "./I18nProvider";

const initial: InviteState = { ok: false };

/**
 * Bouton « Inviter » d'une carte sans compte : ouvre un petit overlay qui
 * génère le lien d'invitation puis permet de le copier.
 * (Intégré au panneau de la personne par un autre ticket.)
 */
export default function InviteButton({
  treeId,
  personId,
  personName,
}: {
  treeId: string;
  personId: string;
  personName: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        {t.invite.button}
      </button>
      {open && (
        <InviteDialog
          treeId={treeId}
          personId={personId}
          personName={personName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function InviteDialog({
  treeId,
  personId,
  personName,
  onClose,
}: {
  treeId: string;
  personId: string;
  personName: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createInvitation, initial);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Le dialogue n'est rendu qu'après un clic : window est toujours disponible.
  const link = state.ok && state.path ? `${window.location.origin}${state.path}` : null;

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t.invite.dialogTitle(personName)}
      >
        <h2 className="display">{t.invite.dialogTitle(personName)}</h2>
        {link ? (
          <>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 10px" }}>
              {t.invite.linkHint(personName)}
            </p>
            <div className="link-box">
              <code>{link}</code>
              <button type="button" className="btn btn-ghost" onClick={copy}>
                {copied ? t.common.copied : t.common.copy}
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t.common.close}
              </button>
            </div>
          </>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="treeId" value={treeId} />
            <input type="hidden" name="personId" value={personId} />
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 10px" }}>
              {t.invite.generateHint(personName)}
            </p>
            {state.error && <p className="form-error">{state.error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {t.common.cancel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? t.invite.generating : t.invite.generate}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
