import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProposalsSection from "@/components/admin/ProposalsSection";
import JoinRequestsSection from "@/components/admin/JoinRequestsSection";
import InvitationsSection from "@/components/admin/InvitationsSection";
import MembersSection from "@/components/admin/MembersSection";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const t = await getServerDictionary();

  const membership = await prisma.treeMembership.findFirst({
    where: { userId: session.user.id },
    include: { tree: true },
  });
  if (!membership || membership.role !== "admin") redirect("/");
  const tree = membership.tree;

  // Lien de présentation : généré à la première visite de cette page.
  let inviteSlug = tree.inviteSlug;
  if (!inviteSlug) {
    inviteSlug = randomBytes(9).toString("base64url");
    await prisma.tree.update({ where: { id: tree.id }, data: { inviteSlug } });
  }

  return (
    <>
      <header className="app-head">
        <div>
          <div className="eyebrow">{t.admin.eyebrow}</div>
          <h1 className="display">{tree.name}</h1>
        </div>
        <div className="head-right">
          <Link href="/" className="btn-link">
            {t.nav.backToTree}
          </Link>
        </div>
      </header>
      <main className="admin-wrap">
        <section className="admin-section">
          <h2 className="display">{t.admin.presentationLink.title}</h2>
          <p className="hint">{t.admin.presentationLink.hint}</p>
          <div className="link-box">
            <code>/rejoindre/{inviteSlug}</code>
          </div>
        </section>
        <ProposalsSection treeId={tree.id} />
        <JoinRequestsSection treeId={tree.id} />
        <InvitationsSection treeId={tree.id} />
        <MembersSection treeId={tree.id} />
      </main>
    </>
  );
}
