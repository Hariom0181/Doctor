import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { saveAuth, clearAuth, getAuthToken, getUserData, getUserRole } from '@/lib/auth';

// ============================================================
// TYPES
// ============================================================
export interface Doctor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'doctor';
  phone: string;
  specialization: string;
  current_hospital: string;
  licenseNumber: string;
  years_of_experience: string;
  qualifications: string;
  consultation_fee: number;
  available_hours: string;
  bio: string;
  profilePicture: string | null;
  isVerified: boolean;
}

export interface Patient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient';
  phone: string;
  address: string;
}

interface AuthState {
  user: Patient | Doctor | null;
  role: 'doctor' | 'patient' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: Patient | Doctor; role: 'doctor' | 'patient' } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: Patient | Doctor; role: 'doctor' | 'patient' } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Patient | Doctor> };

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: 'patient' | 'doctor') => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Patient | Doctor>) => void;
}

// ============================================================
// INITIAL STATE
// ============================================================
const initialState: AuthState = {
  user: null,
  role: null,
  isLoading: true, // Start as true so we wait for session restore
  isAuthenticated: false,
};

// ============================================================
// REDUCER
// ============================================================
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.role,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.role,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on page refresh
  useEffect(() => {
    const token = getAuthToken();
    const userData = getUserData();
    const role = getUserRole();

    if (token && userData && role) {
      dispatch({
        type: 'RESTORE_SESSION',
        payload: { user: { ...userData, role }, role },
      });
    } else {
      // No session — stop loading
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================
  const login = async (email: string, password: string, role: 'patient' | 'doctor') => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const endpoint =
        role === 'doctor'
          ? 'http://localhost:5000/api/doctors/login'
          : 'http://localhost:5000/api/patients/login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('Login response:', data);
       // Debug log
      
      if (!response.ok) {
        dispatch({ type: 'LOGIN_FAILURE' });
        throw new Error(data.message || 'Login failed');
      }
      
      // Get user data - handle both doctor and patient responses
      const userData = role === 'doctor' ? data.doctor : data.patient;
      
      if (!userData) {
        throw new Error('Invalid response from server');
      }
      
      saveAuth(data.token, userData, role);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: { ...userData, role }, role },
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = () => {
    clearAuth();
    dispatch({ type: 'LOGOUT' });
  };

  // ============================================================
  // UPDATE PROFILE
  // ============================================================
  const updateProfile = (updates: Partial<Patient | Doctor>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}