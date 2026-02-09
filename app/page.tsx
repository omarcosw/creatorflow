import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold uppercase tracking-widest border border-emerald-500/20">
          Em breve
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-display">
          CreatorFlow AI
        </h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          Suite de produtividade com IA para criadores de conteúdo.
          Planeje, produza e publique com agilidade.
        </p>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-zinc-900 font-bold text-lg shadow-lg hover:opacity-90 transition-all"
        >
          Acessar Dashboard
        </Link>
      </div>
    </div>
  );
}
