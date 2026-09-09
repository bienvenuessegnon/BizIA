"use client";

import { useState } from "react";
import { DocumentFormatIcon, IconDownload } from "@/components/icons/Icons";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import type { ExportFormat } from "@/utils/fileFormats";
import { formatLabel } from "@/utils/fileFormats";
import { getApiErrorMessage } from "@/utils/apiError";

const EXPORT_FORMATS: ExportFormat[] = ["csv", "xlsx", "pdf", "docx", "pptx"];

export function ExportPanel() {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(format);
    setError(null);
    setSuccess(null);

    try {
      await api.reports.export(format);
      setSuccess(`Export ${formatLabel(format)} lancé avec succès.`);
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
          <h2>Exporter vos données</h2>
          <p className="muted">
            Téléchargez vos analyses et rapports dans le format de votre choix.
          </p>
        </div>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="format-grid">
        {EXPORT_FORMATS.map((format) => (
          <button
            key={format}
            type="button"
            className="format-card"
            onClick={() => handleExport(format)}
            disabled={exporting !== null}
          >
            <DocumentFormatIcon format={format} size={32} className="format-card__icon" />
            <span className="format-card__label">{formatLabel(format)}</span>
            <span className="format-card__ext">.{format}</span>
            {exporting === format && <span className="format-card__loading">Export…</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
