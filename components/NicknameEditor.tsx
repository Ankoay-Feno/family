"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPersonNickname } from "@/app/actions/person";
import { MAX_NICKNAME_LENGTH } from "@/lib/tree-edit";

export default function NicknameEditor({
  personId,
  nickname,
}: {
  personId: string;
  nickname: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    setBusy(true);
    setError(null);
    const data = new FormData();
    data.set("personId", personId);
    data.set("nickname", value);
    const result = await setPersonNickname({ ok: false }, data);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Erreur inattendue.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="btn-link"
        style={{ fontSize: 12.5 }}
        onClick={() => setEditing(true)}
      >
        {nickname ? "Modifier le surnom" : "Ajouter un surnom"}
      </button>
    );
  }

  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "flex", gap: 6 }}>
        <input
          autoFocus
          value={value}
          maxLength={MAX_NICKNAME_LENGTH}
          placeholder="Bebe"
          onChange={(e) => setValue(e.target.value)}
          style={{
            padding: "6px 8px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: 13,
          }}
        />
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={save}>
          {busy ? "…" : "Enregistrer"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => {
            setValue(nickname ?? "");
            setEditing(false);
            setError(null);
          }}
        >
          Annuler
        </button>
      </span>
      {error && <span className="form-error" style={{ margin: 0 }}>{error}</span>}
    </span>
  );
}
