'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleButton from '@/components/auth/GoogleButton';
import PasswordStrength from '@/components/auth/PasswordStrength';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nome obrigat\u00f3rio';
    if (!email) errs.email = 'Email obrigat\u00f3rio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email inv\u00e1lido';
    if (!password) errs.password = 'Senha obrigat\u00f3ria';
    else if (password.length < 8) errs.password = 'M\u00ednimo 8 caracteres';
    if (confirmPassword !== password) errs.confirmPassword = 'Senhas n\u00e3o coincidem';
    if (!accepted) errs.accepted = 'Aceite os termos para continuar';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    localStorage.setItem('cf_logged_in', 'true');
    localStorage.setItem('cf_email', email);
    localStorage.setItem('cf_name', name);
    router.push('/dashboard');
  };

  const handleGoogle = () => {
    localStorage.setItem('cf_logged_in', 'true');
    localStorage.setItem('cf_email', 'user@gmail.com');
    localStorage.setItem('cf_name', 'Creator');
    router.push('/dashboard');
  };

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const isValid =
    name.trim() && email && password.length >= 8 && confirmPassword === password && accepted;

  return (
    <AuthLayout title="Crie sua conta" subtitle="Comece a criar conte\u00fado profissional com IA">
      <GoogleButton label="Cadastrar com Google" onClick={handleGoogle} />

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs font-medium text-[#666666] uppercase tracking-wider">ou</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#A0A0A0]">Nome completo</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-white/[0.1] bg-[#1A1A1A] py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#555] outline-none transition-all focus:border-[#8B5CF6]/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </div>
          {errors.name && <p className="mt-1 text-[13px] text-red-400">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#A0A0A0]">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-white/[0.1] bg-[#1A1A1A] py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#555] outline-none transition-all focus:border-[#8B5CF6]/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </div>
          {errors.email && <p className="mt-1 text-[13px] text-red-400">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#A0A0A0]">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
              placeholder="M\u00ednimo 8 caracteres"
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
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#A0A0A0]">Confirmar senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
              placeholder="Repita a senha"
              className={`w-full rounded-xl border bg-[#1A1A1A] py-3 pl-11 pr-12 text-sm text-white placeholder:text-[#555] outline-none transition-all focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] ${
                passwordsMatch ? 'border-green-500/50 focus:border-green-500/60' : passwordsMismatch ? 'border-red-500/50 focus:border-red-500/60' : 'border-white/[0.1] focus:border-[#8B5CF6]/60'
              }`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {passwordsMatch && <Check className="h-4 w-4 text-green-400" />}
              {passwordsMismatch && <X className="h-4 w-4 text-red-400" />}
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-[#666666] hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-[13px] text-red-400">{errors.confirmPassword}</p>}
        </div>

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => { setAccepted(e.target.checked); setErrors((p) => ({ ...p, accepted: '' })); }}
              className="peer sr-only"
            />
            <div className="h-5 w-5 rounded-md border border-white/20 bg-[#1A1A1A] transition-all peer-checked:border-[#8B5CF6] peer-checked:bg-gradient-to-br peer-checked:from-[#7C3AED] peer-checked:to-[#C026D3] group-hover:border-white/30">
              {accepted && <Check className="h-5 w-5 p-0.5 text-white" />}
            </div>
          </div>
          <span className="text-[13px] leading-relaxed text-[#A0A0A0]">
            Li e aceito os{' '}
            <a href="#" className="text-[#8B5CF6] hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="#" className="text-[#8B5CF6] hover:underline">Pol&iacute;tica de Privacidade</a>
          </span>
        </label>
        {errors.accepted && <p className="text-[13px] text-red-400 -mt-2">{errors.accepted}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#C026D3] py-3 text-[15px] font-bold uppercase tracking-wider text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(139,92,246,0.3)] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Criando conta...
            </>
          ) : (
            'Criar Conta'
          )}
        </button>
      </form>

      {/* Bottom link */}
      <p className="mt-8 text-center text-sm text-[#A0A0A0]">
        J&aacute; tem uma conta?{' '}
        <Link href="/login" className="font-semibold text-[#8B5CF6] hover:underline">
          Fazer login
        </Link>
      </p>
    </AuthLayout>
  );
}
