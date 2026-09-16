import React from 'react';
import { useLocation } from 'react-router-dom';
import { getSession, setSession } from '../../utils/adminAuth';

/**
 * RequireRole — Presentation Setup Route Guard
 * Allows full cross-tier presentation access across all desks.
 * Automatically initializes default officer session if none exists.
 */
export default function RequireRole({ children }) {
  const location = useLocation();
  let session = getSession();

  // If no active session, auto-initialize presentation mode session
  if (!session?.role) {
    session = {
      token: 'demo-presentation-token',
      role: 'dsp',
      name: 'DySP Rajesh Shinde',
      district: 'Pune District',
      state: 'Maharashtra',
      authSource: 'demo_presentation',
    };
    setSession(session);
  }

  return children;
}

