import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import RiskBadge from './RiskBadge';
import CaseEmailButton from './CaseEmailButton';
import { formatCurrentLevel } from '../../utils/caseLevel';
import { User, MapPin, Phone, Shield, FileText, ArrowUpDown } from 'lucide-react';

const CHANNEL_LABELS = {
  portal: 'Public Web Portal',
  chatbot: 'Chatbot Intake',
  ivrs: 'Toll-Free IVRS (14566)',
  mobile_app: 'Mobile Application',
};

const TIER_ORDER = { critical: 0, high: 1, moderate: 2, low: 3 };

export default function CaseTable({ cases, onViewCase }) {
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return cases;
    const q = searchTerm.toLowerCase();
    return cases.filter((c) => {
      const id = String(c.id ?? c.case_id ?? '').toLowerCase();
      const name = String(c.person_name || c.complainant_name || '').toLowerCase();
      const loc = String(c.incident_location || c.district || '').toLowerCase();
      const phone = String(c.complainant_phone || c.caller_phone || '').toLowerCase();
      const police = String(c.police_station || '').toLowerCase();
      return id.includes(q) || name.includes(q) || loc.includes(q) || phone.includes(q) || police.includes(q);
    });
  }, [cases, searchTerm]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av;
      let bv;
      if (sortKey === 'risk_tier') {
        av = TIER_ORDER[a.risk_tier] ?? 9;
        bv = TIER_ORDER[b.risk_tier] ?? 9;
      } else if (sortKey === 'created_at') {
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
      } else if (sortKey === 'id') {
        av = a.id ?? a.case_id;
        bv = b.id ?? b.case_id;
      } else if (sortKey === 'person_name') {
        av = String(a.person_name || a.complainant_name || '');
        bv = String(b.person_name || b.complainant_name || '');
      } else if (sortKey === 'current_level') {
        av = String(a.current_level ?? '');
        bv = String(b.current_level ?? '');
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  };

  const sortIndicator = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {/* Search Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="rgb(0, 115, 230)" />
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Incident & Triage Queue ({sorted.length} records)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="text"
            placeholder="Search by name, phone, location, case ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '7px 14px',
              border: '1.5px solid #CBD5E1',
              borderRadius: 6,
              fontSize: 12,
              minWidth: 280,
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgb(0, 115, 230)')}
            onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
              <th scope="col" style={thStyle}>
                <button type="button" onClick={() => toggleSort('id')} style={sortBtnStyle}>
                  Case Identifier{sortIndicator('id')}
                </button>
              </th>
              <th scope="col" style={thStyle}>
                <button type="button" onClick={() => toggleSort('person_name')} style={sortBtnStyle}>
                  Complainant / Victim Profile{sortIndicator('person_name')}
                </button>
              </th>
              <th scope="col" style={thStyle}>Location & Jurisdiction</th>
              <th scope="col" style={thStyle}>
                <button type="button" onClick={() => toggleSort('risk_tier')} style={sortBtnStyle}>
                  Threat & SVI{sortIndicator('risk_tier')}
                </button>
              </th>
              <th scope="col" style={thStyle}>
                <button type="button" onClick={() => toggleSort('status')} style={sortBtnStyle}>
                  Status{sortIndicator('status')}
                </button>
              </th>
              <th scope="col" style={thStyle}>
                <button type="button" onClick={() => toggleSort('current_level')} style={sortBtnStyle}>
                  Officer Tier{sortIndicator('current_level')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                  No matching cases found in active queue.
                </td>
              </tr>
            ) : (
              sorted.map((c) => {
                const id = c.id ?? c.case_id;
                const levelLabel = formatCurrentLevel(c.current_level);
                const personName = c.person_name || c.complainant_name || 'Complainant on Record';
                const phone = c.complainant_phone || c.caller_phone || '—';
                const location = c.incident_location || c.district || 'National Territory';
                const thana = c.police_station || 'District Headquarters';

                return (
                  <tr key={id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    {/* Case Identifier */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, color: 'rgb(0, 115, 230)', fontFamily: 'monospace', fontSize: 13 }}>
                          NHAA-{id}
                        </span>
                        {c.is_silent_signal && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 4 }}>
                            SOS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        {CHANNEL_LABELS[c.channel_of_origin] || c.channel_of_origin || 'Portal Intake'}
                      </div>
                    </td>

                    {/* Complainant / Victim Profile */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color="rgb(0, 115, 230)" />
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
                          {personName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', marginTop: 3 }}>
                        <Phone size={11} color="#94A3B8" />
                        <span>{phone}</span>
                        {c.caste_category && (
                          <span style={{ marginLeft: 4, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 10, color: '#475569' }}>
                            {c.caste_category}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location & Jurisdiction */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={12} color="#DC2626" />
                        <span style={{ fontWeight: 600, color: '#1E293B', fontSize: 12 }}>
                          {location}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                        PS: {thana}
                      </div>
                    </td>

                    {/* Threat & SVI */}
                    <td style={tdStyle}>
                      <RiskBadge tier={c.risk_tier || 'low'} score={c.svi_score} />
                    </td>

                    {/* Current Status */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        textTransform: 'capitalize',
                        fontWeight: 700,
                        fontSize: 11,
                        padding: '3px 9px',
                        borderRadius: 6,
                        background: c.status === 'resolved' || c.status === 'disposed' ? '#DCFCE7' : c.status === 'escalated' ? '#FEE2E2' : '#EFF6FF',
                        color: c.status === 'resolved' || c.status === 'disposed' ? '#166534' : c.status === 'escalated' ? '#991B1B' : '#1E40AF',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}>
                        {String(c.status || 'Under Review').replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Police Tier */}
                    <td style={tdStyle}>
                      {levelLabel ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#0F172A',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            padding: '3px 8px',
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Shield size={11} color="rgb(0, 115, 230)" />
                          {levelLabel}
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <CaseEmailButton caseData={c} compact />
                        <button
                          type="button"
                          onClick={() => onViewCase(c)}
                        aria-label={`Examine dossier for case NHAA-${id}`}
                        style={{
                          background: 'rgb(0, 115, 230)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '7px 14px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 4px rgba(0, 115, 230, 0.25)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#005BB5')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgb(0, 115, 230)')}
                      >
                        Examine Dossier
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
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: '#334155', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' };
const tdStyle = { padding: '14px 16px', color: '#0F172A', verticalAlign: 'middle' };
const sortBtnStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
  fontWeight: 700,
  color: '#334155',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
};

CaseTable.propTypes = {
  cases: PropTypes.arrayOf(PropTypes.object).isRequired,
  onViewCase: PropTypes.func.isRequired,
};
