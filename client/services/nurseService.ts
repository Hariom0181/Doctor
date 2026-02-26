const API_BASE_URL = 'http://localhost:5000/api';

export interface NurseRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  licenseNumber: string;
  currentHospital: string;
  password: string;
  confirmPassword: string;
}

export interface NurseRegisterResponse {
  success: boolean;
  message: string;
  nurseId: number;
  verificationStatus: string;
}

class NurseApiService {
  async register(data: NurseRegisterRequest): Promise<NurseRegisterResponse> {
    try {
      console.log('🔐 Nurse registration attempt:', data.email);

      const response = await fetch(`${API_BASE_URL}/nurses/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      console.log('📡 Register response status:', response.status);

      const result: NurseRegisterResponse = await response.json();
      console.log('📄 Register result:', result);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ Error during nurse registration:', error);
      throw error;
    }
  }
}

export const nurseApiService = new NurseApiService();
export default nurseApiService;