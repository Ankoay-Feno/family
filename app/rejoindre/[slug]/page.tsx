// Page publique du lien de présentation d'une famille : un visiteur connecté
// peut y envoyer une demande d'adhésion. Aucune redirection automatique —
// chaque cas affiche une carte explicative. Seul le nom de la famille est révélé.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import JoinRequestForm from "@/components/JoinRequestForm";
import SignupOrLoginForm from "@/components/SignupOrLoginForm";

export default async function RejoindrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tree = await prisma.tree.findUnique({ where: { inviteSlug: slug } });

  if (!tree) {
    return (
      <div className="login-wrap">
        <div className="login-brand">
          <div className="eyebrow">Arbre familial</div>
          <h1 className="display">Fianakaviana</h1>
        </div>
        <div className="login-card">
          <p style={{ margin: 0 }}>Ce lien n&apos;est pas valide.</p>
        </div>
      </div>
    );
  }

  const user = await getSessionUser();

  let card: React.ReactNode;
  if (!user) {
    card = (
      <div className="login-card">
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--muted)" }}>
          Créez votre compte (ou connectez-vous) pour envoyer votre demande
          d&apos;adhésion :
        </p>
        <SignupOrLoginForm />
      </div>
    );
  } else {
    const [membership, pending] = await Promise.all([
      prisma.treeMembership.findUnique({
        where: { treeId_userId: { treeId: tree.id, userId: user.id } },
      }),
      prisma.joinRequest.findFirst({
        where: { treeId: tree.id, userId: user.id, status: "PENDING" },
      }),
    ]);
    if (membership) {
      card = (
        <div className="login-card">
          <p style={{ margin: "0 0 14px" }}>
            Vous êtes déjà membre de cette famille.
          </p>
          <Link href="/" className="btn btn-primary btn-block">
            Voir l&apos;arbre
          </Link>
        </div>
      );
    } else if (pending) {
      card = (
        <div className="login-card">
          <p style={{ margin: 0 }}>
            Votre demande est en attente de validation.
          </p>
        </div>
      );
    } else {
      card = <JoinRequestForm slug={slug} treeName={tree.name} />;
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">Rejoindre la famille</div>
        <h1 className="display">{tree.name}</h1>
      </div>
      {card}
    </div>
  );
}
