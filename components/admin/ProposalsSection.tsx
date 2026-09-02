import { prisma } from "@/lib/prisma";
import { describeAddMember, type AddMemberInput } from "@/lib/tree-edit";
import ProposalDecision from "./ProposalDecision";

export default async function ProposalsSection({ treeId }: { treeId: string }) {
  const [proposals, persons] = await Promise.all([
    prisma.proposal.findMany({
      where: { treeId, status: "PENDING" },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.person.findMany({
      where: { treeId },
      select: { id: true, name: true },
    }),
  ]);
  const nameById = new Map(persons.map((p) => [p.id, p.name]));

  return (
    <section className="admin-section">
      <h2 className="display">Propositions de modification</h2>
      <p className="hint">
        Les ajouts proposés par les membres : approuvez pour les appliquer à
        l&apos;arbre, ou refusez avec un motif visible par l&apos;auteur.
      </p>
      {proposals.length === 0 ? (
        <p className="empty">Aucune proposition en attente.</p>
      ) : (
        proposals.map((proposal) => {
          const input = JSON.parse(proposal.payload) as AddMemberInput;
          const anchorName = nameById.get(input.anchorId) ?? "(personne supprimée)";
          return (
            <div key={proposal.id} className="queue-item">
              <div className="queue-title">{describeAddMember(input, anchorName)}</div>
              <div className="queue-meta">
                proposé par {proposal.author.name} ·{" "}
                {proposal.createdAt.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <ProposalDecision proposalId={proposal.id} />
            </div>
          );
        })
      )}
    </section>
  );
}
