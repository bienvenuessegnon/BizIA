import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — BizIA",
  description: "Réinitialisez l'accès à votre compte d'entreprise BizIA.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
