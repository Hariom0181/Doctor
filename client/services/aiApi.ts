const API_BASE_URL = 'http://localhost:5000/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface RiskScoreData {
  riskScore: number;
  riskLevel: 'Normal' | 'Moderate' | 'Critical';
  keyFactors: string[];
  recommendations: string[];
}

class AIApiService {
  private getPatientAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('PatientToken');
    if (!token) {
      throw new Error('Patient not authenticated. Please login.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  private getDoctorAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('DoctorToken');
    if (!token) {
      throw new Error('Doctor not authenticated. Please login.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  // Test AI connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/test`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }

  // Feature 1: Medical Chatbot
  async sendChatMessage(message: string): Promise<string> {
    try {
      console.log('🤖 Sending message to AI:', message);

      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: this.getPatientAuthHeaders(),
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
      }

      const result = await response.json();
      console.log('✅ AI response received');
      return result.response;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  // Feature 2: Analyze Medical Report
  async analyzeReport(reportData: string): Promise<string> {
    try {
      console.log('📊 Analyzing medical report...');

      const response = await fetch(`${API_BASE_URL}/ai/analyze-report`, {
        method: 'POST',
        headers: this.getPatientAuthHeaders(),
        body: JSON.stringify({ reportData })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze report');
      }

      const result = await response.json();
      console.log('✅ Report analysis complete');
      return result.analysis;
    } catch (error) {
      console.error('Report analysis error:', error);
      throw error;
    }
  }

  // Feature 3: Calculate Risk Score
  async calculateRiskScore(patientId: number): Promise<RiskScoreData> {
    try {
      console.log('🎯 Calculating risk score for patient:', patientId);

      const response = await fetch(`${API_BASE_URL}/ai/risk-score/${patientId}`, {
        method: 'POST',
        headers: this.getDoctorAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate risk score');
      }

      const result = await response.json();
      console.log('✅ Risk score calculated:', result.data);
      return result.data;
    } catch (error) {
      console.error('Risk score error:', error);
      throw error;
    }
  }

  // Feature 4: Generate Medical Insights
  async generateMedicalInsights(patientId: number): Promise<string> {
    try {
      console.log('💡 Generating medical insights for patient:', patientId);

      const response = await fetch(`${API_BASE_URL}/ai/medical-insights/${patientId}`, {
        method: 'POST',
        headers: this.getDoctorAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate insights');
      }

      const result = await response.json();
      console.log('✅ Medical insights generated');
      return result.insights;
    } catch (error) {
      console.error('Medical insights error:', error);
      throw error;
    }
  }
}

export const aiApiService = new AIApiService();
export default aiApiService;