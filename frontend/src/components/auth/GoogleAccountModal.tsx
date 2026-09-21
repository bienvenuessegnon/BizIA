"use client";

import { useState, type FormEvent } from "react";
import { IconGoogle, IconX } from "@/components/icons/Icons";
import { Button } from "@/components/ui/Button";

type GoogleAccount = {
  name: string;
  email: string;
  avatarLetter: string;
};

const SUGGESTED_ACCOUNTS: GoogleAccount[] = [
  { name: "Amadou Koné", email: "amadou.kone@gmail.com", avatarLetter: "A" },
  { name: "Fatou Diop", email: "fatou.diop@gmail.com", avatarLetter: "F" },
  { name: "Sidy Traoré", email: "sidy.traore@gmail.com", avatarLetter: "S" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { email: string; name?: string }) => void;
  isLoading?: boolean;
};

export function GoogleAccountModal({
  isOpen,
  onClose,
  onSelectAccount,
  isLoading = false,
}: Props) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState("");

  if (!isOpen) return null;

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    if (!customEmail.trim()) return;

    onSelectAccount({
      email: customEmail.trim(),
    });
  }

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card card card--glass animate-scale-up google-modal" style={{ maxWidth: 480, width: "100%" }}>
        <div className="modal-header" style={{ alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconGoogle size={24} />
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Connexion avec Google</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isLoading}
          >
            <IconX size={16} />
          </button>
        </div>

        <p className="muted" style={{ margin: "6px 0 18px", fontSize: "0.92rem", lineHeight: 1.5 }}>
          Sélectionnez un compte Google ou saisissez directement votre adresse Gmail :
        </p>

        {!showCustomInput ? (
          <div className="google-accounts-list">
            {SUGGESTED_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="google-account-item"
                onClick={() => onSelectAccount({ email: acc.email, name: acc.name })}
                disabled={isLoading}
              >
                <div className="google-account-avatar">{acc.avatarLetter}</div>
                <div className="google-account-info">
                  <strong className="google-account-name">{acc.name}</strong>
                  <span className="google-account-email">{acc.email}</span>
                </div>
              </button>
            ))}

            <div style={{ marginTop: 14, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
              <button
                type="button"
                className="google-account-item google-account-item--new"
                onClick={() => setShowCustomInput(true)}
                disabled={isLoading}
              >
                <div className="google-account-avatar google-account-avatar--new">+</div>
                <div className="google-account-info">
                  <strong className="google-account-name">Saisir une autre adresse Gmail</strong>
                  <span className="google-account-email">Connexion instantanée avec votre adresse Google</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="google-custom-form">
            <div className="form-field" style={{ marginBottom: 20 }}>
              <label
                className="form-label"
                htmlFor="google-email"
                style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", marginBottom: 8, display: "block" }}
              >
                Adresse e-mail Google (Gmail)
              </label>
              <input
                id="google-email"
                type="email"
                className="input"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "1rem",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                placeholder="ex: amadou.kone@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                autoFocus
              />
              <span style={{ display: "block", marginTop: 6, fontSize: "0.82rem", color: "#64748b" }}>
                Votre nom de profil sera automatiquement configuré à partir de votre adresse.
              </span>
            </div>

            <div className="modal-actions" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCustomInput(false)}
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button type="submit" loading={isLoading} disabled={!customEmail.trim()}>
                Se connecter avec ce compte
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
