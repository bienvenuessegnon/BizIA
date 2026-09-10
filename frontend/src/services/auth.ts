/** Client d'authentification serveur. Seul le jeton de session reste local. */

import type { AuthSession, LoginPayload, SignupPayload, User } from "@/types/auth";

const SESSION_KEY = "bizia_auth_session";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class AuthServiceError extends Error {
  code: "email_already_used" | "invalid_credentials" | "network_error";

  constructor(code: AuthServiceError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AuthServiceError";
  }
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function persistSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

type ApiUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type ApiSession = { user: ApiUser; token: string };

function mapSession(value: ApiSession): AuthSession {
  return {
    token: value.token,
    user: {
      id: value.user.id,
      firstName: value.user.first_name,
      lastName: value.user.last_name,
      email: value.user.email,
    },
  };
}

async function authRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new AuthServiceError("network_error", "Serveur d'authentification inaccessible.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data?.error?.code;
    throw new AuthServiceError(
      code === "email_already_used" ? code : "invalid_credentials",
      data?.error?.message ?? "Authentification impossible.",
    );
  }
  return data as T;
}

export async function signup(payload: SignupPayload): Promise<AuthSession> {
  const data = await authRequest<ApiSession>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: payload.password,
    }),
  });
  const session = mapSession(data);
  persistSession(session);
  return session;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const data = await authRequest<ApiSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const session = mapSession(data);
  persistSession(session);
  return session;
}

export async function loginWithGoogle(credential: string): Promise<AuthSession> {
  const data = await authRequest<ApiSession>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  const session = mapSession(data);
  persistSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const session = getStoredSession();
  if (session) {
    await authRequest<void>("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
    }).catch(() => undefined);
  }
  clearSession();
}

export async function restoreSession(): Promise<AuthSession | null> {
  const session = getStoredSession();
  if (!session) return null;
  try {
    const data = await authRequest<{ user: ApiUser }>("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const restored = mapSession({ token: session.token, user: data.user });
    persistSession(restored);
    return restored;
  } catch {
    clearSession();
    return null;
  }
}
