"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

export function ForgotPasswordForm() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValidEmail) return;

    setSubmitting(true);
    setError(null);

    try {
      if (requestPasswordReset) {
        await requestPasswordReset(email);
      }
      setStep("reset");
    } catch {
      setError("Une erreur est survenue lors de la vérification.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (resetPassword) {
        await resetPassword(email, newPassword);
      }
      setStep("done");
    } catch {
      setError("Impossible de mettre à jour le mot de passe.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Réinitialisation du mot de passe"
      subtitle={
        step === "done"
          ? "Votre mot de passe a été modifié avec succès."
          : step === "reset"
          ? `Définissez votre nouveau mot de passe pour ${email}.`
          : "Saisissez votre e-mail pour réinitialiser votre mot de passe."
      }
      footer={
        <p className="auth-card__switch">
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link href="/connexion">Se connecter</Link>
        </p>
      }
    >
      {step === "done" ? (
        <div className="auth-card__success-state">
          <Alert variant="success" title="Mot de passe mis à jour !">
            Votre nouveau mot de passe est enregistré. Vous pouvez maintenant vous connecter avec votre adresse <strong>{email}</strong>.
          </Alert>
          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/connexion" className="btn btn--primary btn--lg" style={{ width: "100%", display: "block", textAlign: "center" }}>
              Se connecter maintenant
            </Link>
          </div>
        </div>
      ) : step === "reset" ? (
        <form className="auth-form" onSubmit={handleResetSubmit} noValidate>
          {error && <Alert variant="error">{error}</Alert>}

          <Alert variant="info" title="Lien de session validé">
            Votre session de réinitialisation sécurisée pour <strong>{email}</strong> est prête.
          </Alert>

          <Input
            name="newPassword"
            type="password"
            label="Nouveau mot de passe"
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError(null);
            }}
            required
            autoFocus
          />

          <Input
            name="confirmPassword"
            type="password"
            label="Confirmer le nouveau mot de passe"
            placeholder="Retapez votre nouveau mot de passe"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            required
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!newPassword || !confirmPassword || submitting}
          >
            Enregistrer le nouveau mot de passe
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setStep("email")}
            disabled={submitting}
            style={{ marginTop: 8 }}
          >
            ← Changer d&apos;adresse e-mail
          </Button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            name="email"
            type="email"
            label="Adresse e-mail"
            placeholder="jean.dupont@entreprise.fr"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onBlur={() => setTouched(true)}
            error={touched && !isValidEmail ? "Veuillez entrer une adresse e-mail valide." : undefined}
            valid={touched && isValidEmail}
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!isValidEmail || submitting}
          >
            Continuer la réinitialisation
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
