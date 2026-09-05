"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "./I18nProvider";

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
  const { t } = useI18n();
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
          ? t.signup.invalidCredentials
          : (result.error.message ?? t.signup.genericError),
      );
      return;
    }
    if (mode === "signup") {
      // Pas de session automatique (autoSignIn: false) : on passe à l'étape
      // de connexion, sur place, avec l'email prérempli.
      setSavedEmail(email);
      setNotice(t.signup.createdNotice);
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
          <span>{t.signup.yourName}</span>
          <input name="name" required defaultValue={defaultName} autoComplete="name" />
        </label>
      )}
      <label className="field">
        <span>{t.signup.email}</span>
        <input name="email" type="email" required defaultValue={savedEmail} autoComplete="email" />
      </label>
      <label className="field">
        <span>{t.signup.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder={t.signup.passwordHint}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending
          ? mode === "signup"
            ? t.signup.creating
            : t.signup.loggingIn
          : mode === "signup"
            ? t.signup.createAccount
            : t.signup.login}
      </button>
      <p style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", margin: "12px 0 0" }}>
        {mode === "signup" ? (
          <>
            {t.signup.alreadyAccountQuestion}{" "}
            <button type="button" className="btn-link" onClick={() => setMode("login")}>
              {t.signup.switchToLogin}
            </button>
          </>
        ) : (
          <>
            {t.signup.noAccountQuestion}{" "}
            <button type="button" className="btn-link" onClick={() => setMode("signup")}>
              {t.signup.switchToSignup}
            </button>
          </>
        )}
      </p>
    </form>
  );
}
