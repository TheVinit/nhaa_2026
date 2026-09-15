import React from 'react';
import { ExternalLink, Scale, GraduationCap, Landmark, HeartHandshake } from 'lucide-react';

const organisations = [
  {
    category: 'COMMISSIONS',
    color: '#003087',
    bg: 'bg-blue-50',
    items: [
      { code: 'NCSC', label: 'National Commission for Scheduled Castes', href: '#' },
      { code: 'NCSK', label: 'National Commission for Safai Karamcharis', href: '#' },
      { code: 'NCBC', label: 'National Commission for Backward Classes', href: '#' },
    ],
  },
  {
    category: 'CORPORATIONS',
    color: '#FF6200',
    bg: 'bg-orange-50',
    items: [
      { code: 'NSFDC', label: 'National Scheduled Castes Finance and Development Corporation', href: '#' },
      { code: 'NSKFDC', label: 'National Safai Karamcharis Finance and Development Corporation', href: '#' },
      { code: 'NBCFDC', label: 'National Backward Classes Finance and Development Corporation', href: '#' },
    ],
  },
  {
    category: 'FOUNDATION / AUTONOMOUS BODIES',
    color: '#138808',
    bg: 'bg-green-50',
    items: [
      { code: 'DAF', label: 'Dr. Ambedkar Foundation', href: '#' },
      { code: 'DAIC', label: 'Dr. Ambedkar International Centre', href: '#' },
      { code: 'BJRNF', label: 'Babu JagJivan Ram National Foundation', href: '#' },
      { code: 'DWBDNC', label: 'Development and Welfare Board for De-notified, Nomadic, and Semi-Nomadic Communities', href: '#' },
      { code: 'NISD', label: 'National Institute of Social Defence', href: '#' },
    ],
  },
  {
    category: 'SCHEME SPECIFIC THEMATIC PORTALS',
    color: '#7C3AED',
    bg: 'bg-purple-50',
    items: [
      { code: 'SCW', label: 'Senior Citizens Welfare', href: '#' },
      { code: 'PM-AJAY', label: 'Pradhan Mantri Anusuchit Jaati Abhyuday Yojna', href: '#' },
      { code: 'SMILE', label: 'National Portal for Transgender Persons', href: '#' },
      { code: 'NOS', label: 'National Overseas Scholarship', href: '/schemes' },
      { code: 'NMBA', label: 'Nasha Mukt Bharat Abhiyaan', href: '/samavesh' },
      { code: 'NHAA / SAMBAL', label: 'National Helpline Against Atrocities', href: '/organisation/national-helpline-against-atrocities' },
    ],
  },
];

const OrganisationsSection = () => {
  return (
    <section className="bg-white py-12 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-[#FF6200] rounded-full"></div>
            <h2 className="text-xl font-bold text-[#003087]">Our Organisations</h2>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl ml-4">
            The Ministry of Social Justice and Empowerment works through key organisations that drive social inclusion, economic empowerment, and equal opportunity across India.
          </p>
        </div>

        {/* Key points */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { text: 'Promotes equality and social participation for all communities', Icon: Scale, color: '#003087' },
            { text: 'Builds skills and education pathways for self-reliance', Icon: GraduationCap, color: '#059669' },
            { text: 'Enables financial inclusion and livelihood opportunities', Icon: Landmark, color: '#D97706' },
            { text: 'Provides rehabilitation and welfare support for vulnerable groups', Icon: HeartHandshake, color: '#7C3AED' },
          ].map((point) => (
            <div key={point.text} className="flex items-start gap-2.5 p-3 bg-[#f8f9fa] rounded-xl border border-gray-100">
              <span className="shrink-0 p-1 rounded-lg bg-white shadow-sm" style={{ color: point.color }}>
                <point.Icon size={18} />
              </span>
              <p className="text-[11px] text-gray-600 leading-snug">{point.text}</p>
            </div>
          ))}
        </div>

        {/* Organisation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {organisations.map((group) => (
            <div key={group.category}>
              {/* Category Header */}
              <div
                className="flex items-center gap-2 mb-3 pb-2 border-b"
                style={{ borderColor: group.color + '30' }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: group.color }}></div>
                <h3 className="text-[10px] font-bold tracking-widest uppercase" style={{ color: group.color }}>
                  {group.category}
                </h3>
              </div>

              {/* Organisation items */}
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.code}>
                    <a
                      href={item.href}
                      className={`org-card flex items-start gap-2.5 p-2.5 rounded-lg ${group.bg} hover:shadow-sm transition-all group`}
                    >
                      <span
                        className="text-[9px] font-bold px-1.5 py-1 rounded shrink-0 text-white leading-none"
                        style={{ background: group.color }}
                      >
                        {item.code}
                      </span>
                      <span className="text-[11px] text-gray-700 leading-snug group-hover:text-gray-900 transition-colors flex-1">
                        {item.label}
                      </span>
                      <ExternalLink size={10} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: group.color }} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OrganisationsSection;
