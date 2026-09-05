"use server";

// Actions réservées à l'administration de la plateforme.

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/authz";
import { deletePhoto } from "@/lib/storage";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "@/app/actions";

export type CreateFamilyState = { ok: boolean; error?: string; path?: string };

const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;

function errorMessage(e: unknown, t: Dictionary): string {
  return e instanceof Error ? e.message : t.common.unexpectedError;
}

/**
 * Crée une famille avec la carte de son fondateur et retourne un lien
 * d'invitation « admin » : la personne qui l'accepte devient l'admin famille.
 */
export async function createFamilyPlatform(
  _prev: CreateFamilyState,
  formData: FormData,
): Promise<CreateFamilyState> {
  const t = await getServerDictionary();
  try {
    const admin = await requirePlatformAdmin();

    const treeName = String(formData.get("treeName") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const sex = String(formData.get("sex") ?? "");
    const birthRaw = String(formData.get("birthYear") ?? "").trim();
    const birthYear = birthRaw ? Number(birthRaw) : null;
    const email = String(formData.get("email") ?? "").trim() || null;

    if (!treeName) return { ok: false, error: t.errors.treeNameRequired };
    if (!name) return { ok: false, error: t.errors.founderNameRequired };
    if (sex !== "M" && sex !== "F") return { ok: false, error: t.errors.sexRequired };
    if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > 2100))
      return { ok: false, error: t.errors.invalidBirthYear };

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
        expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
      },
    });

    revalidatePath("/plateforme");
    return { ok: true, path: `/invite/${token}` };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}

/**
 * Régénère le lien d'invitation du fondateur : uniquement tant que personne
 * n'a encore rejoint la famille (aucune TreeMembership), sinon la gestion
 * des invitations relève de l'admin famille depuis /admin.
 */
export async function regenerateFounderInvitation(
  _prev: CreateFamilyState,
  formData: FormData,
): Promise<CreateFamilyState> {
  const t = await getServerDictionary();
  try {
    const admin = await requirePlatformAdmin();
    const treeId = String(formData.get("treeId") ?? "");

    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      include: {
        persons: { orderBy: { createdAt: "asc" }, take: 1 },
        memberships: { select: { id: true } },
      },
    });
    if (!tree) return { ok: false, error: t.errors.familyNotFound };
    if (tree.memberships.length > 0)
      return { ok: false, error: t.errors.founderAlreadyJoined };
    const founder = tree.persons[0];
    if (!founder) return { ok: false, error: t.errors.noFounder };

    const token = randomBytes(24).toString("base64url");
    await prisma.$transaction([
      prisma.invitation.deleteMany({ where: { personId: founder.id, usedAt: null } }),
      prisma.invitation.create({
        data: {
          treeId,
          personId: founder.id,
          token,
          role: "admin",
          createdBy: admin.id,
          expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
        },
      }),
    ]);

    revalidatePath("/plateforme");
    return { ok: true, path: `/invite/${token}` };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}

/**
 * Supprime définitivement une famille (arbre, personnes, relations,
 * adhésions, invitations, demandes, propositions — cascade en base) ainsi
 * que ses photos dans le stockage objet.
 */
export async function deleteFamilyPlatform(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getServerDictionary();
  try {
    await requirePlatformAdmin();
    const treeId = String(formData.get("treeId") ?? "");

    const tree = await prisma.tree.findUnique({
      where: { id: treeId },
      include: { persons: { select: { photoUrl: true, coverUrl: true } } },
    });
    if (!tree) return { ok: false, error: t.errors.familyNotFound };

    for (const person of tree.persons) {
      await deletePhoto(person.photoUrl);
      await deletePhoto(person.coverUrl);
    }
    await prisma.tree.delete({ where: { id: treeId } });

    revalidatePath("/plateforme");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}
