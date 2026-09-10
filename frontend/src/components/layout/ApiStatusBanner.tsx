"use client";

import { useApiHealth } from "@/hooks/useApiHealth";

export function ApiStatusBanner() {
  const apiOk = useApiHealth();

  if (apiOk === null || apiOk) return null;

  return (
    <div className="api-banner" role="status">
      <div className="api-banner__inner">
        <span className="api-banner__dot" aria-hidden="true" />
        <p>
          <strong>Connexion interrompue</strong> — Vos données ne peuvent pas être
          affichées pour le moment. Réessayez dans un instant.
        </p>
      </div>
    </div>
  );
}
