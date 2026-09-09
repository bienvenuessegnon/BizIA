export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type AuthSession = {
  user: User;
  token: string;
};

export type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthErrorCode =
  | "email_already_used"
  | "invalid_credentials"
  | "network_error"
  | "unknown";
