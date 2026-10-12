// src/services/authService.ts

/**
 * Auth service — wrap Supabase Auth API calls.
 * 
 * Cung cấp error messages thân thiện tiếng Việt.
 */

import { supabase, getBaseUrl } from '../lib/supabase';
import { AuthResult } from '../types/auth';

// ═══════════════════════════════════════════════════════════════
// ERROR MESSAGE MAPPING
// ═══════════════════════════════════════════════════════════════

function translateAuthError(error: any): { message: string; code: string } {
  const code = error?.code ?? error?.error_code ?? 'UNKNOWN';
  const raw = String(error?.message ?? '').toLowerCase();
  
  // Map Supabase error codes → Vietnamese
  const messages: Record<string, string> = {
    'invalid_credentials': 'Email hoặc mật khẩu không đúng',
    'email_not_confirmed': 'Email chưa được xác nhận. Kiểm tra hộp thư của bạn.',
    'user_already_exists': 'Email này đã được đăng ký',
    'email_exists': 'Email này đã được đăng ký',
    'weak_password': 'Mật khẩu quá yếu. Cần ít nhất 8 ký tự.',
    'over_email_send_rate_limit': 'Quá nhiều yêu cầu. Vui lòng đợi vài phút.',
    'over_request_rate_limit': 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    'signup_disabled': 'Đăng ký đã bị tắt',
    'user_not_found': 'Không tìm thấy tài khoản',
    'same_password': 'Mật khẩu mới phải khác mật khẩu cũ',
    'validation_failed': 'Dữ liệu không hợp lệ',
  };
  
  if (messages[code]) {
    return { message: messages[code], code };
  }
  
  // Fallback: dùng raw message nếu không match
  if (raw.includes('invalid login credentials')) {
    return { message: 'Email hoặc mật khẩu không đúng', code: 'invalid_credentials' };
  }
  if (raw.includes('email not confirmed')) {
    return { message: 'Email chưa được xác nhận', code: 'email_not_confirmed' };
  }
  if (raw.includes('already registered')) {
    return { message: 'Email này đã được đăng ký', code: 'user_already_exists' };
  }
  if (raw.includes('password')) {
    return { message: 'Mật khẩu không hợp lệ', code: 'weak_password' };
  }
  
  return {
    message: error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
    code,
  };
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return 'Vui lòng nhập email';
  const trimmed = email.trim();
  // Simple regex — không cần RFC 5322 đầy đủ
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Email không hợp lệ';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Vui lòng nhập mật khẩu';
  if (password.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự';
  return null;
}

// ═══════════════════════════════════════════════════════════════
// AUTH ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Đăng ký user mới với email + password.
 * 
 * Supabase sẽ gửi email confirmation.
 * User phải click link trong email để confirm.
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  // Validate
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr, errorCode: 'INVALID_EMAIL' };
  
  const pwErr = validatePassword(password);
  if (pwErr) return { success: false, error: pwErr, errorCode: 'INVALID_PASSWORD' };
  
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        display_name: displayName?.trim() || email.split('@')[0],
      },
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  });
  
  if (error) {
    const { message, code } = translateAuthError(error);
    return { success: false, error: message, errorCode: code };
  }
  
  // Nếu user đã tồn tại nhưng chưa confirm, Supabase trả về user nhưng không có session
  // Nếu confirm email = ON, data.session sẽ null
  const needsConfirmation = !data.session;
  
  return {
    success: true,
    needsEmailConfirmation: needsConfirmation,
  };
}

/**
 * Đăng nhập với email + password.
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr, errorCode: 'INVALID_EMAIL' };
  
  if (!password) {
    return { success: false, error: 'Vui lòng nhập mật khẩu', errorCode: 'INVALID_PASSWORD' };
  }
  
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  
  if (error) {
    const { message, code } = translateAuthError(error);
    return { success: false, error: message, errorCode: code };
  }
  
  return { success: true };
}

/**
 * Đăng xuất.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Gửi email reset password.
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr, errorCode: 'INVALID_EMAIL' };
  
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    {
      redirectTo: `${getBaseUrl()}/reset-password`,
    }
  );
  
  if (error) {
    const { message, code } = translateAuthError(error);
    return { success: false, error: message, errorCode: code };
  }
  
  return { success: true };
}

/**
 * Update password (sau khi user click link reset, họ có session tạm).
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const pwErr = validatePassword(newPassword);
  if (pwErr) return { success: false, error: pwErr, errorCode: 'INVALID_PASSWORD' };
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    const { message, code } = translateAuthError(error);
    return { success: false, error: message, errorCode: code };
  }
  
  return { success: true };
}

/**
 * Lấy session hiện tại.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Auth] getSession error:', error);
    return null;
  }
  return data.session;
}

/**
 * Resend email confirmation.
 */
export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  });
  
  if (error) {
    const { message, code } = translateAuthError(error);
    return { success: false, error: message, errorCode: code };
  }
  
  return { success: true };
}