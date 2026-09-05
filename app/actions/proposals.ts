"use server";

// File de propositions (V1.1) : un membre PROPOSE un ajout, un admin VALIDE.
// Les admins appliquent directement via la même action de soumission.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireMembership } from "@/lib/authz";
import { spouseOf, type RelDTO } from "@/lib/family";
import {
  applyAddMember,
  parseAddMemberForm,
  validateAddMember,
  type AddMemberInput,
} from "@/lib/tree-edit";
import { savePhoto } from "@/lib/upload";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
import type { ActionState } from "@/app/actions";

export type SubmitState = { ok: boolean; error?: string; applied?: boolean };

function errorMessage(e: unknown, t: Dictionary): string {
  return e instanceof Error ? e.message : t.common.unexpectedError;
}

/**
 * Soumission du formulaire « Ajouter un membre » : application directe pour un
 * admin, création d'une Proposal PENDING pour un membre.
 */
export async function submitAddMember(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const t = await getServerDictionary();
  try {
    const parsed = parseAddMemberForm(formData, t);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    const { input } = parsed;

    const { user, isAdmin, membership } = await requireMembership(input.treeId);

    // Photo facultative : enregistrée dès maintenant, son URL voyage dans la
    // proposition (un fichier ne peut pas être stocké dans le payload JSON).
    const photo = await savePhoto(formData.get("photo"));
    if ("error" in photo) return { ok: false, error: photo.error };
    input.photoUrl = photo.url;

    // Les erreurs évidentes sont signalées tout de suite, même pour une
    // proposition — inutile de faire attendre l'auteur jusqu'à la validation.
    const invalid = await validateAddMember(input, t);
    if (invalid) return { ok: false, error: invalid };

    // Rôle "parent" : application directe uniquement pour SES enfants —
    // l'ancre doit être sa propre carte ou celle de son conjoint.
    let directApply = isAdmin;
    if (!isAdmin && membership.role === "parent" && input.relType === "CHILD_OF") {
      const ownCard = await prisma.person.findUnique({ where: { userId: user.id } });
      if (ownCard && ownCard.treeId === input.treeId) {
        const rels: RelDTO[] = (
          await prisma.relationship.findMany({
            where: { treeId: input.treeId },
            select: { type: true, fromId: true, toId: true },
          })
        ).map((r) => ({ ...r, type: r.type as RelDTO["type"] }));
        const spouse = spouseOf(rels, ownCard.id);
        directApply = input.anchorId === ownCard.id || input.anchorId === spouse;
      }
    }

    if (directApply) {
      await applyAddMember(input);
      revalidatePath("/");
      return { ok: true, applied: true };
    }

    await prisma.proposal.create({
      data: {
        treeId: input.treeId,
        authorId: user.id,
        type: "ADD_MEMBER",
        payload: JSON.stringify(input),
      },
    });
    revalidatePath("/admin");
    return { ok: true, applied: false };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}

/**
 * Approbation admin : re-valide contre l'état ACTUEL de l'arbre (il a pu
 * changer depuis la proposition) puis applique l'ajout.
 */
export async function approveProposal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getServerDictionary();
  try {
    const proposalId = String(formData.get("proposalId") ?? "");
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return { ok: false, error: t.errors.proposalNotFound };

    const { user } = await requireAdmin(proposal.treeId);

    if (proposal.status !== "PENDING") return { ok: false, error: t.errors.proposalAlreadyHandled };
    if (proposal.type !== "ADD_MEMBER") return { ok: false, error: t.errors.unknownProposalType };

    const input = JSON.parse(proposal.payload) as AddMemberInput;
    const invalid = await validateAddMember(input, t);
    // Statut inchangé : l'admin garde la main et pourra refuser avec ce motif.
    if (invalid) return { ok: false, error: t.errors.cannotApply(invalid) };

    await applyAddMember(input);
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "APPROVED", decidedBy: user.id, decidedAt: new Date() },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}

/** Refus admin, avec motif facultatif (max 300 caractères) visible par l'auteur. */
export async function rejectProposal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getServerDictionary();
  try {
    const proposalId = String(formData.get("proposalId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();
    if (reason.length > 300) return { ok: false, error: t.errors.invalidReasonLength };

    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return { ok: false, error: t.errors.proposalNotFound };

    const { user } = await requireAdmin(proposal.treeId);

    if (proposal.status !== "PENDING") return { ok: false, error: t.errors.proposalAlreadyHandled };

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: "REJECTED",
        reason: reason || null,
        decidedBy: user.id,
        decidedAt: new Date(),
      },
    });

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e, t) };
  }
}
