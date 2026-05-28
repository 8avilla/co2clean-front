import { Metadata } from 'next';
import { AuthLayout } from '@/components/Auth/components/AuthLayout';
import { LoginForm } from '@/components/Auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | EcoCore',
  description: 'Acceda al portal de gestión de salud EcoCore.',
};

/**
 * Login Page.
 * Orchestrates the authentication flow by providing the layout and the form.
 */
export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
