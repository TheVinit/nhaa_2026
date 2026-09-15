/**
 * Offline fallback credentials when POST /auth/login is unreachable.
 * Accepts demo123, Test@1234 (operational), and Admin@1234 (sysadmin).
 * Updated with Maharashtra & Pune District jurisdictions.
 */

const ACCEPTED_PASSWORDS = new Set(['demo123', 'Test@1234', 'Admin@1234']);

/** Sysadmin has a separate password so it can't be reached with normal officer creds. */
const SYSADMIN_PASSWORD = 'Admin@1234';

const OFFICERS = [
  // ── Multi-Tier Police & Welfare Hierarchy (Maharashtra / Pune District) ──
  { username: 'operator', role: 'operator', name: 'Priya Kadam (Operator)', district: 'Pune District', state: 'Maharashtra' },
  { username: 'io', role: 'io', name: 'Inspector Vikram Shinde (IO)', district: 'Pune District', state: 'Maharashtra' },
  { username: 'dsp', role: 'dsp', name: 'DSP Rajesh Shinde', district: 'Pune District', state: 'Maharashtra' },
  { username: 'acp', role: 'acp', name: 'ACP Sanjay More', district: 'Pune District', state: 'Maharashtra' },
  { username: 'sp', role: 'sp', name: 'SP Anand Patil (IPS)', district: 'Pune Rural', state: 'Maharashtra' },
  { username: 'ig', role: 'ig', name: 'IG Priya Kulkarni (IPS)', state: 'Maharashtra' },
  { username: 'director', role: 'director', name: 'Director K. S. Deshmukh (IAS)', state: 'Maharashtra / All India' },
  { username: 'judiciary', role: 'judiciary', name: 'Hon. Special SC/ST Judge M. L. Gaikwad', state: 'District & Sessions Court, Shivajinagar Pune' },
  { username: 'swo', role: 'swo', name: 'SWO Anita Pawar', district: 'Pune District', state: 'Maharashtra' },

  // Compatibility aliases
  { username: 'op_pune_01', role: 'operator', name: 'Priya Kadam', district: 'Pune District', state: 'Maharashtra' },
  { username: 'dsp_pune_01', role: 'dsp', name: 'DSP Rajesh Shinde', district: 'Pune District', state: 'Maharashtra' },
  { username: 'sp_maha_01', role: 'sp', name: 'SP Anand Patil (IPS)', state: 'Maharashtra' },
  { username: 'ig_01', role: 'ig', name: 'IG Priya Kulkarni (IPS)' },
  // Legacy alias fallbacks for convenience
  { username: 'op_delhi_01', role: 'operator', name: 'Priya Kadam', district: 'Pune District', state: 'Maharashtra' },
  { username: 'dsp_delhi_01', role: 'dsp', name: 'DSP Rajesh Shinde', district: 'Pune District', state: 'Maharashtra' },
  { username: 'sp_delhi_01', role: 'sp', name: 'SP Anand Patil', state: 'Maharashtra' },
];

const MANAGED_USERS_KEY = 'nhaa_managed_users';

export function getManagedUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(MANAGED_USERS_KEY) || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

export function saveManagedUsers(users) {
  localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(users));
}

export const MOCK_USERS = OFFICERS.map((u) => ({ ...u, password: 'demo123' }));

export function authenticateMockUser(username, password) {
  const uname = username.trim().toLowerCase();
  const managedUser = getManagedUsers().find((user) => user.username?.toLowerCase() === uname);
  if (managedUser?.isActive !== false && managedUser?.password === password) {
    return {
      username: managedUser.username,
      role: managedUser.role,
      name: managedUser.name,
      district: managedUser.district || null,
      state: managedUser.state || null,
      badge_id: managedUser.badgeId || managedUser.badge_id || null,
      authSource: 'managed-local',
    };
  }

  // Sysadmin: accepts Test@1234, Admin@1234, or demo123
  if (uname === 'sysadmin') {
    if (ACCEPTED_PASSWORDS.has(password) || password === SYSADMIN_PASSWORD) {
      return {
        username: 'sysadmin',
        role: 'sysadmin',
        name: 'System Administrator (NHAA Central Command)',
        district: 'National Command',
        state: 'All India',
      };
    }
    return null;
  }

  if (!ACCEPTED_PASSWORDS.has(password)) return null;
  const user = OFFICERS.find((u) => u.username === uname);
  if (!user) return null;
  return { ...user };
}
