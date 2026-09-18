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
    isNewUser: true,
  };

  writeUsers([...users, user]);
  const session = toSession({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isNewUser: true,
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
    isNewUser: match.isNewUser ?? (match.email !== "demo@bizia.africa"),
  });
  persistSession(session);
  return session;
}

export async function logout(): Promise<void> {
  await delay(200);
  clearSession();
}

export async function loginWithGoogleAccount(profile: {
  email: string;
  name?: string;
}): Promise<AuthSession> {
  await delay(500);
  const email = profile.email.trim().toLowerCase();

  // Déduire le nom depuis le compte Gmail si non spécifié
  let resolvedName = profile.name?.trim();
  if (!resolvedName) {
    const userPart = email.split("@")[0].replace(/[._-]/g, " ");
    resolvedName = userPart
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  const parts = resolvedName.split(" ");
  const firstName = parts[0] || "Utilisateur";
  const lastName = parts.slice(1).join(" ") || "Google";

  const users = readUsers();
  const existingUser = users.find((u) => u.email.toLowerCase() === email);
  const isNew = !existingUser && email !== "demo@bizia.africa";

  const googleUser: User = {
    id: existingUser?.id || `google_${Date.now()}`,
    firstName: existingUser?.firstName || firstName,
    lastName: existingUser?.lastName || lastName,
    email,
    isNewUser: existingUser ? (existingUser.isNewUser ?? false) : isNew,
  };

  if (!existingUser) {
    writeUsers([
      ...users,
      {
        ...googleUser,
        password: "google_oauth_protected",
      },
    ]);
  }

  const session = toSession(googleUser);
  persistSession(session);
  return session;
}

export async function loginWithGoogle(): Promise<AuthSession> {
  return loginWithGoogleAccount({
    email: "amadou.kone@gmail.com",
    name: "Amadou Koné",
  });
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  await delay(500);
  const users = readUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  return exists || true; // Toujours renvoyer true côté client pour des raisons de sécurité
}

export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  await delay(500);
  const users = readUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (index >= 0) {
    users[index].password = newPassword;
    writeUsers(users);
    return true;
  }
  return false;
}

