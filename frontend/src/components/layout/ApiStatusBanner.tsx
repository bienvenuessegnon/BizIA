"use client";

import Link from "next/link";
import { useApiHealth } from "@/hooks/useApiHealth";
import { API_IS_SAME_ORIGIN, API_URL } from "@/services/api";

export function ApiStatusBanner() {
  const apiOk = useApiHealth();

  if (apiOk === null || apiOk) return null;

  return (
    <div className="api-banner" role="status">
      <div className="api-banner__inner">
        <span className="api-banner__dot" aria-hidden="true" />
        <p>
          <strong>Backend hors ligne</strong> — Les données ne peuvent pas être chargées.
          {API_IS_SAME_ORIGIN ? (
            <> Réessayez dans un instant.</>
          ) : (
            <>
              {" "}
              Démarrez le serveur API sur <code>{API_URL}</code>.
            </>
          )}
        </p>
        <Link href="/import" className="api-banner__link">Importer des données</Link>
      </div>
    </div>
  );
}
