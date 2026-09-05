"use client";

import { useActionState } from "react";
import { approveProposal, rejectProposal } from "@/app/actions/proposals";
import type { ActionState } from "@/app/actions";
import { useI18n } from "@/components/I18nProvider";

const initial: ActionState = { ok: false };

export default function ProposalDecision({ proposalId }: { proposalId: string }) {
  const { t } = useI18n();
  const [approveState, approveAction, approving] = useActionState(approveProposal, initial);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectProposal, initial);
  const busy = approving || rejecting;

  return (
    <div>
      <div className="queue-actions">
        <form action={approveAction}>
          <input type="hidden" name="proposalId" value={proposalId} />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {approving ? t.admin.proposals.approving : t.admin.proposals.approve}
          </button>
        </form>
        <form action={rejectAction} className="queue-actions">
          <input type="hidden" name="proposalId" value={proposalId} />
          <input
            name="reason"
            maxLength={300}
            placeholder={t.admin.proposals.rejectReasonPlaceholder}
            aria-label={t.admin.proposals.rejectReasonLabel}
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
            {rejecting ? t.admin.proposals.rejecting : t.admin.proposals.reject}
          </button>
        </form>
      </div>
      {approveState.error && <p className="form-error">{approveState.error}</p>}
      {rejectState.error && <p className="form-error">{rejectState.error}</p>}
    </div>
  );
}
