// Lecture d'une image depuis le presse-papiers — côté navigateur uniquement.
// Ne jamais importer de module serveur ici (ce fichier part dans le bundle client).

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Image collée via Ctrl+V / Cmd+V (événement `paste`), ou null. */
export function imageFileFromPaste(e: ClipboardEvent): File | null {
  const files = Array.from(e.clipboardData?.files ?? []);
  return files.find((f) => f.type.startsWith("image/")) ?? null;
}

export type ClipboardImageResult = { file: File } | { error: "unsupported" | "empty" };

/**
 * Lit une image via l'API Clipboard asynchrone (à appeler depuis un clic :
 * le navigateur exige un geste utilisateur et peut demander une permission).
 */
export async function readClipboardImage(): Promise<ClipboardImageResult> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.read) return { error: "unsupported" };
  let items: ClipboardItems;
  try {
    items = await navigator.clipboard.read();
  } catch {
    return { error: "empty" };
  }
  for (const item of items) {
    const type = item.types.find((t) => t.startsWith("image/"));
    if (!type) continue;
    const blob = await item.getType(type);
    return {
      file: new File([blob], `presse-papiers.${EXT[blob.type] ?? "png"}`, { type: blob.type }),
    };
  }
  return { error: "empty" };
}
