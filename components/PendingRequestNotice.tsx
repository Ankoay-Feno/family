// Carte affichée à un utilisateur dont la demande d'adhésion est en attente.
// Composant présentationnel : intégré à la page d'accueil par ailleurs.

export default function PendingRequestNotice({ treeName }: { treeName: string }) {
  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eyebrow">Demande envoyée</div>
        <h1 className="display">Fianakaviana</h1>
      </div>
      <div className="login-card">
        <p style={{ margin: 0 }}>
          Votre demande pour rejoindre &quot;{treeName}&quot; est en attente de
          validation par un admin.
        </p>
      </div>
    </div>
  );
}
