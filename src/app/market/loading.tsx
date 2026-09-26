import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MarketSkeleton } from '@/components/market/MarketSkeleton';

export default function MarketLoading() {
  return (
    <AppShell>
      <MarketSkeleton />
    </AppShell>
  );
}
