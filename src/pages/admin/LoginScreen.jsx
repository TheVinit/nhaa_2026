import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { ASSETS } from '../../assets';
import LoginForm from '../../components/admin/LoginForm';
import { authenticateMockUser, getManagedUsers } from '../../data/mockUsers';
import { loginOfficer } from '../../services/api';
import { getSession, setSession, getRedirectForRole } from '../../utils/adminAuth';
import { SENIOR_ROLES } from '../../utils/roleGuard';
import {
  Shield,
  ShieldCheck,
  Lock,
  Scale,
  HeartHandshake,
  UserCheck,
  Building2,
  FileCheck2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

function sessionFromLoginResponse(data) {
  const role = data.role || data.officer?.role;
  return {
    token: data.token || data.access_token,
    role,
    name: data.name || data.officer?.name,
    district: data.district ?? data.officer?.district ?? null,
    state: data.state ?? data.officer?.state ?? null,
    officer_id: data.officer_id ?? data.officer?.id,
    username: data.username,
    authSource: 'api',
  };
}

const HIERARCHY_TIERS = [
  {
    code: 'LEVEL 0',
    roleName: 'Operator',
    username: 'operator',
    title: 'Call Centre Dispatcher',
    scope: 'Acoustic voice triage, silent signal intake, emergency PCR dispatch',
    badgeBg: '#0284C7',
    icon: UserCheck,
    isSenior: false,
  },
  {
    code: 'LEVEL 0.5',
    roleName: 'IO (Police)',
    username: 'io',
    title: 'Investigating Officer',
    scope: 'PS Bhosari MIDC / Pune, spot panchnama, witness video statements',
    badgeBg: '#2563EB',
    icon: Shield,
    isSenior: false,
  },
  {
    code: 'LEVEL 1',
    roleName: 'DSP / ACP',
    username: 'dsp',
    title: 'Sub-Divisional Officer',
    scope: 'Pimpri Chinchwad, 60-day investigation mandate tracking (Sec 4)',
    badgeBg: '#059669',
    icon: ShieldCheck,
    isSenior: false,
  },
  {
    code: 'LEVEL 2',
    roleName: 'SP (District)',
    username: 'sp',
    title: 'Superintendent of Police',
    scope: 'Pune District, pre-judiciary case lock & SHA-256 seal freeze',
    badgeBg: '#D97706',
    icon: Lock,
    isSenior: false,
  },
  {
    code: 'LEVEL 3',
    roleName: 'Director / IG',
    username: 'director',
    title: 'Apex State Command',
    scope: 'Maharashtra PCR Cell, district atrocity heatmaps & analytics',
    badgeBg: '#DC2626',
    icon: Building2,
    isSenior: false,
  },
  {
    code: 'LEVEL 4',
    roleName: 'Judiciary',
    username: 'judiciary',
    title: 'Special Court Judge',
    scope: 'Shivajinagar Pune, sealed evidence review & SWO binding directives',
    badgeBg: '#7C3AED',
    icon: Scale,
    isSenior: false,
  },
  {
    code: 'LEVEL 5',
    roleName: 'SWO (Welfare)',
    username: 'swo',
    title: 'Social Welfare Officer',
    scope: 'Pune District, 3-Stage DBT disbursal (Rule 12(4)) & scheme linkages',
    badgeBg: '#047857',
    icon: HeartHandshake,
    isSenior: false,
  },
  {
    code: 'SYSTEM',
    roleName: 'System Admin',
    username: 'sysadmin',
    title: 'System Administrator (Full Oversight)',
    scope: 'All desks, audit logs, active sessions, real-time cross-tier monitoring',
    badgeBg: '#7C2D12',
    icon: ShieldCheck,
    isSenior: false,
  },
];

const MANAGED_LOGIN_TIERS = getManagedUsers()
  .filter((user) => user.isActive !== false)
  .map((user) => ({
    code: 'MANAGED',
    roleName: user.role,
    username: user.username,
    title: user.name,
    scope: `${user.district || 'Assigned jurisdiction'} • ${user.state || 'NHAA'}`,
    badgeBg: '#0F766E',
    icon: ShieldCheck,
    isSenior: false,
  }));

const LOGIN_TIERS = [
  ...HIERARCHY_TIERS,
  ...MANAGED_LOGIN_TIERS.filter((tier) => !HIERARCHY_TIERS.some((item) => item.username === tier.username)),
];

export default function LoginScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedUser, setSelectedUser] = useState('dsp');
  const existing = getSession();

  if (existing?.role) {
    return <Navigate to={getRedirectForRole(existing.role)} replace />;
  }

  const handleQuickSelect = (username) => {
    setSelectedUser(username);
    setError('');
  };

  const handleSubmit = async ({ username, password }) => {
    setError('');
    setBusy(true);

    // ── FAST PATH: try mock auth synchronously first (zero network wait) ──
    const mockUser = authenticateMockUser(username.trim(), password);
    if (mockUser) {
      setSession({ ...mockUser, token: null, authSource: 'mock' });
      navigate(getRedirectForRole(mockUser.role));
      setBusy(false);
      return;
    }

    // ── SLOW PATH: attempt live backend (800ms timeout) only if mock failed ──
    try {
      const data = await loginOfficer(username.trim(), password);
      const user = sessionFromLoginResponse(data);
      if (!user.token || !user.role) throw new Error('Login response missing token or role');
      setSession(user);
      navigate(getRedirectForRole(user.role));
    } catch {
      setError('Unable to authenticate. Please verify your officer credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* ── 1. Official National Tri-Color Header Ribbon ── */}
      <header style={{
        background: '#002B5B',
        color: '#FFFFFF',
        fontSize: 12,
        padding: '10px 28px',
        borderBottom: '3px solid #FF9933',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={ASSETS.indianFlag}
            alt="Flag of India"
            style={{ height: 14, width: 22, objectFit: 'cover', borderRadius: 2 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span style={{ fontWeight: 800, letterSpacing: '0.02em' }}>
            भारत सरकार | Government of India
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>&bull;</span>
          <span style={{ fontWeight: 600, color: '#E2E8F0' }}>
            सामाजिक न्याय और अधिकारिता मंत्रालय | Ministry of Social Justice &amp; Empowerment
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            color: '#10B981',
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            256-Bit SSL Encrypted &bull; NIC Certified
          </span>
          
          <Link
            to="/nhaa"
            style={{
              fontSize: 11,
              color: '#93C5FD',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Public Citizen Portal <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      {/* ── 2. Main Authentication Workstation ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        gap: 36,
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        flexWrap: 'wrap',
      }}>
        {/* Left Side: Official Statutory Command Overview & Quick Switcher */}
        <section aria-labelledby="dept-heading" style={{
          flex: '1 1 520px',
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #CBD5E1',
          padding: '32px 36px',
          boxShadow: '0 4px 20px rgba(0, 51, 102, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          {/* Emblem & Department Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1.5px solid #F1F5F9' }}>
            <img
              src={ASSETS.nationalEmblem}
              alt="National Emblem of India"
              style={{ height: 68, width: 'auto', flexShrink: 0 }}
              onError={(e) => { e.target.src = `${import.meta.env.BASE_URL}ashoka_emblem.jpg`; }}
            />
            <div>
              <div style={{ fontSize: 11, color: 'rgb(0, 115, 230)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                सत्यमेव जयते &bull; National Helpline Against Atrocities (NHAA 14566)
              </div>
              <h1 id="dept-heading" style={{ margin: '4px 0 2px', fontSize: 19, fontWeight: 900, color: '#0F172A', lineHeight: 1.3 }}>
                Central Command &amp; Multi-Tier Triage Portal
              </h1>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                SC/ST (Prevention of Atrocities) Act, 1989 (Amended 2016) &bull; Pune District &amp; Maharashtra
              </div>
            </div>
          </div>

          {/* Core Security & Governance Features */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={18} color="rgb(0, 115, 230)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 700 }}>
                Section 4 Public Servant 60-Day Investigation Mandate
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={18} color="#D97706" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 700 }}>
                SHA-256 Pre-Judiciary Cryptographic Case Lock
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale size={18} color="#7C3AED" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 700 }}>
                Special Court Sealed Trial Dossier &amp; Sec 15A Rights
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <HeartHandshake size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 700 }}>
                Rule 12(4) 3-Stage DBT Disbursal (PFMS Gateway)
              </div>
            </div>
          </div>

          {/* Interactive 1-Click Role Switcher for Fast Evaluation */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Role to Access Portal:
              </span>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Click any operational role below</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {LOGIN_TIERS.map((tier) => {
                const isSelected = selectedUser === tier.username;
                const TierIcon = tier.icon;
                return (
                  <button
                    key={tier.username}
                    type="button"
                    onClick={() => handleQuickSelect(tier.username)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: 6,
                      background: isSelected ? '#EFF6FF' : '#F8FAFC',
                      border: `1.5px solid ${isSelected ? 'rgb(0, 115, 230)' : '#E2E8F0'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 900,
                        background: tier.badgeBg,
                        color: '#FFFFFF',
                        padding: '2px 6px',
                        borderRadius: 3,
                        whiteSpace: 'nowrap',
                      }}>
                        {tier.code}
                      </span>
                      <div>
                        <strong style={{ fontSize: 12.5, color: '#0F172A' }}>{tier.roleName} &mdash; {tier.title}</strong>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{tier.scope}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} color={isSelected ? 'rgb(0, 115, 230)' : '#94A3B8'} />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Side: Secure Authentication Terminal */}
        <section aria-labelledby="auth-heading" style={{
          flex: '1 1 400px',
          maxWidth: 460,
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #CBD5E1',
          padding: '36px 32px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 800,
              color: 'rgb(0, 115, 230)',
              background: '#EFF6FF',
              padding: '3px 10px',
              borderRadius: 4,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid #BFDBFE',
            }}>
              Official Law Enforcement &amp; Judicial Login
            </span>
            <h2 id="auth-heading" style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A' }}>
              Officer Authentication
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#64748B' }}>
              Enter assigned departmental ID and password to access case docket.
            </p>
          </div>

          <LoginForm
            onSubmit={handleSubmit}
            error={error}
            busy={busy}
            initialUsername={selectedUser}
          />

          {/* Official Security Disclaimer */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #E2E8F0',
            fontSize: 11,
            color: '#64748B',
            lineHeight: 1.5,
            textAlign: 'center',
          }}>
            <Lock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
            Authorized Personnel Only. Access is logged under <strong>Section 43 &amp; 66 of Information Technology Act, 2000</strong>.
          </div>
        </section>
      </main>

      {/* ── 3. Official Government Footer ── */}
      <footer style={{
        background: '#0F172A',
        color: '#94A3B8',
        fontSize: 12,
        padding: '20px 28px',
        borderTop: '1px solid #1E293B',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          &copy; 2026 Ministry of Social Justice &amp; Empowerment, Government of India. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 11 }}>
          <Link to="/about-us" style={{ color: '#CBD5E1', textDecoration: 'none' }}>About NHAA</Link>
          <Link to="/contact-us" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Directory &amp; Support</Link>
          <a href="https://www.nic.in" target="_blank" rel="noreferrer" style={{ color: '#CBD5E1', textDecoration: 'none' }}>NIC Cloud Hosting</a>
        </div>
      </footer>
    </div>
  );
}
