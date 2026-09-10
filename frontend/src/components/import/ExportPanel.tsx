"use client";

import { useState } from "react";
import { IconDownload } from "@/components/icons/Icons";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import { getApiErrorMessage } from "@/utils/apiError";

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word" },
] as const;

export function ExportPanel() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleExport(format: (typeof FORMATS)[number]["value"]) {
    setExporting(format);
    setError(null);
    setSuccess(null);

    try {
      await api.reports.download(format);
      setSuccess(`Rapport ${format.toUpperCase()} téléchargé.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="card card--glass export-panel">
      <div className="export-panel__head">
        <IconDownload size={28} className="export-panel__head-icon" />
        <div>
          <h2>Exporter l&apos;analyse</h2>
        </div>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="format-grid">
        {FORMATS.map((format) => (
          <Button
            key={format.value}
            onClick={() => handleExport(format.value)}
            loading={exporting === format.value}
            disabled={exporting !== null}
          >
            Télécharger {format.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
