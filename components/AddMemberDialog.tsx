"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitAddMember, type SubmitState } from "@/app/actions/proposals";
import type { PersonDTO } from "@/lib/family";
import { MAX_NICKNAME_LENGTH } from "@/lib/tree-edit";

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
      <div className="modal" role="dialog" aria-modal="true" aria-label="Ajouter un membre">
        <h2 className="display">Ajouter un membre</h2>
        {proposalSent ? (
          <>
            <p>
              Proposition envoyée — un admin doit la valider avant qu&apos;elle
              apparaisse dans l&apos;arbre.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="treeId" value={treeId} />
            <label className="field">
              <span>Nom</span>
              <input name="name" required placeholder="Voahangy" />
            </label>
            <label className="field">
              <span>Surnom (facultatif)</span>
              <input name="nickname" maxLength={MAX_NICKNAME_LENGTH} placeholder="Bebe" />
            </label>
            <div className="field">
              <span>Sexe</span>
              <div className="radio-row">
                <label>
                  <input type="radio" name="sex" value="F" required /> Femme
                </label>
                <label>
                  <input type="radio" name="sex" value="M" /> Homme
                </label>
              </div>
            </div>
            <label className="field">
              <span>Année de naissance (facultatif)</span>
              <input name="birthYear" type="number" min={1800} max={2100} placeholder="1976" />
            </label>
            <label className="field">
              <span>Email (facultatif — prérempli à l&apos;invitation)</span>
              <input name="email" type="email" placeholder="voahangy@exemple.mg" />
            </label>
            <label className="field">
              <span>Photo (facultatif — JPEG, PNG ou WebP, 3 Mo max)</span>
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            </label>
            <label className="field">
              <span>Relation</span>
              <select name="relType" defaultValue="CHILD_OF">
                <option value="CHILD_OF">Enfant de…</option>
                <option value="PARENT_OF">Parent de…</option>
                <option value="SPOUSE_OF">Conjoint·e de…</option>
              </select>
            </label>
            <label className="field">
              <span>Par rapport à</span>
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
              Pour « Enfant de… », le conjoint de la personne choisie devient
              automatiquement le second parent.
            </p>
            {state.error && <p className="form-error">{state.error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Envoi…" : role === "member" ? "Proposer" : "Ajouter"}
              </button>
            </div>
            {role === "member" && (
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
                Votre ajout sera soumis à la validation d&apos;un admin.
              </p>
            )}
            {role === "parent" && (
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
                Vos enfants (« Enfant de » vous ou votre conjoint·e) sont ajoutés
                directement ; le reste sera soumis à la validation d&apos;un admin.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
