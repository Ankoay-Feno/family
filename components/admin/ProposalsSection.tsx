import { prisma } from "@/lib/prisma";
import { describeAddMember, type AddMemberInput } from "@/lib/tree-edit";
import { getLocale } from "@/lib/i18n/server";
import { formatLongDate, getDictionary } from "@/lib/i18n";
import ProposalDecision from "./ProposalDecision";

export default async function ProposalsSection({ treeId }: { treeId: string }) {
  const [proposals, persons, locale] = await Promise.all([
    prisma.proposal.findMany({
      where: { treeId, status: "PENDING" },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.person.findMany({
      where: { treeId },
      select: { id: true, name: true },
    }),
    getLocale(),
  ]);
  const t = getDictionary(locale);
  const nameById = new Map(persons.map((p) => [p.id, p.name]));

  return (
    <section className="admin-section">
      <h2 className="display">{t.admin.proposals.title}</h2>
      <p className="hint">{t.admin.proposals.hint}</p>
      {proposals.length === 0 ? (
        <p className="empty">{t.admin.proposals.empty}</p>
      ) : (
        proposals.map((proposal) => {
          const input = JSON.parse(proposal.payload) as AddMemberInput;
          const anchorName = nameById.get(input.anchorId) ?? t.admin.proposals.deletedPerson;
          return (
            <div key={proposal.id} className="queue-item">
              <div className="queue-title">{describeAddMember(input, anchorName, t)}</div>
              <div className="queue-meta">
                {t.admin.proposals.proposedBy(
                  proposal.author.name,
                  formatLongDate(proposal.createdAt, locale),
                )}
              </div>
              <ProposalDecision proposalId={proposal.id} />
            </div>
          );
        })
      )}
    </section>
  );
}
