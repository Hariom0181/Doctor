export function getAuthToken(): string | null {
  return (
    localStorage.getItem('PatientToken') ||
    localStorage.getItem('DoctorToken')
  );
}

export function getCurrentUserRole(): 'patient' | 'doctor' | null {
  if (localStorage.getItem('PatientToken')) return 'patient';
  if (localStorage.getItem('DoctorToken')) return 'doctor';
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
