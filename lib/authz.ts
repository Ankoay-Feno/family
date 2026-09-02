// Helpers d'autorisation pour les pages serveur et les server actions.
// Règle du projet : chaque action revérifie session ET permissions — jamais
// de confiance dans ce que le client affiche ou cache.

import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Non connecté.");
  return user;
}

/** L'utilisateur courant doit être membre de l'arbre. */
export async function requireMembership(treeId: string) {
  const user = await requireUser();
  const membership = await prisma.treeMembership.findUnique({
    where: { treeId_userId: { treeId, userId: user.id } },
  });
  if (!membership) throw new Error("Vous n'êtes pas membre de cette famille.");
  return { user, membership, isAdmin: membership.role === "admin" };
}

/** L'utilisateur courant doit être admin de l'arbre. */
export async function requireAdmin(treeId: string) {
  const ctx = await requireMembership(treeId);
  if (!ctx.isAdmin) throw new Error("Action réservée aux administrateurs.");
  return ctx;
}

/** true si le compte est admin de la plateforme. */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true },
  });
  return row?.isPlatformAdmin ?? false;
}

/** L'utilisateur courant doit être admin de la plateforme. */
export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!(await isPlatformAdmin(user.id)))
    throw new Error("Action réservée à l'administration de la plateforme.");
  return user;
}
