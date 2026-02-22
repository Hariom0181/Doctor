import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('patient' | 'doctor')[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true
}: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return null;

  const location = useLocation();
  const authPaths = ['/patient/login', '/patient/register', '/doctor/login', '/doctor/register'];

  // Check role access
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />;
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={location.pathname.includes('/doctor') ? '/doctor/login' : '/patient/login'} replace />;
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && role && authPaths.includes(location.pathname)) {
    return <Navigate to={role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />;
  }

  return <>{children}</>;
}

// Specialized components for specific roles
export function PatientRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      {children}
    </ProtectedRoute>
  );
}

export function DoctorRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      {children}
    </ProtectedRoute>
  );
}

// For public routes that should redirect authenticated users
export function PublicRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}
