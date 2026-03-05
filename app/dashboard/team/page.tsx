'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, UserPlus, MessageCircle } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  whatsapp: string;
  initials: string;
  bgCls: string;
  textCls: string;
}

const MOCK_TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Ricardo Alves',
    role: 'Diretor de Fotografia',
    whatsapp: '5511999990001',
    initials: 'RA',
    bgCls: 'bg-violet-900/40 border-violet-800/40',
    textCls: 'text-violet-300',
  },
  {
    id: '2',
    name: 'Fernanda Costa',
    role: 'Editora Sênior',
    whatsapp: '5511999990002',
    initials: 'FC',
    bgCls: 'bg-emerald-900/40 border-emerald-800/40',
    textCls: 'text-emerald-300',
  },
  {
    id: '3',
    name: 'Lucas Martins',
    role: 'Motion Designer',
    whatsapp: '5511999990003',
    initials: 'LM',
    bgCls: 'bg-blue-900/40 border-blue-800/40',
    textCls: 'text-blue-300',
  },
  {
    id: '4',
    name: 'Ana Paula Silva',
    role: 'Produtora Executiva',
    whatsapp: '5511999990004',
    initials: 'AS',
    bgCls: 'bg-amber-900/40 border-amber-800/40',
    textCls: 'text-amber-300',
  },
];

export default function TeamPage() {
  const router = useRouter();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#050505] text-white">
        {/* Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-600/8 blur-[140px] rounded-full" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

          {/* Back */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-white mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao Dashboard</span>
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white leading-tight">Equipe</h1>
                <p className="text-sm text-gray-500">{MOCK_TEAM.length} membros ativos</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
              <UserPlus className="w-4 h-4" />
              Convidar Membro
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOCK_TEAM.map((member) => (
              <div
                key={member.id}
                className="group bg-white/[0.03] border border-white/8 hover:border-white/15 rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300"
              >
                {/* Top row: avatar + status badge */}
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${member.bgCls}`}
                  >
                    <span className={`text-lg font-bold ${member.textCls}`}>
                      {member.initials}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-900/20 border border-emerald-900/40 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ativo
                  </span>
                </div>

                {/* Name + role */}
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{member.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{member.role}</p>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href={`https://wa.me/${member.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-[#25D366]/10 hover:border-[#25D366]/30 text-gray-400 hover:text-[#25D366] text-xs font-bold transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chamar no WhatsApp
                </a>
              </div>
            ))}
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}
