/**
 * Service d'authentification frontend.
 *
 * Aucun endpoint backend n'existe encore pour l'auth BizIA.
 * Stockage local (localStorage) pour la démo / le développement.
 *
 * Endpoints futurs attendus (backend Uriel) :
 *   POST /api/auth/register  → { first_name, last_name, email, password }
 *   POST /api/auth/login     → { email, password }
 *   POST /api/auth/logout    → (optionnel)
 */

import type { AuthSession, LoginPayload, SignupPayload, User } from "@/types/auth";

const USERS_KEY = "bizia_auth_users";
const SESSION_KEY = "bizia_auth_session";

type StoredUser = User & { password: string };

export class AuthServiceError extends Error {
  code: "email_already_used" | "invalid_credentials" | "network_error";

  constructor(code: AuthServiceError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AuthServiceError";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toSession(user: User): AuthSession {
  return {
    user,
    token: `local_${user.id}_${Date.now()}`,
  };
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

export async function signup(payload: SignupPayload): Promise<AuthSession> {
  await delay(600);

  const email = payload.email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((u) => u.email.toLowerCase() === email)) {
    throw new AuthServiceError(
      "email_already_used",
      "Cette adresse e-mail est déjà utilisée.",
    );
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email,
    password: payload.password,
  };

  writeUsers([...users, user]);
  const session = toSession({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });
  persistSession(session);
  return session;
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  await delay(500);

  const email = payload.email.trim().toLowerCase();
  const users = readUsers();
  const match = users.find(
    (u) => u.email.toLowerCase() === email && u.password === payload.password,
  );

  if (!match) {
    throw new AuthServiceError(
      "invalid_credentials",
      "E-mail ou mot de passe incorrect.",
    );
  }

  const session = toSession({
    id: match.id,
    firstName: match.firstName,
    lastName: match.lastName,
    email: match.email,
  });
  persistSession(session);
  return session;
}

export async function logout(): Promise<void> {
  await delay(200);
  clearSession();
}
