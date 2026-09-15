import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Academic Demonstration Disclaimer"
      style={{
        background: '#002244',
        color: '#E2E8F0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '5px 20px',
        fontSize: '12px',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          textAlign: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            background: '#FF9900',
            color: '#000000',
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '1.5px 7px',
            borderRadius: 3,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AlertTriangle size={11} color="#000000" />
          SIH 2026 Prototype
        </span>

        <span style={{ fontWeight: 400, color: '#CBD5E1', lineHeight: 1.4 }}>
          <strong style={{ color: '#FFFFFF' }}>Academic Demonstration Only:</strong> This portal is a working replica developed solely for <strong>Smart India Hackathon (Problem Statement-SIH26093 By Team Asterisk )</strong> evaluation and is NOT an official government website.
        </span>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        title="Dismiss notice"
        style={{
          background: 'none',
          border: 'none',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          flexShrink: 0,
          opacity: 0.8,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#FFFFFF';
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94A3B8';
          e.currentTarget.style.opacity = '0.8';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
