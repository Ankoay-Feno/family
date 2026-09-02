"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/authz";

export type InviteState = { ok: boolean; error?: string; path?: string };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Génère un lien d'invitation à usage unique pour une carte sans compte.
 * Toute invitation non utilisée existante pour cette personne est remplacée.
 */
export async function createInvitation(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const treeId = String(formData.get("treeId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const { user } = await requireAdmin(treeId);

  const person = await prisma.person.findFirst({ where: { id: personId, treeId } });
  if (!person) return { ok: false, error: "Personne introuvable dans cette famille." };
  if (person.userId)
    return { ok: false, error: "Cette personne est déjà liée à un compte." };

  const token = randomBytes(24).toString("base64url");
  await prisma.$transaction([
    prisma.invitation.deleteMany({ where: { personId, usedAt: null } }),
    prisma.invitation.create({
      data: {
        treeId,
        personId,
        token,
        createdBy: user.id,
        expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
      },
    }),
  ]);

  revalidatePath("/admin");
  return { ok: true, path: `/invite/${token}` };
}

/** L'invité connecté accepte l'invitation : sa carte lui est liée, il devient membre. */
export async function acceptInvitation(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { person: true, tree: true },
  });
  if (!invitation)
    return { ok: false, error: "Invitation introuvable ou révoquée." };
  if (invitation.usedAt)
    return { ok: false, error: "Cette invitation a déjà été utilisée." };
  if (invitation.expiresAt.getTime() < Date.now())
    return {
      ok: false,
      error: "Cette invitation a expiré. Demandez un nouveau lien à un administrateur.",
    };
  if (invitation.person.userId)
    return { ok: false, error: "Cette carte est déjà liée à un autre compte." };

  const existing = await prisma.treeMembership.findFirst({ where: { userId: user.id } });
  if (existing)
    return {
      ok: false,
      error: "Un compte ne peut appartenir qu'à une seule famille pour l'instant.",
    };

  await prisma.$transaction([
    prisma.person.update({
      where: { id: invitation.personId },
      // La carte hérite de l'email du compte si elle n'en avait pas.
      data: { userId: user.id, email: invitation.person.email ?? user.email },
    }),
    prisma.treeMembership.create({
      // Le rôle accordé est porté par l'invitation ("admin" quand la
      // plateforme désigne l'admin fondateur d'une famille).
      data: { treeId: invitation.treeId, userId: user.id, role: invitation.role },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date(), usedBy: user.id },
    }),
  ]);

  revalidatePath("/");
  return { ok: true };
}

/** Supprime une invitation non utilisée (admin de l'arbre concerné). */
export async function revokeInvitation(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const invitationId = String(formData.get("invitationId") ?? "");

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return { ok: false, error: "Invitation introuvable." };
  await requireAdmin(invitation.treeId);
  if (invitation.usedAt)
    return { ok: false, error: "Cette invitation a déjà été utilisée." };

  await prisma.invitation.delete({ where: { id: invitationId } });

  revalidatePath("/admin");
  return { ok: true };
}
