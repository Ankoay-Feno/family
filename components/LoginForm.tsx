"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Connexion uniquement : la création de compte se fait exclusivement via un
// lien d'invitation (/invite/…) ou le lien de présentation d'une famille
// (/rejoindre/…), pour qu'aucun compte n'existe hors d'un parcours d'entrée.
export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const data = new FormData(e.currentTarget);
    const result = await authClient.signIn.email({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    setPending(false);
    if (result.error) {
      setError(
        result.error.message === "Invalid email or password"
          ? "Email ou mot de passe incorrect."
          : (result.error.message ?? "Une erreur est survenue. Réessayez."),
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">Arbre familial</div>
        <h1 className="display">Fianakaviana</h1>
      </div>
      {/* method="post" : si le JS n'est pas encore chargé, une soumission
          native ne doit jamais envoyer le mot de passe en clair dans l'URL. */}
      <form className="login-card" method="post" onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="hery@exemple.mg"
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="8 caractères minimum"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "…" : "Se connecter"}
        </button>
      </form>
      <p className="login-note">
        Pas encore de compte ? Il se crée depuis le lien d&apos;invitation ou le
        lien de présentation que votre famille vous a envoyé.
      </p>
    </div>
  );
}
