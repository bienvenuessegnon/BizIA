"use client";

import { useState } from "react";
import { IconDownload } from "@/components/icons/Icons";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { getApiErrorMessage } from "@/utils/apiError";

export function ExportPanel() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.reports.downloadJson();
      setSuccess("Rapport JSON téléchargé (contrat MVP).");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="card card--glass export-panel">
      <div className="export-panel__head">
        <IconDownload size={28} className="export-panel__head-icon" />
        <div>
          <h2>Exporter l&apos;analyse</h2>
          <p className="muted">
            Le MVP télécharge un rapport JSON de la dernière analyse.
          </p>
        </div>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Button onClick={handleExport} loading={exporting} disabled={exporting}>
        Télécharger le rapport JSON
      </Button>
    </div>
  );
}
