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
import { useI18n } from "@/components/I18nProvider";

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
  const { t } = useI18n();
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
          <summary style={summaryStyle}>{t.admin.joinRequests.linkToExisting}</summary>
          <form action={linkAction} style={{ marginTop: 10 }}>
            <input type="hidden" name="requestId" value={requestId} />
            <label className="field">
              <span>{t.admin.joinRequests.linkPersonLabel}</span>
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
              {linkPending ? t.admin.joinRequests.approving : t.admin.joinRequests.approve}
            </button>
          </form>
        </details>
      )}
      <details>
        <summary style={summaryStyle}>{t.admin.joinRequests.createCard}</summary>
        <form action={createAction} style={{ marginTop: 10 }}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="treeId" value={treeId} />
          <label className="field">
            <span>{t.admin.joinRequests.name}</span>
            <input name="name" required placeholder="Faly" />
          </label>
          <div className="field">
            <span>{t.admin.joinRequests.sex}</span>
            <div className="radio-row">
              <label>
                <input type="radio" name="sex" value="F" required /> {t.admin.joinRequests.woman}
              </label>
              <label>
                <input type="radio" name="sex" value="M" /> {t.admin.joinRequests.man}
              </label>
            </div>
          </div>
          <label className="field">
            <span>{t.admin.joinRequests.birthYearOptional}</span>
            <input name="birthYear" type="number" min={1800} max={2100} placeholder="1990" />
          </label>
          <label className="field">
            <span>{t.admin.joinRequests.relation}</span>
            <select name="relType" defaultValue="CHILD_OF">
              <option value="CHILD_OF">{t.admin.joinRequests.relationChild}</option>
              <option value="PARENT_OF">{t.admin.joinRequests.relationParent}</option>
              <option value="SPOUSE_OF">{t.admin.joinRequests.relationSpouse}</option>
            </select>
          </label>
          <label className="field">
            <span>{t.admin.joinRequests.relativeTo}</span>
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
            {createPending ? t.admin.joinRequests.approving : t.admin.joinRequests.approve}
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
          {rejectPending ? t.admin.joinRequests.rejecting : t.admin.joinRequests.reject}
        </button>
      </form>
    </div>
  );
}
