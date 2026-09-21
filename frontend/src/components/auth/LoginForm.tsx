"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleAccountModal } from "@/components/auth/GoogleAccountModal";
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
  const { login, loginWithGoogleAccount, isAuthenticated } = useAuth();
  const [values, setValues] = useState<LoginFormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
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

  async function handleSelectGoogleAccount(account: { email: string; name?: string }) {
    setGoogleSubmitting(true);
    setServerError(null);
    try {
      await loginWithGoogleAccount(account);
      setIsGoogleModalOpen(false);
      router.push("/dashboard");
    } catch {
      setServerError("Impossible de se connecter avec le compte Google sélectionné.");
    } finally {
      setGoogleSubmitting(false);
    }
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
      subtitle="Accédez à votre espace BizIA."
      footer={
        <p className="auth-card__switch">
          Vous n&apos;avez pas encore de compte ?{" "}
          <Link href="/inscription">S&apos;inscrire</Link>
        </p>
      }
    >
      <div className="auth-oauth">
        <button
          type="button"
          className="btn btn--google"
          onClick={() => setIsGoogleModalOpen(true)}
          disabled={googleSubmitting || submitting}
        >
          <span className="btn__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </span>
          <span>{googleSubmitting ? "Connexion Google…" : "Continuer avec Google"}</span>
        </button>

        <div className="auth-divider">
          <span>ou avec votre e-mail</span>
        </div>
      </div>

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

        <div className="form-field-group">
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
          <div className="auth-forgot-link-wrapper">
            <Link href="/mot-de-passe-oublie" className="auth-forgot-link">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!isFormValid || submitting || googleSubmitting}
        >
          Se connecter
        </Button>
      </form>

      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
        isLoading={googleSubmitting}
      />
    </AuthCard>
  );
}
