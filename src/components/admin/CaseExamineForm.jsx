import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Calendar,
  FileText,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  ClipboardList,
} from 'lucide-react';
import { updateCaseExamine } from '../../services/api';
import EvidenceUploader from './EvidenceUploader';

export default function CaseExamineForm({ caseItem, onSaved, readOnly = false }) {
  const [formData, setFormData] = useState({
    person_name: '',
    incident_location: '',
    person_assaulted_date: '',
    date_of_report: '',
    exit_report: '',
    case_summary: '',
    incident_description: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseItem) {
      setFormData({
        person_name: caseItem.person_name || '',
        incident_location: caseItem.incident_location || '',
        person_assaulted_date: caseItem.person_assaulted_date ? caseItem.person_assaulted_date.slice(0, 16) : '',
        date_of_report: caseItem.date_of_report ? caseItem.date_of_report.slice(0, 16) : (caseItem.created_at ? caseItem.created_at.slice(0, 16) : ''),
        exit_report: caseItem.exit_report || '',
        case_summary: caseItem.case_summary || '',
        incident_description: caseItem.incident_description || '',
      });
    }
  }, [caseItem]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseItem?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const payload = {
        person_name: formData.person_name || null,
        incident_location: formData.incident_location || null,
        person_assaulted_date: formData.person_assaulted_date ? new Date(formData.person_assaulted_date).toISOString() : null,
        date_of_report: formData.date_of_report ? new Date(formData.date_of_report).toISOString() : null,
        exit_report: formData.exit_report || null,
        case_summary: formData.case_summary || null,
        incident_description: formData.incident_description || null,
      };

      await updateCaseExamine(caseItem.id, payload);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update case examination record');
    } finally {
      setSaving(false);
    }
  };

  const isLocked = caseItem?.is_locked;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Lock Warning */}
      {isLocked && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          color: '#92400E',
          padding: '12px 16px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <Lock size={16} />
          <span>Case record is locked by Superintendent of Police (SP) for Judiciary Forwarding. Modifications are restricted.</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '12px 16px', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', padding: '12px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={16} />
          <span>Case examination record successfully updated and synchronized to central database.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── 1. Victim & Location Data ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#003366', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} /> Section 1: Victim &amp; Incident Location Data
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Person Name (Victim / Complainant)
              </label>
              <input
                type="text"
                disabled={readOnly || isLocked}
                placeholder="Full Name (Encrypted in transit)"
                value={formData.person_name}
                onChange={(e) => handleChange('person_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: (readOnly || isLocked) ? '#F1F5F9' : '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Exact Incident Location &amp; GPS Coordinates
              </label>
              <input
                type="text"
                disabled={readOnly || isLocked}
                placeholder="Village / Ward, Landmark, GPS Coordinates"
                value={formData.incident_location}
                onChange={(e) => handleChange('incident_location', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: (readOnly || isLocked) ? '#F1F5F9' : '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 2. Timeline Metrics ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#003366', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} /> Section 2: Timeline Metrics
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Person Assaulted Date &amp; Time (Actual Occurrence)
              </label>
              <input
                type="datetime-local"
                disabled={readOnly || isLocked}
                value={formData.person_assaulted_date}
                onChange={(e) => handleChange('person_assaulted_date', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: (readOnly || isLocked) ? '#F1F5F9' : '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Official Date of Report (Helpline / Police Complaint)
              </label>
              <input
                type="datetime-local"
                disabled={readOnly || isLocked}
                value={formData.date_of_report}
                onChange={(e) => handleChange('date_of_report', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: (readOnly || isLocked) ? '#F1F5F9' : '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Incident Description & Case Summary ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#003366', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={16} /> Section 3: Case Narratives &amp; Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Incident Description (Original Transcript / Intake)
              </label>
              <textarea
                rows={3}
                disabled={readOnly || isLocked}
                value={formData.incident_description}
                onChange={(e) => handleChange('incident_description', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: (readOnly || isLocked) ? '#F1F5F9' : '#FFFFFF',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Comprehensive Case Summary &amp; Investigation Findings
              </label>
              <textarea
                rows={4}
                disabled={readOnly || isLocked}
                placeholder="Provide detailed breakdown of facts, accused individuals, preliminary IPC / SC-ST PoA sections..."
                value={formData.case_summary}
                onChange={(e) => handleChange('case_summary', e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: (readOnly || isLocked) ? '#F1F5F9' : '#FFFFFF',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 4. Reporting Output / Exit Report ── */}
        <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#003366', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} /> Section 4: Exit Report &amp; Closure Assessment
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Exit Report (Action Taken Report - ATR, Relief Recommendations)
            </label>
            <textarea
              rows={4}
              disabled={readOnly || isLocked}
              placeholder="Enter official exit report findings, relief compensation recommendations under SC/ST PoA Rules, medical assistance..."
              value={formData.exit_report}
              onChange={(e) => handleChange('exit_report', e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: 13,
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                background: (readOnly || isLocked) ? '#F1F5F9' : '#FFFFFF',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Submit Action Button */}
        {!readOnly && !isLocked && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#003366',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                padding: '10px 22px',
                borderRadius: 6,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Save size={15} />
              {saving ? 'Saving Records...' : 'Save Examination Record'}
            </button>
          </div>
        )}
      </form>

      {/* ── 5. Evidence Repository Section ── */}
      <EvidenceUploader caseId={caseItem?.id} initialEvidence={caseItem?.evidence_files || []} readOnly={readOnly || isLocked} />
    </div>
  );
}
