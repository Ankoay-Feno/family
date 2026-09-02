"use client";

import { useActionState } from "react";
import { setFamilyRole } from "@/app/actions/roles";
import type { ActionState } from "@/app/actions";

const initial: ActionState = { ok: false };

export default function FamilyRoleToggle({
  membershipId,
  role,
}: {
  membershipId: string;
  role: string;
}) {
  const [state, formAction, pending] = useActionState(setFamilyRole, initial);
  const target = role === "parent" ? "member" : "parent";

  return (
    <form action={formAction} className="queue-actions">
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="role" value={target} />
      <button type="submit" className="btn btn-ghost" disabled={pending}>
        {pending ? "…" : target === "parent" ? "Donner le rôle Parent" : "Repasser en Membre"}
      </button>
      {state.error && <span className="form-error" style={{ margin: 0 }}>{state.error}</span>}
    </form>
  );
}
