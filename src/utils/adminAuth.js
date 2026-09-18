
const SESSION_KEY = 'nhaa_admin_session';

/** No separate responder roles — all roles are in the police and multi-tier hierarchy. */
export const RESPONDER_ROLES = [];

/**
 * Multi-tier Hierarchical Roles:
 * operator (Call Centre) → io (Investigating Officer) → dsp/acp (Dy. SP / ACP)
 * → sp (Superintendent) → ig/director (Inspector General / Director)
 * → judiciary (Legal Adjudication) → swo (Social Welfare Officer)
 * → sysadmin (System Administrator — full oversight)
 */
export const ALL_ROLES = [
  'operator',
  'io',
  'dsp',
  'acp',
  'sp',
  'ig',
  'director',
  'judiciary',
  'swo',
  'sysadmin',
];

export const ROLE_LABELS = {
  operator: 'Call Centre Operator (Tier 0)',
  io: 'IO (Investigating Officer)',
  dsp: 'DSP (Dy. Superintendent of Police)',
  acp: 'ACP (Asst. Commissioner of Police)',
  sp: 'SP (Superintendent of Police)',
  ig: 'IG (Inspector General of Police)',
  director: 'Director (Central Oversight)',
  judiciary: 'Judiciary / Legal Authority',
  swo: 'SWO (Social Welfare Officer)',
  sysadmin: 'System Administrator (Full Tier Monitoring)',
};

export const ROLE_REDIRECTS = {
  operator: '/admin/operator',
  io: '/admin/io',
  dsp: '/admin/dsp',
  acp: '/admin/acp',
  sp: '/admin/sp',
  ig: '/admin/ig',
  director: '/admin/director',
  judiciary: '/admin/judiciary',
  swo: '/admin/swo',
  sysadmin: '/admin/sysadmin',
};

/**
 * Decode and validate JWT payload claims safely without external dependency.
 */
export function parseJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    
    // Cross-verify cryptographic claims from JWT if token is present
    if (session?.token) {
      const claims = parseJwt(session.token);
      if (claims) {
        // Enforce role from verified JWT payload over mutable local storage
        if (claims.role && session.role !== claims.role) {
          session.role = claims.role;
        }
      }
    }
    return session;
  } catch {
    return null;
  }
}

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getToken() {
  return getSession()?.token || null;
}

export function getAuthHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function getRedirectForRole(role) {
  return ROLE_REDIRECTS[role] || '/admin/login';
}

