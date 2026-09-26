'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ReportView } from '@/components/report/ReportView';

export default function ReportPage() {
  return (
    <AppShell>
      <ReportView />
    </AppShell>
  );
}
