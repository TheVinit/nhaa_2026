import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Headphones,
  Search,
  Shield,
  ShieldAlert,
  Award,
  Building2,
  Scale,
  HeartHandshake,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Radio,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { ASSETS } from '../../assets';
import { getSession, clearSession, ROLE_LABELS } from '../../utils/adminAuth';
import { useLang } from '../../i18n/LangContext';
import { ADMIN_TRANSLATIONS } from '../../i18n/adminTranslations';

const RANK_CONFIG = {
  operator:  { code: 'L-0',   label: 'Call Centre Operator', jurisdiction: 'Triage Queue & Intake', Icon: Headphones },
  io:        { code: 'L-0.5', label: 'Investigating Officer (IO)', jurisdiction: 'Ground Investigation & Scene Log', Icon: Search },
  dsp:       { code: 'L-1',   label: 'Deputy SP (DSP)', jurisdiction: 'District Operations & Supervisory', Icon: Shield },
  acp:       { code: 'L-1',   label: 'Asst. Commissioner (ACP)', jurisdiction: 'Zonal Field Command & Scrutiny', Icon: ShieldAlert },
  sp:        { code: 'L-2',   label: 'Superintendent of Police (SP)', jurisdiction: 'District/State Command & Case Lock', Icon: Award },
  ig:        { code: 'L-3',   label: 'Inspector General (IG)', jurisdiction: 'State Zone Strategic Review', Icon: Award },
  director:  { code: 'L-3+',  label: 'Director (Central Oversight)', jurisdiction: 'Apex Cross-Tier Performance', Icon: Building2 },
  judiciary: { code: 'L-4',   label: 'Judiciary / Legal Authority', jurisdiction: 'Audit Trail & SWO Directives', Icon: Scale },
  swo:       { code: 'L-5',   label: 'Social Welfare Officer (SWO)', jurisdiction: 'Victim Rehabilitation & Schemes', Icon: HeartHandshake },
};

const ADMIN_NAV = [
  { label: 'Operator Desk',      path: '/admin/operator',  code: 'L-0',   Icon: Headphones, desc: 'Call Centre & AI Triage Queue', roles: ['operator', 'dsp', 'acp', 'sp', 'ig', 'director'] },
  { label: 'IO Field Ops',       path: '/admin/io',        code: 'L-0.5', Icon: Search, desc: 'Ground Investigation & Site Evidence (Supervisory Monitor)', roles: ['io', 'dsp', 'acp', 'sp', 'ig', 'director'] },
  { label: 'ACP Command',        path: '/admin/acp',       code: 'L-1',   Icon: ShieldAlert, desc: 'Case Scrutiny & Field Forwarding', roles: ['acp', 'dsp', 'sp', 'ig', 'director'] },
  { label: 'DSP Operations',     path: '/admin/dsp',       code: 'L-1',   Icon: Shield, desc: 'District Field Operations & Inquiry', roles: ['dsp', 'sp', 'ig', 'director'] },
  { label: 'SP Oversight',       path: '/admin/sp',        code: 'L-2',   Icon: Award, desc: 'Delay Alert System & Case Lock to Judiciary', roles: ['sp', 'ig', 'director'] },
  { label: 'IG Intelligence',    path: '/admin/ig',        code: 'L-3',   Icon: Award, desc: 'National Overview & Apex Review', roles: ['ig', 'director'] },
  { label: 'Director Control',   path: '/admin/director',  code: 'L-3+',  Icon: Building2, desc: 'Full-Tier Performance & Aggregate KPIs', roles: ['director'] },
  { label: 'Judiciary Review',   path: '/admin/judiciary', code: 'L-4',   Icon: Scale, desc: 'Audit Trail Scrutiny & Directives to SWO', roles: ['judiciary', 'director'] },
  { label: 'SWO Rehabilitation', path: '/admin/swo',       code: 'L-5',   Icon: HeartHandshake, desc: 'Victim Rehabilitation & Welfare Tracking', roles: ['swo', 'judiciary', 'director'] },
];

/**
 * Real-Life Statutory Hierarchy Access Check (SC/ST PoA Act & Rules 1995)
 * Subordinates (Operator L-0, IO L-0.5) can NEVER access superior command desks.
 * Superior officers only monitor IO submissions from their supervisory purview.
 */
function isRoleAuthorized(requiredRoles, currentRole) {
  if (!currentRole) return false;
  if (currentRole === 'director' || currentRole === 'super_admin') return true;
  return requiredRoles.includes(currentRole);
}

function navVisible(item, role) {
  return isRoleAuthorized(item.roles, role);
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#FFFFFF', fontWeight: 600 }}>
      {time.toLocaleTimeString('en-IN', { hour12: false })} IST
    </span>
  );
}

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const role = session?.role || 'dsp';
  const { lang } = useLang();
  const at = ADMIN_TRANSLATIONS[lang] || ADMIN_TRANSLATIONS.en;
  const current = ADMIN_NAV.find((n) => n.path === location.pathname);
  const rank = RANK_CONFIG[role] || RANK_CONFIG.dsp;
  const RankIcon = rank.Icon || Shield;

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('nhaa_admin_sidebar_collapsed');
    return saved === 'true';
  });

  const [stats, setStats] = useState({
    total: 24,
    critical: 13,
    pending_sla: 4,
    resolved: 7,
  });

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('supervisor');
  const [emailSent, setEmailSent] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('nhaa_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    clearSession();
    navigate('/admin/login');
  };

  const handleRoleSwitch = (newRole) => {
    const mockUser = {
      username: newRole,
      role: newRole,
      name: `${RANK_CONFIG[newRole]?.label || newRole} (Demo Clearance)`,
      district: 'Pune District',
      state: 'Maharashtra',
      token: 'demo-token-hierarchy-switch',
    };
    setSession(mockUser);
    const targetNav = ADMIN_NAV.find((n) => n.roles.includes(newRole));
    if (targetNav) {
      navigate(targetNav.path);
    } else {
      window.location.reload();
    }
  };

  const sidebarWidth = collapsed ? 72 : 280;

  // Real-life statutory authorization check for the current route
  const isAuthorized = current ? isRoleAuthorized(current.roles, role) : true;

  return (
    <div style={{
      background: '#F8FAFC',
      color: '#0F172A',
      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Utility Bar */}
      <div style={{
        background: '#0F1E36',
        color: '#FFFFFF',
        fontSize: 12,
        padding: '6px 0',
        borderBottom: '2px solid rgb(0, 115, 230)',
        zIndex: 110,
      }}>
        <div style={{
          maxWidth: '100%',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {/* Left: Flag & Official Government Declaration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={ASSETS.indianFlag}
              alt="Government of India Flag"
              style={{ height: 13, width: 20, objectFit: 'cover', borderRadius: 2 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span style={{ fontWeight: 600, letterSpacing: '0.02em', fontSize: 11 }}>
              Government of India &nbsp;|&nbsp; Ministry of Social Justice &amp; Empowerment &bull; State of Maharashtra
            </span>
          </div>

          {/* Right: Telephony Status, Clock & Public Portal Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Clock />
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#A7F3D0',
              padding: '2px 10px',
              borderRadius: 4,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              IVRS 14566 TOLL-FREE ACTIVE
            </span>
            <Link
              to="/"
              style={{
                color: '#60A5FA',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Public Portal &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Official Main Header Bar */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? "Expand Sidebar Navigation" : "Collapse Sidebar Navigation"}
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              borderRadius: 6,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgb(0, 115, 230)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F7FF'; e.currentTarget.style.borderColor = 'rgb(0, 115, 230)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* National Emblem + Portal Title */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
            <img
              src={ASSETS.nationalEmblem}
              alt="National Emblem"
              style={{ height: 44, width: 'auto' }}
              onError={(e) => { e.target.src = `${import.meta.env.BASE_URL}ashoka_emblem.jpg`; }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  background: 'rgb(0, 115, 230)',
                  color: '#FFFFFF',
                  fontSize: 9,
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: 3,
                  letterSpacing: '0.5px',
                }}>
                  LAW ENFORCEMENT COMMAND
                </span>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                  Government of Maharashtra &bull; Home Department
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                National Helpline Against Atrocities (14566) &mdash; Pune District Command Desk
              </div>
            </div>
          </Link>
        </div>

        {/* Right Officer Status & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Desk Switcher restricted strictly to authorized supervisory scope */}
          {ADMIN_NAV.filter((item) => navVisible(item, role)).length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Supervisory Desk:</span>
              <select
                value={location.pathname}
                onChange={(e) => navigate(e.target.value)}
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'rgb(0, 115, 230)',
                  background: '#FFFFFF',
                  border: '1px solid #94A3B8',
                  borderRadius: 4,
                  padding: '3px 6px',
                  cursor: 'pointer',
                }}
              >
                {ADMIN_NAV.filter((item) => navVisible(item, role)).map((n) => (
                  <option key={n.path} value={n.path}>
                    {n.code}: {n.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#0369A1',
              background: '#E0F2FE',
              border: '1px solid #BAE6FD',
              padding: '4px 10px',
              borderRadius: 6,
            }}>
              Station Desk: {rank.code} {rank.label}
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#F8FAFC',
            border: '1.5px solid #CBD5E1',
            padding: '5px 12px',
            borderRadius: 6,
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: 'rgb(0, 115, 230)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RankIcon size={16} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {session?.name || 'DySP Rajesh Shinde'}
              </div>
              <div style={{ fontSize: 10, color: 'rgb(0, 115, 230)', fontWeight: 800, marginTop: 1 }}>
                {rank.code}: {rank.label} &bull; Pune
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            style={{
              background: '#F0F9FF',
              color: '#0369A1',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 5,
              border: '1.5px solid #BAE6FD',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E0F2FE'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F9FF'; }}
          >
            📧 Email Report
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: '#FFFFFF',
              color: '#DC2626',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 5,
              border: '1.5px solid #FECACA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace with Collapsible Sidebar */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Left Collapsible Sidebar */}
        <aside
          style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            background: '#FFFFFF',
            color: '#0F172A',
            borderRight: '1px solid #E2E8F0',
            transition: 'width 0.2s ease, min-width 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '2px 0 10px rgba(0,0,0,0.03)',
            zIndex: 90,
            overflowX: 'hidden',
          }}
        >
          {/* Top Section: Navigation Items */}
          <div style={{ padding: '16px 10px' }}>
            <div style={{
              padding: collapsed ? '0 4px 12px' : '0 10px 12px',
              borderBottom: '1px solid #F1F5F9',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
            }}>
              {!collapsed && (
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  Authorized Desks ({rank.code})
                </span>
              )}
              <span style={{
                fontSize: 9,
                fontWeight: 900,
                background: '#FF9933',
                color: '#000000',
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                POA ACT 1989
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ADMIN_NAV.filter((item) => navVisible(item, role)).map((item) => {
                const isActive = location.pathname === item.path;
                const ItemIcon = item.Icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? `${item.code} - ${item.label}: ${item.desc}` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '12px 0' : '10px 12px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#FFFFFF' : '#334155',
                      background: isActive ? 'rgb(0, 115, 230)' : 'transparent',
                      border: isActive ? '1px solid rgb(0, 115, 230)' : '1px solid transparent',
                      boxShadow: isActive ? '0 4px 12px rgba(0, 115, 230, 0.22)' : 'none',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#F0F7FF';
                        e.currentTarget.style.borderColor = '#BFDBFE';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ItemIcon size={17} color={isActive ? '#FFFFFF' : '#64748B'} />
                    </span>

                    {!collapsed && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: isActive ? '#FFFFFF' : '#0F172A', fontSize: 13, fontWeight: isActive ? 800 : 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 5px',
                            borderRadius: 4,
                            background: isActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                            color: isActive ? '#FFFFFF' : '#475569',
                            marginLeft: 6,
                          }}>
                            {item.code}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: isActive ? '#E0F2FE' : '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.desc}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Live Case Queue Breakdown in Sidebar */}
            {!collapsed && (
              <div style={{
                marginTop: 18,
                padding: '12px',
                background: '#F8FAFC',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
              }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Live Queue Metrics</span>
                  <span style={{ color: '#16A34A', fontSize: 9 }}>● Live Synced</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Total Roster:</span>
                    <span style={{ fontWeight: 800, color: '#0F172A', background: '#E2E8F0', padding: '1px 6px', borderRadius: 4 }}>{stats.total} Cases</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                    <span style={{ color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} />
                      Critical Distress (SVI &gt; 70):
                    </span>
                    <span style={{ fontWeight: 900, color: '#991B1B', background: '#FEE2E2', padding: '1px 6px', borderRadius: 4 }}>{stats.critical}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                    <span style={{ color: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} />
                      Pending SLA Dispatch:
                    </span>
                    <span style={{ fontWeight: 900, color: '#92400E', background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>{stats.pending_sla}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                    <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                      Actioned &amp; Resolved:
                    </span>
                    <span style={{ fontWeight: 900, color: '#065F46', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4 }}>{stats.resolved}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section: Jurisdictional Status & Quick Links */}
          <div style={{
            padding: '14px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
          }}>
            {!collapsed ? (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Jurisdiction Scope
                </div>
                <div style={{ fontSize: 11, color: '#0F172A', fontWeight: 700 }}>
                  Pune District &bull; Maharashtra Zone
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontSize: 10, color: '#047857', fontWeight: 800 }}>Encrypted NIC-Gov Channel</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }} title="Encrypted Connection Online">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              </div>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Breadcrumb Navigation Bar */}
          <div style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B' }}>
              <span style={{ fontWeight: 600 }}>Home</span>
              <span>/</span>
              <span style={{ fontWeight: 600 }}>Command Hierarchy</span>
              <span>/</span>
              <span style={{ fontWeight: 800, color: 'rgb(0, 115, 230)' }}>{current?.label || 'Officer Desk'}</span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                background: 'rgb(0, 115, 230)',
                color: '#FFFFFF',
                padding: '2px 7px',
                borderRadius: 4,
              }}>
                {current?.code || rank.code}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Command Jurisdiction:</span>
              <span style={{
                fontSize: 11, fontWeight: 800, color: '#065F46', background: '#D1FAE5',
                padding: '3px 10px', borderRadius: 4, border: '1px solid #A7F3D0',
              }}>
                Pune District, Maharashtra &bull; Level {rank.code}
              </span>
            </div>
          </div>

          {/* Main Content Workspace or Statutory Clearance Warning */}
          <main style={{
            flex: 1,
            padding: '24px',
            boxSizing: 'border-box',
            maxWidth: 1600,
            width: '100%',
            margin: '0 auto',
          }}>
            {!isAuthorized ? (
              <div style={{
                background: '#FFFFFF',
                border: '2px solid #FCA5A5',
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.08)',
                maxWidth: 680,
                margin: '40px auto',
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <ShieldAlert size={32} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Statutory Hierarchy Access Restriction
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '8px 0 12px' }}>
                  Insufficient Clearance for {current?.label} ({current?.code})
                </h2>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Under the <strong>SC/ST (Prevention of Atrocities) Act 1989 &amp; Rules 1995</strong>, access to this command desk is strictly reserved for authorized ranks (<strong>{current?.roles?.join(', ').toUpperCase()}</strong>). Your current active clearance is <strong>{rank.code} ({rank.label})</strong>.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const userHome = ADMIN_NAV.find((n) => n.roles.includes(role))?.path || '/admin/operator';
                      navigate(userHome);
                    }}
                    style={{
                      background: 'rgb(0, 115, 230)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Return to Authorized Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/login')}
                    style={{
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Switch Officer Login
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>

      {/* Email Report Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
            padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>📧 Escalate / Send Report</h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>
              Send an encrypted situation report to another tier in the hierarchy.
            </p>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              Select Recipient Level
            </label>
            <select
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6,
                color: '#0F172A', fontSize: 13, padding: '10px 12px', marginBottom: 20, outline: 'none',
              }}
            >
              <option value="supervisor">⬆ Higher Command (SP / IG / Director)</option>
              <option value="subordinate">⬇ Lower Field Ops (DSP / IO / Operator)</option>
              <option value="judiciary">⚖ Judiciary / Court Registry</option>
              <option value="swo">🤝 Social Welfare Officer</option>
              <option value="sysadmin">🛡️ System Administrator</option>
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  let emailTo = 'admin@nhaa.gov.in';
                  if (emailRecipient === 'supervisor') emailTo = 'command@nhaa.gov.in';
                  if (emailRecipient === 'subordinate') emailTo = 'fieldops@nhaa.gov.in';
                  if (emailRecipient === 'judiciary') emailTo = 'registry.court@nhaa.gov.in';
                  if (emailRecipient === 'swo') emailTo = 'welfare@nhaa.gov.in';

                  const subject = encodeURIComponent(`NHAA Escalation Report — ${rank.label} (${new Date().toLocaleDateString('en-IN')})`);
                  const body = encodeURIComponent(`Generating system report from ${rank.label} desk...\n\nTargeting: ${emailRecipient.toUpperCase()}`);
                  window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
                  
                  setEmailSent(true);
                  setTimeout(() => { setEmailSent(false); setShowEmailModal(false); }, 2000);
                }}
                style={{
                  flex: 1, background: emailSent ? '#166534' : 'rgb(0, 115, 230)',
                  color: '#FFFFFF', border: 'none', borderRadius: 8,
                  padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {emailSent ? '✓ Opening Email Client...' : 'Generate & Send Email'}
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
                  borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
