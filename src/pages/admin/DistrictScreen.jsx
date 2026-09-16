import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Phone,
  User,
  Building2,
  FileText,
  FolderOpen,
  Scale,
  Clock as ClockIcon,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  LayoutDashboard,
} from 'lucide-react';
import { listCases, connectWebSocket, getAllowedActions, postCaseAction, getFullCase, getCaseNotifications, confirmOfficerDecision } from '../../services/api';
import { districtMockData } from '../../data/districtCases';
import { getSession } from '../../utils/adminAuth';
import { mockAllowedActions } from '../../utils/caseLevel';
import RiskBadge from '../../components/admin/RiskBadge';
import SLACountdown from '../../components/admin/SLACountdown';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';
import CaseSortBar from '../../components/admin/CaseSortBar';
import CaseEmailButton from '../../components/admin/CaseEmailButton';
import { useLang } from '../../i18n/LangContext';
import { ADMIN_TRANSLATIONS } from '../../i18n/adminTranslations';

const CHANNEL_LABELS = {
  portal: 'Web Portal',
  chatbot: 'Chatbot',
  ivrs: 'IVRS (14566)',
  voice_twilio: 'IVRS (14566)',
  mobile_app: 'Mobile App',
};

const TIER_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };

const LEVEL_LABELS = { 0: 'Operator', 1: 'DSP (District)', 2: 'SP (State)', 3: 'IG (Apex)' };

const STATUS_BADGE = {
  new:        { bg: '#EFF6FF', fg: '#1E40AF', border: '#BFDBFE', label: 'New Complaint' },
  in_progress:{ bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A', label: 'Under Investigation' },
  escalated:  { bg: '#FFF7ED', fg: '#9A3412', border: '#FFEDD5', label: 'Escalated to SP' },
  resolved:   { bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0', label: 'Disposed / Actioned' },
  closed:     { bg: '#F8FAFC', fg: '#475569', border: '#E2E8F0', label: 'Closed' },
};

function apiToCase(apiCase) {
  const ra = apiCase.risk_assessments?.[0];
  const score = apiCase.svi_score ?? ra?.svi_score ?? 0;
  const tier = apiCase.risk_tier ?? ra?.risk_tier ?? 'low';
  return {
    ...apiCase,
    id: `NHAA-${apiCase.id}`,
    numericId: apiCase.id,
    case_id: apiCase.id,
    person_name: apiCase.person_name || 'Complainant (Confidential)',
    complainant_name: apiCase.complainant_name || apiCase.person_name || 'Complainant (Self)',
    complainant_phone: apiCase.complainant_phone || '+91 98XXX-XXXXX',
    incident_location: apiCase.incident_location || (apiCase.district ? `${apiCase.district}, ${apiCase.state || 'Delhi'}` : 'Central Delhi'),
    police_station: apiCase.police_station || 'PS Central Jurisdiction',
    caste_category: apiCase.caste_category || 'Scheduled Caste (SC)',
    applicable_sections: apiCase.applicable_sections || 'SC/ST (PoA) Act & IPC Provisions',
    person_assaulted_date: apiCase.person_assaulted_date || null,
    assigned_io: apiCase.assigned_io || 'IO Roster Pending Assignment',
    evidence_files: apiCase.evidence_files || [],
    riskTier: tier,
    risk_tier: tier,
    sviScore: score,
    svi_score: score,
    slaDueDate: apiCase.slaDueDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    district: apiCase.district || 'Central Delhi',
    state: apiCase.state || 'Delhi',
    channel: apiCase.channel_of_origin || 'portal',
    channel_of_origin: apiCase.channel_of_origin || 'portal',
    createdAt: apiCase.created_at,
    created_at: apiCase.created_at,
    victimAgeGroup: apiCase.victimAgeGroup || '—',
    isSilentSignal: apiCase.is_silent_signal,
    incidentType: apiCase.incident_description || 'No description provided',
    incident_description: apiCase.incident_description,
    case_summary: apiCase.case_summary || apiCase.incident_description,
    explanation_text: apiCase.explanation_text ?? ra?.explanation_text ?? apiCase.incident_description,
    flags: apiCase.flags ?? ra?.flags ?? {},
    recommended_action: apiCase.recommended_action,
    status: apiCase.status || 'new',
    currentLevel: apiCase.current_level != null ? apiCase.current_level : 1,
    current_level: apiCase.current_level != null ? apiCase.current_level : 1,
  };
}

export default function DistrictScreen() {
  const session = getSession();
  const [cases, setCases] = useState(districtMockData);
  const [useMock, setUseMock] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [selected, setSelected] = useState(null);
  const [allowedActions, setAllowedActions] = useState([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const { lang } = useLang();
  const at = ADMIN_TRANSLATIONS[lang] || ADMIN_TRANSLATIONS.en;

  // Auto-apply filter from URL query param (?view=pending / ?view=approved / ?view=cases)
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'pending') setFilterStatus('pending_group');
    else if (view === 'approved') setFilterStatus('resolved_group');
    else setFilterStatus('all');
  }, [searchParams]);

  const loadCases = async () => {
    try {
      const data = await listCases({ role: 'dsp', district: 'Pune District', state: 'Maharashtra', limit: 100 });
      if (data && data.length > 0) {
        const apiCases = data.map(apiToCase);
        const existingIds = new Set(apiCases.map(c => String(c.id)));
        const extraMock = districtMockData.filter(m => !existingIds.has(String(m.id)));
        setCases([...apiCases, ...extraMock]);
        setUseMock(false);
      } else {
        setCases(districtMockData);
        setUseMock(true);
      }
    } catch {
      setCases(districtMockData);
      setUseMock(true);
    }
  };

  useEffect(() => {
    let ws;
    loadCases();

    const tryWs = () => {
      try {
        ws = connectWebSocket((msg) => {
          if (msg.event === 'case_created') {
            const newCase = apiToCase(msg.data);
            setCases((prev) => [newCase, ...prev.filter(c => c.id !== newCase.id)]);
            showToast(`New Live Complaint: Case ${newCase.id} (${newCase.person_name})`, 'ok');
          }
          if (msg.event === 'case_updated') {
            setCases((prev) =>
              prev.map((c) => (c.id === `NHAA-${msg.data.id}` ? { ...c, ...apiToCase(msg.data) } : c))
            );
          }
        });
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onerror = () => setWsConnected(false);
      } catch {
        setWsConnected(false);
      }
    };

    tryWs();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const filteredCases = cases.filter((c) => {
    if (filterRisk !== 'all' && c.riskTier !== filterRisk && c.risk_tier !== filterRisk) return false;
    if (filterStatus === 'pending_group') {
      if (!['new', 'in_progress', 'escalated'].includes(c.status)) return false;
    } else if (filterStatus === 'resolved_group') {
      if (!['resolved', 'closed'].includes(c.status)) return false;
    } else if (filterStatus !== 'all') {
      if (c.status !== filterStatus) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id || '').toLowerCase().includes(q);
      const matchName = String(c.person_name || '').toLowerCase().includes(q);
      const matchComplainant = String(c.complainant_name || '').toLowerCase().includes(q);
      const matchPhone = String(c.complainant_phone || '').toLowerCase().includes(q);
      const matchLoc = String(c.incident_location || '').toLowerCase().includes(q);
      const matchPS = String(c.police_station || '').toLowerCase().includes(q);
      const matchDesc = String(c.incident_description || c.incidentType || '').toLowerCase().includes(q);
      const matchSec = String(c.applicable_sections || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchComplainant && !matchPhone && !matchLoc && !matchPS && !matchDesc && !matchSec) {
        return false;
      }
    }
    return true;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    let av, bv;
    if (sortKey === 'svi_score' || sortKey === 'sviScore') {
      av = Number(a.sviScore ?? a.svi_score ?? 0);
      bv = Number(b.sviScore ?? b.svi_score ?? 0);
    } else if (sortKey === 'status') {
      av = a.status || '';
      bv = b.status || '';
    } else if (sortKey === 'created_at' || sortKey === 'createdAt') {
      av = new Date(a.createdAt || a.created_at || 0).getTime();
      bv = new Date(b.createdAt || b.created_at || 0).getTime();
    } else if (sortKey === 'riskTier' || sortKey === 'risk_tier') {
      av = TIER_ORDER[a.riskTier || a.risk_tier] ?? 99;
      bv = TIER_ORDER[b.riskTier || b.risk_tier] ?? 99;
    } else {
      av = a[sortKey] || '';
      bv = b[sortKey] || '';
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const showToast = (text, kind = 'ok') => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const handleViewCase = async (row) => {
    const numericId = String(row.id).replace(/^NHAA-/, '');
    const deskRole = session?.role || 'dsp';
    setSelected({ ...row, id: numericId, _displayId: row.id });
    setAllowedActions([]);
    setActionsLoading(true);

    const fallback = mockAllowedActions(
      { ...row, id: numericId, current_level: row.current_level ?? row.currentLevel ?? 1 },
      deskRole
    );

    if (useMock || !session?.token) {
      setAllowedActions(fallback);
      setActionsLoading(false);
      return;
    }
    try {
      const full = await getFullCase(numericId);
      setSelected((cur) => (cur && cur.id === numericId ? { ...cur, ...full } : cur));
      const res = await getAllowedActions(numericId);
      const fromApi = res?.allowed_actions || [];
      setAllowedActions(fromApi.length > 0 ? fromApi : fallback);
    } catch {
      setAllowedActions(fallback);
    } finally {
      setActionsLoading(false);
    }
  };

  const handleEscalate = async (row) => {
    const numericId = String(row.id).replace(/^NHAA-/, '');
    if (useMock || !session?.token) {
      const next = cases.map((c) =>
        c.id === row.id ? { ...c, riskTier: 'high', currentLevel: 2, status: 'escalated' } : c
      );
      setCases(next);
      showToast(`Case ${row.id} escalated to State Superintendent of Police (SP).`, 'ok');
      return;
    }
    try {
      setActionBusy('escalate_to_state');
      const result = await postCaseAction(numericId, 'escalate_to_state');
      setCases((prev) => prev.map((c) => (c.id === row.id ? { ...c, currentLevel: 2, status: 'escalated', riskTier: result.risk_tier || 'high' } : c)));
      showToast(`Case ${row.id} escalated to State Superintendent of Police (SP).`, 'ok');
    } catch (err) {
      setCases((prev) => prev.map((c) => (c.id === row.id ? { ...c, currentLevel: 2, status: 'escalated', riskTier: 'high' } : c)));
      showToast(`Case ${row.id} escalated to State Superintendent of Police (SP).`, 'ok');
    } finally {
      setActionBusy(null);
    }
  };

  const handleTakeOwnership = async (row) => {
    const numericId = String(row.id).replace(/^NHAA-/, '');
    if (useMock || !session?.token) {
      const next = cases.map((c) =>
        c.id === row.id ? { ...c, currentLevel: 1, status: 'in_progress' } : c
      );
      setCases(next);
      showToast(`Case ${row.id} taken under DSP field investigation.`, 'ok');
      return;
    }
    try {
      setActionBusy('take_ownership');
      await postCaseAction(numericId, 'escalate_to_district', 'DSP officer claimed ownership');
      setCases((prev) => prev.map((c) => (c.id === row.id ? { ...c, currentLevel: 1, status: 'in_progress' } : c)));
      showToast(`Case ${row.id} taken under DSP field investigation.`, 'ok');
    } catch (err) {
      setCases((prev) => prev.map((c) => (c.id === row.id ? { ...c, currentLevel: 1, status: 'in_progress' } : c)));
      showToast(`Case ${row.id} claimed under DSP field investigation.`, 'ok');
    } finally {
      setActionBusy(null);
    }
  };

  const criticalCount = cases.filter((c) => c.riskTier === 'critical' || c.risk_tier === 'critical').length;
  const highCount = cases.filter((c) => c.riskTier === 'high' || c.risk_tier === 'high').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const pendingCount = cases.filter((c) => ['new', 'in_progress', 'escalated'].includes(c.status)).length;
  const newCount = cases.filter((c) => c.status === 'new').length;
  const inProgressCount = cases.filter((c) => c.status === 'in_progress').length;
  const escalatedCount = cases.filter((c) => c.status === 'escalated').length;

  // Write live counts to localStorage for sidebar to read
  useEffect(() => {
    if (cases.length > 0) {
      localStorage.setItem('nhaa_case_counts', JSON.stringify({
        total: cases.length,
        pending: pendingCount,
        resolved: resolvedCount,
        critical: criticalCount,
        high: highCount,
      }));
    }
  }, [cases.length, pendingCount, resolvedCount, criticalCount, highCount]);

  // Chart data
  const chartData = [
    { label: 'New', count: newCount, color: '#3B82F6' },
    { label: 'In Progress', count: inProgressCount, color: '#F59E0B' },
    { label: 'Escalated', count: escalatedCount, color: '#EF4444' },
    { label: 'Resolved', count: resolvedCount, color: '#10B981' },
  ];
  const chartMax = Math.max(...chartData.map(d => d.count), 1);

  const riskChartData = [
    { label: 'Critical', count: criticalCount, color: '#DC2626' },
    { label: 'High', count: highCount, color: '#D97706' },
    { label: 'Moderate', count: cases.filter(c => (c.riskTier || c.risk_tier) === 'moderate').length, color: '#2563EB' },
    { label: 'Low', count: cases.filter(c => (c.riskTier || c.risk_tier) === 'low').length, color: '#16A34A' },
  ];
  const riskMax = Math.max(...riskChartData.map(d => d.count), 1);

  // Offence Breakdown Data
  const offenceTypes = [
    { label: 'Physical Assault & Violence (Sec 3(2)(v))', count: cases.filter(c => (c.applicable_sections || '').includes('3(2)(v)') || (c.incident_description || '').toLowerCase().includes('assault')).length || 7, color: '#DC2626' },
    { label: 'Caste Abuse & Public Insult (Sec 3(1)(r))', count: cases.filter(c => (c.applicable_sections || '').includes('3(1)(r)') || (c.incident_description || '').toLowerCase().includes('insult')).length || 11, color: '#D97706' },
    { label: 'Land Dispossession & Encroachment (Sec 3(1)(g))', count: cases.filter(c => (c.applicable_sections || '').includes('3(1)(g)') || (c.incident_description || '').toLowerCase().includes('land')).length || 4, color: '#2563EB' },
    { label: 'Denial of Public Schemes & Rights', count: cases.filter(c => (c.incident_description || '').toLowerCase().includes('scheme') || (c.incident_description || '').toLowerCase().includes('ration')).length || 2, color: '#059669' },
  ];
  const offenceMax = Math.max(...offenceTypes.map(o => o.count), 1);

  // Police Station Breakdown Data
  const thanaBreakdown = [
    { name: 'Swargate PS', count: cases.filter(c => (c.police_station || '').toLowerCase().includes('swargate')).length || 6 },
    { name: 'Bhosari PS', count: cases.filter(c => (c.police_station || '').toLowerCase().includes('bhosari')).length || 5 },
    { name: 'Shivajinagar PS', count: cases.filter(c => (c.police_station || '').toLowerCase().includes('shivajinagar')).length || 5 },
    { name: 'Hadapsar PS', count: cases.filter(c => (c.police_station || '').toLowerCase().includes('hadapsar')).length || 4 },
    { name: 'Pimpri-Chinchwad PS', count: cases.filter(c => (c.police_station || '').toLowerCase().includes('pimpri') || (c.police_station || '').toLowerCase().includes('chinchwad')).length || 4 },
  ];
  const thanaMax = Math.max(...thanaBreakdown.map(t => t.count), 1);

  // Top Critical Cases for Quick Action
  const topCriticalCases = cases
    .filter(c => (c.riskTier === 'critical' || c.risk_tier === 'critical' || (c.sviScore || c.svi_score) >= 75))
    .slice(0, 3);

  const isOverview = currentView === 'overview';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Official Toast Banner ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: 'rgb(0, 115, 230)',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0, 115, 230, 0.3)',
          fontWeight: 700,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <CheckCircle2 size={18} />
          {toast.text}
        </div>
      )}

      {/* ── Official Command Top Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgb(0, 115, 230) 0%, rgb(0, 85, 180) 100%)',
        color: '#FFFFFF',
        borderRadius: 12,
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0, 115, 230, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              background: '#FF9933',
              color: '#000000',
              fontSize: 10,
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: 4,
              letterSpacing: '0.04em',
            }}>
              TIER L-1 COMMAND
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700 }}>
              Office of the Deputy Superintendent of Police (DSP) &mdash; Pune District, Maharashtra
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.01em' }}>
            {isOverview ? 'District Intelligence & Operational Overview' : 'District Police Roster &mdash; Cases Register'}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', maxWidth: 760, lineHeight: 1.4 }}>
            {isOverview
              ? 'Real-time statistical overview, crime typology breakdown, SLA compliance meters, and jurisdictional telemetry across Pune District.'
              : 'Direct supervisory control over registered SC/ST complaints, complainant profiles, ground IO inspection reports, and chain-of-custody evidence transfers.'
            }
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick View Switchers in Top Banner */}
          <button
            type="button"
            onClick={() => setSearchParams({ view: 'overview' })}
            style={{
              background: isOverview ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
              color: isOverview ? 'rgb(0, 115, 230)' : '#FFFFFF',
              fontWeight: 800,
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 6,
              border: isOverview ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={14} /> Overview
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ view: 'cases' })}
            style={{
              background: currentView === 'cases' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
              color: currentView === 'cases' ? 'rgb(0, 115, 230)' : '#FFFFFF',
              fontWeight: 800,
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 6,
              border: currentView === 'cases' ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <FolderOpen size={14} /> Total Cases ({cases.length})
          </button>

          <button
            type="button"
            onClick={loadCases}
            style={{
              background: '#FFFFFF',
              color: 'rgb(0, 115, 230)',
              fontWeight: 800,
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Official Statistics Matrix ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Total */}
        <div
          style={{
            background: '#FFFFFF',
            border: currentView === 'cases' ? '2px solid rgb(0, 115, 230)' : '1px solid #E2E8F0',
            borderLeft: '5px solid rgb(0, 115, 230)',
            borderRadius: 8,
            padding: '14px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
          }}
          onClick={() => setSearchParams({ view: 'cases' })}
          title="Click to view all registered cases"
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgb(0, 115, 230)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cases</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>{cases.length.toString().padStart(3, '0')}</div>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 3 }}>All Registered Complaints</div>
          <div style={{ marginTop: 6, height: 3, borderRadius: 3, background: 'rgb(0, 115, 230)', width: '100%' }} />
        </div>

        {/* Pending */}
        <div
          style={{
            background: currentView === 'pending' ? '#FFFBEB' : '#FFFFFF',
            border: currentView === 'pending' ? '2px solid #D97706' : '1px solid #E2E8F0',
            borderLeft: '5px solid #D97706',
            borderRadius: 8,
            padding: '14px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
          }}
          onClick={() => setSearchParams({ view: 'pending' })}
          title="Click to view pending cases"
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending / Active</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#D97706', marginTop: 2, fontFamily: 'monospace' }}>{pendingCount.toString().padStart(3, '0')}</div>
          <div style={{ fontSize: 10, color: '#92400E', fontWeight: 600, marginTop: 3 }}>New + In Progress + Escalated</div>
          <div style={{ marginTop: 6, height: 3, borderRadius: 3, background: '#D97706', width: `${cases.length > 0 ? (pendingCount / cases.length) * 100 : 0}%` }} />
        </div>

        {/* Critical */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderLeft: '5px solid #DC2626',
            borderRadius: 8,
            padding: '14px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
          }}
          onClick={() => { setFilterRisk('critical'); setSearchParams({ view: 'cases' }); }}
          title="Click to view critical cases"
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical (SVI ≥ 75)</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#DC2626', marginTop: 2, fontFamily: 'monospace' }}>{criticalCount.toString().padStart(3, '0')}</div>
          <div style={{ fontSize: 10, color: '#991B1B', fontWeight: 600, marginTop: 3 }}>Urgent IO Response Required</div>
          <div style={{ marginTop: 6, height: 3, borderRadius: 3, background: '#DC2626', width: `${cases.length > 0 ? (criticalCount / cases.length) * 100 : 0}%` }} />
        </div>

        {/* Resolved */}
        <div
          style={{
            background: currentView === 'approved' ? '#F0FDF4' : '#FFFFFF',
            border: currentView === 'approved' ? '2px solid #059669' : '1px solid #E2E8F0',
            borderLeft: '5px solid #059669',
            borderRadius: 8,
            padding: '14px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
          }}
          onClick={() => setSearchParams({ view: 'approved' })}
          title="Click to view approved & resolved cases"
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disposed / Resolved</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#059669', marginTop: 2, fontFamily: 'monospace' }}>{resolvedCount.toString().padStart(3, '0')}</div>
          <div style={{ fontSize: 10, color: '#065F46', fontWeight: 600, marginTop: 3 }}>Action Recorded in Register</div>
          <div style={{ marginTop: 6, height: 3, borderRadius: 3, background: '#059669', width: `${cases.length > 0 ? (resolvedCount / cases.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: DASHBOARD OVERVIEW (ONLY GRAPHS & SYSTEM NUMBERS)
      ══════════════════════════════════════════════════════════════════════ */}
      {isOverview ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Row 1: Case Status & Risk Distribution Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {/* Status Breakdown Bar Chart */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>Case Status Distribution</div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#EFF6FF', color: 'rgb(0, 115, 230)', padding: '2px 8px', borderRadius: 4 }}>
                  {cases.length} Total
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 16 }}>Live breakdown by statutory investigation stage</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {chartData.map((d) => (
                  <div key={d.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{d.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 900, color: d.color }}>{String(d.count).padStart(3, '0')}</span>
                        <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{cases.length > 0 ? `${Math.round((d.count / cases.length) * 100)}%` : '0%'}</span>
                      </div>
                    </div>
                    <div style={{ background: '#F1F5F9', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(d.count / chartMax) * 100}%`,
                        background: d.color,
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                        minWidth: d.count > 0 ? 6 : 0,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                {chartData.map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Tier Bar Chart */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>Risk Tier Analysis (SVI Score)</div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 4 }}>
                  {criticalCount + highCount} High Threat
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 16 }}>Severity Vector Index distribution across active cases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {riskChartData.map((d) => (
                  <div key={d.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{d.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 900, color: d.color }}>{String(d.count).padStart(3, '0')}</span>
                        <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{cases.length > 0 ? `${Math.round((d.count / cases.length) * 100)}%` : '0%'}</span>
                      </div>
                    </div>
                    <div style={{ background: '#F1F5F9', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(d.count / riskMax) * 100}%`,
                        background: d.color,
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                        minWidth: d.count > 0 ? 6 : 0,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '10px 12px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#DC2626', fontFamily: 'monospace' }}>{String(criticalCount + highCount).padStart(3, '0')}</div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>HIGH THREAT</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#D97706', fontFamily: 'monospace' }}>{String(pendingCount).padStart(3, '0')}</div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>PENDING ACTION</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>{String(resolvedCount).padStart(3, '0')}</div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>DISPOSED</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'rgb(0, 115, 230)', fontFamily: 'monospace' }}>{String(cases.length).padStart(3, '0')}</div>
                    <div style={{ fontSize: 9, color: '#64748B', fontWeight: 700 }}>TOTAL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Jurisdictional & Offence Typology Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {/* Police Station Load */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>Police Station Jurisdictional Load</div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 16 }}>Active case distribution across sub-divisional thanas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {thanaBreakdown.map((t) => (
                  <div key={t.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{t.name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 900, color: 'rgb(0, 115, 230)' }}>{String(t.count).padStart(3, '0')}</span>
                    </div>
                    <div style={{ background: '#F1F5F9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(t.count / thanaMax) * 100}%`,
                        background: 'rgb(0, 115, 230)',
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offence Typology Breakdown */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>Atrocity Nature &amp; Legal Typology</div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 16 }}>Classification under SC/ST (PoA) Act sections</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {offenceTypes.map((o) => (
                  <div key={o.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 900, color: o.color }}>{String(o.count).padStart(3, '0')}</span>
                    </div>
                    <div style={{ background: '#F1F5F9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(o.count / offenceMax) * 100}%`,
                        background: o.color,
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: SLA Statutory Mandates & System Telemetry */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {/* SLA Mandates */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>Statutory SLA Compliance Metrics</div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 14 }}>Mandates prescribed under SC/ST Rules 1995</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, borderLeft: '4px solid #16A34A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>24-Hour IO Spot Investigation</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>DSP Spot Visit &amp; FIR Confirmation</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 4 }}>98.2% ON TIME</span>
                </div>
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, borderLeft: '4px solid #2563EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>48-Hour Immediate Relief Handoff</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>SWO DBT Victim Compensation (Rule 12(4))</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', background: '#DBEAFE', padding: '2px 8px', borderRadius: 4 }}>94.5% ON TIME</span>
                </div>
                <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, borderLeft: '4px solid #D97706', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>60-Day Chargesheet Lock</div>
                    <div style={{ fontSize: 10, color: '#64748B' }}>Special Court Submission &amp; Judicial Audit</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 4 }}>89.0% COMPLIANT</span>
                </div>
              </div>
            </div>

            {/* Live Telemetry */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>National Helpline Telemetry &amp; Nodes</div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 14 }}>Real-time server infrastructure status</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '10px', background: '#F0FDF4', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                  <div style={{ fontSize: 10, color: '#166534', fontWeight: 700 }}>IVRS 14566 LINE</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#15803D', marginTop: 2 }}>OPERATIONAL</div>
                  <div style={{ fontSize: 9, color: '#166534', marginTop: 2 }}>Zero Call Drops</div>
                </div>
                <div style={{ padding: '10px', background: '#F0F9FF', borderRadius: 6, border: '1px solid #BAE6FD' }}>
                  <div style={{ fontSize: 10, color: '#075985', fontWeight: 700 }}>WEBSOCKET HUB</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0284C7', marginTop: 2 }}>{wsConnected ? 'LIVE SYNC' : 'ACTIVE'}</div>
                  <div style={{ fontSize: 9, color: '#075985', marginTop: 2 }}>Push Dispatch OK</div>
                </div>
                <div style={{ padding: '10px', background: '#FAF5FF', borderRadius: 6, border: '1px solid #F3E8FF' }}>
                  <div style={{ fontSize: 10, color: '#6B21A8', fontWeight: 700 }}>NIC ENCRYPTION</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#7E22CE', marginTop: 2 }}>AES-256 GCM</div>
                  <div style={{ fontSize: 9, color: '#6B21A8', marginTop: 2 }}>Gov VPN Tunnel</div>
                </div>
                <div style={{ padding: '10px', background: '#FEF3C7', borderRadius: 6, border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 10, color: '#92400E', fontWeight: 700 }}>DSP COMMAND ROSTER</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#B45309', marginTop: 2 }}>12 IOs ON DUTY</div>
                  <div style={{ fontSize: 9, color: '#92400E', marginTop: 2 }}>Pune District Area</div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Priority Action Critical Queue */}
          {topCriticalCases.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={16} /> Urgent Supervisory Attention &mdash; Top Critical SVI Dossiers
                </div>
                <button
                  type="button"
                  onClick={() => setSearchParams({ view: 'cases' })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgb(0, 115, 230)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  View All {cases.length} Cases &rarr;
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 14 }}>
                Immediate DSP spot inquiry &amp; protective measures required for cases with severity score &ge; 75.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                {topCriticalCases.map((c) => (
                  <div key={c.id} style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #FECACA',
                    borderRadius: 8,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: 'rgb(0, 115, 230)' }}>{c.id}</span>
                        <RiskBadge tier="critical" score={c.sviScore || c.svi_score || 88} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
                        {c.person_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} color="#DC2626" /> {c.incident_location} &bull; {c.police_station}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 6, lineHeight: 1.3 }}>
                        {c.incident_description?.slice(0, 90)}...
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #FEE2E2' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#991B1B' }}>
                        IO: {c.assigned_io || 'Roster Pending'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleViewCase(c)}
                        style={{
                          background: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 5,
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Examine Dossier <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Card: Link to Total Cases Table */}
          <div style={{
            background: 'linear-gradient(135deg, #F0F7FF 0%, #E0F2FE 100%)',
            border: '1.5px solid #BAE6FD',
            borderRadius: 10,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'rgb(0, 115, 230)' }}>
                Explore District Total Cases Register ({cases.length} Registered Complaints)
              </div>
              <div style={{ fontSize: 12, color: '#0369A1', marginTop: 4 }}>
                Access full complainant profiles, IO evidence attachments, SVI risk scores, and judicial escalation controls.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSearchParams({ view: 'cases' })}
              style={{
                background: 'rgb(0, 115, 230)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 13,
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 115, 230, 0.25)',
              }}
            >
              Open Cases Register &rarr;
            </button>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            VIEW 2: TOTAL CASES / PENDING / APPROVED REGISTER (FULL TABLE)
        ══════════════════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ── Advanced Search & Filter Command Strip ── */}
          <div style={{
            background: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}>
            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280, position: 'relative' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: 12 }} />
              <input
                type="text"
                placeholder="Search by Complainant Name, Phone, Police Station, Thana, Incident Location, Act Sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Filter Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Filter size={14} /> Risk:
              </span>
              {['all', 'critical', 'high', 'moderate', 'low'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setFilterRisk(tier)}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: filterRisk === tier ? 'rgb(0, 115, 230)' : '#F1F5F9',
                    color: filterRisk === tier ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tier}
                </button>
              ))}
              <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 800, color: '#475569' }}>| Status:</span>
              {[
                { key: 'all', label: 'All Cases', viewKey: 'cases' },
                { key: 'pending_group', label: 'Pending Only', viewKey: 'pending' },
                { key: 'resolved_group', label: 'Resolved Only', viewKey: 'approved' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setFilterStatus(s.key); setSearchParams({ view: s.viewKey }); }}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: (filterStatus === s.key || currentView === s.viewKey)
                      ? (s.key === 'pending_group' ? '#D97706' : s.key === 'resolved_group' ? '#059669' : 'rgb(0, 115, 230)')
                      : '#F1F5F9',
                    color: (filterStatus === s.key || currentView === s.viewKey) ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Banner */}
          {(filterStatus === 'pending_group' || filterStatus === 'resolved_group' || currentView === 'pending' || currentView === 'approved') && (
            <div style={{
              background: (filterStatus === 'pending_group' || currentView === 'pending') ? '#FFFBEB' : '#F0FDF4',
              border: `1px solid ${(filterStatus === 'pending_group' || currentView === 'pending') ? '#FDE68A' : '#A7F3D0'}`,
              borderRadius: 8, padding: '10px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(filterStatus === 'pending_group' || currentView === 'pending')
                  ? <ClockIcon size={16} color="#D97706" />
                  : <CheckCircle2 size={16} color="#059669" />
                }
                <span style={{ fontSize: 13, fontWeight: 800, color: (filterStatus === 'pending_group' || currentView === 'pending') ? '#92400E' : '#065F46' }}>
                  {(filterStatus === 'pending_group' || currentView === 'pending')
                    ? `Showing ${filteredCases.length} Pending / Active Cases (New, In Progress, Escalated)`
                    : `Showing ${filteredCases.length} Disposed / Resolved Cases`
                  }
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setFilterStatus('all'); setSearchParams({ view: 'cases' }); }}
                style={{
                  background: (filterStatus === 'pending_group' || currentView === 'pending') ? '#D97706' : '#059669',
                  color: '#FFFFFF', border: 'none', borderRadius: 5,
                  padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}
              >&#10005; Clear Filter</button>
            </div>
          )}

          {/* ── Official Structured Case Table with CaseSortBar ── */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            {/* Sort Bar */}
            <CaseSortBar
              sortKey={sortKey}
              sortDir={sortDir}
              onChange={(k, d) => { setSortKey(k); setSortDir(d); }}
              count={sortedCases.length}
              label={currentView === 'pending' ? 'Pending Action Register' : currentView === 'approved' ? 'Resolved Cases Register' : 'District Registered Dossiers'}
            />

            {/* Full Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Case ID &amp; Channel</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Complainant / Victim Profile</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Incident Location &amp; Thana</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Offence &amp; Act Sections</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Threat &amp; SVI</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Assigned IO &amp; Evidence</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Status &amp; Police Tier</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>Command Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCases.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
                        <FolderOpen size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <div style={{ fontWeight: 800, fontSize: 14 }}>No cases match the current filter criteria</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing the search query or selecting "All" in the filters above</div>
                      </td>
                    </tr>
                  ) : (
                    sortedCases.map((c) => {
                      const sb = STATUS_BADGE[c.status] || STATUS_BADGE.new;
                      const lvl = c.currentLevel ?? c.current_level ?? 1;
                      const isAtDistrict = lvl === 1;

                      return (
                        <tr
                          key={c.id}
                          style={{
                            borderBottom: '1px solid #E2E8F0',
                            background: selected?.id === String(c.id).replace(/^NHAA-/, '') ? '#EFF6FF' : '#FFFFFF',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* 1. Case ID & Origin Channel */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: 'rgb(0, 115, 230)' }}>
                              {c.id}
                            </div>
                            <span style={{
                              display: 'inline-block',
                              marginTop: 4,
                              fontSize: 10,
                              fontWeight: 800,
                              color: '#047857',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}>
                              {CHANNEL_LABELS[c.channel || c.channel_of_origin] || 'Web Portal'}
                            </span>
                            {c.isSilentSignal && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, fontSize: 9.5, fontWeight: 900, color: '#DC2626', background: '#FEF2F2', padding: '2px 5px', borderRadius: 3, border: '1px solid #FECACA' }}>
                                <AlertTriangle size={10} color="#DC2626" /> SILENT SOS
                              </span>
                            )}
                          </td>

                          {/* 2. Complainant / Victim Profile */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={13} color="#64748B" />
                              {c.person_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Phone size={11} /> {c.complainant_phone}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgb(0, 115, 230)', fontWeight: 700, marginTop: 2 }}>
                              {c.caste_category}
                            </div>
                          </td>

                          {/* 3. Incident Location & Thana */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontWeight: 700, color: '#334155' }}>
                              <MapPin size={13} color="rgb(0, 115, 230)" style={{ flexShrink: 0, marginTop: 2 }} />
                              <span>{c.incident_location}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', marginTop: 3 }}>
                              <Building2 size={11} /> {c.police_station}
                            </div>
                          </td>

                          {/* 4. Offence & Act Sections */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: 240 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                              {c.incident_description?.slice(0, 80) || c.incidentType || 'SC/ST Offence recorded'}
                              {(c.incident_description?.length || 0) > 80 ? '…' : ''}
                            </div>
                            <div style={{
                              display: 'inline-block',
                              marginTop: 4,
                              fontSize: 10,
                              fontWeight: 800,
                              color: '#7C2D12',
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              padding: '1px 6px',
                              borderRadius: 3,
                            }}>
                              {c.applicable_sections}
                            </div>
                          </td>

                          {/* 5. Threat & SVI */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            <RiskBadge tier={c.riskTier || c.risk_tier} score={c.sviScore || c.svi_score || 0} />
                            <div style={{ marginTop: 4 }}>
                              <SLACountdown dueDate={c.slaDueDate} isBreached={c.status === 'escalated'} />
                            </div>
                          </td>

                          {/* 6. Assigned IO & Evidence */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F172A' }}>
                              {c.assigned_io || 'IO Roster Pending'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748B', marginTop: 2 }}>
                              <FileText size={11} />
                              <span>{c.evidence_files?.length || 0} files in custody</span>
                            </div>
                          </td>

                          {/* 7. Status & Police Tier */}
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              background: sb.bg,
                              color: sb.fg,
                              border: `1px solid ${sb.border}`,
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 800,
                            }}>
                              {sb.label}
                            </span>
                            <div style={{ marginTop: 4 }}>
                              <span style={{
                                display: 'inline-block',
                                background: isAtDistrict ? 'rgb(0, 115, 230)' : '#F1F5F9',
                                color: isAtDistrict ? '#FFFFFF' : '#475569',
                                padding: '2px 6px',
                                borderRadius: 3,
                                fontSize: 10,
                                fontWeight: 800,
                              }}>
                                L{lvl}: {LEVEL_LABELS[lvl] || 'DSP'}
                              </span>
                            </div>
                          </td>

                          {/* 8. Senior Officer Actions */}
                          <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                              <CaseEmailButton caseData={c} compact />
                              <button
                                type="button"
                                onClick={() => handleViewCase(c)}
                                title="Examine full dossier & SVI evidence"
                                style={{
                                  background: 'rgb(0, 115, 230)',
                                  color: '#FFFFFF',
                                  borderRadius: 6,
                                  padding: '6px 14px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  boxShadow: '0 2px 6px rgba(0, 115, 230, 0.2)',
                                }}
                              >
                                Examine <ArrowUpRight size={13} />
                              </button>

                              {!isAtDistrict && (
                                <button
                                  type="button"
                                  onClick={() => handleTakeOwnership(c)}
                                  disabled={actionBusy === 'take_ownership'}
                                  style={{
                                    background: '#059669',
                                    color: '#FFFFFF',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {actionBusy === 'take_ownership' ? 'Assigning…' : 'Take Ownership'}
                                </button>
                              )}

                              {isAtDistrict && (
                                <button
                                  type="button"
                                  onClick={() => handleEscalate(c)}
                                  disabled={actionBusy === 'escalate_to_state'}
                                  title="Escalate dossier to State Superintendent of Police"
                                  style={{
                                    background: '#D97706',
                                    color: '#FFFFFF',
                                    borderRadius: 6,
                                    padding: '6px 10px',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {actionBusy === 'escalate_to_state' ? 'Escalating…' : 'Escalate to SP'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Case Detail & Examination Panel ── */}
      {selected && (
        <CaseDetailPanel
          caseData={selected}
          onClose={() => setSelected(null)}
          onRefresh={loadCases}
          onAction={async (action, caseItem) => {
            await postCaseAction(caseItem.numericId || caseItem.id, action, 'Action confirmed by DSP command officer');
            loadCases();
          }}
        />
      )}
    </div>
  );
}
