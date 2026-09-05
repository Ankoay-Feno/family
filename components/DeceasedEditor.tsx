"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPersonDeceased } from "@/app/actions/person";
import { useI18n } from "./I18nProvider";
import Spinner from "./Spinner";

export default function DeceasedEditor({
  personId,
  deceased,
  deathYear,
}: {
  personId: string;
  deceased: boolean;
  deathYear: number | null;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [isDeceased, setIsDeceased] = useState(deceased);
  const [year, setYear] = useState(deathYear?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function open() {
    setIsDeceased(deceased);
    setYear(deathYear?.toString() ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const data = new FormData();
    data.set("personId", personId);
    data.set("deceased", isDeceased ? "yes" : "no");
    data.set("deathYear", isDeceased ? year : "");
    const result = await setPersonDeceased({ ok: false }, data);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? t.common.unexpectedError);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button type="button" className="btn-link" style={{ fontSize: 12.5 }} onClick={open}>
        {deceased ? t.deceased.edit : t.deceased.mark}
      </button>
    );
  }

  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={isDeceased}
          onChange={(e) => setIsDeceased(e.target.checked)}
        />
        {t.deceased.label}
      </label>
      {isDeceased && (
        <input
          type="number"
          min={1800}
          max={2100}
          value={year}
          placeholder={t.deceased.yearOptional}
          aria-label={t.deceased.yearOptional}
          onChange={(e) => setYear(e.target.value)}
          style={{
            padding: "6px 8px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: 13,
            width: 180,
          }}
        />
      )}
      <span style={{ display: "flex", gap: 6 }}>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={save}>
          {busy && <Spinner />}
          {busy ? t.deceased.saving : t.deceased.save}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
          {t.common.cancel}
        </button>
      </span>
      {error && <span className="form-error" style={{ margin: 0 }}>{error}</span>}
    </span>
  );
}
