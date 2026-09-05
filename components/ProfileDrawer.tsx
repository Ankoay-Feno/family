"use client";

// Menu profil global (déclenché par l'avatar dans le coin, façon Facebook) :
// déconnexion + édition de sa propre carte (surnom, photo, couverture) sans
// avoir à aller chercher sa carte dans l'arbre.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { PersonDTO } from "@/lib/family";
import Avatar from "./Avatar";
import PhotoUploader from "./PhotoUploader";
import NicknameEditor from "./NicknameEditor";
import { useI18n } from "./I18nProvider";
import Spinner from "./Spinner";

export default function ProfileDrawer({
  userName,
  person,
  isAdmin,
  isPlatformAdmin,
}: {
  userName: string;
  person: PersonDTO | null;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initial = userName.trim().charAt(0).toUpperCase();

  return (
    <>
      <button
        type="button"
        className="profile-trigger avatar"
        aria-label={t.profileMenu.openLabel}
        onClick={() => setOpen(true)}
      >
        {person ? <Avatar person={person} /> : <span className="profile-fallback">{initial}</span>}
      </button>

      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)}>
          <aside
            className="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t.profileMenu.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <span className="avatar drawer-avatar">
                {person ? (
                  <Avatar person={person} />
                ) : (
                  <span className="profile-fallback">{initial}</span>
                )}
              </span>
              <div className="drawer-identity">
                <div className="drawer-name">{userName}</div>
                {person && <NicknameEditor personId={person.id} nickname={person.nickname} />}
              </div>
              <button
                type="button"
                className="btn-link drawer-close"
                onClick={() => setOpen(false)}
              >
                {t.common.close}
              </button>
            </div>

            {person && (
              <div className="drawer-section">
                <PhotoUploader
                  personId={person.id}
                  kind="profile"
                  hasPhoto={person.photoUrl !== null}
                />
                <PhotoUploader
                  personId={person.id}
                  kind="cover"
                  hasPhoto={person.coverUrl !== null}
                />
              </div>
            )}

            {(isPlatformAdmin || isAdmin) && (
              <nav className="drawer-nav">
                {isPlatformAdmin && (
                  <Link href="/plateforme" className="drawer-link" onClick={() => setOpen(false)}>
                    {t.nav.platform}
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="drawer-link" onClick={() => setOpen(false)}>
                    {t.nav.administration}
                  </Link>
                )}
              </nav>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-block drawer-signout"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                await authClient.signOut();
                router.push("/login");
                router.refresh();
              }}
            >
              {signingOut && <Spinner />}
              {signingOut ? t.nav.signingOut : t.nav.signOut}
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
