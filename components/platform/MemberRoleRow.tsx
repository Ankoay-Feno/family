"use client";

import { useActionState } from "react";
import { setRolePlatform } from "@/app/actions/roles";
import type { ActionState } from "@/app/actions";

const initial: ActionState = { ok: false };

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin famille",
  parent: "Parent",
  member: "Membre",
};

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
  const [state, formAction, pending] = useActionState(setRolePlatform, initial);

  return (
    <div className="queue-item">
      <div className="queue-head">
        <span className="queue-title">
          {userName}
          {personName && personName !== userName ? ` (carte : ${personName})` : ""}
        </span>
        <span className="badge">{ROLE_LABELS[role] ?? role}</span>
      </div>
      <div className="queue-meta">{userEmail}</div>
      <form action={formAction} className="queue-actions">
        <input type="hidden" name="membershipId" value={membershipId} />
        <select name="role" defaultValue={role} className="role-select" aria-label="Rôle">
          <option value="admin">Admin famille</option>
          <option value="parent">Parent</option>
          <option value="member">Membre</option>
        </select>
        <button type="submit" className="btn btn-ghost" disabled={pending}>
          {pending ? "…" : "Appliquer"}
        </button>
        {state.error && <span className="form-error" style={{ margin: 0 }}>{state.error}</span>}
      </form>
    </div>
  );
}
