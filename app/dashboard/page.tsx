'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { AGENTS } from '@/lib/constants';
import { AgentId, ChatSession, InstagramProfile, ShotList, BrandKit, HDD, Recording, StudioProfile, Client } from '@/types';
import AgentView from '@/components/AgentView';
import ShotListManager from '@/components/ShotListManager';
import HubArquivos from '@/components/HubArquivos';
import ClientsHub from '@/components/ClientsHub';
import StudioProfileModal from '@/components/StudioProfileModal';
import AuthGuard from '@/components/auth/AuthGuard';
import { LayoutGrid, Sparkles, ChevronRight, Share2, Sun, Moon, ArrowLeft, Zap, BookOpen, Lock, Bug, MessageSquare, Send, X, Gift, Copy, Check, Twitter, MessageCircle, LogOut, Archive, AlertTriangle, Clapperboard, Users, BarChart3, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'creator_flow_history_v2';
const PROFILES_KEY = 'creator_flow_ig_profiles';
const SHOT_LISTS_KEY = 'creator_flow_shot_lists';
const BRAND_KITS_KEY = 'creator_flow_brand_kits';
const THEME_KEY = 'creator_flow_theme';
const HDDS_KEY = 'creator_flow_hdds';
const RECORDINGS_KEY = 'creator_flow_recordings';
const STUDIO_KEY = 'creator_flow_studio_profile';
const CLIENTS_KEY = 'creator_flow_clients';

const INITIAL_STUDIO: StudioProfile = {
  name: '',
  type: '',
  equipment: { cameras: [], lenses: [], audio: [], lighting: [] },
};

// --- SUPPORT MODAL COMPONENT ---
const SupportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [type, setType] = useState<'bug' | 'suggestion'>('bug');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSend = () => {
        if (!message.trim()) return;

        const subject = `[CreatorFlow Feedback] - ${type === 'bug' ? 'Relato de Bug 🐛' : 'Sugestão de Melhoria 💡'}`;
        const body = `Olá equipe CreatorFlow,%0D%0A%0D%0AEstou enviando o seguinte feedback:%0D%0A%0D%0ATipo: ${type === 'bug' ? 'Bug/Erro' : 'Sugestão'}%0D%0ADescrição:%0D%0A${encodeURIComponent(message)}%0D%0A%0D%0AAtenciosamente,%0D%0AUm Criador de Conteúdo.`;
        
        window.open(`mailto:suporte@creatorflow.com?subject=${subject}&body=${body}`, '_blank');
        onClose();
        setMessage('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-500" />
                        Ajude-nos a melhorar
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 block">O que você deseja fazer?</label>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setType('bug')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all ${type === 'bug' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                <Bug className="w-4 h-4" /> Relatar Bug
                            </button>
                            <button 
                                onClick={() => setType('suggestion')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all ${type === 'suggestion' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                <Sparkles className="w-4 h-4" /> Dar Sugestão
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">
                            {type === 'bug' ? 'Descreva o problema' : 'Descreva sua ideia'}
                        </label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={type === 'bug' ? "Ex: O botão de salvar não funcionou quando eu..." : "Ex: Seria incrível se tivesse um agente para..."}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 h-32 resize-none text-sm"
                        />
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        <Send className="w-4 h-4" /> Enviar Feedback
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- REFERRAL MODAL COMPONENT ---
const ReferralModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const referralLink = "creatorflow.ai/ref/user-x8z"; // Mock link

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (platform: 'whatsapp' | 'twitter') => {
        const text = encodeURIComponent(`🚀 Estou usando o CreatorFlow AI para criar meus conteúdos. Cadastre-se com meu link e ganhe 1 mês grátis: https://${referralLink}`);
        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${text}`, '_blank');
        } else {
            window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex justify-end absolute top-4 right-4">
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border border-amber-200 dark:border-amber-800">
                        🤝
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 leading-tight">
                        Convide amigos,<br/>ganhe acesso Pro 🚀
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        Para cada amigo que se cadastrar com seu link, vocês dois ganham <strong className="text-amber-600 dark:text-amber-400">1 mês de acesso premium extra.</strong>
                    </p>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 text-sm font-mono text-zinc-600 dark:text-zinc-400 truncate bg-transparent outline-none select-all">
                            {referralLink}
                        </div>
                        <button 
                            onClick={handleCopy}
                            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'}`}
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleShare('whatsapp')} className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:brightness-95 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20">
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </button>
                        <button onClick={() => handleShare('twitter')} className="flex items-center justify-center gap-2 py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm transition-all shadow-lg">
                            <Twitter className="w-4 h-4" />
                            Postar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeAgentId, setActiveAgentId] = useState<AgentId | null>(null);
  const [isLightingHubOpen, setIsLightingHubOpen] = useState(false);
  const [isProductionHubOpen, setIsProductionHubOpen] = useState(false);
  const [isEditingHubOpen, setIsEditingHubOpen] = useState(false);
  const [isArquivosHubOpen, setIsArquivosHubOpen] = useState(false);
  const [isClientesHubOpen, setIsClientesHubOpen] = useState(false);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [studioProfile, setStudioProfile] = useState<StudioProfile>(INITIAL_STUDIO);

  // Feedback Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Referral Modal State
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // Payment success toast
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('success=true')) {
      setShowPaymentSuccess(true);
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => setShowPaymentSuccess(false), 6000);
    }
  }, []);

  // Navigation context for cross-agent workflows
  const [navigationContext, setNavigationContext] = useState<{ prompt: string } | null>(null);
  
  const [sessions, setSessions] = useState<Record<string, ChatSession[]>>({});
  const [instagramProfiles, setInstagramProfiles] = useState<InstagramProfile[]>([]);
  const [shotLists, setShotLists] = useState<ShotList[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [hdds, setHdds] = useState<HDD[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agentQuery, setAgentQuery] = useState('');
  const [usageData, setUsageData] = useState<{ plan: string; features: Record<string, { used: number; limit: number; remaining: number; percentage: number }> } | null>(null);
  const [showUsage, setShowUsage] = useState(false);
  const [userPlan, setUserPlan] = useState('');

  useEffect(() => {
    const plan = localStorage.getItem('cf_plan') || '';
    setUserPlan(plan);
    const token = localStorage.getItem('cf_token');
    if (token) {
      fetch('/api/usage', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setUsageData(data); })
        .catch(() => { /* ignore */ });
    }
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    const savedProfiles = localStorage.getItem(PROFILES_KEY);
    const savedShotLists = localStorage.getItem(SHOT_LISTS_KEY);
    const savedBrandKits = localStorage.getItem(BRAND_KITS_KEY);
    const savedHdds = localStorage.getItem(HDDS_KEY);
    const savedRecordings = localStorage.getItem(RECORDINGS_KEY);
    const savedClients = localStorage.getItem(CLIENTS_KEY);

    if (savedSessions) {
      try { setSessions(JSON.parse(savedSessions)); } catch (e) { console.error(e); }
    }
    if (savedProfiles) {
      try { setInstagramProfiles(JSON.parse(savedProfiles)); } catch (e) { console.error(e); }
    }
    if (savedShotLists) {
      try { setShotLists(JSON.parse(savedShotLists)); } catch (e) { console.error(e); }
    }
    if (savedBrandKits) {
      try { setBrandKits(JSON.parse(savedBrandKits)); } catch (e) { console.error(e); }
    }
    if (savedHdds) {
      try { setHdds(JSON.parse(savedHdds)); } catch (e) { console.error(e); }
    }
    if (savedRecordings) {
      try { setRecordings(JSON.parse(savedRecordings)); } catch (e) { console.error(e); }
    }
    const savedStudio = localStorage.getItem(STUDIO_KEY);
    if (savedStudio) {
      try { setStudioProfile(JSON.parse(savedStudio)); } catch (e) { console.error(e); }
    }
    if (savedClients) {
      try { setClients(JSON.parse(savedClients)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(instagramProfiles));
  }, [instagramProfiles]);

  useEffect(() => {
    localStorage.setItem(SHOT_LISTS_KEY, JSON.stringify(shotLists));
  }, [shotLists]);

  useEffect(() => {
    localStorage.setItem(BRAND_KITS_KEY, JSON.stringify(brandKits));
  }, [brandKits]);

  useEffect(() => {
    localStorage.setItem(HDDS_KEY, JSON.stringify(hdds));
  }, [hdds]);

  useEffect(() => {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem(STUDIO_KEY, JSON.stringify(studioProfile));
  }, [studioProfile]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  const handleSaveSession = (agentId: string, updatedSession: ChatSession) => {
    setSessions(prev => {
        const agentSessions = prev[agentId] || [];
        const existingIndex = agentSessions.findIndex(s => s.id === updatedSession.id);
        let newAgentSessions;
        if (existingIndex >= 0) {
            newAgentSessions = [...agentSessions];
            newAgentSessions[existingIndex] = updatedSession;
        } else {
            newAgentSessions = [updatedSession, ...agentSessions];
        }
        return { ...prev, [agentId]: newAgentSessions };
    });
  };

  const handleDeleteSession = (agentId: string, sessionId: string) => {
      setSessions(prev => ({
          ...prev,
          [agentId]: (prev[agentId] || []).filter(s => s.id !== sessionId)
      }));
  };

  const handleSaveIGProfile = (profile: InstagramProfile) => {
      setInstagramProfiles(prev => [profile, ...prev]);
  };

  const handleDeleteIGProfile = (profileId: string) => {
      setInstagramProfiles(prev => prev.filter(p => p.id !== profileId));
      // Cleanup sessions associated with this profile
      setSessions(prev => {
          const igSessions = prev[AgentId.INSTAGRAM_CAPTIONS] || [];
          return {
              ...prev,
              [AgentId.INSTAGRAM_CAPTIONS]: igSessions.filter(s => s.profileId !== profileId)
          };
      });
  };

  const handleSaveShotList = (list: ShotList) => {
    setShotLists(prev => {
        const index = prev.findIndex(l => l.id === list.id);
        if (index >= 0) {
            const newList = [...prev];
            newList[index] = list;
            return newList;
        }
        return [list, ...prev];
    });
  };

  const handleDeleteShotList = (id: string) => {
      setShotLists(prev => prev.filter(l => l.id !== id));
  };

  // Brand Kit Handlers
  const handleSaveBrandKit = (kit: BrandKit) => {
    setBrandKits(prev => {
        const index = prev.findIndex(k => k.id === kit.id);
        if (index >= 0) {
            const newList = [...prev];
            newList[index] = kit;
            return newList;
        }
        return [kit, ...prev];
    });
  };

  const handleDeleteBrandKit = (id: string) => {
      setBrandKits(prev => prev.filter(k => k.id !== id));
  };

  const handleSaveHDD = (hdd: HDD) => {
    setHdds(prev => [hdd, ...prev]);
  };

  const handleDeleteHDD = (id: string) => {
    setHdds(prev => prev.filter(h => h.id !== id));
  };

  const handleSaveRecording = (recording: Recording) => {
    setRecordings(prev => {
      const exists = prev.some(r => r.id === recording.id);
      if (exists) return prev.map(r => r.id === recording.id ? recording : r);
      return [recording, ...prev];
    });
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Dá baixa em uma pendência: mantém a gravação, apenas limpa os campos de alerta.
  // O card some do Dashboard automaticamente pois pendingRecordings filtra hasPendingTakes === true.
  const handleResolveAlert = (id: string) => {
    setRecordings(prev =>
      prev.map(r =>
        r.id === id ? { ...r, hasPendingTakes: false, pendingTakesDescription: undefined } : r
      )
    );
  };

  const handleShare = async () => {
    const shareData = {
      title: 'CreatorFlow AI',
      text: 'Confira este dashboard de produtividade para criadores de conteúdo!',
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado!');
      }
    } catch (err) { console.error(err); }
  };

  const handleAgentClick = (id: AgentId) => {
      if (id === AgentId.LIGHTING_ASSISTANT) setIsLightingHubOpen(true);
      else if (id === AgentId.EXECUTIVE_PRODUCER) setIsProductionHubOpen(true);
      else if (id === AgentId.EDITING_WORKFLOW) setIsEditingHubOpen(true);
      else if (id === AgentId.SFX_ASSISTANT) setActiveAgentId(AgentId.SFX_LIBRARY);
      else setActiveAgentId(id);
  };

  const handleBack = () => {
      setNavigationContext(null);
      if (activeAgentId) {
          if ([AgentId.LIGHTING_GENERATOR, AgentId.LIGHTING_STYLES].includes(activeAgentId)) {
             setActiveAgentId(null);
             setIsLightingHubOpen(true);
             return;
          } 
          if ([AgentId.PROD_EXECUTIVE_AGENT, AgentId.SCRIPT_GENERATOR, AgentId.COST_CALCULATOR, AgentId.BUDGET_PRICING, AgentId.BUDGET_SHEET, AgentId.SHOT_LIST].includes(activeAgentId)) {
             setActiveAgentId(null);
             setIsProductionHubOpen(true);
             return;
          }
           if ([AgentId.EDITING_SHORTCUTS, AgentId.EDITING_IDEA, AgentId.EDITING_TECHNIQUES].includes(activeAgentId)) {
             setActiveAgentId(null);
             setIsEditingHubOpen(true);
             return;
          }
          setActiveAgentId(null);
      } else if (isLightingHubOpen) setIsLightingHubOpen(false);
      else if (isProductionHubOpen) setIsProductionHubOpen(false);
      else if (isEditingHubOpen) setIsEditingHubOpen(false);
      else if (isArquivosHubOpen) setIsArquivosHubOpen(false);
      else if (isClientesHubOpen) setIsClientesHubOpen(false);
  };

  const handleNavigateToAgent = (id: AgentId, prompt: string) => {
    setNavigationContext({ prompt });
    setIsProductionHubOpen(false);
    setIsEditingHubOpen(false);
    setIsLightingHubOpen(false);
    setActiveAgentId(id);
  };

  const activeAgent = activeAgentId ? AGENTS[activeAgentId] : null;
  const totalSessions = Object.values(sessions).reduce((acc, list) => acc + list.length, 0);

  const mainAgentIds = [
    AgentId.EXECUTIVE_PRODUCER,
    AgentId.LIGHTING_ASSISTANT,
    AgentId.STORYBOARD_GENERATOR,
    AgentId.EDITING_WORKFLOW,
    AgentId.SFX_ASSISTANT,
    AgentId.MEDIA_ASSISTANT
  ];

  const extraAgentIds = [
    AgentId.IMAGE_GENERATOR,
    AgentId.VIDEO_PROMPTS,
    AgentId.YOUTUBE_SEO,
    AgentId.INSTAGRAM_CAPTIONS,
  ];

  const quickActionIds = [
    AgentId.SCRIPT_GENERATOR,
    AgentId.SHOT_LIST,
    AgentId.INSTAGRAM_CAPTIONS,
  ];

  const normalizedQuery = agentQuery.trim().toLowerCase();
  const filterByQuery = (id: AgentId) => {
    if (!normalizedQuery) return true;
    const agent = AGENTS[id];
    return (
      agent.title.toLowerCase().includes(normalizedQuery) ||
      agent.description.toLowerCase().includes(normalizedQuery)
    );
  };
  const visibleMainAgentIds = mainAgentIds.filter(filterByQuery);
  const visibleExtraAgentIds = extraAgentIds.filter(filterByQuery);
  const stats = [
    { label: 'Conversas', value: totalSessions },
    { label: 'Perfis IG', value: instagramProfiles.length },
    { label: 'Shotlists', value: shotLists.length },
    { label: 'Brand Kits', value: brandKits.length },
  ];

  // Gravações com takes pendentes — alimenta a seção de Alertas de Produção
  const pendingRecordings = recordings.filter(r => r.hasPendingTakes === true);

  const fmtAlertDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const handleSubAgentClick = (id: AgentId) => {
      const agent = AGENTS[id];
      if (agent.isLocked && !agent.externalUrl) {
          alert("Disponível no Premium.");
          return;
      }
      if (agent.externalUrl) {
          window.open(agent.externalUrl, '_blank');
          return;
      }
      if (isProductionHubOpen) setIsProductionHubOpen(false);
      if (isEditingHubOpen) setIsEditingHubOpen(false);
      if (isLightingHubOpen) setIsLightingHubOpen(false);
      setActiveAgentId(id);
  }

  return (
    <AuthGuard>
    <div className="min-h-screen font-body selection:bg-indigo-500/30 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 right-0 h-[520px] w-[520px] rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute top-1/3 -left-48 h-[520px] w-[520px] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-400/10" />
      </div>
      {/* Payment success toast */}
      {showPaymentSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-lg px-6 py-4 shadow-2xl">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-white">Pagamento confirmado!</p>
              <p className="text-sm text-green-300">Bem-vindo ao CreatorFlow!</p>
            </div>
            <button onClick={() => setShowPaymentSuccess(false)} className="ml-4 text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
      <ReferralModal isOpen={isReferralModalOpen} onClose={() => setIsReferralModalOpen(false)} />
      <StudioProfileModal
        isOpen={isStudioModalOpen}
        profile={studioProfile}
        onSave={setStudioProfile}
        onClose={() => setIsStudioModalOpen(false)}
      />
      
      {activeAgentId === AgentId.SHOT_LIST ? (
        <ShotListManager 
            shotLists={shotLists}
            onSaveList={handleSaveShotList}
            onDeleteList={handleDeleteShotList}
            onBack={handleBack}
        />
      ) : activeAgent ? (
        <AgentView 
          agent={activeAgent} 
          onBack={handleBack}
          sessions={sessions[activeAgent.id] || []}
          onSaveSession={(session) => handleSaveSession(activeAgent.id, session)}
          onDeleteSession={(sessionId) => handleDeleteSession(activeAgent.id, sessionId)}
          instagramProfiles={instagramProfiles}
          onSaveIGProfile={handleSaveIGProfile}
          onDeleteIGProfile={handleDeleteIGProfile}
          onSaveShotList={handleSaveShotList} 
          brandKits={brandKits} // Passed prop
          onSaveBrandKit={handleSaveBrandKit} // Passed prop
          onDeleteBrandKit={handleDeleteBrandKit} // Passed prop
          navigationContext={navigationContext}
          onNavigateToAgent={handleNavigateToAgent}
          clients={clients}
        />
      ) : isProductionHubOpen ? (
          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button onClick={handleBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Dashboard</span>
            </button>
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Central de Produção</h1>
                <p className="text-zinc-600 dark:text-zinc-400">Ferramentas para planejar, orçar e organizar suas gravações.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[AgentId.SHOT_LIST, AgentId.SCRIPT_GENERATOR, AgentId.PROD_EXECUTIVE_AGENT, AgentId.COST_CALCULATOR, AgentId.BUDGET_PRICING, AgentId.BUDGET_SHEET].map(id => {
                    const agent = AGENTS[id];
                    const Icon = agent.icon;
                    return (
                        <button key={id} onClick={() => handleSubAgentClick(id)} className="flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 text-left group shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]">
                            <div className={`p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 w-fit mb-4 ${agent.color}`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{agent.title}</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 text-sm flex-1">{agent.description}</p>
                            <span className={`mt-auto font-medium flex items-center gap-2 text-sm ${agent.color.replace('text-', 'text-opacity-80 text-')}`}>
                                Acessar <ChevronRight className="w-4 h-4" />
                            </span>
                        </button>
                    )
                })}
            </div>
          </main>
      ) : isEditingHubOpen ? (
         <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button onClick={handleBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Dashboard</span>
            </button>
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Workflow de Edição</h1>
                <p className="text-zinc-600 dark:text-zinc-400">Otimize seu fluxo de pós-produção e desbloqueie sua criatividade.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[AgentId.EDITING_SHORTCUTS, AgentId.EDITING_IDEA, AgentId.EDITING_TECHNIQUES].map(id => {
                    const agent = AGENTS[id];
                    const Icon = agent.icon;
                    return (
                        <button key={id} onClick={() => handleSubAgentClick(id)} className="flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 text-left group shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]">
                            <div className={`p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 w-fit mb-4 ${agent.color}`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{agent.title}</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 text-sm flex-1">{agent.description}</p>
                            <span className={`mt-auto font-medium flex items-center gap-2 text-sm ${agent.color.replace('text-', 'text-opacity-80 text-')}`}>
                                Abrir Ferramenta <ChevronRight className="w-4 h-4" />
                            </span>
                        </button>
                    )
                })}
            </div>
         </main>
      ) : isClientesHubOpen ? (
        <ClientsHub
          clients={clients}
          onSaveClient={handleSaveClient}
          onDeleteClient={handleDeleteClient}
          onBack={handleBack}
          onNavigateToArquivos={() => { setIsClientesHubOpen(false); setIsArquivosHubOpen(true); }}
        />
     ) : isArquivosHubOpen ? (
        <HubArquivos
          hdds={hdds}
          recordings={recordings}
          studioProfile={studioProfile}
          onSaveHDD={handleSaveHDD}
          onDeleteHDD={handleDeleteHDD}
          onSaveRecording={handleSaveRecording}
          onDeleteRecording={handleDeleteRecording}
          onBack={handleBack}
        />
     ) : isLightingHubOpen ? (
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button onClick={handleBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Dashboard</span>
            </button>
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Assistente de Iluminação</h1>
                <p className="text-zinc-600 dark:text-zinc-400">Escolha como você quer trabalhar a luz do seu vídeo hoje.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => { setIsLightingHubOpen(false); setActiveAgentId(AgentId.LIGHTING_GENERATOR); }} className="flex flex-col p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-yellow-500 dark:hover:border-yellow-500 transition-all duration-300 text-left group shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]">
                    <div className="p-4 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 w-fit mb-6"><Zap className="w-10 h-10" /></div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Gerador de Iluminação</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">Envie uma foto do seu cenário e equipamentos. A IA analisará o ambiente e criará um diagrama de luz personalizado.</p>
                    <span className="mt-auto text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2">Criar Setup <ChevronRight className="w-4 h-4" /></span>
                </button>
                <button onClick={() => { setIsLightingHubOpen(false); setActiveAgentId(AgentId.LIGHTING_STYLES); }} className="relative flex flex-col p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300 text-left group shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10"><div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 whitespace-nowrap border border-zinc-700 dark:border-zinc-300"><Sparkles className="w-3 h-3 text-orange-400" /><span>6 Estilos Clássicos</span></div><div className="w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1 border-r border-b border-zinc-700 dark:border-zinc-300"></div></div>
                    <div className="p-4 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 w-fit mb-6"><BookOpen className="w-10 h-10" /></div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Iluminações Famosas</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">Explore uma galeria interativa com estilos cinematográficos clássicos. Aprenda a recriar looks icônicos.</p>
                    <span className="mt-auto text-orange-600 dark:text-orange-400 font-medium flex items-center gap-2">Explorar Estilos <ChevronRight className="w-4 h-4" /></span>
                </button>
            </div>
          </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
          <div className="flex flex-wrap items-center justify-end mb-6 gap-3">
             <button
                onClick={() => setIsStudioModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wide hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all"
             >
                <Clapperboard className="w-4 h-4" />
                <span className="hidden sm:inline">Meu Estúdio</span>
             </button>
             <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
             >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartilhar</span>
             </button>
             <button 
                onClick={() => setIsReferralModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wide hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all"
             >
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Indique e Ganhe</span>
             </button>
             <button onClick={toggleTheme} className="p-2 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button
                onClick={() => { localStorage.removeItem('cf_token'); localStorage.removeItem('cf_email'); localStorage.removeItem('cf_name'); localStorage.removeItem('cf_plan'); router.push('/login'); }}
                className="p-2 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Sair"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] p-6 md:p-10 mb-10">
            <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.15fr,0.85fr] items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest mb-5 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" />
                  Suite Profissional 2026
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4 font-display">
                  CreatorFlow AI
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl">
                  Seu painel criativo para planejar, produzir e publicar com agilidade. Escolha um fluxo e comece em segundos.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <button 
                    onClick={() => handleAgentClick(AgentId.SCRIPT_GENERATOR)} 
                    className="px-5 py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm shadow-lg shadow-zinc-900/20 hover:opacity-90 transition-all"
                  >
                    Gerar roteiro agora
                  </button>
                  <button 
                    onClick={() => handleAgentClick(AgentId.EXECUTIVE_PRODUCER)} 
                    className="px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    Abrir central de produção
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Atalhos do dia</span>
                    <LayoutGrid className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div className="space-y-2">
                    {quickActionIds.map((id) => {
                      const agent = AGENTS[id];
                      const Icon = agent.icon;
                      return (
                        <button 
                          key={agent.id} 
                          onClick={() => handleAgentClick(agent.id)} 
                          className="group flex items-center gap-3 w-full p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900 text-left hover:border-emerald-400/60 hover:shadow-md transition-all"
                        >
                          <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${agent.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{agent.title}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{agent.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white font-display">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══ Alertas de Produção ══
               Aparece apenas quando há gravações com takes pendentes.
               Localização: entre o hero e o grid de hubs.           */}
          {pendingRecordings.length > 0 && (
            <section className="mb-8 animate-in fade-in slide-in-from-top-3 duration-500">
              {/* Cabeçalho da seção */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Alertas de Produção
                  </h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-black bg-amber-500 text-white rounded-full">
                    {pendingRecordings.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsArquivosHubOpen(true)}
                  className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Ver Acervo <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards — scroll horizontal quando há múltiplas pendências */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-mandatory">
                {pendingRecordings.map(rec => (
                  <div
                    key={rec.id}
                    className="snap-start flex-shrink-0 w-72 sm:w-80 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-4 shadow-sm shadow-amber-100 dark:shadow-amber-950/20"
                  >
                    {/* Header do card */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-amber-100 dark:bg-amber-900/40 rounded-xl flex-shrink-0 text-lg">
                        ⚠️
                      </div>
                      <div className="min-w-0 flex-1">
                        {rec.clientName ? (
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5 truncate">
                            {rec.clientName}
                          </p>
                        ) : (
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600/60 dark:text-amber-600 mb-0.5">
                            Sem cliente vinculado
                          </p>
                        )}
                        <p className="font-bold text-sm text-zinc-900 dark:text-white leading-tight truncate">
                          {rec.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          📅 {fmtAlertDate(rec.recordedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-amber-200 dark:border-amber-800/40 mb-3" />

                    {/* O que faltou */}
                    {rec.pendingTakesDescription ? (
                      <p className="text-xs italic text-amber-900 dark:text-amber-200 leading-relaxed line-clamp-3">
                        &ldquo;{rec.pendingTakesDescription}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700/60 dark:text-amber-500 italic">
                        Nenhum detalhe registrado.
                      </p>
                    )}

                    {/* Ações do card */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleResolveAlert(rec.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Marcar como Gravado
                      </button>
                      <button
                        onClick={() => setIsArquivosHubOpen(true)}
                        className="p-2 rounded-xl border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        title="Ver no Acervo"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Usage Panel */}
          {usageData && (
            <div className="mb-8">
              <button
                onClick={() => setShowUsage(!showUsage)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mb-3"
              >
                <BarChart3 className="w-4 h-4" />
                Uso do Plano ({usageData.plan === 'solo' ? 'Start' : usageData.plan === 'maker' ? 'Maker' : usageData.plan === 'studio' ? 'Studio' : 'Agency'})
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUsage ? 'rotate-180' : ''}`} />
              </button>
              {showUsage && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(usageData.features).map(([key, data]) => {
                    const labels: Record<string, string> = { script_generator: 'Roteiros', proposals: 'Propostas', image_analysis: 'Imagens', storyboard: 'Storyboards' };
                    const pct = data.percentage;
                    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                    const textColor = pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-emerald-500';
                    return (
                      <div key={key} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{labels[key] || key}</span>
                          <span className={`text-[10px] font-bold ${textColor}`}>{pct}%</span>
                        </div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-white font-display mb-2">
                          {data.used.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">/ {data.limit.toLocaleString('pt-BR')}</span>
                        </p>
                        <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-10">
            <div className="relative flex-1">
              <input
                value={agentQuery}
                onChange={(e) => setAgentQuery(e.target.value)}
                placeholder="Buscar agentes, tarefas ou ferramentas..."
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 px-4 py-3 pr-12 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
              {agentQuery && (
                <button 
                  onClick={() => setAgentQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Feedback rápido
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Fluxos principais</h2>
            {agentQuery && (
              <span className="text-xs text-zinc-400">
                {visibleMainAgentIds.length + visibleExtraAgentIds.length} resultados
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {visibleMainAgentIds.length === 0 ? (
              <div className="col-span-full rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center bg-white/60 dark:bg-zinc-900/60">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Nenhum agente encontrado para esta busca.</p>
                <button onClick={() => setAgentQuery('')} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest">
                  Limpar busca
                </button>
              </div>
            ) : (
              visibleMainAgentIds.map((id) => {
                const agent = AGENTS[id];
                const Icon = agent.icon;
                return (
                  <button key={agent.id} onClick={() => handleAgentClick(agent.id)} className="group relative flex flex-col items-start p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-300 text-left shadow-sm hover:shadow-2xl hover:scale-[1.02]">
                    <div className={`p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 mb-4 group-hover:scale-110 transition-transform duration-300 ${agent.color}`}><Icon className="w-8 h-8" /></div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{agent.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">{agent.description}</p>
                    <div className="mt-auto w-full flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50"><span className="text-xs font-medium text-zinc-500 uppercase tracking-wider group-hover:text-zinc-800 dark:group-hover:text-zinc-300">Iniciar</span><ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-emerald-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" /></div>
                  </button>
                );
              })
            )}
          </div>

          {/* Hub de Clientes card + Hub de Arquivos card — CRM gated for Start plan */}
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Gestão & CRM</h2>
            {userPlan === 'solo' ? (
              <div className="flex flex-col sm:flex-row gap-3 md:max-w-2xl">
                <div className="relative flex items-center gap-5 flex-1 p-5 bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/40 rounded-2xl opacity-60 cursor-not-allowed">
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 dark:bg-zinc-100/90 px-4 py-2 shadow-lg">
                      <Lock className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                      <span className="text-xs font-bold text-white dark:text-zinc-900">Plano Maker ou superior</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-0.5">Hub de Clientes</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Briefings, tom de voz e alvo de cada cliente.</p>
                  </div>
                </div>
                <div className="relative flex items-center gap-5 flex-1 p-5 bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/40 rounded-2xl opacity-60 cursor-not-allowed">
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 dark:bg-zinc-100/90 px-4 py-2 shadow-lg">
                      <Lock className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                      <span className="text-xs font-bold text-white dark:text-zinc-900">Plano Maker ou superior</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/50 text-violet-600 dark:text-violet-400 flex-shrink-0">
                    <Archive className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-0.5">Hub de Arquivos</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerencie HDs e registre ingests com o Quiz de Backup.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 md:max-w-2xl">
                <button
                  onClick={() => setIsClientesHubOpen(true)}
                  className="group relative flex items-center gap-5 flex-1 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-300 text-left shadow-sm hover:shadow-xl hover:scale-[1.01]"
                >
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      Hub de Clientes
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Briefings, tom de voz e alvo de cada cliente.
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>

                <button
                  onClick={() => setIsArquivosHubOpen(true)}
                  className="group relative flex items-center gap-5 flex-1 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-300 text-left shadow-sm hover:shadow-xl hover:scale-[1.01]"
                >
                  <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/50 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Archive className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                      Hub de Arquivos
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Gerencie HDs e registre ingests com o Quiz de Backup.
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span>{hdds.length} HD{hdds.length !== 1 ? 's' : ''}</span>
                      <span>&middot;</span>
                      <span>{recordings.length} ingest{recordings.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              </div>
            )}
          </div>

          <div className="mb-16">
             <h2 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs mb-4 pl-1">Ferramentas Extras</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {visibleExtraAgentIds.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhuma ferramenta extra encontrada. Ajuste sua busca acima.
                  </div>
                ) : (
                  visibleExtraAgentIds.map(id => {
                     const agent = AGENTS[id];
                     const Icon = agent.icon;
                     return (
                      <button key={agent.id} onClick={() => handleAgentClick(agent.id)} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-emerald-400/70 dark:hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 text-left group hover:scale-[1.01]">
                          <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group-hover:scale-105 transition-transform ${agent.color}`}><Icon className="w-5 h-5" /></div>
                          <div className="flex-1 min-w-0">
                             <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-emerald-500 dark:group-hover:text-emerald-400 truncate">{agent.title}</h3>
                             <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">{agent.description}</p>
                          </div>
                      </button>
                     );
                  })
                )}
             </div>
          </div>
          
          <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-900 pt-10 pb-6 text-center">
              <p className="text-zinc-400 dark:text-zinc-600 text-xs uppercase tracking-widest font-bold mb-4">CreatorFlow AI v1.1 - Feito para Criadores</p>
              <button 
                onClick={() => setIsSupportModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all"
              >
                  🐞 Reportar Bug ou Sugerir Melhoria
              </button>
          </footer>
        </main>
      )}
    </div>
    </AuthGuard>
  );
}

