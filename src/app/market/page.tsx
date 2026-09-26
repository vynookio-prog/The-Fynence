'use client';

import React, { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MarketView } from '@/components/market/MarketView';
import { MarketSkeleton } from '@/components/market/MarketSkeleton';

export default function MarketPage() {
  return (
    <AppShell>
      <Suspense fallback={<MarketSkeleton />}>
        <MarketView />
      </Suspense>
    </AppShell>
  );
}

