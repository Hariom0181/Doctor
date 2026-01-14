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
    // This matches your auth.ts precisely
    const token = localStorage.getItem('doctorToken'); 
    
    if (!token) {
      console.error("Auth Error: doctorToken not found in localStorage");
      throw new Error('Doctor not authenticated. Please login again.');
    }

    // Optional: Clean up potential extra quotes if stored via JSON.stringify
    const cleanToken = token.startsWith('"') ? JSON.parse(token) : token;

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanToken}`
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
  async analyzeReport(reportData: string, language: string = 'english'): Promise<string> {
    try {
      console.log('📊 Analyzing medical report...');
  
      const response = await fetch(`${API_BASE_URL}/ai/analyze-report`, {
        method: 'POST',
        headers: this.getPatientAuthHeaders(),
        body: JSON.stringify({ reportData, language })
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
  // Calculate and save risk score
  async calculateAndSaveRiskScore(patientId: number): Promise<RiskScoreData> {
    try {
      console.log('🎯 Calculating and saving risk score for patient:', patientId);

      const response = await fetch(`${API_BASE_URL}/ai/risk-score-save/${patientId}`, {
        method: 'POST',
        headers: this.getPatientAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate risk score');
      }

      const result = await response.json();
      console.log('✅ Risk score saved');
      return result.data;
    } catch (error) {
      console.error('Risk score error:', error);
      throw error;
    }
  }

  // Generate and save medical insights
  async generateAndSaveMedicalInsights(patientId: number): Promise<string> {
    try {
      console.log('💡 Generating and saving medical insights for patient:', patientId);

      const response = await fetch(`${API_BASE_URL}/ai/medical-insights-save/${patientId}`, {
        method: 'POST',
        headers: this.getDoctorAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate insights');
      }

      const result = await response.json();
      console.log('✅ Medical insights saved');
      return result.insights;
    } catch (error) {
      console.error('Medical insights error:', error);
      throw error;
    }
  }

  // Get critical patients
  async getCriticalPatients(doctorId: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/critical-patients/${doctorId}`, {
        headers: this.getDoctorAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch critical patients');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Critical patients error:', error);
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
  // Extract text from uploaded document
  async extractTextFromDocument(documentId: number): Promise<string> {
    try {
      console.log('📄 Extracting text from document:', documentId);

      const response = await fetch(`${API_BASE_URL}/documents/extract-text/${documentId}`, {
        method: 'POST',
        headers: this.getPatientAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to extract text');
      }

      const result = await response.json();
      console.log('✅ Text extracted successfully');
      return result.extractedText;
    } catch (error) {
      console.error('Text extraction error:', error);
      throw error;
    }
  }

  // Get patient documents
  async getPatientDocuments(patientId: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/patient/${patientId}`, {
        headers: this.getPatientAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Fetch documents error:', error);
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