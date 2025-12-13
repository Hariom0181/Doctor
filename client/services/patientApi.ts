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
// patientApi.ts (or a shared types file)
export interface PatientProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  profilePicture?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
  lastVisitDate?: string;
  createdAt: string;
}
export interface PatientMedicalRecord {
  id: number;
  patientId: string;
  doctorId: number;
  doctorName?: string;
  doctorSpecialization?: string;
  examinationType: string;
  diagnosis: string;
  prescription?: string;
  currentHospital? : string;
  nextCheckupDate?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt?: string;
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
    const token = localStorage.getItem('PatientToken');
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
  

  
  async getMedicalRecords(patientId: string): Promise<PatientMedicalRecord[]> {
    try {
      // console.log('🏥 Fetching patient medical records for:', patientId);
      
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-records`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
  
      console.log('📡 Get medical records response status:', response.status);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result: ApiResponse<PatientMedicalRecord[]> = await response.json();
      // console.log('📄 Medical records result:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }
  
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching medical records:', error);
      throw error;
    }
  }
  async getAvailableDoctors(): Promise<AvailableDoctor[]> {
    //this files is from patientApi.ts
    try {
      // console.log('🌐 Calling API:', `${API_BASE_URL}/patients/available-doctors`);
      
      
      const response = await fetch(`${API_BASE_URL}/patients/available-doctors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        
      });

      
      // console.log('📡 Response status:', response.status);
      
      // Log the response text to see the exact error
  

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AvailableDoctor[]> = await response.json();
      // console.log('📄 API Response data:', result);
      
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
  // Add these methods inside the PatientApiService class (after getHealthMetrics method)

  async uploadProfileImage(patientId: number, imageFile: File): Promise<{ success: boolean; profileImagePath: string }> {
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);

      const token = localStorage.getItem('PatientToken');
      
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/upload-profile`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
          // Don't set Content-Type for FormData - browser will set it automatically with boundary
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: result.success,
        profileImagePath: result.profileImagePath
      };
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  async getProfileImage(patientId: number): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/profile-image`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No profile image found
        }
        throw new Error('Failed to fetch profile image');
      }

      const result = await response.json();
      
      if (result.success && result.profileImagePath) {
        // Return full URL to the image
        return `http://localhost:5000${result.profileImagePath}`;
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile image:', error);
      return null;
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