// Section « Membres » de la page admin famille : rôles member ↔ parent.
// Les admins famille eux-mêmes sont gérés par la plateforme.

import { prisma } from "@/lib/prisma";
import FamilyRoleToggle from "./FamilyRoleToggle";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin famille",
  parent: "Parent",
  member: "Membre",
};

export default async function MembersSection({ treeId }: { treeId: string }) {
  const [memberships, persons] = await Promise.all([
    prisma.treeMembership.findMany({
      where: { treeId },
      include: { user: true },
      orderBy: { role: "asc" },
    }),
    prisma.person.findMany({
      where: { treeId, userId: { not: null } },
      select: { userId: true, name: true },
    }),
  ]);
  const personByUser = new Map(persons.map((p) => [p.userId as string, p.name]));

  return (
    <section className="admin-section">
      <h2 className="display">Membres</h2>
      <p className="hint">
        Le rôle « Parent » permet d&apos;ajouter directement ses propres enfants
        dans l&apos;arbre ; les autres ajouts restent soumis à validation. Les
        admins famille sont nommés par la plateforme.
      </p>
      {memberships.map((m) => (
        <div key={m.id} className="queue-item">
          <div className="queue-head">
            <span className="queue-title">
              {m.user.name}
              {personByUser.get(m.userId) && personByUser.get(m.userId) !== m.user.name
                ? ` (carte : ${personByUser.get(m.userId)})`
                : ""}
            </span>
            <span className="badge">{ROLE_LABELS[m.role] ?? m.role}</span>
          </div>
          <div className="queue-meta">{m.user.email}</div>
          {m.role !== "admin" && <FamilyRoleToggle membershipId={m.id} role={m.role} />}
        </div>
      ))}
    </section>
  );
}
