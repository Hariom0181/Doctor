// ============================================================
// AUTH UTILITY — client/lib/auth.ts
// ============================================================

const TOKEN_KEY = "token";
const USER_KEY = "userData";
const ROLE_KEY = "userRole";

// Save after login
export function saveAuth(token: string, userData: any, role: "doctor" | "patient") {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
  localStorage.setItem(ROLE_KEY, role);
}

// Get token for API requests
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Get saved user data
export function getUserData(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Get role
export function getUserRole(): "doctor" | "patient" | null {
  return localStorage.getItem(ROLE_KEY) as "doctor" | "patient" | null;
}

// Clear on logout
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

// Check if logged in
export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

// Build Authorization header for API calls
export function authHeader(): { Authorization: string } | {} {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}