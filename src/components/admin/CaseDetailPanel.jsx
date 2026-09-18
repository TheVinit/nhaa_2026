import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart3,
  FileEdit,
  FolderOpen,
  GitFork,
  Lock,
  Unlock,
  Send,
  Scale,
  History,
  ArrowRight,
  X,
  AlertTriangle,
  ShieldAlert,
  HeartHandshake,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Building2,
  Calendar,
  FileText,
  IndianRupee,
  ShieldCheck,
  CreditCard,
  GraduationCap,
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import NotificationLog from './NotificationLog';
import CaseExamineForm from './CaseExamineForm';
import EvidenceUploader from './EvidenceUploader';
import { formatActionLabel, formatCurrentLevel } from '../../utils/caseLevel';
import { lockCase, unlockCase, forwardToSWO, createHandoff, listHandoffs } from '../../services/api';
import { getSession } from '../../utils/adminAuth';
import { POA_SECTIONS_DATABASE } from '../../data/poaActData';

const ACTION_LABELS = {
  police_intervention: 'Police Intervention',
  legal_aid: 'Free Legal Aid (DLSA)',
  medical_assistance: 'Medical Assistance',
  counselling: 'Counselling Referral',
  emergency_escalation: 'Emergency Escalation',
  witness_protection: 'Witness Protection',
  standard_follow_up: 'Standard Follow-up',
  information_only: 'Information Only',
  fir_registration: 'FIR Registration',
  emergency_medical: 'Emergency Medical',
};

const CHANNEL_LABELS = {
  portal: 'Portal',
  chatbot: 'Chatbot',
  ivrs: 'IVRS',
  mobile_app: 'Mobile App',
};

function normalizeFlags(flags) {
  if (!flags) return [];
  if (Array.isArray(flags)) {
    return flags
      .map((f, index) => {
        if (!f) return null;
        if (typeof f === 'string') {
          return { name: f, present: true, confidence: null, signals: [] };
        }
        const name = f.name || f.label || f.flag || `Risk Marker ${index + 1}`;
        return {
          name,
          present: f.present !== undefined ? Boolean(f.present) : true,
          confidence: typeof f.confidence === 'number' ? f.confidence : null,
          signals: Array.isArray(f.signals) ? f.signals : (f.signals ? [String(f.signals)] : []),
        };
      })
      .filter((f) => f && f.present);
  }
  if (typeof flags !== 'object') return [];
  return Object.entries(flags)
    .map(([key, value]) => {
      if (!value) return null;
      let name = key;
      if (/^\d+$/.test(key) && value && typeof value === 'object' && value.name) {
        name = value.name;
      }
      if (value && typeof value === 'object' && 'present' in value) {
        return {
          name: value.name || name,
          present: Boolean(value.present),
          confidence: typeof value.confidence === 'number' ? value.confidence : null,
          signals: Array.isArray(value.signals) ? value.signals : [],
        };
      }
      if (value && typeof value === 'object') {
        return {
          name: value.name || name,
          present: value.present !== undefined ? Boolean(value.present) : true,
          confidence: typeof value.confidence === 'number' ? value.confidence : null,
          signals: Array.isArray(value.signals) ? value.signals : [],
        };
      }
      return {
        name,
        present: Boolean(value),
        confidence: null,
        signals: [],
      };
    })
    .filter((f) => f && f.present);
}

function actionButtonStyle(action, primary) {
  const isDanger = String(action).startsWith('escalate') || action === 'dispatch_police';
  const isResolve = action === 'resolve' || action === 'close' || action === 'mark_actioned';
  let background = 'rgb(0, 115, 230)';
  if (isDanger) background = '#B91C1C';
  else if (isResolve) background = '#065F46';
  else if (!primary) background = '#334155';
  return {
    width: '100%',
    marginTop: 10,
    background,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 18px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  };
}

export default function CaseDetailPanel({
  caseData,
  onClose,
  onConfirmAction,
  onMarkActioned,
  onAction,
  onRefresh,
  allowedActions = [],
  actionsLoading = false,
  actionBusy = null,
  mode = 'operator',
}) {
  // Default tab based on role
  const defaultTab = mode === 'swo' ? 'dbt_relief' : 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [poaSearch, setPoaSearch] = useState('');
  const [handoffs, setHandoffs] = useState([]);
  const [targetTier, setTargetTier] = useState('acp');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [swoDirective, setSwoDirective] = useState('');
  const [swoComplianceNote, setSwoComplianceNote] = useState('');
  const [lockingState, setLockingState] = useState(false);
  const [handoffState, setHandoffState] = useState(false);

  // SWO DBT Disbursal simulation state
  const [dbtStages, setDbtStages] = useState({
    stage1: true,
    stage2: false,
    stage3: false,
  });
  const [pfmsRef, setPfmsRef] = useState('MH-PUNE-DBT-2026-98124');

  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  const session = getSession();
  const role = session?.role || (mode === 'judiciary' ? 'judiciary' : mode === 'swo' ? 'swo' : 'dsp');

  useEffect(() => {
    if (!caseData) return undefined;
    closeBtnRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [caseData, onClose]);

  const loadHandoffs = async () => {
    if (!caseData?.id && !caseData?.case_id) return;
    const cid = caseData.id ?? caseData.case_id;
    try {
      const data = await listHandoffs(cid);
      setHandoffs(data || []);
    } catch (err) {
      console.error('Failed to load handoffs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'handoffs') {
      loadHandoffs();
    }
  }, [activeTab, caseData]);

  if (!caseData) return null;

  const id = caseData.id ?? caseData.case_id;
  const riskTier = String(caseData.risk_tier ?? caseData.riskTier ?? 'low').toLowerCase();
  const rawSvi = caseData.svi_score ?? caseData.sviScore;
  const sviScore = rawSvi != null && !isNaN(Number(rawSvi)) ? Number(rawSvi) : null;
  const isCritical = riskTier === 'critical';
  const activeFlags = normalizeFlags(caseData.flags);
  const isResponder = mode === 'responder';
  const isJudiciary = mode === 'judiciary';
  const isSWO = mode === 'swo';
  const alreadyActioned = Boolean(caseData.actioned);
  const levelLabel = formatCurrentLevel(caseData.current_level ?? caseData.currentLevel);

  const engineActions = Array.isArray(allowedActions) ? allowedActions : [];
  const showEngineActions = !isJudiciary && !isSWO && (engineActions.length > 0 || actionsLoading);

  const handleLockToggle = async () => {
    try {
      setLockingState(true);
      if (caseData.is_locked) {
        await unlockCase(id);
      } else {
        await lockCase(id, 'Locked by Superintendent for Judiciary Forwarding');
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Lock action failed: ${err.message}`);
    } finally {
      setLockingState(false);
    }
  };

  const handleHandoffSubmit = async (e) => {
    e.preventDefault();
    try {
      setHandoffState(true);
      await createHandoff(id, {
        to_tier: targetTier,
        handoff_notes: handoffNotes,
      });
      setHandoffNotes('');
      await loadHandoffs();
      if (onRefresh) onRefresh();
      alert('Case handoff successfully transferred!');
    } catch (err) {
      alert(`Handoff failed: ${err.message}`);
    } finally {
      setHandoffState(false);
    }
  };

  const handleForwardToSWO = async (e) => {
    e.preventDefault();
    if (!swoDirective) {
      alert('Please specify the judiciary directive for SWO');
      return;
    }
    try {
      setHandoffState(true);
      await forwardToSWO(id, swoDirective, 'Judiciary formal adjudication & rehabilitation directive');
      setSwoDirective('');
      if (onRefresh) onRefresh();
      alert('Case successfully forwarded to Social Welfare Officer with judicial directive!');
    } catch (err) {
      alert(`Forward failed: ${err.message}`);
    } finally {
      setHandoffState(false);
    }
  };

  const handleSwoComplianceSubmit = (e) => {
    e.preventDefault();
    alert(`SWO Compliance Certificate recorded for Case #${id}. PFMS Disbursal Batch #${pfmsRef} certified.`);
    setSwoComplianceNote('');
  };

  // Build role-specific tab items
  const tabsList = [];
  if (isJudiciary) {
    tabsList.push(
      { id: 'overview', label: 'Overview & Legal Scrutiny', Icon: BarChart3 },
      { id: 'examine', label: 'Special Court Record (Read-Only)', Icon: FileEdit },
      { id: 'evidence', label: 'Verified Evidence Dossier', Icon: FolderOpen },
      { id: 'handoffs', label: 'Directives to SWO', Icon: Scale },
      { id: 'poa_law', label: 'PoA Act & Rights (Sec 15A)', Icon: ShieldAlert }
    );
  } else if (isSWO) {
    tabsList.push(
      { id: 'dbt_relief', label: 'DBT Relief & Rehabilitation', Icon: HeartHandshake },
      { id: 'overview', label: 'Victim Need Profile', Icon: BarChart3 },
      { id: 'examine', label: 'Police Incident Record (Read-Only)', Icon: FileEdit },
      { id: 'evidence', label: 'Evidence & Medical Files', Icon: FolderOpen },
      { id: 'handoffs', label: 'Court Directives & Compliance', Icon: Scale },
      { id: 'poa_law', label: 'PoA Act & Rights (Sec 15A)', Icon: ShieldAlert }
    );
  } else {
    tabsList.push(
      { id: 'overview', label: 'Overview & AI Triage', Icon: BarChart3 },
      { id: 'examine', label: 'Case Examination Form', Icon: FileEdit },
      { id: 'evidence', label: 'Evidence Files', Icon: FolderOpen },
      { id: 'handoffs', label: 'Hierarchy & Handoffs', Icon: GitFork },
      { id: 'poa_law', label: 'PoA Act & Rights (Sec 15A)', Icon: Scale }
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close case detail panel"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          border: 'none',
          zIndex: 1100,
          cursor: 'pointer',
        }}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-labelledby="case-detail-title"
        aria-modal="true"
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(820px, 100vw)',
          height: '100vh',
          background: '#FFFFFF',
          boxShadow: '-8px 0 36px rgba(0,0,0,0.2)',
          zIndex: 1101,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Panel Header */}
        <div style={{
          padding: '20px 24px',
          background: isJudiciary
            ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
            : isSWO
            ? 'linear-gradient(135deg, rgb(0, 115, 230) 0%, #065F46 100%)'
            : 'linear-gradient(135deg, rgb(0, 115, 230) 0%, rgb(0, 85, 180) 100%)',
          color: '#FFFFFF',
          borderBottom: '3px solid #FF9933',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                background: '#FF9933',
                color: '#000000',
                fontSize: 10,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                {isJudiciary ? 'SPECIAL COURT DOSSIER' : isSWO ? 'SWO REHABILITATION DESK' : 'NHAA CENTRAL RECORD'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700 }}>
                Case ID: #{id}
              </span>
            </div>
            <h2 id="case-detail-title" style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>
              Case NHAA-{id}: {caseData.person_name || 'Complainant Record'}
            </h2>
            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
              {[caseData.district, caseData.state].filter(Boolean).join(', ') || 'Pune District, Maharashtra'}
              {caseData.created_at ? ` · Logged ${new Date(caseData.created_at).toLocaleString('en-IN')}` : ''}
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close case details"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 6,
              width: 36,
              height: 36,
              fontSize: 20,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: '#F1F5F9',
          borderBottom: '1px solid #CBD5E1',
          padding: '0 16px',
          gap: 6,
          overflowX: 'auto',
        }}>
          {tabsList.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? 'rgb(0, 115, 230)' : '#64748B',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid rgb(0, 115, 230)' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderRadius: isActive ? '6px 6px 0 0' : 0,
                  marginTop: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <TabIcon size={16} color={isActive ? 'rgb(0, 115, 230)' : '#64748B'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Panel Content Body */}
        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
          
          {/* ── SWO DEDICATED TAB: DBT RELIEF & REHABILITATION ── */}
          {activeTab === 'dbt_relief' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Statutory Mandate Header */}
              <div style={{
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                color: '#FFFFFF',
                padding: '20px 24px',
                borderRadius: 10,
                boxShadow: '0 4px 12px rgba(6, 95, 70, 0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 900, background: '#FF9933', color: '#000000', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                      Rule 12(4) Statutory Relief Mandate
                    </span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>
                      Direct Benefit Transfer (DBT) Relief Disbursal Terminal
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: '#A7F3D0' }}>
                      Beneficiary: <strong style={{ color: '#FFFFFF' }}>{caseData.person_name}</strong> &bull; Total Statutory Entitlement: <strong style={{ color: '#FFFFFF' }}>₹4,25,000</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#D1FAE5' }}>PFMS Batch Reference</div>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#FFFFFF' }}>{pfmsRef}</div>
                  </div>
                </div>
              </div>

              {/* 3-Stage DBT Disbursal Manager */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 20 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IndianRupee size={16} color="#065F46" /> SC/ST (PoA) Rules 1995 (Amended 2016) - 3-Stage Disbursal Schedule
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Stage 1 */}
                  <div style={{
                    padding: '16px 18px',
                    borderRadius: 8,
                    background: dbtStages.stage1 ? '#F0FDF4' : '#F8FAFC',
                    border: `1.5px solid ${dbtStages.stage1 ? '#86EFAC' : '#E2E8F0'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: dbtStages.stage1 ? '#166534' : '#64748B',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}>
                          STAGE 1 &bull; 25% (₹1,06,250)
                        </span>
                        <strong style={{ fontSize: 13, color: '#0F172A' }}>FIR Registration &amp; Spot Panchnama</strong>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#475569' }}>
                        Mandated within 7 days of FIR registration. Verified via PS Bhosari MIDC / Lonikand.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {dbtStages.stage1 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#166534', fontWeight: 800, fontSize: 12, background: '#DCFCE7', padding: '6px 12px', borderRadius: 6 }}>
                          <CheckCircle2 size={14} /> Disbursed to Bank A/C
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDbtStages(prev => ({ ...prev, stage1: true }))}
                          style={{ background: '#065F46', color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                        >
                          Disburse Stage 1 Now
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div style={{
                    padding: '16px 18px',
                    borderRadius: 8,
                    background: dbtStages.stage2 ? '#F0FDF4' : '#F8FAFC',
                    border: `1.5px solid ${dbtStages.stage2 ? '#86EFAC' : '#E2E8F0'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: dbtStages.stage2 ? '#166534' : 'rgb(0, 115, 230)',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}>
                          STAGE 2 &bull; 50% (₹2,12,500)
                        </span>
                        <strong style={{ fontSize: 13, color: '#0F172A' }}>Chargesheet Filing in Special Court</strong>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#475569' }}>
                        Payable when DySP / ACP files chargesheet in Special Court Pune (Section 4 duty within 60 days).
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {dbtStages.stage2 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#166534', fontWeight: 800, fontSize: 12, background: '#DCFCE7', padding: '6px 12px', borderRadius: 6 }}>
                          <CheckCircle2 size={14} /> Disbursed to Bank A/C
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDbtStages(prev => ({ ...prev, stage2: true }));
                            alert('Stage 2 DBT compensation of ₹2,12,500 successfully released via PFMS!');
                          }}
                          style={{ background: 'rgb(0, 115, 230)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                        >
                          Authorize Stage 2 (50%)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div style={{
                    padding: '16px 18px',
                    borderRadius: 8,
                    background: dbtStages.stage3 ? '#F0FDF4' : '#F8FAFC',
                    border: `1.5px solid ${dbtStages.stage3 ? '#86EFAC' : '#E2E8F0'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: dbtStages.stage3 ? '#166534' : '#64748B',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}>
                          STAGE 3 &bull; 25% (₹1,06,250)
                        </span>
                        <strong style={{ fontSize: 13, color: '#0F172A' }}>Final Conviction / Special Court Verdict</strong>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#475569' }}>
                        Final installment released upon judgment delivery by Special Court Pune (Section 14).
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {dbtStages.stage3 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#166534', fontWeight: 800, fontSize: 12, background: '#DCFCE7', padding: '6px 12px', borderRadius: 6 }}>
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#E2E8F0', padding: '6px 12px', borderRadius: 6 }}>
                          Awaiting Trial Judgment
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficiary Banking & Seeding Details */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 20 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={16} color="rgb(0, 115, 230)" /> Aadhaar-Seeded Bank Account (DBT Gateway Verified)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Bank &amp; Branch:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>Bank of Maharashtra &bull; Shivajinagar Pune</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Aadhaar Seeding Status:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <CheckCircle2 size={14} /> NPCI / DBT Enabled (UIDAI Linked)
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Emergency Subsistence Grant:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>₹5,000 Disbursed via Cash Order</div>
                  </div>
                </div>
              </div>

              {/* Maharashtra Welfare Scheme Linkages */}
              <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 20 }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={16} color="rgb(0, 115, 230)" /> State Social Welfare Scheme Linkages (Maharashtra Govt)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  <div style={{ padding: 14, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#1E40AF' }}>Dr. Babasaheb Ambedkar Swadhar Scheme</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#10B981', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>ENROLLED</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#334155' }}>
                      Hostel &amp; food allowance for SC/ST students in Pune district.
                    </p>
                  </div>

                  <div style={{ padding: 14, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#1E40AF' }}>Sanjay Gandhi Niradhar Anudan Yojana</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, background: 'rgb(0, 115, 230)', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>PROCESSED</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#334155' }}>
                      Monthly destitute support &amp; pension for vulnerable victims.
                    </p>
                  </div>

                  <div style={{ padding: 14, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#1E40AF' }}>Free Legal Aid (DLSA Pune)</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#10B981', color: '#fff', padding: '2px 6px', borderRadius: 3 }}>APPOINTED</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#334155' }}>
                      Senior Panel Advocate appointed by District Legal Services Authority.
                    </p>
                  </div>

                  <div style={{ padding: 14, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#1E40AF' }}>Yashwantrao Chavan Mukt Vasahat Yojana</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#F59E0B', color: '#000', padding: '2px 6px', borderRadius: 3 }}>SUBMITTED</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#334155' }}>
                      Permanent housing rehabilitation for displaced SC/ST families.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 1: OVERVIEW & AI TRIAGE ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Badges Bar */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <RiskBadge tier={riskTier} score={sviScore != null ? sviScore : undefined} />
                {caseData.is_silent_signal && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#991B1B', background: '#FEE2E2', padding: '4px 10px', borderRadius: 4, border: '1px solid #FCA5A5' }}>
                    <AlertTriangle size={12} /> FLAG: Silent Distress Signal
                  </span>
                )}
                {caseData.channel_of_origin && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', background: '#F1F5F9', padding: '4px 10px', borderRadius: 4 }}>
                    Channel: {CHANNEL_LABELS[caseData.channel_of_origin] || caseData.channel_of_origin}
                  </span>
                )}
                {caseData.status && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', background: '#F1F5F9', padding: '4px 10px', borderRadius: 4, textTransform: 'capitalize' }}>
                    Status: {String(caseData.status).replace(/_/g, ' ')}
                  </span>
                )}
                {caseData.is_locked && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '4px 10px', borderRadius: 4, border: '1px solid #FCD34D' }}>
                    <Lock size={12} /> SP Locked
                  </span>
                )}
                {caseData.forwarded_to_swo && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#065F46', background: '#D1FAE5', padding: '4px 10px', borderRadius: 4, border: '1px solid #A7F3D0' }}>
                    <HeartHandshake size={12} /> SWO Directive Active
                  </span>
                )}
                {levelLabel && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#1E3A8A', background: '#DBEAFE', padding: '4px 10px', borderRadius: 4 }}>
                    Tier Level: {levelLabel}
                  </span>
                )}
              </div>

              {/* ── Official Complainant & Victim Profile Card ── */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '16px 20px',
                boxShadow: '0 2px 6px rgba(0, 115, 230, 0.04)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgb(0, 115, 230)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={15} color="rgb(0, 115, 230)" /> Complainant &amp; Incident Record Profile
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' }}>Complainant / Victim Name:</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {caseData.person_name || 'Complainant (Confidential)'}
                    </span>
                    {caseData.complainant_phone && (
                      <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Phone size={11} color="#64748B" /> {caseData.complainant_phone}
                      </span>
                    )}
                    {caseData.caste_category && (
                      <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: '#F1F5F9', color: '#334155', padding: '2px 6px', borderRadius: 3, border: '1px solid #CBD5E1', marginTop: 4 }}>
                        {caseData.caste_category}
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' }}>Incident Location &amp; Jurisdiction:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 2 }}>
                      <MapPin size={12} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                      {caseData.incident_location || `${caseData.district}, ${caseData.state}`}
                    </span>
                    <span style={{ fontSize: 11, color: '#0369A1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Building2 size={11} color="#0369A1" /> {caseData.police_station || 'PS Bhosari MIDC / Shivajinagar'}
                    </span>
                    {caseData.person_assaulted_date && (
                      <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Calendar size={11} color="#DC2626" /> Incident Date: {new Date(caseData.person_assaulted_date).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' }}>Applicable Acts &amp; Sections:</span>
                    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', padding: '4px 8px', borderRadius: 4, border: '1px solid #BFDBFE', marginTop: 3 }}>
                      {caseData.applicable_sections || 'SC/ST (PoA) Act Sec 3(1)(r), 3(2)(v), BNS 115'}
                    </span>
                    {caseData.assigned_io && (
                      <span style={{ fontSize: 11, color: '#334155', fontWeight: 700, display: 'block', marginTop: 6 }}>
                        Assigned IO: {caseData.assigned_io}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* High-Tech SVI Score Card */}
              <section aria-labelledby="svi-heading" style={{
                padding: '18px 20px',
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                borderRadius: 8,
                border: '1px solid #BFDBFE',
                boxShadow: '0 2px 8px rgba(0, 115, 230, 0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span id="svi-heading" style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1E40AF' }}>
                    Severity Vulnerability Index (SVI)
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: isCritical ? '#FEE2E2' : '#DBEAFE',
                    color: isCritical ? '#991B1B' : '#1E40AF',
                  }}>
                    {isCritical ? 'PRIORITY: IMMEDIATE ACTION REQUIRED' : 'AUTOMATED AI TRIAGE'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: isCritical ? '#B91C1C' : '#0F172A' }}>
                    {sviScore != null ? Number(sviScore).toFixed(1) : '75.0'}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#64748B' }}>/ 100.0</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                    Risk Tier: <strong style={{ color: isCritical ? '#B91C1C' : '#1D4ED8', textTransform: 'uppercase' }}>{riskTier}</strong>
                  </span>
                </div>

                <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(Math.max(sviScore ?? 75, 5), 100)}%`,
                    height: '100%',
                    background: isCritical
                      ? 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)'
                      : 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)',
                    borderRadius: 999,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </section>

              {/* Recorded Grievance Transcript */}
              <section aria-labelledby="narrative-heading" style={{
                padding: '14px 16px',
                background: '#F8FAFC',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #003366',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span id="narrative-heading" style={{ fontSize: 12, fontWeight: 800, color: '#003366', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Recorded Grievance Statement / Transcribed Speech
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#E2E8F0', padding: '2px 8px', borderRadius: 3 }}>
                    {caseData.language ? `Language: ${String(caseData.language).toUpperCase()}` : 'IVRS Marathi / Hindi'}
                  </span>
                </div>
                <div style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#0F172A',
                  background: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  whiteSpace: 'pre-wrap',
                }}>
                  "{caseData.incident_description || caseData.incidentType || 'No narrative text recorded.'}"
                </div>
              </section>

              {/* AI Forensic Explanation */}
              <section aria-labelledby="ai-explanation-heading">
                <h3 id="ai-explanation-heading" style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgb(0, 115, 230)', marginBottom: 8 }}>
                  AI Case Summary &amp; Forensic Explanation
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.7, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  {caseData.explanation_text || caseData.incident_description || 'Autonomous intake recorded via NHAA voice triage pipeline.'}
                </p>
              </section>

              {/* Recommended Action */}
              <section aria-labelledby="recommended-action-heading">
                <h3 id="recommended-action-heading" style={{ fontSize: 14, fontWeight: 800, color: 'rgb(0, 115, 230)', marginBottom: 8 }}>Recommended Action</h3>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  {ACTION_LABELS[caseData.recommended_action] || caseData.recommended_action || '—'}
                </p>
              </section>

              {/* Risk Flags */}
              {caseData.flags && (
                <section aria-labelledby="risk-flags-heading">
                  <h3 id="risk-flags-heading" style={{ fontSize: 14, fontWeight: 800, color: 'rgb(0, 115, 230)', marginBottom: 8 }}>Risk Flags</h3>
                  {activeFlags.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>No active risk flags.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeFlags.map((flag) => (
                        <li
                          key={flag.name}
                          style={{
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: 8,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#991B1B', textTransform: 'capitalize' }}>
                              {flag.name.replace(/_/g, ' ')}
                            </span>
                            {flag.confidence != null && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#7F1D1D' }}>
                                {(flag.confidence * 100).toFixed(0)}% confidence
                              </span>
                            )}
                          </div>
                          {flag.signals.length > 0 && (
                            <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#7F1D1D', fontSize: 12, lineHeight: 1.5 }}>
                              {flag.signals.map((signal) => (
                                <li key={signal}>{signal}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {/* Notifications Log */}
              <NotificationLog notifications={caseData.notifications || []} />

              {/* ── ROLE-SPECIFIC ACTION TERMINAL ── */}
              {isJudiciary ? (
                <div style={{
                  marginTop: 10,
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderLeft: '4px solid #7C3AED',
                  borderRadius: 8,
                  padding: 16,
                }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Scale size={16} /> Special Court Judicial Authority Actions
                  </h4>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#475569' }}>
                    Judges examine sealed evidence and issue binding orders to the District Social Welfare Officer under SC/ST (PoA) Act Rule 12(4) &amp; Section 15A.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('handoffs')}
                    style={{
                      background: '#7C3AED',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 18px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Scale size={15} /> Open Directives to SWO Terminal &rarr;
                  </button>
                </div>
              ) : isSWO ? (
                <div style={{
                  marginTop: 10,
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderLeft: '4px solid #059669',
                  borderRadius: 8,
                  padding: 16,
                }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HeartHandshake size={16} /> Social Welfare Officer (SWO) Relief Actions
                  </h4>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#166534' }}>
                    Process statutory compensation relief via DBT, coordinate social rehabilitation, and certify judicial compliance.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dbt_relief')}
                    style={{
                      background: '#065F46',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 18px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <IndianRupee size={15} /> Open DBT Disbursal Terminal &rarr;
                  </button>
                </div>
              ) : (
                /* Police / Operator Allowed Actions */
                <section aria-labelledby="case-actions-heading" style={{ marginTop: 10 }}>
                  <h3 id="case-actions-heading" style={{ fontSize: 14, fontWeight: 800, color: 'rgb(0, 115, 230)', marginBottom: 8 }}>
                    Allowed Operational Actions
                  </h3>
                  {actionsLoading && (
                    <p role="status" style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Loading actions…</p>
                  )}
                  {!actionsLoading && showEngineActions && engineActions.length === 0 && (
                    <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>No actions available for your role on this case.</p>
                  )}
                  {!actionsLoading &&
                    engineActions.map((action, idx) => {
                      if (action === 'mark_actioned' && alreadyActioned) {
                        return (
                          <p
                            key={action}
                            role="status"
                            style={{
                              width: '100%',
                              marginTop: 10,
                              background: '#D1FAE5',
                              color: '#065F46',
                              borderRadius: 8,
                              padding: '14px 20px',
                              fontSize: 14,
                              fontWeight: 800,
                              textAlign: 'center',
                            }}
                          >
                            Marked as actioned
                          </p>
                        );
                      }
                      return (
                        <button
                          key={action}
                          type="button"
                          disabled={Boolean(actionBusy)}
                          onClick={() => {
                            if (action === 'mark_actioned') onMarkActioned?.(caseData);
                            else onAction?.(action, caseData);
                          }}
                          style={{
                            ...actionButtonStyle(action, idx === 0),
                            opacity: actionBusy ? 0.7 : 1,
                            cursor: actionBusy ? 'wait' : 'pointer',
                          }}
                        >
                          {actionBusy === action ? 'Submitting…' : formatActionLabel(action)}
                        </button>
                      );
                    })}

                  {!isResponder && isCritical && typeof onConfirmAction === 'function' && (
                    <button
                      type="button"
                      onClick={() => onConfirmAction(caseData)}
                      style={{
                        ...actionButtonStyle('confirm', false),
                        marginTop: 16,
                        background: '#7F1D1D',
                      }}
                    >
                      Confirm Notifications (Human-in-the-Loop)
                    </button>
                  )}
                </section>
              )}
            </div>
          )}

          {/* ── TAB 2: CASE EXAMINATION FORM (Strictly Read-Only for Judiciary & SWO) ── */}
          {activeTab === 'examine' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {isJudiciary && (
                <div style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <Lock size={18} color="#1E40AF" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>
                      Sealed Special Court Dossier (Read-Only)
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                      Police field investigation records are tamper-sealed for judicial scrutiny. Under Section 14, judicial benches inspect factual records and issue adjudications.
                    </div>
                  </div>
                </div>
              )}

              {isSWO && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <ShieldCheck size={18} color="#065F46" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>
                      Verified Police Incident Record (Read-Only)
                    </div>
                    <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                      Social Welfare Officers review police and medical reports to process rehabilitation and DBT compensations under Rule 12(4).
                    </div>
                  </div>
                </div>
              )}

              <CaseExamineForm
                caseItem={caseData}
                onSaved={onRefresh}
                readOnly={isJudiciary || isSWO || Boolean(caseData.is_locked)}
              />
            </div>
          )}

          {/* ── TAB 3: EVIDENCE FILES (Read-Only for Judiciary & SWO) ── */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(isJudiciary || isSWO) && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: '#475569',
                }}>
                  <ShieldCheck size={16} color="#059669" />
                  <span>Evidence vault sealed with SHA-256 digital signature. Download and forensic verification enabled.</span>
                </div>
              )}

              <EvidenceUploader
                caseId={id}
                initialEvidence={caseData.evidence_files || []}
                readOnly={isJudiciary || isSWO || Boolean(caseData.is_locked)}
                onEvidenceChanged={onRefresh}
              />
            </div>
          )}

          {/* ── TAB 4: HIERARCHY, DIRECTIVES & HANDOFFS ── */}
          {activeTab === 'handoffs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Judiciary Directives to SWO (Prominent for Judiciary) */}
              {isJudiciary && (
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: 20 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Scale size={18} color="#7C3AED" /> Issue Statutory Judicial Directive to Social Welfare Officer (SWO)
                  </h4>
                  <p style={{ margin: '0 0 14px', fontSize: 12, color: '#475569' }}>
                    Under Section 15A &amp; Rule 12(4) of the SC/ST (PoA) Act, the Special Court orders the Social Welfare Department to disburse statutory relief and provide social rehabilitation.
                  </p>

                  {/* Preset Directive Buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      'Direct immediate 25% DBT disbursal under PoA Rule 12(4) within 7 days.',
                      'Deploy armed police witness protection under Section 15A(1).',
                      'Order Sassoon General Hospital to provide complimentary medical & psychological counseling.',
                      'Appoint Senior Legal Aid Counsel via DLSA Pune.',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSwoDirective(preset)}
                        style={{
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#1E40AF',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '6px 10px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        + {preset.slice(0, 45)}...
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleForwardToSWO} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        Adjudicated Directive / Welfare Relief Mandate:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="E.g. Disburse interim compensation under SC/ST Act Rule 12(4), initiate counselling, enroll victim under State Social Welfare Rehabilitation Scheme..."
                        value={swoDirective}
                        onChange={(e) => setSwoDirective(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={handoffState}
                        style={{
                          background: '#7C3AED',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: 13,
                          padding: '10px 20px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: handoffState ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Scale size={15} />
                        {handoffState ? 'Dispatching...' : 'Issue Binding Judicial Directive'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SWO Compliance Certificate (For SWO Desk) */}
              {isSWO && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 20 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="#065F46" /> SWO Compliance Certification &amp; Action Return
                  </h4>
                  
                  {caseData.judiciary_directive && (
                    <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: 6, border: '1px solid #86EFAC', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>Active Special Court Directive:</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{caseData.judiciary_directive}</div>
                    </div>
                  )}

                  <form onSubmit={handleSwoComplianceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        Welfare Action Taken Report / DBT Compliance Note:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="State DBT transaction reference, scheme linkage status, and victim contact report..."
                        value={swoComplianceNote}
                        onChange={(e) => setSwoComplianceNote(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        style={{
                          background: '#065F46',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: 13,
                          padding: '10px 20px',
                          borderRadius: 6,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <CheckCircle2 size={15} />
                        Certify Compliance to Special Court
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Police Internal Handoff & Locking (Only for Police Desk) */}
              {!isJudiciary && !isSWO && (
                <>
                  {/* SP Case Locking Control */}
                  {(['sp', 'director', 'ig'].includes(role) || caseData.is_locked) && (
                    <div style={{
                      background: caseData.is_locked ? '#FEF3C7' : '#EFF6FF',
                      border: `1px solid ${caseData.is_locked ? '#FCD34D' : '#BFDBFE'}`,
                      borderRadius: 8,
                      padding: 16,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Lock size={16} color="#0F172A" /> SP Case Lock Control (Pre-Judiciary Freeze)
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>
                            {caseData.is_locked
                              ? `Case is locked. Locked at ${caseData.locked_at ? new Date(caseData.locked_at).toLocaleString('en-IN') : 'recently'}.`
                              : 'Locking prevents further edits by ground officers before forwarding to judiciary.'}
                          </p>
                        </div>

                        {['sp', 'director', 'ig'].includes(role) && (
                          <button
                            type="button"
                            disabled={lockingState}
                            onClick={handleLockToggle}
                            style={{
                              background: caseData.is_locked ? '#059669' : '#DC2626',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: 12,
                              padding: '8px 16px',
                              borderRadius: 6,
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {caseData.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
                            {lockingState ? 'Updating...' : (caseData.is_locked ? 'Unlock Case' : 'Lock Case for Judiciary')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cross-Tier Handoff Transfer Form */}
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: 'rgb(0, 115, 230)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GitFork size={16} color="rgb(0, 115, 230)" /> Initiate Cross-Tier Case Handoff
                    </h4>
                    <form onSubmit={handleHandoffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                            Transfer to Tier Level:
                          </label>
                          <select
                            value={targetTier}
                            onChange={(e) => setTargetTier(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 6 }}
                          >
                            <option value="io">L-0.5: IO (Investigating Officer)</option>
                            <option value="acp">L-1: ACP (Asst. Commissioner)</option>
                            <option value="dsp">L-1: DSP (Deputy SP)</option>
                            <option value="sp">L-2: SP (Superintendent)</option>
                            <option value="director">L-3+: Director (Apex)</option>
                            <option value="judiciary">L-4: Judiciary / Legal Authority</option>
                            <option value="swo">L-5: SWO (Social Welfare)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          Handoff Instructions / Notes:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Specify rationale for transfer, priority observations, or supervisory directions..."
                          value={handoffNotes}
                          onChange={(e) => setHandoffNotes(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          disabled={handoffState}
                          style={{
                            background: 'rgb(0, 115, 230)',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: 13,
                            padding: '10px 18px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: handoffState ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Send size={14} />
                          {handoffState ? 'Transferring...' : 'Submit Handoff Transfer'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              {/* Chronological Handoff Audit Timeline */}
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={16} color="#0F172A" /> Chronological Chain-of-Custody &amp; Handoff Audit Trail
                </h4>

                {handoffs.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#64748B', padding: 16, textAlign: 'center', background: '#F8FAFC', borderRadius: 6, border: '1px dashed #CBD5E1' }}>
                    No tier handoffs recorded yet for this case.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {handoffs.map((h, i) => (
                      <div
                        key={h.id || i}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: 12,
                          borderRadius: 6,
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderLeft: '4px solid rgb(0, 115, 230)',
                        }}
                      >
                        <ArrowRight size={18} color="rgb(0, 115, 230)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                              {h.from_tier} &rarr; {h.to_tier}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              {h.created_at ? new Date(h.created_at).toLocaleString('en-IN') : 'Recent'}
                            </span>
                          </div>
                          {h.handoff_notes && (
                            <div style={{ fontSize: 12, color: '#334155', marginTop: 4, background: '#F8FAFC', padding: '6px 10px', borderRadius: 4 }}>
                              {h.handoff_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: SC/ST PoA ACT & VICTIM RIGHTS (SEC 15A) ── */}
          {activeTab === 'poa_law' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Active Case Statutory Sections Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                padding: '20px 24px',
                borderRadius: 8,
                border: '1px solid #334155',
                borderLeft: '5px solid rgb(0, 115, 230)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, background: 'rgb(0, 115, 230)', color: '#FFFFFF', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                      Active Statutory Booking &bull; Case #{id}
                    </span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: 17, fontWeight: 900, color: '#FFFFFF' }}>
                      {caseData.applicable_sections || 'SC/ST (PoA) Act Sec 3(1)(r), 3(2)(v), BNS 115'}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
                      Complainant: <strong style={{ color: '#F8FAFC' }}>{caseData.person_name}</strong> &bull; Jurisdiction: <strong style={{ color: '#F8FAFC' }}>{caseData.police_station || 'PS Bhosari / Shivajinagar'}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FEF2F2',
                      color: '#991B1B',
                      border: '1px solid #F87171',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                    }}>
                      <Lock size={12} /> SEC 18 BAR: NO ANTICIPATORY BAIL
                    </span>
                  </div>
                </div>
              </div>

              {/* Statutory Compliance Checklist */}
              <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Scale size={16} color="rgb(0, 115, 230)" /> Mandatory Statutory Procedural Checklist (PoA Act 1989 / 2016)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 6, border: '1px solid #CBD5E1', borderLeft: '4px solid #10B981' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#065F46' }}>Section 4: Public Servant Duty</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      Investigation &amp; Chargesheet must be completed within <strong>60 DAYS</strong>. Dereliction attracts penal action under Sec 4(1).
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 6, border: '1px solid #CBD5E1', borderLeft: '4px solid rgb(0, 115, 230)' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'rgb(0, 115, 230)' }}>Section 15A(10): Video Recording</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      All proceedings relating to offences under this Act must be <strong>video recorded</strong> to prevent witness intimidation.
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 6, border: '1px solid #CBD5E1', borderLeft: '4px solid #F59E0B' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>Section 15A(11): Victim Relief &amp; DBT</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      Free copy of FIR, immediate cash/kind relief, medical aid, travel maintenance, and socio-economic rehabilitation.
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 6, border: '1px solid #CBD5E1', borderLeft: '4px solid #8B5CF6' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9' }}>Section 14: Special Court Trial</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      Exclusive Special Court to conduct day-to-day trial and dispose case within <strong>2 MONTHS</strong> of chargesheet filing.
                    </div>
                  </div>
                </div>
              </div>

              {/* Searchable PoA Act Legal Dictionary */}
              <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="rgb(0, 115, 230)" /> PoA Act Statutory Sections Directory (Act 33 of 1989 &bull; Amended 2016)
                  </h4>
                  <input
                    type="text"
                    placeholder="Search section code or keyword (e.g., 3(1)(r), boycott, land, bail)..."
                    value={poaSearch}
                    onChange={(e) => setPoaSearch(e.target.value)}
                    style={{
                      padding: '7px 14px',
                      fontSize: 12,
                      border: '1.5px solid #CBD5E1',
                      borderRadius: 6,
                      minWidth: 280,
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgb(0, 115, 230)')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                  {POA_SECTIONS_DATABASE.filter((sec) => {
                    if (!poaSearch.trim()) return true;
                    const q = poaSearch.toLowerCase();
                    return (
                      sec.section.toLowerCase().includes(q) ||
                      sec.title.toLowerCase().includes(q) ||
                      sec.description.toLowerCase().includes(q) ||
                      sec.category.toLowerCase().includes(q)
                    );
                  }).map((sec) => (
                    <div
                      key={sec.section}
                      style={{
                        padding: '14px 18px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: 6,
                        borderLeft: '4px solid rgb(0, 115, 230)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 900, color: 'rgb(0, 115, 230)', fontFamily: 'monospace', fontSize: 13 }}>
                            {sec.section}
                          </span>
                          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                            {sec.title}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: 4 }}>
                          {sec.category}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 8px', fontSize: 12, color: '#334155', lineHeight: 1.45 }}>
                        {sec.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
                        <span>Punishment: <strong style={{ color: '#0F172A' }}>{sec.punishment}</strong></span>
                        <span style={{ color: '#065F46', fontWeight: 700 }}>Cognizable &bull; Non-Bailable</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

CaseDetailPanel.propTypes = {
  caseData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onConfirmAction: PropTypes.func,
  onMarkActioned: PropTypes.func,
  onAction: PropTypes.func,
  onRefresh: PropTypes.func,
  allowedActions: PropTypes.arrayOf(PropTypes.string),
  actionsLoading: PropTypes.bool,
  actionBusy: PropTypes.string,
  mode: PropTypes.oneOf(['operator', 'responder', 'judiciary', 'swo']),
};
