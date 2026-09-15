import React, { useState } from 'react';
import { 
  Eye, 
  User, 
  Users, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  UploadCloud, 
  Sparkles, 
  Copy, 
  Clock, 
  Scale, 
  Building2 
} from 'lucide-react';

export default function GrievanceRegistrationWizard({ 
  onCancel, 
  onSuccess, 
  highContrast = false,
  onNavigateTrack
}) {
  // Current active step (0 is the mandatory notice, 1 to 5 are the form, and 6 is success)
  const [currentStep, setCurrentStep] = useState(0);
  const [ivrsAcknowledged, setIvrsAcknowledged] = useState(false);
  const [truthfulDeclaration, setTruthfulDeclaration] = useState(false);

  // Step 1: Grievance Registration
  const [grievanceType, setGrievanceType] = useState('FIR');
  const [hasFir, setHasFir] = useState('Yes');
  const [registrationRole, setRegistrationRole] = useState('informer'); // 'informer' | 'victim' | 'ngo'
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(true); // Default true for MVP bypass!

  // Step 2: Informer / Complainant Details
  const [informerData, setInformerData] = useState({
    fullName: 'Rajesh Kumar Verma',
    mobile: '9876543210',
    email: 'rajesh.verma@example.org',
    relation: 'Neighbour / Eyewitness',
    address: 'Plot 42, Indira Nagar, Baramati',
    state: 'Maharashtra',
    district: 'Pune',
    pincode: '413102',
    isConfidential: true,
  });

  // Step 3: Victim Details
  const [victimData, setVictimData] = useState({
    fullName: 'Santosh Sakharam Kamble',
    fatherName: 'Sakharam Kamble',
    gender: 'Male',
    age: '34',
    category: 'Scheduled Caste (SC)',
    subCaste: 'Mahar',
    mobile: '9822341908',
    address: 'Near Water Tank, Ward No. 4, Baramati Rural',
    district: 'Pune',
    state: 'Maharashtra',
    occupation: 'Agricultural Laborer',
  });

  // Step 4: Grievance Details
  const [grievanceData, setGrievanceData] = useState({
    incidentDate: '2026-09-08',
    incidentTime: '17:30',
    incidentLocation: 'Baramati Taluka Agricultural Boundary',
    policeStation: 'Baramati Rural Police Station',
    poaSection: 'Section 3(1)(g) - Wrongful dispossession of land / crop destruction',
    description: 'Complainant reports illegal encroachment and fencing of agricultural land owned by the SC victim. Influential local landlords used heavy earthmoving machinery to destroy standing crops and issued severe caste-based abuses and social boycott threats.',
    firNumber: 'FIR/309/2026/SC-ST-POA',
    firDate: '2026-09-09',
    reliefClaimed: '₹4,25,000 (Scheduled Relief for Atrocities on Property & Crops)',
    evidenceFile: 'FIR_Copy_Signed_Baramati_PS.pdf',
  });

  // Step 5: Final Submission state
  const [declarationAccepted, setDeclarationAccepted] = useState(true);
  const [generatedRefId, setGeneratedRefId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Auto-fill demo mock data helper for swift hackathon judge presentation
  const handleAutoFillDemo = () => {
    setGrievanceType('FIR');
    setHasFir('Yes');
    setRegistrationRole('informer');
    setMobileNumber('9876543210');
    setOtpVerified(true);
    setOtpSent(true);
  };

  // OTP Bypass handler for MVP
  const handleSendOtp = () => {
    setOtpSent(true);
    setOtpVerified(true); // Instant bypass as requested!
  };

  // Step Navigation Handlers
  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Submit
      handleSubmitGrievance();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit and save grievance
  const handleSubmitGrievance = () => {
    if (!ivrsAcknowledged || !truthfulDeclaration) {
      setCurrentStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const newId = `NHAA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedRefId(newId);

    // Save to localStorage so tracking and admin screens instantly reflect this demo entry
    try {
      const existing = JSON.parse(localStorage.getItem('nhaa_grievances') || '[]');
      const newEntry = {
        id: newId,
        type: grievanceType,
        hasFir: hasFir,
        role: registrationRole,
        ivrs_acknowledged: ivrsAcknowledged,
        truthful_declaration: truthfulDeclaration,
        informer: informerData,
        victim: victimData,
        grievance: grievanceData,
        submittedAt: new Date().toISOString(),
        status: 'Case Registered & Assigned',
        assignedOfficer: 'SP / Nodal Officer, Atrocities Cell (Pune)',
        reliefStatus: 'Relief Stage 1: Document Verification in progress (₹1,00,000)',
      };
      existing.unshift(newEntry);
      localStorage.setItem('nhaa_grievances', JSON.stringify(existing));
    } catch (err) {
      console.warn('Could not save to localStorage', err);
    }

    setCurrentStep(6); // Move to Success Screen
    if (onSuccess) onSuccess(newId);
  };

  const handleCopyId = () => {
    if (generatedRefId) {
      navigator.clipboard.writeText(generatedRefId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // Steps definition for top stepper
  const steps = [
    { num: 0, label: 'Important Notice' },
    { num: 1, label: 'Grievance Registration' },
    { num: 2, label: registrationRole === 'informer' ? 'Informer Details' : registrationRole === 'ngo' ? 'NGO Details' : 'Complainant Details' },
    { num: 3, label: 'Victim Details' },
    { num: 4, label: 'Grievance Details' },
    { num: 5, label: 'Review & Submit' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 1220, margin: '0 auto', paddingBottom: 60 }}>
      {/* ─── QUICK DEMO HELPER BAR ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: highContrast ? '#1E293B' : '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: 8,
          padding: '8px 16px',
          marginBottom: 24,
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
          <Sparkles size={16} color="#0052CC" />
          <span>
            <strong>Official RJI Demonstration Mode:</strong> All OTP verifications and identity checks are automatically bypassed for fast presentation.
          </span>
        </div>
        <button
          type="button"
          onClick={handleAutoFillDemo}
          style={{
            background: '#003366',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Auto-Fill Demo Values
        </button>
      </div>

      {/* ─── 5-STEP HORIZONTAL STEPPER ─── */}
      {currentStep <= 5 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
            padding: '0 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 940 }}>
            {steps.map((step, idx) => {
              const isCompleted = currentStep > step.num;
              const isActive = currentStep === step.num;

              return (
                <React.Fragment key={step.num}>
                  {/* Step Item */}
                  <div
                    onClick={() => {
                      // Allow going back to completed steps
                      if (step.num < currentStep) setCurrentStep(step.num);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: step.num < currentStep ? 'pointer' : 'default',
                      position: 'relative',
                      minWidth: 120,
                    }}
                  >
                    {/* Circle */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                        background: isActive
                          ? '#003366'
                          : isCompleted
                          ? '#003366'
                          : highContrast
                          ? '#222'
                          : '#FFFFFF',
                        color: isActive || isCompleted ? '#FFFFFF' : '#64748B',
                        border: isActive || isCompleted ? '2px solid #003366' : '2px solid #CBD5E1',
                        boxShadow: isActive ? '0 0 0 4px rgba(0, 51, 102, 0.12)' : 'none',
                      }}
                    >
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : step.num}
                    </div>

                    {/* Step Label */}
                    <span
                      style={{
                        marginTop: 8,
                        fontSize: '12.5px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive
                          ? highContrast ? '#FFFFFF' : '#0F172A'
                          : isCompleted
                          ? highContrast ? '#E2E8F0' : '#334155'
                          : '#94A3B8',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connecting Line between steps */}
                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: currentStep > step.num ? '#003366' : '#E2E8F0',
                        margin: '0 8px',
                        marginBottom: 26,
                        transition: 'background 0.25s ease',
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Mandatory IVRS and truthfulness notice */}
      {currentStep === 0 && (
        <div
          style={{
            background: highContrast ? '#181818' : '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '36px 44px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 10, flexShrink: 0,
              background: '#FFF7ED', border: '1px solid #FED7AA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={24} color="#EA580C" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 4px' }}>
                Important Notice Before Filing
              </h2>
              <p style={{ fontSize: '13.5px', color: highContrast ? '#bbb' : '#64748B', margin: 0, lineHeight: 1.5 }}>
                Please read both notices carefully. You must accept them before starting the grievance form.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '18px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <Phone size={22} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1D4ED8', marginBottom: 6 }}>Automated IVRS-assisted call</div>
                <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
                  This is an automated IVRS-assisted grievance call. After submission, you may be connected with a human operator for verification or further assistance.
                </div>
              </div>
            </div>

            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '18px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <Scale size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#B91C1C', marginBottom: 6 }}>True information only</div>
                <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>
                  Provide only true information. False or misleading complaints may attract legal action under applicable law, including BNS Sections 217 and 248.
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #F59E0B',
            borderRadius: 8, padding: '13px 16px', marginBottom: 22,
            fontSize: 12.5, color: '#92400E', lineHeight: 1.5,
          }}>
            <strong>Declaration requirement:</strong> Both acknowledgements are mandatory. You can return to this notice before final submission if you need to review it again.
          </div>

          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
            background: ivrsAcknowledged ? '#F0FDF4' : '#F8FAFC',
            border: `1px solid ${ivrsAcknowledged ? '#86EFAC' : '#CBD5E1'}`,
            borderRadius: 8, padding: '13px 15px', marginBottom: 12,
          }}>
            <input
              type="checkbox"
              checked={ivrsAcknowledged}
              onChange={(e) => setIvrsAcknowledged(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 1, accentColor: '#16A34A', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: '#166534', lineHeight: 1.45 }}>
              <strong>I understand the IVRS process.</strong> I acknowledge that this is an automated IVRS-assisted grievance call and that I may be connected with a human operator after submission.
            </span>
          </label>

          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
            background: truthfulDeclaration ? '#F0FDF4' : '#F8FAFC',
            border: `1px solid ${truthfulDeclaration ? '#86EFAC' : '#CBD5E1'}`,
            borderRadius: 8, padding: '13px 15px', marginBottom: 24,
          }}>
            <input
              type="checkbox"
              checked={truthfulDeclaration}
              onChange={(e) => setTruthfulDeclaration(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 1, accentColor: '#16A34A', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: '#166534', lineHeight: 1.45 }}>
              <strong>I declare that my complaint is truthful.</strong> I understand that false or misleading information may result in legal action under applicable law, including BNS Sections 217 and 248.
            </span>
          </label>

          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <div />
            <button
              type="button"
              onClick={handleNextStep}
              disabled={!ivrsAcknowledged || !truthfulDeclaration}
              style={{
                background: ivrsAcknowledged && truthfulDeclaration ? '#003366' : '#94A3B8',
                color: '#FFFFFF', border: 'none', borderRadius: 6,
                padding: '10px 24px', fontSize: '13.5px', fontWeight: 700,
                cursor: ivrsAcknowledged && truthfulDeclaration ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: ivrsAcknowledged && truthfulDeclaration ? '0 2px 6px rgba(0,51,102,0.2)' : 'none',
              }}
            >
              <span>I Understand, Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 1: GRIEVANCE REGISTRATION (EXACT MATCH WITH SCREENSHOT) ─── */}
      {currentStep === 1 && (
        <div
          style={{
            background: highContrast ? '#181818' : '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '36px 44px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          {/* Form Header */}
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: highContrast ? '#fff' : '#0F172A',
                margin: '0 0 4px',
                letterSpacing: -0.2,
              }}
            >
              Grievance Registration
            </h2>
            <p
              style={{
                fontSize: '13.5px',
                color: highContrast ? '#bbb' : '#64748B',
                margin: 0,
              }}
            >
              Select grievance type, FIR details, and your submission role to proceed.
            </p>
          </div>

          {/* Question 1: Grievance related to * */}
          <div style={{ marginBottom: 26 }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: highContrast ? '#eee' : '#1E293B',
                marginBottom: 10,
              }}
            >
              Grievance related to <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
              {['FIR', 'Relief', 'Charge Sheet', 'Corruption'].map((type) => (
                <label
                  key={type}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '13.5px',
                    color: highContrast ? '#ddd' : '#334155',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="grievanceType"
                    value={type}
                    checked={grievanceType === type}
                    onChange={(e) => setGrievanceType(e.target.value)}
                    style={{
                      width: 17,
                      height: 17,
                      accentColor: '#003366',
                      cursor: 'pointer',
                    }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 2: Do you have a registered FIR? * */}
          <div style={{ marginBottom: 34 }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: highContrast ? '#eee' : '#1E293B',
                marginBottom: 10,
              }}
            >
              Do you have a registered FIR? <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {['Yes', 'No'].map((opt) => (
                <label
                  key={opt}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '13.5px',
                    color: highContrast ? '#ddd' : '#334155',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="hasFir"
                    value={opt}
                    checked={hasFir === opt}
                    onChange={(e) => setHasFir(e.target.value)}
                    style={{
                      width: 17,
                      height: 17,
                      accentColor: '#003366',
                      cursor: 'pointer',
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section: REGISTRATION OF GRIEVANCE BY */}
          <div style={{ marginBottom: 34 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              REGISTRATION OF GRIEVANCE BY
            </div>

            {/* 3 Columns Grid of Role Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {/* Card 1: As an Informer */}
              <div
                onClick={() => setRegistrationRole('informer')}
                style={{
                  background: registrationRole === 'informer' ? '#EBF3FE' : highContrast ? '#222' : '#FFFFFF',
                  border: registrationRole === 'informer' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  boxShadow: registrationRole === 'informer' ? '0 2px 8px rgba(37,99,235,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  {/* Eye Icon Container */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      background: registrationRole === 'informer' ? '#003366' : '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Eye size={22} color="#FFFFFF" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: highContrast ? '#fff' : '#0F172A',
                        marginBottom: 3,
                      }}
                    >
                      As an Informer
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: highContrast ? '#bbb' : '#64748B',
                        lineHeight: 1.35,
                      }}
                    >
                      Reporting on behalf of another person or public interest
                    </div>
                  </div>
                </div>

                {/* Selection Radio Circle */}
                <div style={{ paddingLeft: 8, marginTop: 4 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: registrationRole === 'informer' ? '5px solid #2563EB' : '2px solid #CBD5E1',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Card 2: As a Victim */}
              <div
                onClick={() => setRegistrationRole('victim')}
                style={{
                  background: registrationRole === 'victim' ? '#EBF3FE' : highContrast ? '#222' : '#FFFFFF',
                  border: registrationRole === 'victim' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  boxShadow: registrationRole === 'victim' ? '0 2px 8px rgba(37,99,235,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  {/* User Icon Container */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <User size={22} color="#2563EB" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: highContrast ? '#fff' : '#0F172A',
                        marginBottom: 3,
                      }}
                    >
                      As a Victim
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: highContrast ? '#bbb' : '#64748B',
                        lineHeight: 1.35,
                      }}
                    >
                      Directly affected and filing on your own behalf
                    </div>
                  </div>
                </div>

                {/* Selection Radio Circle */}
                <div style={{ paddingLeft: 8, marginTop: 4 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: registrationRole === 'victim' ? '5px solid #2563EB' : '2px solid #CBD5E1',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Card 3: As an NGO */}
              <div
                onClick={() => setRegistrationRole('ngo')}
                style={{
                  background: registrationRole === 'ngo' ? '#EBF3FE' : highContrast ? '#222' : '#FFFFFF',
                  border: registrationRole === 'ngo' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  boxShadow: registrationRole === 'ngo' ? '0 2px 8px rgba(37,99,235,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  {/* Users/NGO Icon Container */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Users size={22} color="#2563EB" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: highContrast ? '#fff' : '#0F172A',
                        marginBottom: 3,
                      }}
                    >
                      As an NGO
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: highContrast ? '#bbb' : '#64748B',
                        lineHeight: 1.35,
                      }}
                    >
                      Organization filing for one or more beneficiaries
                    </div>
                  </div>
                </div>

                {/* Selection Radio Circle */}
                <div style={{ paddingLeft: 8, marginTop: 4 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: registrationRole === 'ngo' ? '5px solid #2563EB' : '2px solid #CBD5E1',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: IDENTITY VERIFICATION */}
          <div
            style={{
              borderTop: '1px solid #F1F5F9',
              paddingTop: 24,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              IDENTITY VERIFICATION
            </div>

            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: highContrast ? '#eee' : '#1E293B',
                marginBottom: 8,
              }}
            >
              Mobile No. <span style={{ color: '#EF4444' }}>*</span>
            </label>

            {/* Input + Send OTP Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 460 }}>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit Mobile Number"
                style={{
                  flex: 1,
                  padding: '9.5px 14px',
                  fontSize: '13.5px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  background: highContrast ? '#222' : '#FFFFFF',
                  color: highContrast ? '#fff' : '#0F172A',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                style={{
                  background: otpSent ? '#E2E8F0' : '#DBEAFE',
                  color: otpSent ? '#475569' : '#1D4ED8',
                  border: 'none',
                  padding: '9.5px 18px',
                  borderRadius: 6,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
              >
                {otpSent ? 'OTP Resent' : 'Send OTP'}
              </button>
            </div>

            {/* Helper Text and MVP Bypass Badge */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '12px', color: highContrast ? '#aaa' : '#64748B' }}>
                OTP will be sent to your registered mobile number for identity verification.
              </div>

              {/* MVP Bypass Visual Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: '12px',
                  fontWeight: 600,
                  width: 'fit-content',
                }}
              >
                <CheckCircle2 size={14} color="#059669" />
                <span>Instant Demo Bypass Active: No physical OTP verification required for demonstration.</span>
              </div>
            </div>
          </div>

          {/* Footer Actions: Cancel & Save and Continue */}
          <div
            style={{
              borderTop: '1px solid #F1F5F9',
              paddingTop: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: highContrast ? '#222' : '#FFFFFF',
                color: highContrast ? '#ddd' : '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '9px 24px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              style={{
                background: '#003366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(0,51,102,0.2)',
                transition: 'background 0.15s',
              }}
            >
              <span>Save and Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: INFORMER / COMPLAINANT DETAILS ─── */}
      {currentStep === 2 && (
        <div
          style={{
            background: highContrast ? '#181818' : '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '36px 44px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 4px' }}>
              {registrationRole === 'informer' ? 'Informer / Whistleblower Details' : registrationRole === 'ngo' ? 'NGO Representative Details' : 'Complainant Identity Details'}
            </h2>
            <p style={{ fontSize: '13.5px', color: highContrast ? '#bbb' : '#64748B', margin: 0 }}>
              Official contact particulars for legal investigation updates and formal correspondence.
            </p>
          </div>

          {/* Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={informerData.fullName}
                onChange={(e) => setInformerData({ ...informerData, fullName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Mobile Number <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={informerData.mobile}
                onChange={(e) => setInformerData({ ...informerData, mobile: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={informerData.email}
                onChange={(e) => setInformerData({ ...informerData, email: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Relationship to Victim <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={informerData.relation}
                onChange={(e) => setInformerData({ ...informerData, relation: e.target.value })}
                style={{ width: '100%', padding: '9.5px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', boxSizing: 'border-box' }}
              >
                <option>Neighbour / Eyewitness</option>
                <option>Family Relative</option>
                <option>Community Elder / Social Worker</option>
                <option>Legal Aid Advocate</option>
                <option>Concerned Citizen / Whistleblower</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                State / UT <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={informerData.state}
                onChange={(e) => setInformerData({ ...informerData, state: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                District <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={informerData.district}
                onChange={(e) => setInformerData({ ...informerData, district: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Residential / Official Address
            </label>
            <input
              type="text"
              value={informerData.address}
              onChange={(e) => setInformerData({ ...informerData, address: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
            />
          </div>

          {/* PoA Confidentiality Toggle */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 28,
            }}
          >
            <input
              type="checkbox"
              id="informerConfidential"
              checked={informerData.isConfidential}
              onChange={(e) => setInformerData({ ...informerData, isConfidential: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: '#16A34A', cursor: 'pointer' }}
            />
            <label htmlFor="informerConfidential" style={{ fontSize: '13px', color: '#166534', cursor: 'pointer' }}>
              <strong>Witness Protection (Section 15A PoA Act):</strong> Keep my name and contact confidential from the accused persons and local authorities.
            </label>
          </div>

          {/* Navigation Buttons */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handlePrevStep}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '9px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              style={{
                background: '#003366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Save and Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: VICTIM DETAILS ─── */}
      {currentStep === 3 && (
        <div
          style={{
            background: highContrast ? '#181818' : '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '36px 44px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 4px' }}>
              Victim Particulars & Community Classification
            </h2>
            <p style={{ fontSize: '13.5px', color: highContrast ? '#bbb' : '#64748B', margin: 0 }}>
              Required for sanctioning relief disbursements and establishing jurisdiction under the PoA Act 1989.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Victim Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={victimData.fullName}
                onChange={(e) => setVictimData({ ...victimData, fullName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Father's / Spouse's Name
              </label>
              <input
                type="text"
                value={victimData.fatherName}
                onChange={(e) => setVictimData({ ...victimData, fatherName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Gender <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={victimData.gender}
                onChange={(e) => setVictimData({ ...victimData, gender: e.target.value })}
                style={{ width: '100%', padding: '9.5px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', boxSizing: 'border-box' }}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Transgender Person</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Age (Years) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                value={victimData.age}
                onChange={(e) => setVictimData({ ...victimData, age: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Category Classification <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={victimData.category}
                onChange={(e) => setVictimData({ ...victimData, category: e.target.value })}
                style={{ width: '100%', padding: '9.5px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', boxSizing: 'border-box' }}
              >
                <option>Scheduled Caste (SC)</option>
                <option>Scheduled Tribe (ST)</option>
                <option>Safai Karamchari / Sanitation Worker</option>
                <option>Other Marginalized Category</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Sub-Caste / Community
              </label>
              <input
                type="text"
                value={victimData.subCaste}
                onChange={(e) => setVictimData({ ...victimData, subCaste: e.target.value })}
                placeholder="e.g. Mahar, Valmiki, Gond, etc."
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Victim Mobile Number
              </label>
              <input
                type="tel"
                value={victimData.mobile}
                onChange={(e) => setVictimData({ ...victimData, mobile: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Occupation
              </label>
              <input
                type="text"
                value={victimData.occupation}
                onChange={(e) => setVictimData({ ...victimData, occupation: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Victim Residential Address <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={victimData.address}
              onChange={(e) => setVictimData({ ...victimData, address: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
            />
          </div>

          {/* Navigation Buttons */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handlePrevStep}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '9px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              style={{
                background: '#003366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Save and Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: GRIEVANCE DETAILS ─── */}
      {currentStep === 4 && (
        <div
          style={{
            background: highContrast ? '#181818' : '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '36px 44px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 4px' }}>
              Incident Particulars & Legal Investigation Inputs
            </h2>
            <p style={{ fontSize: '13.5px', color: highContrast ? '#bbb' : '#64748B', margin: 0 }}>
              Specify the nature of atrocity, FIR details, and incident description for DSP / IO assignment.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Incident Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                value={grievanceData.incidentDate}
                onChange={(e) => setGrievanceData({ ...grievanceData, incidentDate: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Approximate Time
              </label>
              <input
                type="time"
                value={grievanceData.incidentTime}
                onChange={(e) => setGrievanceData({ ...grievanceData, incidentTime: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Police Station Jurisdiction <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={grievanceData.policeStation}
                onChange={(e) => setGrievanceData({ ...grievanceData, policeStation: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Incident Location */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Incident Location / Landmark <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={grievanceData.incidentLocation}
              onChange={(e) => setGrievanceData({ ...grievanceData, incidentLocation: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
            />
          </div>

          {/* PoA Classification Dropdown */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Relevant PoA Offence Classification <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={grievanceData.poaSection}
              onChange={(e) => setGrievanceData({ ...grievanceData, poaSection: e.target.value })}
              style={{ width: '100%', padding: '9.5px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', boxSizing: 'border-box' }}
            >
              <option>Section 3(1)(g) - Wrongful dispossession of land / crop destruction</option>
              <option>Section 3(1)(r) - Public humiliation, insults, casteist abuse</option>
              <option>Section 3(1)(s) - Abuse by caste name in any place within public view</option>
              <option>Section 3(1)(e) - Compelling manual scavenging or offensive acts</option>
              <option>Section 3(1)(za) - Obstructing or denying customary right of way / water source</option>
              <option>Section 3(2)(v) - Serious offences with 10+ years imprisonment</option>
              <option>Section 4 - Willful neglect of duties by public servant</option>
            </select>
          </div>

          {/* FIR Details if FIR is Yes */}
          {hasFir === 'Yes' && (
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '16px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#003366', textTransform: 'uppercase', marginBottom: 12 }}>
                Registered FIR Particulars
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    FIR Number
                  </label>
                  <input
                    type="text"
                    value={grievanceData.firNumber}
                    onChange={(e) => setGrievanceData({ ...grievanceData, firNumber: e.target.value })}
                    style={{ width: '100%', padding: '8.5px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    FIR Registration Date
                  </label>
                  <input
                    type="date"
                    value={grievanceData.firDate}
                    onChange={(e) => setGrievanceData({ ...grievanceData, firDate: e.target.value })}
                    style={{ width: '100%', padding: '8.5px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detailed Statement */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Comprehensive Incident Statement / Grievance Description <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={grievanceData.description}
              onChange={(e) => setGrievanceData({ ...grievanceData, description: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
            />
          </div>

          {/* Relief and Evidence Upload Simulation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Statutory Relief Claimed (Scheduled Rate)
              </label>
              <input
                type="text"
                value={grievanceData.reliefClaimed}
                onChange={(e) => setGrievanceData({ ...grievanceData, reliefClaimed: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Attach Supporting Evidence / FIR Copy
              </label>
              <div
                style={{
                  border: '1px dashed #3B82F6',
                  borderRadius: 6,
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#EFF6FF',
                  fontSize: '12.5px',
                  color: '#1D4ED8',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} />
                  <span>{grievanceData.evidenceFile}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>Attached</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handlePrevStep}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '9px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              style={{
                background: '#003366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Review Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 5: REVIEW & SUBMIT ─── */}
      {currentStep === 5 && (
        <div
          style={{
            background: highContrast ? '#181818' : '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '36px 44px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 4px' }}>
              Final Review & Legal Declaration
            </h2>
            <p style={{ fontSize: '13.5px', color: highContrast ? '#bbb' : '#64748B', margin: 0 }}>
              Verify all entered details before generating official National Helpline Reference ID.
            </p>
          </div>

          {/* Structured Summary Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 26 }}>
            {/* Card 1: Registration Role & Type */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#003366', textTransform: 'uppercase' }}>
                  Grievance Category & Complainant Role
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit Step 1
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>Grievance For</span>
                  <strong>{grievanceType}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>Registered FIR</span>
                  <strong>{hasFir}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>Filing Role</span>
                  <strong>{registrationRole === 'informer' ? 'As an Informer' : registrationRole === 'ngo' ? 'As an NGO' : 'As a Victim'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>Mobile Verification</span>
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>Verified (MVP Demo)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Informer & Victim Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#003366', textTransform: 'uppercase' }}>
                    Informer / Submitter
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  <div><strong>{informerData.fullName}</strong> ({informerData.relation})</div>
                  <div style={{ color: '#64748B' }}>Phone: {informerData.mobile}</div>
                  <div style={{ color: '#64748B' }}>District: {informerData.district}, {informerData.state}</div>
                  <div style={{ color: '#166534', fontSize: '11.5px', marginTop: 4, fontWeight: 700 }}>
                    {informerData.isConfidential ? 'Identity Confidential (Protected)' : 'Public Complainant'}
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#003366', textTransform: 'uppercase' }}>
                    Victim Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  <div><strong>{victimData.fullName}</strong> ({victimData.gender}, {victimData.age} yrs)</div>
                  <div style={{ color: '#64748B' }}>Category: {victimData.category} ({victimData.subCaste})</div>
                  <div style={{ color: '#64748B' }}>Location: {victimData.district}, {victimData.state}</div>
                  <div style={{ color: '#64748B' }}>Occupation: {victimData.occupation}</div>
                </div>
              </div>
            </div>

            {/* Card 3: Grievance & Atrocity Details */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#003366', textTransform: 'uppercase' }}>
                  Atrocity Details & Jurisdiction
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                <div><strong>Classification:</strong> {grievanceData.poaSection}</div>
                <div><strong>Police Station:</strong> {grievanceData.policeStation} | <strong>FIR:</strong> {grievanceData.firNumber}</div>
                <div><strong>Incident Date:</strong> {grievanceData.incidentDate} at {grievanceData.incidentTime}</div>
                <div style={{ marginTop: 6, color: '#334155' }}><strong>Statement:</strong> {grievanceData.description}</div>
              </div>
            </div>
          </div>

          {/* Legal Declaration */}
          <div
            style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 8,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: 28,
            }}
          >
            <input
              type="checkbox"
              id="legalDeclaration"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#D97706', marginTop: 2, cursor: 'pointer' }}
            />
            <label htmlFor="legalDeclaration" style={{ fontSize: '13px', color: '#92400E', cursor: 'pointer', lineHeight: 1.4 }}>
              <strong>Solemn Declaration under Section 182 IPC & PoA Rules:</strong> I solemnly affirm that the facts stated above are accurate and genuine to the best of my knowledge. I understand this grievance initiates formal statutory inquiry under the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act 1989.
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handlePrevStep}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '9px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitGrievance}
              disabled={!declarationAccepted}
              style={{
                background: declarationAccepted ? '#003366' : '#94A3B8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '11px 28px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: declarationAccepted ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: declarationAccepted ? '0 4px 12px rgba(0,51,102,0.25)' : 'none',
              }}
            >
              <ShieldCheck size={18} />
              <span>Submit Grievance Officially</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 6: SUCCESS CONFIRMATION SCREEN ─── */}
      {currentStep === 6 && (
        <div
          style={{
            background: highContrast ? '#181818' : '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '48px 44px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            textAlign: 'center',
            maxWidth: 760,
            margin: '0 auto',
          }}
        >
          {/* Animated Success Badge */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#DCFCE7',
              border: '2px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle2 size={42} color="#16A34A" />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 8px' }}>
            Grievance Registered Successfully!
          </h2>
          <p style={{ fontSize: '14px', color: highContrast ? '#ccc' : '#64748B', margin: '0 0 28px' }}>
            Your grievance has been formally filed under the National Helpline Against Atrocities (PoA Redressal System).
          </p>

          {/* Reference ID Showcase Box */}
          <div
            style={{
              background: '#F0F6FF',
              border: '1.5px dashed #2563EB',
              borderRadius: 12,
              padding: '20px',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              minWidth: 340,
              marginBottom: 28,
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Official National Reference ID
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#003366', letterSpacing: 1.5, fontFamily: 'monospace' }}>
                {generatedRefId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Reference ID"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563EB',
                  cursor: 'pointer',
                }}
              >
                <Copy size={14} />
                <span>{copiedId ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div style={{ fontSize: '11.5px', color: '#475569' }}>
              Save this number for real-time tracking, relief disbursements, and magistrate inquiries.
            </div>
          </div>

          {/* Nodal Officer & Dispatch SLA Information */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              textAlign: 'left',
              marginBottom: 34,
            }}
          >
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#003366', fontSize: '11px', fontWeight: 700, marginBottom: 4 }}>
                <Building2 size={14} />
                <span>ASSIGNED JURISDICTION</span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>{grievanceData.policeStation}</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>DSP Atrocities Cell (Pune District)</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#003366', fontSize: '11px', fontWeight: 700, marginBottom: 4 }}>
                <Clock size={14} />
                <span>STATUTORY TIME-LIMIT</span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>60 Days Charge-sheet</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Section 7(2) PoA Rules 1995</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#003366', fontSize: '11px', fontWeight: 700, marginBottom: 4 }}>
                <Phone size={14} />
                <span>SMS DISPATCH</span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#16A34A' }}>Dispatched Immediately</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>To {mobileNumber || '9876543210'}</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                if (onNavigateTrack) onNavigateTrack(generatedRefId);
              }}
              style={{
                background: '#003366',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '11px 22px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Track Grievance Live Status</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                handleAutoFillDemo();
              }}
              style={{
                background: '#FFFFFF',
                color: '#003366',
                border: '1.5px solid #003366',
                borderRadius: 6,
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Register Another Grievance
            </button>

            <button
              type="button"
              onClick={onCancel}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return to Portal Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
