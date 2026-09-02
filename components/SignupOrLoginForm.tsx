"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/**
 * Création de compte / connexion embarquée dans les pages publiques
 * (invitation, demande d'adhésion). Après succès, la page serveur est
 * rafraîchie et affiche l'étape suivante du parcours — pas de redirection.
 */
export default function SignupOrLoginForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState(defaultEmail);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));

    const result =
      mode === "signup"
        ? await authClient.signUp.email({
            email,
            password,
            name: String(data.get("name")),
          })
        : await authClient.signIn.email({ email, password });

    setPending(false);
    if (result.error) {
      setError(
        result.error.message === "Invalid email or password"
          ? "Email ou mot de passe incorrect."
          : (result.error.message ?? "Une erreur est survenue. Réessayez."),
      );
      return;
    }
    if (mode === "signup") {
      // Pas de session automatique (autoSignIn: false) : on passe à l'étape
      // de connexion, sur place, avec l'email prérempli.
      setSavedEmail(email);
      setNotice("Votre compte est créé — connectez-vous pour continuer.");
      setMode("login");
      return;
    }
    router.refresh();
  }

  return (
    <form key={mode} onSubmit={onSubmit} method="post">
      {notice && !error && (
        <p style={{ fontSize: 13, color: "var(--online)", fontWeight: 600, margin: "0 0 12px" }}>
          {notice}
        </p>
      )}
      {mode === "signup" && (
        <label className="field">
          <span>Votre nom</span>
          <input name="name" required defaultValue={defaultName} autoComplete="name" />
        </label>
      )}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required defaultValue={savedEmail} autoComplete="email" />
      </label>
      <label className="field">
        <span>Mot de passe</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="8 caractères minimum"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
      </button>
      <p style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", margin: "12px 0 0" }}>
        {mode === "signup" ? (
          <>
            Déjà un compte ?{" "}
            <button type="button" className="btn-link" onClick={() => setMode("login")}>
              Se connecter
            </button>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <button type="button" className="btn-link" onClick={() => setMode("signup")}>
              Créer un compte
            </button>
          </>
        )}
      </p>
    </form>
  );
}
