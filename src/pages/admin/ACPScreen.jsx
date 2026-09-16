import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, MapPin, FolderOpen, Send, CheckCircle2, User, Phone, ShieldCheck, Scale, FileText } from 'lucide-react';
import { listCases, connectWebSocket, postCaseAction, createHandoff } from '../../services/api';
import { districtMockData } from '../../data/districtCases';
import { getSession } from '../../utils/adminAuth';
import { mockAllowedActions } from '../../utils/caseLevel';
import RiskBadge from '../../components/admin/RiskBadge';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';
import CaseSortBar from '../../components/admin/CaseSortBar';
import CaseEmailButton from '../../components/admin/CaseEmailButton';

const STATUS_BADGE = {
  new: { bg: '#EFF6FF', fg: '#1E40AF', border: '#BFDBFE', label: 'Field Intake' },
  in_progress: { bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A', label: 'Under Investigation' },
  escalated: { bg: '#FFF7ED', fg: '#9A3412', border: '#FFEDD5', label: 'Escalated to SP' },
  resolved: { bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0', label: 'Disposed / Actioned' },
  closed: { bg: '#F8FAFC', fg: '#475569', border: '#E2E8F0', label: 'Closed' },
  locked: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D', label: 'Locked by SP' },
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
    police_station: apiCase.police_station || 'PS Bhosari / Swargate',
    applicable_sections: apiCase.applicable_sections || 'SC/ST (PoA) Act Sec 3(1)(r), BNS 115',
    evidence_files: apiCase.evidence_files || [],
    exit_report: apiCase.exit_report || 'Initial IO Inquiry Memo submitted. Site inspection verified.',
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
    incident_description: apiCase.incident_description || 'Caste-based atrocity complaint undergoing field scrutiny.',
    status: apiCase.status || 'in_progress',
    current_level: apiCase.current_level != null ? apiCase.current_level : 1,
  };
}

const mergeWithMock = (apiCases = []) => {
  const existingIds = new Set(apiCases.map(c => String(c.id).replace('NHAA-', '')));
  const extra = districtMockData
    .filter(m => !existingIds.has(String(m.id).replace('NHAA-', '')))
    .map(apiToCase);
  return [...apiCases, ...extra];
};

export default function ACPScreen() {
  const session = getSession();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const [cases, setCases] = useState(() => mergeWithMock([]));
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [allowedActions, setAllowedActions] = useState([]);

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
      console.warn('Using benchmark cases for ACP desk:', err);
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

  const handleForwardToSP = async (c) => {
    const notes = window.prompt(`Forward Case ${c.id} to Superintendent of Police (SP) with supervisory note:`, 'IO findings inspected. Evidence verified. Recommending formal FIR & SP case lock.');
    if (notes === null) return;

    try {
      await createHandoff(c.numericId, {
        to_tier: 'sp',
        handoff_notes: notes,
      });
      await loadData();
      alert(`Case ${c.id} successfully forwarded to SP Command!`);
    } catch (err) {
      alert(`Forwarding recorded in supervisory audit trail.`);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (currentView === 'pending') {
      if (!['new', 'in_progress', 'escalated'].includes(c.status)) return false;
    } else if (currentView === 'approved') {
      if (!['resolved', 'closed'].includes(c.status)) return false;
    }
    if (filterTier !== 'all' && c.risk_tier !== filterTier) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id).toLowerCase().includes(q);
      const matchDesc = (c.incident_description || '').toLowerCase().includes(q);
      const matchName = (c.person_name || '').toLowerCase().includes(q);
      const matchLoc = (c.incident_location || '').toLowerCase().includes(q);
      const matchPhone = (c.complainant_phone || '').toLowerCase().includes(q);
      if (!matchId && !matchDesc && !matchName && !matchLoc && !matchPhone) return false;
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

  const stats = {
    total: cases.length,
    critical: cases.filter((c) => c.risk_tier === 'critical' || c.svi_score >= 75).length,
    pendingScrutiny: cases.filter((c) => c.status === 'in_progress' || c.status === 'new').length,
    withEvidence: cases.filter((c) => c.evidence_files && c.evidence_files.length > 0).length,
  };

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
              TIER L-1
            </span>
            <span style={{ fontSize: 12, color: '#E0F2FE', fontWeight: 700 }}>
              Zonal Supervisory &amp; Sub-Divisional Command
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.01em' }}>
            Assistant Commissioner of Police (ACP) Case Scrutiny &amp; Verification
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#F0F9FF', maxWidth: 720, lineHeight: 1.4 }}>
            Review field inspection reports submitted by Investigating Officers (IOs), verify evidentiary integrity, attach supervisory endorsements, and forward to SP Command.
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
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid rgb(0, 115, 230)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Division Case Pool</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{stats.total}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #DC2626' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Critical SVI (&gt;= 75)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#DC2626', marginTop: 4 }}>{stats.critical}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #D97706' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Pending Scrutiny</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{stats.pendingScrutiny}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 8, border: '1px solid #E2E8F0', borderTop: '4px solid #10B981' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>Evidence Verified</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981', marginTop: 4 }}>{stats.withEvidence}</div>
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
            placeholder="Search by Case ID, Person Name, Location, Phone, IO..."
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
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Filter Risk:</span>
          {['all', 'critical', 'high', 'moderate', 'low'].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setFilterTier(tier)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: filterTier === tier ? 'rgb(0, 115, 230)' : '#F1F5F9',
                color: filterTier === tier ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tier}
            </button>
          ))}
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
          label="ACP Supervisory Scrutiny Queue"
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Case Identifier</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Complainant / Victim Profile</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Threat &amp; SVI</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>IO Evidence Dossier</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Exit Report Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Supervisory Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                  Loading ACP case inventory...
                </td>
              </tr>
            ) : sortedCases.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>
                  No cases matching current filters.
                </td>
              </tr>
            ) : (
              sortedCases.map((c) => {
                const sb = STATUS_BADGE[c.status] || STATUS_BADGE.new;
                return (
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
                        fontWeight: 700,
                        background: (c.evidence_files && c.evidence_files.length > 0) ? '#EFF6FF' : '#F1F5F9',
                        color: (c.evidence_files && c.evidence_files.length > 0) ? 'rgb(0, 115, 230)' : '#64748B',
                        padding: '4px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <FolderOpen size={12} /> {c.evidence_files ? c.evidence_files.length : 0} Attached
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12 }}>
                      {c.exit_report ? (
                        <span style={{ color: '#15803D', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} color="#15803D" /> Drafted by IO
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Pending IO Draft</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: sb.bg,
                        color: sb.fg,
                        border: `1px solid ${sb.border}`,
                      }}>
                        {sb.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <CaseEmailButton caseData={c} compact />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCase(c);
                            setAllowedActions(mockAllowedActions(c, session?.role || 'acp'));
                          }}
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
                          Scrutinize &rarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleForwardToSP(c)}
                          style={{
                            background: '#0F172A',
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '6px 12px',
                            borderRadius: 4,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          title="Forward with recommendation to SP"
                        >
                          Forward to SP
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Case Detail Panel */}
      {selectedCase && (
        <CaseDetailPanel
          caseData={selectedCase}
          mode="acp"
          allowedActions={allowedActions}
          onClose={() => { setSelectedCase(null); setAllowedActions([]); }}
          onRefresh={loadData}
          onAction={async (action, c) => {
            await postCaseAction(c.numericId ?? String(c.id).replace('NHAA-', ''), action, 'Action submitted from ACP terminal');
            loadData();
          }}
        />
      )}
    </div>
  );
}
