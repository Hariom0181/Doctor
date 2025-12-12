const API_BASE_URL = "http://localhost:5000/api/dashboard";  // ✅ Correct port

export const dashboardApi = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    const json = await response.json();
    return json;  // return full JSON, frontend expects { success, data }
  },

  getRecentActivities: async () => {
    const response = await fetch(`${API_BASE_URL}/recent-activities`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    const json = await response.json();
    return json;
  },

  searchPatients: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/search-patients?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search patients');
    const json = await response.json();
    return json;
  },

  getPatientDetails: async (patientId: string) => {
    const response = await fetch(`${API_BASE_URL}/patient/${patientId}`);
    if (!response.ok) throw new Error('Failed to fetch patient details');
    const json = await response.json();
    return json;
  },

  getDiagnosisAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/diagnoses`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    const json = await response.json();
    return json;
  },
};
