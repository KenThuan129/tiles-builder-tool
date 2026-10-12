// src/services/licenseService.ts

/**
 * License service — validate + claim license qua Supabase RPC.
 * 
 * Flow:
 * 1. User đăng nhập
 * 2. Fetch license của user (get_my_license RPC)
 * 3. Nếu chưa có → user paste key → claim_license RPC
 * 4. Cache license state trong memory + localStorage
 */

import { supabase } from '../lib/supabase';
import { License, LicenseClaimResult } from '../types/auth';

// ═══════════════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════════════

const CACHE_KEY = 'tiles_match_license_cache_v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;  // 24h

interface LicenseCache {
  license: License | null;
  cachedAt: number;
  userId: string;
}

function readCache(): LicenseCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LicenseCache;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(license: License | null, userId: string): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      license,
      cachedAt: Date.now(),
      userId,
    }));
  } catch (e) {
    console.warn('[License] Failed to write cache:', e);
  }
}

export function clearLicenseCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// ═══════════════════════════════════════════════════════════════
// FETCH LICENSE
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch license của user hiện tại.
 * 
 * Có cache: nếu cache còn valid và user ID khớp → return cache.
 * Nếu không → gọi server.
 */
export async function fetchMyLicense(
  userId: string,
  options: { skipCache?: boolean } = {}
): Promise<{ license: License | null; error: string | null }> {
  // Check cache
  if (!options.skipCache) {
    const cache = readCache();
    if (cache && cache.userId === userId) {
      return { license: cache.license, error: null };
    }
  }
  
  try {
    const { data, error } = await supabase.rpc('get_my_license');
    
    if (error) {
      console.error('[License] get_my_license error:', error);
      return { license: null, error: 'Không thể kiểm tra license. Vui lòng thử lại.' };
    }
    
    // data là JSONB result: { success: boolean, license: {...} | null, error?: string }
    if (!data || typeof data !== 'object') {
      return { license: null, error: 'Response không hợp lệ' };
    }
    
    if (!data.success) {
      return { license: null, error: data.error || 'Unknown error' };
    }
    
    const license = data.license as License | null;
    writeCache(license, userId);
    return { license, error: null };
  } catch (err: any) {
    console.error('[License] Fetch failed:', err);
    return { license: null, error: String(err?.message ?? err) };
  }
}

// ═══════════════════════════════════════════════════════════════
// CLAIM LICENSE
// ═══════════════════════════════════════════════════════════════

/**
 * Claim license key — link license với user hiện tại.
 * 
 * Được gọi khi user paste key trong app.
 */
export async function claimLicense(licenseKey: string): Promise<LicenseClaimResult> {
  const normalized = normalizeLicenseKey(licenseKey);
  
  if (!normalized) {
    return {
      success: false,
      error: 'License key không hợp lệ. Format: TBPRO-XXXX-XXXX-XXXX-XXXX',
      errorCode: 'INVALID_FORMAT',
    };
  }
  
  try {
    const { data, error } = await supabase.rpc('claim_license', {
      p_license_key: normalized,
    });
    
    if (error) {
      console.error('[License] claim_license error:', error);
      return {
        success: false,
        error: 'Không thể kích hoạt license. Vui lòng thử lại.',
        errorCode: 'SERVER_ERROR',
      };
    }
    
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Response không hợp lệ', errorCode: 'INVALID_RESPONSE' };
    }
    
    if (!data.success) {
      return {
        success: false,
        error: data.message || data.error || 'Không thể kích hoạt license',
        errorCode: data.error || 'UNKNOWN',
      };
    }
    
    // Clear cache để force refetch
    clearLicenseCache();
    
    return {
      success: true,
      license: data.license as License,
    };
  } catch (err: any) {
    return {
      success: false,
      error: String(err?.message ?? err),
      errorCode: 'UNEXPECTED_ERROR',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize license key:
 * - Uppercase
 * - Remove whitespace
 * - Auto-add dashes nếu user paste không có
 */
export function normalizeLicenseKey(raw: string): string | null {
  if (!raw) return null;
  
  // Remove all non-alphanumeric, uppercase
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  
  // Expect: TBPRO + 16 chars = 21 chars total
  if (cleaned.length !== 21) return null;
  if (!cleaned.startsWith('TBPRO')) return null;
  
  // Re-format with dashes: TBPRO-XXXX-XXXX-XXXX-XXXX
  const body = cleaned.slice(5);  // 16 chars
  const segments = [
    body.slice(0, 4),
    body.slice(4, 8),
    body.slice(8, 12),
    body.slice(12, 16),
  ];
  
  return `TBPRO-${segments.join('-')}`;
}

/**
 * Format license key để hiển thị (với masking cho sensitive).
 */
export function maskLicenseKey(key: string): string {
  if (key.length < 12) return key;
  return `${key.slice(0, 10)}••••${key.slice(-4)}`;
}

/**
 * Check if license is currently valid (active + not expired).
 */
export function isLicenseValid(license: License | null): boolean {
  if (!license) return false;
  if (license.status !== 'active') return false;
  if (license.expires_at && new Date(license.expires_at) < new Date()) return false;
  return true;
}

/**
 * Get human-readable plan label.
 */
export function getPlanLabel(plan: License['plan']): string {
  const labels: Record<License['plan'], string> = {
    monthly: 'Pro Monthly',
    lifetime: 'Pro Lifetime',
    studio: 'Studio',
  };
  return labels[plan] ?? plan;
}

/**
 * Get source label.
 */
export function getSourceLabel(source: License['source']): string {
  const labels: Record<License['source'], string> = {
    kofi: 'Ko-fi',
    lemonsqueezy: 'Lemon Squeezy',
    manual: 'Manual',
  };
  return labels[source] ?? source;
}