import { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ProfileView } from '@/components/profile/ProfileView';

export const metadata: Metadata = {
  title: 'Profil & Pengaturan | Fynence',
  description: 'Kelola profil operator, avatar trader, dan preferensi zona waktu global akun Fynence Anda.',
};

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileView />
    </AppShell>
  );
}
