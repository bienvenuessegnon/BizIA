"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { DocumentFormatIcon, IconUpload } from "@/components/icons/Icons";
import { ExportPanel } from "@/components/import/ExportPanel";
import { ImportPreview } from "@/components/import/ImportPreview";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/services/api";
import type { IngestionPreview, IngestionResult } from "@/types";
import {
  ACCEPTED_EXTENSIONS,
  FILE_INPUT_ACCEPT,
  formatLabel,
  isAcceptedDocument,
} from "@/utils/fileFormats";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  PRODUCT_COLUMNS,
  PRODUCT_TEMPLATE_CSV,
  SALE_COLUMNS,
  SALE_TEMPLATE_CSV,
  downloadCsvTemplate,
  type ColumnDoc,
} from "@/utils/importColumns";

function plural(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count > 1 ? plural : singular}`;
}

/** Ne mentionne que ce qui s'est réellement passé, pour éviter les compteurs à zéro. */
function describeImport(result: IngestionResult): string {
  const skippedUnknown = result.sales_skipped_unknown ?? 0;
  const skippedDuplicate = result.sales_skipped_duplicate ?? 0;
  const added: string[] = [];
  if (result.products_ingested) added.push(`${plural(result.products_ingested, "produit")} enregistré${result.products_ingested > 1 ? "s" : ""}`);
  if (result.sales_ingested) added.push(`${plural(result.sales_ingested, "vente")} ajoutée${result.sales_ingested > 1 ? "s" : ""}`);

  const ignored: string[] = [];
  if (skippedUnknown) ignored.push(`${plural(skippedUnknown, "vente")} sans produit au catalogue`);
  if (skippedDuplicate) ignored.push(`${plural(skippedDuplicate, "vente")} déjà présente${skippedDuplicate > 1 ? "s" : ""}`);

  if (!added.length) {
    return ignored.length
      ? `Aucune ligne n'a été ajoutée : ${ignored.join(", ")}.`
      : "Aucune ligne exploitable n'a été trouvée dans ce fichier.";
  }
  const summary = added.join(" et ");
  return ignored.length ? `${summary}. Ignoré : ${ignored.join(", ")}.` : `${summary}.`;
}

export function ImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [preview, setPreview] = useState<IngestionPreview | null>(null);

  function pickFile(selected: File | null) {
    if (!selected) return;
    if (!isAcceptedDocument(selected)) {
      setError("Format non supporté. Formats acceptés : CSV, Excel, PDF et images (PNG, JPEG, WebP).");
      setFile(null);
      return;
    }
    setError(null);
    setResult(null);
    setPreview(null);
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

  function clearFile() {
    setFile(null);
    setError(null);
    setResult(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.previewFile(file);
      setPreview(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  const displayFormats = ["csv", "xlsx", "pdf", "png"] as const;
  const addedRows = result ? result.products_ingested + result.sales_ingested : 0;

  return (
    <AppPageLayout
      eyebrow="Données"
      title="Import & export"
      description="Importez un CSV, un Excel, un PDF ou une photo de tableau. Les lignes sont normalisées vers le schéma commun, comme la saisie manuelle."
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
          aria-label="Choisir un fichier à importer"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
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
              <p className="dropzone__title">Glissez un CSV, Excel, PDF ou une image ici</p>
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
          <Alert variant={addedRows ? "success" : "warning"} title={result.filename}>
            {describeImport(result)}
            {addedRows > 0 && (
              <>
                {" "}
                <Link href="/ventes" className="alert__link">
                  Voir l&apos;historique des ventes
                </Link>{" "}
                ou{" "}
                <Link href="/dashboard" className="alert__link">
                  ouvrir le dashboard
                </Link>
                .
              </>
            )}
          </Alert>
        )}

        <div className="import-actions">
          <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading}>
            Lire et reconstruire le tableau
          </Button>
          {file && !uploading && (
            <Button variant="ghost" onClick={clearFile}>
              Retirer le fichier
            </Button>
          )}
          {uploading && (
            <Spinner size="sm" label="Lecture de tout le document en cours…" />
          )}
        </div>
      </div>

      {preview && (
        <ImportPreview
          preview={preview}
          onCancel={clearFile}
          onCommitted={(data) => {
            setResult(data);
            setPreview(null);
            setFile(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      )}

      <div className="card card--glass">
        <h2>Colonnes attendues</h2>
        <p className="muted">
          Peu importe la casse, les accents ou une mention d&apos;unité : «&nbsp;Prix unitaire
          (FCFA)&nbsp;» et <code>prix_unitaire</code> sont reconnus de la même façon.
        </p>

        <ColumnTable
          caption="Fichier de ventes"
          columns={SALE_COLUMNS}
          note="Sans colonne de prix, BizIA reprend le prix de vente du catalogue."
          onDownload={() => downloadCsvTemplate("bizia-modele-ventes.csv", SALE_TEMPLATE_CSV)}
        />
        <ColumnTable
          caption="Fichier de produits"
          columns={PRODUCT_COLUMNS}
          note="Un SKU déjà présent est mis à jour plutôt que dupliqué."
          onDownload={() => downloadCsvTemplate("bizia-modele-produits.csv", PRODUCT_TEMPLATE_CSV)}
        />

        <ul className="import-hints">
          <li>Une vente dont le SKU n&apos;existe pas au catalogue est ignorée.</li>
          <li>Extensions reconnues : {ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(", ")}</li>
        </ul>
      </div>

      <ExportPanel />
    </AppPageLayout>
  );
}

type ColumnTableProps = {
  caption: string;
  columns: ColumnDoc[];
  note: string;
  onDownload: () => void;
};

function ColumnTable({ caption, columns, note, onDownload }: ColumnTableProps) {
  return (
    <section className="column-guide">
      <div className="column-guide__head">
        <h3>{caption}</h3>
        <Button variant="ghost" onClick={onDownload}>
          Télécharger le modèle CSV
        </Button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Donnée</th>
              <th>En-têtes acceptés</th>
              <th>Requis</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.field}>
                <td>{column.label}</td>
                <td className="column-guide__aliases">
                  {column.aliases.map((alias) => (
                    <code key={alias}>{alias}</code>
                  ))}
                </td>
                <td>
                  {column.required ? (
                    <span className="table-tag table-tag--warn">Oui</span>
                  ) : (
                    <span className="muted">Optionnel</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">{note}</p>
    </section>
  );
}
