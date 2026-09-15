import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Phone } from 'lucide-react';


const SCHEMES_DATA = [
  {
    id: 'avyay',
    title: 'Atal Vayo Abhyuday Yojana (AVYAY) - Senior Citizens Welfare',
    cat: 'Senior Citizens',
    tag: 'Welfare Scheme',
    desc: 'An umbrella scheme catering to basic needs of senior citizens like shelter, food, medical care, and emotional well-being through Senior Citizen Homes and Regional Resource Training Centres.',
    helpline: '14567 (Elderline)',
    target: 'Indigent elderly citizens across all Indian states and UTs.',
    benefits: 'Full funding for Old Age Homes, Continuous care homes, Mobile Medical Units, and Elderline services.',
  },
  {
    id: 'rvy',
    title: 'Rashtriya Vayoshri Yojana (RVY) - Assisted Living Devices for Senior Citizens',
    cat: 'Senior Citizens',
    tag: 'Assistive Devices',
    desc: 'Provides physical aids and assisted-living devices for Senior Citizens belonging to BPL category suffering from age-related disabilities or infirmities.',
    helpline: '14567',
    target: 'Senior citizens aged 60+ belonging to BPL/low-income families.',
    benefits: 'Free distribution of walking sticks, elbow crutches, walkers, hearing aids, wheelchairs, and dentures.',
  },
  {
    id: 'pm-ajay',
    title: 'Pradhan Mantri Anusuchit Jaati Abhyuday Yojna (PM-AJAY)',
    cat: 'Scheduled Castes',
    tag: 'Centrally Sponsored',
    desc: 'Integrated scheme for the socio-economic empowerment of SC communities through Adarsh Gram development, Grants-in-Aid for district-level income-generation projects, and construction of Hostels.',
    helpline: '1800-11-2001',
    target: 'SC-majority villages (40%+ SC population) and underprivileged SC families.',
    benefits: 'Up to ₹50,000 subsidy per beneficiary for self-employment livelihood projects and infrastructure development.',
  },
  {
    id: 'pm-yasasvi',
    title: 'PM Young Achievers Scholarship Award Scheme for Vibrant India (PM-YASASVI)',
    cat: 'Backward Classes & EBC',
    tag: 'Scholarship',
    desc: 'Comprehensive umbrella scholarship for Other Backward Classes (OBC), Economically Backward Classes (EBC), and De-Notified, Nomadic & Semi-Nomadic Tribes (DNT).',
    helpline: '011-69227700',
    target: 'Meritorious OBC/EBC/DNT students with annual family income up to ₹2.5 Lakh.',
    benefits: 'Full tuition fees and hostel allowance up to ₹1,25,000/year for top-class school and college education.',
  },
  {
    id: 'pcr-poa',
    title: 'Centrally Sponsored Scheme for PCR Act 1955 & SC/ST PoA Act 1989',
    cat: 'Civil Rights',
    tag: 'Legal Protection & Relief',
    desc: 'Implementation of the Protection of Civil Rights Act 1955 and SC & ST Prevention of Atrocities Act 1989, ensuring swift prosecution of atrocities and comprehensive relief for victims.',
    helpline: '14566 (NHAA 24x7)',
    target: 'Victims and witnesses of caste-based atrocities and civil discrimination.',
    benefits: 'Instant relief funds ranging from ₹85,000 to ₹8,25,000, legal assistance, and fast-track special court proceedings.',
  },
  {
    id: 'smile-transgender',
    title: 'SMILE - Support for Marginalized Individuals for Livelihood and Enterprise',
    cat: 'Social Defence & Transgender',
    tag: 'National Welfare Portal',
    desc: 'Comprehensive welfare scheme providing identity certification, gender-affirming healthcare support, skill training, and Garima Greh shelter homes for Transgender Persons.',
    helpline: '011-23386981',
    target: 'Transgender persons and individuals engaged in the act of begging.',
    benefits: 'National ID card & Certificate issuance, composite medical insurance up to ₹5 Lakh under PM-JAY, and livelihood grants.',
  },
  {
    id: 'nos',
    title: 'National Overseas Scholarship (NOS) for SC, DNT and Landless Agricultural Labourers',
    cat: 'Scheduled Castes',
    tag: 'Higher Education Abroad',
    desc: 'Financial assistance to meritorious students from SC, De-notified Tribes, and Traditional Artisans for pursuing Master’s and Ph.D. degrees in top QS-ranked world universities.',
    helpline: '011-23382184',
    target: '125 annual scholarships for SC candidates admitted to top 500 global universities.',
    benefits: 'Full tuition fees, annual maintenance allowance (USD 15,400 / GBP 9,900), visa fees, and economy airfare.',
  },
  {
    id: 'seed-dnt',
    title: 'SEED - Scheme for Economic Empowerment of DNT Communities',
    cat: 'Nomadic Tribes (DNT)',
    tag: 'Empowerment',
    desc: 'Welfare initiative designed for De-notified, Nomadic, and Semi-Nomadic Tribes without permanent revenue records, covering education, health insurance, and house construction.',
    helpline: '1800-11-2001',
    target: 'DNT families not covered under SC/ST/OBC categories.',
    benefits: 'Free coaching for competitive exams, health insurance under PM-JAY, and financial assistance for PMAY housing.',
  },
  {
    id: 'nmba',
    title: 'Nasha Mukt Bharat Abhiyaan (NMBA) - Drug Demand Reduction Campaign',
    cat: 'Social Defence & Transgender',
    tag: 'National Campaign',
    desc: 'Flagship national campaign running across 372 vulnerable districts, mobilizing youth, women, and educational institutions to build a substance abuse-free India.',
    helpline: '14446 (Toll-Free De-addiction Helpline)',
    target: 'Youth, educational institutions, community centres, and de-addiction facilities nationwide.',
    benefits: 'Subsidized treatment at Integrated Rehabilitation Centres for Addicts (IRCAs) and community counselling.',
  },
];

const CATEGORIES = [
  'All Categories',
  'Senior Citizens',
  'Scheduled Castes',
  'Backward Classes & EBC',
  'Social Defence & Transgender',
  'Civil Rights',
  'Nomadic Tribes (DNT)',
];

export default function SchemesPage() {
  const [selectedCat, setSelectedCat] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalScheme, setActiveModalScheme] = useState(null);

  const filteredSchemes = useMemo(() => {
    return SCHEMES_DATA.filter((s) => {
      const matchCat = selectedCat === 'All Categories' || s.cat === selectedCat;
      const matchSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cat.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, searchQuery]);

  return (
    <div style={{ background: '#F8FAFC', minHeight: '85vh', paddingBottom: 64 }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0073E6 0%, #004B87 100%)', color: '#fff', padding: '44px 0 36px' }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span>Schemes &amp; Services</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px' }}>Schemes &amp; Services</h1>
          <p style={{ fontSize: 15, opacity: 0.9, margin: 0, maxWidth: 800 }}>
            Discover centrally sponsored and departmental schemes for Scheduled Castes, Other Backward Classes, Senior Citizens, Transgender Persons, and Marginalized Communities.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '36px 24px' }}>
        
        {/* Search and Category Filter Bar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 32, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search schemes by name, keyword, or beneficiary category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                fontSize: 14,
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                outline: 'none',
                background: '#F8FAFC'
              }}
            />
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
              <Search size={16} />
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Filter Category:</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              style={{
                padding: '11px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#1E293B',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                background: '#fff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Category Pills Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 700,
                  border: isSelected ? '1px solid #0073E6' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  background: isSelected ? '#0073E6' : '#fff',
                  color: isSelected ? '#fff' : '#475569',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,115,230,0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Schemes Results Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '24px 26px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ background: '#EEF2FF', color: '#0073E6', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
                  {scheme.cat}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#F96302', background: '#FFF3EB', padding: '3px 8px', borderRadius: 6 }}>
                  {scheme.tag}
                </span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 10, lineHeight: 1.4 }}>
                {scheme.title}
              </h3>

              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, flex: 1, marginBottom: 20 }}>
                {scheme.desc}
              </p>

              <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#334155', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={13} /> Helpline:</span>
                <strong>{scheme.helpline}</strong>
              </div>

              <button
                onClick={() => setActiveModalScheme(scheme)}
                style={{
                  background: '#0073E6',
                  color: '#fff',
                  border: 'none',
                  padding: '11px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,115,230,0.2)'
                }}
              >
                View Details &amp; Guidelines ➔
              </button>
            </div>
          ))}
        </div>

        {filteredSchemes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 16, color: '#64748B' }}>No schemes found matching your search.</p>
            <button onClick={() => { setSelectedCat('All Categories'); setSearchQuery(''); }} style={{ marginTop: 12, background: '#0073E6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Reset Filters</button>
          </div>
        )}

      </div>

      {/* Detail Modal */}
      {activeModalScheme && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setActiveModalScheme(null)} style={{ position: 'absolute', right: 20, top: 20, background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer' }}>✕</button>

            <span style={{ background: '#EEF2FF', color: '#0073E6', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 12 }}>
              {activeModalScheme.cat}
            </span>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 16, lineHeight: 1.3 }}>
              {activeModalScheme.title}
            </h2>

            <div style={{ borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '16px 0', margin: '16px 0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>Overview</h4>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>{activeModalScheme.desc}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>Target Beneficiaries</h4>
              <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>{activeModalScheme.target}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>Key Assistance &amp; Benefits</h4>
              <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>{activeModalScheme.benefits}</p>
            </div>

            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Toll-Free Support Helpline</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0073E6' }}>{activeModalScheme.helpline}</div>
              </div>
              <Link to="/samavesh" style={{ background: '#198754', color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                Apply on SAMAVESH ➔
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
