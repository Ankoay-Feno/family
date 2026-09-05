"use client";

// Carte affichée à un utilisateur dont la demande d'adhésion est en attente.
// Composant présentationnel : intégré à la page d'accueil par ailleurs.

import { useI18n } from "./I18nProvider";

export default function PendingRequestNotice({ treeName }: { treeName: string }) {
  const { t } = useI18n();
  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">{t.pendingRequest.eyebrow}</div>
        <h1 className="display">{t.common.appName}</h1>
      </div>
      <div className="login-card">
        <p style={{ margin: 0 }}>{t.pendingRequest.message(treeName)}</p>
      </div>
    </div>
  );
}
