// src/components/auth/SignupForm.tsx

import React, { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, ArrowRight,
  CheckCircle2, MailCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { signUp } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (password.length < 8) {
      setError('Mật khẩu cần ít nhất 8 ký tự');
      return;
    }
    
    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }
    
    setIsLoading(true);
    
    const result = await signUp(email, password, displayName);
    
    setIsLoading(false);
    
    if (result.success) {
      if (result.needsEmailConfirmation) {
        setNeedsConfirmation(true);
      } else {
        onSuccess?.();
      }
    } else {
      setError(result.error ?? 'Đăng ký thất bại');
    }
  };
  
  // ═══════════════════════════════════════════════════════════
  // EMAIL CONFIRMATION SCREEN
  // ═══════════════════════════════════════════════════════════
  
  if (needsConfirmation) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <MailCheck className="w-8 h-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-black text-white mb-2">
            Kiểm tra hộp thư của bạn!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Chúng tôi đã gửi một link xác nhận đến{' '}
            <strong className="text-amber-300">{email}</strong>.
            <br />
            Click vào link trong email để hoàn tất đăng ký.
          </p>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-3 text-left">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            💡 Không thấy email? Kiểm tra thư mục <strong className="text-slate-300">Spam</strong> hoặc{' '}
            <strong className="text-slate-300">Promotions</strong>. Email có thể mất vài phút để đến.
          </p>
        </div>
        
        {onSwitchToLogin && (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            ← Quay lại đăng nhập
          </button>
        )}
      </div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════
  // SIGNUP FORM
  // ═══════════════════════════════════════════════════════════
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display name */}
      <div>
        <label htmlFor="displayName" className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
          Tên hiển thị <span className="text-slate-500 font-normal">(tùy chọn)</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            placeholder="Nguyễn Văn A"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 disabled:opacity-50 transition-colors"
          />
        </div>
      </div>
      
      {/* Email */}
      <div>
        <label htmlFor="signup-email" className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
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
        <label htmlFor="signup-password" className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
          Mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Ít nhất 8 ký tự"
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
        
        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {[1, 2, 3].map(level => {
              const strength = 
                password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3 :
                password.length >= 8 ? 2 :
                password.length >= 6 ? 1 : 0;
              
              return (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= strength
                      ? strength === 3 ? 'bg-emerald-500'
                      : strength === 2 ? 'bg-amber-500'
                      : 'bg-red-500'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
            <span className="text-[10px] text-slate-500 font-mono">
              {password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Mạnh' :
               password.length >= 8 ? 'Trung bình' : 'Yếu'}
            </span>
          </div>
        )}
      </div>
      
      {/* Confirm password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Nhập lại mật khẩu"
            className={`w-full bg-slate-900 border rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 transition-colors disabled:opacity-50 ${
              confirmPassword && confirmPassword !== password
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : confirmPassword && confirmPassword === password
                ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-400/30'
                : 'border-slate-700 focus:border-amber-400 focus:ring-amber-400/30'
            }`}
          />
          {confirmPassword && confirmPassword === password && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          )}
        </div>
      </div>
      
      {/* Terms */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          disabled={isLoading}
          className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900 cursor-pointer"
        />
        <span className="text-[11px] text-slate-400 leading-relaxed">
          Tôi đồng ý với{' '}
          <a href="/terms" target="_blank" className="text-amber-400 hover:text-amber-300 font-semibold">
            Điều khoản sử dụng
          </a>{' '}
          và{' '}
          <a href="/privacy" target="_blank" className="text-amber-400 hover:text-amber-300 font-semibold">
            Chính sách bảo mật
          </a>
        </span>
      </label>
      
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
        disabled={isLoading || !email || !password || !confirmPassword || !agreeTerms}
        className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tạo tài khoản...
          </>
        ) : (
          <>
            Tạo tài khoản
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      
      {/* Switch to login */}
      {onSwitchToLogin && (
        <p className="text-center text-xs text-slate-400 pt-2">
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            Đăng nhập
          </button>
        </p>
      )}
    </form>
  );
};