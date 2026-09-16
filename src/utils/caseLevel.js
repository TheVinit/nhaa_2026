/** Map API current_level (int) to role key — real police hierarchy. */
const LEVEL_BY_INT = {
  0: 'operator',
  1: 'dsp',
  2: 'sp',
  3: 'ig',
};

const LEVEL_LABELS = {
  operator: 'Operator',
  dsp: 'DSP',
  sp: 'SP',
  ig: 'IG',
};

/**
 * @param {string|number|null|undefined} level
 * @returns {string|null} human-readable level or null if unset
 */
export function formatCurrentLevel(level) {
  if (level == null || level === '') return null;
  if (typeof level === 'number' || /^\d+$/.test(String(level))) {
    const key = LEVEL_BY_INT[Number(level)];
    return key ? LEVEL_LABELS[key] || key : String(level);
  }
  const key = String(level).toLowerCase();
  return LEVEL_LABELS[key] || key.replace(/_/g, ' ');
}

/** Pretty label for engine action strings e.g. escalate_to_dsp */
export function formatActionLabel(action) {
  if (!action) return '';
  const LABELS = {
    assign_operator:          'Assign Operator',
    escalate_to_dsp:          'Escalate to DSP',
    escalate_to_sp:           'Escalate to SP',
    escalate_to_ig:           'Escalate to IG',
    escalate_to_ministry:     'Escalate to Ministry',
    resolve:                  'Mark Resolved',
    close:                    'Close Case',
    reopen:                   'Reopen Case',
    archive:                  'Archive Dossier',
    assign_io:                'Assign Investigating Officer',
    forward_to_swo:           'Forward to Social Welfare Officer',
    forward_to_judiciary:     'Forward to Special Court',
    lock_case:                'Lock Dossier (SHA-256 Seal)',
    issue_national_alert:     'Issue National SC/ST Alert',
    flag_state_breach:        'Flag State SLA Breach',
    request_ig_report:        'Request IG Report',
    request_state_report:     'Request State Report',
    issue_directive_to_swo:   'Issue Directive to SWO',
    order_witness_protection: 'Order Witness Protection',
    order_legal_aid:          'Order Free Legal Aid (DLSA)',
    seal_dossier:             'Seal Dossier for Trial',
    review_dossier:           'Review Sealed Dossier',
    disburse_stage1:          'Disburse Stage 1 DBT (25%)',
    disburse_stage2:          'Disburse Stage 2 DBT (50%)',
    disburse_stage3:          'Disburse Stage 3 DBT (25%)',
    initiate_counselling:     'Initiate Trauma Counselling',
    link_welfare_scheme:      'Link State Welfare Scheme',
    certify_compliance:       'Certify Compliance (PFMS)',
    upload_panchnama:         'Upload Panchnama / Site Report',
    record_witness_statement: 'Record Witness Statement',
    request_fir_registration: 'Request FIR Registration',
    mark_actioned:            'Mark as Actioned',
  };
  return LABELS[action] || String(action)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Offline / mock allowed actions — role-aware across all 9 NHAA tiers */
export function mockAllowedActions(caseData, role = 'operator') {
  const status = String(caseData?.status || 'new').toLowerCase();
  const level  = caseData?.current_level;
  const r      = String(role || 'operator').toLowerCase();
  const lvl    = typeof level === 'number'
    ? LEVEL_BY_INT[level]
    : String(level || '').toLowerCase();

  // ── SWO — Rehabilitation & DBT Relief ───────────────────────────────────────
  if (r === 'swo') {
    if (status === 'resolved' || status === 'closed') {
      return ['disburse_stage2', 'disburse_stage3', 'certify_compliance'];
    }
    return ['disburse_stage1', 'disburse_stage2', 'initiate_counselling', 'link_welfare_scheme', 'certify_compliance'];
  }

  // ── Judiciary — Special Court Authority ─────────────────────────────────────
  if (r === 'judiciary') {
    if (status === 'resolved' || status === 'closed') {
      return ['review_dossier', 'order_legal_aid'];
    }
    return ['issue_directive_to_swo', 'order_witness_protection', 'order_legal_aid', 'seal_dossier', 'forward_to_swo'];
  }

  // ── Director — National Executive Oversight ──────────────────────────────────
  if (r === 'director') {
    if (status === 'resolved' || status === 'closed') return ['archive', 'request_ig_report'];
    return ['issue_national_alert', 'escalate_to_ministry', 'request_ig_report', 'flag_state_breach', 'close'];
  }

  // ── IG — Apex Intelligence Review ────────────────────────────────────────────
  if (r === 'ig') {
    if (status === 'resolved' || status === 'closed') return ['reopen', 'archive'];
    return ['escalate_to_ministry', 'resolve', 'close', 'request_state_report'];
  }

  // ── SP — State Level Lock & Forward ──────────────────────────────────────────
  if (r === 'sp') {
    if (status === 'resolved' || status === 'closed') return ['reopen', 'archive'];
    return ['escalate_to_ig', 'lock_case', 'forward_to_judiciary', 'resolve'];
  }

  // ── DSP / ACP — District Field Operations ────────────────────────────────────
  if (r === 'dsp' || r === 'acp') {
    if (status === 'resolved' || status === 'closed') return ['reopen'];
    return ['escalate_to_sp', 'assign_io', 'forward_to_swo', 'resolve'];
  }

  // ── IO — Investigating Officer Ground Ops ────────────────────────────────────
  if (r === 'io') {
    if (status === 'resolved' || status === 'closed') return ['reopen'];
    return ['upload_panchnama', 'record_witness_statement', 'request_fir_registration', 'escalate_to_dsp', 'resolve'];
  }

  // ── Operator — Call Centre Intake (default) ──────────────────────────────────
  if (status === 'resolved' || status === 'closed') return ['reopen'];

  if (status === 'new' || status === 'in_progress') {
    return ['assign_operator', 'escalate_to_dsp', 'resolve'];
  }
  if (status === 'escalated') {
    if (lvl === 'dsp'  || lvl === '1') return ['escalate_to_sp', 'resolve'];
    if (lvl === 'sp'   || lvl === '2') return ['escalate_to_ig', 'resolve'];
    if (lvl === 'ig'   || lvl === '3') return ['resolve', 'close'];
    return ['escalate_to_dsp', 'resolve'];
  }
  return ['resolve', 'escalate_to_dsp'];
}
