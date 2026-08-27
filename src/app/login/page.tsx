import { AuthForm } from "../../components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <AuthForm mode="login" />
    </div>
  );
}
