import React from 'react';
import { MapPin } from 'lucide-react';
import { ASSETS } from '../assets';

// Inline SVG brand icons (lucide-react doesn't ship brand icons)
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const IconWhatsapp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const footerLinks = {
  Department: [
    { label: 'About Ministry', href: 'https://www.dosje.gov.in/about-us/' },
    { label: 'Vision & Mission', href: 'https://www.dosje.gov.in/about-us/' },
    { label: 'Organisational Chart', href: 'https://www.dosje.gov.in/whos-who/' },
    { label: 'Ministers & Officials', href: 'https://www.dosje.gov.in/mosje-directory/' },
  ],
  Services: [
    { label: 'Schemes & Benefits', href: 'https://www.dosje.gov.in/schemes-services/' },
    { label: 'Tenders', href: 'https://www.dosje.gov.in/tenders/' },
    { label: 'Vacancies', href: 'https://www.dosje.gov.in/vacancies/' },
  ],
  Support: [
    { label: 'Help & Support', href: 'https://www.dosje.gov.in/contact-us/' },
    { label: 'Contact Us', href: 'https://www.dosje.gov.in/contact-us/' },
    { label: 'RTI', href: 'https://www.dosje.gov.in/rti/' },
    { label: 'Sitemap', href: 'https://www.dosje.gov.in/sitemap' },
  ],
  Resources: [
    { label: 'Notices', href: 'https://www.dosje.gov.in/notices/' },
    { label: 'Acts & Rules', href: 'https://www.dosje.gov.in/acts-rules/' },
    { label: 'Reports', href: 'https://www.dosje.gov.in/annual-reports/' },
    { label: 'Publications', href: 'https://www.dosje.gov.in/publications/' },
    { label: 'Statistics', href: 'https://www.dosje.gov.in/dashboard/' },
  ],
};

const socialLinks = [
  { Icon: IconFacebook, href: 'https://www.facebook.com/goimsje', label: 'Facebook' },
  { Icon: IconTwitter, href: 'https://x.com/msjegoi', label: 'Twitter/X' },
  { Icon: IconInstagram, href: 'https://www.instagram.com/msjegoi', label: 'Instagram' },
  { Icon: IconYoutube, href: 'https://www.youtube.com/@ministryofsocialjustice511', label: 'YouTube' },
  { Icon: IconWhatsapp, href: 'https://whatsapp.com/channel/0029Vb7GfwH6mYPMHOvTd51W', label: 'WhatsApp' },
];

const Footer = () => {
  return (
    <footer className="bg-[#001f5b] text-white">

      {/* Need Support CTA */}
      <div className="bg-gradient-to-r from-[#FF6200] to-[#E8530A]">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Need Support?</h3>
            <p className="text-sm text-orange-100">Reach out to us and we will get back to you!</p>
          </div>
          <a
            href="https://www.dosje.gov.in/contact-us/"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 bg-white text-[#FF6200] font-bold px-6 py-2.5 rounded-full text-sm hover:bg-orange-50 transition-colors shadow-md"
          >
            Get in Touch
          </a>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">

          {/* Logo & Info — 2 cols */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-3 mb-4">
              <img
                src={ASSETS.nationalEmblemWhite}
                alt="National Emblem"
                className="h-14 w-auto object-contain"
                onError={e => { e.target.src = ASSETS.nationalEmblem; }}
              />
              <div>
                <div className="text-[10px] text-blue-300">Government of India</div>
                <div className="text-sm font-bold leading-tight">Ministry of Social Justice</div>
                <div className="text-sm font-bold text-[#FF9933]">&amp; Empowerment</div>
                <div className="text-[10px] text-blue-300 mt-0.5">Department of SJ &amp; E</div>
              </div>
            </a>

            {/* Address */}
            <div className="flex items-start gap-2 text-xs text-blue-200 mb-5">
              <MapPin size={13} className="text-[#FF6200] shrink-0 mt-0.5" />
              <span>8th Floor, GPOA-3, Netaji Nagar, New Delhi – 110023</span>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2.5 flex-wrap mb-5">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#FF6200] flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Icon />
                </a>
              ))}
            </div>

            {/* Partner logos row */}
            <div className="flex items-center gap-4 flex-wrap">
              <img src={ASSETS.digitalIndiaWhite} alt="Digital India" className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" onError={e => e.target.style.display='none'} />
              <img src={ASSETS.negd} alt="NeGD" className="h-6 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" onError={e => e.target.style.display='none'} />
            </div>
          </div>

          {/* Footer link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-[#FF6200] mb-4 pb-2 border-b border-white/10">
                {section}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-200 hover:text-white transition-colors flex items-center gap-1.5 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#FF6200] opacity-50 group-hover:opacity-100 shrink-0 transition-opacity"></span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* External Portal logos */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <p className="text-[10px] text-blue-400 mb-3 uppercase tracking-widest font-semibold">External Portals</p>
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { img: ASSETS.indiaGov, alt: 'India.gov.in', href: 'https://india.gov.in/' },
              { img: ASSETS.myGov, alt: 'MyGov', href: 'https://www.mygov.in/' },
              { img: ASSETS.makeInIndia, alt: 'Make in India', href: 'https://www.makeinindia.com/' },
              { img: ASSETS.dataGov, alt: 'data.gov.in', href: 'https://data.gov.in/' },
            ].map(({ img, alt, href }) => (
              <a key={alt} href={href} target="_blank" rel="noreferrer">
                <img
                  src={img}
                  alt={alt}
                  className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                  onError={e => e.target.style.display='none'}
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Important Links */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-[#FF6200] mb-3">Important Links</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[11px] text-blue-300">
            {[
              { label: 'Scheduled Caste Welfare', href: 'https://www.dosje.gov.in/about-the-division/' },
              { label: 'Welfare of Other Backward Classes', href: 'https://www.dosje.gov.in/about-the-division-welfare-of-the-other-backward-classes/' },
              { label: 'Grants-In-Aid to NGOs', href: 'https://grants-msje.gov.in/ngo-login' },
              { label: 'Budget and Account', href: 'https://www.dosje.gov.in/detailed-demand-for-grant/' },
              { label: 'Social Defence', href: 'https://www.dosje.gov.in/about-the-division-social-defence/' },
              { label: 'Public Grievance', href: 'https://pgportal.gov.in/' },
              { label: 'Statistics Division', href: 'https://www.dosje.gov.in/about-the-division-statistics-division/' },
              { label: 'Official Language', href: 'https://www.dosje.gov.in/official-language-background/' },
              { label: 'Parliamentary Matters', href: 'https://www.dosje.gov.in/assurances/' },
              { label: 'Plan Division', href: 'https://www.dosje.gov.in/about-the-division-2/' },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* SIH 2026 Academic Disclaimer Bar */}
      <div className="bg-[#00081a] border-t border-amber-500/30 px-4 py-3 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] text-amber-300">
          <span className="font-bold bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-wider text-[10px]">
            Academic Prototype Disclaimer
          </span>
          <span>
            This portal is an educational prototype developed exclusively for <strong>Smart India Hackathon (SIH 2026) Problem Statement 14566 (NHAA - DoSJE)</strong>. It is created solely for technical demonstration and evaluation purposes and is not an official government website.
          </span>
        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="bg-[#000f2e] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-[10px] text-blue-400 text-center md:text-left">
              <p>
                Designed, Developed &amp; Maintained for{' '}
                <span className="text-blue-200 font-semibold">
                  Smart India Hackathon (SIH 2026) Prototype Demonstration
                </span>
                {' '}| Ministry of Social Justice &amp; Empowerment (DoSJE) Reference Model
              </p>
              <p className="mt-0.5">
                All department logos and trademarks are property of their respective government bodies and used strictly under educational fair-use principles.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {[
                { label: 'SIH 2026 PS-14566', href: '#/nhaa' },
                { label: 'NHAA 14566 Portal', href: '#/nhaa' },
                { label: 'Admin Command Center', href: '#/admin/login' },
                { label: 'Copyright & Fair Use', href: 'https://www.dosje.gov.in/home-page/copyright-policy/' },
                { label: 'Privacy Policy', href: 'https://www.dosje.gov.in/home-page/privacy-policy/' },
              ].map(({ label, href }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer" className="text-[10px] text-blue-400 hover:text-white transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
