'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleButton from '@/components/auth/GoogleButton';

const LOGIN_ATTEMPTS_KEY = 'cf_login_attempts';
const LOGIN_COOLDOWN_KEY = 'cf_login_cooldown';
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30 * 1000; // 30 seconds

function getAttempts(): { count: number; timestamp: number } {
  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { count: 0, timestamp: Date.now() };
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 60000) return { count: 0, timestamp: Date.now() };
    return data;
  } catch { return { count: 0, timestamp: Date.now() }; /* ignore */ }
}

function recordAttempt(): boolean {
  const attempts = getAttempts();
  attempts.count++;
  attempts.timestamp = Date.now();
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  if (attempts.count >= MAX_ATTEMPTS) {
    localStorage.setItem(LOGIN_COOLDOWN_KEY, String(Date.now()));
    return false;
  }
  return true;
}

function isInCooldown(): number {
  const cooldownStart = localStorage.getItem(LOGIN_COOLDOWN_KEY);
  if (!cooldownStart) return 0;
  const elapsed = Date.now() - parseInt(cooldownStart);
  if (elapsed >= COOLDOWN_MS) {
    localStorage.removeItem(LOGIN_COOLDOWN_KEY);
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    return 0;
  }
  return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
}

// Simple hash for localStorage (NOT cryptographic — real hashing comes with Supabase)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email inválido';
    if (!password) errs.password = 'Senha obrigatória';
    else if (password.length < 8) errs.password = 'Mínimo 8 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const remaining = isInCooldown();
    if (remaining > 0) {
      setCooldown(remaining);
      setErrors({ general: `Muitas tentativas. Aguarde ${remaining}s.` });
      return;
    }

    setLoading(true);

    const allowed = recordAttempt();
    if (!allowed) {
      setCooldown(30);
      setErrors({ general: 'Muitas tentativas. Aguarde 30 segundos.' });
      setLoading(false);
      const interval = setInterval(() => {
        const rem = isInCooldown();
        setCooldown(rem);
        if (rem <= 0) clearInterval(interval);
      }, 1000);
      return;
    }

    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem('cf_logged_in', 'true');
    localStorage.setItem('cf_email', email);
    localStorage.setItem('cf_pass_hash', simpleHash(password));
    localStorage.setItem('cf_session_start', String(Date.now()));
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOGIN_COOLDOWN_KEY);
    router.push('/dashboard');
  };

  const handleGoogle = () => {
    localStorage.setItem('cf_logged_in', 'true');
    localStorage.setItem('cf_email', 'user@gmail.com');
    localStorage.setItem('cf_name', 'Creator');
    localStorage.setItem('cf_session_start', String(Date.now()));
    router.push('/dashboard');
  };

  const isValid = email && password && password.length >= 8;

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre na sua conta para continuar criando">
      <GoogleButton label="Continuar com Google" onClick={handleGoogle} />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs font-medium text-[#666666] uppercase tracking-wider">ou</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {errors.general && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-[13px] text-red-400">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#A0A0A0]">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-white/[0.1] bg-[#1A1A1A] py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#555] outline-none transition-all focus:border-[#8B5CF6]/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </div>
          {errors.email && <p className="mt-1 text-[13px] text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#A0A0A0]">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/[0.1] bg-[#1A1A1A] py-3 pl-11 pr-12 text-sm text-white placeholder:text-[#555] outline-none transition-all focus:border-[#8B5CF6]/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-[13px] text-red-400">{errors.password}</p>}
        </div>

        <div className="text-right">
          <a href="#" className="text-[13px] font-medium text-[#8B5CF6] hover:underline">
            Esqueceu a senha?
          </a>
        </div>

        <button
          type="submit"
          disabled={!isValid || loading || cooldown > 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#C026D3] py-3 text-[15px] font-bold uppercase tracking-wider text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(139,92,246,0.3)] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Entrando...
            </>
          ) : cooldown > 0 ? (
            `Aguarde ${cooldown}s`
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#A0A0A0]">
        Não tem uma conta?{' '}
        <Link href="/signup" className="font-semibold text-[#8B5CF6] hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
