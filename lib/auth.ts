import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Pas de session automatique à l'inscription : le nouveau compte doit
    // se connecter explicitement ensuite.
    autoSignIn: false,
  },
  // Origines supplémentaires acceptées par la protection CSRF (ex. accès au
  // serveur de dev via l'IP du réseau local). Liste séparée par des virgules.
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;
