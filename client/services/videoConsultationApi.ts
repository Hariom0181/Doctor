const API_BASE_URL = 'http://localhost:5000/api';
// import { getAuthToken } from 'src/utils/auth';


export interface DoctorAvailability {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_available: boolean;
}

export interface ConsultationFee {
  id: number;
  doctor_id: number;
  duration_minutes: number;
  fee: number;
  is_active: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  success: boolean;
  data: TimeSlot[];
  slotDuration: number;
  message?: string;
}

class VideoConsultationApiService {
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

  // Get doctor's availability
  async getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/video-consultations/doctor/availability/${doctorId}`,// doctorId = 4
        {
          method: 'GET',
          headers: this.getDoctorAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }

  // Get doctor's consultation fees
  async getDoctorConsultationFees(doctorId: number): Promise<ConsultationFee[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/video-consultations/doctor/consultation-fees`,
        {
          method: 'GET',
          headers: this.getDoctorAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch consultation fees');
      }

      const result = await response.json();
      return result.data.map((f: any) => ({
        ...f,
        fee: Number(f.fee),
        
      }));
    } catch (error) {
      console.error('Error fetching fees:', error);
      throw error;
    }
  }

  // Get available time slots for a doctor on a specific date
  async getAvailableSlots(doctorId: number, date: string): Promise<AvailableSlotsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/video-consultations/doctor/${doctorId}/available-slots?date=${date}`,
        {
          method: 'GET',
          headers: this.getPatientAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching slots:', error);
      throw error;
    }
  }

  // Set doctor availability
  async setDoctorAvailability(availability: any[]): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/video-consultations/doctor/availability`,
        {
          method: 'POST',
          headers: this.getDoctorAuthHeaders(),
          body: JSON.stringify({ availability })
        }
      );
      console.log("coming from parents",availability);

      if (!response.ok) {
        throw new Error('Failed to set availability');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  }

  // Set consultation fees
  async setConsultationFees(fees: any[]): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/video-consultations/doctor/consultation-fees`,
        {
          method: 'POST',
          headers: this.getDoctorAuthHeaders(),
          body: JSON.stringify({ fees })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to set consultation fees');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error setting fees:', error);
      throw error;
    }
  }
}

export const videoConsultationApiService = new VideoConsultationApiService();
export default videoConsultationApiService;