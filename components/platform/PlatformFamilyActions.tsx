"use client";

import { useActionState, useState } from "react";
import {
  deleteFamilyPlatform,
  regenerateFounderInvitation,
  type CreateFamilyState,
} from "@/app/actions/platform";
import type { ActionState } from "@/app/actions";
import { useI18n } from "@/components/I18nProvider";

const inviteInitial: CreateFamilyState = { ok: false };
const deleteInitial: ActionState = { ok: false };

export default function PlatformFamilyActions({
  treeId,
  treeName,
  canRegenerate,
}: {
  treeId: string;
  treeName: string;
  canRegenerate: boolean;
}) {
  const { t } = useI18n();
  const [inviteState, inviteAction, invitePending] = useActionState(
    regenerateFounderInvitation,
    inviteInitial,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteFamilyPlatform,
    deleteInitial,
  );
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {inviteState.ok && inviteState.path && (
        <div className="link-box">
          <code>{`${window.location.origin}${inviteState.path}`}</code>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(`${window.location.origin}${inviteState.path}`);
              setCopied(true);
            }}
          >
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      )}
      <div className="queue-actions">
        {canRegenerate && (
          <form action={inviteAction}>
            <input type="hidden" name="treeId" value={treeId} />
            <button type="submit" className="btn btn-ghost" disabled={invitePending}>
              {invitePending
                ? t.platform.familyActions.regenerating
                : t.platform.familyActions.regenerate}
            </button>
          </form>
        )}
        {confirming ? (
          <form action={deleteAction} className="queue-actions">
            <input type="hidden" name="treeId" value={treeId} />
            <span className="queue-meta">{t.platform.familyActions.confirmDelete(treeName)}</span>
            <button type="submit" className="btn btn-danger" disabled={deletePending}>
              {deletePending ? t.platform.familyActions.deleting : t.platform.familyActions.confirm}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setConfirming(false)}
              disabled={deletePending}
            >
              {t.platform.familyActions.cancel}
            </button>
          </form>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirming(true)}>
            {t.platform.familyActions.deleteFamily}
          </button>
        )}
      </div>
      {inviteState.error && <p className="form-error">{inviteState.error}</p>}
      {deleteState.error && <p className="form-error">{deleteState.error}</p>}
    </div>
  );
}
