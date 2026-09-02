// File des demandes d'adhésion en attente, pour la page admin.

import { prisma } from "@/lib/prisma";
import JoinRequestDecision from "./JoinRequestDecision";

export default async function JoinRequestsSection({ treeId }: { treeId: string }) {
  const [requests, persons] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { treeId, status: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.person.findMany({
      where: { treeId },
      select: { id: true, name: true, userId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const allPersons = persons.map((p) => ({ id: p.id, name: p.name }));
  const unlinkedPersons = persons
    .filter((p) => !p.userId)
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <section className="admin-section">
      <h2 className="display">Demandes d&apos;adhésion</h2>
      <p className="hint">
        Approuvez en liant la personne à une carte existante ou en créant sa
        carte dans l&apos;arbre.
      </p>
      {requests.length === 0 ? (
        <p className="empty">Aucune demande en attente.</p>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="queue-item">
            <div className="queue-head">
              <span className="queue-title">{req.user.name}</span>
              <span className="queue-meta">
                {req.user.email} ·{" "}
                {req.createdAt.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{req.message}</p>
            <JoinRequestDecision
              requestId={req.id}
              treeId={treeId}
              unlinkedPersons={unlinkedPersons}
              allPersons={allPersons}
            />
          </div>
        ))
      )}
    </section>
  );
}
