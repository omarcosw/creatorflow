import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — CreatorFlow AI',
  description: 'Dashboard de produtividade com IA para criadores de conteúdo',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
