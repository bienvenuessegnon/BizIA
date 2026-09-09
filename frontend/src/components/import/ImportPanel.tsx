"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { DocumentFormatIcon, IconUpload } from "@/components/icons/Icons";
import { ExportPanel } from "@/components/import/ExportPanel";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/services/api";
import type { IngestionResult } from "@/types";
import {
  ACCEPTED_EXTENSIONS,
  FILE_INPUT_ACCEPT,
  formatLabel,
  isAcceptedDocument,
} from "@/utils/fileFormats";
import { getApiErrorMessage } from "@/utils/apiError";

function describeImport(result: IngestionResult): string {
  const skippedUnknown = result.sales_skipped_unknown ?? 0;
  const skippedDuplicate = result.sales_skipped_duplicate ?? 0;
  const parts = [
    `${result.products_ingested} produit(s)`,
    `${result.sales_ingested} vente(s) ajoutée(s)`,
  ];
  if (skippedUnknown) parts.push(`${skippedUnknown} vente(s) ignorée(s) (SKU inconnu)`);
  if (skippedDuplicate) parts.push(`${skippedDuplicate} vente(s) déjà présentes`);
  return `${result.filename} — ${parts.join(", ")}.`;
}

export function ImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestionResult | null>(null);

  function pickFile(selected: File | null) {
    if (!selected) return;
    if (!isAcceptedDocument(selected)) {
      setError("Format non supporté. Formats acceptés : CSV et Excel (.xlsx, .xls).");
      setFile(null);
      return;
    }
    setError(null);
    setResult(null);
    setFile(selected);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!file) return;
    if (!window.confirm(`Importer « ${file.name} » dans le store commun ?`)) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.ingestFile(file);
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  const displayFormats = ["csv", "xlsx", "xls"] as const;

  return (
    <AppPageLayout
      eyebrow="Données"
      title="Import & export"
      description="Importez un CSV ou un Excel. Les lignes sont normalisées vers le schéma commun, comme la saisie manuelle."
    >
      <div className="card card--glass import-zone">
        <div
          className={`dropzone ${dragging ? "dropzone--active" : ""} ${file ? "dropzone--has-file" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            className="dropzone__input"
            onChange={handleInputChange}
          />
          <IconUpload className="dropzone__icon" size={40} />
          {file ? (
            <>
              <p className="dropzone__title">Fichier sélectionné</p>
              <p className="dropzone__filename">{file.name}</p>
              <p className="muted">{(file.size / 1024).toFixed(1)} Ko</p>
            </>
          ) : (
            <>
              <p className="dropzone__title">Glissez un CSV ou un Excel ici</p>
              <p className="muted">ou cliquez pour parcourir vos fichiers</p>
            </>
          )}
        </div>

        <div className="format-grid format-grid--compact">
          {displayFormats.map((format) => (
            <div key={format} className="format-chip">
              <DocumentFormatIcon format={format} size={20} />
              <span>{formatLabel(format)}</span>
            </div>
          ))}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {result && (
          <Alert variant="success" title="Fichier importé">
            {describeImport(result)}
          </Alert>
        )}

        <div className="import-actions">
          <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading}>
            Importer le fichier
          </Button>
          {uploading && <Spinner size="sm" label="Traitement en cours…" />}
        </div>
      </div>

      <div className="card card--glass">
        <h2>Formats acceptés</h2>
        <ul className="import-hints">
          <li>
            <strong>Tableurs :</strong> CSV, Excel (.xlsx, .xls)
          </li>
          <li>PDF, Word et PowerPoint ne sont pas supportés dans ce MVP.</li>
          <li>Une vente dont le SKU n&apos;existe pas au catalogue est ignorée.</li>
          <li>Extensions reconnues : {ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}</li>
        </ul>
      </div>

      <ExportPanel />
    </AppPageLayout>
  );
}
