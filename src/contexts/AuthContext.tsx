// src/contexts/AuthContext.tsx

/**
 * AuthContext — provider cho auth + license state.
 * 
 * Wrap toàn bộ app. Cung cấp user, session, license qua useAuth() hook.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  AuthUser,
  AuthContextValue,
  AuthStatus,
  LicenseState,
  AuthResult,
  LicenseClaimResult,
  Profile,
} from '../types/auth';
import * as authService from '../services/authService';
import * as licenseService from '../services/licenseService';

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════
// HELPER: Build AuthUser from Supabase User + Profile
// ═══════════════════════════════════════════════════════════════

async function buildAuthUser(user: User): Promise<AuthUser> {
  // Fetch profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  
  if (error) {
    console.warn('[Auth] Failed to fetch profile:', error);
  }
  
  return {
    id: user.id,
    email: user.email ?? '',
    emailVerified: !!user.email_confirmed_at,
    profile: (profile as Profile) ?? null,
    raw: user,
  };
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  const [licenseState, setLicenseState] = useState<LicenseState>({
    isPro: false,
    license: null,
    isLoading: false,
    error: null,
    lastValidatedAt: null,
  });
  
  // Track current user ID để tránh race condition
  const currentUserIdRef = useRef<string | null>(null);
  
  // ═══════════════════════════════════════════════════════════
  // LICENSE FETCH
  // ═══════════════════════════════════════════════════════════
  
  const loadLicense = useCallback(async (userId: string, options: { skipCache?: boolean } = {}) => {
    setLicenseState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const { license, error } = await licenseService.fetchMyLicense(userId, options);
    
    // Check user still logged in
    if (currentUserIdRef.current !== userId) return;
    
    if (error) {
      setLicenseState({
        isPro: false,
        license: null,
        isLoading: false,
        error,
        lastValidatedAt: null,
      });
      return;
    }
    
    const isPro = licenseService.isLicenseValid(license);
    
    setLicenseState({
      isPro,
      license,
      isLoading: false,
      error: null,
      lastValidatedAt: Date.now(),
    });
  }, []);
  
  // ═══════════════════════════════════════════════════════════
  // SESSION HANDLER
  // ═══════════════════════════════════════════════════════════
  
  const handleSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);
    
    if (!newSession?.user) {
      // Logged out
      currentUserIdRef.current = null;
      setUser(null);
      setStatus('unauthenticated');
      setLicenseState({
        isPro: false,
        license: null,
        isLoading: false,
        error: null,
        lastValidatedAt: null,
      });
      licenseService.clearLicenseCache();
      return;
    }
    
    // Logged in
    const userId = newSession.user.id;
    currentUserIdRef.current = userId;
    
    // Build AuthUser
    const authUser = await buildAuthUser(newSession.user);
    if (currentUserIdRef.current !== userId) return;  // stale
    
    setUser(authUser);
    setStatus('authenticated');
    
    // Load license in background
    loadLicense(userId);
  }, [loadLicense]);
  
  // ═══════════════════════════════════════════════════════════
  // INITIAL SESSION CHECK
  // ═══════════════════════════════════════════════════════════
  
  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      handleSession(session);
    });
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log('[Auth] State change:', event);
        
        // Handle specific events
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'INITIAL_SESSION':
            await handleSession(newSession);
            break;
          case 'SIGNED_OUT':
            await handleSession(null);
            break;
          case 'USER_UPDATED':
            if (newSession?.user) {
              const authUser = await buildAuthUser(newSession.user);
              if (mounted) setUser(authUser);
            }
            break;
          case 'PASSWORD_RECOVERY':
            // User clicked reset link — Supabase sẽ set session
            // Router sẽ redirect đến /reset-password
            break;
        }
      }
    );
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);
  
  // ═══════════════════════════════════════════════════════════
  // AUTH ACTIONS
  // ═══════════════════════════════════════════════════════════
  
  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> => {
    return authService.signUp(email, password, displayName);
  }, []);
  
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    return authService.signIn(email, password);
  }, []);
  
  const signOut = useCallback(async () => {
    await authService.signOut();
    // onAuthStateChange sẽ handle cleanup
  }, []);
  
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    return authService.resetPassword(email);
  }, []);
  
  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    return authService.updatePassword(newPassword);
  }, []);
  
  // ═══════════════════════════════════════════════════════════
  // LICENSE ACTIONS
  // ═══════════════════════════════════════════════════════════
  
  const claimLicense = useCallback(async (licenseKey: string): Promise<LicenseClaimResult> => {
    if (!currentUserIdRef.current) {
      return {
        success: false,
        error: 'Bạn cần đăng nhập để kích hoạt license',
        errorCode: 'NOT_AUTHENTICATED',
      };
    }
    
    const result = await licenseService.claimLicense(licenseKey);
    
    if (result.success && result.license) {
      // Refresh license state
      await loadLicense(currentUserIdRef.current, { skipCache: true });
    }
    
    return result;
  }, [loadLicense]);
  
  const refreshLicense = useCallback(async () => {
    if (!currentUserIdRef.current) return;
    await loadLicense(currentUserIdRef.current, { skipCache: true });
  }, [loadLicense]);
  
  // ═══════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════
  
  const value: AuthContextValue = {
    status,
    user,
    session,
    license: licenseState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    claimLicense,
    refreshLicense,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}