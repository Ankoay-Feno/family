// Section « Membres » de la page admin famille : rôles member ↔ parent.
// Les admins famille eux-mêmes sont gérés par la plateforme.

import { prisma } from "@/lib/prisma";
import { getServerDictionary } from "@/lib/i18n/server";
import FamilyRoleToggle from "./FamilyRoleToggle";

export default async function MembersSection({ treeId }: { treeId: string }) {
  const [memberships, persons, t] = await Promise.all([
    prisma.treeMembership.findMany({
      where: { treeId },
      include: { user: true },
      orderBy: { role: "asc" },
    }),
    prisma.person.findMany({
      where: { treeId, userId: { not: null } },
      select: { userId: true, name: true },
    }),
    getServerDictionary(),
  ]);
  const personByUser = new Map(persons.map((p) => [p.userId as string, p.name]));
  const ROLE_LABELS: Record<string, string> = {
    admin: t.admin.members.roleAdmin,
    parent: t.admin.members.roleParent,
    member: t.admin.members.roleMember,
  };

  return (
    <section className="admin-section">
      <h2 className="display">{t.admin.members.title}</h2>
      <p className="hint">{t.admin.members.hint}</p>
      {memberships.map((m) => (
        <div key={m.id} className="queue-item">
          <div className="queue-head">
            <span className="queue-title">
              {m.user.name}
              {personByUser.get(m.userId) && personByUser.get(m.userId) !== m.user.name
                ? t.common.cardSuffix(personByUser.get(m.userId)!)
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
