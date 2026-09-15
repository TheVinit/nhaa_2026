import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, PhoneCall, Route, ShieldCheck, Sparkles, Video } from 'lucide-react';
import { ASSETS } from '../../assets';
import {
  SIDE_MENU,
  LEADERSHIP,
  REPORTS,
  RESOURCES,
  LATEST_UPDATES,
  TAGS,
} from '../../data/nhaaOrganisationContent';

const cardStyle = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: 16,
  padding: 20,
};

function DocCard({ item }) {
  return (
    <article style={{ ...cardStyle, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{item.title}</h3>
      <time dateTime={item.date} style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>{item.date}</time>
      <span style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>
        Type: {item.type} · File: {item.fileType} ({item.size})
      </span>
      <div style={{ marginTop: 'auto', textAlign: 'right' }}>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${item.title} online (opens in new tab)`}
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#0073E6',
            border: '1px solid #0073E6',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          View Online
        </a>
      </div>
    </article>
  );
}

function EventCard({ item }) {
  return (
    <article style={{ ...cardStyle, display: 'flex', gap: 16 }}>
      <div
        aria-hidden="true"
        style={{
          minWidth: 72,
          textAlign: 'center',
          background: '#EEF2FF',
          borderRadius: 12,
          padding: '12px 8px',
          alignSelf: 'flex-start',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: '#003366', lineHeight: 1 }}>{item.day}</div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{item.month}</div>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.5 }}>
          {item.title}
        </h3>
        <Link to={item.link} style={{ fontSize: 13, fontWeight: 600, color: '#0073E6', textDecoration: 'none' }}>
          Read More<span className="sr-only"> about {item.title}</span> →
        </Link>
      </div>
    </article>
  );
}

const IVRS_VIDEO_URL = '';
const ivrsVideoEmbedUrl = (() => {
  if (!IVRS_VIDEO_URL) return '';
  try {
    const parsed = new URL(IVRS_VIDEO_URL);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
    if (parsed.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${parsed.pathname.replace(/^\//, '')}`;
    }
    return IVRS_VIDEO_URL;
  } catch {
    return '';
  }
})();
const hasIvrsVideo = Boolean(ivrsVideoEmbedUrl);

function AiTriageShowcase() {
  return (
    <section aria-labelledby="ai-triage-title" style={{ marginBottom: 48 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #003366 0%, #0073E6 100%)',
          color: '#fff',
          boxShadow: '0 18px 40px -18px rgba(0, 51, 102, 0.28)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div aria-hidden="true" style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(4px)', top: -150, right: -80 }} />
        <div aria-hidden="true" style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.16)', filter: 'blur(8px)', bottom: -120, left: 120 }} />
        <div style={{ position: 'relative', padding: 30, display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.08, textTransform: 'uppercase' }}>
              <Sparkles size={14} /> AI-enabled IVRS triage
            </div>
            <h2 id="ai-triage-title" style={{ fontSize: 28, fontWeight: 850, lineHeight: 1.18, margin: '18px 0 14px', letterSpacing: -0.5 }}>
              AI-Powered Real-Time Trauma &amp; Risk Triage
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: 'rgba(255,255,255,0.9)', maxWidth: 620 }}>
              Before any human answers, our AI listens — detecting trauma, fear, and risk from voice and text in real time. Every caller is instantly scored, routed to the right officer, and given a trackable docket number — so no cry for help is ever lost in a queue.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700 }}>
                <PhoneCall size={15} /> 14566 IVRS
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700 }}>
                <Activity size={15} /> Real-time scoring
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700 }}>
                <Route size={15} /> Officer routing
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700 }}>
                <ShieldCheck size={15} /> Docket tracking
              </span>
            </div>
            <div style={{ marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
              Developed by <strong style={{ color: '#fff' }}>Team Asterisk</strong>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: 22, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Video size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>IVRS Demo</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Short solution video</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.06, color: '#FDE68A', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(253,230,138,0.35)', borderRadius: 999, padding: '4px 8px' }}>
                COMING SOON
              </span>
            </div>
            {hasIvrsVideo ? (
              <div style={{ overflow: 'hidden', borderRadius: 14, border: '1px solid rgba(255,255,255,0.22)', background: '#000' }}>
                <iframe
                  src={ivrsVideoEmbedUrl}
                  title="Team Asterisk IVRS demonstration video"
                  width="100%"
                  height="220"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block', border: 0 }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, minHeight: 150, padding: 20, borderRadius: 14, border: '1px dashed rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', flexShrink: 0 }}>
                  <Video size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Video link will be added here</div>
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Paste the YouTube URL after the IVRS video shoot.</div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 6px' }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>AI</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Listen</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 6px' }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Risk</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Score</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 6px' }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>ID</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Track</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function NhaaOrganisationPage() {
  const [activeTab, setActiveTab] = useState(LATEST_UPDATES.tabs[0].id);
  const currentTab = LATEST_UPDATES.tabs.find((t) => t.id === activeTab) || LATEST_UPDATES.tabs[0];

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', paddingBottom: 60 }}>
      <a href="#nhaa-main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 0' }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 24px', fontSize: 13, color: '#475569' }}>
          <Link to="/" style={{ color: '#334155', textDecoration: 'none' }}>Home</Link>
          <span aria-hidden="true" style={{ margin: '0 8px' }}>/</span>
          <span aria-current="page" style={{ color: '#111827', fontWeight: 600 }}>National Helpline Against Atrocities (NHAA)</span>
        </div>
      </nav>

      {/* Hero */}
      <section
        aria-labelledby="nhaa-org-title"
        style={{
          background: 'linear-gradient(135deg, #003366 0%, #0073E6 100%)',
          color: '#fff',
          padding: '40px 0 48px',
        }}
      >
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <img
              src={ASSETS.sambal}
              alt="SAMBAL – National Helpline Against Atrocities logo"
              width={80}
              height={80}
              style={{ marginBottom: 16, borderRadius: 12, background: '#fff', padding: 8 }}
            />
            <h1 id="nhaa-org-title" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>
              National Helpline Against Atrocities (NHAA)
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 640, margin: '0 0 24px', opacity: 0.95 }}>
              <strong>A Constitutional Body under Article 338 of the Constitution of India.</strong> The Commission is
              established with a view to provide safeguards against the exploitation of Scheduled Castes and to protect
              and promote their social, educational, economic and cultural interests.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link to="/nhaa" style={heroBtnStyle} aria-label="Register a grievance on the SAMBAL citizen portal">
                Register Grievance →
              </Link>
              <Link to="/nhaa" style={heroBtnStyle} aria-label="Register a rescue on the SAMBAL citizen portal">
                Register a Rescue →
              </Link>
              <Link to="/nhaa" style={heroBtnStyle} aria-label="Track grievance status on the SAMBAL citizen portal">
                Track Grievance Status →
              </Link>
            </div>
          </div>
          <img
            src="https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/03/NHAPOA.png"
            alt="National Helpline Against Atrocities helpline illustration"
            width={280}
            height={280}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </section>

      {/* Quick info */}
      <section aria-labelledby="quick-info-heading" style={{ maxWidth: 1380, margin: '0 auto', padding: '24px 24px 0' }}>
        <h2 id="quick-info-heading" className="sr-only">Headquarters and helpline information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#166534', margin: '0 0 4px' }}>New Delhi</h3>
            <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>Headquarters</p>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#166534', margin: '0 0 4px' }}>Helpline</h3>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#003366' }}>
              <a href="tel:14566" style={{ color: '#003366', textDecoration: 'none' }} aria-label="Call NHAA helpline 14566">
                14566
              </a>
            </p>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Link
              to="/nhaa"
              style={{ fontSize: 14, fontWeight: 700, color: '#0073E6', textDecoration: 'none' }}
            >
              Access SAMBAL Citizen Portal →
            </Link>
          </div>
        </div>
      </section>

      {/* Main layout with side menu */}
      <div id="nhaa-main-content" style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
        <nav aria-label="NHAA page sections" style={{ position: 'sticky', top: 120, alignSelf: 'start' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {SIDE_MENU.map((item) =>
              item.type === 'heading' ? (
                <li key={item.label} aria-hidden="true" style={{ fontSize: 11, fontWeight: 800, color: '#64748B', padding: '12px 0 6px', letterSpacing: 0.5 }}>
                  {item.label}
                </li>
              ) : (
                <li key={item.label}>
                  {item.internal ? (
                    <Link to={item.href} style={sideLinkStyle}>{item.label}</Link>
                  ) : (
                    <a href={item.href} style={sideLinkStyle}>{item.label}</a>
                  )}
                </li>
              )
            )}
          </ul>
        </nav>

        <div>
          <AiTriageShowcase />

          {/* About the Scheme */}
          <section id="aboutCommissionSec" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>About the Scheme</h2>
              <Link to="/about-us" style={outlineBtnStyle}>Know More →</Link>
            </div>
            <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.8, margin: 0 }}>
              A Centrally Sponsored schemes was launched in the year 1974-75 for implementation of the Protection of
              Civil Right (PCR) Act, 1955 and Prevention of Atrocities (POA) Act, 1989 to establish egalitarian society.
            </p>
          </section>

          {/* Leadership */}
          <section id="leadershipOrganisationSec" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Leadership &amp; Organisation</h2>
              <Link to="/contact-us" style={outlineBtnStyle}>Know More →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {LEADERSHIP.map((person) => (
                <div key={person.name} style={cardStyle}>
                  <img
                    src={person.image}
                    alt={person.name}
                    width={120}
                    height={120}
                    style={{ width: '100%', maxWidth: 120, borderRadius: 12, objectFit: 'cover', marginBottom: 12 }}
                  />
                  <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>
                    <Link to={person.profilePath} style={{ color: '#0F172A', textDecoration: 'none' }}>{person.name}</Link>
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{person.title}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Reports */}
          <section id="reportsSec" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Reports</h2>
              <Link to="/tenders" style={outlineBtnStyle}>View All →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {REPORTS.map((r) => (
                <DocCard key={r.title} item={r} />
              ))}
            </div>
          </section>

          {/* Resources */}
          <section id="resourcesSec" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Resources</h2>
              <Link to="/tenders" style={outlineBtnStyle}>View All →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {RESOURCES.map((r) => (
                <DocCard key={r.title} item={r} />
              ))}
            </div>
          </section>

          {/* Latest Updates */}
          <section id="LatestUpdatesSec" style={{ marginBottom: 48 }} aria-labelledby="latest-updates-heading">
            <h2 id="latest-updates-heading" style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Latest Updates</h2>
            <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px' }}>{LATEST_UPDATES.subtitle}</p>
            <div role="tablist" aria-label="Latest updates categories" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {LATEST_UPDATES.tabs.map((tab) => {
                const tabId = `tab-${tab.id}`;
                const panelId = `panel-${tab.id}`;
                return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={tabId}
                  aria-selected={activeTab === tab.id}
                  aria-controls={panelId}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => {
                    const tabs = LATEST_UPDATES.tabs;
                    const idx = tabs.findIndex((t) => t.id === tab.id);
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      setActiveTab(tabs[(idx + 1) % tabs.length].id);
                    }
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length].id);
                    }
                  }}
                  style={{
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 8,
                    border: activeTab === tab.id ? '2px solid #0073E6' : '1px solid #CBD5E1',
                    background: activeTab === tab.id ? '#EEF2FF' : '#fff',
                    color: activeTab === tab.id ? '#003366' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );})}
            </div>
            <div
              role="tabpanel"
              id={`panel-${currentTab.id}`}
              aria-labelledby={`tab-${currentTab.id}`}
            >
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Link to={currentTab.viewAllPath} style={{ fontSize: 13, fontWeight: 600, color: '#0073E6', textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {currentTab.items.map((item) => (
                  <EventCard key={item.title} item={item} />
                ))}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section id="contactUsSec" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Contact</h2>
              <Link to="/contact-us" style={outlineBtnStyle}>Know More</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0073E6', margin: '0 0 8px' }}>Phone</h3>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#475569' }}>Technical Team</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  <a href="tel:+911124364461" style={{ color: '#0F172A', textDecoration: 'none' }}>+91-11-24364461</a>
                </p>
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0073E6', margin: '0 0 8px' }}>Email</h3>
                <p style={{ margin: 0, fontSize: 14, color: '#334155' }}>support-nha[at]supportgov[dot]in</p>
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0073E6', margin: '0 0 8px' }}>Helpline</h3>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#003366' }}>14566 (24×7)</p>
              </div>
            </div>
          </section>

          {/* Tags */}
          <footer style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
            <h2 className="sr-only">Page tags</h2>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px' }}>Tagged</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TAGS.map((tag) => (
                <Link
                  key={tag}
                  to="/schemes"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0073E6',
                    background: '#EEF2FF',
                    padding: '4px 12px',
                    borderRadius: 999,
                    textDecoration: 'none',
                  }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

const heroBtnStyle = {
  display: 'inline-block',
  background: '#fff',
  color: '#003366',
  padding: '10px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
};

const sideLinkStyle = {
  display: 'block',
  padding: '8px 0',
  fontSize: 13,
  fontWeight: 500,
  color: '#334155',
  textDecoration: 'none',
};

const outlineBtnStyle = {
  display: 'inline-block',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  color: '#0073E6',
  border: '1px solid #0073E6',
  borderRadius: 8,
  textDecoration: 'none',
};
