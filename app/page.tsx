import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countGenerations, type PersonDTO, type RelDTO } from "@/lib/family";
import TreeView from "@/components/TreeView";
import CreateFamilyForm from "@/components/CreateFamilyForm";
import SignOutButton from "@/components/SignOutButton";
import PendingRequestNotice from "@/components/PendingRequestNotice";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const membership = await prisma.treeMembership.findFirst({
    where: { userId: session.user.id },
    include: {
      tree: {
        include: {
          persons: { orderBy: { createdAt: "asc" } },
          relationships: true,
          memberships: true,
        },
      },
    },
  });

  const platformAdmin =
    (
      await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isPlatformAdmin: true },
      })
    )?.isPlatformAdmin ?? false;

  if (!membership) {
    // L'admin plateforme sans famille va à son dashboard.
    if (platformAdmin) redirect("/plateforme");
    // Une demande d'adhésion en attente ? Ne pas proposer de créer une famille.
    const pending = await prisma.joinRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
      include: { tree: true },
    });
    if (pending) return <PendingRequestNotice treeName={pending.tree.name} />;
    return <CreateFamilyForm userName={session.user.name} />;
  }

  const tree = membership.tree;
  const role = membership.role as "admin" | "parent" | "member";
  const isAdmin = role === "admin";
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
  const youPersonId = tree.persons.find((p) => p.userId === session.user.id)?.id ?? null;

  const generations = countGenerations(
    rels,
    persons.map((p) => p.id),
  );
  const linked = persons.filter((p) => p.hasAccount).length;

  return (
    <>
      <header className="app-head">
        <div>
          <div className="eyebrow">Arbre familial</div>
          <h1 className="display">{tree.name}</h1>
        </div>
        <div className="head-right">
          <div className="stats">
            {generations} génération{generations > 1 ? "s" : ""} · {persons.length} membre
            {persons.length > 1 ? "s" : ""} · {linked} compte{linked > 1 ? "s" : ""} lié
            {linked > 1 ? "s" : ""}
          </div>
          <div className="userbox">
            <span>{session.user.name}</span>
            {platformAdmin && (
              <Link href="/plateforme" className="btn-link">
                Plateforme
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="btn-link">
                Administration
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <TreeView
        treeId={tree.id}
        persons={persons}
        rels={rels}
        youPersonId={youPersonId}
        role={role}
      />
      <footer className="app-foot">
        Cliquez sur un membre pour voir sa fiche · « Ajouter un membre » pour agrandir
        l&apos;arbre.
      </footer>
    </>
  );
}
