import React from 'react';

const VACANCIES = [
  { org: 'Dr. Ambedkar International Centre (DAIC)', title: 'Short Term Internship Programme at DAIC (September 2026)', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/08/Internship-Advertisment-September.pdf', date: 'Aug 2026' },
  { org: 'Dr. Ambedkar International Centre (DAIC)', title: 'Vacancy Circular for the post of Financial Advisor', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/08/FA-31-07-2026.pdf', date: 'Jul 2026' },
  { org: 'NBCFDC', title: 'Recruitment Notification for Deputy General Manager (Finance) – E-5 Level', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2026/01/advertisement-E-5-10.12.2025_1.pdf', date: 'Jan 2026' },
  { org: 'National Institute of Social Defence (NISD)', title: 'Filling up the post of Junior Research Officer, Technical Assistant & Stenographer Grade-III on deputation basis', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2025/11/Application_for_the_post_of_JRO_TA_Steno_NISD.pdf', date: 'Nov 2025' },
  { org: 'National Institute of Social Defence (NISD)', title: 'Filling up the post of Deputy Director (Trg.) on deputation basis in NISD', pdf: 'https://durwo6bhtjtqt.cloudfront.net/wp-content/uploads/2025/11/Application_for_the_post_of_DD_TRG.pdf', date: 'Nov 2025' },
];

export default function VacanciesPage() {
  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', paddingBottom: 60 }}>
      <div style={{ background: '#0073E6', color: '#fff', padding: '36px 0' }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Vacancies &amp; Recruitment</h1>
          <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>Career &amp; Internship Opportunities across Ministry Divisions &amp; Autonomous Bodies</p>
        </div>
      </div>

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {VACANCIES.map((v, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#F96302', background: '#FFF7F0', padding: '3px 10px', borderRadius: 4 }}>{v.org}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '6px 0 2px' }}>{v.title}</h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Posted: {v.date}</span>
              </div>
              <a
                href={v.pdf}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#DC2626', color: '#fff', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
              >
                Download Notice (PDF)
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
