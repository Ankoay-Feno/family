"use server";

// Server actions du flux « Demandes d'adhésion » : un visiteur avec un compte
// demande à rejoindre une famille via son lien public, un admin décide.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/authz";
import {
  parseAddMemberForm,
  validateAddMember,
  applyAddMember,
} from "@/lib/tree-edit";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";

export type JoinState = { ok: boolean; error?: string };

function fail(error: string): JoinState {
  return { ok: false, error };
}

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

/** Charge une demande PENDING et vérifie que l'utilisateur courant est admin
 *  de son arbre. Retourne { error } (message affichable) sinon — le champ
 *  `error` sert de discriminant (undefined en cas de succès). */
async function loadPendingForAdmin(requestId: string, t: Dictionary) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) return { error: t.errors.requestNotFound } as const;
  let ctx;
  try {
    ctx = await requireAdmin(request.treeId);
  } catch (e) {
    return { error: message(e, t.errors.adminOnly) } as const;
  }
  if (request.status !== "PENDING")
    return { error: t.errors.requestAlreadyHandled } as const;
  const existing = await prisma.treeMembership.findFirst({
    where: { userId: request.userId },
  });
  if (existing) return { error: t.errors.personAlreadyInFamily } as const;
  return { error: undefined, request, admin: ctx.user } as const;
}

/** Le visiteur connecté envoie sa demande via le lien public /rejoindre/{slug}. */
export async function submitJoinRequest(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const t = await getServerDictionary();
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    return fail(message(e, t.errors.notLoggedIn));
  }

  const slug = String(formData.get("slug") ?? "");
  const msg = String(formData.get("message") ?? "").trim();

  const tree = await prisma.tree.findUnique({ where: { inviteSlug: slug } });
  if (!tree) return fail(t.errors.linkInvalid);

  if (!msg) return fail(t.errors.messageRequired);
  if (msg.length > 500) return fail(t.errors.messageTooLong);

  const membership = await prisma.treeMembership.findFirst({
    where: { userId: user.id },
  });
  if (membership) return fail(t.errors.alreadyInFamily);

  // @@unique([treeId, userId]) : une seule demande par personne et par arbre.
  // Une ancienne demande refusée est remplacée plutôt que dupliquée.
  const existing = await prisma.joinRequest.findUnique({
    where: { treeId_userId: { treeId: tree.id, userId: user.id } },
  });
  if (existing?.status === "PENDING") return fail(t.errors.requestAlreadyPending);
  if (existing) {
    await prisma.joinRequest.update({
      where: { id: existing.id },
      data: {
        message: msg,
        status: "PENDING",
        decidedBy: null,
        decidedAt: null,
        createdAt: new Date(),
      },
    });
  } else {
    await prisma.joinRequest.create({
      data: { treeId: tree.id, userId: user.id, message: msg },
    });
  }

  revalidatePath("/admin");
  return { ok: true };
}

/** Approuve en rattachant le demandeur à une carte existante sans compte. */
export async function approveJoinRequestLink(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const t = await getServerDictionary();
  const requestId = String(formData.get("requestId") ?? "");
  const personId = String(formData.get("personId") ?? "");

  const loaded = await loadPendingForAdmin(requestId, t);
  if (loaded.error !== undefined) return fail(loaded.error);
  const { request, admin } = loaded;

  const person = await prisma.person.findFirst({
    where: { id: personId, treeId: request.treeId },
  });
  if (!person) return fail(t.errors.cardNotFoundInTree);
  if (person.userId) return fail(t.errors.personAlreadyLinkedNamed(person.name));

  await prisma.$transaction([
    prisma.person.update({
      where: { id: person.id },
      // La carte hérite de l'email du compte si elle n'en avait pas.
      data: { userId: request.userId, email: person.email ?? request.user.email },
    }),
    prisma.treeMembership.create({
      data: { treeId: request.treeId, userId: request.userId, role: "member" },
    }),
    prisma.joinRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", decidedBy: admin.id, decidedAt: new Date() },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

/** Approuve en créant la carte du demandeur avec sa relation dans l'arbre. */
export async function approveJoinRequestCreate(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const t = await getServerDictionary();
  const requestId = String(formData.get("requestId") ?? "");

  const loaded = await loadPendingForAdmin(requestId, t);
  if (loaded.error !== undefined) return fail(loaded.error);
  const { request, admin } = loaded;

  const parsed = parseAddMemberForm(formData, t);
  if ("error" in parsed) return fail(parsed.error);
  // On ne fait pas confiance au treeId du formulaire : c'est celui de la demande.
  // La carte créée hérite de l'email du compte du demandeur par défaut.
  const input = {
    ...parsed.input,
    treeId: request.treeId,
    email: parsed.input.email ?? request.user.email,
  };

  const invalid = await validateAddMember(input, t);
  if (invalid) return fail(invalid);

  // Crée la carte déjà liée au compte du demandeur.
  await applyAddMember(input, request.userId);

  await prisma.$transaction([
    prisma.treeMembership.create({
      data: { treeId: request.treeId, userId: request.userId, role: "member" },
    }),
    prisma.joinRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", decidedBy: admin.id, decidedAt: new Date() },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

/** Refuse la demande. */
export async function rejectJoinRequest(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const t = await getServerDictionary();
  const requestId = String(formData.get("requestId") ?? "");

  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return fail(t.errors.requestNotFound);
  let ctx;
  try {
    ctx = await requireAdmin(request.treeId);
  } catch (e) {
    return fail(message(e, t.errors.adminOnly));
  }
  if (request.status !== "PENDING") return fail(t.errors.requestAlreadyHandled);

  await prisma.joinRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED", decidedBy: ctx.user.id, decidedAt: new Date() },
  });

  revalidatePath("/admin");
  return { ok: true };
}
