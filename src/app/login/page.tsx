import { Metadata } from 'next';
import { AuthView } from '@/components/auth/AuthView';

export const metadata: Metadata = {
  title: 'Masuk Terminal | Fynence',
  description: 'Akses masuk terminal otorisasi akun Fynence.',
};

export default function LoginPage() {
  return <AuthView initialMode="login" />;
}
