import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformAdmin } from "@/lib/authz";
import { countGenerations, type RelDTO } from "@/lib/family";
import PlatformCreateFamily from "@/components/platform/PlatformCreateFamily";

export default async function PlatformPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await isPlatformAdmin(user.id))) redirect("/");

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
          <div className="eyebrow">Administration de la plateforme</div>
          <h1 className="display">Toutes les familles</h1>
        </div>
        <div className="head-right">
          <Link href="/" className="btn-link">
            ← Retour à l&apos;arbre
          </Link>
        </div>
      </header>
      <main className="admin-wrap">
        <section className="admin-section">
          <h2 className="display">Familles ({trees.length})</h2>
          <p className="hint">
            Consultation en lecture seule ; la gestion des rôles se fait depuis la
            fiche de chaque famille.
          </p>
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
            return (
              <div key={tree.id} className="queue-item">
                <div className="queue-head">
                  <span className="queue-title">{tree.name}</span>
                  <span className="queue-meta">
                    créée le{" "}
                    {tree.createdAt.toLocaleDateString("fr-FR", { dateStyle: "long" })}
                  </span>
                </div>
                <div className="queue-meta">
                  {generations} génération{generations > 1 ? "s" : ""} ·{" "}
                  {tree.persons.length} membre{tree.persons.length > 1 ? "s" : ""} ·{" "}
                  {linked} compte{linked > 1 ? "s" : ""} lié{linked > 1 ? "s" : ""} ·{" "}
                  {tree.memberships.filter((m) => m.role === "admin").length} admin
                  {pending > 0 && (
                    <>
                      {" "}
                      · <span className="badge badge-warm">{pending} en attente</span>
                    </>
                  )}
                </div>
                <div className="queue-actions">
                  <Link href={`/plateforme/famille/${tree.id}`} className="btn btn-ghost">
                    Consulter (lecture seule)
                  </Link>
                </div>
              </div>
            );
          })}
          {trees.length === 0 && <p className="empty">Aucune famille pour l&apos;instant.</p>}
        </section>

        <section className="admin-section">
          <h2 className="display">Créer une famille</h2>
          <p className="hint">
            La famille est créée avec la carte de son fondateur, et vous obtenez un
            lien d&apos;invitation qui fera de lui l&apos;admin de la famille.
          </p>
          <PlatformCreateFamily />
        </section>
      </main>
    </>
  );
}
