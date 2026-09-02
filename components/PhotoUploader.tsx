"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestPhotoUpload, setPersonPhoto, type PhotoKind } from "@/app/actions/photos";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
          setError("L'envoi vers le stockage a échoué. Réessayez.");
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
    }
  }

  const label = kind === "profile" ? "photo" : "couverture";
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Envoi…" : `${hasPhoto ? "Changer la" : "Ajouter une"} ${label}`}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {error && <span className="form-error" style={{ margin: 0 }}>{error}</span>}
    </span>
  );
}
