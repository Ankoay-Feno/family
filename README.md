# Fianakaviana — arbre familial

Application d'arbre généalogique social : chaque famille a son arbre, chaque
personne y est une carte (photo, nom, dates), et les membres vivants peuvent
lier un compte pour se connecter.

## Stack

- **Next.js 16** (App Router, React Server Components, Turbopack)
- **Better Auth** — email/mot de passe, sessions par cookie httpOnly
- **Prisma 7 + SQLite** en dev (PostgreSQL prévu pour la prod, voir `docker-compose.yml`)
- CSS global maison (tokens clair/sombre), polices Fraunces + Instrument Sans

## Démarrer

```bash
npm install
npx prisma migrate dev   # crée prisma/dev.db
npm run db:seed          # famille de démonstration + compte
npm run dev
```

Comptes de démonstration (mot de passe = email) :
`plateforme@exemple.mg` (admin plateforme) · `hery@exemple.mg` (admin famille) · `lalao@exemple.mg` (membre)

## Rôles

- **Admin plateforme** (`User.isPlatformAdmin`) : dashboard `/plateforme` de toutes
  les familles (stats, files en attente), consultation en lecture seule, création
  de familles avec leur admin fondateur, nomination des admins famille (≥ 1 par famille).
- **Admin famille** : crée les cartes directement, valide propositions et demandes,
  invite, donne le rôle Parent.
- **Parent** : ajoute directement des cartes pour **ses propres enfants** ; le reste
  passe en proposition.
- **User** : propose ses ajouts.

La création de compte ne se fait que dans les parcours d'entrée (`/invite/[token]`,
`/rejoindre/[slug]`) — jamais depuis `/login` — et sans connexion automatique.

## Concepts clés

- **`User` ≠ `Person`** : un `User` est un compte qui se connecte ; une
  `Person` est une carte de l'arbre. Une personne peut exister sans compte
  (ancêtres, enfants) — la colonne `Person.userId` les relie quand la personne
  revendique sa carte.
- **Deux relations stockées seulement** : `PARENT` (from = parent, to = enfant)
  et `SPOUSE` (paire non ordonnée). Frère, tante, cousine… sont **calculés**
  ([lib/family.ts](lib/family.ts)), jamais stockés.
- **Sécurité** : le `proxy.ts` ne fait qu'une redirection optimiste sur la
  présence du cookie ; la vraie vérification de session et de permissions est
  dans chaque page serveur et chaque server action ([app/actions.ts](app/actions.ts)).

## Structure

| Fichier | Rôle |
| --- | --- |
| `prisma/schema.prisma` | Tables auth (Better Auth) + domaine (Tree, Person, Relationship, TreeMembership) |
| `lib/auth.ts` / `lib/auth-client.ts` | Config Better Auth serveur / client React |
| `lib/family.ts` | Logique pure : construction de la forêt d'unités familiales, étiquettes de parenté, garde anti-cycle |
| `app/page.tsx` | Page principale (serveur) : session → arbre ou formulaire de création |
| `app/login/page.tsx` | Connexion / inscription |
| `components/TreeView.tsx` | Rendu de l'arbre : unités en flex imbriqué + liens SVG mesurés sur le DOM |
| `app/actions.ts` | Server actions : créer la famille, ajouter un membre |
| `prisma/seed.ts` | Famille Rakoto de démonstration |

## V1.1 — entrées et modération (livrée)

- **Rôles** : le fondateur est admin ; les membres voient l'arbre et proposent,
  les admins valident (page `/admin`).
- **Invitations ciblées** : depuis la fiche d'une personne sans compte, un admin
  génère un lien `/invite/[token]` (usage unique, 7 jours) qui lie le nouveau
  compte à sa carte.
- **Demandes d'adhésion** : lien public `/rejoindre/[slug]` ; l'admin approuve
  en liant à une carte existante ou en créant la carte avec sa relation.
- **Propositions** : « Ajouter un membre » s'applique directement pour un admin,
  crée une proposition à valider pour un membre (règles revérifiées à
  l'application : deux parents max, un conjoint, anti-cycle).

La logique d'édition partagée vit dans `lib/tree-edit.ts`, les gardes
d'autorisation dans `lib/authz.ts`. Spécification produit complète :
voir l'artifact « Spécification Fianakaviana ».

## Photos (V1.2 — livrée)

- **Stockage objet S3-compatible** : MinIO en dev
  (`docker compose up -d minio createbucket`, console sur http://localhost:9001),
  Cloudflare R2 ou S3 en prod — seules les variables `S3_*` du `.env` changent.
- **Upload direct par presigned URL** : le navigateur envoie le fichier
  directement au bucket ; le serveur ne fait qu'autoriser ([lib/storage.ts](lib/storage.ts),
  [app/actions/photos.ts](app/actions/photos.ts)). Sans bucket configuré, repli
  automatique sur `public/uploads/` local.
- **Photo de couverture : au plus une par carte** — remplacée à chaque
  changement, l'ancienne est supprimée du stockage. Édition depuis la fiche
  (admin famille, ou propriétaire de sa carte).

## Prochaines étapes

- V1.3 — publications, commentaires, réactions par arbre ; fiche personne enrichie ;
  verrou serveur sur l'inscription
- V2 — notifications, multi-famille, passage PostgreSQL (`docker compose up -d db`)
