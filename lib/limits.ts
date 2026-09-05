// Constantes partagées serveur/client — ce fichier ne doit importer AUCUN
// module serveur (ex. lib/prisma.ts), sous peine de faire fuiter des
// dépendances Node (pg, fs, net…) dans le bundle client d'un composant qui
// n'a besoin que d'une constante.

export const MAX_NICKNAME_LENGTH = 40;
