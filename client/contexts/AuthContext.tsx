import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor';
  isVerified: boolean;
  profileComplete: boolean;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  phone: string;
  address: string;
  emergencyContact: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  medicalLicenseNumber: string;
  specialization: string;
  yearsOfExperience: string;
  qualifications: string;
  currentHospital: string;
  consultationFee: number;
  isApproved: boolean;
}

interface AuthState {
  user: Patient | Doctor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: Patient | Doctor }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Patient | Doctor> };

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: 'patient' | 'doctor') => Promise<void>;
  logout: () => void;
  register: (userData: any, role: 'patient' | 'doctor') => Promise<void>;
  updateProfile: (updates: Partial<Patient | Doctor>) => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
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

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string, role: 'patient' | 'doctor') => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Simulate API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (response.ok) {
        const userData = await response.json();
        dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        localStorage.setItem('authToken', userData.token);
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (userData: any, role: 'patient' | 'doctor') => {
    try {
      // Simulate API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...userData, role }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const result = await response.json();
      console.log('Registration successful:', result);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (updates: Partial<Patient | Doctor>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
