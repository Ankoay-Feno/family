"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestPhotoUpload, setPersonPhoto, type PhotoKind } from "@/app/actions/photos";
import { useI18n } from "./I18nProvider";
import Spinner from "./Spinner";

/**
 * Bouton « Photo » / « Couverture » d'une carte.
 * Chemin nominal : presign → PUT direct navigateur → stockage objet, puis on
 * n'envoie que l'URL au serveur. Repli sans stockage objet : le fichier part
 * dans la server action.
 */
export default function PhotoUploader({
  personId,
  kind,
  hasPhoto,
}: {
  personId: string;
  kind: PhotoKind;
  hasPhoto: boolean;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const hasCamera = kind === "profile";

  useEffect(() => {
    if (!menuOpen) return;
    // Capture (pas bubble) + stopPropagation : empêche le tiroir de profil
    // parent (qui écoute aussi Echap) de se fermer en même temps.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [menuOpen]);

  async function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const presign = await requestPhotoUpload(personId, file.type, file.size);
      if (presign && "error" in presign) {
        setError(presign.error);
        return;
      }

      const data = new FormData();
      data.set("personId", personId);
      data.set("kind", kind);
      if (presign) {
        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) {
          setError(t.photo.uploadFailed);
          return;
        }
        data.set("url", presign.publicUrl);
      } else {
        data.set("photo", file); // repli : pas de stockage objet configuré
      }

      const result = await setPersonPhoto({ ok: false }, data);
      if (!result.ok) {
        setError(result.error ?? "Erreur inattendue.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }

  const label =
    kind === "profile"
      ? hasPhoto
        ? t.photo.changePhoto
        : t.photo.addPhoto
      : hasPhoto
        ? t.photo.changeCover
        : t.photo.addCover;

  function openPicker() {
    if (hasCamera) setMenuOpen(true);
    else inputRef.current?.click();
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={openPicker}>
        {busy && <Spinner />}
        {busy ? t.photo.sending : label}
      </button>

      {menuOpen && (
        <div className="photo-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="photo-menu-panel" role="menu" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="photo-menu-option"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                cameraInputRef.current?.click();
              }}
            >
              {t.photo.takePhoto}
            </button>
            <button
              type="button"
              className="photo-menu-option"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                inputRef.current?.click();
              }}
            >
              {t.photo.chooseFile}
            </button>
            <button
              type="button"
              className="photo-menu-option photo-menu-cancel"
              onClick={() => setMenuOpen(false)}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {hasCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          hidden
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      )}
      {error && <span className="form-error" style={{ margin: 0 }}>{error}</span>}
    </span>
  );
}
