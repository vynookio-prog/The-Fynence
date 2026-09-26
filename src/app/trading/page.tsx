'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TradingView } from '@/components/trading/TradingView';

export default function TradingPage() {
  return (
    <AppShell>
      <TradingView />
    </AppShell>
  );
}
