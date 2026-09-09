import { ApiError } from "@/services/api";

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof TypeError || (err instanceof Error && err.message === "Failed to fetch")) {
    return "Serveur backend inaccessible. Démarrez-le sur http://localhost:8000";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Une erreur inattendue est survenue.";
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return err.code === "network";
  return err instanceof TypeError || (err instanceof Error && err.message === "Failed to fetch");
}
