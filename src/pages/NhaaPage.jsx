import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ASSETS } from '../assets';
import GrievanceRegistrationWizard from '../components/GrievanceRegistrationWizard';

// ─── Custom SVG Icons matching the screenshot precisely ───
const GridDashboardIcon = ({ color = '#003366' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const DocPencilIcon = ({ size = 48, color = '#003366' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 8C10 5.79086 11.7909 4 14 4H30L38 12V40C38 42.2091 36.2091 44 34 44H14C11.7909 44 10 42.2091 10 40V8Z" />
    <path d="M30 4V12H38" />
    <path d="M18 20H30" />
    <path d="M18 26H26" />
    <path d="M22 36L34 24L38 28L26 40L20 41L22 36Z" fill="#003366" fillOpacity="0.15" />
    <path d="M22 36L34 24L38 28L26 40L20 41L22 36Z" />
  </svg>
);

const PersonRescueIcon = ({ size = 48, color = '#003366' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Head */}
    <circle cx="24" cy="8" r="5" fill={color} />
    {/* Torso & Waving Arm */}
    <path d="M24 16V28" />
    <path d="M24 20L34 14L38 17" />
    <path d="M24 20L15 22V28" />
    {/* Legs */}
    <path d="M24 28L18 42" />
    <path d="M24 28L30 42" />
    {/* Rescue / Bag Object */}
    <rect x="10" y="32" width="6" height="10" rx="1.5" fill={color} />
    <path d="M12 32V29C12 28.4477 12.4477 28 13 28C13.5523 28 14 28.4477 14 29V32" />
  </svg>
);

const DocSearchIcon = ({ size = 48, color = '#003366' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 8C10 5.79086 11.7909 4 14 4H30L38 12V40C38 42.2091 36.2091 44 34 44H14C11.7909 44 10 42.2091 10 40V8Z" />
    <path d="M30 4V12H38" />
    <path d="M18 20H26" />
    {/* Magnifying Glass */}
    <circle cx="28" cy="30" r="7" fill="#fff" />
    <circle cx="28" cy="30" r="7" stroke={color} strokeWidth="2.5" />
    <path d="M33 35L41 43" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const HelpQuestionIcon = ({ size = 20, color = '#64748B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginLeft: 4 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const AccessibilityIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2a2 2 0 100 4 2 2 0 000-4zm-1 6h2v6h-2V8zm-3 0h2v12H8V8zm8 0h2v12h-2V8z" />
  </svg>
);

const ContrastIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20A10 10 0 0 0 12 2z" fill="currentColor" />
  </svg>
);

export default function NhaaPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const search = window.location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      const params = new URLSearchParams(search);
      if (params.get('tab') === 'grievance' || window.location.hash.includes('#grievance')) {
        return 'grievance';
      }
    } catch {
      // fallback
    }
    return 'dashboard';
  });

  useEffect(() => {
    try {
      const search = location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      const params = new URLSearchParams(search);
      if (params.get('tab') === 'grievance' || window.location.hash.includes('#grievance')) {
        setActiveTab('grievance');
      }
    } catch {
      // fallback
    }
  }, [location]);

  const [activeModal, setActiveModal] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fontSizeOffset, setFontSizeOffset] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState('English');
  const [trackId, setTrackId] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Status tracking simulation
  const handleTrackSubmit = (e) => {
    e.preventDefault();
    setStatusResult({
      id: trackId || 'NHAA-2026-8891',
      status: 'Under Investigation',
      stage: 'Step 3: Field verification & evidence collection by District Police Officer',
      updated: '31 Aug 2026',
      officer: 'SP Atrocities Cell, District HQ',
      firNumber: 'FIR-402/2026/SC-ST-POA',
      reliefAmount: '₹85,000 sanctioned (1st Installment)',
    });
  };

  const handleFontSizeChange = (delta) => {
    if (delta === 0) setFontSizeOffset(0);
    else setFontSizeOffset((prev) => Math.max(-2, Math.min(4, prev + delta)));
  };

  return (
    <div
      style={{
        background: highContrast ? '#000' : '#FFFFFF',
        color: highContrast ? '#FFF' : '#0F172A',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: `${14 + fontSizeOffset}px`,
      }}
    >
      {/* ─── 1. TOP UTILITY BAR ─────────────────────────────────────── */}
      <div
        style={{
          background: highContrast ? '#111' : '#003366',
          color: '#fff',
          fontSize: '12px',
          padding: '7px 0',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Indian Flag & Gov Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={ASSETS.indianFlag}
              alt="India Flag"
              style={{ height: 14, width: 22, objectFit: 'cover', borderRadius: 2 }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span style={{ fontWeight: 500 }}>
              Government of India
              <ExternalLinkIcon />
            </span>
          </div>

          {/* Right: Accessibility Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '12px' }}>
            <a href="#portal-main-content" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
              Skip to Main Content
            </a>
            <span style={{ opacity: 0.4 }}>|</span>

            {/* Font Resizing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => handleFontSizeChange(-1)}
                title="Decrease font size"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 4px',
                  fontWeight: fontSizeOffset < 0 ? 800 : 400,
                }}
              >
                A-
              </button>
              <button
                onClick={() => handleFontSizeChange(0)}
                title="Reset font size"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 4px',
                  fontWeight: fontSizeOffset === 0 ? 800 : 400,
                }}
              >
                A
              </button>
              <button
                onClick={() => handleFontSizeChange(1)}
                title="Increase font size"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '2px 4px',
                  fontWeight: fontSizeOffset > 0 ? 800 : 400,
                }}
              >
                A+
              </button>
            </div>
            <span style={{ opacity: 0.4 }}>|</span>

            {/* High Contrast Toggle */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              title="Toggle High Contrast"
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px',
              }}
            >
              <ContrastIcon />
            </button>
            <span style={{ opacity: 0.4 }}>|</span>

            {/* Screen Reader / Accessibility Icon */}
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Accessibility Options">
              <AccessibilityIcon />
            </span>
            <span style={{ opacity: 0.4 }}>|</span>

            {/* Language Selector Dropdown */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13 }}>🌐</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="English" style={{ color: '#000' }}>English</option>
                <option value="Hindi" style={{ color: '#000' }}>हिन्दी (Hindi)</option>
                <option value="Tamil" style={{ color: '#000' }}>தமிழ் (Tamil)</option>
                <option value="Telugu" style={{ color: '#000' }}>తెలుగు (Telugu)</option>
                <option value="Bengali" style={{ color: '#000' }}>বাংলা (Bengali)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN HEADER BAR ────────────────────────────────────── */}
      <header
        style={{
          background: highContrast ? '#1E1E1E' : '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Hamburger + National Emblem & Ministry Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                color: '#334155',
              }}
            >
              <span style={{ display: 'block', width: 20, height: 2, background: highContrast ? '#fff' : '#334155', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 14, height: 2, background: highContrast ? '#fff' : '#334155', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 18, height: 2, background: highContrast ? '#fff' : '#334155', borderRadius: 2 }} />
            </button>

            {/* Emblem and Department Title */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
              <img
                src={ASSETS.nationalEmblem}
                alt="National Emblem of India"
                style={{ height: 56, width: 'auto' }}
                onError={(e) => {
                  e.target.src = `${import.meta.env.BASE_URL}ashoka_emblem.jpg`;
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                  <span
                    style={{
                      background: '#FF9900',
                      color: '#000',
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 3,
                      letterSpacing: 0.5,
                    }}
                  >
                    SIH 2026 PROTOTYPE
                  </span>
                  <span style={{ fontSize: '11px', color: highContrast ? '#ccc' : '#64748B', fontWeight: 500 }}>
                    Academic &amp; Evaluation Model
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: highContrast ? '#ddd' : '#334155', lineHeight: 1.2 }}>
                  Ministry of Social Justice &amp; Empowerment
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', lineHeight: 1.25 }}>
                  Department of Social Justice &amp; Empowerment
                </div>
              </div>
            </Link>
          </div>

          {/* Right: Digital India + SAMAVESH + Admin Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Digital India Logo */}
            <img
              src={ASSETS.digitalIndia}
              alt="Digital India - Power To Empower"
              style={{ height: 42, width: 'auto' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />

            {/* SAMAVESH Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={ASSETS.samavesh}
                alt="SAMAVESH"
                style={{ height: 38, width: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: highContrast ? '#fff' : '#003366', letterSpacing: 0.4 }}>
                  SAMAVESH
                </div>
                <div style={{ fontSize: '9px', color: highContrast ? '#aaa' : '#64748B', maxWidth: 170, lineHeight: 1.15 }}>
                  Single Access Mechanism for All Verticals of Empowerment &amp; Social Harmony
                </div>
              </div>
            </div>

            {/* Admin Login Button */}
            <Link
              to="/admin/login"
              style={{
                background: '#003366',
                color: '#FFFFFF',
                padding: '9px 20px',
                borderRadius: 6,
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0,51,102,0.2)',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 4. MAIN PORTAL BODY (SIDEBAR + CONTENT) ───────────────── */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* ─── LEFT SIDEBAR ────────────────────────────────────────── */}
        <aside
          style={{
            width: sidebarOpen ? 270 : 80,
            background: highContrast ? '#181818' : '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            padding: sidebarOpen ? '20px 14px' : '20px 8px',
            transition: 'all 0.25s ease',
            flexShrink: 0,
          }}
        >
          {/* SAMBAL Brand Header Block */}
          {sidebarOpen ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 8px 20px',
                borderBottom: '1px solid #F1F5F9',
                marginBottom: 16,
              }}
            >
              {/* Circular SAMBAL Badge */}
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                  border: '1.5px solid #C7D7FD',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,51,102,0.08)',
                }}
              >
                <span style={{ fontSize: '8px', fontWeight: 900, color: '#003366', letterSpacing: 0.2 }}>SAMBAL</span>
                <span style={{ fontSize: '6.5px', color: '#F95700', fontWeight: 700 }}>2021</span>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', lineHeight: 1.2 }}>
                  SAMBAL (NHAA 2.0)
                </div>
                <div style={{ fontSize: '10px', color: highContrast ? '#aaa' : '#64748B', lineHeight: 1.25, marginTop: 2 }}>
                  Smart Access for Mainstreaming of Beneficiaries through Augmented Linkages
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#EEF2FF',
                  border: '1.5px solid #C7D7FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 900,
                  color: '#003366',
                }}
              >
                SAMBAL
              </div>
            </div>
          )}

          {/* Navigation Menu Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Dashboard Button (Active) */}
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 14px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'dashboard' ? '#EBF3FE' : 'transparent',
                color: activeTab === 'dashboard' ? '#003366' : highContrast ? '#ccc' : '#475569',
                fontWeight: activeTab === 'dashboard' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <GridDashboardIcon color={activeTab === 'dashboard' ? '#003366' : '#64748B'} />
              {sidebarOpen && <span>Dashboard</span>}
            </button>

            {/* Register Grievance */}
            <button
              onClick={() => {
                setActiveTab('grievance');
                setActiveModal(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 14px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === 'grievance' ? '#EBF3FE' : 'transparent',
                color: activeTab === 'grievance' ? '#003366' : highContrast ? '#ccc' : '#475569',
                fontWeight: activeTab === 'grievance' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'grievance') e.currentTarget.style.background = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'grievance') e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: (!sidebarOpen && activeTab === 'grievance') ? '#DBEAFE' : 'transparent',
                }}
              >
                <DocPencilIcon size={20} color={activeTab === 'grievance' ? '#003366' : '#475569'} />
              </span>
              {sidebarOpen && <span>Register Grievance</span>}
            </button>

            {/* Register Rescue */}
            <button
              onClick={() => setActiveModal('rescue')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: highContrast ? '#ccc' : '#475569',
                fontWeight: 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                <PersonRescueIcon size={20} color="#475569" />
              </span>
              {sidebarOpen && <span>Register Rescue</span>}
            </button>

            {/* Track Status */}
            <button
              onClick={() => setActiveModal('track')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: highContrast ? '#ccc' : '#475569',
                fontWeight: 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                <DocSearchIcon size={20} color="#475569" />
              </span>
              {sidebarOpen && <span>Track Status</span>}
            </button>

            {/* Help & FAQs */}
            <button
              onClick={() => setActiveModal('help')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: highContrast ? '#ccc' : '#475569',
                fontWeight: 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <HelpQuestionIcon size={20} color="#475569" />
              {sidebarOpen && <span>Help &amp; FAQs</span>}
            </button>
          </nav>

          {/* 24x7 Helpline Info Box at Sidebar Bottom */}
          {sidebarOpen && (
            <div
              style={{
                marginTop: 'auto',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '14px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Toll-Free Helpline</div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#003366', margin: '2px 0' }}>14566</div>
              <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 600 }}>● 24x7 Active Support</div>
            </div>
          )}
        </aside>

        {/* ─── MAIN CONTENT AREA ───────────────────────────────────── */}
        <main
          id="portal-main-content"
          style={{
            flex: 1,
            padding: activeTab === 'grievance' ? '28px 36px 60px' : '36px 48px 60px',
            background: highContrast ? '#0A0A0A' : '#F8FAFC',
          }}
        >
          {activeTab === 'grievance' ? (
            <GrievanceRegistrationWizard
              highContrast={highContrast}
              onCancel={() => setActiveTab('dashboard')}
              onNavigateTrack={(refId) => {
                setTrackId(refId);
                setStatusResult({
                  id: refId,
                  status: 'Case Registered & Assigned',
                  stage: 'Step 1: Dispatched to District SP & DSP Atrocities Cell for verification',
                  updated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                  officer: 'DSP / Nodal Officer, Atrocities Cell',
                  firNumber: 'FIR/309/2026/SC-ST-POA',
                  reliefAmount: '₹4,25,000 (Sanction in Progress)',
                });
                setActiveTab('dashboard');
                setActiveModal('track');
              }}
            />
          ) : (
          <div style={{ maxWidth: 1220, margin: '0 auto' }}>
            
            {/* Title & Subtitle Header */}
            <div style={{ marginBottom: 36 }}>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: highContrast ? '#fff' : '#0F172A',
                  margin: '0 0 8px',
                  letterSpacing: -0.3,
                }}
              >
                National Helpline Against Atrocities (NHAA)
              </h1>
              <p
                style={{
                  fontSize: '14.5px',
                  color: highContrast ? '#bbb' : '#64748B',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Submit, track, and resolve grievances through automated workflow. Transparent governance for all citizens.
              </p>
            </div>

            {/* ─── 3 FEATURE ACTION CARDS ───────────────────────────── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 24,
                marginBottom: 56,
              }}
            >
              {/* Card 1: Register Grievance */}
              <div
                style={{
                  background: highContrast ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '36px 32px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 51, 102, 0.08)';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <DocPencilIcon size={46} color="#003366" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 10px' }}>
                  Register Grievance
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: highContrast ? '#aaa' : '#64748B',
                    lineHeight: 1.6,
                    flex: 1,
                    margin: '0 0 28px',
                  }}
                >
                  Submit a new complaint regarding atrocities. You can register as a Victim, Informer, or on behalf of an NGO.
                </p>
                <button
                  onClick={() => setActiveTab('grievance')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0052CC',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    textAlign: 'left',
                  }}
                >
                  Start Registration <span style={{ fontSize: '16px' }}>→</span>
                </button>
              </div>

              {/* Card 2: Register Rescue */}
              <div
                style={{
                  background: highContrast ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '36px 32px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 51, 102, 0.08)';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <PersonRescueIcon size={46} color="#003366" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 10px' }}>
                  Register Rescue
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: highContrast ? '#aaa' : '#64748B',
                    lineHeight: 1.6,
                    flex: 1,
                    margin: '0 0 28px',
                  }}
                >
                  Quick distress report. Four short fields — Name, Mobile (OTP), Location and Problem. Routed straight to the responding Police officer.
                </p>
                <button
                  onClick={() => setActiveModal('rescue')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0052CC',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    textAlign: 'left',
                  }}
                >
                  Start Rescue <span style={{ fontSize: '16px' }}>→</span>
                </button>
              </div>

              {/* Card 3: Track Status */}
              <div
                style={{
                  background: highContrast ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '36px 32px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 51, 102, 0.08)';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <DocSearchIcon size={46} color="#003366" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: highContrast ? '#fff' : '#0F172A', margin: '0 0 10px' }}>
                  Track Status
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: highContrast ? '#aaa' : '#64748B',
                    lineHeight: 1.6,
                    flex: 1,
                    margin: '0 0 28px',
                  }}
                >
                  Check the current progress, officer remarks, and closure status of an already registered grievance.
                </p>
                <button
                  onClick={() => setActiveModal('track')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0052CC',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    textAlign: 'left',
                  }}
                >
                  Track Application <span style={{ fontSize: '16px' }}>→</span>
                </button>
              </div>
            </div>

            {/* ─── GRIEVANCE CLOSURE PROCESS WORKFLOW ───────────────── */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: highContrast ? '#fff' : '#0F172A',
                  margin: '0 0 36px',
                }}
              >
                Grievance Closure Process
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  position: 'relative',
                }}
              >
                {[
                  {
                    num: 1,
                    title: 'Registration',
                    desc: 'Submit incident details and required documentation securely.',
                  },
                  {
                    num: 2,
                    title: 'Review',
                    desc: 'DM/DC Office reviews the grievance and initial documents.',
                  },
                  {
                    num: 3,
                    title: 'Investigation',
                    desc: 'Field verification and evidence collection by District Police Officer.',
                  },
                  {
                    num: 4,
                    title: 'Approval',
                    desc: 'State Authority approves or returns for rework based on findings.',
                  },
                  {
                    num: 5,
                    title: 'Closure & Relief',
                    desc: 'Case is closed and eligible financial relief is processed directly.',
                  },
                ].map((step) => (
                  <div
                    key={step.num}
                    style={{
                      background: highContrast ? '#181818' : '#FFFFFF',
                      borderRadius: 14,
                      padding: '24px 18px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: '#EEF2FF',
                        color: '#003366',
                        fontWeight: 800,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 14,
                        border: '1px solid #C7D7FD',
                      }}
                    >
                      {step.num}
                    </div>
                    <h4
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 700,
                        color: highContrast ? '#fff' : '#0F172A',
                        margin: '0 0 8px',
                      }}
                    >
                      {step.title}
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: highContrast ? '#aaa' : '#64748B',
                        lineHeight: 1.45,
                        margin: 0,
                        textAlign: 'center',
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
          )}
        </main>
      </div>

      {/* Academic Prototype Disclaimer Bar */}
      <footer
        style={{
          background: highContrast ? '#111' : '#001A33',
          color: '#94A3B8',
          fontSize: '11px',
          padding: '12px 24px',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ maxWidth: 1220, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          <div style={{ color: '#FCD34D', fontWeight: 600 }}>
            ⚠️ Academic &amp; Evaluation Disclaimer: This portal is a working prototype created exclusively for Smart India Hackathon (SIH 2026) Problem Statement 14566.
          </div>
          <div>
            It is designed strictly for technical demonstration, research, and jury evaluation and is NOT an official government website.
          </div>
        </div>
      </footer>

      {/* ─── 5. FLOATING ASSISTANT WIDGET (BOTTOM-RIGHT) ───────────── */}
      <div
        onClick={() => setChatbotOpen(!chatbotOpen)}
        title="Samvaad AI Sahayak - 24x7 Citizen Assistant"
        style={{
          position: 'fixed',
          right: 28,
          bottom: 60,
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #003366 0%, #0052CC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 51, 102, 0.35)',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <img
          src={ASSETS.chatbotIcon}
          alt="Chatbot"
          style={{ width: 38, height: 38, objectFit: 'contain' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        {/* Glowing badge dot */}
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 12,
            height: 12,
            background: '#22C55E',
            borderRadius: '50%',
            border: '2px solid #FFFFFF',
          }}
        />
      </div>

      {/* Chatbot Popup Modal */}
      {chatbotOpen && (
        <div
          style={{
            position: 'fixed',
            right: 28,
            bottom: 125,
            width: 350,
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            border: '1px solid #E2E8F0',
            zIndex: 1001,
            overflow: 'hidden',
          }}
        >
          <div style={{ background: '#003366', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>Samvaad Helpline Assistant</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>Online • PoA &amp; PCR Help</div>
              </div>
            </div>
            <button onClick={() => setChatbotOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '16px', maxHeight: 300, overflowY: 'auto', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#F1F5F9', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', maxWidth: '85%' }}>
              Namaste! How can I assist you with SAMBAL / NHAA today? You can ask about registering a complaint, emergency rescue, or tracking status.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              <button
                onClick={() => { setActiveTab('grievance'); setChatbotOpen(false); }}
                style={{ background: '#EEF2FF', color: '#003366', border: '1px solid #C7D7FD', padding: '8px 12px', borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
              >
                📝 How do I register a grievance?
              </button>
              <button
                onClick={() => { setActiveModal('rescue'); setChatbotOpen(false); }}
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 12px', borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
              >
                🚨 Emergency distress report (Rescue)
              </button>
              <button
                onClick={() => { setActiveModal('track'); setChatbotOpen(false); }}
                style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
              >
                🔍 Track my complaint status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. INTERACTIVE MODAL DIALOGS ──────────────────────────── */}
      {activeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
              setStatusResult(null);
            }
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '32px 36px',
              maxWidth: 580,
              width: '100%',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => {
                setActiveModal(null);
                setStatusResult(null);
              }}
              style={{
                position: 'absolute',
                right: 20,
                top: 20,
                background: '#F1F5F9',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: '50%',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
              }}
            >
              ✕
            </button>

            {/* 1. Register Grievance Modal */}
            {activeModal === 'grievance' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <DocPencilIcon size={32} color="#003366" />
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#003366', margin: 0 }}>
                      Register New Grievance
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      PoA Act 1989 &amp; PCR Act 1955 Grievance Redressal System
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newId = `NHAA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                    alert(`✅ Grievance Registered Successfully!\n\nYour Reference ID is: ${newId}\nYou will receive SMS updates with assigned officer contact.`);
                    setActiveModal(null);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      COMPLAINANT ROLE *
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        background: '#fff',
                      }}
                    >
                      <option>Victim (Direct Affected Person)</option>
                      <option>Informer / Eye Witness</option>
                      <option>On behalf of NGO / Social Worker</option>
                      <option>Legal Representative</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        FULL NAME *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter full name"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        MOBILE NUMBER *
                      </label>
                      <input
                        required
                        type="tel"
                        maxLength="10"
                        placeholder="10-digit mobile"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        STATE / UT *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="State name"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        DISTRICT *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="District name"
                        style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      INCIDENT DETAILS &amp; DESCRIPTION *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Please describe the atrocity incident with date, time, and perpetrators..."
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input type="checkbox" id="confidential" defaultChecked style={{ accentColor: '#003366' }} />
                    <label htmlFor="confidential" style={{ fontSize: '12px', color: '#475569' }}>
                      Keep my identity confidential from accused parties
                    </label>
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#003366',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px',
                      borderRadius: 8,
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: 8,
                      boxShadow: '0 4px 12px rgba(0,51,102,0.2)',
                    }}
                  >
                    Submit Grievance →
                  </button>
                </form>
              </div>
            )}

            {/* 2. Register Rescue Modal */}
            {activeModal === 'rescue' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: '#FEE2E2', padding: 8, borderRadius: 10 }}>
                    <PersonRescueIcon size={32} color="#DC2626" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', margin: 0 }}>
                      Quick Distress Rescue Report
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      Priority routing to District Police HQ &amp; Rapid Response Force
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#991B1B',
                    marginBottom: 16,
                  }}
                >
                  ⚡ <strong>Emergency Action:</strong> This alert triggers instant notification to the nearest Police Station SP/DSP Control Room.
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert('🚨 Emergency Rescue Alert Dispatched!\n\nPolice Control Room and District Rapid Response Unit have been alerted with your location.');
                    setActiveModal(null);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      FULL NAME *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Your full name"
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      MOBILE NUMBER (OTP VERIFIED) *
                    </label>
                    <input
                      required
                      type="tel"
                      maxLength="10"
                      placeholder="10-digit mobile number"
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      CURRENT LOCATION / ADDRESS / LANDMARK *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Village Rampur, Near Old Bus Stand, District Meerut"
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      NATURE OF DISTRESS / THREAT *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Briefly describe the immediate danger or atrocity..."
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #CBD5E1', borderRadius: 8, boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '13px',
                      borderRadius: 8,
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      marginTop: 6,
                      boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                    }}
                  >
                    🚨 Send Emergency Rescue Alert Now
                  </button>
                </form>
              </div>
            )}

            {/* 3. Track Status Modal */}
            {activeModal === 'track' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <DocSearchIcon size={32} color="#003366" />
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#003366', margin: 0 }}>
                      Track Grievance Status
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      Real-time status tracking via SAMBAL Automated Redressal Engine
                    </div>
                  </div>
                </div>

                <form onSubmit={handleTrackSubmit} style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    APPLICATION / REFERENCE NUMBER
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      required
                      type="text"
                      placeholder="e.g. NHAA-2026-8891"
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        fontSize: '13px',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: '#003366',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Search
                    </button>
                  </div>
                </form>

                {/* Sample Test IDs helper */}
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: 16 }}>
                  Quick test reference: <span onClick={() => setTrackId('NHAA-2026-8891')} style={{ color: '#0052CC', cursor: 'pointer', textDecoration: 'underline' }}>NHAA-2026-8891</span>
                </div>

                {statusResult && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: 20,
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        Reference ID: <strong>{statusResult.id}</strong>
                      </span>
                      <span
                        style={{
                          background: '#E0F2FE',
                          color: '#0369A1',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {statusResult.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      {statusResult.stage}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '11px', color: '#64748B', marginTop: 4 }}>
                      <div>Assigned Officer: <strong style={{ color: '#334155' }}>{statusResult.officer}</strong></div>
                      <div>FIR Number: <strong style={{ color: '#334155' }}>{statusResult.firNumber}</strong></div>
                      <div>Relief Status: <strong style={{ color: '#16A34A' }}>{statusResult.reliefAmount}</strong></div>
                      <div>Last Updated: <strong style={{ color: '#334155' }}>{statusResult.updated}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Help & FAQs Modal */}
            {activeModal === 'help' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <HelpQuestionIcon size={32} color="#003366" />
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#003366', margin: 0 }}>
                      Help &amp; Frequently Asked Questions
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      Information about SAMBAL (NHAA 2.0) Portal Services
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '13px' }}>
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      1. What is SAMBAL (NHAA 2.0)?
                    </div>
                    <div style={{ color: '#64748B', lineHeight: 1.5 }}>
                      SAMBAL is the enhanced National Helpline Against Atrocities portal under the Ministry of Social Justice &amp; Empowerment. It connects victims, informants, and law enforcement for fast-track grievance resolution and relief disbursement.
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      2. What is the National Toll-Free Number?
                    </div>
                    <div style={{ color: '#64748B', lineHeight: 1.5 }}>
                      You can call <strong>14566</strong> round the clock (24x7) from anywhere across India free of charge.
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      3. What is the difference between Grievance and Rescue?
                    </div>
                    <div style={{ color: '#64748B', lineHeight: 1.5 }}>
                      <strong>Register Grievance</strong> is for structured complaint registration with formal legal investigation. <strong>Register Rescue</strong> is a 4-field emergency distress beacon sent directly to the nearest Police station for instant physical intervention.
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── 7. BOTTOM FOOTER BAR ──────────────────────────────────── */}
      <footer
        style={{
          background: highContrast ? '#111' : '#001F3F',
          color: '#FFFFFF',
          padding: '16px 0',
          fontSize: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Left: Copyright & UX4G credit matching screenshot */}
          <div style={{ opacity: 0.9 }}>
            © 2026 - Copyright UX4G. All rights reserved. Powered by NeGD | MeitY Government of India@2026 UX4G
          </div>

          {/* Right: Policy Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: 0.85 }}>
            <Link to="/about-us" style={{ color: '#FFFFFF', textDecoration: 'none', cursor: 'pointer' }}>
              Terms &amp; Conditions
            </Link>
            <span>|</span>
            <Link to="/about-us" style={{ color: '#FFFFFF', textDecoration: 'none', cursor: 'pointer' }}>
              Privacy Policy
            </Link>
            <span>|</span>
            <Link to="/contact-us" style={{ color: '#FFFFFF', textDecoration: 'none', cursor: 'pointer' }}>
              Feedback
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
