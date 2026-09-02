"use client";

import { useActionState } from "react";
import { createFamily, type ActionState } from "@/app/actions";

const initial: ActionState = { ok: false };

export default function CreateFamilyForm({ userName }: { userName: string }) {
  const [state, formAction, pending] = useActionState(createFamily, initial);

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">Bienvenue</div>
        <h1 className="display">Créez votre famille</h1>
      </div>
      <form className="login-card" action={formAction}>
        <label className="field">
          <span>Nom de la famille</span>
          <input name="treeName" required placeholder="Fianakaviana Rakoto" />
        </label>
        <label className="field">
          <span>Votre nom dans l&apos;arbre</span>
          <input name="name" required defaultValue={userName} />
        </label>
        <div className="field">
          <span>Vous êtes</span>
          <div className="radio-row">
            <label>
              <input type="radio" name="sex" value="F" required /> Une femme
            </label>
            <label>
              <input type="radio" name="sex" value="M" /> Un homme
            </label>
          </div>
        </div>
        <label className="field">
          <span>Votre année de naissance (facultatif)</span>
          <input name="birthYear" type="number" min={1800} max={2100} placeholder="1979" />
        </label>
        {state.error && <p className="form-error">{state.error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "Création…" : "Créer l'arbre familial"}
        </button>
      </form>
      <p className="login-note">
        Vous serez la première carte de l&apos;arbre — ajoutez ensuite parents, frères,
        sœurs et enfants, puis invitez-les à lier leur compte.
      </p>
    </div>
  );
}
