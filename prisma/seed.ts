// Peuple la base avec les comptes de démonstration et la famille Rakoto.
//   npm run db:seed
// Comptes (mot de passe = email) :
//   hery@exemple.mg  — admin
//   lalao@exemple.mg — membre
// Relançable sans risque : chaque étape vérifie ce qui existe déjà.

import "dotenv/config";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const DEMO_EMAIL = "hery@exemple.mg";
const DEMO_PASSWORD = DEMO_EMAIL;
const MEMBER_EMAIL = "lalao@exemple.mg";
const PLATFORM_EMAIL = "plateforme@exemple.mg";

/** Crée le compte admin plateforme (idempotent). */
async function ensurePlatformAdmin() {
  let admin = await prisma.user.findUnique({ where: { email: PLATFORM_EMAIL } });
  if (!admin) {
    await auth.api.signUpEmail({
      body: { email: PLATFORM_EMAIL, password: PLATFORM_EMAIL, name: "Plateforme" },
    });
    admin = await prisma.user.findUniqueOrThrow({ where: { email: PLATFORM_EMAIL } });
  }
  if (!admin.isPlatformAdmin) {
    await prisma.user.update({ where: { id: admin.id }, data: { isPlatformAdmin: true } });
  }
  console.log(`Admin plateforme : ${PLATFORM_EMAIL} / ${PLATFORM_EMAIL}`);
}

/** Crée le compte membre lalao et le lie à la carte Lalao (idempotent). */
async function ensureMemberAccount() {
  let member = await prisma.user.findUnique({ where: { email: MEMBER_EMAIL } });
  if (!member) {
    await auth.api.signUpEmail({
      body: { email: MEMBER_EMAIL, password: MEMBER_EMAIL, name: "Lalao" },
    });
    member = await prisma.user.findUniqueOrThrow({ where: { email: MEMBER_EMAIL } });
  }
  const card = await prisma.person.findFirst({
    where: { name: "Lalao", userId: null, tree: { name: "Fianakaviana Rakoto" } },
  });
  if (card) {
    await prisma.person.update({ where: { id: card.id }, data: { userId: member.id } });
    await prisma.treeMembership.upsert({
      where: { treeId_userId: { treeId: card.treeId, userId: member.id } },
      create: { treeId: card.treeId, userId: member.id, role: "member" },
      update: {},
    });
    console.log(`Compte membre lié : ${MEMBER_EMAIL} / ${MEMBER_EMAIL}`);
  }
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Le compte ${DEMO_EMAIL} existe déjà.`);
    await ensureMemberAccount();
    await ensurePlatformAdmin();
    return;
  }

  // Better Auth crée le user + le hash du mot de passe (scrypt).
  await auth.api.signUpEmail({
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: "Hery" },
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });

  const tree = await prisma.tree.create({
    data: { name: "Fianakaviana Rakoto", memberships: { create: { userId: user.id, role: "admin" } } },
  });

  const mk = (name: string, sex: "M" | "F", birthYear: number, userId?: string) =>
    prisma.person.create({ data: { treeId: tree.id, name, sex, birthYear, userId } });

  const rakoto = await mk("Rakoto", "M", 1949);
  const rasoa = await mk("Rasoa", "F", 1953);
  const voahangy = await mk("Voahangy", "F", 1976);
  const hery = await mk("Hery", "M", 1979, user.id);
  const soa = await mk("Soa", "F", 1982);
  const lalao = await mk("Lalao", "F", 1985);
  const niry = await mk("Niry", "F", 2008);
  const tiana = await mk("Tiana", "M", 2011);

  const spouse = (a: string, b: string) => ({ treeId: tree.id, type: "SPOUSE", fromId: a, toId: b });
  const parent = (p: string, c: string) => ({ treeId: tree.id, type: "PARENT", fromId: p, toId: c });

  await prisma.relationship.createMany({
    data: [
      spouse(rakoto.id, rasoa.id),
      spouse(hery.id, soa.id),
      ...[voahangy, hery, lalao].flatMap((child) => [
        parent(rakoto.id, child.id),
        parent(rasoa.id, child.id),
      ]),
      ...[niry, tiana].flatMap((child) => [parent(hery.id, child.id), parent(soa.id, child.id)]),
    ],
  });

  console.log(`Base peuplée : « ${tree.name} », 8 personnes.`);
  console.log(`Connexion admin : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await ensureMemberAccount();
  await ensurePlatformAdmin();
}

main().finally(() => prisma.$disconnect());
