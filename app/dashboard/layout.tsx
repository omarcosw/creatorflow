import type { Metadata } from 'next';
import { IaraProvider } from '@/components/IaraContext';
import GlobalIaraButton from '@/components/GlobalIaraButton';
import IaraDrawer from '@/components/IaraDrawer';

export const metadata: Metadata = {
  title: 'Dashboard — CreatorFlow AI',
  description: 'Dashboard de produtividade com IA para criadores de conteúdo',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IaraProvider>
      {children}
      <GlobalIaraButton />
      <IaraDrawer />
    </IaraProvider>
  );
}
