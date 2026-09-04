import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPlatformAdmin } from "@/lib/authz";
import { countGenerations, type PersonDTO, type RelDTO } from "@/lib/family";
import TreeView from "@/components/TreeView";
import MemberRoleRow from "@/components/platform/MemberRoleRow";

export default async function PlatformFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await isPlatformAdmin(user.id))) redirect("/");

  const { id } = await params;
  const tree = await prisma.tree.findUnique({
    where: { id },
    include: {
      persons: { orderBy: { createdAt: "asc" } },
      relationships: true,
      memberships: { include: { user: true }, orderBy: { role: "asc" } },
    },
  });
  if (!tree) redirect("/plateforme");

  const persons: PersonDTO[] = tree.persons.map((p) => ({
    id: p.id,
    name: p.name,
    nickname: p.nickname,
    sex: p.sex as PersonDTO["sex"],
    birthYear: p.birthYear,
    deathYear: p.deathYear,
    photoUrl: p.photoUrl,
    coverUrl: p.coverUrl,
    email: p.email,
    hasAccount: p.userId !== null,
  }));
  const rels: RelDTO[] = tree.relationships.map((r) => ({
    type: r.type as RelDTO["type"],
    fromId: r.fromId,
    toId: r.toId,
  }));
  const generations = countGenerations(
    rels,
    persons.map((p) => p.id),
  );
  const personByUser = new Map(
    tree.persons.filter((p) => p.userId).map((p) => [p.userId as string, p.name]),
  );

  return (
    <>
      <header className="app-head">
        <div>
          <div className="eyebrow">Plateforme · lecture seule</div>
          <h1 className="display">{tree.name}</h1>
        </div>
        <div className="head-right">
          <div className="stats">
            {generations} génération{generations > 1 ? "s" : ""} · {persons.length} membre
            {persons.length > 1 ? "s" : ""}
          </div>
          <Link href="/plateforme" className="btn-link">
            ← Toutes les familles
          </Link>
        </div>
      </header>
      <TreeView treeId={tree.id} persons={persons} rels={rels} youPersonId={null} readOnly />
      <main className="admin-wrap" style={{ marginTop: 20 }}>
        <section className="admin-section">
          <h2 className="display">Comptes et rôles</h2>
          <p className="hint">
            Seule la plateforme peut nommer ou retirer un admin famille ; il doit
            toujours en rester au moins un.
          </p>
          {tree.memberships.length === 0 ? (
            <p className="empty">Aucun compte lié à cette famille.</p>
          ) : (
            tree.memberships.map((m) => (
              <MemberRoleRow
                key={m.id}
                membershipId={m.id}
                userName={m.user.name}
                userEmail={m.user.email}
                personName={personByUser.get(m.userId) ?? null}
                role={m.role}
              />
            ))
          )}
        </section>
      </main>
    </>
  );
}
