// Logique pure de l'arbre familial, partagée serveur/client.
// Seules deux relations sont stockées (PARENT, SPOUSE) ; tout le reste
// — générations, fratries, étiquettes de parenté — est calculé ici.

export type PersonDTO = {
  id: string;
  name: string;
  nickname: string | null;
  sex: "M" | "F";
  birthYear: number | null;
  deathYear: number | null;
  photoUrl: string | null;
  coverUrl: string | null;
  email: string | null;
  hasAccount: boolean;
};

export type RelDTO = {
  type: "PARENT" | "SPOUSE";
  fromId: string; // PARENT : le parent ; SPOUSE : l'un des conjoints
  toId: string; // PARENT : l'enfant ; SPOUSE : l'autre conjoint
};

/** Une unité familiale : un couple (ou une personne seule) et ses enfants. */
export type Unit = {
  /** members[0] est le membre « de sang » (l'enfant du niveau au-dessus). */
  members: [PersonDTO, PersonDTO?];
  children: Unit[];
};

export function parentsOf(rels: RelDTO[], id: string): string[] {
  return rels.filter((r) => r.type === "PARENT" && r.toId === id).map((r) => r.fromId);
}

export function childrenOf(rels: RelDTO[], id: string): string[] {
  return rels.filter((r) => r.type === "PARENT" && r.fromId === id).map((r) => r.toId);
}

export function spouseOf(rels: RelDTO[], id: string): string | null {
  const r = rels.find((r) => r.type === "SPOUSE" && (r.fromId === id || r.toId === id));
  return r ? (r.fromId === id ? r.toId : r.fromId) : null;
}

/**
 * Construit la forêt d'unités familiales à afficher : une racine par personne
 * sans parents connus (qui n'est pas déjà placée comme conjoint ailleurs).
 */
export function buildForest(persons: PersonDTO[], rels: RelDTO[]): Unit[] {
  const byId = new Map(persons.map((p) => [p.id, p]));
  const placed = new Set<string>();

  const byBirth = (a: string, b: string) =>
    (byId.get(a)?.birthYear ?? 9999) - (byId.get(b)?.birthYear ?? 9999);

  function buildUnit(id: string): Unit {
    placed.add(id);
    const person = byId.get(id)!;
    const spouseId = spouseOf(rels, id);
    const spouse = spouseId && !placed.has(spouseId) ? byId.get(spouseId) : undefined;
    if (spouse) placed.add(spouse.id);

    const kidIds = new Set(childrenOf(rels, id));
    if (spouse) for (const k of childrenOf(rels, spouse.id)) kidIds.add(k);

    const children = [...kidIds]
      .filter((k) => !placed.has(k))
      .sort(byBirth)
      .map(buildUnit);

    return { members: spouse ? [person, spouse] : [person], children };
  }

  // Boucle (et non .filter().map()) : `placed` se remplit au fil des unités
  // construites, sinon un conjoint sans parents serait affiché deux fois.
  const roots: Unit[] = [];
  const candidates = persons
    .filter((p) => parentsOf(rels, p.id).length === 0)
    .sort((a, b) => (a.birthYear ?? 9999) - (b.birthYear ?? 9999));
  for (const p of candidates) {
    if (!placed.has(p.id)) roots.push(buildUnit(p.id));
  }
  return roots;
}

/** Profondeur de chaque ancêtre de `id` (id lui-même à 0). */
function ancestorDepths(rels: RelDTO[], id: string): Map<string, number> {
  const depths = new Map<string, number>([[id, 0]]);
  let frontier = [id];
  let d = 0;
  while (frontier.length) {
    d++;
    const next: string[] = [];
    for (const p of frontier)
      for (const parent of parentsOf(rels, p))
        if (!depths.has(parent)) {
          depths.set(parent, d);
          next.push(parent);
        }
    frontier = next;
  }
  return depths;
}

/** Étiquette du lien de sang entre root et target, ou null. */
function bloodLabel(
  rels: RelDTO[],
  rootId: string,
  targetId: string,
  female: boolean,
): string | null {
  const a = ancestorDepths(rels, rootId);
  const b = ancestorDepths(rels, targetId);
  let best: [number, number] | null = null;
  for (const [anc, du] of a) {
    const dv = b.get(anc);
    if (dv !== undefined && (!best || du + dv < best[0] + best[1])) best = [du, dv];
  }
  if (!best) return null;
  const table: Record<string, [string, string]> = {
    "1,0": ["Votre père", "Votre mère"],
    "0,1": ["Votre fils", "Votre fille"],
    "1,1": ["Votre frère", "Votre sœur"],
    "2,0": ["Votre grand-père", "Votre grand-mère"],
    "0,2": ["Votre petit-fils", "Votre petite-fille"],
    "3,0": ["Votre arrière-grand-père", "Votre arrière-grand-mère"],
    "0,3": ["Votre arrière-petit-fils", "Votre arrière-petite-fille"],
    "2,1": ["Votre oncle", "Votre tante"],
    "1,2": ["Votre neveu", "Votre nièce"],
    "2,2": ["Votre cousin", "Votre cousine"],
  };
  const entry = table[`${best[0]},${best[1]}`];
  return entry ? entry[female ? 1 : 0] : null;
}

/** Lien de parenté affiché, calculé à partir des seuls liens PARENT et SPOUSE. */
export function relationLabel(
  persons: PersonDTO[],
  rels: RelDTO[],
  rootId: string | null,
  targetId: string,
): string {
  if (!rootId) return "";
  if (targetId === rootId) return "Vous";
  const target = persons.find((p) => p.id === targetId);
  if (!target) return "";
  const female = target.sex === "F";

  if (spouseOf(rels, rootId) === targetId) return female ? "Votre épouse" : "Votre époux";

  const blood = bloodLabel(rels, rootId, targetId, female);
  if (blood) return blood;

  // Alliances courantes : conjoint d'un parent de sang, ou famille du conjoint.
  const targetSpouse = spouseOf(rels, targetId);
  if (targetSpouse) {
    const viaSpouse = bloodLabel(rels, rootId, targetSpouse, !female);
    if (viaSpouse?.includes("frère") || viaSpouse?.includes("sœur"))
      return female ? "Votre belle-sœur" : "Votre beau-frère";
    if (viaSpouse?.includes("fils") || viaSpouse?.includes("fille"))
      return female ? "Votre belle-fille" : "Votre beau-fils";
  }
  const rootSpouse = spouseOf(rels, rootId);
  if (rootSpouse) {
    const viaRootSpouse = bloodLabel(rels, rootSpouse, targetId, female);
    if (viaRootSpouse?.includes("père") || viaRootSpouse?.includes("mère"))
      return female ? "Votre belle-mère" : "Votre beau-père";
    if (viaRootSpouse?.includes("frère") || viaRootSpouse?.includes("sœur"))
      return female ? "Votre belle-sœur" : "Votre beau-frère";
  }
  return "Membre de la famille";
}

/** La famille directe (pour la mise en évidence au clic). */
export function directFamily(rels: RelDTO[], id: string): Set<string> {
  const set = new Set([id, ...parentsOf(rels, id), ...childrenOf(rels, id)]);
  const spouse = spouseOf(rels, id);
  if (spouse) set.add(spouse);
  return set;
}

/** true si `candidateAncestor` est un ancêtre de `id` (garde anti-cycle). */
export function isAncestorOf(rels: RelDTO[], candidateAncestor: string, id: string): boolean {
  return ancestorDepths(rels, id).has(candidateAncestor) && candidateAncestor !== id;
}

/** Nombre de générations de l'arbre (1 = tout le monde au même niveau). */
export function countGenerations(rels: RelDTO[], personIds: string[]): number {
  const parentRels = rels.filter((r) => r.type === "PARENT");
  const depth = new Map<string, number>();
  const depthOf = (id: string, seen: Set<string>): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (seen.has(id)) return 0;
    seen.add(id);
    const parents = parentRels.filter((r) => r.toId === id).map((r) => r.fromId);
    const d = parents.length ? 1 + Math.max(...parents.map((p) => depthOf(p, seen))) : 0;
    depth.set(id, d);
    return d;
  };
  let max = 0;
  for (const id of personIds) max = Math.max(max, depthOf(id, new Set()));
  return max + 1;
}
