import React from 'react';

const TENDERS = [
  { title: 'Notice Inviting Expression of Interest for setting up District De-Addiction Centres under NAPDDR', org: 'DAIC', tenderNo: 'EOI/NAPDDR/2026', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/07/EOI.pdf' },
  { title: 'Invitation for Bids for providing Manpower Outsourcing Services to office of Dr. Ambedkar Foundation through GeM', org: 'DAF', tenderNo: 'GEM/2026/B/7698980', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/06/GeM-Bidding-9507171.pdf' },
  { title: 'Hindi Pakhwada Event Procurement & Supply Tender', org: 'NCSK', tenderNo: 'NCSK/HINDI/2024', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/05/Hindi-Pakhwada-14-September-to-28-September-2024.pdf' },
  { title: 'Tender for Security Guards & Parking Management at Lok Nayak Bhawan', org: 'NCSK', tenderNo: 'NCSK/SEC/2024', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/05/Tender-for-Security-Guards-for-parking-arrangement-in-Lok-Nayak-Bhawan-Khan-Market-New-Delhi.pdf' },
  { title: 'Proposals invited for Annual Personal Contract of IT Associates', org: 'NBCFDC', tenderNo: 'NBCFDC/IT/2026', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/02/tender-document-55-0-1.pdf' },
];

export default function TendersPage() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', paddingBottom: 60 }}>
      <div style={{ background: '#0073E6', color: '#fff', padding: '36px 0' }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Tenders &amp; Procurement</h1>
          <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>Notice Inviting Tenders (NIT), Bids &amp; Expression of Interest (EOI)</p>
        </div>
      </div>

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {TENDERS.map((t, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>{t.org}</span>
                <span style={{ fontSize: 11, color: '#64748B' }}>{t.tenderNo}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16, lineHeight: 1.5, flex: 1 }}>{t.title}</h3>
              <a
                href={t.pdf}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#0073E6', color: '#fff', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}
              >
                Download Tender Document (PDF)
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
