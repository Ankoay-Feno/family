"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation, type InviteState } from "@/app/actions/invitations";

const initial: InviteState = { ok: false };

export default function AcceptInviteButton({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitation, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      router.push("/");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Acceptation…" : "Accepter l'invitation"}
      </button>
    </form>
  );
}
