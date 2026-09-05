import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformAdmin } from "@/lib/authz";
import { countGenerations, type RelDTO } from "@/lib/family";
import { getLocale } from "@/lib/i18n/server";
import { formatLongDate, getDictionary } from "@/lib/i18n";
import PlatformCreateFamily from "@/components/platform/PlatformCreateFamily";
import PlatformFamilyActions from "@/components/platform/PlatformFamilyActions";

export default async function PlatformPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await isPlatformAdmin(user.id))) redirect("/");
  const locale = await getLocale();
  const t = getDictionary(locale);

  const trees = await prisma.tree.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      persons: { select: { id: true, userId: true } },
      relationships: { select: { type: true, fromId: true, toId: true } },
      memberships: true,
      _count: {
        select: {
          proposals: { where: { status: "PENDING" } },
          joinRequests: { where: { status: "PENDING" } },
          invitations: { where: { usedAt: null } },
        },
      },
    },
  });

  return (
    <>
      <header className="app-head">
        <div>
          <div className="eyebrow">{t.platform.eyebrow}</div>
          <h1 className="display">{t.platform.title}</h1>
        </div>
        <div className="head-right">
          <Link href="/" className="btn-link">
            {t.nav.backToTree}
          </Link>
        </div>
      </header>
      <main className="admin-wrap">
        <section className="admin-section">
          <h2 className="display">{t.platform.listSection.title(trees.length)}</h2>
          <p className="hint">{t.platform.listSection.hint}</p>
          {trees.map((tree) => {
            const rels = tree.relationships.map((r) => ({
              ...r,
              type: r.type as RelDTO["type"],
            }));
            const generations = countGenerations(
              rels,
              tree.persons.map((p) => p.id),
            );
            const linked = tree.persons.filter((p) => p.userId !== null).length;
            const pending =
              tree._count.proposals + tree._count.joinRequests + tree._count.invitations;
            const admins = tree.memberships.filter((m) => m.role === "admin").length;
            return (
              <div key={tree.id} className="queue-item">
                <div className="queue-head">
                  <span className="queue-title">{tree.name}</span>
                  <span className="queue-meta">
                    {t.platform.listSection.createdOn(formatLongDate(tree.createdAt, locale))}
                  </span>
                </div>
                <div className="queue-meta">
                  {t.platform.listSection.stats(generations, tree.persons.length, linked, admins)}
                  {pending > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="badge badge-warm">
                        {t.platform.listSection.pending(pending)}
                      </span>
                    </>
                  )}
                </div>
                <div className="queue-actions">
                  <Link href={`/plateforme/famille/${tree.id}`} className="btn btn-ghost">
                    {t.platform.listSection.viewReadOnly}
                  </Link>
                </div>
                <PlatformFamilyActions
                  treeId={tree.id}
                  treeName={tree.name}
                  canRegenerate={tree.memberships.length === 0}
                />
              </div>
            );
          })}
          {trees.length === 0 && <p className="empty">{t.platform.listSection.empty}</p>}
        </section>

        <section className="admin-section">
          <h2 className="display">{t.platform.createSection.title}</h2>
          <p className="hint">{t.platform.createSection.hint}</p>
          <PlatformCreateFamily />
        </section>
      </main>
    </>
  );
}
