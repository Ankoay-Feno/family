import { prisma } from "@/lib/prisma";
import { revokeInvitation } from "@/app/actions/invitations";
import { getLocale } from "@/lib/i18n/server";
import { formatLongDate, getDictionary } from "@/lib/i18n";

// Wrapper : <form action> attend (formData) => void, revokeInvitation suit
// la signature useActionState (prev, formData) => InviteState.
async function revoke(formData: FormData): Promise<void> {
  "use server";
  await revokeInvitation({ ok: false }, formData);
}

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}

export default async function InvitationsSection({ treeId }: { treeId: string }) {
  const [invitations, locale] = await Promise.all([
    prisma.invitation.findMany({
      where: { treeId, usedAt: null },
      include: { person: true },
      orderBy: { createdAt: "desc" },
    }),
    getLocale(),
  ]);
  const t = getDictionary(locale);

  return (
    <section className="admin-section">
      <h2 className="display">{t.admin.invitations.title}</h2>
      <p className="hint">{t.admin.invitations.hint}</p>
      {invitations.length === 0 ? (
        <p className="empty">{t.admin.invitations.empty}</p>
      ) : (
        invitations.map((inv) => (
          <div key={inv.id} className="queue-item">
            <div className="queue-head">
              <span className="queue-title">{inv.person.name}</span>
              {isExpired(inv.expiresAt) ? (
                <span className="badge badge-warm">{t.admin.invitations.expired}</span>
              ) : (
                <span className="queue-meta">
                  {t.admin.invitations.expiresOn(formatLongDate(inv.expiresAt, locale))}
                </span>
              )}
            </div>
            <div className="queue-actions">
              <form action={revoke}>
                <input type="hidden" name="invitationId" value={inv.id} />
                <button type="submit" className="btn btn-ghost">
                  {t.admin.invitations.revoke}
                </button>
              </form>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
