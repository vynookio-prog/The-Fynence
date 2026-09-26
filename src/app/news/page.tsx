'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { NewsView } from '@/components/news/NewsView';

export default function NewsPage() {
  return (
    <AppShell>
      <NewsView />
    </AppShell>
  );
}
