import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hôtes autorisés à charger les ressources du serveur de dev (accès depuis
  // un autre appareil du réseau local). Sans cela, Next bloque ses ressources
  // (JS, HMR) en cross-origin et la page ne s'hydrate pas.
  // Défini dans .env : ALLOWED_DEV_ORIGINS="192.168.0.184,localhost"
  // (les fichiers .env sont chargés par Next avant l'évaluation de ce fichier)
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  experimental: {
    // Les photos de carte passent par une server action (limite par défaut : 1 Mo).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
