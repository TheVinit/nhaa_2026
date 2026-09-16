import React, { useEffect, useState } from 'react';
import { GlobeIcon, TrendingUpIcon, BarChart3Icon, ScaleIcon } from 'lucide-react';
import { ministryMockData } from '../../data/ministryMockData';
import { getCaseStats, getCaseTrend, getStateComparison } from '../../services/api';
import TrendChart from '../../components/admin/TrendChart';
import StateComparisonTable from '../../components/admin/StateComparisonTable';

export default function MinistryScreen() {
  const [nationalStats, setNationalStats] = useState(() => ministryMockData.nationalStats);
  const [nationalTrend, setNationalTrend] = useState(() => ministryMockData.nationalTrend);
  const [stateTable, setStateTable] = useState(() => ministryMockData.stateTable);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [statsRes, trendRes, statesRes] = await Promise.all([
          getCaseStats({ role: 'ministry' }),
          getCaseTrend({ role: 'ministry', weeks: 4 }),
          getStateComparison(),
        ]);
        if (!cancelled) {
          if (statsRes) setNationalStats(statsRes);
          if (Array.isArray(trendRes) && trendRes.length > 0) setNationalTrend(trendRes);
          if (Array.isArray(statesRes) && statesRes.length > 0) setStateTable(statesRes);
          setUseMock(false);
        }
      } catch {
        if (!cancelled) {
          setUseMock(true);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const nationalColumns = [
    { key: 'state', label: 'State / UT' },
    { key: 'cases', label: 'Total Cases' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'resolutionRate', label: '% Resolution', suffix: '%', decimal: 1 },
    { key: 'highRisk', label: 'High Risk' },
    { key: 'critical', label: 'Critical' },
  ];

  if (!nationalStats) return null;

  const displayTrend = nationalTrend.length > 0 ? nationalTrend : ministryMockData.nationalTrend;
  const displayStates = stateTable.length > 0 ? stateTable : ministryMockData.stateTable;

  const statCards = [
    { label: 'Total Cases', value: nationalStats.total_cases?.toLocaleString('en-IN') || nationalStats.totalCases?.toLocaleString('en-IN') || 0, Icon: BarChart3Icon },
    { label: 'Avg SVI', value: nationalStats.avg_svi ?? nationalStats.avgSvi ?? 0, Icon: TrendingUpIcon, color: 'text-orange-600' },
    { label: 'Active SLA Breaches', value: nationalStats.pending_sla?.toLocaleString('en-IN') || nationalStats.pendingSLA?.toLocaleString('en-IN') || 0, Icon: ScaleIcon, color: 'text-red-700' },
    { label: 'States Reporting', value: displayStates.length, Icon: GlobeIcon },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>National Dashboard -- NHAA 14566</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          {useMock
            ? '(Mock data -- API unreachable)'
            : `(Live data from Case API) | Data shape contract (Step 14): Ministry expects -- national trend[${displayTrend.length} points], state-by-state comparison table.`}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-extrabold text-slate-500 uppercase" style={{ letterSpacing: '0.05em' }}>{card.label}</div>
                <div className={`mt-1 text-2xl font-extrabold ${card.color || 'text-slate-900'}`}>{card.value}</div>
              </div>
              {card.Icon && (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                  <card.Icon className={`h-5 w-5 ${card.color || 'text-slate-600'}`} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <TrendChart data={displayTrend} dataKey="cases" type="line" height={220} title="National Case Volume (weekly)" />
        <TrendChart data={displayTrend} dataKey="critical" type="bar" height={220} title="Critical Cases (weekly)" />
      </div>

      <StateComparisonTable
        title="State-by-State Comparison"
        columns={nationalColumns}
        data={displayStates}
        defaultSort="cases"
      />
    </div>
  );
}
