import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Users } from 'lucide-react';
import { getSession, setSession, clearSession } from '../../utils/adminAuth';
import { hasRouteAccess, getHomeRoute, ROLE_CLEARANCE } from '../../utils/roleGuard';

const DEMO_ROLE_MAP = {
  '/admin/operator': { role: 'operator', name: 'Priya Kadam', username: 'operator', district: 'Pune District', state: 'Maharashtra', level: 'L-0', accent: 'rgb(0, 115, 230)' },
  '/admin/io':       { role: 'io',       name: 'Vikram Shinde', username: 'io',       district: 'Pune District', state: 'Maharashtra', level: 'L-0.5', accent: '#7C3AED' },
  '/admin/dsp':      { role: 'dsp',      name: 'Rajesh Shinde', username: 'dsp',      district: 'Pune District', state: 'Maharashtra', level: 'L-1', accent: '#059669' },
  '/admin/district': { role: 'dsp',      name: 'Rajesh Shinde', username: 'dsp',      district: 'Pune District', state: 'Maharashtra', level: 'L-1', accent: '#059669' },
  '/admin/acp':      { role: 'acp',      name: 'Sanjay More',   username: 'acp',      district: 'Pune District', state: 'Maharashtra', level: 'L-1+', accent: '#0891B2' },
  '/admin/sp':       { role: 'sp',       name: 'Anand Patil',   username: 'sp',       district: 'Pune Rural',    state: 'Maharashtra', level: 'L-2', accent: '#D97706' },
  '/admin/state':    { role: 'sp',       name: 'Anand Patil',   username: 'sp',       district: 'Pune Rural',    state: 'Maharashtra', level: 'L-2', accent: '#D97706' },
  '/admin/ig':       { role: 'ig',       name: 'Priya Kulkarni', username: 'ig',      district: '',              state: 'Maharashtra', level: 'L-3', accent: '#DC2626' },
  '/admin/ministry': { role: 'ig',       name: 'Priya Kulkarni', username: 'ig',      district: '',              state: 'Maharashtra', level: 'L-3', accent: '#DC2626' },
  '/admin/director': { role: 'director', name: 'K. S. Deshmukh', username: 'director', district: '',              state: 'All India',   level: 'L-3+', accent: '#111827' },
  '/admin/judiciary':{ role: 'judiciary',name: 'M. L. Gaikwad',  username: 'judiciary', district: 'Pune',          state: 'Maharashtra', level: 'L-4', accent: '#6D28D9' },
  '/admin/swo':      { role: 'swo',      name: 'Anita Pawar',    username: 'swo',      district: 'Pune District', state: 'Maharashtra', level: 'L-5', accent: '#BE185D' },
  '/admin/sysadmin': { role: 'sysadmin', name: 'NHAA Central Command', username: 'sysadmin', district: 'National Command', state: 'All India', level: 'SYS', accent: '#0F172A' },
};

const DESK_ORDER = ['operator','io','dsp','district','acp','sp','state','ig','ministry','director','judiciary','swo','sysadmin'];
const DESK_LABELS = {
  operator: { label: 'Operator Desk', short: 'OPR', path: '/admin/operator' },
  io:       { label: 'IO Desk',       short: 'IO',  path: '/admin/io' },
  district: { label: 'DSP/District',  short: 'DSP', path: '/admin/district' },
  dsp:      { label: 'DSP/District',  short: 'DSP', path: '/admin/district' },
  acp:      { label: 'ACP Sub-Div.',  short: 'ACP', path: '/admin/acp' },
  sp:       { label: 'SP State Cmd',  short: 'SP',  path: '/admin/state' },
  state:    { label: 'SP State Cmd',  short: 'SP',  path: '/admin/state' },
  ig:       { label: 'IG / Ministry', short: 'IG',  path: '/admin/ministry' },
  ministry: { label: 'IG / Ministry', short: 'IG',  path: '/admin/ministry' },
  director: { label: 'Director Apex', short: 'DIR', path: '/admin/director' },
  judiciary:{ label: 'Judiciary',     short: 'JUD', path: '/admin/judiciary' },
  swo:      { label: 'SWO / DBT',     short: 'SWO', path: '/admin/swo' },
  sysadmin: { label: 'Sys Admin',     short: 'SYS', path: '/admin/sysadmin' },
};

function autoDetectRole(pathname) {
  for (const [prefix, info] of Object.entries(DEMO_ROLE_MAP)) {
    if (pathname.startsWith(prefix)) {
      return info;
    }
  }
  return null;
}

/**
 * RequireRole — Route Guard Component (DEMO MODE — Auto-login Bypass)
 *
 * DEMO: No real authentication required. Auto-logs you in based on the
 * route you visit. For SIH judge presentation — seamless navigation
 * across all 9 hierarchical desks without any login prompts.
 *
 * Also renders a STICKY TOP RAIL on every admin page with:
 *  - Role switcher (one-click jump to any desk)
 *  - Current officer identity / clearance level
 *  - Demo-mode banner
 */
export default function RequireRole({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  let session = getSession();

  // DEMO AUTO-LOGIN: If no session, auto-create one based on the route
  if (!session?.role) {
    const roleInfo = autoDetectRole(location.pathname);
    if (roleInfo) {
      session = {
        ...roleInfo,
        token: 'demo-token-sih2026',
        authSource: 'demo_auto',
        officer_id: roleInfo.username,
      };
      setSession(session);
    } else {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
  }

  const hasAccess = hasRouteAccess(session.role, location.pathname);

  // Unique set of desks to show in switcher (dedupe aliases like district/dsp)
  const uniqueDesks = ['operator','io','district','acp','state','ministry','director','judiciary','swo','sysadmin'];

  const currentRoleForBanner = autoDetectRole(location.pathname) || session;
  const currentPathRoleKey = Object.keys(DEMO_ROLE_MAP).find(p => location.pathname.startsWith(p));
  const currentDeskMeta = currentPathRoleKey ? DEMO_ROLE_MAP[currentPathRoleKey] : DEMO_ROLE_MAP['/admin/sysadmin'];
  const currentIsElevated = !hasAccess;

  return (
    <>
      {/* ─── STICKY SIH DEMO RAIL ───────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 99999,
        background: currentIsElevated
          ? 'linear-gradient(90deg, #FFF7ED 0%, #FEF3C7 100%)'
          : 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #0F172A 100%)',
        borderBottom: currentIsElevated ? '2px solid #F59E0B' : '2px solid rgb(0, 115, 230)',
        padding: '6px 14px 8px 14px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}>
        {/* Top row: banner text + identity */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 6,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 800,
            color: currentIsElevated ? '#92400E' : '#DBEAFE',
            letterSpacing: '0.02em',
          }}>
            <Users size={14} />
            <span>🎬 SIH 2026 DEMO · NHAA 14566 Hierarchical Workflow</span>
            {currentIsElevated && (
              <span style={{
                background: '#FDE68A', color: '#78350F',
                padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800,
                border: '1px solid #F59E0B',
              }}>
                ⚠ CROSS-DESK PREVIEW · {session.role.toUpperCase()} viewing {currentDeskMeta.level}
              </span>
            )}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 10.5, fontWeight: 700,
            color: currentIsElevated ? '#78350F' : '#BFDBFE',
          }}>
            <span style={{
              padding: '2px 8px', borderRadius: 4,
              background: currentIsElevated ? '#FDE68A' : 'rgba(59, 130, 246, 0.25)',
              border: `1px solid ${currentIsElevated ? '#F59E0B' : 'rgba(59, 130, 246, 0.5)'}`,
              color: currentIsElevated ? '#78350F' : '#DBEAFE',
              fontWeight: 900,
              fontSize: 10,
            }}>
              CLEARANCE {currentDeskMeta.level} · {currentRoleForBanner.name || session.name}
            </span>
            <span>📍 {session.district || 'National'}, {session.state || 'India'}</span>
            <span>
              {session.badgeId ? `ID: ${session.badgeId}` : `ID: ${(session.username || '').toUpperCase()}-${(session.officer_id || 'DEMO').toUpperCase()}`}
            </span>
            <button
              onClick={() => { clearSession(); navigate('/admin/sysadmin', { replace: true }); window.location.reload(); }}
              style={{
                background: currentIsElevated ? '#F59E0B' : 'rgba(239, 68, 68, 0.25)',
                color: currentIsElevated ? '#FFFFFF' : '#FECACA',
                border: `1px solid ${currentIsElevated ? '#D97706' : 'rgba(239, 68, 68, 0.5)'}`,
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10, fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Reset Session
            </button>
          </div>
        </div>

        {/* Second row: Role quick switcher chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          overflowX: 'auto',
          paddingBottom: 2,
          scrollbarWidth: 'thin',
        }}>
          {uniqueDesks.map((deskKey) => {
            const meta = DESK_LABELS[deskKey];
            const info = DEMO_ROLE_MAP[meta.path];
            const isActive = location.pathname.startsWith(meta.path)
              || (deskKey === 'district' && location.pathname.startsWith('/admin/dsp'))
              || (deskKey === 'state' && location.pathname.startsWith('/admin/sp'))
              || (deskKey === 'ministry' && location.pathname.startsWith('/admin/ig'));
            return (
              <button
                key={deskKey}
                type="button"
                onClick={() => {
                  // Clear and re-set session to the target role — clean jump
                  clearSession();
                  const newSess = {
                    ...info,
                    token: 'demo-token-sih2026',
                    authSource: 'demo_switch',
                    officer_id: info.username,
                  };
                  setSession(newSess);
                  navigate(meta.path, { replace: true });
                }}
                style={{
                  flexShrink: 0,
                  background: isActive ? info.accent : (currentIsElevated ? '#FFFFFF' : 'rgba(255,255,255,0.08)'),
                  color: isActive ? '#FFFFFF' : (currentIsElevated ? '#0F172A' : '#E2E8F0'),
                  border: `1.5px solid ${isActive ? info.accent : (currentIsElevated ? '#FCD34D' : 'rgba(148, 163, 184, 0.3)')}`,
                  borderRadius: 6,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10.5,
                  fontWeight: isActive ? 900 : 700,
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = `${info.accent}22`;
                    e.currentTarget.style.borderColor = info.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = currentIsElevated ? '#FFFFFF' : 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = currentIsElevated ? '#FCD34D' : 'rgba(148, 163, 184, 0.3)';
                  }
                }}
              >
                <span style={{
                  fontSize: 8.5,
                  background: isActive ? 'rgba(255,255,255,0.25)' : info.accent,
                  color: isActive ? '#FFFFFF' : '#FFFFFF',
                  padding: '0 4px',
                  borderRadius: 3,
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                }}>
                  {info.level}
                </span>
                {meta.short}
                <span style={{ opacity: isActive ? 0.9 : 0.6, fontWeight: 600 }}>
                  {meta.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {children}
    </>
  );
}
