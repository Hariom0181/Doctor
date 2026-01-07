export function getAuthToken(): string | null {
  return (
    localStorage.getItem('patientToken') ||
    localStorage.getItem('doctorToken')
  );
}

export function getCurrentUserRole(): 'patient' | 'doctor' | null {
  if (localStorage.getItem('patientToken')) return 'patient';
  if (localStorage.getItem('doctorToken')) return 'doctor';
  return null;
}

export function getCurrentDoctorId(): string | null {
  const data = localStorage.getItem('doctorData');
  if (!data) return null;
  try {
    return JSON.parse(data).id?.toString() ?? null;
  } catch {
    return null;
  }
}
