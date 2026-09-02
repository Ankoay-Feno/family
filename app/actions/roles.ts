"use server";

// Gestion des rôles.
// - Un admin famille peut basculer les membres de SA famille entre
//   "member" et "parent". Nommer ou retirer un admin famille est réservé
//   à l'administration de la plateforme.
// - Un admin plateforme peut donner n'importe quel rôle dans n'importe
//   quelle famille, avec un garde-fou : il reste toujours au moins un admin.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePlatformAdmin } from "@/lib/authz";
import type { ActionState } from "@/app/actions";

const FAMILY_ROLES = ["admin", "parent", "member"] as const;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Erreur inattendue.";
}

async function loadMembership(membershipId: string) {
  return prisma.treeMembership.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });
}

async function assertNotLastAdmin(treeId: string, membershipId: string) {
  const admins = await prisma.treeMembership.findMany({
    where: { treeId, role: "admin" },
    select: { id: true },
  });
  if (admins.length === 1 && admins[0].id === membershipId)
    throw new Error("Impossible : la famille doit garder au moins un admin.");
}

/** Admin famille : bascule member ↔ parent (jamais admin). */
export async function setFamilyRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const membershipId = String(formData.get("membershipId") ?? "");
    const role = String(formData.get("role") ?? "");
    if (role !== "member" && role !== "parent")
      return { ok: false, error: "Un admin famille ne peut donner que les rôles membre ou parent." };

    const membership = await loadMembership(membershipId);
    if (!membership) return { ok: false, error: "Membre introuvable." };
    await requireAdmin(membership.treeId);

    if (membership.role === "admin")
      return {
        ok: false,
        error: "Modifier un admin famille est réservé à l'administration de la plateforme.",
      };

    await prisma.treeMembership.update({ where: { id: membership.id }, data: { role } });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

/** Admin plateforme : n'importe quel rôle, en gardant au moins un admin. */
export async function setRolePlatform(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requirePlatformAdmin();
    const membershipId = String(formData.get("membershipId") ?? "");
    const role = String(formData.get("role") ?? "");
    if (!FAMILY_ROLES.includes(role as (typeof FAMILY_ROLES)[number]))
      return { ok: false, error: "Rôle invalide." };

    const membership = await loadMembership(membershipId);
    if (!membership) return { ok: false, error: "Membre introuvable." };
    if (membership.role === "admin" && role !== "admin")
      await assertNotLastAdmin(membership.treeId, membership.id);

    await prisma.treeMembership.update({ where: { id: membership.id }, data: { role } });
    revalidatePath("/plateforme");
    revalidatePath(`/plateforme/famille/${membership.treeId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}
