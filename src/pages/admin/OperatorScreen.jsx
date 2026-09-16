import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  listCases,
  connectWebSocket,
  getCaseNotifications,
  confirmOfficerDecision,
  getAllowedActions,
  postCaseAction,
  restoreDemoData,
} from '../../services/api';
import { operatorMockCases } from '../../data/operatorMockCases';
import { getSession } from '../../utils/adminAuth';
import { mockAllowedActions } from '../../utils/caseLevel';
import CaseTable from '../../components/admin/CaseTable';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';

function apiToCase(row) {
  const ra = row.risk_assessments?.[0];
  return {
    ...row,
    id: row.id,
    case_id: row.id,
    svi_score: row.svi_score ?? ra?.svi_score,
    risk_tier: row.risk_tier ?? ra?.risk_tier,
    explanation_text: ra?.explanation_text ?? row.explanation_text,
    flags: ra?.flags ?? row.flags,
    recommended_action: row.recommended_action,
    channel_of_origin: row.channel_of_origin,
    current_level: row.current_level,
    status: row.status,
    notifications: row.notifications || [],
  };
}

export default function OperatorScreen() {
  const session = getSession();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const [cases, setCases] = useState(operatorMockCases);
  const [selected, setSelected] = useState(null);
  const [useMock, setUseMock] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [allowedActions, setAllowedActions] = useState([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMsg, setDemoMsg] = useState(null);

  const mergeMock = (apiCases) => {
    // Always merge: live API cases first, then benchmark mock cases (IDs 1001-1008) that don't conflict
    const existingIds = new Set(apiCases.map(c => c.id));
    const extraMock = operatorMockCases.filter(m => !existingIds.has(m.id));
    return [...apiCases, ...extraMock];
  };

  const reloadCases = async () => {
    if (!session?.token) {
      setCases(operatorMockCases);
      setUseMock(true);
      return;
    }
    try {
      const data = await listCases({ limit: 100 });
      if (Array.isArray(data)) {
        setCases(mergeMock(data.map(apiToCase)));
        setUseMock(false);
      }
    } catch {
      setCases(operatorMockCases);
      setUseMock(true);
    }
  };

  const handleRestoreDemo = async () => {
    setDemoBusy(true);
    setDemoMsg(null);
    setSelected(null);
    try {
      if (!session?.token) {
        setCases(operatorMockCases);
        setUseMock(true);
        setDemoMsg({ ok: true, text: 'Offline mode — loaded local demo cases.' });
        return;
      }
      const result = await restoreDemoData();
      await reloadCases();
      setDemoMsg({
        ok: true,
        text: `Demo ready — ${result.count} presentation cases seeded (nested flags + escalated example).`,
      });
    } catch (err) {
      setDemoMsg({ ok: false, text: err.message || 'Could not restore demo data.' });
    } finally {
      setDemoBusy(false);
    }
  };

  useEffect(() => {
    // Presentation mode: accessible to all officer roles
    let ws;
    let cancelled = false;

    const load = async () => {
      // JWT-scoped list — only works after real login
      if (!session?.token) {
        setCases(operatorMockCases);
        setUseMock(true);
        return;
      }
      try {
        const data = await listCases({ limit: 100 });
        if (!cancelled) {
          if (Array.isArray(data) && data.length) {
            setCases(mergeMock(data.map(apiToCase)));
            setUseMock(false);
          } else if (Array.isArray(data)) {
            // API returned empty array — just show mock
            setCases(operatorMockCases);
            setUseMock(false);
          } else {
            setCases(operatorMockCases);
            setUseMock(true);
          }
        }
      } catch {
        if (!cancelled) {
          setCases(operatorMockCases);
          setUseMock(true);
        }
      }
    };

    load();

    try {
      ws = connectWebSocket((msg) => {
        if (cancelled) return;

        if (msg.event === 'case_created') {
          setCases((prev) => [apiToCase(msg.data), ...prev]);
        }

        if (msg.event === 'case_updated' || msg.event === 'risk_assessment_created') {
          setCases((prev) =>
            prev.map((c) => {
              const id = c.id ?? c.case_id;
              if (id === msg.data?.id || id === msg.data?.case_id) {
                return { ...c, ...apiToCase(msg.data) };
              }
              return c;
            })
          );
          setSelected((prev) => {
            if (!prev) return prev;
            const id = prev.id ?? prev.case_id;
            if (id === msg.data?.id || id === msg.data?.case_id) {
              return { ...prev, ...apiToCase(msg.data) };
            }
            return prev;
          });
        }

        if (msg.event === 'notifications_created' || msg.event === 'notifications_dispatched') {
          const affectedCaseId = msg.data?.case_id;
          setSelected((prev) => {
            const prevId = prev?.id ?? prev?.case_id;
            if (!prev || prevId !== affectedCaseId) return prev;
            getCaseNotifications(affectedCaseId)
              .then((notifs) => {
                setSelected((cur) => (cur ? { ...cur, notifications: notifs } : cur));
              })
              .catch(() => {});
            return prev;
          });
        }
      });
      ws.onopen = () => setWsConnected(true);
    } catch {
      setWsConnected(false);
    }

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [session]);

  // Presentation setup: full cross-desk access

  const loadAllowed = async (caseData, mockMode) => {
    const id = caseData.id ?? caseData.case_id;
    setActionsLoading(true);
    if (mockMode || !session?.token) {
      setAllowedActions(mockAllowedActions(caseData, 'operator'));
      setActionsLoading(false);
      return;
    }
    try {
      const res = await getAllowedActions(id);
      setAllowedActions(res?.allowed_actions || []);
    } catch {
      setAllowedActions(mockAllowedActions(caseData, 'operator'));
    } finally {
      setActionsLoading(false);
    }
  };

  const handleViewCase = async (caseData) => {
    setSelected(caseData);
    setConfirmStatus(null);
    setActionBusy(null);
    await loadAllowed(caseData, useMock);
    if (useMock || !session?.token) return;
    const id = caseData.id ?? caseData.case_id;
    try {
      const notifications = await getCaseNotifications(id);
      setSelected((cur) => (cur && (cur.id ?? cur.case_id) === id ? { ...cur, notifications } : cur));
    } catch {
      // keep panel open
    }
  };

  const handleEngineAction = async (action, caseData) => {
    const id = caseData.id ?? caseData.case_id;
    setActionBusy(action);
    setConfirmStatus({ caseId: id, state: 'sending', action });

    if (useMock || !session?.token) {
      // Simulate local state update for offline demo
      const nextLevel =
        action === 'escalate_to_district'
          ? 'district'
          : action === 'escalate_to_state'
            ? 'state'
            : action === 'escalate_to_ministry'
              ? 'ministry'
              : action === 'assign_operator'
                ? 'operator'
                : caseData.current_level;
      const nextStatus =
        action === 'resolve'
          ? 'resolved'
          : action === 'close'
            ? 'closed'
            : action.startsWith('escalate')
              ? 'escalated'
              : action === 'assign_operator'
                ? 'in_progress'
                : caseData.status;

      const patch = { status: nextStatus, current_level: nextLevel };
      setCases((prev) => prev.map((c) => ((c.id ?? c.case_id) === id ? { ...c, ...patch } : c)));
      setSelected((cur) => (cur && (cur.id ?? cur.case_id) === id ? { ...cur, ...patch } : cur));
      setAllowedActions(mockAllowedActions({ ...caseData, ...patch }, 'operator'));
      setConfirmStatus({ caseId: id, state: 'done', action });
      setActionBusy(null);
      return;
    }

    try {
      const result = await postCaseAction(id, action);
      const patch = {
        status: result.status ?? caseData.status,
        current_level: result.current_level ?? caseData.current_level,
      };
      setCases((prev) => prev.map((c) => ((c.id ?? c.case_id) === id ? { ...c, ...patch } : c)));
      const updated = { ...caseData, ...patch };
      setSelected((cur) => (cur && (cur.id ?? cur.case_id) === id ? { ...cur, ...patch } : cur));
      await loadAllowed(updated, false);
      setConfirmStatus({ caseId: id, state: 'done', action });
    } catch (err) {
      setConfirmStatus({ caseId: id, state: 'error', message: err.message, action });
    } finally {
      setActionBusy(null);
    }
  };

  const handleConfirmAction = async (caseData) => {
    const id = caseData.id ?? caseData.case_id;
    const confirmedBy = session?.name || session?.username || `operator_${session?.district || 'unknown'}`;

    setConfirmStatus({ caseId: id, state: 'sending' });
    try {
      const dispatched = await confirmOfficerDecision(id, confirmedBy);
      setConfirmStatus({ caseId: id, state: 'done', count: dispatched.length });
      setSelected((cur) => (cur && (cur.id ?? cur.case_id) === id ? { ...cur, notifications: dispatched } : cur));
    } catch (err) {
      setConfirmStatus({ caseId: id, state: 'error', message: err.message });
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#475569' }} role="status" aria-live="polite">
          {useMock ? 'Showing mock data' : 'Live API'} · Auth: {session.token ? 'JWT' : 'offline'} · WebSocket: {wsConnected ? 'connected' : 'offline'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRestoreDemo}
            disabled={demoBusy}
            title="Seed SIH presentation cases with nested flags, status, and current_level"
            style={{
              background: '#003366',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: demoBusy ? 'wait' : 'pointer',
              opacity: demoBusy ? 0.75 : 1,
            }}
          >
            {demoBusy ? 'Restoring…' : 'Restore demo data'}
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '4px 12px', borderRadius: 999 }}>
            {cases.length} cases in queue
          </span>
        </div>
      </div>

      {demoMsg && (
        <p
          role={demoMsg.ok ? 'status' : 'alert'}
          style={{
            margin: '0 0 14px',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: demoMsg.ok ? '#ECFDF5' : '#FEF2F2',
            color: demoMsg.ok ? '#065F46' : '#991B1B',
            border: `1px solid ${demoMsg.ok ? '#A7F3D0' : '#FECACA'}`,
          }}
        >
          {demoMsg.text}
        </p>
      )}

      <CaseTable cases={cases.filter(c => {
        if (currentView === 'pending') return ['new', 'in_progress', 'escalated'].includes(c.status);
        if (currentView === 'approved') return ['resolved', 'closed'].includes(c.status);
        return true;
      })} onViewCase={handleViewCase} />

      {selected && (
        <CaseDetailPanel
          caseData={selected}
          onClose={() => {
            setSelected(null);
            setConfirmStatus(null);
            setAllowedActions([]);
            setActionBusy(null);
          }}
          onConfirmAction={session.token && !useMock ? handleConfirmAction : undefined}
          onAction={handleEngineAction}
          allowedActions={allowedActions}
          actionsLoading={actionsLoading}
          actionBusy={actionBusy}
        />
      )}

      {confirmStatus?.state === 'sending' && (
        <div role="status" aria-live="polite" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200, background: '#1E293B', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13 }}>
          {confirmStatus.action ? `Submitting ${confirmStatus.action}…` : 'Confirming action…'}
        </div>
      )}
      {confirmStatus?.state === 'done' && (
        <div role="status" aria-live="polite" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200, background: '#065F46', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13 }}>
          {confirmStatus.action
            ? `Action “${confirmStatus.action}” applied.`
            : `Action confirmed — ${confirmStatus.count} agencies notified.`}
        </div>
      )}
      {confirmStatus?.state === 'error' && (
        <div role="alert" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200, background: '#991B1B', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13 }}>
          Could not complete: {confirmStatus.message}
        </div>
      )}
    </div>
  );
}
