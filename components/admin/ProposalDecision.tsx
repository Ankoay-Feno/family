"use client";

import { useActionState } from "react";
import { approveProposal, rejectProposal } from "@/app/actions/proposals";
import type { ActionState } from "@/app/actions";

const initial: ActionState = { ok: false };

export default function ProposalDecision({ proposalId }: { proposalId: string }) {
  const [approveState, approveAction, approving] = useActionState(approveProposal, initial);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectProposal, initial);
  const busy = approving || rejecting;

  return (
    <div>
      <div className="queue-actions">
        <form action={approveAction}>
          <input type="hidden" name="proposalId" value={proposalId} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {approving ? "Application…" : "Approuver"}
          </button>
        </form>
        <form action={rejectAction} className="queue-actions">
          <input type="hidden" name="proposalId" value={proposalId} />
          <input
            name="reason"
            maxLength={300}
            placeholder="Motif (facultatif)"
            aria-label="Motif de refus (facultatif)"
            style={{
              width: 180,
              padding: "7px 10px",
              border: "1px solid var(--line)",
              borderRadius: 8,
              background: "var(--bg)",
              color: "var(--ink)",
              font: "inherit",
              fontSize: 13,
            }}
          />
          <button type="submit" className="btn btn-ghost" disabled={busy}>
            {rejecting ? "Refus…" : "Refuser"}
          </button>
        </form>
      </div>
      {approveState.error && <p className="form-error">{approveState.error}</p>}
      {rejectState.error && <p className="form-error">{rejectState.error}</p>}
    </div>
  );
}
