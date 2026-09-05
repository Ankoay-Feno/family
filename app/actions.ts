"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";

export type ActionState = { ok: boolean; error?: string };

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error((await getServerDictionary()).errors.notLoggedIn);
  return session.user;
}

function readPerson(formData: FormData, t: Dictionary) {
  const name = String(formData.get("name") ?? "").trim();
  const sex = String(formData.get("sex") ?? "");
  const birthRaw = String(formData.get("birthYear") ?? "").trim();
  const birthYear = birthRaw ? Number(birthRaw) : null;
  if (!name) return { error: t.errors.nameRequired } as const;
  if (sex !== "M" && sex !== "F") return { error: t.errors.sexRequired } as const;
  if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > 2100))
    return { error: t.errors.invalidBirthYear } as const;
  return { name, sex, birthYear } as const;
}

/** Crée l'arbre de la famille + votre propre carte dedans. */
export async function createFamily(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const t = await getServerDictionary();
  const treeName = String(formData.get("treeName") ?? "").trim();
  if (!treeName) return { ok: false, error: t.errors.treeNameRequired };
  const person = readPerson(formData, t);
  if ("error" in person) return { ok: false, error: person.error };

  const existing = await prisma.treeMembership.findFirst({ where: { userId: user.id } });
  if (existing) return { ok: false, error: t.errors.alreadyInFamily };

  await prisma.tree.create({
    data: {
      name: treeName,
      persons: {
        create: {
          name: person.name,
          sex: person.sex,
          birthYear: person.birthYear,
          email: user.email,
          userId: user.id,
        },
      },
      memberships: { create: { userId: user.id, role: "admin" } },
    },
  });

  revalidatePath("/");
  return { ok: true };
}

// L'ajout de membres vit désormais dans app/actions/proposals.ts (application
// directe pour un admin, proposition à valider pour un membre) avec la logique
// partagée de lib/tree-edit.ts.
