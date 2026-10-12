// src/components/auth/LoginForm.tsx

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
  onForgotPassword,
}) => {
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const result = await signIn(email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error ?? 'Đăng nhập thất bại');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="you@example.com"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 disabled:opacity-50 transition-colors"
          />
        </div>
      </div>
      
      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase">
            Mật khẩu
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            Quên mật khẩu?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="••••••••"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 disabled:opacity-50 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/60 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 leading-relaxed">{error}</p>
        </div>
      )}
      
      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !email || !password}
        className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          <>
            Đăng nhập
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      
      {/* Switch to signup */}
      {onSwitchToSignup && (
        <p className="text-center text-xs text-slate-400 pt-2">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </p>
      )}
    </form>
  );
};