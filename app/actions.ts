"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ActionState = { ok: boolean; error?: string };

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Non connecté.");
  return session.user;
}

function readPerson(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sex = String(formData.get("sex") ?? "");
  const birthRaw = String(formData.get("birthYear") ?? "").trim();
  const birthYear = birthRaw ? Number(birthRaw) : null;
  if (!name) return { error: "Le nom est obligatoire." } as const;
  if (sex !== "M" && sex !== "F") return { error: "Le sexe est obligatoire." } as const;
  if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > 2100))
    return { error: "Année de naissance invalide." } as const;
  return { name, sex, birthYear } as const;
}

/** Crée l'arbre de la famille + votre propre carte dedans. */
export async function createFamily(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const treeName = String(formData.get("treeName") ?? "").trim();
  if (!treeName) return { ok: false, error: "Le nom de la famille est obligatoire." };
  const person = readPerson(formData);
  if ("error" in person) return { ok: false, error: person.error };

  const existing = await prisma.treeMembership.findFirst({ where: { userId: user.id } });
  if (existing) return { ok: false, error: "Vous faites déjà partie d'une famille." };

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
