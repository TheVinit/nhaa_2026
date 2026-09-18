import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Scale, MapPin, HeartHandshake, ShieldCheck, User, Phone, CheckCircle2, IndianRupee } from 'lucide-react';
import { listCases, connectWebSocket } from '../../services/api';
import { districtMockData } from '../../data/districtCases';
import RiskBadge from '../../components/admin/RiskBadge';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';
import CaseSortBar from '../../components/admin/CaseSortBar';
import CaseEmailButton from '../../components/admin/CaseEmailButton';

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
    police_station: apiCase.police_station || 'PS Shivajinagar / Swargate',
    applicable_sections: apiCase.applicable_sections || 'SC/ST (PoA) Act Sec 3(1)(r), Rule 12(4)',
    compensation_status: apiCase.compensation_status || 'Under Welfare Officer Review',
    judiciary_directive: apiCase.judiciary_directive || 'Direct immediate DBT compensation disbursement under SC/ST PoA Rule 12(4). Provide security & counseling.',
    forwarded_to_swo: apiCase.forwarded_to_swo ?? true,
    recommended_action: apiCase.recommended_action || ra?.recommended_action || 'counselling',
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
    incident_description: apiCase.incident_description || 'Victim rehabilitation and compensation docket.',
    status: apiCase.status || 'in_progress',
    current_level: apiCase.current_level != null ? apiCase.current_level : 5,
  };
}

const mergeWithMock = (apiCases = []) => {
  const existingIds = new Set(apiCases.map(c => String(c.id).replace('NHAA-', '')));
  const extra = districtMockData
    .filter(m => !existingIds.has(String(m.id).replace('NHAA-', '')))
    .map(apiToCase);
  return [...apiCases, ...extra];
};

export default function SWOScreen() {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const [cases, setCases] = useState(() => mergeWithMock([]));
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterMode, setFilterMode] = useState('forwarded'); // 'forwarded' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await listCases({ limit: 100 });
      if (Array.isArray(data) && data.length > 0) {
        setCases(mergeWithMock(data.map(apiToCase)));
      } else {
        setCases(mergeWithMock([]));
      }
    } catch (err) {
      console.warn('Using benchmark cases for SWO desk:', err);
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

  const forwardedCases = cases.filter((c) => c.forwarded_to_swo || c.compensation_status);

  const displayedCases = (filterMode === 'forwarded' ? forwardedCases : cases).filter((c) => {
    if (currentView === 'pending') {
      if (!['new', 'in_progress', 'escalated'].includes(c.status)) return false;
    } else if (currentView === 'approved') {
      if (!['resolved', 'closed'].includes(c.status)) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id).toLowerCase().includes(q);
      const matchName = (c.person_name || '').toLowerCase().includes(q);
      const matchLoc = (c.incident_location || '').toLowerCase().includes(q);
      const matchDirective = (c.judiciary_directive || '').toLowerCase().includes(q);
      const matchPhone = (c.complainant_phone || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchLoc && !matchDirective && !matchPhone) return false;
    }
    return true;
  });

  const TIER_ORDER_LOCAL = { critical: 0, high: 1, moderate: 2, low: 3 };
  const sortedCases = [...displayedCases].sort((a, b) => {
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
              TIER L-5
            </span>
            <span style={{ fontSize: 12, color: '#E0F2FE', fontWeight: 700 }}>
              Department of Social Welfare &amp; Empowerment
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.01em' }}>
            Social Welfare Officer (SWO) Rehabilitation &amp; Relief Terminal
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#F0F9FF', maxWidth: 720, lineHeight: 1.4 }}>
            Execute judicial mandates, disburse SC/ST PoA statutory relief compensation (Rule 12(4)), facilitate trauma counselling, medical aid, and track victim social rehabilitation schemes.
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
          <RefreshCw size={14} /> Refresh Terminal
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid rgb(0, 115, 230)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Welfare Pool</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{cases.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #10B981' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>Judicial Referrals</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 4 }}>{forwardedCases.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #D97706' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Compensation Sanctioned</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#D97706', marginTop: 4 }}>4 Cases</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #6366F1' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase' }}>Legal Aid &amp; Rehabilitation</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#6366F1', marginTop: 4 }}>100% Covered</div>
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
            placeholder="Search by Case ID, Victim Name, Location, Directive..."
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
            onClick={() => setFilterMode('forwarded')}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 4,
              border: 'none',
              background: filterMode === 'forwarded' ? 'rgb(0, 115, 230)' : '#F1F5F9',
              color: filterMode === 'forwarded' ? '#FFFFFF' : '#475569',
              cursor: 'pointer',
            }}
          >
            Judicial Directives ({forwardedCases.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 4,
              border: 'none',
              background: filterMode === 'all' ? 'rgb(0, 115, 230)' : '#F1F5F9',
              color: filterMode === 'all' ? '#FFFFFF' : '#475569',
              cursor: 'pointer',
            }}
          >
            All Welfare Cases ({cases.length})
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
          label="SWO Rehabilitation & DBT Relief Queue"
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Case Identifier</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Victim Profile &amp; Location</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Threat &amp; SVI</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Statutory Compensation Scheme</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Judiciary Directive</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Welfare Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                  Loading welfare registry...
                </td>
              </tr>
            ) : sortedCases.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
                  No cases matching current filters.
                </td>
              </tr>
            ) : (
              sortedCases.map((c) => (
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
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IndianRupee size={12} color="#166534" />
                      {c.compensation_status}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {c.applicable_sections}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12 }}>
                    <span style={{ color: '#0F172A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Scale size={12} color="rgb(0, 115, 230)" /> {c.judiciary_directive}
                    </span>
                  </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <CaseEmailButton caseData={c} compact />
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
                      Process Relief &rarr;
                    </button>
                  </div>
                </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Case Detail Panel */}
      {selectedCase && (
        <CaseDetailPanel
          caseData={selectedCase}
          mode="swo"
          onClose={() => setSelectedCase(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
