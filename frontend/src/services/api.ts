/**
 * Client HTTP unique du frontend (contrat figé avec le backend).
 */

import type { Alert, AnalysisResult, ChatReply, IngestionResult, Product, Sale } from "@/types";
import { getStoredSession } from "@/services/auth";

// Vide quand l'API et le site partagent la même origine (déploiement en un service).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_IS_SAME_ORIGIN = API_URL === "";

export const API_UNREACHABLE_MESSAGE = API_IS_SAME_ORIGIN
  ? "Serveur momentanément indisponible. Réessayez dans un instant."
  : `Serveur backend inaccessible. Démarrez-le sur ${API_URL}`;

export class ApiError extends Error {
  code: "network" | "http";

  constructor(code: ApiError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const token = getStoredSession()?.token;
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("network", API_UNREACHABLE_MESSAGE);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const rawMessage = data?.error?.message ?? data?.detail ?? response.statusText;
    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : Array.isArray(rawMessage)
          ? "Requête invalide."
          : "Erreur lors de la communication avec le serveur.";
    throw new ApiError("http", message);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  products: {
    list: () => request<{ items: Product[] }>("/api/products"),
    create: (body: Product) =>
      request<{ item: Product | null }>("/api/products", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  sales: {
    list: () => request<{ items: Sale[] }>("/api/sales"),
    create: (body: Sale) =>
      request<{ item: Sale | null }>("/api/sales", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  ingestFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<IngestionResult>("/api/ingestion/files", { method: "POST", body: form });
  },
  runAnalysis: () => request<{ result: AnalysisResult | null }>("/api/analysis/run", { method: "POST" }),
  summary: () => request<{ result: AnalysisResult | null }>("/api/analysis/summary"),
  alerts: () => request<{ items: Alert[] }>("/api/alerts"),
  chat: (message: string) =>
    request<ChatReply>("/api/chat/messages", { method: "POST", body: JSON.stringify({ message }) }),
  reports: {
    download: async (format: "pdf" | "docx") => {
      let response: Response;
      try {
        const token = getStoredSession()?.token;
        response = await fetch(`${API_URL}/api/reports/generate?format=${format}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch {
        throw new ApiError("network", "Serveur backend inaccessible.");
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiError("http", data?.error?.message ?? "Export indisponible.");
      }
      downloadBlob(await response.blob(), `bizia-rapport.${format}`);
    },
  },
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export { API_URL };
