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
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "@/app/actions";

const FAMILY_ROLES = ["admin", "parent", "member"] as const;

function errorMessage(e: unknown, t: Dictionary): string {
  return e instanceof Error ? e.message : t.common.unexpectedError;
}

async function loadMembership(membershipId: string) {
  return prisma.treeMembership.findUnique({
    where: { id: membershipId },
    include: { user: true },
  });
}

async function assertNotLastAdmin(treeId: string, membershipId: string, t: Dictionary) {
  const admins = await prisma.treeMembership.findMany({
    where: { treeId, role: "admin" },
    select: { id: true },
  });
  if (admins.length === 1 && admins[0].id === membershipId)
    throw new Error(t.errors.lastAdminRequired);
}

/** Admin famille : bascule member ↔ parent (jamais admin). */
export async function setFamilyRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getServerDictionary();
  try {
    const membershipId = String(formData.get("membershipId") ?? "");
    const role = String(formData.get("role") ?? "");
    if (role !== "member" && role !== "parent")
      return { ok: false, error: t.errors.limitedRoleGrant };

    const membership = await loadMembership(membershipId);
    if (!membership) return { ok: false, error: t.errors.membershipNotFound };
    await requireAdmin(membership.treeId);

    if (membership.role === "admin")
      return { ok: false, error: t.errors.membershipEditAdminOnly };

    await prisma.treeMembership.update({ where: { id: membership.id }, data: { role } });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}

/** Admin plateforme : n'importe quel rôle, en gardant au moins un admin. */
export async function setRolePlatform(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getServerDictionary();
  try {
    await requirePlatformAdmin();
    const membershipId = String(formData.get("membershipId") ?? "");
    const role = String(formData.get("role") ?? "");
    if (!FAMILY_ROLES.includes(role as (typeof FAMILY_ROLES)[number]))
      return { ok: false, error: t.errors.invalidRole };

    const membership = await loadMembership(membershipId);
    if (!membership) return { ok: false, error: t.errors.membershipNotFound };
    if (membership.role === "admin" && role !== "admin")
      await assertNotLastAdmin(membership.treeId, membership.id, t);

    await prisma.treeMembership.update({ where: { id: membership.id }, data: { role } });
    revalidatePath("/plateforme");
    revalidatePath(`/plateforme/famille/${membership.treeId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}
