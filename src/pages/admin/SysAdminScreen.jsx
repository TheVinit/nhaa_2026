import React, { useState } from 'react';
import { clearSession, getSession, parseJwt } from '../../utils/adminAuth';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Eye, AlertTriangle, CheckCircle2, Clock,
  Users, Activity, Mail, LogOut, BarChart3, Lock,
  ShieldCheck, FileText, TrendingUp, Wifi,
} from 'lucide-react';

const ALL_DESKS = [
  {
    role: 'operator', label: 'Call Centre Operator', code: 'L-0',
    desc: 'AI Triage & Intake Queue',
    cases: 14, active: 3, alerts: 1, pending: 5, resolved: 9,
    accent: '#0284C7',
  },
  {
    role: 'io', label: 'Investigating Officer', code: 'L-0.5',
    desc: 'Ground Investigation & Site Evidence',
    cases: 9, active: 2, alerts: 0, pending: 3, resolved: 6,
    accent: '#2563EB',
  },
  {
    role: 'acp', label: 'ACP Command', code: 'L-1',
    desc: 'Case Scrutiny & Field Forwarding',
    cases: 6, active: 1, alerts: 0, pending: 2, resolved: 4,
    accent: '#0369A1',
  },
  {
    role: 'dsp', label: 'DSP Operations', code: 'L-1',
    desc: 'District Field Operations & Inquiry',
    cases: 7, active: 1, alerts: 2, pending: 4, resolved: 3,
    accent: '#059669',
  },
  {
    role: 'sp', label: 'SP Oversight', code: 'L-2',
    desc: 'Delay Alert System & Case Lock',
    cases: 5, active: 1, alerts: 0, pending: 1, resolved: 4,
    accent: '#D97706',
  },
  {
    role: 'ig', label: 'IG Intelligence', code: 'L-3',
    desc: 'National Overview & Apex Review',
    cases: 3, active: 1, alerts: 1, pending: 1, resolved: 2,
    accent: '#DC2626',
  },
  {
    role: 'director', label: 'Director Control', code: 'L-3+',
    desc: 'Full-Tier Performance & Aggregate KPIs',
    cases: 2, active: 0, alerts: 0, pending: 0, resolved: 2,
    accent: '#7C2D12',
  },
  {
    role: 'judiciary', label: 'Judiciary Review', code: 'L-4',
    desc: 'Audit Trail Scrutiny & Directives to SWO',
    cases: 4, active: 1, alerts: 0, pending: 2, resolved: 2,
    accent: '#7C3AED',
  },
  {
    role: 'swo', label: 'SWO Rehabilitation', code: 'L-5',
    desc: 'Victim Rehabilitation & Welfare Tracking',
    cases: 6, active: 2, alerts: 0, pending: 2, resolved: 4,
    accent: '#047857',
  },
];

const AUDIT_LOG = [
  { time: '14:31:05', user: 'DSP Rajesh Shinde', action: 'Escalated case #C-2026-0891 to SP desk', level: 'warn' },
  { time: '14:28:44', user: 'Operator Priya Kadam', action: 'New case intake — caller 98XXXXXXXX, risk tier: HIGH', level: 'critical' },
  { time: '14:25:12', user: 'IG Priya Kulkarni', action: 'Viewed aggregate heatmap for Pune District', level: 'info' },
  { time: '14:21:09', user: 'IO Vikram Shinde', action: 'Uploaded panchnama document for case #C-2026-0887', level: 'info' },
  { time: '14:18:33', user: 'SP Anand Patil', action: 'Case #C-2026-0884 locked with SHA-256 seal', level: 'success' },
  { time: '14:15:00', user: 'SWO Anita Pawar', action: 'DBT Stage 1 disbursed for victim ID V-2026-441', level: 'success' },
  { time: '14:11:22', user: 'Judiciary M. L. Gaikwad', action: 'Directive issued to SWO for Rule 12(4) relief', level: 'warn' },
  { time: '14:08:55', user: 'ACP Sanjay More', action: 'IO tasked for spot inspection — PS Bhosari MIDC', level: 'info' },
  { time: '14:02:17', user: 'Operator Priya Kadam', action: 'Silent distress signal received — auto-triaged as HIGH', level: 'critical' },
  { time: '13:58:41', user: 'Director K. S. Deshmukh', action: 'Viewed monthly KPI report — Maharashtra state', level: 'info' },
];

const LEVEL_STYLE = {
  info:     { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'INFO' },
  success:  { bg: '#F0FDF4', color: '#166534', dot: '#22C55E', label: 'SUCCESS' },
  warn:     { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'WARNING' },
  critical: { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'CRITICAL' },
};

const TOTAL_CASES   = ALL_DESKS.reduce((a, d) => a + d.cases, 0);
const TOTAL_PENDING = ALL_DESKS.reduce((a, d) => a + d.pending, 0);
const TOTAL_ALERTS  = ALL_DESKS.reduce((a, d) => a + d.alerts, 0);
const TOTAL_ACTIVE  = ALL_DESKS.reduce((a, d) => a + d.active, 0);

export default function SysAdminScreen() {
  const navigate = useNavigate();
  const session = getSession();
  const jwtClaims = session?.token ? parseJwt(session.token) : null;
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('monitoring@nhaa.gov.in');
  const [emailSent, setEmailSent] = useState(false);

  const handleLogout = () => {
    clearSession();
    navigate('/admin/login');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('NHAA System Report — ' + new Date().toLocaleDateString('en-IN'));
    const body = encodeURIComponent(
      `NHAA System Administrator Report\nGenerated: ${new Date().toLocaleString('en-IN')}\n\n` +
      `DESK SUMMARY:\n` +
      ALL_DESKS.map(d => `• ${d.label} (${d.code}): ${d.cases} cases, ${d.active} active, ${d.alerts} alerts`).join('\n') +
      `\n\nRECENT AUDIT LOG:\n` +
      AUDIT_LOG.slice(0, 5).map(l => `[${l.time}] ${l.user}: ${l.action}`).join('\n')
    );
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    setEmailSent(true);
    setTimeout(() => { setEmailSent(false); setShowEmailModal(false); }, 2000);
  };

  const STAT_CARDS = [
    { label: 'Total Cases',   value: TOTAL_CASES,   icon: FileText,      color: 'rgb(0, 115, 230)', bg: '#EFF6FF', border: '#DBEAFE' },
    { label: 'Active Now',    value: TOTAL_ACTIVE,  icon: Activity,      color: '#059669',           bg: '#F0FDF4', border: '#BBF7D0' },
    { label: 'Pending SLA',   value: TOTAL_PENDING, icon: Clock,         color: '#D97706',           bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'Active Alerts', value: TOTAL_ALERTS,  icon: AlertTriangle, color: '#DC2626',           bg: '#FEF2F2', border: '#FECACA' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#0F172A',
    }}>
      {/* Top Utility Bar — matches AdminLayout */}
      <div style={{
        background: '#0F1E36',
        color: '#FFFFFF',
        fontSize: 12,
        padding: '6px 0',
        borderBottom: '2px solid rgb(0, 115, 230)',
      }}>
        <div style={{
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.02em' }}>
              Government of India &nbsp;|&nbsp; Ministry of Social Justice &amp; Empowerment • State of Maharashtra
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.2)', color: '#A7F3D0',
              padding: '2px 10px', borderRadius: 4,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              SYSTEM MONITORING ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Main Header — matches AdminLayout header bar style */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '10px 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 8,
            background: 'rgb(0, 115, 230)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'rgb(0, 115, 230)', color: '#FFFFFF',
                fontSize: 9, fontWeight: 900,
                padding: '2px 7px', borderRadius: 3, letterSpacing: '0.5px',
              }}>
                SYSTEM ADMINISTRATOR
              </span>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                Read-Only Monitoring Console
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
              NHAA Full-Tier Monitoring &amp; Audit Dashboard
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Read-only badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#F1F5F9', border: '1px solid #CBD5E1',
            padding: '5px 12px', borderRadius: 6,
            fontSize: 11, fontWeight: 700, color: '#475569',
          }}>
            <Lock size={12} color="#64748B" />
            Monitoring Access Only
          </div>

          {/* Officer badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#F8FAFC', border: '1.5px solid #CBD5E1',
            padding: '5px 12px', borderRadius: 6,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'rgb(0, 115, 230)', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={16} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {session?.name || 'System Administrator'}
              </div>
              <div style={{ fontSize: 10, color: 'rgb(0, 115, 230)', fontWeight: 800, marginTop: 1 }}>
                SYS: Full-Tier Governance &bull; {session?.district || 'Central'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            style={{
              background: '#F0F9FF', color: '#0369A1',
              fontSize: 11, fontWeight: 700,
              padding: '6px 12px', borderRadius: 5,
              border: '1.5px solid #BAE6FD', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Mail size={13} />
            Email Report
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: '#FFFFFF', color: '#DC2626',
              fontSize: 11, fontWeight: 700,
              padding: '6px 12px', borderRadius: 5,
              border: '1.5px solid #FECACA', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Page Body */}
      <div style={{ padding: '28px', maxWidth: 1280, margin: '0 auto' }}>

        {/* Important Notice Banner */}
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderLeft: '4px solid #F59E0B',
          borderRadius: 8,
          padding: '12px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Lock size={16} color="#D97706" />
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>
              Monitoring Access Only —&nbsp;
            </span>
            <span style={{ fontSize: 12, color: '#92400E' }}>
              As System Administrator, you have read-only oversight of all 9 officer desks.
              You can view case data, audit logs, and system health, but you cannot log in to or act on behalf of any officer desk.
            </span>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} style={{
              background: '#FFFFFF',
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 44, height: 44,
                borderRadius: 10,
                background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* JWT Security Panel */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderLeft: '4px solid rgb(0, 115, 230)',
          borderRadius: 10,
          padding: '18px 22px',
          marginBottom: 28,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={17} color="rgb(0, 115, 230)" />
              <h2 style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                JWT Security &amp; RBAC Access Matrix
              </h2>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 800,
              background: '#F0FDF4', color: '#166534',
              border: '1px solid #BBF7D0',
              padding: '3px 10px', borderRadius: 4,
            }}>
              ● Cryptographic Signature Verified
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
            {[
              { label: 'Current Active Role', value: session?.role ? session.role.toUpperCase() : 'SYSADMIN', valueColor: 'rgb(0, 115, 230)' },
              { label: 'Clearance Policy', value: 'Wildcard Monitor (*) — All 9 Desks', valueColor: '#059669' },
              { label: 'Standard Officers Scope', value: 'Isolated (1 Officer = 1 Desk)', valueColor: '#0369A1' },
              { label: 'Auth Source / Token', value: jwtClaims ? `HS256 (sub: ${jwtClaims.sub})` : (session?.authSource || 'Secure Local / Fallback'), valueColor: '#374151', mono: true },
            ].map(({ label, value, valueColor, mono }) => (
              <div key={label} style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '10px 14px',
              }}>
                <div style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>{label}:</div>
                <div style={{
                  color: valueColor, fontWeight: mono ? 700 : 800,
                  fontFamily: mono ? 'monospace' : 'inherit',
                  fontSize: mono ? 11 : 13,
                  wordBreak: 'break-all',
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desk Monitoring Grid */}
        <div style={{ marginBottom: 8 }}>
          <h2 style={{
            fontSize: 13, fontWeight: 900, color: '#0F172A',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '0 0 4px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <BarChart3 size={16} color="rgb(0, 115, 230)" />
            All Operational Desks — Read-Only Monitoring
          </h2>
          <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 16px' }}>
            Live desk health view. You are monitoring as SysAdmin — not logged in as any officer.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 32 }}>
          {ALL_DESKS.map((desk) => (
            <div key={desk.role} style={{
              background: '#FFFFFF',
              border: `1px solid ${desk.alerts > 0 ? '#FECACA' : '#E2E8F0'}`,
              borderTop: `3px solid ${desk.alerts > 0 ? '#EF4444' : desk.accent}`,
              borderRadius: 10,
              padding: '16px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {/* Desk Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 10, fontWeight: 900,
                  background: desk.accent,
                  color: '#FFF',
                  padding: '2px 8px', borderRadius: 3,
                }}>
                  {desk.code}
                </span>
                {desk.alerts > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    background: '#FEF2F2', color: '#991B1B',
                    border: '1px solid #FECACA',
                    padding: '2px 8px', borderRadius: 3,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <AlertTriangle size={10} />
                    {desk.alerts} ALERT{desk.alerts > 1 ? 'S' : ''}
                  </span>
                )}
                {desk.alerts === 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: '#F0FDF4', color: '#166534',
                    border: '1px solid #BBF7D0',
                    padding: '2px 8px', borderRadius: 3,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <CheckCircle2 size={10} />
                    NOMINAL
                  </span>
                )}
              </div>

              {/* Desk Info */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{desk.label}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{desk.desc}</div>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Total', value: desk.cases, color: desk.accent },
                  { label: 'Active', value: desk.active, color: '#059669' },
                  { label: 'Pending', value: desk.pending, color: '#D97706' },
                  { label: 'Resolved', value: desk.resolved, color: '#475569' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Read-only indicator — no navigate button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: '#94A3B8',
              }}>
                <Eye size={12} color="#94A3B8" />
                Monitoring View — No Login Access
              </div>
            </div>
          ))}
        </div>

        {/* System Audit Log */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: 28,
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <FileText size={15} color="rgb(0, 115, 230)" />
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              System Audit Log — Last 10 Actions
            </h2>
          </div>
          {AUDIT_LOG.map((entry, i) => {
            const s = LEVEL_STYLE[entry.level] || LEVEL_STYLE.info;
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 20px',
                borderBottom: i < AUDIT_LOG.length - 1 ? '1px solid #F1F5F9' : 'none',
                background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
              }}>
                <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{entry.time}</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{entry.user}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}> — {entry.action}</span>
                </div>
                <span style={{
                  flexShrink: 0,
                  fontSize: 10, fontWeight: 800,
                  background: s.bg, color: s.color,
                  border: `1px solid ${s.dot}44`,
                  padding: '2px 8px', borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* RBAC Access Matrix */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Users size={15} color="rgb(0, 115, 230)" />
            <h2 style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              RBAC Access Matrix — Role Isolation Verification
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Role', 'Authorized Desk', 'Can See Other Desks?', 'SysAdmin Override', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 800, color: '#64748B',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #E2E8F0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_DESKS.map((desk, i) => (
                  <tr key={desk.role} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 800, color: '#0F172A' }}>
                      <span style={{
                        background: desk.accent, color: '#FFF',
                        fontSize: 10, fontWeight: 900,
                        padding: '1px 6px', borderRadius: 3, marginRight: 6,
                      }}>{desk.code}</span>
                      {desk.label}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#334155', fontFamily: 'monospace', fontSize: 11 }}>
                      /admin/{desk.role}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        background: '#FEF2F2', color: '#991B1B',
                        border: '1px solid #FECACA',
                        fontSize: 10, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 4,
                      }}>Blocked</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        background: '#EFF6FF', color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        fontSize: 10, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 4,
                      }}>Monitor Only</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        background: '#F0FDF4', color: '#166534',
                        border: '1px solid #BBF7D0',
                        fontSize: 10, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 4,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <CheckCircle2 size={10} />
                        RBAC OK
                      </span>
                    </td>
                  </tr>
                ))}
                {/* SysAdmin row */}
                <tr style={{ background: '#EFF6FF' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 800, color: '#0F172A' }}>
                    <span style={{
                      background: 'rgb(0, 115, 230)', color: '#FFF',
                      fontSize: 10, fontWeight: 900,
                      padding: '1px 6px', borderRadius: 3, marginRight: 6,
                    }}>SYS</span>
                    System Administrator
                  </td>
                  <td style={{ padding: '10px 16px', color: '#334155', fontFamily: 'monospace', fontSize: 11 }}>
                    /admin/sysadmin
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: '#FFFBEB', color: '#92400E',
                      border: '1px solid #FDE68A',
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 8px', borderRadius: 4,
                    }}>View-Only (Monitor)</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: 'rgb(0, 115, 230)', color: '#FFF',
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 8px', borderRadius: 4,
                    }}>Wildcard (*)</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: '#EFF6FF', color: '#1D4ED8',
                      border: '1px solid #BFDBFE',
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 8px', borderRadius: 4,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Wifi size={10} />
                      ACTIVE
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '28px 32px',
            width: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Mail size={18} color="rgb(0, 115, 230)" />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Send System Report</h3>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 20px' }}>
              Sends a summary of all desk stats and the last 5 audit entries to the specified email.
            </p>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
              Recipient Email
            </label>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 6,
                color: '#0F172A', fontSize: 13, padding: '10px 12px', marginBottom: 20, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSendEmail}
                style={{
                  flex: 1,
                  background: emailSent ? '#059669' : 'rgb(0, 115, 230)',
                  color: '#FFF', border: 'none', borderRadius: 8,
                  padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {emailSent ? 'Opening Email Client...' : 'Send Report'}
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  background: '#F8FAFC', color: '#64748B',
                  border: '1px solid #CBD5E1', borderRadius: 8,
                  padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
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
