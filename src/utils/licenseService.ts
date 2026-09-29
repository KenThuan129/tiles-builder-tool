export type LicenseTier = 'free' | 'pro';

export interface LicenseData {
  tier: 'pro';
  key: string;
  ownerEmail: string;
  ownerName: string;
  planName: string;
  issuedAt: string;
  signature: string;
}

const STORAGE_KEY = 'tiles_match_tool_license_v1';
const SECRET_SALT = 'TILES_BUILDER_PRO_2026_SALT_KEY';

/**
 * Generate a deterministic hash signature for the license object.
 */
function computeSignature(email: string, key: string, issuedAt: string): string {
  const raw = `${email.trim().toLowerCase()}:${key}:${issuedAt}:${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `SIG-${Math.abs(hash).toString(36).toUpperCase()}-PRO`;
}

/**
 * Creates a valid Pro License object.
 */
export function generateLicenseData(email: string, name: string, planName: string = 'Pro Lifetime'): LicenseData {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'Game Designer';
  const issuedAt = new Date().toISOString();
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  const key = `TBPRO-${randomHex}-${Date.now().toString(36).toUpperCase()}`;
  const signature = computeSignature(cleanEmail, key, issuedAt);

  return {
    tier: 'pro',
    key,
    ownerEmail: cleanEmail,
    ownerName: cleanName,
    planName,
    issuedAt,
    signature
  };
}

/**
 * Validates a given object as a valid Pro License.
 */
export function validateLicenseData(data: any): { valid: boolean; license?: LicenseData; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'License data must be a valid JSON object' };
  }

  if (data.tier !== 'pro') {
    return { valid: false, error: 'Invalid license tier (must be "pro")' };
  }

  if (!data.key || typeof data.key !== 'string' || !data.key.startsWith('TBPRO-')) {
    return { valid: false, error: 'Invalid or missing Pro Key format' };
  }

  if (!data.ownerEmail || typeof data.ownerEmail !== 'string') {
    return { valid: false, error: 'Missing owner email' };
  }

  if (!data.issuedAt || typeof data.issuedAt !== 'string') {
    return { valid: false, error: 'Missing issued timestamp' };
  }

  const expectedSig = computeSignature(data.ownerEmail, data.key, data.issuedAt);
  if (data.signature !== expectedSig) {
    return { valid: false, error: 'Invalid license signature or corrupted key file' };
  }

  return { valid: true, license: data as LicenseData };
}

/**
 * Save license to localStorage.
 */
export function saveLicenseToStorage(license: LicenseData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
  } catch (e) {
    console.error('Failed to save license to storage', e);
  }
}

/**
 * Load saved license from localStorage.
 */
export function loadLicenseFromStorage(): LicenseData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = validateLicenseData(parsed);
    if (result.valid && result.license) {
      return result.license;
    }
  } catch (e) {
    console.error('Failed to parse saved license', e);
  }
  return null;
}

/**
 * Removes active license from localStorage.
 */
export function clearLicenseFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear license', e);
  }
}
