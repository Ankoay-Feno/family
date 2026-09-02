"use client";

import { useActionState, useState } from "react";
import { createFamilyPlatform, type CreateFamilyState } from "@/app/actions/platform";

const initial: CreateFamilyState = { ok: false };

export default function PlatformCreateFamily() {
  const [state, formAction, pending] = useActionState(createFamilyPlatform, initial);
  const [copied, setCopied] = useState(false);

  if (state.ok && state.path) {
    const link = `${window.location.origin}${state.path}`;
    return (
      <>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
          Famille créée. Envoyez ce lien au fondateur : en l&apos;acceptant, il
          devient l&apos;admin de la famille (valable 30 jours).
        </p>
        <div className="link-box">
          <code>{link}</code>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      </>
    );
  }

  return (
    <form action={formAction}>
      <label className="field">
        <span>Nom de la famille</span>
        <input name="treeName" required placeholder="Fianakaviana Rabe" />
      </label>
      <label className="field">
        <span>Nom du fondateur (futur admin)</span>
        <input name="name" required placeholder="Rabe" />
      </label>
      <div className="field">
        <span>Sexe</span>
        <div className="radio-row">
          <label>
            <input type="radio" name="sex" value="F" required /> Femme
          </label>
          <label>
            <input type="radio" name="sex" value="M" /> Homme
          </label>
        </div>
      </div>
      <label className="field">
        <span>Année de naissance (facultatif)</span>
        <input name="birthYear" type="number" min={1800} max={2100} />
      </label>
      <label className="field">
        <span>Email du fondateur (facultatif — prérempli à l&apos;invitation)</span>
        <input name="email" type="email" placeholder="rabe@exemple.mg" />
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Création…" : "Créer la famille et générer le lien"}
      </button>
    </form>
  );
}
