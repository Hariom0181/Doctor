const API_BASE_URL = 'http://localhost:5000/api';

export interface LinkedDoctor {
  id: number;
  name: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  consultationFee: number;
  linkedDate: string;
  relationshipStatus: string;
  relationshipNotes?: string;
}

export interface AvailableDoctor {
  id: number;
  name: string;
  specialization: string;
  hospital: string;
  consultationFee: number;
}

export interface HealthMetric {
  id: number;
  label: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
  lastChecked: string;
  metricType: string;
  systolic?: number;
  diastolic?: number;
  numericValue?: number;
  unit: string;
  recordedDate: string;
  recordedTime?: string;
  notes?: string;
  source: 'self_reported' | 'doctor_recorded';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}

class PatientApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getLinkedDoctors(patientId: string): Promise<LinkedDoctor[]> {
    try {
      // Add timeout to prevent long waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/linked-doctors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Backend service not available. Please start the server.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<LinkedDoctor[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching linked doctors:', error);
      throw error;
    }
  }

  async getAvailableDoctors(): Promise<AvailableDoctor[]> {
    try {
      // console.log('🌐 Calling API:', `${API_BASE_URL}/patients/available-doctors`);
      
      const response = await fetch(`${API_BASE_URL}/patients/available-doctors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AvailableDoctor[]> = await response.json();
      console.log('📄 API Response data:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error fetching available doctors:', error);
      throw error;
    }
  }

  async updateDoctorRelationship(patientId: string, doctorId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/update-doctor`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ doctorId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating doctor relationship:', error);
      throw error;
    }
  }

  async getHealthMetrics(patientId: string): Promise<HealthMetric[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/health-metrics`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<HealthMetric[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      throw error;
    }
  }

  // Helper method to get the latest metric for each type
  getLatestMetrics(metrics: HealthMetric[]): HealthMetric[] {
    const latestMetrics = new Map<string, HealthMetric>();
    
    metrics.forEach(metric => {
      const existing = latestMetrics.get(metric.metricType);
      if (!existing || new Date(metric.recordedDate) > new Date(existing.recordedDate)) {
        latestMetrics.set(metric.metricType, metric);
      }
    });

    return Array.from(latestMetrics.values());
  }
}

export const patientApiService = new PatientApiService();
export default patientApiService; 