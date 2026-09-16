import React, { useState, useEffect } from 'react';
import { clearSession, getSession, parseJwt } from '../../utils/adminAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, Eye, AlertTriangle, CheckCircle2, Clock,
  Users, Activity, Mail, LogOut, BarChart3, Lock,
  ShieldCheck, FileText, TrendingUp, Wifi, Settings, UserPlus, Pencil, Trash2, Search, Copy, RotateCcw,
} from 'lucide-react';
import AdminSettingsModal, { getAdminTheme, setAdminTheme } from '../../components/admin/AdminSettingsModal';
import { createOfficer, deactivateOfficer, listOfficers, updateOfficer } from '../../services/api';

const ALL_DESKS = [
  {
    role: 'operator', label: 'Call Centre Operator', code: 'L-0',
    desc: 'AI Triage & Intake Queue (14566 IVRS, Portal, Chatbot)',
    cases: 247, active: 38, alerts: 14, pending: 86, approved: 161, resolved: 161,
    accent: '#0284C7',
  },
  {
    role: 'io', label: 'Investigating Officer', code: 'L-0.5',
    desc: 'Ground Investigation & Site Evidence Collection',
    cases: 143, active: 22, alerts: 5, pending: 52, approved: 91, resolved: 91,
    accent: '#2563EB',
  },
  {
    role: 'dsp', label: 'DSP Operations', code: 'L-1',
    desc: 'Pune District Field Operations & 60-Day Inquiry Mandate',
    cases: 98, active: 14, alerts: 8, pending: 36, approved: 62, resolved: 62,
    accent: '#059669',
  },
  {
    role: 'acp', label: 'ACP Command', code: 'L-1',
    desc: 'Case Scrutiny & Field Task Force Forwarding',
    cases: 74, active: 11, alerts: 3, pending: 27, approved: 47, resolved: 47,
    accent: '#0369A1',
  },
  {
    role: 'sp', label: 'SP Oversight', code: 'L-2',
    desc: 'Pre-Judiciary Delay Alert & SHA-256 Case Lock',
    cases: 52, active: 7, alerts: 2, pending: 19, approved: 33, resolved: 33,
    accent: '#D97706',
  },
  {
    role: 'ig', label: 'IG Intelligence', code: 'L-3',
    desc: 'Maharashtra State Heatmap & Apex Policy Review',
    cases: 31, active: 4, alerts: 3, pending: 11, approved: 20, resolved: 20,
    accent: '#DC2626',
  },
  {
    role: 'director', label: 'Director Control', code: 'L-3+',
    desc: 'All-India Aggregate KPIs & National Performance Audit',
    cases: 18, active: 2, alerts: 1, pending: 6, approved: 12, resolved: 12,
    accent: '#7C2D12',
  },
  {
    role: 'judiciary', label: 'Judiciary Review', code: 'L-4',
    desc: 'Sealed Evidence Scrutiny & SWO Binding Directives',
    cases: 26, active: 5, alerts: 1, pending: 10, approved: 16, resolved: 16,
    accent: '#7C3AED',
  },
  {
    role: 'swo', label: 'SWO Rehabilitation', code: 'L-5',
    desc: 'Victim 3-Stage DBT & Scheme Linkages (Rule 12(4))',
    cases: 89, active: 19, alerts: 2, pending: 31, approved: 58, resolved: 58,
    accent: '#047857',
  },
];

const USER_ROLE_OPTIONS = [
  { value: 'operator', label: 'Call Centre Operator (L-0)' },
  { value: 'io', label: 'Investigating Officer (L-0.5)' },
  { value: 'dsp', label: 'Deputy Superintendent of Police (L-1)' },
  { value: 'acp', label: 'Assistant Commissioner of Police (L-1)' },
  { value: 'sp', label: 'Superintendent of Police (L-2)' },
  { value: 'ig', label: 'Inspector General of Police (L-3)' },
  { value: 'director', label: 'Director, Central Oversight (L-3+)' },
  { value: 'judiciary', label: 'Judiciary / Special Court (L-4)' },
  { value: 'swo', label: 'Social Welfare Officer (L-5)' },
  { value: 'sysadmin', label: 'System Administrator (SYS)' },
  { value: 'super_admin', label: 'Super Administrator (SYS+)' },
];

const DEFAULT_USER_ROWS = [
  { id: 'seed-operator', name: 'Priya Kadam', role: 'operator', mobile: '9876543210', username: 'operator', district: 'Pune District', state: 'Maharashtra', badgeId: 'L0-001', isActive: true, source: 'System' },
  { id: 'seed-io', name: 'Vikram Shinde', role: 'io', mobile: '9876543211', username: 'io', district: 'Pune District', state: 'Maharashtra', badgeId: 'L05-001', isActive: true, source: 'System' },
  { id: 'seed-dsp', name: 'Rajesh Shinde', role: 'dsp', mobile: '9876543212', username: 'dsp', district: 'Pune District', state: 'Maharashtra', badgeId: 'L1-001', isActive: true, source: 'System' },
  { id: 'seed-acp', name: 'Sanjay More', role: 'acp', mobile: '9876543213', username: 'acp', district: 'Pune District', state: 'Maharashtra', badgeId: 'L1-002', isActive: true, source: 'System' },
  { id: 'seed-sp', name: 'Anand Patil', role: 'sp', mobile: '9876543214', username: 'sp', district: 'Pune Rural', state: 'Maharashtra', badgeId: 'L2-001', isActive: true, source: 'System' },
  { id: 'seed-ig', name: 'Priya Kulkarni', role: 'ig', mobile: '9876543215', username: 'ig', district: '', state: 'Maharashtra', badgeId: 'L3-001', isActive: true, source: 'System' },
  { id: 'seed-director', name: 'K. S. Deshmukh', role: 'director', mobile: '9876543216', username: 'director', district: '', state: 'All India', badgeId: 'L3P-001', isActive: true, source: 'System' },
  { id: 'seed-judiciary', name: 'M. L. Gaikwad', role: 'judiciary', mobile: '9876543217', username: 'judiciary', district: 'Pune', state: 'Maharashtra', badgeId: 'L4-001', isActive: true, source: 'System' },
  { id: 'seed-swo', name: 'Anita Pawar', role: 'swo', mobile: '9876543218', username: 'swo', district: 'Pune District', state: 'Maharashtra', badgeId: 'L5-001', isActive: true, source: 'System' },
  { id: 'seed-sysadmin', name: 'NHAA Central Command', role: 'sysadmin', mobile: '14566', username: 'sysadmin', district: 'National Command', state: 'All India', badgeId: 'SYS-001', isActive: true, source: 'System' },
];

const MANAGED_USERS_KEY = 'nhaa_managed_users';

const AUDIT_LOG = [
  { time: '14:31:05', user: 'DSP Rajesh Shinde', action: 'Escalated case #C-2026-0891 to SP desk — assault at Bhosari MIDC', level: 'warn' },
  { time: '14:28:44', user: 'Operator Priya Kadam', action: 'New IVRS intake — caller 98XXXXXXXX (Janwadi), SVI 94.5 CRITICAL', level: 'critical' },
  { time: '14:25:12', user: 'IG Priya Kulkarni', action: 'Viewed district-wise atrocity heatmap — Maharashtra state', level: 'info' },
  { time: '14:21:09', user: 'IO Vikram Shinde', action: 'Uploaded spot panchnama PDF + 3 witness videos (Case #C-2026-0887)', level: 'info' },
  { time: '14:18:33', user: 'SP Anand Patil', action: 'Case #C-2026-0884 pre-judiciary locked with SHA-256 seal (hash: 0xA9F3…E812)', level: 'success' },
  { time: '14:15:00', user: 'SWO Anita Pawar', action: 'DBT Stage 1 ₹85,000 disbursed via PFMS — Victim V-2026-441 (Wagholi)', level: 'success' },
  { time: '14:11:22', user: 'Judiciary M. L. Gaikwad', action: 'Rule 12(4) directive — ₹4.25 lakh interim compensation to SWO', level: 'warn' },
  { time: '14:08:55', user: 'ACP Sanjay More', action: 'IO Vikram Shinde tasked — spot inspection PS Bhosari MIDC + medical MLC', level: 'info' },
  { time: '14:02:17', user: 'Operator Priya Kadam', action: 'Silent distress signal #S-2026-2211 received — auto-escalated to PCR van (HIGH)', level: 'critical' },
  { time: '13:58:41', user: 'Director K. S. Deshmukh', action: 'Reviewed monthly KPI dashboard — 89.2% SLA compliance, ₹2.87 Cr DBT disbursed', level: 'info' },
  { time: '13:55:20', user: 'SP Anand Patil', action: 'Approved 4 charge-sheets — Sec 3(2)(v) & IPC 323 (Pune Rural)', level: 'success' },
  { time: '13:52:10', user: 'SWO Anita Pawar', action: 'Linked 3 beneficiaries to PM-AJAY & Post-Matric Scholarship schemes', level: 'info' },
  { time: '13:48:55', user: 'IO Vikram Shinde', action: 'FIR zero-time registered at PS Shikrapur — Sec 3(1)(g) land dispossession', level: 'info' },
  { time: '13:45:30', user: 'DSP Rajesh Shinde', action: '60-day Sec 4 mandate alert — 3 cases requiring charge-sheet next week', level: 'warn' },
  { time: '13:42:18', user: 'Operator Priya Kadam', action: 'Mobile app intake — 6 bonded labourers rescued at Daund sugarcane farm (HIGH)', level: 'critical' },
];

const LEVEL_STYLE = {
  info:     { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'INFO' },
  success:  { bg: '#F0FDF4', color: '#166534', dot: '#22C55E', label: 'SUCCESS' },
  warn:     { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'WARNING' },
  critical: { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'CRITICAL' },
};

function readManagedUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(MANAGED_USERS_KEY) || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function writeManagedUsers(users) {
  localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(users));
}

function generatePassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '@#$%&*?';
  const pick = (source) => source[Math.floor(Math.random() * source.length)];
  return `${pick(letters)}${pick(letters)}${pick(numbers)}${pick(symbols)}${pick(letters)}${pick(numbers)}${pick(letters)}${pick(symbols)}${pick(letters)}${pick(numbers)}`;
}

function getRoleLabel(role) {
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

const TOTAL_CASES      = ALL_DESKS.reduce((a, d) => a + d.cases, 0);
const TOTAL_PENDING    = ALL_DESKS.reduce((a, d) => a + d.pending, 0);
const TOTAL_ALERTS     = ALL_DESKS.reduce((a, d) => a + d.alerts, 0);
const TOTAL_ACTIVE     = ALL_DESKS.reduce((a, d) => a + d.active, 0);
const TOTAL_APPROVED   = ALL_DESKS.reduce((a, d) => a + (d.approved ?? d.resolved), 0);
const TOTAL_RESOLVED   = ALL_DESKS.reduce((a, d) => a + d.resolved, 0);
const TOTAL_ESCALATED  = Math.floor(TOTAL_PENDING * 0.42);
const SLA_COMPLIANCE   = 89.2;

export default function SysAdminScreen({ embedded = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const jwtClaims = session?.token ? parseJwt(session.token) : null;
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') || 'overview';
  const showOfficerManagement = currentView === 'officers';

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [emailTo, setEmailTo] = useState('monitoring@nhaa.gov.in');
  const [emailSent, setEmailSent] = useState(false);
  const [theme, setTheme] = useState(() => getAdminTheme());
  const [stationSettings, setStationSettings] = useState({
    stationName: 'NHAA Central Command (SYS)',
    audioAlerts: true,
    autoDispatchCritical: true,
    language: 'English',
  });
  const [managedUsers, setManagedUsers] = useState(() => readManagedUsers());
  const [apiUsers, setApiUsers] = useState([]);
  const [apiUsersLoading, setApiUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    mobile: '',
    role: 'io',
    username: '',
    password: '',
    district: 'Pune District',
    state: 'Maharashtra',
    badgeId: '',
    isActive: true,
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserSource, setEditingUserSource] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!session?.token) return;
    let active = true;
    setApiUsersLoading(true);
    listOfficers()
      .then((users) => {
        if (active && Array.isArray(users)) setApiUsers(users);
      })
      .catch(() => {
        if (active) setApiUsers([]);
      })
      .finally(() => {
        if (active) setApiUsersLoading(false);
      });
    return () => { active = false; };
  }, [session?.token]);

  const toggleTheme = () => {
    setTheme((previous) => {
      const next = previous === 'dark' ? 'light' : 'dark';
      setAdminTheme(next);
      return next;
    });
  };

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

  const handleUserFieldChange = (field, value) => {
    setUserForm((current) => ({
      ...current,
      [field]: field === 'mobile' ? value.replace(/\D/g, '').slice(0, 10) : value,
    }));
    setUserError('');
  };

  const handleSelectUser = (user) => {
    setUserForm({
      name: user.name || '',
      mobile: user.mobile || '',
      role: user.role || 'io',
      username: user.username || '',
      password: '',
      district: user.district || '',
      state: user.state || '',
      badgeId: user.badgeId || '',
      isActive: Boolean(user.isActive),
    });
    setEditingUserId(user.id);
    setEditingUserSource(user.source || 'System');
    setGeneratedPassword('');
    setUserMessage('');
    setUserError('');
  };

  const handleSaveUser = async () => {
    const name = userForm.name.trim();
    const mobile = userForm.mobile.trim();
    const role = userForm.role;
    const username = userForm.username.trim().toLowerCase();
    const password = userForm.password;
    const district = userForm.district.trim();
    const state = userForm.state.trim();
    const badgeId = userForm.badgeId.trim();

    if (!name || !mobile || !role || !username || !password) {
      setUserError('Name, mobile number, position, login ID, and password are required.');
      return;
    }
    if (mobile.length !== 10) {
      setUserError('Mobile number must contain exactly 10 digits.');
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
      setUserError('Login ID may contain letters, numbers, dots, underscores, and hyphens only.');
      return;
    }
    if (password.length < 6) {
      setUserError('Password must contain at least 6 characters.');
      return;
    }

    const existingByUsername = allUsers.find((user) => user.username?.toLowerCase() === username);
    if (existingByUsername && (!editingUserId || existingByUsername.id !== editingUserId)) {
      setUserError('This login ID is already assigned to another user.');
      return;
    }

    const apiPayload = {
      name,
      role,
      district: district || null,
      state: state || null,
      badge_id: badgeId || null,
      username,
      password,
    };
    const isApiEdit = editingUserSource === 'API' && typeof editingUserId === 'number';
    const isManagedEdit = managedUsers.some((user) => user.id === editingUserId);

    try {
      const saved = isApiEdit
        ? await updateOfficer(editingUserId, { ...apiPayload, ...(password ? { password } : {}) })
        : await createOfficer(apiPayload);
      const normalized = {
        ...saved,
        source: 'API',
        mobile: '',
        password: password || '',
        isActive: saved.is_active,
      };
      setApiUsers((current) => [
        ...current.filter((user) => user.id !== saved.id && user.username?.toLowerCase() !== username),
        normalized,
      ]);
      setGeneratedPassword(password);
      setUserMessage(`${username} saved to the central officer directory.`);
      setUserError('');
      setUserForm({
        name: '',
        mobile: '',
        role: 'io',
        username: '',
        password: '',
        district: 'Pune District',
        state: 'Maharashtra',
        badgeId: '',
        isActive: true,
      });
      setEditingUserId(null);
      setEditingUserSource('');
    } catch {
      const nextUsers = managedUsers.filter((user) => user.id !== editingUserId);
      const savedUser = {
        id: editingUserId?.startsWith('seed-') ? `managed-${username}` : (editingUserId || `managed-${Date.now()}`),
        name,
        mobile,
        role,
        username,
        password,
        district,
        state,
        badgeId,
        isActive: userForm.isActive,
        source: 'Managed',
        updatedAt: new Date().toISOString(),
      };
      nextUsers.push(savedUser);
      setManagedUsers(nextUsers);
      writeManagedUsers(nextUsers);
      setGeneratedPassword(password);
      setUserMessage(isManagedEdit || editingUserId ? `${username} updated locally for offline use.` : `${username} created locally for offline use.`);
      setUserError('');
      setUserForm({
        name: '',
        mobile: '',
        role: 'io',
        username: '',
        password: '',
        district: 'Pune District',
        state: 'Maharashtra',
        badgeId: '',
        isActive: true,
      });
      setEditingUserId(null);
      setEditingUserSource('');
    }
  };

  const handleResetUserForm = () => {
    setUserForm({
      name: '',
      mobile: '',
      role: 'io',
      username: '',
      password: '',
      district: 'Pune District',
      state: 'Maharashtra',
      badgeId: '',
      isActive: true,
    });
    setEditingUserId(null);
    setEditingUserSource('');
    setGeneratedPassword('');
    setUserMessage('');
    setUserError('');
  };

  const handleToggleUserActive = async (user) => {
    if (user.source === 'API' && session?.token) {
      try {
        const updated = await deactivateOfficer(user.id);
        setApiUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...updated, source: 'API', isActive: updated.is_active } : item));
        setUserMessage(`${user.username} is now inactive.`);
        return;
      } catch {
        setUserError('Unable to update account status on the server; saved locally instead.');
      }
    }
    const nextUsers = managedUsers.filter((item) => item.id !== user.id);
    nextUsers.push({ ...user, isActive: !user.isActive, updatedAt: new Date().toISOString() });
    setManagedUsers(nextUsers);
    writeManagedUsers(nextUsers);
    setUserMessage(`${user.username} is now ${!user.isActive ? 'active' : 'inactive'}.`);
  };

  const handleDeleteUser = (user) => {
    if (user.source === 'System' || user.source === 'API') return;
    const nextUsers = managedUsers.filter((item) => item.id !== user.id);
    setManagedUsers(nextUsers);
    writeManagedUsers(nextUsers);
    if (editingUserId === user.id) handleResetUserForm();
    setUserMessage(`User ${user.username} removed.`);
  };

  const handleResetUserPassword = async (user) => {
    const newPassword = generatePassword();
    if (user.source === 'API' && session?.token) {
      try {
        const updated = await updateOfficer(user.id, { password: newPassword });
        setApiUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...updated, source: 'API', password: newPassword } : item));
        setGeneratedPassword(newPassword);
        setUserMessage(`Temporary password generated for ${user.username}.`);
        return;
      } catch {
        setUserError('Unable to reset the server password; generated a local temporary password instead.');
      }
    }
    const nextUsers = managedUsers.filter((item) => item.id !== user.id);
    nextUsers.push({ ...user, password: newPassword, updatedAt: new Date().toISOString() });
    setManagedUsers(nextUsers);
    writeManagedUsers(nextUsers);
    setGeneratedPassword(newPassword);
    setUserMessage(`Temporary password generated for ${user.username}.`);
  };

  const handleCopyGeneratedPassword = () => {
    const value = generatedPassword || userForm.password;
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setUserMessage('Password copied to clipboard.');
  };

  const managedByUsername = new Map(managedUsers.map((user) => [user.username?.toLowerCase(), user]));
  const apiByUsername = new Map(apiUsers.map((user) => [user.username?.toLowerCase(), user]));
  const allUsers = [
    ...DEFAULT_USER_ROWS.map((user) => apiByUsername.get(user.username.toLowerCase()) || managedByUsername.get(user.username.toLowerCase()) || user),
    ...managedUsers.filter((user) => !DEFAULT_USER_ROWS.some((defaultUser) => defaultUser.username.toLowerCase() === user.username.toLowerCase()) && !apiByUsername.has(user.username.toLowerCase())),
    ...apiUsers.filter((user) => !DEFAULT_USER_ROWS.some((defaultUser) => defaultUser.username.toLowerCase() === user.username.toLowerCase()) && !managedByUsername.has(user.username.toLowerCase())),
  ].map((user) => ({
    ...user,
    source: user.source || (apiUsers.some((apiUser) => apiUser.username?.toLowerCase() === user.username?.toLowerCase()) ? 'API' : user.id?.toString().startsWith('managed-') ? 'Managed' : 'System'),
    mobile: user.mobile || '',
    password: user.password || '',
    isActive: user.isActive ?? user.is_active ?? true,
  }));
  const filteredUsers = allUsers.filter((user) => {
    const query = userFilter.trim().toLowerCase();
    if (!query) return true;
    return [user.name, user.username, user.role, user.district, user.state, user.badgeId]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  const STAT_CARDS = [
    { label: 'Total Cases',   value: TOTAL_CASES,      icon: FileText,      color: 'rgb(0, 115, 230)', bg: '#EFF6FF', border: '#DBEAFE', sublabel: 'All desks aggregated' },
    { label: 'Active Now',    value: TOTAL_ACTIVE,      icon: Activity,      color: '#059669',           bg: '#F0FDF4', border: '#BBF7D0', sublabel: 'Live investigations' },
    { label: 'Pending SLA',   value: TOTAL_PENDING,     icon: Clock,         color: '#D97706',           bg: '#FFFBEB', border: '#FDE68A', sublabel: 'Escalated + In Progress' },
    { label: 'Approved Cases', value: TOTAL_APPROVED,    icon: CheckCircle2,  color: '#0369A1',           bg: '#F0F9FF', border: '#BAE6FD', sublabel: 'Resolved + Charge-sheets' },
    { label: 'Active Alerts', value: TOTAL_ALERTS,    icon: AlertTriangle, color: '#DC2626',           bg: '#FEF2F2', border: '#FECACA', sublabel: 'High + Critical' },
    { label: `SLA ${SLA_COMPLIANCE}%`, value: 'A+', icon: TrendingUp,  color: '#047857',        bg: '#ECFDF5', border: '#A7F3D0', sublabel: '60-day §4 mandate' },
  ];

  return (
    <div
      className={theme === 'dark' ? 'admin-theme-dark' : ''}
      style={{
        minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#0F172A',
    }}>
      {!embedded && (
        <>
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
                Central Administration Console
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
            Central Administration
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
            onClick={() => setShowSettingsModal(true)}
            style={{
              background: '#F8FAFC', color: '#475569',
              fontSize: 11, fontWeight: 700,
              padding: '6px 12px', borderRadius: 5,
              border: '1.5px solid #CBD5E1', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Settings size={13} />
            Settings
          </button>

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
      </>
      )}

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
              As System Administrator, you have central oversight of all officer desks and the officer directory.
              You can monitor case data, audit logs, system health, and manage officer accounts from this console.
            </span>
          </div>
        </div>

        {embedded && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap', marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Actions</div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>Central controls for the officer directory and command console.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setShowEmailModal(true)} style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} /> Email Report
              </button>
              <button type="button" onClick={() => setShowSettingsModal(true)} style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Settings size={14} /> Settings
              </button>
              <button type="button" onClick={handleLogout} style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {showOfficerManagement && (
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '22px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={21} color="rgb(0, 115, 230)" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: 0 }}>Officer Directory &amp; User Management</h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0' }}>Create hierarchy accounts, assign positions, and manage secure login access.</p>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: apiUsersLoading ? '#B45309' : '#166534', background: apiUsersLoading ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${apiUsersLoading ? '#FDE68A' : '#BBF7D0'}`, padding: '4px 10px', borderRadius: 999 }}>
              {apiUsersLoading ? 'SYNCING DIRECTORY' : `${allUsers.length} ACCOUNTS`}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{editingUserId ? 'Edit Officer Account' : 'Create Officer Account'}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{editingUserId ? `Editing ${userForm.username || 'selected account'}` : 'Enter the officer details and generate a login.'}</div>
                </div>
                <UserPlus size={18} color="#2563EB" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={userForm.name} onChange={(e) => handleUserFieldChange('name', e.target.value)} placeholder="Officer full name" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={userForm.mobile} onChange={(e) => handleUserFieldChange('mobile', e.target.value)} placeholder="10-digit mobile" maxLength={10} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Position / Role <span style={{ color: '#EF4444' }}>*</span></label>
                  <select value={userForm.role} onChange={(e) => handleUserFieldChange('role', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }}>
                    {USER_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Login ID <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={userForm.username} onChange={(e) => handleUserFieldChange('username', e.target.value)} placeholder="e.g. io_pune_02" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Password <span style={{ color: '#EF4444' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="password" value={userForm.password} onChange={(e) => handleUserFieldChange('password', e.target.value)} placeholder="Minimum 6 characters" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                    <button type="button" onClick={() => { const generated = generatePassword(); handleUserFieldChange('password', generated); setGeneratedPassword(generated); }} title="Generate secure password" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 6, padding: '0 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Generate</button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Badge / Employee ID</label>
                  <input value={userForm.badgeId} onChange={(e) => handleUserFieldChange('badgeId', e.target.value)} placeholder="Optional official ID" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>District</label>
                  <input value={userForm.district} onChange={(e) => handleUserFieldChange('district', e.target.value)} placeholder="District or division" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>State</label>
                  <input value={userForm.state} onChange={(e) => handleUserFieldChange('state', e.target.value)} placeholder="State or All India" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 700, color: '#166534', paddingTop: 22 }}>
                  <input type="checkbox" checked={userForm.isActive} onChange={(e) => handleUserFieldChange('isActive', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#16A34A', cursor: 'pointer' }} /> Account active
                </label>
              </div>

              {userError && <div role="alert" style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 6, padding: '9px 11px', fontSize: 11.5, fontWeight: 700 }}>{userError}</div>}
              {userMessage && <div role="status" style={{ marginTop: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', borderRadius: 6, padding: '9px 11px', fontSize: 11.5, fontWeight: 700 }}>{userMessage}</div>}
              {generatedPassword && (
                <div style={{ marginTop: 12, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, padding: '9px 11px', fontSize: 11.5, color: '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span>Temporary password: <strong style={{ fontFamily: 'monospace' }}>{generatedPassword}</strong></span>
                  <button type="button" onClick={handleCopyGeneratedPassword} style={{ background: '#FFFFFF', border: '1px solid #FED7AA', color: '#C2410C', borderRadius: 5, padding: '4px 8px', fontSize: 10.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Copy size={11} /> Copy
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button type="button" onClick={handleSaveUser} style={{ flex: 1, background: '#003366', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ShieldCheck size={14} /> {editingUserId ? 'Save Changes' : 'Create Account'}
                </button>
                <button type="button" onClick={handleResetUserForm} style={{ background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Reset</button>
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} color="#64748B" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={userFilter} onChange={(e) => setUserFilter(e.target.value)} placeholder="Search name, login ID, role, district..." style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px 9px 30px', fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFFFFF', color: '#0F172A', outline: 'none' }} />
                </div>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap' }}>{filteredUsers.length} shown</span>
              </div>
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, minWidth: 760 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      {['Officer', 'Position', 'Mobile', 'Login ID', 'Jurisdiction', 'Badge', 'Status', 'Actions'].map((heading) => (
                        <th key={heading} style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={`${user.source || 'System'}-${user.username || user.id}`} style={{ borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                        <td style={{ padding: '9px 10px' }}><div style={{ fontWeight: 800, color: '#0F172A' }}>{user.name || '—'}</div><div style={{ fontSize: 10, color: '#94A3B8' }}>{user.source || 'System'}</div></td>
                        <td style={{ padding: '9px 10px', color: '#334155' }}>{getRoleLabel(user.role)}</td>
                        <td style={{ padding: '9px 10px', color: '#475569', fontFamily: 'monospace' }}>{user.mobile || '—'}</td>
                        <td style={{ padding: '9px 10px', color: '#0369A1', fontWeight: 700, fontFamily: 'monospace' }}>{user.username || '—'}</td>
                        <td style={{ padding: '9px 10px', color: '#64748B' }}>{[user.district, user.state].filter(Boolean).join(', ') || '—'}</td>
                        <td style={{ padding: '9px 10px', color: '#475569', fontFamily: 'monospace' }}>{user.badgeId || '—'}</td>
                        <td style={{ padding: '9px 10px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 999, background: user.isActive ? '#F0FDF4' : '#FEF2F2', color: user.isActive ? '#166534' : '#B91C1C', border: `1px solid ${user.isActive ? '#BBF7D0' : '#FECACA'}` }}>
                            {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button type="button" onClick={() => handleSelectUser(user)} title="Edit account" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><Pencil size={12} /></button>
                            <button type="button" onClick={() => handleToggleUserActive(user)} title={user.isActive ? 'Deactivate account' : 'Activate account'} style={{ background: user.isActive ? '#F0FDF4' : '#FEF2F2', color: user.isActive ? '#166534' : '#B91C1C', border: `1px solid ${user.isActive ? '#BBF7D0' : '#FECACA'}`, borderRadius: 5, padding: '4px 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><CheckCircle2 size={12} /></button>
                            <button type="button" onClick={() => handleResetUserPassword(user)} title="Generate temporary password" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><RotateCcw size={12} /></button>
                            <button type="button" onClick={() => handleDeleteUser(user)} disabled={user.source === 'System' || user.source === 'API'} title={user.source === 'System' || user.source === 'API' ? 'Use deactivate for directory accounts' : 'Remove managed account'} style={{ background: user.source === 'System' || user.source === 'API' ? '#F1F5F9' : '#FEF2F2', color: user.source === 'System' || user.source === 'API' ? '#CBD5E1' : '#B91C1C', border: `1px solid ${user.source === 'System' || user.source === 'API' ? '#E2E8F0' : '#FECACA'}`, borderRadius: 5, padding: '4px 6px', cursor: user.source === 'System' || user.source === 'API' ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center' }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredUsers.length && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 12 }}>No officer accounts match this search.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ─── SIH DEMO: Role Quick Switcher ───────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)',
          border: '1px solid #BFDBFE',
          borderLeft: '4px solid rgb(0, 115, 230)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0,115,230,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'rgb(0, 115, 230)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Users size={16} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎬 SIH 2026 Demo Quick Navigator
                </div>
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                  Jump directly to any hierarchical desk — no login required
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0369A1', background: '#FFFFFF', border: '1px solid #BAE6FD', padding: '3px 10px', borderRadius: 999 }}>
              {ALL_DESKS.length} DESKS AVAILABLE
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_DESKS.map((desk) => (
              <button
                key={desk.role}
                type="button"
                onClick={() => {
                  const target = desk.role === 'dsp' ? '/admin/district'
                    : desk.role === 'sp' ? '/admin/state'
                    : desk.role === 'ig' ? '/admin/ministry'
                    : `/admin/${desk.role}`;
                  navigate(target);
                }}
                style={{
                  background: '#FFFFFF',
                  border: `1.5px solid ${desk.accent}55`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#0F172A',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${desk.accent}15`;
                  e.currentTarget.style.borderColor = desk.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = `${desk.accent}55`;
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 900,
                  background: desk.accent, color: '#FFFFFF',
                  padding: '1px 5px', borderRadius: 3,
                }}>
                  {desk.code}
                </span>
                {desk.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, border, sublabel }) => (
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
                width: 48, height: 48,
                borderRadius: 12,
                background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginTop: 4 }}>{label}</div>
                {sublabel && (
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: 600 }}>{sublabel}</div>
                )}
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total', value: desk.cases, color: desk.accent },
                  { label: 'Active', value: desk.active, color: '#059669' },
                  { label: 'Pending', value: desk.pending, color: '#D97706' },
                  { label: 'Approved', value: desk.approved ?? desk.resolved, color: '#0369A1' },
                  { label: 'Resolved', value: desk.resolved, color: '#475569' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, minWidth: 50, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Navigate button */}
              <button
                type="button"
                onClick={() => {
                  const target = desk.role === 'dsp' ? '/admin/district'
                    : desk.role === 'sp' ? '/admin/state'
                    : desk.role === 'ig' ? '/admin/ministry'
                    : `/admin/${desk.role}`;
                  navigate(target);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: `${desk.accent}10`,
                  border: `1.5px solid ${desk.accent}55`,
                  color: desk.accent,
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 800,
                  marginTop: 12,
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = desk.accent;
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${desk.accent}10`;
                  e.currentTarget.style.color = desk.accent;
                }}
              >
                <Eye size={13} />
                Open {desk.label} Desk
              </button>
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

      {showSettingsModal && (
        <AdminSettingsModal
          session={session}
          roleLabel="System Administrator"
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setShowSettingsModal(false)}
          onLogout={handleLogout}
          stationSettings={stationSettings}
          setStationSettings={setStationSettings}
        />
      )}

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
