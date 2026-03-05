'use client';

import { ReactNode } from 'react';
import { IaraProvider } from '@/components/IaraContext';
import IaraDrawer from '@/components/IaraDrawer';

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <IaraProvider>
      {children}
      <IaraDrawer />
    </IaraProvider>
  );
}
