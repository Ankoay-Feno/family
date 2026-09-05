"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "./I18nProvider";

// Connexion uniquement : la création de compte se fait exclusivement via un
// lien d'invitation (/invite/…) ou le lien de présentation d'une famille
// (/rejoindre/…), pour qu'aucun compte n'existe hors d'un parcours d'entrée.
export default function LoginForm() {
  const { t } = useI18n();
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
          ? t.login.invalidCredentials
          : (result.error.message ?? t.login.genericError),
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">{t.login.eyebrow}</div>
        <h1 className="display">{t.common.appName}</h1>
      </div>
      {/* method="post" : si le JS n'est pas encore chargé, une soumission
          native ne doit jamais envoyer le mot de passe en clair dans l'URL. */}
      <form className="login-card" method="post" onSubmit={onSubmit}>
        <label className="field">
          <span>{t.login.email}</span>
          <input
            name="email"
            type="email"
            required
            placeholder="hery@exemple.mg"
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>{t.login.password}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder={t.login.passwordHint}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t.login.submitPending : t.login.submit}
        </button>
      </form>
      <p className="login-note">{t.login.note}</p>
    </div>
  );
}
