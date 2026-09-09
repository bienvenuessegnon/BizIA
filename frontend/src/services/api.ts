/**
 * Client HTTP unique du frontend (contrat figé avec le backend).
 * TODO(imma): brancher les écrans dessus, gérer chargements et erreurs.
 */

import type { Alert, AnalysisResult, ChatReply, IngestionResult, Product, Sale } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message ?? data?.detail ?? response.statusText;
    throw new Error(typeof message === "string" ? message : "Erreur API");
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
};

export { API_URL };
