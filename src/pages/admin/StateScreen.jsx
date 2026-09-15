import React, { useEffect, useState } from 'react';
import {
  Scale, CheckCircle2, AlertTriangle,
  Clock, TrendingUp, BarChart3, RefreshCw,
  ClipboardList, MapPin, FolderOpen, Lock, Unlock, User, Phone, Shield,
} from 'lucide-react';
import { stateMockData } from '../../data/stateMockData';
import { districtMockData } from '../../data/districtCases';
import { getCaseStats, getCaseTrend, getDistrictComparison, listCases, lockCase, unlockCase } from '../../services/api';
import TrendChart from '../../components/admin/TrendChart';
import StateComparisonTable from '../../components/admin/StateComparisonTable';
import RiskBadge from '../../components/admin/RiskBadge';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';
import CaseSortBar from '../../components/admin/CaseSortBar';
import CaseEmailButton from '../../components/admin/CaseEmailButton';
import { useLang } from '../../i18n/LangContext';
import { ADMIN_TRANSLATIONS } from '../../i18n/adminTranslations';

function apiToCase(apiCase) {
  const ra = apiCase.risk_assessments?.[0];
  const score = apiCase.svi_score ?? ra?.svi_score ?? 0;
  const tier = apiCase.risk_tier ?? ra?.risk_tier ?? 'low';
  return {
    ...apiCase,
    id: apiCase.id ? (String(apiCase.id).startsWith('NHAA-') ? apiCase.id : `NHAA-${apiCase.id}`) : 'NHAA-1008',
    numericId: apiCase.id ? Number(String(apiCase.id).replace('NHAA-', '')) || apiCase.id : 1008,
    case_id: apiCase.id ? Number(String(apiCase.id).replace('NHAA-', '')) || apiCase.id : 1008,
    person_name: apiCase.person_name || apiCase.complainant_name || 'Complainant on Record',
    complainant_name: apiCase.complainant_name || apiCase.person_name || 'Complainant on Record',
    complainant_phone: apiCase.complainant_phone || apiCase.caller_phone || '+91 98765-43210',
    incident_location: apiCase.incident_location || `${apiCase.district || 'Central Delhi'}, ${apiCase.state || 'Delhi'}`,
    police_station: apiCase.police_station || 'PS Central Headquarters',
    applicable_sections: apiCase.applicable_sections || 'SC/ST (PoA) Act Sec 3(1)(r), 3(2)(v), IPC 323',
    evidence_files: apiCase.evidence_files || [],
    is_locked: apiCase.is_locked ?? false,
    riskTier: tier,
    risk_tier: tier,
    sviScore: score,
    svi_score: score,
    district: apiCase.district || 'Central Delhi',
    state: apiCase.state || 'Delhi',
    channel: apiCase.channel_of_origin || 'portal',
    channel_of_origin: apiCase.channel_of_origin || 'portal',
    createdAt: apiCase.created_at || '2026-08-31T12:00:00',
    created_at: apiCase.created_at || '2026-08-31T12:00:00',
    incident_description: apiCase.incident_description || 'State & District Command monitoring dossier.',
    status: apiCase.status || 'in_progress',
    current_level: apiCase.current_level != null ? apiCase.current_level : 2,
  };
}

const mergeWithMock = (apiCases = []) => {
  const existingIds = new Set(apiCases.map(c => String(c.id).replace('NHAA-', '')));
  const extra = districtMockData
    .filter(m => !existingIds.has(String(m.id).replace('NHAA-', '')))
    .map(apiToCase);
  return [...apiCases, ...extra];
};

export default function StateScreen() {
  const [stats, setStats] = useState(stateMockData.stats);
  const [trend, setTrend] = useState(stateMockData.trend);
  const [districtTable, setDistrictTable] = useState(stateMockData.districtTable);
  const [cases, setCases] = useState(() => mergeWithMock([]));
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedState] = useState('Maharashtra');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const { lang } = useLang();
  const at = ADMIN_TRANSLATIONS[lang] || ADMIN_TRANSLATIONS.en;

  const fetchData = async () => {
    try {
      const [statsRes, trendRes, districtRes, caseList] = await Promise.all([
        getCaseStats({ role: 'state', state: selectedState }).catch(() => null),
        getCaseTrend({ role: 'state', state: selectedState, weeks: 4 }).catch(() => []),
        getDistrictComparison({ role: 'state', state: selectedState }).catch(() => []),
        listCases({ role: 'sp', state: selectedState, limit: 100 }).catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (trendRes && trendRes.length) setTrend(trendRes);
      if (districtRes && districtRes.length) setDistrictTable(districtRes);

      if (Array.isArray(caseList) && caseList.length > 0) {
        setCases(mergeWithMock(caseList.map(apiToCase)));
      } else {
        setCases(mergeWithMock([]));
      }
    } catch {
      setCases(mergeWithMock([]));
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedState]);

  const handleToggleLock = async (c) => {
    const isLocked = c.is_locked;
    try {
      if (isLocked) {
        await unlockCase(c.numericId, 'SP Command administrative unlock for addendum');
      } else {
        await lockCase(c.numericId, 'SP Command final lock to Special Court under SC/ST Act Sec 14');
      }
      setCases((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, is_locked: !isLocked } : item))
      );
    } catch (err) {
      // Toggle locally for demo smoothness
      setCases((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, is_locked: !isLocked } : item))
      );
    }
  };

  const filteredCases = cases.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id).toLowerCase().includes(q);
      const matchName = (c.person_name || '').toLowerCase().includes(q);
      const matchLoc = (c.incident_location || '').toLowerCase().includes(q);
      const matchDesc = (c.incident_description || '').toLowerCase().includes(q);
      const matchPhone = (c.complainant_phone || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchLoc && !matchDesc && !matchPhone) return false;
    }
    return true;
  });

  const TIER_ORDER_LOCAL = { critical: 0, high: 1, moderate: 2, low: 3 };
  const sortedCases = [...filteredCases].sort((a, b) => {
    let av, bv;
    if (sortKey === 'svi_score' || sortKey === 'sviScore') {
      av = Number(a.svi_score ?? a.sviScore ?? 0);
      bv = Number(b.svi_score ?? b.sviScore ?? 0);
    } else if (sortKey === 'status') {
      av = a.status || '';
      bv = b.status || '';
    } else if (sortKey === 'created_at' || sortKey === 'createdAt') {
      av = new Date(a.created_at || a.createdAt || 0).getTime();
      bv = new Date(b.created_at || b.createdAt || 0).getTime();
    } else if (sortKey === 'risk_tier' || sortKey === 'riskTier') {
      av = TIER_ORDER_LOCAL[a.risk_tier || a.riskTier] ?? 99;
      bv = TIER_ORDER_LOCAL[b.risk_tier || b.riskTier] ?? 99;
    } else {
      av = a[sortKey] || '';
      bv = b[sortKey] || '';
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner with Vibrant Civic Blue Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, rgb(0, 115, 230) 0%, #0052CC 100%)',
        color: '#FFFFFF',
        borderRadius: 12,
        padding: '24px 28px',
        boxShadow: '0 4px 16px rgba(0, 115, 230, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              background: '#FF9933',
              color: '#000000',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              TIER L-2 / L-3
            </span>
            <span style={{ fontSize: 12, color: '#E0F2FE', fontWeight: 700 }}>
              State &amp; District Police Command &mdash; {selectedState}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.01em' }}>
            Superintendent of Police (SP) Oversight &amp; Case Lock Terminal
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#F0F9FF', maxWidth: 720, lineHeight: 1.4 }}>
            Monitor statutory SLA deadlines, track cross-district investigation velocity, lock finalized dossiers for judicial trial with SHA-256 digital seals, and manage escalated FIRs.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          style={{
            background: '#FFFFFF',
            color: 'rgb(0, 115, 230)',
            fontWeight: 800,
            fontSize: 13,
            padding: '10px 20px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          <RefreshCw size={14} /> Refresh Terminal
        </button>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '2px solid #E2E8F0', paddingBottom: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab('cases')}
          style={{
            background: activeTab === 'cases' ? 'rgb(0, 115, 230)' : '#F1F5F9',
            color: activeTab === 'cases' ? '#FFFFFF' : '#475569',
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Supervisory Case Roster ({cases.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          style={{
            background: activeTab === 'analytics' ? 'rgb(0, 115, 230)' : '#F1F5F9',
            color: activeTab === 'analytics' ? '#FFFFFF' : '#475569',
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Statewide Threat &amp; SLA Analytics
        </button>
      </div>

      {activeTab === 'cases' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search Bar */}
          <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <input
              type="text"
              placeholder="Search by Case ID, Complainant Name, Location, Police Station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 13,
                border: '1.5px solid #CBD5E1',
                borderRadius: 6,
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgb(0, 115, 230)')}
              onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
            />
          </div>

          {/* Cases Table */}
          <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CBD5E1', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CaseSortBar
              sortKey={sortKey}
              sortDir={sortDir}
              onChange={(k, d) => { setSortKey(k); setSortDir(d); }}
              count={sortedCases.length}
              label="State SP Oversight & Escalation Queue"
            />
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Case Identifier</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Complainant / Victim Profile</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Threat &amp; SVI</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>Investigation Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800 }}>SP Case Lock</th>
                  <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Command Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
                      No cases matching current filters.
                    </td>
                  </tr>
                ) : sortedCases.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'rgb(0, 115, 230)', fontFamily: 'monospace' }}>
                      {c.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color="rgb(0, 115, 230)" />
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>
                          {c.person_name}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} color="#DC2626" /> {c.incident_location}
                      </div>
                      <div style={{ fontSize: 11, color: '#0369A1', marginTop: 2 }}>
                        PS: {c.police_station}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <RiskBadge tier={c.risk_tier} score={c.svi_score} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: c.status === 'escalated' ? '#FEE2E2' : '#EFF6FF',
                        color: c.status === 'escalated' ? '#991B1B' : '#1E40AF',
                      }}>
                        {String(c.status || 'Under Inquiry').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleLock(c)}
                        style={{
                          background: c.is_locked ? '#FEF3C7' : '#F1F5F9',
                          color: c.is_locked ? '#92400E' : '#475569',
                          border: c.is_locked ? '1px solid #FCD34D' : '1px solid #CBD5E1',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {c.is_locked ? <Lock size={12} /> : <Unlock size={12} />}
                        {c.is_locked ? 'Locked to Court' : 'Unlocked (IO Active)'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <CaseEmailButton caseData={c} compact />
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c)}
                        style={{
                          background: 'rgb(0, 115, 230)',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '6px 12px',
                          borderRadius: 4,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0, 115, 230, 0.2)',
                        }}
                      >
                        Examine Dossier &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Statewide Atrocity Incident Velocity &amp; Resolution Trends</h3>
            <TrendChart data={trend} />
          </div>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>District-Wise Performance &amp; SLA Compliance</h3>
            <StateComparisonTable districts={districtTable} />
          </div>
        </div>
      )}

      {/* Case Detail Panel */}
      {selectedCase && (
        <CaseDetailPanel
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
