import type { ReactNode } from "react";
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

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { person: true, tree: true },
  });

  if (!invitation) {
    return (
      <Shell>
        <p>
          Ce lien d&apos;invitation est invalide ou a été révoqué. Demandez un
          nouveau lien à un administrateur de votre famille.
        </p>
      </Shell>
    );
  }

  if (invitation.usedAt || invitation.person.userId) {
    return (
      <Shell>
        <p>
          Cette invitation a déjà été utilisée : la carte de{" "}
          <strong>{invitation.person.name}</strong> est déjà liée à un compte.
        </p>
      </Shell>
    );
  }

  if (isExpired(invitation.expiresAt)) {
    return (
      <Shell>
        <p>
          Cette invitation a expiré. Demandez un nouveau lien à un administrateur
          de la famille «&nbsp;{invitation.tree.name}&nbsp;».
        </p>
      </Shell>
    );
  }

  const user = await getSessionUser();

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
