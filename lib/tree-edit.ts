// Logique partagée d'ajout d'un membre dans l'arbre : lecture du formulaire,
// validation contre l'état ACTUEL de l'arbre, application en transaction.
// Utilisée par l'ajout direct (admin), l'application d'une proposition
// approuvée, et l'approbation d'une demande d'adhésion avec création de carte.

import { prisma } from "./prisma";
import { spouseOf, type RelDTO } from "./family";

export type AddMemberInput = {
  treeId: string;
  name: string;
  sex: "M" | "F";
  birthYear: number | null;
  email: string | null;
  photoUrl: string | null;
  relType: "CHILD_OF" | "PARENT_OF" | "SPOUSE_OF";
  anchorId: string;
};

export function parseAddMemberForm(
  formData: FormData,
): { input: AddMemberInput } | { error: string } {
  const treeId = String(formData.get("treeId") ?? "");
  const anchorId = String(formData.get("anchorId") ?? "");
  const relType = String(formData.get("relType") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sex = String(formData.get("sex") ?? "");
  const birthRaw = String(formData.get("birthYear") ?? "").trim();
  const birthYear = birthRaw ? Number(birthRaw) : null;
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!name) return { error: "Le nom est obligatoire." };
  if (sex !== "M" && sex !== "F") return { error: "Le sexe est obligatoire." };
  if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > 2100))
    return { error: "Année de naissance invalide." };
  if (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Email invalide." };
  if (!["CHILD_OF", "PARENT_OF", "SPOUSE_OF"].includes(relType))
    return { error: "Type de relation invalide." };
  return {
    input: { treeId, anchorId, name, sex, birthYear, email, photoUrl: null, relType } as AddMemberInput,
  };
}

async function loadRels(treeId: string): Promise<RelDTO[]> {
  const rows = await prisma.relationship.findMany({
    where: { treeId },
    select: { type: true, fromId: true, toId: true },
  });
  return rows.map((r) => ({ ...r, type: r.type as RelDTO["type"] }));
}

/** Valide contre l'état actuel de l'arbre. Retourne un message d'erreur ou null. */
export async function validateAddMember(input: AddMemberInput): Promise<string | null> {
  const anchor = await prisma.person.findFirst({
    where: { id: input.anchorId, treeId: input.treeId },
  });
  if (!anchor) return "Personne de référence introuvable.";

  const rels = await loadRels(input.treeId);
  if (input.relType === "SPOUSE_OF" && spouseOf(rels, input.anchorId))
    return `${anchor.name} a déjà un conjoint dans l'arbre.`;
  if (input.relType === "PARENT_OF") {
    const parentCount = rels.filter(
      (r) => r.type === "PARENT" && r.toId === input.anchorId,
    ).length;
    if (parentCount >= 2) return `${anchor.name} a déjà ses deux parents dans l'arbre.`;
  }
  return null;
}

/**
 * Applique l'ajout (personne + relations) en transaction et retourne l'id de
 * la personne créée. `userId` la lie immédiatement à un compte (adhésion).
 * Appeler validateAddMember juste avant — l'arbre a pu changer entre-temps.
 */
export async function applyAddMember(
  input: AddMemberInput,
  userId?: string,
): Promise<string> {
  const rels = await loadRels(input.treeId);
  return prisma.$transaction(async (tx) => {
    const created = await tx.person.create({
      data: {
        treeId: input.treeId,
        name: input.name,
        sex: input.sex,
        birthYear: input.birthYear,
        email: input.email ?? null,
        photoUrl: input.photoUrl ?? null,
        userId: userId ?? null,
      },
    });
    if (input.relType === "SPOUSE_OF") {
      await tx.relationship.create({
        data: { treeId: input.treeId, type: "SPOUSE", fromId: input.anchorId, toId: created.id },
      });
    } else if (input.relType === "PARENT_OF") {
      await tx.relationship.create({
        data: { treeId: input.treeId, type: "PARENT", fromId: created.id, toId: input.anchorId },
      });
    } else {
      await tx.relationship.create({
        data: { treeId: input.treeId, type: "PARENT", fromId: input.anchorId, toId: created.id },
      });
      const coParent = spouseOf(rels, input.anchorId);
      if (coParent)
        await tx.relationship.create({
          data: { treeId: input.treeId, type: "PARENT", fromId: coParent, toId: created.id },
        });
    }
    return created.id;
  });
}

/** Description lisible d'un ajout, pour les files admin. Ex. : « Ajouter Faly (M, 1990) comme enfant de Lalao ». */
export function describeAddMember(input: AddMemberInput, anchorName: string): string {
  const rel =
    input.relType === "CHILD_OF"
      ? `comme enfant de ${anchorName}`
      : input.relType === "PARENT_OF"
        ? `comme parent de ${anchorName}`
        : `comme conjoint·e de ${anchorName}`;
  const details = [input.sex, input.birthYear].filter(Boolean).join(", ");
  return `Ajouter ${input.name} (${details}) ${rel}`;
}
