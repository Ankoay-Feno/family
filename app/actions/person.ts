"use server";

// Édition du surnom d'une carte. Peuvent modifier : un admin famille (toute
// carte de son arbre) ou le propriétaire du compte lié à la carte — même
// règle que pour les photos (voir app/actions/photos.ts).

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireMembership } from "@/lib/authz";
import { MAX_NICKNAME_LENGTH } from "@/lib/tree-edit";
import { getServerDictionary } from "@/lib/i18n/server";

export type NicknameState = { ok: boolean; error?: string };

export async function setPersonNickname(
  _prev: NicknameState,
  formData: FormData,
): Promise<NicknameState> {
  const t = await getServerDictionary();
  try {
    const personId = String(formData.get("personId") ?? "");
    const nickname = String(formData.get("nickname") ?? "").trim();
    if (nickname.length > MAX_NICKNAME_LENGTH)
      return { ok: false, error: t.errors.nicknameTooLong(MAX_NICKNAME_LENGTH) };

    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) return { ok: false, error: t.errors.personNotFound };
    const { user, isAdmin } = await requireMembership(person.treeId);
    if (!isAdmin && person.userId !== user.id)
      return { ok: false, error: t.errors.ownNicknameOnly };

    await prisma.person.update({
      where: { id: person.id },
      data: { nickname: nickname || null },
    });

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : t.common.unexpectedError };
  }
}

export type DeceasedState = { ok: boolean; error?: string };

/** Marque une carte comme décédée (année facultative) — admins famille seulement.
 *  Démarquer efface aussi l'année de décès. */
export async function setPersonDeceased(
  _prev: DeceasedState,
  formData: FormData,
): Promise<DeceasedState> {
  const t = await getServerDictionary();
  try {
    const personId = String(formData.get("personId") ?? "");
    const deceased = formData.get("deceased") === "yes";
    const yearRaw = String(formData.get("deathYear") ?? "").trim();
    const deathYear = deceased && yearRaw ? Number(yearRaw) : null;
    if (deathYear !== null && (!Number.isInteger(deathYear) || deathYear < 1800 || deathYear > 2100))
      return { ok: false, error: t.errors.invalidDeathYear };

    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person) return { ok: false, error: t.errors.personNotFound };
    await requireAdmin(person.treeId);
    if (deathYear !== null && person.birthYear !== null && deathYear < person.birthYear)
      return { ok: false, error: t.errors.deathBeforeBirth };

    await prisma.person.update({
      where: { id: person.id },
      data: { deceased, deathYear },
    });

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : t.common.unexpectedError };
  }
}
