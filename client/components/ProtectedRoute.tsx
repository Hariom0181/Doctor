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
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to appropriate login page based on the current path
    if (location.pathname.includes('/doctor')) {
      return <Navigate to="/doctor/login" state={{ from: location }} replace />;
    } else {
      return <Navigate to="/patient/login" state={{ from: location }} replace />;
    }
  }

  // If specific roles are required, check user role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized page or appropriate dashboard
    if (user.role === 'patient') {
      return <Navigate to="/patient/dashboard" replace />;
    } else {
      return <Navigate to="/doctor/dashboard" replace />;
    }
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (isAuthenticated && user) {
    const authPaths = ['/patient/login', '/patient/register', '/doctor/login', '/doctor/register'];
    if (authPaths.includes(location.pathname)) {
      if (user.role === 'patient') {
        return <Navigate to="/patient/dashboard" replace />;
      } else {
        return <Navigate to="/doctor/dashboard" replace />;
      }
    }
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
