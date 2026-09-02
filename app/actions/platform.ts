"use server";

// Actions réservées à l'administration de la plateforme.

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/authz";

export type CreateFamilyState = { ok: boolean; error?: string; path?: string };

/**
 * Crée une famille avec la carte de son fondateur et retourne un lien
 * d'invitation « admin » : la personne qui l'accepte devient l'admin famille.
 */
export async function createFamilyPlatform(
  _prev: CreateFamilyState,
  formData: FormData,
): Promise<CreateFamilyState> {
  try {
    const admin = await requirePlatformAdmin();

    const treeName = String(formData.get("treeName") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const sex = String(formData.get("sex") ?? "");
    const birthRaw = String(formData.get("birthYear") ?? "").trim();
    const birthYear = birthRaw ? Number(birthRaw) : null;
    const email = String(formData.get("email") ?? "").trim() || null;

    if (!treeName) return { ok: false, error: "Le nom de la famille est obligatoire." };
    if (!name) return { ok: false, error: "Le nom du fondateur est obligatoire." };
    if (sex !== "M" && sex !== "F") return { ok: false, error: "Le sexe est obligatoire." };
    if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > 2100))
      return { ok: false, error: "Année de naissance invalide." };

    const token = randomBytes(24).toString("base64url");
    const tree = await prisma.tree.create({
      data: {
        name: treeName,
        persons: { create: { name, sex, birthYear, email } },
      },
      include: { persons: true },
    });
    await prisma.invitation.create({
      data: {
        treeId: tree.id,
        personId: tree.persons[0].id,
        token,
        role: "admin",
        createdBy: admin.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });

    revalidatePath("/plateforme");
    return { ok: true, path: `/invite/${token}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
