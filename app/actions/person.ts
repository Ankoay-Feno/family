"use server";

// Édition du surnom d'une carte. Peuvent modifier : un admin famille (toute
// carte de son arbre) ou le propriétaire du compte lié à la carte — même
// règle que pour les photos (voir app/actions/photos.ts).

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/authz";
import { MAX_NICKNAME_LENGTH } from "@/lib/tree-edit";

export type NicknameState = { ok: boolean; error?: string };

export async function setPersonNickname(
  _prev: NicknameState,
  formData: FormData,
): Promise<NicknameState> {
  try {
    const personId = String(formData.get("personId") ?? "");
    const nickname = String(formData.get("nickname") ?? "").trim();
    if (nickname.length > MAX_NICKNAME_LENGTH)
      return { ok: false, error: `Le surnom ne doit pas dépasser ${MAX_NICKNAME_LENGTH} caractères.` };

    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) return { ok: false, error: "Carte introuvable." };
    const { user, isAdmin } = await requireMembership(person.treeId);
    if (!isAdmin && person.userId !== user.id)
      return { ok: false, error: "Vous ne pouvez modifier que le surnom de votre propre carte." };

    await prisma.person.update({
      where: { id: person.id },
      data: { nickname: nickname || null },
    });

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur inattendue." };
  }
}
