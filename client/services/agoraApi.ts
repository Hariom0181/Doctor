const API_BASE_URL = 'http://localhost:5000/api';

export interface AgoraCredentials {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
}

export interface AgoraTokenResponse {
  success: boolean;
  data: AgoraCredentials;
  message?: string;
}

class AgoraApiService {
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

  async generateToken(consultationId: number, userId: number, role: 'doctor' | 'patient'): Promise<AgoraCredentials> {
    try {
      console.log('🎥 Generating Agora token for consultation:', consultationId);

      const headers = role === 'doctor' ? this.getDoctorAuthHeaders() : this.getPatientAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/agora/generate-token/${consultationId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate token');
      }

      const result: AgoraTokenResponse = await response.json();
      console.log('✅ Agora token generated:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error generating Agora token:', error);
      throw error;
    }
  }

  async startConsultation(consultationId: number): Promise<any> {
    try {
      console.log('▶️ Starting consultation:', consultationId);

      const response = await fetch(`${API_BASE_URL}/agora/start/${consultationId}`, {
        method: 'POST',
        headers: this.getDoctorAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start consultation');
      }

      const result = await response.json();
      console.log('✅ Consultation started:', result);
      return result;
    } catch (error) {
      console.error('❌ Error starting consultation:', error);
      throw error;
    }
  }

  async endConsultation(consultationId: number): Promise<any> {
    try {
      console.log('⏹️ Ending consultation:', consultationId);

      const response = await fetch(`${API_BASE_URL}/agora/end/${consultationId}`, {
        method: 'POST',
        headers: this.getDoctorAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to end consultation');
      }

      const result = await response.json();
      console.log('✅ Consultation ended:', result);
      return result;
    } catch (error) {
      console.error('❌ Error ending consultation:', error);
      throw error;
    }
  }
}

export const agoraApiService = new AgoraApiService();
export default agoraApiService;