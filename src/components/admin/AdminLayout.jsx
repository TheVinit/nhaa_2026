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
  LogOut,
  CheckCircle2,
  ShieldCheck,
  LayoutDashboard,
  Clock as ClockIcon,
  Settings,
  HelpCircle,
  Mail,
  X,
  Send,
  Check,
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
  sysadmin:  { code: 'SYS',   label: 'System Administrator', jurisdiction: 'Full Tier Governance & Monitoring', Icon: ShieldCheck },
};

const ADMIN_NAV = [
  { label: 'Operator Desk',      path: '/admin/operator',  code: 'L-0',   Icon: Headphones, desc: 'Call Centre & AI Triage Queue', roles: ['operator'] },
  { label: 'IO Field Ops',       path: '/admin/io',        code: 'L-0.5', Icon: Search, desc: 'Ground Investigation & Site Evidence', roles: ['io'] },
  { label: 'ACP Command',        path: '/admin/acp',       code: 'L-1',   Icon: ShieldAlert, desc: 'Case Scrutiny & Field Forwarding', roles: ['acp'] },
  { label: 'DSP Operations',     path: '/admin/dsp',       code: 'L-1',   Icon: Shield, desc: 'District Field Operations & Inquiry', roles: ['dsp'] },
  { label: 'SP Oversight',       path: '/admin/sp',        code: 'L-2',   Icon: Award, desc: 'Delay Alert System & Case Lock to Judiciary', roles: ['sp'] },
  { label: 'IG Intelligence',    path: '/admin/ig',        code: 'L-3',   Icon: Award, desc: 'National Overview & Apex Review', roles: ['ig'] },
  { label: 'Director Control',   path: '/admin/director',  code: 'L-3+',  Icon: Building2, desc: 'Full-Tier Performance & Aggregate KPIs', roles: ['director'] },
  { label: 'Judiciary Review',   path: '/admin/judiciary', code: 'L-4',   Icon: Scale, desc: 'Audit Trail Scrutiny & Directives to SWO', roles: ['judiciary'] },
  { label: 'SWO Rehabilitation', path: '/admin/swo',       code: 'L-5',   Icon: HeartHandshake, desc: 'Victim Rehabilitation & Welfare Tracking', roles: ['swo'] },
  { label: 'System Admin Console', path: '/admin/sysadmin', code: 'SYS', Icon: ShieldCheck, desc: 'Full Tier Monitoring & Live Audit', roles: ['sysadmin', 'super_admin'] },
];

/**
 * Real-Life Statutory Hierarchy Access Check (SC/ST PoA Act & Rules 1995)
 * Officers are strictly confined to their own designated operational desk.
 * Only the System Administrator (sysadmin / super_admin) has clearance across all desks.
 */
function isRoleAuthorized(requiredRoles, currentRole) {
  if (!currentRole) return false;
  const roleNorm = String(currentRole).toLowerCase().trim();
  if (roleNorm === 'sysadmin' || roleNorm === 'super_admin') return true;
  return requiredRoles.includes(roleNorm);
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

  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') || 'overview';
  const basePath = (role === 'sysadmin' || role === 'super_admin')
    ? '/admin/sysadmin'
    : (ADMIN_NAV.find((n) => n.roles.includes(role))?.path || '/admin/dsp');

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('nhaa_admin_sidebar_collapsed');
    return saved === 'true';
  });

  const [stats, setStats] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('nhaa_case_counts') || '{}');
      return {
        total: stored.total || 24,
        critical: stored.critical || 13,
        pending_sla: stored.pending || 4,
        resolved: stored.resolved || 7,
      };
    } catch { return { total: 24, critical: 13, pending_sla: 4, resolved: 7 }; }
  });

  // Poll localStorage for live counts written by DistrictScreen
  useEffect(() => {
    const refresh = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('nhaa_case_counts') || '{}');
        if (stored.total) {
          setStats({
            total: stored.total,
            critical: stored.critical || 0,
            pending_sla: stored.pending || 0,
            resolved: stored.resolved || 0,
          });
        }
      } catch {}
    };
    const t = setInterval(refresh, 5000);
    refresh();
    return () => clearInterval(t);
  }, []);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('supervisor');
  const [emailSent, setEmailSent] = useState(false);

  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);



  const [trackQuery, setTrackQuery] = useState('NHAA-1008');

  const [stationSettings, setStationSettings] = useState({
    stationName: 'Pune District Command Desk (NHAA 14566)',
    audioAlerts: true,
    autoDispatchCritical: true,
    language: 'English',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

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
          {/* Desk Switcher restricted strictly to sysadmin cross-tier oversight */}
          {ADMIN_NAV.filter((item) => navVisible(item, role)).length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>SysAdmin Cross-Desk Switcher:</span>
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

          {/* Quick Total Cases Navbar Button */}
          <button
            type="button"
            onClick={() => navigate(`${basePath}?view=cases`)}
            title="Open Total Cases Dossier"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: currentView === 'cases' ? '#EFF6FF' : '#FFFFFF',
              border: currentView === 'cases' ? '1.5px solid rgb(0, 115, 230)' : '1px solid #CBD5E1',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgb(0, 115, 230)'; }}
            onMouseLeave={(e) => { if (currentView !== 'cases') e.currentTarget.style.borderColor = '#CBD5E1'; }}
          >
            <Shield size={14} color="rgb(0, 115, 230)" />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1E293B' }}>Total Cases:</span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 900,
              background: 'rgb(0, 115, 230)',
              color: '#FFFFFF',
              padding: '1.5px 7px',
              borderRadius: 4,
              letterSpacing: '0.5px',
            }}>
              {String(stats.total || 24).padStart(3, '0')}
            </span>
          </button>

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
                {session?.name || (role === 'sysadmin' ? 'System Administrator' : 'DySP Rajesh Shinde')}
              </div>
              <div style={{ fontSize: 10, color: 'rgb(0, 115, 230)', fontWeight: 800, marginTop: 1 }}>
                {rank.code}: {rank.label} &bull; {session?.district || 'Pune'}
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
            <Mail size={13} /> Email Report
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
          {/* Top Section: Navigation Menu */}
          <div style={{ padding: collapsed ? '14px 6px' : '16px 12px' }}>

            {/* Operational Navigation List */}
            {(() => {
              const searchParams = new URLSearchParams(location.search);
              const currentView = searchParams.get('view') || 'overview';
              const basePath = (role === 'sysadmin' || role === 'super_admin')
                ? '/admin/sysadmin'
                : (ADMIN_NAV.find((n) => n.roles.includes(role))?.path || '/admin/dsp');

              return (
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* 1. Dashboard (Overview & Visual Graphs) */}
                  <button
                    type="button"
                    onClick={() => navigate(`${basePath}?view=overview`)}
                    title={collapsed ? "Dashboard Overview" : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: currentView === 'overview' ? 800 : 600,
                      color: currentView === 'overview' ? 'rgb(0, 115, 230)' : '#334155',
                      background: currentView === 'overview' ? '#EFF6FF' : 'transparent',
                      border: currentView === 'overview' ? '1px solid #DBEAFE' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (currentView !== 'overview') e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (currentView !== 'overview') e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LayoutDashboard size={18} color={currentView === 'overview' ? 'rgb(0, 115, 230)' : '#475569'} />
                    {!collapsed && <span>Overview &amp; KPIs</span>}
                  </button>

                  {/* 2. Total Cases (Dossiers & Full Details) */}
                  <button
                    type="button"
                    onClick={() => navigate(`${basePath}?view=cases`)}
                    title={collapsed ? `Total Cases (${stats.total})` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: currentView === 'cases' ? 800 : 600,
                      color: currentView === 'cases' ? 'rgb(0, 115, 230)' : '#334155',
                      background: currentView === 'cases' ? '#EFF6FF' : 'transparent',
                      border: currentView === 'cases' ? '1px solid #DBEAFE' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (currentView !== 'cases') e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { if (currentView !== 'cases') e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Shield size={17} color={currentView === 'cases' ? 'rgb(0, 115, 230)' : '#475569'} />
                    {!collapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <span>Total Cases</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 900, background: '#DBEAFE', color: 'rgb(0, 115, 230)', padding: '1px 7px', borderRadius: 4 }}>
                          {String(stats.total).padStart(3, '0')}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* 3. Pending Review */}
                  <button
                    type="button"
                    onClick={() => navigate(`${basePath}?view=pending`)}
                    title={collapsed ? `Pending Cases (${stats.pending_sla})` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: currentView === 'pending' ? 800 : 600,
                      color: currentView === 'pending' ? '#B45309' : '#334155',
                      background: currentView === 'pending' ? '#FFFBEB' : 'transparent',
                      border: currentView === 'pending' ? '1px solid #FDE68A' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (currentView !== 'pending') e.currentTarget.style.background = '#FFFBEB'; }}
                    onMouseLeave={(e) => { if (currentView !== 'pending') e.currentTarget.style.background = 'transparent'; }}
                  >
                    <ClockIcon size={17} color={currentView === 'pending' ? '#D97706' : '#D97706'} />
                    {!collapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <span>Pending Cases</span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                          {String(stats.pending_sla).padStart(3, '0')}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* 4. Approved Cases */}
                  <button
                    type="button"
                    onClick={() => navigate(`${basePath}?view=approved`)}
                    title={collapsed ? `Approved Cases (${stats.resolved})` : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: currentView === 'approved' ? 800 : 600,
                      color: currentView === 'approved' ? '#15803D' : '#334155',
                      background: currentView === 'approved' ? '#DCFCE7' : 'transparent',
                      border: currentView === 'approved' ? '1px solid #86EFAC' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (currentView !== 'approved') e.currentTarget.style.background = '#F0FDF4'; }}
                    onMouseLeave={(e) => { if (currentView !== 'approved') e.currentTarget.style.background = 'transparent'; }}
                  >
                    <CheckCircle2 size={17} color={currentView === 'approved' ? '#16A34A' : '#16A34A'} />
                    {!collapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <span>Approved Cases</span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                          {String(stats.resolved).padStart(3, '0')}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* 5. Track Status */}
                  <button
                    type="button"
                    onClick={() => setShowTrackModal(true)}
                    title={collapsed ? "Track Status" : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#334155',
                      background: 'transparent',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Search size={17} color="#475569" />
                    {!collapsed && <span>Track Status</span>}
                  </button>

                  {/* 6. Help & FAQs */}
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    title={collapsed ? "Help & FAQs" : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#334155',
                      background: 'transparent',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <HelpCircle size={17} color="#475569" />
                    {!collapsed && <span>Help &amp; FAQs</span>}
                  </button>

                  {/* 7. Settings */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    title={collapsed ? "Settings" : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#334155',
                      background: 'transparent',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Settings size={17} color="#475569" />
                    {!collapsed && <span>Settings</span>}
                  </button>

                  {/* 8. Mail Report Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    title={collapsed ? "Send Official Mail Report" : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed ? '11px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0369A1',
                      background: '#F0F9FF',
                      border: '1.5px solid #BAE6FD',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      marginTop: 6,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#E0F2FE'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#F0F9FF'; }}
                  >
                    <Mail size={17} color="#0284C7" />
                    {!collapsed && <span>Send Mail Report</span>}
                  </button>
                </nav>
              );
            })()}

            {/* Central Oversight for SysAdmin only */}
            {(role === 'sysadmin' || role === 'super_admin') && !collapsed && (
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#7C2D12', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Central Oversight</span>
                  <span style={{ background: '#7C2D12', color: '#FFF', padding: '1px 5px', borderRadius: 3, fontSize: 8 }}>SYS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
                  {ADMIN_NAV.map((n) => (
                    <Link
                      key={n.path}
                      to={n.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontSize: 11.5,
                        fontWeight: location.pathname === n.path ? 800 : 600,
                        color: location.pathname === n.path ? '#FFFFFF' : '#334155',
                        background: location.pathname === n.path ? 'rgb(0, 115, 230)' : 'transparent',
                      }}
                    >
                      <span>{n.label}</span>
                      <span style={{ fontSize: 8.5, opacity: 0.8 }}>{n.code}</span>
                    </Link>
                  ))}
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
            padding: '28px 32px', width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} color="rgb(0, 115, 230)" /> Escalate / Send Official Report
              </h3>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>
              Send an encrypted situation report to another tier in the hierarchy or Central Monitoring.
            </p>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              Select Recipient Tier
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
              <option value="supervisor">Higher Command (SP / IG / Director)</option>
              <option value="subordinate">Lower Field Operations (DSP / IO / Operator)</option>
              <option value="judiciary">Judiciary / Special Court Registry</option>
              <option value="swo">Social Welfare Officer (DBT Relief)</option>
              <option value="sysadmin">System Administrator (Central Oversight)</option>
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
                  const body = encodeURIComponent(`Generating system report from ${rank.label} desk...\nTargeting: ${emailRecipient.toUpperCase()}\nOfficer: ${session?.name || 'Officer'}\nDistrict: ${session?.district || 'Pune'}`);
                  window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
                  
                  setEmailSent(true);
                  setTimeout(() => { setEmailSent(false); setShowEmailModal(false); }, 2000);
                }}
                style={{
                  flex: 1, background: emailSent ? '#166534' : 'rgb(0, 115, 230)',
                  color: '#FFFFFF', border: 'none', borderRadius: 8,
                  padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {emailSent ? <Check size={14} /> : <Send size={14} />}
                {emailSent ? 'Opening Email Client...' : 'Generate & Send Email'}
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

      {/* Track Status Modal */}
      {showTrackModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
            padding: '28px 32px', width: 520, maxWidth: '92vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#EFF6FF', color: 'rgb(0, 115, 230)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  Central Dossier Registry
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={18} color="rgb(0, 115, 230)" /> Track Dossier Status &amp; Mandate
                </h3>
              </div>
              <button onClick={() => setShowTrackModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Enter Case ID e.g. NHAA-1008"
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
              />
              <button
                type="button"
                onClick={() => alert(`Found Case Record for ${trackQuery}`)}
                style={{ background: 'rgb(0, 115, 230)', color: '#FFF', border: 'none', borderRadius: 6, padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}
              >
                Search
              </button>
            </div>

            {/* Dossier Card Preview */}
            <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{trackQuery || 'NHAA-1008'}</span>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 4 }}>
                  In Progress &bull; SLA Active
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 700, marginBottom: 6 }}>
                Complainant: Smt. Sunita Anand Kamble &bull; +91 98220-43210
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.5 }}>
                Offence: <strong>PoA Act Section 3(1)(r)(s) &amp; IPC 506</strong><br />
                Investigating Officer: <strong>DySP Rajesh Shinde (Pune Sub-Div)</strong><br />
                Section 4 Investigation Mandate: <strong>Day 18 of 60 (42 Days Remaining)</strong><br />
                Rule 12(4) Relief: <strong>Stage 1 Disbursed (₹1,00,000 via PFMS)</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTrackModal(false)}
              style={{ width: '100%', marginTop: 16, background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
            >
              Close Tracker
            </button>
          </div>
        </div>
      )}

      {/* Station Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
            padding: '28px 32px', width: 480, maxWidth: '92vw',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#EFF6FF', color: 'rgb(0, 115, 230)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  Station Configuration
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Settings size={18} color="rgb(0, 115, 230)" /> Station &amp; Officer Settings
                </h3>
              </div>
              <button onClick={() => { setShowSettingsModal(false); setSettingsSaved(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Station Jurisdiction Name
                </label>
                <input
                  type="text"
                  value={stationSettings.stationName}
                  onChange={(e) => setStationSettings({ ...stationSettings, stationName: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>Telephony Voice Intake Alerts</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Audio chime on new caller triage</div>
                </div>
                <input
                  type="checkbox"
                  checked={stationSettings.audioAlerts}
                  onChange={(e) => setStationSettings({ ...stationSettings, audioAlerts: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>Auto-Dispatch Critical Distress (SVI &gt; 70)</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Automatic PCR proximity alert</div>
                </div>
                <input
                  type="checkbox"
                  checked={stationSettings.autoDispatchCritical}
                  onChange={(e) => setStationSettings({ ...stationSettings, autoDispatchCritical: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Portal Working Language
                </label>
                <select
                  value={stationSettings.language}
                  onChange={(e) => setStationSettings({ ...stationSettings, language: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                >
                  <option value="English">English (Official Court &amp; Police Standard)</option>
                  <option value="Hindi">हिन्दी (Hindi Standard)</option>
                  <option value="Marathi">मराठी (Maharashtra State Standard)</option>
                </select>
              </div>

              {settingsSaved && (
                <div style={{ color: '#15803D', fontWeight: 700, fontSize: 12, background: '#DCFCE7', padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={14} /> Preferences saved successfully.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsSaved(true);
                    setTimeout(() => { setSettingsSaved(false); setShowSettingsModal(false); }, 1500);
                  }}
                  style={{ flex: 1, background: 'rgb(0, 115, 230)', color: '#FFF', border: 'none', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Station Preferences
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & FAQs Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
            padding: '28px 32px', width: 560, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#EFF6FF', color: 'rgb(0, 115, 230)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  Statutory PoA Act 1989 &amp; SOP Manual
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HelpCircle size={18} color="rgb(0, 115, 230)" /> Standard Operating Procedure &amp; FAQs
                </h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 4 }}>
                  Q1: What is the mandatory investigation timeline under Section 4?
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  Under <strong>Section 4 of the SC/ST (PoA) Act, 1989 (Amended 2016)</strong>, an Investigating Officer (not below DySP rank) must complete investigation and file chargesheet within <strong>60 days</strong>. Failure to do so without justified cause is punishable as wilful neglect of duty.
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 4 }}>
                  Q2: How is victim relief disbursed under Rule 12(4)?
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  Rule 12(4) mandates a <strong>3-stage Direct Benefit Transfer (DBT)</strong> directly to victim bank accounts via PFMS:
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    <li>Stage 1: 25% on FIR registration / spot verification</li>
                    <li>Stage 2: 50% on chargesheet submission in Special Court</li>
                    <li>Stage 3: 25% on conviction / final court judgment</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, marginBottom: 4 }}>
                  Q3: What does the Pre-Judiciary Cryptographic Seal mean?
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  The Superintendent of Police (SP) generates a <strong>SHA-256 cryptographic digital hash</strong> over all case logs, panchnamas, and evidence prior to transmission to the Special Court. This guarantees chain-of-custody integrity against tampering.
                </div>
              </div>

              <div style={{ background: '#F0F7FF', padding: 14, borderRadius: 8, border: '1px solid #BFDBFE' }}>
                <div style={{ fontWeight: 800, color: '#0369A1', fontSize: 13, marginBottom: 4 }}>
                  National Helpline Atrocities Contact:
                </div>
                <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>
                  Toll-Free Helpline: <strong>14566</strong> (24x7 Multi-lingual IVRS Active) &bull; Pune District Nodal Office
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{ marginTop: 6, background: 'rgb(0, 115, 230)', color: '#FFF', border: 'none', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Close Guidance Manual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
