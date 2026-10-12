// src/lib/supabase.ts

/**
 * Supabase client singleton.
 * 
 * Đảm bảo chỉ có 1 instance duy nhất trong app.
 * Vite expose env qua import.meta.env.VITE_*
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// ENV VALIDATION
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Kiểm tra file .env.local và restart dev server.'
  );
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Kiểm tra file .env.local và restart dev server.'
  );
}

// ═══════════════════════════════════════════════════════════════
// CLIENT INSTANCE
// ═══════════════════════════════════════════════════════════════

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Persist session trong localStorage
      persistSession: true,
      
      // Auto refresh token khi sắp hết hạn
      autoRefreshToken: true,
      
      // Detect session từ URL hash (dùng cho reset password, magic link)
      detectSessionInUrl: true,
      
      // Storage key (mặc định: sb-<project-ref>-auth-token)
      // Giữ default để không conflict
      flowType: 'pkce',  // recommended cho SPA
    },
    
    global: {
      headers: {
        'x-application-name': 'tiles-match-tool',
      },
    },
  }
);

// ═══════════════════════════════════════════════════════════════
// DEV LOGGING
// ═══════════════════════════════════════════════════════════════

if (import.meta.env.DEV) {
  console.log('[Supabase] Client initialized');
  console.log('[Supabase] URL:', SUPABASE_URL);
  console.log('[Supabase] Anon key present:', !!SUPABASE_ANON_KEY);
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check nếu Supabase đã configured đúng.
 */
export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

/**
 * Get current base URL (dùng cho email redirects).
 */
export function getBaseUrl(): string {
  return window.location.origin;
}