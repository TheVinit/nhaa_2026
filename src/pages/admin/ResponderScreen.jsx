import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { responderMockCases } from '../../data/responderMockCases';
import { getSession, RESPONDER_ROLES, ROLE_LABELS } from '../../utils/adminAuth';
import { mockAllowedActions } from '../../utils/caseLevel';
import { listCases, getAllowedActions, markCaseActioned } from '../../services/api';
import ResponderTaskCard from '../../components/admin/ResponderTaskCard';
import CaseDetailPanel from '../../components/admin/CaseDetailPanel';

function apiToResponderCase(row, role) {
  return {
    ...row,
    id: row.id ?? row.case_id,
    case_id: row.case_id ?? row.id,
    role: row.responder_type || row.role || role,
    actioned: Boolean(row.actioned),
    current_level: row.current_level,
    status: row.status,
  };
}

export default function ResponderScreen() {
  const session = getSession();
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const [tasks, setTasks] = useState(responderMockCases);
  const [selected, setSelected] = useState(null);
  const [useMock, setUseMock] = useState(true);
  const [allowedActions, setAllowedActions] = useState([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);

  useEffect(() => {
    if (!session || !RESPONDER_ROLES.includes(session.role)) return undefined;
    let cancelled = false;

    const load = async () => {
      if (!session?.token) {
        setTasks(responderMockCases);
        setUseMock(true);
        return;
      }
      try {
        const data = await listCases({ limit: 100 });
        if (cancelled) return;
        if (Array.isArray(data)) {
          setTasks(data.map((row) => apiToResponderCase(row, session.role)));
          setUseMock(false);
        }
      } catch {
        if (!cancelled) {
          setTasks(responderMockCases);
          setUseMock(true);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Presentation setup: full cross-desk access enabled
  const roleLabel = ROLE_LABELS[session?.role] || 'Field Officer';

  const viewFilteredTasks = tasks.filter((t) => {
    if (currentView === 'pending') {
      if (!['new', 'in_progress', 'escalated'].includes(t.status)) return false;
    } else if (currentView === 'approved') {
      if (!['resolved', 'closed'].includes(t.status)) return false;
    }
    return true;
  });

  const filtered = useMock
    ? viewFilteredTasks.filter((t) => t.role === session.role)
    : viewFilteredTasks;
  const pending = filtered.filter((t) => !t.actioned).length;

  const openCase = async (caseData) => {
    setSelected(caseData);
    setActionBusy(null);
    setActionsLoading(true);
    if (useMock || !session?.token) {
      setAllowedActions(mockAllowedActions(caseData, session.role));
      setActionsLoading(false);
      return;
    }
    try {
      const res = await getAllowedActions(caseData.id ?? caseData.case_id);
      setAllowedActions(res?.allowed_actions || ['mark_actioned']);
    } catch {
      setAllowedActions(mockAllowedActions(caseData, session.role));
    } finally {
      setActionsLoading(false);
    }
  };

  const handleMarkActioned = async (caseData) => {
    const caseId = caseData.case_id ?? caseData.id;
    setActionBusy('mark_actioned');

    if (useMock || !session?.token) {
      setTasks((prev) =>
        prev.map((t) =>
          (t.case_id === caseId || t.id === caseId) && (useMock ? t.role === session.role : true)
            ? { ...t, actioned: true }
            : t
        )
      );
      setSelected((cur) =>
        cur && (cur.case_id ?? cur.id) === caseId ? { ...cur, actioned: true } : cur
      );
      setAllowedActions([]);
      setActionBusy(null);
      return;
    }

    try {
      await markCaseActioned(caseId, { responder_type: session.role });
      setTasks((prev) =>
        prev.map((t) => ((t.case_id ?? t.id) === caseId ? { ...t, actioned: true } : t))
      );
      setSelected((cur) =>
        cur && (cur.case_id ?? cur.id) === caseId ? { ...cur, actioned: true } : cur
      );
      setAllowedActions([]);
    } catch (err) {
      console.warn('mark actioned failed', err);
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div
        role="region"
        aria-labelledby="responder-summary-heading"
        style={{
          background: '#EEF2FF',
          border: '1px solid #CBD5E1',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <h2 id="responder-summary-heading" style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#003366' }}>
          {ROLE_LABELS[session.role]} — Assigned Cases
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: '#475569' }} aria-live="polite">
          {useMock ? 'Mock data' : 'Live API'} · Open a case file to review SVI, nested AI flags, and checklist — then mark actioned · {pending} pending · {filtered.length} total
        </p>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: 14, color: '#475569', textAlign: 'center', padding: 40 }} role="status">
          No cases assigned to {ROLE_LABELS[session.role]} at this time.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Assigned responder tasks">
          {filtered.map((task) => (
            <li key={`${task.case_id}-${task.role || session.role}`}>
              <ResponderTaskCard task={task} onOpenCase={openCase} />
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <CaseDetailPanel
          caseData={selected}
          mode="responder"
          onClose={() => {
            setSelected(null);
            setAllowedActions([]);
            setActionBusy(null);
          }}
          onMarkActioned={handleMarkActioned}
          allowedActions={allowedActions}
          actionsLoading={actionsLoading}
          actionBusy={actionBusy}
        />
      )}
    </div>
  );
}
