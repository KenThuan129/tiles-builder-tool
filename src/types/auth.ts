// src/types/auth.ts

/**
 * Auth-related types.
 * Định nghĩa rõ shape của user, session, license...
 */

import { User, Session } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: Profile | null;
  raw: User;  // Supabase User object
}

// ═══════════════════════════════════════════════════════════════
// LICENSE
// ═══════════════════════════════════════════════════════════════

export type LicenseTier = 'pro';
export type LicensePlan = 'monthly' | 'lifetime' | 'studio';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'pending';
export type LicenseSource = 'kofi' | 'lemonsqueezy' | 'manual';

export interface License {
  id: string;
  license_key: string;
  tier: LicenseTier;
  plan: LicensePlan;
  status: LicenseStatus;
  source: LicenseSource;
  issued_at: string;
  expires_at: string | null;
  activated_at: string | null;
}

export interface LicenseState {
  /** Có license active hay không */
  isPro: boolean;
  
  /** License object nếu có */
  license: License | null;
  
  /** Đang loading? */
  isLoading: boolean;
  
  /** Error message nếu có */
  error: string | null;
  
  /** Last time validated */
  lastValidatedAt: number | null;
}

// ═══════════════════════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════════════════════

export type AuthStatus =
  | 'loading'        // đang check session ban đầu
  | 'authenticated'  // đã login
  | 'unauthenticated'; // chưa login

export interface AuthContextValue {
  // State
  status: AuthStatus;
  user: AuthUser | null;
  session: Session | null;
  
  // License state
  license: LicenseState;
  
  // Actions
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  
  // License actions
  claimLicense: (licenseKey: string) => Promise<LicenseClaimResult>;
  refreshLicense: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════

export interface AuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  /** Cho signup: cần confirm email không? */
  needsEmailConfirmation?: boolean;
}

export interface LicenseClaimResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  license?: License;
}