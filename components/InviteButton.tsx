"use client";

import { useActionState, useEffect, useState } from "react";
import { createInvitation, type InviteState } from "@/app/actions/invitations";

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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        Inviter
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
        aria-label={`Inviter ${personName}`}
      >
        <h2 className="display">Inviter {personName}</h2>
        {link ? (
          <>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 10px" }}>
              Envoyez ce lien à {personName} : il est valable 7 jours et ne peut
              être utilisé qu&apos;une seule fois.
            </p>
            <div className="link-box">
              <code>{link}</code>
              <button type="button" className="btn btn-ghost" onClick={copy}>
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="treeId" value={treeId} />
            <input type="hidden" name="personId" value={personId} />
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 10px" }}>
              Génère un lien à usage unique (valable 7 jours) qui liera le compte
              de {personName} à sa carte de l&apos;arbre.
            </p>
            {state.error && <p className="form-error">{state.error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Génération…" : "Générer le lien"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
