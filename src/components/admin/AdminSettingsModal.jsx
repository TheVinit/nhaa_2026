import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { setSession } from '../../utils/adminAuth';

const THEME_KEY = 'nhaa_admin_theme';

export function getAdminTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setAdminTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
    document.documentElement.dataset.adminTheme = nextTheme;
  } catch {
    document.documentElement.dataset.adminTheme = nextTheme;
  }
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'NA';
}

function Field({ id, label, children, readOnly = false }) {
  return (
    <div className="nh-settings-field">
      <label className="nh-settings-label" htmlFor={id}>{label}</label>
      {React.cloneElement(children, {
        id,
        className: readOnly ? 'nh-settings-input nh-settings-input-readonly' : 'nh-settings-input',
      })}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="nh-settings-toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="nh-settings-switch"
      />
    </label>
  );
}

export default function AdminSettingsModal({
  session,
  roleLabel,
  theme,
  onToggleTheme,
  onClose,
  onLogout,
  stationSettings,
  setStationSettings,
}) {
  const [profile, setProfile] = useState({
    name: session?.name || '',
    username: session?.username || (session?.officer_id ? String(session.officer_id) : ''),
    district: session?.district || '',
    state: session?.state || '',
  });
  const [activeSection, setActiveSection] = useState('profile');
  const [securityView, setSecurityView] = useState('overview');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState('success');
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [forgotPassword, setForgotPassword] = useState({
    username: session?.username || '',
    recoveryEmail: '',
  });

  const displayName = profile.name.trim() || 'Account Profile';
  const role = roleLabel || 'Admin Officer';
  const passwordStrength = changePassword.newPassword
    ? [
        changePassword.newPassword.length >= 8,
        /[A-Z]/.test(changePassword.newPassword),
        /\d/.test(changePassword.newPassword),
        /[^A-Za-z0-9]/.test(changePassword.newPassword),
      ].filter(Boolean).length
    : 0;

  const showMessage = (text, kind = 'success') => {
    setMessage(text);
    setMessageKind(kind);
  };

  const saveProfile = () => {
    if (!profile.name.trim()) {
      showMessage('Profile name is required.', 'error');
      return;
    }
    if (session) {
      setSession({
        ...session,
        name: profile.name.trim(),
        district: profile.district.trim() || null,
        state: profile.state.trim() || null,
      });
    }
    setSettingsSaved(true);
    showMessage('Account profile details saved for this session.', 'success');
    window.setTimeout(() => setSettingsSaved(false), 2500);
  };

  const submitChangeRequest = (event) => {
    event.preventDefault();
    if (changePassword.newPassword.length < 8) {
      showMessage('New password must contain at least 8 characters.', 'error');
      return;
    }
    if (changePassword.newPassword !== changePassword.confirmPassword) {
      showMessage('New password and confirmation do not match.', 'error');
      return;
    }
    setChangePassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSecurityView('overview');
    showMessage('Password change request sent to the system administrator for approval.', 'success');
  };

  const submitForgotRequest = (event) => {
    event.preventDefault();
    if (!forgotPassword.username.trim() || !forgotPassword.recoveryEmail.trim()) {
      showMessage('Enter your username and registered recovery email.', 'error');
      return;
    }
    if (!forgotPassword.recoveryEmail.includes('@')) {
      showMessage('Enter a valid registered recovery email.', 'error');
      return;
    }
    setForgotPassword({ ...forgotPassword, recoveryEmail: '' });
    setSecurityView('overview');
    showMessage('Password reset request recorded. Follow the registered recovery channel.', 'success');
  };

  const saveStationPreferences = () => {
    setSettingsSaved(true);
    showMessage('Station preferences saved successfully.', 'success');
    window.setTimeout(() => {
      setSettingsSaved(false);
      onClose();
    }, 1200);
  };

  const sections = [
    { id: 'profile', label: 'Profile', description: 'Account details', Icon: UserRound },
    { id: 'security', label: 'Security', description: 'Password & recovery', Icon: ShieldCheck },
    { id: 'appearance', label: 'Appearance', description: 'Dashboard theme', Icon: Sun },
    { id: 'station', label: 'Station', description: 'Desk preferences', Icon: Settings },
  ];

  const selectSection = (sectionId) => {
    setActiveSection(sectionId);
    setMessage('');
  };

  const sectionTitle = sections.find((section) => section.id === activeSection)?.label || 'Profile';
  const sectionDescription = {
    profile: 'Keep your official account details current across the command portal.',
    security: 'Manage password access and account recovery in a few secure steps.',
    appearance: 'Choose a workspace theme that is comfortable for your desk.',
    station: 'Configure the command desk behavior for your current session.',
  }[activeSection];

  return (
    <div
      className="nh-settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Admin settings"
    >
      <div className="nh-settings-dialog">
        <header className="nh-settings-header">
          <div>
            <div className="nh-settings-eyebrow">Workspace preferences</div>
            <div className="nh-settings-title-row">
              <div className="nh-settings-title-icon"><Settings size={20} /></div>
              <div>
                <h2>Settings</h2>
                <p>Manage your account, security, appearance, and station preferences.</p>
              </div>
            </div>
          </div>
          <button type="button" className="nh-settings-close" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </header>

        <div className="nh-settings-body">
          <aside className="nh-settings-sidebar">
            <div className="nh-settings-profile-card">
              <div className="nh-settings-avatar">{initials(displayName)}</div>
              <div className="nh-settings-profile-copy">
                <strong>{displayName}</strong>
                <span>{role}</span>
              </div>
              <span className="nh-settings-status"><span /> Active session</span>
            </div>

            <nav className="nh-settings-nav" aria-label="Settings sections">
              {sections.map((section) => {
                const Icon = section.Icon;
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={`nh-settings-nav-item ${active ? 'nh-settings-nav-item-active' : ''}`}
                    onClick={() => selectSection(section.id)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="nh-settings-nav-icon"><Icon size={18} /></span>
                    <span className="nh-settings-nav-copy">
                      <strong>{section.label}</strong>
                      <small>{section.description}</small>
                    </span>
                    {active && <ChevronRight size={15} className="nh-settings-nav-chevron" />}
                  </button>
                );
              })}
            </nav>

            <button type="button" className="nh-settings-logout" onClick={onLogout}>
              <LogOut size={16} />
              <span>Sign out</span>
              <ChevronRight size={15} />
            </button>
          </aside>

          <main className="nh-settings-content">
            {message && (
              <div className={`nh-settings-toast nh-settings-toast-${messageKind}`} role={messageKind === 'error' ? 'alert' : 'status'}>
                {messageKind === 'error' ? <X size={16} /> : <CheckCircle2 size={16} />}
                <span>{message}</span>
              </div>
            )}

            <div className="nh-settings-section-head">
              <div>
                <span className="nh-settings-section-kicker">Step {sections.findIndex((section) => section.id === activeSection) + 1} of {sections.length}</span>
                <h3>{sectionTitle}</h3>
                <p>{sectionDescription}</p>
              </div>
              <div className="nh-settings-progress" aria-hidden="true">
                {sections.map((section) => <span key={section.id} className={section.id === activeSection ? 'nh-settings-progress-active' : ''} />)}
              </div>
            </div>

            {activeSection === 'profile' && (
              <div className="nh-settings-card">
                <div className="nh-settings-card-header">
                  <div className="nh-settings-identity">
                    <div className="nh-settings-avatar nh-settings-avatar-large">{initials(displayName)}</div>
                    <div>
                      <h4>{displayName}</h4>
                      <p>{role} &bull; Official command account</p>
                    </div>
                  </div>
                  <span className="nh-settings-verified"><CheckCircle2 size={14} /> Verified</span>
                </div>

                <div className="nh-settings-form-grid">
                  <Field id="admin-profile-name" label="Full name">
                    <input type="text" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
                  </Field>
                  <Field id="admin-profile-username" label="Username / Officer ID" readOnly>
                    <input type="text" value={profile.username} readOnly tabIndex={-1} />
                  </Field>
                  <Field id="admin-profile-district" label="District">
                    <input type="text" value={profile.district} onChange={(event) => setProfile({ ...profile, district: event.target.value })} />
                  </Field>
                  <Field id="admin-profile-state" label="State">
                    <input type="text" value={profile.state} onChange={(event) => setProfile({ ...profile, state: event.target.value })} />
                  </Field>
                </div>

                <div className="nh-settings-card-footer">
                  <span className="nh-settings-saved-hint">{settingsSaved ? <><Check size={14} /> Profile updated</> : 'Changes are stored for this session.'}</span>
                  <div className="nh-settings-actions">
                    <button type="button" className="nh-settings-button nh-settings-button-primary" onClick={saveProfile}>
                      <Save size={15} /> Save profile
                    </button>
                    <button type="button" className="nh-settings-button nh-settings-button-secondary" onClick={() => selectSection('security')}>
                      <KeyRound size={15} /> Security
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && securityView === 'overview' && (
              <div className="nh-settings-security-grid">
                <button type="button" className="nh-settings-action-card" onClick={() => { setSecurityView('change'); setMessage(''); }}>
                  <span className="nh-settings-action-icon nh-settings-action-icon-blue"><KeyRound size={19} /></span>
                  <span className="nh-settings-action-copy">
                    <strong>Request password change</strong>
                    <small>Submit a secure request to central administration.</small>
                  </span>
                  <ChevronRight size={17} className="nh-settings-action-arrow" />
                </button>
                <button type="button" className="nh-settings-action-card" onClick={() => { setSecurityView('forgot'); setMessage(''); }}>
                  <span className="nh-settings-action-icon nh-settings-action-icon-amber"><Mail size={19} /></span>
                  <span className="nh-settings-action-copy">
                    <strong>Forgot password</strong>
                    <small>Start recovery through your registered channel.</small>
                  </span>
                  <ChevronRight size={17} className="nh-settings-action-arrow" />
                </button>
                <div className="nh-settings-notice">
                  <LockKeyhole size={17} />
                  <span><strong>Security note</strong><br />Password changes are verified by central administration. Never share your current password with anyone.</span>
                </div>
              </div>
            )}

            {activeSection === 'security' && securityView === 'change' && (
              <div className="nh-settings-card">
                <button type="button" className="nh-settings-back-button" onClick={() => { setSecurityView('overview'); setMessage(''); }}>
                  <ArrowLeft size={15} /> Back to security
                </button>
                <div className="nh-settings-card-heading">
                  <span className="nh-settings-card-icon"><KeyRound size={18} /></span>
                  <div>
                    <h4>Request password change</h4>
                    <p>Choose a strong new password. An administrator will verify the request.</p>
                  </div>
                </div>
                <form className="nh-settings-form" onSubmit={submitChangeRequest}>
                  <Field id="admin-current-password" label="Current password">
                    <input type="password" value={changePassword.currentPassword} onChange={(event) => setChangePassword({ ...changePassword, currentPassword: event.target.value })} required />
                  </Field>
                  <Field id="admin-new-password" label="New password">
                    <input type="password" value={changePassword.newPassword} onChange={(event) => setChangePassword({ ...changePassword, newPassword: event.target.value })} required />
                  </Field>
                  <Field id="admin-confirm-password" label="Confirm new password">
                    <input type="password" value={changePassword.confirmPassword} onChange={(event) => setChangePassword({ ...changePassword, confirmPassword: event.target.value })} required />
                  </Field>
                  <div className="nh-settings-password-meter" aria-label={`Password strength ${passwordStrength} of 4`}>
                    <span>Password strength</span>
                    <div className="nh-settings-meter-track">
                      {[1, 2, 3, 4].map((level) => <span key={level} className={passwordStrength >= level ? 'nh-settings-meter-fill' : ''} />)}
                    </div>
                    <small>{passwordStrength >= 4 ? 'Strong' : passwordStrength >= 2 ? 'Medium' : 'Use 8+ characters'}</small>
                  </div>
                  <div className="nh-settings-form-actions">
                    <button type="button" className="nh-settings-button nh-settings-button-secondary" onClick={() => { setSecurityView('overview'); setMessage(''); }}>Cancel</button>
                    <button type="submit" className="nh-settings-button nh-settings-button-primary"><LockKeyhole size={15} /> Submit request</button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === 'security' && securityView === 'forgot' && (
              <div className="nh-settings-card">
                <button type="button" className="nh-settings-back-button" onClick={() => { setSecurityView('overview'); setMessage(''); }}>
                  <ArrowLeft size={15} /> Back to security
                </button>
                <div className="nh-settings-card-heading">
                  <span className="nh-settings-card-icon nh-settings-card-icon-amber"><Mail size={18} /></span>
                  <div>
                    <h4>Recover your account</h4>
                    <p>Enter the details linked to your official command account.</p>
                  </div>
                </div>
                <form className="nh-settings-form" onSubmit={submitForgotRequest}>
                  <Field id="admin-forgot-username" label="Username / Officer ID">
                    <input type="text" value={forgotPassword.username} onChange={(event) => setForgotPassword({ ...forgotPassword, username: event.target.value })} required />
                  </Field>
                  <Field id="admin-recovery-email" label="Registered recovery email">
                    <input type="email" value={forgotPassword.recoveryEmail} onChange={(event) => setForgotPassword({ ...forgotPassword, recoveryEmail: event.target.value })} placeholder="officer@gov.in" required />
                  </Field>
                  <div className="nh-settings-form-actions">
                    <button type="button" className="nh-settings-button nh-settings-button-secondary" onClick={() => { setSecurityView('overview'); setMessage(''); }}>Cancel</button>
                    <button type="submit" className="nh-settings-button nh-settings-button-primary"><Mail size={15} /> Send reset request</button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="nh-settings-card">
                <div className="nh-settings-card-heading">
                  <span className="nh-settings-card-icon"><Sun size={18} /></span>
                  <div>
                    <h4>Dashboard theme</h4>
                    <p>Select the visual mode for your command workspace.</p>
                  </div>
                </div>
                <div className="nh-settings-theme-grid">
                  <button type="button" className={`nh-settings-theme-card ${theme === 'light' ? 'nh-settings-theme-card-active' : ''}`} onClick={() => theme !== 'light' && onToggleTheme()} aria-pressed={theme === 'light'}>
                    <span className="nh-settings-theme-preview nh-settings-theme-preview-light"><span /><span /></span>
                    <span className="nh-settings-theme-copy"><strong>Light</strong><small>Clean and bright workspace</small></span>
                    {theme === 'light' && <span className="nh-settings-theme-check"><Check size={14} /></span>}
                  </button>
                  <button type="button" className={`nh-settings-theme-card ${theme === 'dark' ? 'nh-settings-theme-card-active' : ''}`} onClick={() => theme !== 'dark' && onToggleTheme()} aria-pressed={theme === 'dark'}>
                    <span className="nh-settings-theme-preview nh-settings-theme-preview-dark"><span /><span /></span>
                    <span className="nh-settings-theme-copy"><strong>Dark</strong><small>Comfortable for long shifts</small></span>
                    {theme === 'dark' && <span className="nh-settings-theme-check"><Check size={14} /></span>}
                  </button>
                </div>
                <div className="nh-settings-tip"><Bell size={15} /><span>Your theme preference is saved on this device and applied across admin dashboards.</span></div>
              </div>
            )}

            {activeSection === 'station' && (
              <div className="nh-settings-card">
                <div className="nh-settings-card-heading">
                  <span className="nh-settings-card-icon"><Settings size={18} /></span>
                  <div>
                    <h4>Station preferences</h4>
                    <p>Configure desk behavior and alerts for this session.</p>
                  </div>
                </div>
                <div className="nh-settings-form">
                  <Field id="admin-station-name" label="Station jurisdiction name">
                    <input type="text" value={stationSettings.stationName} onChange={(event) => setStationSettings({ ...stationSettings, stationName: event.target.value })} />
                  </Field>
                  <div className="nh-settings-toggle-group">
                    <ToggleRow label="Voice intake alerts" description="Play an audible cue when a new call is received." checked={stationSettings.audioAlerts} onChange={(event) => setStationSettings({ ...stationSettings, audioAlerts: event.target.checked })} />
                    <ToggleRow label="Auto-dispatch critical distress" description="Immediately route critical distress calls to the command queue." checked={stationSettings.autoDispatchCritical} onChange={(event) => setStationSettings({ ...stationSettings, autoDispatchCritical: event.target.checked })} />
                  </div>
                  <Field id="admin-working-language" label="Portal working language">
                    <select value={stationSettings.language} onChange={(event) => setStationSettings({ ...stationSettings, language: event.target.value })}>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                  </Field>
                </div>
                <div className="nh-settings-card-footer">
                  <span className="nh-settings-saved-hint">{settingsSaved ? <><Check size={14} /> Preferences saved</> : 'Preferences apply to your current desk session.'}</span>
                  <button type="button" className="nh-settings-button nh-settings-button-primary" onClick={saveStationPreferences}><Save size={15} /> Save preferences</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
