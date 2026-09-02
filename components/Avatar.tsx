import type { PersonDTO } from "@/lib/family";

// Palettes fixes, lisibles sur les deux thèmes ; choisies par hachage de l'id
// pour que chaque personne garde toujours la même couleur.
const PALETTES = [
  { cloth: "#4E6E97", tint: "#DCE4EE" },
  { cloth: "#8A5A83", tint: "#EBDFEA" },
  { cloth: "#B65C44", tint: "#F2E1DC" },
  { cloth: "#2F6B50", tint: "#DCEAE2" },
  { cloth: "#C98A3D", tint: "#F3E8D8" },
  { cloth: "#3E7D6B", tint: "#DEEBE7" },
  { cloth: "#7D6EA8", tint: "#E7E3F1" },
  { cloth: "#47809A", tint: "#DFEAF0" },
];
const SKINS = ["#8D5A3B", "#A9714B", "#C08552", "#96613F"];
const HAIRS = ["#221D1B", "#2B2320", "#3A2E28", "#4A3B32"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({ person }: { person: PersonDTO }) {
  if (person.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.photoUrl} alt="" />;
  }
  const h = hash(person.id);
  const palette = PALETTES[h % PALETTES.length];
  const skin = SKINS[(h >> 3) % SKINS.length];
  const elder = person.birthYear !== null && person.birthYear < 1960;
  const hair = elder ? "#8C8478" : HAIRS[(h >> 6) % HAIRS.length];
  const clip = `clip-${person.id}`;
  const female = person.sex === "F";

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <clipPath id={clip}>
        <circle cx="32" cy="32" r="32" />
      </clipPath>
      <circle cx="32" cy="32" r="32" fill={palette.tint} />
      <g clipPath={`url(#${clip})`}>
        {female && <rect x="19" y="15" width="26" height="31" rx="13" fill={hair} />}
        <ellipse cx="32" cy="57" rx="17" ry="13" fill={palette.cloth} />
        <circle cx="32" cy="27" r="10.5" fill={skin} />
        <path d="M21.5 25.5 A10.5 10.5 0 0 1 42.5 25.5 Z" fill={hair} />
      </g>
    </svg>
  );
}
