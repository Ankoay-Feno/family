"use client";

// Bloc de décision d'une demande d'adhésion : lier à une carte existante,
// créer la carte du demandeur, ou refuser. Les deux modes d'approbation sont
// repliés dans des <details> natifs pour rester compact.

import { useActionState, type CSSProperties } from "react";
import {
  approveJoinRequestLink,
  approveJoinRequestCreate,
  rejectJoinRequest,
  type JoinState,
} from "@/app/actions/join-requests";

const initial: JoinState = { ok: false };

const summaryStyle: CSSProperties = {
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  color: "var(--accent)",
};

type PersonOption = { id: string; name: string };

export default function JoinRequestDecision({
  requestId,
  treeId,
  unlinkedPersons,
  allPersons,
}: {
  requestId: string;
  treeId: string;
  unlinkedPersons: PersonOption[];
  allPersons: PersonOption[];
}) {
  const [linkState, linkAction, linkPending] = useActionState(
    approveJoinRequestLink,
    initial,
  );
  const [createState, createAction, createPending] = useActionState(
    approveJoinRequestCreate,
    initial,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectJoinRequest,
    initial,
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {unlinkedPersons.length > 0 && (
        <details>
          <summary style={summaryStyle}>Lier à une carte existante</summary>
          <form action={linkAction} style={{ marginTop: 10 }}>
            <input type="hidden" name="requestId" value={requestId} />
            <label className="field">
              <span>Carte sans compte</span>
              <select name="personId" defaultValue={unlinkedPersons[0]?.id}>
                {unlinkedPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {linkState.error && <p className="form-error">{linkState.error}</p>}
            <button type="submit" className="btn btn-primary" disabled={linkPending}>
              {linkPending ? "Approbation…" : "Approuver"}
            </button>
          </form>
        </details>
      )}
      <details>
        <summary style={summaryStyle}>Créer sa carte</summary>
        <form action={createAction} style={{ marginTop: 10 }}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="treeId" value={treeId} />
          <label className="field">
            <span>Nom</span>
            <input name="name" required placeholder="Faly" />
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
            <input name="birthYear" type="number" min={1800} max={2100} placeholder="1990" />
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
            <select name="anchorId" defaultValue={allPersons[0]?.id}>
              {allPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {createState.error && <p className="form-error">{createState.error}</p>}
          <button type="submit" className="btn btn-primary" disabled={createPending}>
            {createPending ? "Approbation…" : "Approuver"}
          </button>
        </form>
      </details>
      <form action={rejectAction} className="queue-actions">
        <input type="hidden" name="requestId" value={requestId} />
        {rejectState.error && (
          <p className="form-error" style={{ margin: 0 }}>
            {rejectState.error}
          </p>
        )}
        <button type="submit" className="btn btn-ghost" disabled={rejectPending}>
          {rejectPending ? "Refus…" : "Refuser"}
        </button>
      </form>
    </div>
  );
}
