/**
 * Desk Clearance Scope — NHAA RBAC Hierarchy & Strict Compartmentalization
 *
 * Each officer role is strictly restricted to their designated desk.
 * An officer logged in as DSP can NEVER access Operator, IO, or SP desks.
 * ONLY the System Administrator (sysadmin / super_admin) has full cross-tier access.
 *
 * L-0    operator    → operator desk only
 * L-0.5  io          → io desk only
 * L-1    dsp         → dsp / district desk only
 * L-1    acp         → acp desk only
 * L-2    sp          → sp / state desk only
 * L-3    ig          → ig / ministry desk only
 * L-3+   director    → director desk only
 * L-4    judiciary   → judiciary desk only
 * L-5    swo         → swo desk only
 * SYSTEM sysadmin    → ALL desks (wildcard '*')
 */

export const ROLE_CLEARANCE = {
  operator:    ['/admin/operator'],
  io:          ['/admin/io'],
  dsp:         ['/admin/dsp', '/admin/district'],
  acp:         ['/admin/acp'],
  sp:          ['/admin/sp', '/admin/state'],
  ig:          ['/admin/ig', '/admin/ministry'],
  director:    ['/admin/director'],
  judiciary:   ['/admin/judiciary'],
  swo:         ['/admin/swo'],
  sysadmin:    ['*'], // wildcard — full cross-tier access
  super_admin: ['*'],
};

/**
 * Returns true if the given role is allowed to access the given pathname.
 * @param {string} role - The logged-in user's role
 * @param {string} pathname - The current route (e.g. '/admin/dsp')
 */
export function hasRouteAccess(role, pathname) {
  if (!role) return false;
  const normalizedRole = String(role).toLowerCase().trim();
  const allowed = ROLE_CLEARANCE[normalizedRole];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Returns the primary (home) route for a given role.
 * Used to redirect unauthorised access back to the user's own desk.
 */
export function getHomeRoute(role) {
  const normalizedRole = String(role || '').toLowerCase().trim();
  const clearance = ROLE_CLEARANCE[normalizedRole];
  if (!clearance) return '/admin/login';
  if (clearance.includes('*')) return '/admin/sysadmin';
  return clearance[0];
}

/**
 * All roles can be selected directly for evaluation and fast triage.
 */
export const SENIOR_ROLES = new Set();


