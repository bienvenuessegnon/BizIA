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
  validateLoginForm,
  type LoginFormValues,
} from "@/utils/validation";

const INITIAL: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [values, setValues] = useState<LoginFormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="auth-card auth-card--loading">
        <Spinner label="Redirection vers votre espace…" />
      </div>
    );
  }

  const validationErrors = validateLoginForm(values);
  const isFormValid = Object.keys(validationErrors).length === 0;

  function handleChange(field: keyof LoginFormValues, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setServerError(null);
    if (touched[field]) {
      setErrors(validateLoginForm(next));
    }
  }

  function handleBlur(field: keyof LoginFormValues) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validateLoginForm(values));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const formErrors = validateLoginForm(values);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    try {
      await login({
        email: values.email,
        password: values.password,
      });
      router.push("/dashboard");
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
      title="Connexion"
      subtitle="Accédez à votre compte BizIA sécurisé."
      footer={
        <p className="auth-card__switch">
          Vous n&apos;avez pas encore de compte ?{" "}
          <Link href="/inscription">S&apos;inscrire</Link>
        </p>
      }
    >
      <GoogleLoginButton />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {serverError && <Alert variant="error">{serverError}</Alert>}

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
          placeholder="Votre mot de passe"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          error={touched.password ? errors.password : undefined}
          valid={isFieldValid("password", values, validationErrors)}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!isFormValid || submitting}
        >
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
