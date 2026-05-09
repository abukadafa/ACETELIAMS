import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Branded Loading Spinner for initial auth check
 */
export function BrandedSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-[#EAF3DE] rounded-full" />
        <div className="absolute inset-0 border-4 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#3B6D11] font-black text-xl">ACE</span>
        </div>
      </div>
      <div className="text-[#173404] font-medium tracking-widest text-sm animate-pulse">
        ACETEL IAMS
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'facilitator' | 'staff' | 'admin')[];
}

/**
 * Institutional Route Guard (RBAC)
 * Protects routes and ensures only authorized roles can access specific areas.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <BrandedSpinner />;
  }

  // 1. Unauthenticated access redirects to /login
  if (!user) {
    return <Navigate to="/?login=true" state={{ from: location }} replace />;
  }

  // 2. Role-based access control
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Staff can access student routes (read-only intended in pages)
    if (user.role === 'staff' && location.pathname.startsWith('/student')) {
        return <>{children}</>;
    }

    // Unauthorized access redirects to /unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Admin can access all routes
  if (user.role === 'admin') {
      return <>{children}</>;
  }

  return <>{children}</>;
};
