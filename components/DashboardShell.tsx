'use client';

import { ReactNode } from 'react';
import { IaraProvider } from '@/components/IaraContext';
import IaraDrawer from '@/components/IaraDrawer';
import GlobalIaraButton from '@/components/GlobalIaraButton';

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <IaraProvider>
      {children}
      <GlobalIaraButton />
      <IaraDrawer />
    </IaraProvider>
  );
}
