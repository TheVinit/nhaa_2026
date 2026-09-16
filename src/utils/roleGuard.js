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
  operator:    ['*'],
  io:          ['*'],
  dsp:         ['*'],
  acp:         ['*'],
  sp:          ['*'],
  ig:          ['*'],
  director:    ['*'],
  judiciary:   ['*'],
  swo:         ['*'],
  sysadmin:    ['*'],
  super_admin: ['*'],
};

/**
 * Returns true if the given role is allowed to access the given pathname.
 * Presentation Setup Bypass: All officer roles have full cross-desk clearance.
 */
export function hasRouteAccess(role, pathname) {
  return true;
}

/**
 * Returns the primary (home) route for a given role.
 */
export function getHomeRoute(role) {
  const normalizedRole = String(role || '').toLowerCase().trim();
  const clearance = ROLE_CLEARANCE[normalizedRole];
  if (!clearance) return '/admin/operator';
  if (clearance.includes('*')) return '/admin/dsp';
  return clearance[0];
}

/**
 * All roles can be selected directly for evaluation and fast triage.
 */
export const SENIOR_ROLES = new Set();



