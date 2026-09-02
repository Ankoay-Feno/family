// Stockage objet S3-compatible (MinIO en dev, R2/S3 en prod — mêmes variables).
// Trois usages :
//  - presignPhotoUpload : URL signée pour l'upload DIRECT navigateur → bucket
//    (le serveur ne voit jamais les octets, il ne fait qu'autoriser) ;
//  - uploadPhotoBuffer : dépôt côté serveur (formulaire d'ajout de carte) ;
//  - deletePhoto : nettoyage best-effort quand une photo est remplacée.

import { randomBytes } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const PHOTO_MAX_BYTES = 3 * 1024 * 1024; // 3 Mo
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

export function isObjectStorageConfigured(): boolean {
  return Boolean(
    env("S3_ENDPOINT") &&
      env("S3_ACCESS_KEY") &&
      env("S3_SECRET_KEY") &&
      env("S3_BUCKET") &&
      env("S3_PUBLIC_URL"),
  );
}

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: env("S3_ENDPOINT"),
      region: env("S3_REGION") ?? "us-east-1",
      credentials: {
        accessKeyId: env("S3_ACCESS_KEY")!,
        secretAccessKey: env("S3_SECRET_KEY")!,
      },
      // MinIO et R2 servent les buckets en style « path » (…/bucket/clé).
      forcePathStyle: true,
    });
  }
  return client;
}

export function publicUrlFor(key: string): string {
  return `${env("S3_PUBLIC_URL")!.replace(/\/$/, "")}/${key}`;
}

function newKey(contentType: string): string {
  return `photos/${randomBytes(12).toString("base64url")}${PHOTO_TYPES[contentType]}`;
}

/** URL signée (10 min) pour un PUT direct depuis le navigateur. */
export async function presignPhotoUpload(
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const key = newKey(contentType);
  const uploadUrl = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: env("S3_BUCKET"),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 600 },
  );
  return { uploadUrl, publicUrl: publicUrlFor(key) };
}

/** Dépôt côté serveur (fichier reçu par une server action). */
export async function uploadPhotoBuffer(
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const key = newKey(contentType);
  await s3().send(
    new PutObjectCommand({
      Bucket: env("S3_BUCKET"),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return publicUrlFor(key);
}

/** Supprime l'objet d'une ancienne photo (best-effort, jamais bloquant). */
export async function deletePhoto(url: string | null): Promise<void> {
  if (!url || !isObjectStorageConfigured()) return;
  const prefix = env("S3_PUBLIC_URL")!.replace(/\/$/, "") + "/";
  if (!url.startsWith(prefix)) return; // photo locale ou externe : on ne touche pas
  try {
    await s3().send(
      new DeleteObjectCommand({ Bucket: env("S3_BUCKET"), Key: url.slice(prefix.length) }),
    );
  } catch {
    // best-effort : un objet orphelin vaut mieux qu'une action qui échoue
  }
}

/** true si l'URL vient de notre stockage (objet ou local) — anti-injection. */
export function isOwnedPhotoUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true;
  const pub = env("S3_PUBLIC_URL");
  return Boolean(pub && url.startsWith(pub.replace(/\/$/, "") + "/"));
}
