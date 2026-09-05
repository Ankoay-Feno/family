"use client";

import { useActionState } from "react";
import { setRolePlatform } from "@/app/actions/roles";
import type { ActionState } from "@/app/actions";
import { useI18n } from "@/components/I18nProvider";

const initial: ActionState = { ok: false };

export default function MemberRoleRow({
  membershipId,
  userName,
  userEmail,
  personName,
  role,
}: {
  membershipId: string;
  userName: string;
  userEmail: string;
  personName: string | null;
  role: string;
}) {
  const { t } = useI18n();
  const ROLE_LABELS: Record<string, string> = {
    admin: t.platform.memberRole.roleAdmin,
    parent: t.platform.memberRole.roleParent,
    member: t.platform.memberRole.roleMember,
  };
  const [state, formAction, pending] = useActionState(setRolePlatform, initial);

  return (
    <div className="queue-item">
      <div className="queue-head">
        <span className="queue-title">
          {userName}
          {personName && personName !== userName ? t.common.cardSuffix(personName) : ""}
        </span>
        <span className="badge">{ROLE_LABELS[role] ?? role}</span>
      </div>
      <div className="queue-meta">{userEmail}</div>
      <form action={formAction} className="queue-actions">
        <input type="hidden" name="membershipId" value={membershipId} />
        <select name="role" defaultValue={role} className="role-select" aria-label={t.common.roleLabel}>
          <option value="admin">{t.platform.memberRole.roleAdmin}</option>
          <option value="parent">{t.platform.memberRole.roleParent}</option>
          <option value="member">{t.platform.memberRole.roleMember}</option>
        </select>
        <button type="submit" className="btn btn-ghost" disabled={pending}>
          {pending ? "…" : t.platform.memberRole.apply}
        </button>
        {state.error && <span className="form-error" style={{ margin: 0 }}>{state.error}</span>}
      </form>
    </div>
  );
}
