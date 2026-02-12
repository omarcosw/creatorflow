'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import GoogleButton from '@/components/auth/GoogleButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email obrigat\u00f3rio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email inv\u00e1lido';
    if (!password) errs.password = 'Senha obrigat\u00f3ria';
    else if (password.length < 8) errs.password = 'M\u00ednimo 8 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem('cf_logged_in', 'true');
    localStorage.setItem('cf_email', email);
    router.push('/dashboard');
  };

  const handleGoogle = () => {
    localStorage.setItem('cf_logged_in', 'true');
    localStorage.setItem('cf_email', 'user@gmail.com');
    localStorage.setItem('cf_name', 'Creator');
    router.push('/dashboard');
  };

  const isValid = email && password && password.length >= 8;

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre na sua conta para continuar criando">
      <GoogleButton label="Continuar com Google" onClick={handleGoogle} />

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs font-medium text-[#666666] uppercase tracking-wider">ou</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
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

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#A0A0A0]">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
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

        {/* Forgot password */}
        <div className="text-right">
          <a href="#" className="text-[13px] font-medium text-[#8B5CF6] hover:underline">
            Esqueceu a senha?
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#C026D3] py-3 text-[15px] font-bold uppercase tracking-wider text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(139,92,246,0.3)] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      {/* Bottom link */}
      <p className="mt-8 text-center text-sm text-[#A0A0A0]">
        N&atilde;o tem uma conta?{' '}
        <Link href="/signup" className="font-semibold text-[#8B5CF6] hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
