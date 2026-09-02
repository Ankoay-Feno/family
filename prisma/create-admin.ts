// Crée (ou promeut) un admin plateforme, à la main.
//   npm run admin:create -- <email> <mot_de_passe (≥ 8 caractères)>
// Exemple :
//   npm run admin:create -- ankoayfeno@gmail.com monMotDePasse
// Idempotent : si le compte existe déjà, il est seulement promu admin plateforme.

import "dotenv/config";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const [email, password] = process.argv.slice(2);

async function main() {
  if (!email || !password) {
    console.error("Usage : npm run admin:create -- <email> <mot_de_passe (≥ 8)>");
    process.exit(1);
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Better Auth crée le compte et hache le mot de passe (scrypt).
    await auth.api.signUpEmail({
      body: { email, password, name: email.split("@")[0] },
    });
    user = await prisma.user.findUniqueOrThrow({ where: { email } });
  }
  await prisma.user.update({ where: { id: user.id }, data: { isPlatformAdmin: true } });

  console.log(`Admin plateforme prêt : ${email}`);
}

main().finally(() => prisma.$disconnect());
