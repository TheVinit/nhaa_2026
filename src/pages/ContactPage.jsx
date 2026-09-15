import React, { useState } from 'react';
import { MapPin, Phone, Mail, CheckCircle2, Send } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '80vh', paddingBottom: 60 }}>
      <div style={{ background: '#0073E6', color: '#fff', padding: '36px 0' }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Contact Us &amp; Public Grievance</h1>
          <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>Department of Social Justice &amp; Empowerment Help Desk</p>
        </div>
      </div>

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {/* Contact Details */}
          <div style={{ background: '#fff', padding: 28, borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0073E6', marginBottom: 20 }}>Official Headquarters</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
              <MapPin size={18} color="#0073E6" style={{ flexShrink: 0, marginTop: 3 }} />
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                <strong>Address:</strong><br />
                8th Floor, GPOA-3, Netaji Nagar, New Delhi – 110023
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
              <Phone size={18} color="#0073E6" style={{ flexShrink: 0, marginTop: 3 }} />
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                <strong>Toll-Free National Helplines:</strong><br />
                • Elder Line (Senior Citizens): <strong>14567</strong><br />
                • Nasha Mukt Bharat Helpline: <strong>14446</strong><br />
                • National Helpline Against Atrocities (NHAA): <strong>14566</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Mail size={18} color="#0073E6" style={{ flexShrink: 0, marginTop: 3 }} />
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                <strong>Public Grievance Portal:</strong><br />
                Register complaints on CPGRAMS at <a href="https://pgportal.gov.in/" target="_blank" rel="noreferrer" style={{ color: '#0073E6', fontWeight: 600 }}>pgportal.gov.in</a>
              </p>
            </div>
          </div>

          {/* Grievance Form */}
          <div style={{ background: '#fff', padding: 28, borderRadius: 14, border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0073E6', marginBottom: 20 }}>Send an Inquiry</h2>
            {submitted ? (
              <div style={{ padding: 20, background: '#F0FFF4', border: '1px solid #B3EDBE', borderRadius: 8, color: '#166534', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#166534" />
                Thank you! Your inquiry has been submitted to the Department Helpdesk.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>FULL NAME</label>
                  <input required type="text" placeholder="Enter your full name" style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>EMAIL ADDRESS</label>
                  <input required type="email" placeholder="name@example.com" style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>CATEGORY</label>
                  <select style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none', background: '#fff' }}>
                    <option>Scholarship Inquiry</option>
                    <option>NGO Grant-in-Aid</option>
                    <option>Senior Citizens Helpline</option>
                    <option>General Information</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>MESSAGE / INQUIRY</label>
                  <textarea required rows={4} placeholder="Type your message here..." style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}></textarea>
                </div>
                <button type="submit" style={{ background: '#0073E6', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Send size={15} /> Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
