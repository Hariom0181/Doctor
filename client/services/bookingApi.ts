const API_BASE_URL = 'http://localhost:5000/api';
// import { getAuthToken } from 'src/utils/auth';

export interface VideoConsultation {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  consultation_fee: number | string;
  status: 'pending_approval' | 'approved' | 'confirmed' | 'rejected' | 'in_progress' | 'completed' | 'cancelled_by_patient' | 'cancelled_by_doctor' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded' | 'partial_refund';
  doctor_name?: string;
  doctor_specialization?: string;
  current_hospital?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  patient_blood_group?: string;
  patient_allergies?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  created_at: string;
}

export interface BookingRequest {
  doctorId: number;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  consultationFee: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}

class BookingApiService {
  private getPatientAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Patient not authenticated. Please login.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }
  private getDoctorAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Doctor not authenticated. Please login.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

  }

  // ==================== PATIENT METHODS ====================

  async bookConsultation(bookingData: BookingRequest): Promise<any> {
    try {
      console.log('📝 Booking consultation:', bookingData);
      const response = await fetch(`${API_BASE_URL}/bookings/book`, {
        method: 'POST',
        headers: this.getPatientAuthHeaders(),
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to book consultation');
      }

      const result = await response.json();
      console.log('✅ Booking successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Error booking consultation:', error);
      throw error;
    }
  }

  async getPatientConsultations(patientId: number): Promise<VideoConsultation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/patient/${patientId}`, {
        method: 'GET',
        headers: this.getPatientAuthHeaders() 
      });

      if (!response.ok) {
        throw new Error('Failed to fetch consultations');
      }

      const result: ApiResponse<VideoConsultation[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  }

  async cancelConsultation(consultationId: number): Promise<any> {
    try {
      console.log('❌ Cancelling consultation:', consultationId);
      const response = await fetch(`${API_BASE_URL}/bookings/${consultationId}/cancel`, {
        method: 'DELETE',
        headers: this.getPatientAuthHeaders() 

      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel consultation');
      }

      const result = await response.json();
      console.log('✅ Cancellation successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Error cancelling consultation:', error);
      throw error;
    }
  }

  // ==================== DOCTOR METHODS ====================

  async getDoctorPendingRequests(doctorId: number): Promise<VideoConsultation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/doctor/${doctorId}/pending-requests`, {
        method: 'GET',
        headers: this.getDoctorAuthHeaders() 
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }

      const result: ApiResponse<VideoConsultation[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  }

  async getDoctorConsultations(doctorId: number, status?: string): Promise<VideoConsultation[]> {
    try {
      let url = `${API_BASE_URL}/bookings/doctor/${doctorId}/consultations`;
      if (status) {
        url += `?status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getDoctorAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch consultations');
      }

      const result: ApiResponse<VideoConsultation[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  }

  async approveConsultation(consultationId: number): Promise<any> {
    try {
      console.log('✅ Approving consultation:', consultationId);
      const response = await fetch(`${API_BASE_URL}/bookings/${consultationId}/approve`, {
        method: 'POST',
        headers: this.getDoctorAuthHeaders() 
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve consultation');
      }

      const result = await response.json();
      console.log('✅ Approval successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Error approving consultation:', error);
      throw error;
    }
  }

  async rejectConsultation(consultationId: number, reason?: string): Promise<any> {
    try {
      console.log('❌ Rejecting consultation:', consultationId);
      const response = await fetch(`${API_BASE_URL}/bookings/${consultationId}/reject`, {
        method: 'POST',
        headers: this.getDoctorAuthHeaders() ,
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject consultation');
      }

      const result = await response.json();
      console.log('✅ Rejection successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Error rejecting consultation:', error);
      throw error;
    }
  }
}

export const bookingApiService = new BookingApiService();
export default bookingApiService;