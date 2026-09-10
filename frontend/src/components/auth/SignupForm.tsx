"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthServiceError } from "@/services/auth";
import {
  isFieldValid,
  validateSignupForm,
  type SignupFormValues,
} from "@/utils/validation";

const INITIAL: SignupFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

export function SignupForm() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const [values, setValues] = useState<SignupFormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !success) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, success, router]);

  if (isAuthenticated && !success) {
    return (
      <div className="auth-card auth-card--loading">
        <Spinner label="Redirection vers votre espace…" />
      </div>
    );
  }

  const validationErrors = validateSignupForm(values);
  const isFormValid = Object.keys(validationErrors).length === 0;

  function handleChange(field: keyof SignupFormValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setServerError(null);
    if (touched[field]) {
      const nextErrors = validateSignupForm(next);
      setErrors(nextErrors);
    }
  }

  function handleBlur(field: keyof SignupFormValues) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validateSignupForm(values));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      passwordConfirmation: true,
    });

    const formErrors = validateSignupForm(values);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    try {
      await signup({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      if (err instanceof AuthServiceError) {
        setServerError(err.message);
      } else {
        setServerError("Connexion indisponible. Vérifiez votre réseau et réessayez.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Créez votre compte BizIA sécurisé."
      footer={
        <p className="auth-card__switch">
          Vous avez déjà un compte ?{" "}
          <Link href="/connexion">Se connecter</Link>
        </p>
      }
    >
      <GoogleLoginButton />
      {success ? (
        <Alert variant="success" title="Compte créé avec succès">
          Bienvenue {values.firstName} ! Redirection vers votre espace…
        </Alert>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <Alert variant="error">{serverError}</Alert>
          )}

          <div className="auth-form__row">
            <Input
              name="firstName"
              label="Prénom"
              placeholder="Jean"
              autoComplete="given-name"
              value={values.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              error={touched.firstName ? errors.firstName : undefined}
              valid={isFieldValid("firstName", values, validationErrors)}
            />
            <Input
              name="lastName"
              label="Nom"
              placeholder="Dupont"
              autoComplete="family-name"
              value={values.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              error={touched.lastName ? errors.lastName : undefined}
              valid={isFieldValid("lastName", values, validationErrors)}
            />
          </div>

          <Input
            name="email"
            type="email"
            label="Adresse e-mail"
            placeholder="jean.dupont@entreprise.fr"
            autoComplete="email"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={touched.email ? errors.email : undefined}
            valid={isFieldValid("email", values, validationErrors)}
          />

          <Input
            name="password"
            type="password"
            label="Mot de passe"
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={touched.password ? errors.password : undefined}
            valid={isFieldValid("password", values, validationErrors)}
            hint="Au moins 8 caractères."
          />

          <Input
            name="passwordConfirmation"
            type="password"
            label="Confirmation du mot de passe"
            placeholder="Répétez votre mot de passe"
            autoComplete="new-password"
            value={values.passwordConfirmation}
            onChange={(e) => handleChange("passwordConfirmation", e.target.value)}
            onBlur={() => handleBlur("passwordConfirmation")}
            error={touched.passwordConfirmation ? errors.passwordConfirmation : undefined}
            valid={isFieldValid("passwordConfirmation", values, validationErrors)}
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!isFormValid || submitting}
          >
            Créer mon compte
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
