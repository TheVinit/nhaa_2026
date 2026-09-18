import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../../utils/adminAuth';

/**
 * RequireRole — Route Guard Component
 *
 * Ensures the user has an active session before entering admin areas.
 * Unauthenticated visitors are directed to /admin/login.
 * Authenticated officers have full access across all administrative desks.
 */
export default function RequireRole({ children }) {
  const location = useLocation();
  const session = getSession();

  // Not logged in → redirect to login
  if (!session?.role) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
