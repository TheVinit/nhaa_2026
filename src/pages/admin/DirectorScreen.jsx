import React, { useEffect, useState } from 'react';
import { RefreshCw, MapPin, FolderOpen, Lock, HeartHandshake, ShieldCheck, User, Phone, Shield, FileText } from 'lucide-react';
import { listCases, connectWebSocket, getCaseStats, getCaseTrend, getStateComparison } from '../../services/api';
import { districtMockData } from '../../data/districtCases';
import RiskBadge from '../../components/admin/RiskBadge';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';
import CaseSortBar from '../../components/admin/CaseSortBar';

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
    incident_location: apiCase.incident_location || `${apiCase.district || 'Pune District'}, ${apiCase.state || 'Maharashtra'}`,
    police_station: apiCase.police_station || 'PS Shivajinagar / Bhosari',
    applicable_sections: apiCase.applicable_sections || 'SC/ST (PoA) Act Sec 3(1)(r), 3(2)(v), BNS 115',
    evidence_files: apiCase.evidence_files || [],
    is_locked: apiCase.is_locked ?? (tier === 'critical'),
    forwarded_to_swo: apiCase.forwarded_to_swo ?? true,
    riskTier: tier,
    risk_tier: tier,
    sviScore: score,
    svi_score: score,
    district: apiCase.district || 'Pune District',
    state: apiCase.state || 'Maharashtra',
    channel: apiCase.channel_of_origin || 'portal',
    channel_of_origin: apiCase.channel_of_origin || 'portal',
    createdAt: apiCase.created_at || '2026-08-31T12:00:00',
    created_at: apiCase.created_at || '2026-08-31T12:00:00',
    incident_description: apiCase.incident_description || 'Central Directorate Apex Case Record.',
    status: apiCase.status || 'in_progress',
    current_level: apiCase.current_level != null ? apiCase.current_level : 3,
  };
}

const mergeWithMock = (apiCases = []) => {
  const existingIds = new Set(apiCases.map(c => String(c.id).replace('NHAA-', '')));
  const extra = districtMockData
    .filter(m => !existingIds.has(String(m.id).replace('NHAA-', '')))
    .map(apiToCase);
  return [...apiCases, ...extra];
};

export default function DirectorScreen() {
  const [cases, setCases] = useState(() => mergeWithMock([]));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const loadData = async () => {
    try {
      setLoading(true);
      const [caseList, statRes] = await Promise.all([
        listCases({ limit: 150 }).catch(() => []),
        getCaseStats().catch(() => null),
      ]);

      if (Array.isArray(caseList) && caseList.length > 0) {
        setCases(mergeWithMock(caseList.map(apiToCase)));
      } else {
        setCases(mergeWithMock([]));
      }
      if (statRes) setStats(statRes);
    } catch (err) {
      console.warn('Using benchmark cases for Director desk:', err);
      setCases(mergeWithMock([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const ws = connectWebSocket(() => {
      loadData();
    });
    return () => {
      try { ws.close(); } catch {}
    };
  }, []);

  const totalCases = cases.length;
  const criticalCount = cases.filter((c) => c.risk_tier === 'critical' || c.svi_score >= 75).length;
  const lockedCount = cases.filter((c) => c.is_locked).length;
  const swoForwardedCount = cases.filter((c) => c.forwarded_to_swo).length;

  const tierBreakdown = {
    l0: cases.filter((c) => (c.current_level ?? 0) === 0).length,
    l1: cases.filter((c) => c.current_level === 1).length,
    l2: cases.filter((c) => c.current_level === 2).length,
    l3: cases.filter((c) => c.current_level === 3).length,
    l4: cases.filter((c) => c.current_level === 4 || c.is_locked).length,
    l5: cases.filter((c) => c.current_level === 5 || c.forwarded_to_swo).length,
  };

  const filteredCases = cases.filter((c) => {
    if (selectedTierFilter === 'critical') return c.risk_tier === 'critical' || c.svi_score >= 75;
    if (selectedTierFilter === 'locked') return c.is_locked;
    if (selectedTierFilter === 'swo') return c.forwarded_to_swo;
    if (selectedTierFilter === 'evidence') return c.evidence_files && c.evidence_files.length > 0;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id).toLowerCase().includes(q);
      const matchName = (c.person_name || '').toLowerCase().includes(q);
      const matchLoc = (c.incident_location || '').toLowerCase().includes(q);
      const matchPhone = (c.complainant_phone || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchLoc && !matchPhone) return false;
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
      {/* Top Apex Banner with Vibrant Civic Blue Gradient */}
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
              APEX COMMAND TIER L-3+
            </span>
            <span style={{ fontSize: 12, color: '#E0F2FE', fontWeight: 700 }}>
              Ministry Central Directorate &mdash; National Atrocity Monitoring Matrix
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.01em' }}>
            Director Oversight &amp; Cross-Hierarchy Execution Control
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#F0F9FF', maxWidth: 720, lineHeight: 1.4 }}>
            Complete vertical visibility from Level-0 Intake to Level-5 Social Rehabilitation. Monitor statutory SLA breaches, cross-tier handoff bottlenecks, evidence integrity hashes, and ministry escalation alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
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
          <RefreshCw size={14} /> Refresh Directorate
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid rgb(0, 115, 230)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>National Case Inventory</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalCases}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #DC2626' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>High / Critical SVI</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#DC2626', marginTop: 4 }}>{criticalCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #D97706' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Court Locked Dossiers</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{lockedCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #10B981' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>SWO Directives Active</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 4 }}>{swoForwardedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search by Case ID, Person Name, Location, Police Station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
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

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('all')}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 4,
              border: 'none',
              background: selectedTierFilter === 'all' ? 'rgb(0, 115, 230)' : '#F1F5F9',
              color: selectedTierFilter === 'all' ? '#FFFFFF' : '#475569',
              cursor: 'pointer',
            }}
          >
            All ({cases.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('critical')}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 4,
              border: 'none',
              background: selectedTierFilter === 'critical' ? 'rgb(0, 115, 230)' : '#F1F5F9',
              color: selectedTierFilter === 'critical' ? '#FFFFFF' : '#475569',
              cursor: 'pointer',
            }}
          >
            Critical SVI ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTierFilter('locked')}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 4,
              border: 'none',
              background: selectedTierFilter === 'locked' ? 'rgb(0, 115, 230)' : '#F1F5F9',
              color: selectedTierFilter === 'locked' ? '#FFFFFF' : '#475569',
              cursor: 'pointer',
            }}
          >
            Court Locked ({lockedCount})
          </button>
        </div>
      </div>

      {/* Case Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid #CBD5E1',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <CaseSortBar
          sortKey={sortKey}
          sortDir={sortDir}
          onChange={(k, d) => { setSortKey(k); setSortDir(d); }}
          count={sortedCases.length}
          label="Director Central Monitoring Queue"
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Case Identifier</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Complainant / Victim Profile</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Threat &amp; SVI</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Assigned IO &amp; Jurisdiction</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Legal &amp; Welfare State</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Apex Scrutiny</th>
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
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <RiskBadge tier={c.risk_tier} score={c.svi_score} />
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{c.assigned_io || 'IO Assigned'}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>PS: {c.police_station}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: c.is_locked ? '#FEF3C7' : '#EFF6FF',
                    color: c.is_locked ? '#92400E' : '#1E40AF',
                    border: c.is_locked ? '1px solid #FCD34D' : '1px solid #BFDBFE',
                  }}>
                    {c.is_locked ? 'Locked by SP' : 'In Progress (Active)'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCase(c)}
                    style={{
                      background: 'rgb(0, 115, 230)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '7px 14px',
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(0, 115, 230, 0.2)',
                    }}
                  >
                    Examine Dossier &rarr;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Case Detail Panel */}
      {selectedCase && (
        <CaseDetailPanel
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
