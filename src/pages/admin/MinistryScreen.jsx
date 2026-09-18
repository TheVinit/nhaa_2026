import React, { useEffect, useState } from 'react';
import { RefreshCw, MapPin, User, Shield, TrendingUp, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import { listCases, connectWebSocket, getCaseStats } from '../../services/api';
import { districtMockData } from '../../data/districtCases';
import { getSession } from '../../utils/adminAuth';
import RiskBadge from '../../components/admin/RiskBadge';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';
import CaseSortBar from '../../components/admin/CaseSortBar';
import CaseEmailButton from '../../components/admin/CaseEmailButton';

const STATUS_BADGE = {
  new:         { bg: '#EFF6FF', fg: '#1E40AF', border: '#BFDBFE', label: 'New Complaint' },
  in_progress: { bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A', label: 'Under Investigation' },
  escalated:   { bg: '#FFF7ED', fg: '#9A3412', border: '#FFEDD5', label: 'Escalated' },
  resolved:    { bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0', label: 'Resolved' },
  closed:      { bg: '#F8FAFC', fg: '#475569', border: '#E2E8F0', label: 'Closed' },
  locked:      { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D', label: 'Locked by SP' },
};

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
    recommended_action: apiCase.recommended_action || ra?.recommended_action || 'police_intervention',
    notifications: apiCase.notifications || [],
    flags: apiCase.flags || ra?.flags || [],
    explanation_text: apiCase.explanation_text || ra?.explanation_text || apiCase.incident_description,
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
    incident_description: apiCase.incident_description || 'State Zone Intelligence Command apex record.',
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

const TIER_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };

export default function MinistryScreen() {
  const session = getSession();
  const [cases, setCases] = useState(() => mergeWithMock([]));
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await listCases({ limit: 150 });
      if (Array.isArray(data) && data.length > 0) {
        setCases(mergeWithMock(data.map(apiToCase)));
      } else {
        setCases(mergeWithMock([]));
      }
    } catch (err) {
      console.warn('IG desk using benchmark cases:', err);
      setCases(mergeWithMock([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const ws = connectWebSocket(() => { loadData(); });
    return () => { try { ws.close(); } catch {} };
  }, []);

  // KPI computations
  const totalCases = cases.length;
  const criticalCount = cases.filter(c => c.risk_tier === 'critical' || c.svi_score >= 75).length;
  const highCount = cases.filter(c => c.risk_tier === 'high' || (c.svi_score >= 50 && c.svi_score < 75)).length;
  const resolvedCount = cases.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const slaBreachCount = cases.filter(c => {
    if (!c.slaDueDate && !c.sla_due_date) return false;
    const due = new Date(c.slaDueDate || c.sla_due_date);
    return due < new Date() && c.status !== 'resolved' && c.status !== 'closed';
  }).length;
  const avgSvi = cases.length > 0
    ? (cases.reduce((s, c) => s + (Number(c.svi_score) || 0), 0) / cases.length).toFixed(1)
    : '0.0';

  // District breakdown
  const districtMap = {};
  cases.forEach(c => {
    const d = c.district || 'Unknown';
    if (!districtMap[d]) districtMap[d] = { critical: 0, total: 0 };
    districtMap[d].total += 1;
    if (c.risk_tier === 'critical' || c.svi_score >= 75) districtMap[d].critical += 1;
  });
  const districtRows = Object.entries(districtMap)
    .map(([district, stat]) => ({ district, ...stat }))
    .sort((a, b) => b.critical - a.critical);

  // Filter + search
  const filteredCases = cases.filter(c => {
    if (filterMode === 'critical') return c.risk_tier === 'critical' || c.svi_score >= 75;
    if (filterMode === 'high') return c.risk_tier === 'high' || (c.svi_score >= 50 && c.svi_score < 75);
    if (filterMode === 'resolved') return c.status === 'resolved' || c.status === 'closed';
    if (filterMode === 'breach') {
      if (!c.slaDueDate && !c.sla_due_date) return false;
      const due = new Date(c.slaDueDate || c.sla_due_date);
      return due < new Date() && c.status !== 'resolved' && c.status !== 'closed';
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        String(c.id).toLowerCase().includes(q) ||
        (c.person_name || '').toLowerCase().includes(q) ||
        (c.incident_location || '').toLowerCase().includes(q) ||
        (c.police_station || '').toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedCases = [...filteredCases].sort((a, b) => {
    let av, bv;
    if (sortKey === 'svi_score' || sortKey === 'sviScore') {
      av = Number(a.svi_score ?? 0); bv = Number(b.svi_score ?? 0);
    } else if (sortKey === 'created_at' || sortKey === 'createdAt') {
      av = new Date(a.created_at || 0).getTime(); bv = new Date(b.created_at || 0).getTime();
    } else if (sortKey === 'risk_tier' || sortKey === 'riskTier') {
      av = TIER_ORDER[a.risk_tier] ?? 99; bv = TIER_ORDER[b.risk_tier] ?? 99;
    } else {
      av = a[sortKey] || ''; bv = b[sortKey] || '';
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const ACCENT = '#7C3AED'; // Violet — IG brand

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── APEX BANNER ── */}
      <div style={{
        background: `linear-gradient(135deg, #5B21B6 0%, ${ACCENT} 100%)`,
        color: '#FFFFFF',
        borderRadius: 12,
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
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
              color: '#000',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
            }}>APEX INTELLIGENCE TIER L-3</span>
            <span style={{ fontSize: 12, color: '#DDD6FE', fontWeight: 700 }}>
              State Zone Command &mdash; Maharashtra IG / Inspector General
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.01em' }}>
            IG Intelligence &amp; Strategic Zone Monitoring
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#EDE9FE', maxWidth: 680, lineHeight: 1.4 }}>
            Cross-district atrocity heatmaps, SVI analytics, SLA breach alerts, and end-to-end case chain review
            from field intake (L-0) to judicial handoff (L-4). Statutory mandate: SC/ST PoA Act Sec 4, Rule 7.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            background: '#FFFFFF',
            color: ACCENT,
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
            opacity: loading ? 0.7 : 1,
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Refreshing…' : 'Refresh Intelligence'}
        </button>
      </div>

      {/* ── KPI CARDS (INTERACTIVE TOGGLE) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { id: 'all', label: 'Zone Case Inventory', value: totalCases, color: ACCENT, Icon: BarChart3 },
          { id: 'critical', label: 'Critical SVI ≥ 75', value: criticalCount, color: '#DC2626', Icon: AlertTriangle },
          { id: 'high', label: 'High SVI (50–74)', value: highCount, color: '#D97706', Icon: Shield },
          { id: 'breach', label: 'SLA Breaches', value: slaBreachCount, color: '#EF4444', Icon: Activity },
          { id: 'all_svi', label: 'Avg SVI Score', value: avgSvi, color: '#0284C7', Icon: TrendingUp, unfilterable: true },
          { id: 'resolved', label: 'Resolved / Closed', value: resolvedCount, color: '#10B981', Icon: Activity },
        ].map(({ id, label, value, color, Icon, unfilterable }) => {
          const isSelected = !unfilterable && filterMode === id;
          return (
            <div
              key={label}
              onClick={() => {
                if (unfilterable) return;
                setFilterMode((curr) => (curr === id ? 'all' : id));
              }}
              role="button"
              tabIndex={0}
              title={unfilterable ? label : `Click to filter by ${label}`}
              style={{
                background: isSelected ? '#FAF5FF' : '#FFFFFF',
                padding: '18px 20px',
                borderRadius: 8,
                border: isSelected ? `2.5px solid ${color}` : '1px solid #E2E8F0',
                borderTop: `4px solid ${color}`,
                cursor: unfilterable ? 'default' : 'pointer',
                transform: isSelected ? 'scale(1.02)' : 'none',
                boxShadow: isSelected ? `0 4px 14px ${color}33` : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
                </div>
                <div style={{ padding: 8, background: '#F8FAFC', borderRadius: 8 }}>
                  <Icon size={18} color={color} />
                </div>
              </div>
              {isSelected && (
                <div style={{ marginTop: 8, fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase' }}>
                  ● Active Filter
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DISTRICT INTELLIGENCE TABLE ── */}
      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1.5px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <MapPin size={15} color={ACCENT} />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>District-wise Intelligence Breakdown</span>
          <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 4 }}>Maharashtra Zone</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: '#334155' }}>District</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#334155' }}>Total Cases</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#DC2626' }}>Critical</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#334155' }}>SLA Exposure</th>
            </tr>
          </thead>
          <tbody>
            {districtRows.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>No district data.</td></tr>
            ) : districtRows.map(row => (
              <tr key={row.district} style={{ borderBottom: '1px solid #F1F5F9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
              >
                <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0F172A' }}>{row.district}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>{row.total}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  {row.critical > 0 ? (
                    <span style={{ background: '#FEE2E2', color: '#DC2626', fontWeight: 800, padding: '3px 10px', borderRadius: 4, fontSize: 12 }}>
                      {row.critical}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  {slaBreachCount > 0 ? (
                    <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, padding: '3px 10px', borderRadius: 4, fontSize: 12 }}>
                      ⚠ Monitor
                    </span>
                  ) : (
                    <span style={{ color: '#10B981', fontWeight: 700, fontSize: 12 }}>✔ Clear</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── FILTER / SEARCH BAR ── */}
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
            placeholder="Search by Case ID, Person, Location, District…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: 13,
              border: '1.5px solid #CBD5E1',
              borderRadius: 6,
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = ACCENT)}
            onBlur={e => (e.target.style.borderColor = '#CBD5E1')}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${cases.length})` },
            { key: 'critical', label: `Critical (${criticalCount})` },
            { key: 'high', label: `High (${highCount})` },
            { key: 'breach', label: `SLA Breach (${slaBreachCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setFilterMode(key); setSearchQuery(''); }}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 4,
                border: 'none',
                background: filterMode === key ? ACCENT : '#F1F5F9',
                color: filterMode === key ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CASE TABLE ── */}
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
          label="IG Zone Intelligence Queue"
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Case ID</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Complainant / Victim</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Risk &amp; SVI</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>IO &amp; Jurisdiction</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Review</th>
            </tr>
          </thead>
          <tbody>
            {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                  No cases match current filters.
                </td>
              </tr>
            ) : sortedCases.map(c => {
              const badge = STATUS_BADGE[c.status] || STATUS_BADGE.in_progress;
              return (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: ACCENT, fontFamily: 'monospace', fontSize: 13 }}>
                    {c.id}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={13} color={ACCENT} />
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{c.person_name}</span>
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
                      fontSize: 11, fontWeight: 800,
                      padding: '4px 8px', borderRadius: 4,
                      background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}`,
                    }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                    <CaseEmailButton caseData={c} />
                    <button
                      type="button"
                      onClick={() => setSelectedCase(c)}
                      style={{
                        background: ACCENT,
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
                        boxShadow: `0 2px 4px rgba(124,58,237,0.2)`,
                      }}
                    >
                      Review Case &rarr;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── CASE DETAIL PANEL ── */}
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
