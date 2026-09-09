import { SignupForm } from "@/components/auth/SignupForm";
import { AuthPageLayout } from "@/components/layout/AuthPageLayout";

export default function InscriptionPage() {
  return (
    <AuthPageLayout>
      <SignupForm />
    </AuthPageLayout>
  );
}
