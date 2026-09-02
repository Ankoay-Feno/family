// Réception d'une photo envoyée à travers une server action (formulaire
// d'ajout de carte, replis). Direction : le stockage objet s'il est configuré
// (MinIO/R2/S3), sinon public/uploads/ en local.

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  isObjectStorageConfigured,
  uploadPhotoBuffer,
} from "./storage";

/**
 * Enregistre la photo si présente et valide. Retourne son URL publique,
 * null si aucun fichier, ou un message d'erreur.
 */
export async function savePhoto(
  value: FormDataEntryValue | null,
): Promise<{ url: string | null } | { error: string }> {
  if (!value || typeof value === "string") return { url: null };
  const file = value;
  if (file.size === 0) return { url: null };
  if (file.size > PHOTO_MAX_BYTES) return { error: "La photo dépasse 3 Mo." };
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { error: "Format de photo non pris en charge (JPEG, PNG ou WebP)." };

  const buffer = Buffer.from(await file.arrayBuffer());

  if (isObjectStorageConfigured()) {
    try {
      return { url: await uploadPhotoBuffer(buffer, file.type) };
    } catch {
      // stockage objet injoignable : on retombe sur le disque local
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = randomBytes(12).toString("base64url") + ext;
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${name}` };
}
