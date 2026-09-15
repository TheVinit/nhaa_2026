import React from 'react';
import { ArrowDownUp } from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'created_at', dir: 'desc', label: 'Newest First' },
  { key: 'svi_score',  dir: 'desc', label: 'Highest SVI' },
  { key: 'status',     dir: 'asc',  label: 'Status A-Z' },
  { key: 'created_at', dir: 'asc',  label: 'Oldest First' },
];

export default function CaseSortBar({ sortKey, sortDir, onChange, count, label }) {
  const lbl = label || 'Live Dossiers';
  const isActive = (opt) => opt.key === sortKey && opt.dir === sortDir;
  return (
    <div style={{
      padding: '12px 18px',
      borderBottom: '1px solid #E2E8F0',
      background: '#F8FAFC',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ArrowDownUp size={14} color="rgb(0, 115, 230)" />
        <span style={{ fontSize: 13, fontWeight: 900, color: 'rgb(0, 115, 230)' }}>{lbl}</span>
        {count != null && (
          <span style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 800,
            background: '#EFF6FF', color: 'rgb(0, 115, 230)',
            border: '1px solid #BFDBFE', padding: '1px 8px', borderRadius: 4,
          }}>{String(count).padStart(3, '0')} records</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginRight: 4 }}>Sort:</span>
        {SORT_OPTIONS.map((opt) => {
          const active = isActive(opt);
          return (
            <button
              key={opt.key + opt.dir}
              type="button"
              onClick={() => onChange(opt.key, opt.dir)}
              style={{
                padding: '6px 12px',
                background: active ? 'rgb(0, 115, 230)' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#475569',
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${active ? 'rgb(0, 115, 230)' : '#CBD5E1'}`,
                borderRadius: 4, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                transition: 'all 0.15s ease', whiteSpace: 'nowrap',
              }}
            >
              {opt.label}{active && <span style={{ fontSize: 10 }}>{opt.dir === 'desc' ? ' \u2193' : ' \u2191'}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
