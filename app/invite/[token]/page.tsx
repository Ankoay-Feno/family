import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
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
  const t = await getServerDictionary();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { person: true, tree: true },
  });

  if (!invitation) {
    if (user) redirect("/");
    return (
      <Shell t={t}>
        <p>{t.invitePage.invalidOrRevoked}</p>
        <LoginLink t={t} />
      </Shell>
    );
  }

  if (invitation.usedAt || invitation.person.userId) {
    // Cas fréquent : le lien est revisité après une inscription déjà réussie
    // (email rouvert, onglet gardé) — pas une erreur, on ramène vers l'app.
    if (user) redirect("/");
    return (
      <Shell t={t}>
        <p>{t.invitePage.alreadyUsed(invitation.person.name)}</p>
        <LoginLink t={t} />
      </Shell>
    );
  }

  if (isExpired(invitation.expiresAt)) {
    if (user) redirect("/");
    return (
      <Shell t={t}>
        <p>{t.invitePage.expired(invitation.tree.name)}</p>
        <LoginLink t={t} />
      </Shell>
    );
  }

  return (
    <Shell t={t}>
      <p>{t.invitePage.offer(invitation.tree.name, invitation.person.name)}</p>
      {user ? (
        <AcceptInviteButton token={invitation.token} />
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>{t.invitePage.createAccountHint}</p>
          <SignupOrLoginForm
            defaultName={invitation.person.name}
            defaultEmail={invitation.person.email ?? ""}
          />
        </>
      )}
    </Shell>
  );
}

function LoginLink({ t }: { t: Dictionary }) {
  return (
    <Link href="/login" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
      {t.invitePage.login}
    </Link>
  );
}

function Shell({ t, children }: { t: Dictionary; children: ReactNode }) {
  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">{t.invitePage.eyebrow}</div>
        <h1 className="display">{t.common.appName}</h1>
      </div>
      <div className="login-card">{children}</div>
    </div>
  );
}
