"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  buildForest,
  directFamily,
  relationLabel,
  spouseOf,
  type PersonDTO,
  type RelDTO,
  type Unit,
} from "@/lib/family";
import Avatar from "./Avatar";
import AddMemberDialog from "./AddMemberDialog";
import InviteButton from "./InviteButton";
import PhotoUploader from "./PhotoUploader";
import NicknameEditor from "./NicknameEditor";
import DeceasedEditor from "./DeceasedEditor";
import { useI18n } from "./I18nProvider";

type Props = {
  treeId: string;
  persons: PersonDTO[];
  rels: RelDTO[];
  youPersonId: string | null;
  role?: "admin" | "parent" | "member";
  /** Consultation plateforme : pas d'ajout, pas d'invitation. */
  readOnly?: boolean;
};

/* Noms malgaches : un seul mot peut dépasser 16 lettres. On réduit la taille
   plutôt que de couper le mot (la coupure reste le dernier recours en CSS). */
function nameSizeClass(name: string): string {
  const longest = Math.max(0, ...name.split(/\s+/).map((w) => w.length));
  return longest > 16 ? " name-xl" : longest > 12 ? " name-l" : "";
}

function PersonCard({
  person,
  isYou,
  selected,
  dimmed,
  onSelect,
}: {
  person: PersonDTO;
  isYou: boolean;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={`person${dimmed ? " dim" : ""}${person.deceased ? " deceased" : ""}`}
      aria-current={selected ? "true" : "false"}
      onClick={() => onSelect(person.id)}
    >
      <span className="avatar" data-avatar-id={person.id}>
        <Avatar person={person} />
        {person.hasAccount && <span className="dot" title={t.tree.panel.accountLinked} />}
        {person.deceased && (
          <span className="cross" title={t.deceased.label} aria-label={t.deceased.label}>
            †
          </span>
        )}
      </span>
      <span className={`pname${nameSizeClass(person.name)}`}>{person.name}</span>
      {person.nickname && <span className="pnickname">« {person.nickname} »</span>}
      {person.birthYear !== null && (
        <span className="pyear">
          {person.sex === "F" ? t.tree.bornF(person.birthYear) : t.tree.bornM(person.birthYear)}
        </span>
      )}
      {person.deceased && person.deathYear !== null && (
        <span className="pdeath">† {person.deathYear}</span>
      )}
      {isYou && <span className="you-chip">{t.tree.youChip}</span>}
    </button>
  );
}

function FamilyUnit({
  unit,
  youPersonId,
  selectedId,
  family,
  onSelect,
}: {
  unit: Unit;
  youPersonId: string | null;
  selectedId: string | null;
  family: Set<string> | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="fam">
      <div className="fam-parents">
        {unit.members.map(
          (m) =>
            m && (
              <PersonCard
                key={m.id}
                person={m}
                isYou={m.id === youPersonId}
                selected={m.id === selectedId}
                dimmed={family !== null && !family.has(m.id)}
                onSelect={onSelect}
              />
            ),
        )}
      </div>
      {unit.children.length > 0 && (
        <div className="fam-kids">
          {unit.children.map((child) => (
            <FamilyUnit
              key={child.members[0].id}
              unit={child}
              youPersonId={youPersonId}
              selectedId={selectedId}
              family={family}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView({
  treeId,
  persons,
  rels,
  youPersonId,
  role = "member",
  readOnly = false,
}: Props) {
  const { t } = useI18n();
  const isAdmin = role === "admin";
  const forest = buildForest(persons, rels);
  const [selectedId, setSelectedId] = useState<string | null>(youPersonId);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Écrans étroits (une colonne) : la fiche s'ouvre en feuille par-dessus
  // l'arbre au lieu d'être en bas de page, pour ne pas perdre sa position.
  const [sheetOpen, setSheetOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const wiresRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = persons.find((p) => p.id === selectedId) ?? null;
  const family = selectedId ? directFamily(rels, selectedId) : null;

  /* Trace les liens en mesurant la position réelle des avatars dans le DOM. */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const svg = wiresRef.current;
    if (!canvas || !svg) return;
    const w = canvas.scrollWidth;
    const h = canvas.scrollHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.width = `${w}px`;
    svg.style.height = `${h}px`;
    const canvasRect = canvas.getBoundingClientRect();
    const pos = (id: string) => {
      const el = canvas.querySelector(`[data-avatar-id="${CSS.escape(id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        cx: r.left - canvasRect.left + r.width / 2,
        cy: r.top - canvasRect.top + r.height / 2,
        left: r.left - canvasRect.left,
        right: r.right - canvasRect.left,
        top: r.top - canvasRect.top,
        bottom: r.bottom - canvasRect.top,
      };
    };

    let out = "";
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      out += `<line class="wire" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    };

    const walk = (unit: Unit) => {
      const [a, b] = unit.members;
      const pa = pos(a.id);
      if (!pa) return;
      let dropX = pa.cx;
      let dropTopY = pa.bottom + 2;
      if (b) {
        const pb = pos(b.id);
        if (pb) {
          const y = pa.cy;
          const x1 = Math.min(pa.right, pb.right) + 5;
          const x2 = Math.max(pa.left, pb.left) - 5;
          line(x1, y, x2, y);
          dropX = (x1 + x2) / 2;
          dropTopY = y + 6;
          out += `<circle class="knot" cx="${dropX}" cy="${y}" r="4"/>`;
        }
      }
      if (unit.children.length) {
        const kids = unit.children
          .map((c) => pos(c.members[0].id))
          .filter((k): k is NonNullable<typeof k> => k !== null);
        if (kids.length) {
          const busY = Math.min(...kids.map((k) => k.top)) - 18;
          line(dropX, dropTopY, dropX, busY);
          const xs = kids.map((k) => k.cx).concat(dropX);
          line(Math.min(...xs), busY, Math.max(...xs), busY);
          for (const k of kids) line(k.cx, busY, k.cx, k.top - 6);
        }
      }
      unit.children.forEach(walk);
    };
    forest.forEach(walk);
    svg.innerHTML = out;
  }, [forest]);

  useLayoutEffect(() => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    if (document.fonts?.ready) document.fonts.ready.then(draw);
  }, [draw]);

  // Au chargement, quand l'arbre est plus large que l'écran (mobile) : on
  // cadre horizontalement sur « vous », sinon sur le milieu de l'arbre.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const target = youPersonId
      ? scroller.querySelector(`[data-avatar-id="${CSS.escape(youPersonId)}"]`)
      : null;
    if (target) {
      const r = target.getBoundingClientRect();
      const s = scroller.getBoundingClientRect();
      scroller.scrollLeft += r.left + r.width / 2 - (s.left + s.width / 2);
    } else {
      scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
    }
  }, [youPersonId]);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 980px)").matches) setSheetOpen(true);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      // Un dialogue ouvert dans la fiche (invitation, choix de photo) a priorité.
      if (e.key !== "Escape" || document.querySelector(".overlay, .photo-menu-overlay")) return;
      setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const rel = selected ? relationLabel(persons, rels, youPersonId, selected.id) : null;
  const relLabel =
    rel === null
      ? ""
      : typeof rel === "string"
        ? t.tree.relations[rel]
        : t.tree.farRelation(rel.kind, rel.depth, rel.female);
  const selectedSpouse = selected ? spouseOf(rels, selected.id) : null;

  return (
    <main className="app-main">
      <div className="tree-card">
        {!readOnly && (
          <div className="tree-toolbar">
            <button type="button" className="btn btn-primary" onClick={() => setDialogOpen(true)}>
              {t.tree.addMember}
            </button>
          </div>
        )}
        <div className="tree-scroll" ref={scrollRef}>
          <div className="canvas" ref={canvasRef}>
            <svg className="wires" ref={wiresRef} aria-hidden="true" />
            {forest.map((unit) => (
              <FamilyUnit
                key={unit.members[0].id}
                unit={unit}
                youPersonId={youPersonId}
                selectedId={selectedId}
                family={family}
                onSelect={select}
              />
            ))}
          </div>
        </div>
      </div>

      {sheetOpen && <div className="sheet-backdrop" onClick={() => setSheetOpen(false)} />}
      <aside className={`panel${sheetOpen ? " sheet-open" : ""}`} aria-live="polite">
        {sheetOpen && (
          <div className="sheet-head">
            <span className="sheet-handle" aria-hidden="true" />
            <button type="button" className="btn-link panel-close" onClick={() => setSheetOpen(false)}>
              {t.common.close}
            </button>
          </div>
        )}
        {selected ? (
          <>
            {selected.coverUrl && (
              <div className="panel-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.coverUrl} alt="" />
              </div>
            )}
            <div className="panel-head">
              <span className="avatar">
                <Avatar person={selected} />
              </span>
              <div>
                <h2 className={`panel-name display${nameSizeClass(selected.name)}`}>
                  {selected.name}
                </h2>
                {selected.nickname && (
                  <p className="panel-nickname">« {selected.nickname} »</p>
                )}
                {relLabel && <span className="rel-chip">{relLabel}</span>}
              </div>
            </div>
            {!readOnly && (isAdmin || selected.id === youPersonId) && (
              <div style={{ marginTop: 10 }}>
                <NicknameEditor
                  key={`n-${selected.id}`}
                  personId={selected.id}
                  nickname={selected.nickname}
                />
              </div>
            )}
            <dl className="meta">
              {selected.birthYear !== null && (
                <div>
                  <dt>{t.tree.panel.birth}</dt>
                  <dd>
                    {selected.deceased
                      ? selected.birthYear
                      : t.tree.panel.birthWithAge(
                          selected.birthYear,
                          new Date().getFullYear() - selected.birthYear,
                        )}
                  </dd>
                </div>
              )}
              {selected.deceased && (
                <div>
                  <dt>{t.tree.panel.death}</dt>
                  <dd>† {selected.deathYear ?? t.tree.panel.deathUnknownYear}</dd>
                </div>
              )}
              <div>
                <dt>{t.tree.panel.account}</dt>
                {selected.hasAccount ? (
                  <dd className="linked">{t.tree.panel.accountLinked}</dd>
                ) : (
                  <dd className="invite">{t.tree.panel.accountNone}</dd>
                )}
              </div>
              {selectedSpouse && (
                <div>
                  <dt>{t.tree.panel.spouse}</dt>
                  <dd>{persons.find((p) => p.id === selectedSpouse)?.name}</dd>
                </div>
              )}
              {selected.email && (
                <div>
                  <dt>{t.tree.panel.email}</dt>
                  <dd style={{ overflowWrap: "anywhere" }}>{selected.email}</dd>
                </div>
              )}
            </dl>
            {!readOnly && (isAdmin || selected.id === youPersonId) && (
              <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <PhotoUploader
                  key={`p-${selected.id}`}
                  personId={selected.id}
                  kind="profile"
                  hasPhoto={selected.photoUrl !== null}
                />
                <PhotoUploader
                  key={`c-${selected.id}`}
                  personId={selected.id}
                  kind="cover"
                  hasPhoto={selected.coverUrl !== null}
                />
                {isAdmin && (
                  <DeceasedEditor
                    key={`d-${selected.id}`}
                    personId={selected.id}
                    deceased={selected.deceased}
                    deathYear={selected.deathYear}
                  />
                )}
              </div>
            )}
            {!readOnly && isAdmin && !selected.hasAccount && (
              <div style={{ marginTop: 12 }}>
                <InviteButton
                  treeId={treeId}
                  personId={selected.id}
                  personName={selected.name}
                />
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "var(--muted)", margin: 0 }}>{t.tree.emptySelection}</p>
        )}
      </aside>

      {dialogOpen && !readOnly && (
        <AddMemberDialog
          treeId={treeId}
          persons={persons}
          rels={rels}
          role={role}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </main>
  );
}
