"use server";

// Photos des cartes : photo de profil et photo de couverture (une seule par
// carte — colonne unique, remplacée à chaque changement).
// Peuvent modifier : un admin famille (toute carte de son arbre) ou le
// propriétaire du compte lié à la carte.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/authz";
import {
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  deletePhoto,
  isObjectStorageConfigured,
  isOwnedPhotoUrl,
  presignPhotoUpload,
} from "@/lib/storage";
import { savePhoto } from "@/lib/upload";

export type PhotoKind = "profile" | "cover";
export type PhotoState = { ok: boolean; error?: string };

async function authorizePersonPhoto(personId: string) {
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) throw new Error("Carte introuvable.");
  const { user, isAdmin } = await requireMembership(person.treeId);
  if (!isAdmin && person.userId !== user.id)
    throw new Error("Vous ne pouvez modifier que les photos de votre propre carte.");
  return person;
}

/**
 * Autorise un upload direct navigateur → stockage objet.
 * Retourne null si le stockage objet n'est pas configuré (repli : envoyer le
 * fichier à setPersonPhoto).
 */
export async function requestPhotoUpload(
  personId: string,
  contentType: string,
  size: number,
): Promise<{ uploadUrl: string; publicUrl: string } | { error: string } | null> {
  try {
    await authorizePersonPhoto(personId);
    if (!PHOTO_TYPES[contentType])
      return { error: "Format non pris en charge (JPEG, PNG ou WebP)." };
    if (size > PHOTO_MAX_BYTES) return { error: "La photo dépasse 3 Mo." };
    if (!isObjectStorageConfigured()) return null;
    return await presignPhotoUpload(contentType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}

/**
 * Enregistre la photo (profil ou couverture) d'une carte. Deux modes :
 * - `url` : l'upload direct est déjà fait, on ne stocke que l'URL (vérifiée) ;
 * - `photo` (fichier) : repli sans stockage objet, le serveur dépose lui-même.
 * L'ancienne photo du même type est supprimée du stockage (best-effort).
 */
export async function setPersonPhoto(
  _prev: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  try {
    const personId = String(formData.get("personId") ?? "");
    const kind = String(formData.get("kind") ?? "") as PhotoKind;
    if (kind !== "profile" && kind !== "cover")
      return { ok: false, error: "Type de photo invalide." };

    const person = await authorizePersonPhoto(personId);

    let url = String(formData.get("url") ?? "").trim() || null;
    if (url) {
      if (!isOwnedPhotoUrl(url))
        return { ok: false, error: "URL de photo non autorisée." };
    } else {
      const saved = await savePhoto(formData.get("photo"));
      if ("error" in saved) return { ok: false, error: saved.error };
      url = saved.url;
      if (!url) return { ok: false, error: "Aucune photo reçue." };
    }

    const previous = kind === "profile" ? person.photoUrl : person.coverUrl;
    await prisma.person.update({
      where: { id: person.id },
      data: kind === "profile" ? { photoUrl: url } : { coverUrl: url },
    });
    if (previous && previous !== url) await deletePhoto(previous);

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
