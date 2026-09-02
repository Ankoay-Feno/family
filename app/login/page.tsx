import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

// « Déjà connecté qui arrive sur /login » : on ne se fie pas au cookie (le proxy
// ne peut pas le valider), on vérifie la session RÉELLE ici. Si elle est valide,
// on va à l'accueil ; sinon on affiche le formulaire — un cookie périmé ne
// provoque donc aucune boucle avec la page « / ».
export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");
  return <LoginForm />;
}
