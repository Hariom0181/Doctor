const API_BASE_URL = 'http://localhost:5000/api';
// import { getAuthToken } from 'src/utils/auth';

export interface LinkedPatient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  linkedDate: string;
  relationshipStatus: string;
  relationshipNotes?: string;
}

export interface MedicalRecord {
  id?: number;
  patientId: string;
  doctorId?: number;
  doctorName?: string;
  doctorSpecialization?: string;
  examinationType: string;
  diagnosis: string;
  prescription?: string;
  nextCheckupDate?: string;
  additionalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}


export interface AddMedicalRecordRequest {
  patientId: string;
  type: string;
  diagnosis: string;
  prescription?: string;
  nextCheckup?: string;
  notes?: string;
}


export interface DoctorProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  licenseNumber: string;
  currentHospital: string;
  consultationFee: number;
  experienceYears?: number;
  education?: string;
  certifications?: string;
  bio?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  doctor: DoctorProfile;
}



class DoctorApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('DoctorToken'); // ONLY doctor token
    if (!token) {
      throw new Error('Doctor not authenticated. Please login.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async 

  /**
   * Doctor Authentication
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Doctor login attempt:', credentials.email);
      
      const response = await fetch(`${API_BASE_URL}/doctors/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      console.log('📡 Login response status:', response.status);

      const result: LoginResponse = await response.json();
      console.log('📄 Login result:', result);

      if (result.success && result.token) {
        // Store JWT token and doctor data
        localStorage.setItem('DoctorToken', result.token); //-----------------------------------------------------------------------------------------
        localStorage.setItem('doctorData', JSON.stringify(result.doctor));//-----------------------------------------------------------------------------------------
        console.log('✅ Doctor login successful, token stored');
      }

      return result;
    } catch (error) {
      console.error('❌ Error during doctor login:', error);
      throw error;
    }
  }
  async uploadDoctorProfileImage(doctorId: number, imageFile: File): Promise<{ success: boolean; profileImagePath: string }> {
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);
  
      const token = localStorage.getItem('DoctorToken'); //-----------------------------------------------------------------------------------------
      
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/upload-profile`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
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

  
  async getTodayAppointments(doctorId: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}/today`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch today\'s appointments');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  async getPendingAppointments(doctorId: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}/pending`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending appointments');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
      throw error;
    }
  }

  async getAllDoctorAppointments(doctorId: number, status?: string, date?: string): Promise<any[]> {
    try {
      let url = `${API_BASE_URL}/appointments/doctor/${doctorId}/all`;
      const params = new URLSearchParams();
      
      if (status) params.append('status', status);
      if (date) params.append('date', date);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  async confirmAppointment(appointmentId: number, doctorNotes?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/confirm`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ doctorNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm appointment');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  }

  async rejectAppointment(appointmentId: number, cancellationReason: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/reject`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ cancellationReason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject appointment');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      throw error;
    }
  }

  async completeAppointment(appointmentId: number, doctorNotes?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/complete`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ doctorNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to complete appointment');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  async getRecentActivities(doctorId: number, limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/doctors/${doctorId}/recent-activities?limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  async getPatientsWithRiskAssessment(doctorId: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/doctors/${doctorId}/patients/risk-assessment`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patient risk data');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching patient risk:', error);
      throw error;
    }
  }
  
  async getDoctorProfileImage(doctorId: number): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/profile-image`);
  
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch profile image');
      }
  
      const result = await response.json();
      
      if (result.success && result.profileImagePath) {
        return result.profileImagePath; // ✅ Return directly (already Cloudinary URL)
      }
  
      return null;
    } catch (error) {
      console.error('Error fetching profile image:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      localStorage.removeItem('DoctorToken');//-----------------------------------------------------------------------------------------
      localStorage.removeItem('doctorData');//-----------------------------------------------------------------------------------------
      console.log('✅ Doctor logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  }

  /**
   * Get current doctor profile
   */
  async getProfile(): Promise<DoctorProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<DoctorProfile> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error fetching doctor profile:', error);
      throw error;
    }
  }
  async getRecordsCount(): Promise<number> {
    try {
      console.log('📊 Fetching records count from API...');
      
      const response = await fetch(`${API_BASE_URL}/doctors/medical-records/count`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result: ApiResponse<{ count: number }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
  
      return result.data.count;
    } catch (error) {
      console.error('❌ Error fetching records count:', error);
      throw error;
    }
  }

  /**
   * Get linked patients for the current doctor
   */
  async getLinkedPatients(): Promise<LinkedPatient[]> {
    try {
      console.log('🏥 Fetching linked patients...');
      
      const response = await fetch(`${API_BASE_URL}/doctors/linked-patients`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('📡 Get linked patients response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Backend service not available. Please start the server.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<LinkedPatient[]> = await response.json();
      console.log('📄 Linked patients result:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error fetching linked patients:', error);
      throw error;
    }
  }

  /**
   * Medical Records Management
   */
  async addMedicalRecord(recordData: AddMedicalRecordRequest): Promise<MedicalRecord> {
    try {
      console.log('🏥 Adding medical record:', recordData);
      
      const response = await fetch(`${API_BASE_URL}/doctors/medical-records`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recordData)
      });

      console.log('📡 Add medical record response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Add medical record error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<MedicalRecord> = await response.json();
      console.log('📄 Add medical record result:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error adding medical record:', error);
      throw error;
    }
  }

  /**
   * Get medical records for a specific patient
   */
  async getPatientMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    try {
      console.log('🏥 Fetching medical records for patient:', patientId);
      
      const response = await fetch(`${API_BASE_URL}/doctors/patients/${patientId}/medical-records`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('📡 Get patient medical records response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<MedicalRecord[]> = await response.json();
      console.log('📄 Patient medical records result:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error fetching patient medical records:', error);
      throw error;
    }
  }

  /**
   * Get all medical records created by the current doctor
   */
  async getMyMedicalRecords(): Promise<MedicalRecord[]> {
    try {
      console.log('🏥 Fetching my medical records');
      
      const response = await fetch(`${API_BASE_URL}/doctors/my-medical-records`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('📡 Get my medical records response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<MedicalRecord[]> = await response.json();
      console.log('📄 My medical records result:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error fetching my medical records:', error);
      throw error;
    }
  }

  /**
   * Update medical record
   */
  async updateMedicalRecordx(recordId: number, recordData: Partial<AddMedicalRecordRequest>): Promise<MedicalRecord> {
    try {
      console.log('🏥 Updating medical record:', recordId, recordData);
      
      const response = await fetch(`${API_BASE_URL}/doctors/medical-records/${recordId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recordData)
      });

      console.log('📡 Update medical record response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Update medical record error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<MedicalRecord> = await response.json();
      console.log('📄 Update medical record result:', result);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error updating medical record:', error);
      throw error;
    }
  }

  /**
   * Delete medical record
   */
  async deleteMedicalRecord(recordId: number): Promise<void> {
    try {
      console.log('🗑️ Deleting medical record:', recordId);
      
      const response = await fetch(`${API_BASE_URL}/doctors/medical-records/${recordId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      console.log('📡 Delete medical record response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Delete medical record error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<null> = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('✅ Medical record deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting medical record:', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */
  
  // Check if doctor is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('DoctorToken');//-----------------------------------------------------------------------------------------
    return !!token;
  }

  // Get stored doctor data
  getStoredDoctorData(): DoctorProfile | null {
    try {
      const doctorData = localStorage.getItem('doctorData');//-----------------------------------------------------------------------------------------
      return doctorData ? JSON.parse(doctorData) : null;
    } catch (error) {
      console.error('Error parsing stored doctor data:', error);
      return null;
    }
  }

  // Get current doctor ID
  getCurrentDoctorId(): number | null {
    const doctorData = this.getStoredDoctorData();
    return doctorData?.id || null;
  }
  async prescribeMedication(prescriptionData: {
    patientId: number;
    doctorId: number;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    startDate: string;
    endDate?: string;
  }): Promise<{ success: boolean; prescriptionId: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(prescriptionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create prescription');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: result.success,
        prescriptionId: result.prescriptionId
      };
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }
  // Update medical record
  async updateMedicalRecord(
    recordId: number,
    recordData: {
      examinationType: string;
      diagnosis: string;
      prescription?: string;
      nextCheckupDate?: string;
      additionalNotes?: string;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/medical-records/${recordId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recordData)
      });
  
      if (!response.ok) {
        throw new Error('Failed to update medical record');
      }
  
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  }
  
  // Get single medical record
  async getMedicalRecord(recordId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/medical-records/${recordId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch medical record');
      }
  
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching medical record:', error);
      throw error;
    }
  }
  async getDoctorPrescriptions(doctorId: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/doctor/${doctorId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  async updatePrescriptionStatus(prescriptionId: number, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/${prescriptionId}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update prescription');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  }

  async getPatientPrescriptions(patientId: number, doctorId: number): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/prescriptions/patient/${patientId}/doctor/${doctorId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patient prescriptions');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      throw error;
    }
  }




}

export const doctorApiService = new DoctorApiService();
export default doctorApiService;