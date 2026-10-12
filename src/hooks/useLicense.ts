// src/hooks/useLicense.ts

/**
 * useLicense hook — convenience wrapper cho license state.
 */

import { useAuth } from '../contexts/AuthContext';
import { License } from '../types/auth';

export interface UseLicenseResult {
  isPro: boolean;
  license: License | null;
  isLoading: boolean;
  error: string | null;
  
  /** Yêu cầu Pro — dùng cho feature gating */
  requirePro: (featureName: string, description: string) => void;
}

/**
 * Hook dùng trong components cần check license.
 * 
 * @example
 * const { isPro, requirePro } = useLicense();
 * 
 * if (!isPro) {
 *   requirePro('Advanced Analytics', 'Cần Pro để dùng feature này');
 *   return;
 * }
 */
export function useLicense(): UseLicenseResult {
  const { license } = useAuth();
  
  const requirePro = (featureName: string, description: string) => {
    // Dispatch custom event — App.tsx sẽ lắng nghe và show ProLockModal
    window.dispatchEvent(new CustomEvent('require-pro', {
      detail: { featureName, description },
    }));
  };
  
  return {
    isPro: license.isPro,
    license: license.license,
    isLoading: license.isLoading,
    error: license.error,
    requirePro,
  };
}