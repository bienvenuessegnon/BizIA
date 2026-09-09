const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export type FieldErrors = Record<string, string>;

export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export function validateSignupForm(values: SignupFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!isNonEmpty(values.firstName)) {
    errors.firstName = "Le prénom est obligatoire.";
  }
  if (!isNonEmpty(values.lastName)) {
    errors.lastName = "Le nom est obligatoire.";
  }
  if (!isNonEmpty(values.email)) {
    errors.email = "L'adresse e-mail est obligatoire.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "L'adresse e-mail n'est pas valide.";
  }
  if (!isNonEmpty(values.password)) {
    errors.password = "Le mot de passe est obligatoire.";
  } else if (values.password.length < 8) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!isNonEmpty(values.passwordConfirmation)) {
    errors.passwordConfirmation = "La confirmation est obligatoire.";
  } else if (values.password !== values.passwordConfirmation) {
    errors.passwordConfirmation = "Les mots de passe ne correspondent pas.";
  }

  return errors;
}

export type LoginFormValues = {
  email: string;
  password: string;
};

export function validateLoginForm(values: LoginFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!isNonEmpty(values.email)) {
    errors.email = "L'adresse e-mail est obligatoire.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "L'adresse e-mail n'est pas valide.";
  }
  if (!isNonEmpty(values.password)) {
    errors.password = "Le mot de passe est obligatoire.";
  }

  return errors;
}

export function isFieldValid(
  name: string,
  values: SignupFormValues | LoginFormValues,
  errors: FieldErrors,
): boolean {
  const value = values[name as keyof typeof values];
  if (typeof value !== "string" || !value.trim()) return false;
  return !errors[name];
}
