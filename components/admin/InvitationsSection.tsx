import { prisma } from "@/lib/prisma";
import { revokeInvitation } from "@/app/actions/invitations";

// Wrapper : <form action> attend (formData) => void, revokeInvitation suit
// la signature useActionState (prev, formData) => InviteState.
async function revoke(formData: FormData): Promise<void> {
  "use server";
  await revokeInvitation({ ok: false }, formData);
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}

export default async function InvitationsSection({ treeId }: { treeId: string }) {
  const invitations = await prisma.invitation.findMany({
    where: { treeId, usedAt: null },
    include: { person: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="admin-section">
      <h2 className="display">Invitations en attente</h2>
      <p className="hint">
        Pour inviter quelqu&apos;un, ouvrez la fiche d&apos;une personne sans
        compte dans l&apos;arbre et utilisez son bouton « Inviter » : le lien
        généré est à usage unique et valable 7 jours.
      </p>
      {invitations.length === 0 ? (
        <p className="empty">Aucune invitation en attente.</p>
      ) : (
        invitations.map((inv) => (
          <div key={inv.id} className="queue-item">
            <div className="queue-head">
              <span className="queue-title">{inv.person.name}</span>
              {isExpired(inv.expiresAt) ? (
                <span className="badge badge-warm">expirée</span>
              ) : (
                <span className="queue-meta">
                  expire le {dateFmt.format(inv.expiresAt)}
                </span>
              )}
            </div>
            <div className="queue-actions">
              <form action={revoke}>
                <input type="hidden" name="invitationId" value={inv.id} />
                <button type="submit" className="btn btn-ghost">
                  Révoquer
                </button>
              </form>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
