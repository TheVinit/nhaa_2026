import React from 'react';
import { Mail } from 'lucide-react';

export default function CaseEmailButton({ caseData, compact = false }) {
  const rawId = caseData?.id ?? caseData?.case_id ?? 'unknown';
  const caseId = String(rawId).startsWith('NHAA-') ? String(rawId) : `NHAA-${rawId}`;
  const subject = encodeURIComponent(`NHAA Command Action - ${caseId}`);
  const body = encodeURIComponent(
    [
      `Case: ${caseId}`,
      `Complainant: ${caseData?.person_name || caseData?.complainant_name || 'Not provided'}`,
      `Location: ${caseData?.incident_location || caseData?.district || 'Not provided'}`,
      `Status: ${caseData?.status || caseData?.case_status || 'Not provided'}`,
      `Police tier: ${caseData?.currentLevel ?? caseData?.current_level ?? 'Not provided'}`,
      '',
      'Command action / notes:',
    ].join('\n')
  );

  return (
    <button
      type="button"
      onClick={() => { window.location.href = `mailto:command@nhaa.gov.in?subject=${subject}&body=${body}`; }}
      aria-label={`Email command action for ${caseId}`}
      title="Email command action"
      style={{
        background: '#0F172A',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 6,
        padding: compact ? '6px 9px' : '7px 12px',
        fontSize: compact ? 11 : 12,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.18)',
      }}
    >
      <Mail size={compact ? 12 : 14} />
      {compact ? 'Email' : 'Email Action'}
    </button>
  );
}
