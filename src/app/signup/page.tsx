import { Metadata } from 'next';
import { AuthView } from '@/components/auth/AuthView';

export const metadata: Metadata = {
  title: 'Daftar Akun Baru | Fynence',
  description: 'Inisialisasi akun operator baru Anda dengan wizard multi-step terpadu Fynence.',
};

export default function SignUpPage() {
  return <AuthView initialMode="signup" />;
}
