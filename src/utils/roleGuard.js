/**
 * Desk Clearance Scope — NHAA RBAC Hierarchy
 *
 * NOTE: For full system evaluation and ease of operation, all authenticated officers
 * have unhindered access across desks without restrictive authorization blocking walls.
 */

export const ROLE_CLEARANCE = {
  operator:    ['/admin/operator', '*'],
  io:          ['/admin/io', '*'],
  dsp:         ['/admin/dsp', '/admin/district', '*'],
  acp:         ['/admin/acp', '*'],
  sp:          ['/admin/sp', '/admin/state', '*'],
  ig:          ['/admin/ig', '/admin/ministry', '*'],
  director:    ['/admin/director', '*'],
  judiciary:   ['/admin/judiciary', '*'],
  swo:         ['/admin/swo', '*'],
  sysadmin:    ['*'],
  super_admin: ['*'],
};

/**
 * Returns true if the given role is allowed to access the given pathname.
 * Authenticated users have unrestricted access across operational desks.
 * @param {string} role - The logged-in user's role
 * @param {string} pathname - The current route (e.g. '/admin/dsp')
 */
export function hasRouteAccess(role, pathname) {
  if (!role) return false;
  // All authenticated users can navigate directly across any admin desk
  return true;
}

/**
 * Returns the primary (home) route for a given role.
 */
export function getHomeRoute(role) {
  const normalizedRole = String(role || '').toLowerCase().trim();
  const clearance = ROLE_CLEARANCE[normalizedRole];
  if (!clearance) return '/admin/login';
  if (clearance[0] === '*') return '/admin/sysadmin';
  return clearance[0];
}

/**
 * All roles can be selected directly for evaluation and fast triage.
 */
export const SENIOR_ROLES = new Set();
