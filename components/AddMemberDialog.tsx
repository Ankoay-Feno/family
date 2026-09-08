"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAddMember, type SubmitState } from "@/app/actions/proposals";
import { childrenOf, parentsOf, spouseOf, type PersonDTO, type RelDTO } from "@/lib/family";
import { imageFileFromPaste, readClipboardImage } from "@/lib/clipboard-image";
import { MAX_NICKNAME_LENGTH } from "@/lib/limits";
import { useI18n } from "./I18nProvider";
import Spinner from "./Spinner";

const initial: SubmitState = { ok: false };

export default function AddMemberDialog({
  treeId,
  persons,
  rels,
  onClose,
  role = "member",
}: {
  treeId: string;
  persons: PersonDTO[];
  rels: RelDTO[];
  onClose: () => void;
  role?: "admin" | "parent" | "member";
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(submitAddMember, initial);
  const router = useRouter();
  const [relType, setRelType] = useState<"CHILD_OF" | "PARENT_OF" | "SPOUSE_OF">("CHILD_OF");
  const [anchorId, setAnchorId] = useState(persons[0]?.id ?? "");
  const [deceased, setDeceased] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const byId = new Map(persons.map((p) => [p.id, p]));
  const anchorSpouseId = spouseOf(rels, anchorId);
  const anchorSpouse = anchorSpouseId ? byId.get(anchorSpouseId) : undefined;
  // « Parent de… » : l'ancre a déjà un parent seul → proposer de les marier.
  const anchorParents = parentsOf(rels, anchorId);
  const soleParent =
    anchorParents.length === 1 && !spouseOf(rels, anchorParents[0])
      ? byId.get(anchorParents[0])
      : undefined;
  // « Conjoint·e de… » : enfants de l'ancre sans second parent → proposer le rattachement.
  const linkableChildren = childrenOf(rels, anchorId)
    .filter((c) => parentsOf(rels, c).length < 2)
    .map((c) => byId.get(c))
    .filter((p): p is PersonDTO => p !== undefined);

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

  // Une image collée (Ctrl+V) n'importe où dans le dialogue devient la photo.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFileFromPaste(e);
      if (!file) return;
      e.preventDefault();
      attachPhoto(file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  function attachPhoto(file: File) {
    const input = photoInputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    setPasteError(null);
  }

  async function pasteFromClipboard() {
    setPasteError(null);
    const result = await readClipboardImage();
    if ("error" in result) {
      setPasteError(result.error === "unsupported" ? t.photo.clipboardUnsupported : t.photo.clipboardEmpty);
      return;
    }
    attachPhoto(result.file);
  }

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
            <div className="radio-row">
              <label>
                <input
                  type="checkbox"
                  name="deceased"
                  value="yes"
                  checked={deceased}
                  onChange={(e) => setDeceased(e.target.checked)}
                />
                {t.addMember.deceasedLabel}
              </label>
            </div>
            {deceased && (
              <label className="field">
                <span>{t.addMember.deathYearOptional}</span>
                <input name="deathYear" type="number" min={1800} max={2100} placeholder="1998" />
              </label>
            )}
            <label className="field">
              <span>{t.addMember.emailOptional}</span>
              <input name="email" type="email" placeholder="voahangy@exemple.mg" />
            </label>
            <div className="field">
              <span>{t.addMember.photoOptional}</span>
              <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  ref={photoInputRef}
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                />
                <button type="button" className="btn btn-ghost" onClick={pasteFromClipboard}>
                  {t.photo.pasteImage}
                </button>
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{t.photo.pasteHint}</span>
              {pasteError && <span className="form-error" style={{ margin: 0 }}>{pasteError}</span>}
            </div>
            <label className="field">
              <span>{t.addMember.relation}</span>
              <select
                name="relType"
                value={relType}
                onChange={(e) => setRelType(e.target.value as typeof relType)}
              >
                <option value="CHILD_OF">{t.addMember.relationChild}</option>
                <option value="PARENT_OF">{t.addMember.relationParent}</option>
                <option value="SPOUSE_OF">{t.addMember.relationSpouse}</option>
              </select>
            </label>
            <label className="field">
              <span>{t.addMember.relativeTo}</span>
              <select name="anchorId" value={anchorId} onChange={(e) => setAnchorId(e.target.value)}>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.birthYear ? ` (${p.birthYear})` : ""}
                  </option>
                ))}
              </select>
            </label>
            {relType === "CHILD_OF" && anchorSpouse && (
              <div className="radio-row">
                <label>
                  <input type="checkbox" name="bothParents" value="yes" defaultChecked />
                  {t.addMember.bothParentsLabel(anchorSpouse.name)}
                </label>
              </div>
            )}
            {relType === "PARENT_OF" && soleParent && (
              <div className="radio-row">
                <label>
                  <input type="checkbox" name="marryOtherParent" value="yes" defaultChecked />
                  {t.addMember.marryOtherParentLabel(soleParent.name)}
                </label>
              </div>
            )}
            {relType === "SPOUSE_OF" && linkableChildren.length > 0 && (
              <div className="radio-row">
                <label>
                  <input type="checkbox" name="linkChildren" value="yes" defaultChecked />
                  {t.addMember.linkChildrenLabel(linkableChildren.map((p) => p.name).join(", "))}
                </label>
              </div>
            )}
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
              {t.addMember.spouseHint}
            </p>
            {state.error && <p className="form-error">{state.error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {t.common.cancel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending && <Spinner />}
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
