import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import AcceptInviteButton from "@/components/AcceptInviteButton";
import SignupOrLoginForm from "@/components/SignupOrLoginForm";

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}

// Page publique : l'invité n'a pas encore de compte, aucun redirect vers /login.
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getSessionUser();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { person: true, tree: true },
  });

  if (!invitation) {
    if (user) redirect("/");
    return (
      <Shell>
        <p>
          Ce lien d&apos;invitation est invalide ou a été révoqué. Demandez un
          nouveau lien à un administrateur de votre famille.
        </p>
        <LoginLink />
      </Shell>
    );
  }

  if (invitation.usedAt || invitation.person.userId) {
    // Cas fréquent : le lien est revisité après une inscription déjà réussie
    // (email rouvert, onglet gardé) — pas une erreur, on ramène vers l'app.
    if (user) redirect("/");
    return (
      <Shell>
        <p>
          Cette invitation a déjà été utilisée : la carte de{" "}
          <strong>{invitation.person.name}</strong> est déjà liée à un compte.
        </p>
        <LoginLink />
      </Shell>
    );
  }

  if (isExpired(invitation.expiresAt)) {
    if (user) redirect("/");
    return (
      <Shell>
        <p>
          Cette invitation a expiré. Demandez un nouveau lien à un administrateur
          de la famille «&nbsp;{invitation.tree.name}&nbsp;».
        </p>
        <LoginLink />
      </Shell>
    );
  }

  return (
    <Shell>
      <p>
        La famille «&nbsp;<strong>{invitation.tree.name}</strong>&nbsp;» vous
        invite à devenir «&nbsp;<strong>{invitation.person.name}</strong>&nbsp;»
        dans son arbre généalogique.
      </p>
      {user ? (
        <AcceptInviteButton token={invitation.token} />
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Créez votre compte (ou connectez-vous) pour accepter :
          </p>
          <SignupOrLoginForm
            defaultName={invitation.person.name}
            defaultEmail={invitation.person.email ?? ""}
          />
        </>
      )}
    </Shell>
  );
}

function LoginLink() {
  return (
    <Link href="/login" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
      Se connecter
    </Link>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">Invitation</div>
        <h1 className="display">Fianakaviana</h1>
      </div>
      <div className="login-card">{children}</div>
    </div>
  );
}
