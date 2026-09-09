import { LoginForm } from "@/components/auth/LoginForm";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";

export default function ConnexionPage() {
  return (
    <AuthPageLayout>
      <LoginForm />
    </AuthPageLayout>
  );
}
