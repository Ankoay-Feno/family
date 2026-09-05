// Point d'entrée global (placé dans app/layout.tsx, à côté du sélecteur de
// langue) : rendu sur toutes les pages, y compris celles sans en-tête propre
// (ex. création de famille, demande en attente) où il n'existait avant aucun
// moyen de se déconnecter.

import { getSessionUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { PersonDTO } from "@/lib/family";
import ProfileDrawer from "./ProfileDrawer";

export default async function ProfileMenu() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { person: true, memberships: true },
  });
  if (!user) return null;

  const membership = user.memberships[0] ?? null;
  const person: PersonDTO | null = user.person
    ? {
        id: user.person.id,
        name: user.person.name,
        nickname: user.person.nickname,
        sex: user.person.sex as PersonDTO["sex"],
        birthYear: user.person.birthYear,
        deathYear: user.person.deathYear,
        photoUrl: user.person.photoUrl,
        coverUrl: user.person.coverUrl,
        email: user.person.email,
        hasAccount: true,
      }
    : null;

  return (
    <ProfileDrawer
      userName={user.name}
      person={person}
      isAdmin={membership?.role === "admin"}
      isPlatformAdmin={user.isPlatformAdmin}
    />
  );
}
