import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { getSession } from '../../utils/adminAuth';
import { hasRouteAccess, getHomeRoute } from '../../utils/roleGuard';

/**
 * RequireRole — Route Guard Component
 *
 * Wraps any admin route. If the logged-in user's role does not have
 * clearance for the current path, they are redirected to their own desk.
 * If not logged in at all, they are sent to /admin/login.
 */
export default function RequireRole({ children }) {
  const location = useLocation();
  const session = getSession();

  // Not logged in → send to login
  if (!session?.role) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in but no clearance for this route → send to own desk
  if (!hasRouteAccess(session.role, location.pathname)) {
    const homeRoute = getHomeRoute(session.role);
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
        gap: 16,
        padding: 32,
        textAlign: 'center',
      }}>
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 12,
          padding: '32px 48px',
          maxWidth: 480,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldAlert size={48} color="#DC2626" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#991B1B', margin: '0 0 8px' }}>
            Access Denied
          </h2>
          <p style={{ fontSize: 14, color: '#7F1D1D', margin: '0 0 20px', lineHeight: 1.6 }}>
            Your role <strong>({session.role.toUpperCase()})</strong> does not have
            clearance to access this desk. Access is restricted to your authorized
            workstation only.
          </p>
          <p style={{ fontSize: 11, color: '#B91C1C', margin: '0 0 20px' }}>
            Unauthorized access attempts are logged under Section 43 & 66 of
            Information Technology Act, 2000.
          </p>
          <a
            href={`#${homeRoute}`}
            style={{
              display: 'inline-block',
              background: '#DC2626',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              padding: '10px 24px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Return to My Desk →
          </a>
        </div>
      </div>
    );
  }

  return children;
}
