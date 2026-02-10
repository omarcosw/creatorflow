import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WorkflowSection from '@/components/landing/WorkflowSection';
import AboutSection from '@/components/landing/AboutSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';
import FilmGrain from '@/components/landing/FilmGrain';

export const metadata: Metadata = {
  title: 'CreatorFlow \u2014 IA para Criadores de Conte\u00fado',
  description:
    'Suite de IA com 24 agentes especializados para criadores de v\u00eddeo. Roteiros, storyboards, SEO, or\u00e7amentos e muito mais.',
  keywords:
    'IA para creators, intelig\u00eancia artificial v\u00eddeo, roteiro IA, storyboard IA, YouTube SEO, criador de conte\u00fado',
  openGraph: {
    title: 'CreatorFlow \u2014 IA para Criadores de Conte\u00fado',
    description:
      'Suite de IA com 24 agentes especializados para criadores de v\u00eddeo.',
    url: 'https://creatorflowia.com',
    siteName: 'CreatorFlow',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <main className="bg-[#0A0A0A] text-white min-h-screen overflow-x-hidden">
      <FilmGrain />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <AboutSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
