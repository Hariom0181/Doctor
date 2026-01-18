const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  constructor() {
    // Fix: Use correct model name - gemini-1.5-flash or gemini-pro
    this.model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.7,
        topP: 1,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
  }

  // Feature 1: Medical Chatbot
  async chatResponse(userMessage, conversationHistory = []) {
    try {
      const systemPrompt = `You are a helpful medical assistant chatbot for a health monitoring system. 
Your role is to:
- Provide general health information and guidance
- Explain medical terms in simple language
- Suggest when to consult a doctor
- Answer questions about symptoms (without diagnosing)

IMPORTANT RULES:
- NEVER diagnose diseases
- ALWAYS recommend consulting a doctor for specific medical advice
- Be empathetic and supportive
- Use simple, clear language
- If unsure, say so and suggest professional consultation

User's question: ${userMessage}`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Chatbot Error:', error);
      throw new Error('Failed to get AI response: ' + error.message);
    }
  }

  // Feature 2: Analyze Lab Reports (FIXED)
  async analyzeMedicalReport(reportData, language = 'english') {
    try {
      // Validate input
      if (!reportData || typeof reportData !== 'string') {
        throw new Error('Invalid report data provided');
      }

      const languageInstructions = {
        hindi: 'Respond in Hindi (हिंदी में जवाब दें)',
        marathi: 'Respond in Marathi (मराठीत उत्तर द्या)',
        gujarati: 'Respond in Gujarati (ગુજરાતીમાં જવાબ આપો)',
        tamil: 'Respond in Tamil (தமிழில் பதிலளிக்கவும்)',
        telugu: 'Respond in Telugu (తెలుగులో సమాధానం ఇవ్వండి)',
        english: 'Respond in English'
      };

      const prompt = `${languageInstructions[language] || languageInstructions.english}
  
  Analyze this medical/lab report and provide insights:
  
  ${reportData}
  
  Please provide:
  1. **High Values**: List any abnormally high values and what they might indicate
  2. **Low Values**: List any abnormally low values and what they might indicate
  3. **Dietary Suggestions**: Recommend foods to eat or avoid based on the results
  4. **Lifestyle Recommendations**: Suggest lifestyle changes
  5. **When to Consult Doctor**: Indicate if immediate medical attention is needed
  
  Format your response clearly with headings and bullet points.
  IMPORTANT: This is general guidance only, not a medical diagnosis.`;

      console.log('📊 Analyzing report with Gemini AI in', language);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Report analysis successful');
      return text;
    } catch (error) {
      console.error('Report Analysis Error:', error);

      // Provide more specific error messages
      if (error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please check API key.');
      } else if (error.message.includes('quota')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      } else {
        throw new Error('Failed to analyze report: ' + error.message);
      }
    }
  }

  // Feature 3: Calculate Health Risk Score
  async calculateRiskScore(patientData) {
    try {
      // Validate input
      if (!patientData || typeof patientData !== 'object') {
        throw new Error('Invalid patient data provided');
      }

      const prompt = `Analyze this patient's medical data and calculate a health risk score from 0-100:

Patient Information:
- Age: ${patientData.age || 'Unknown'}
- Medical History: ${patientData.medicalHistory || 'None'}
- Allergies: ${patientData.allergies || 'None'}
- Recent Diagnoses: ${JSON.stringify(patientData.recentDiagnoses || [])}
- Vital Signs: ${JSON.stringify(patientData.vitalSigns || {})}
- Number of visits (last 3 months): ${patientData.visitCount || 0}

Provide a JSON response with this exact structure:
{
  "riskScore": <number 0-100>,
  "riskLevel": "<Normal|Moderate|Critical>",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Risk Level Guidelines:
- Normal: 0-30 (healthy, routine checkups)
- Moderate: 31-70 (needs monitoring, lifestyle changes recommended)
- Critical: 71-100 (requires immediate attention, high-risk conditions)

Consider factors:
- Age (elderly = higher risk)
- Chronic conditions
- Recent critical diagnoses
- Frequency of medical visits
- Abnormal vital signs`;

      console.log('🎯 Calculating risk score...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response (handle markdown code blocks)
      let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        jsonMatch = text.match(/\{[\s\S]*\}/);
      } else {
        jsonMatch[0] = jsonMatch[1];
      }

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Risk score calculated:', parsed);
        return parsed;
      }

      throw new Error('Invalid AI response format');
    } catch (error) {
      console.error('Risk Score Calculation Error:', error);
      throw new Error('Failed to calculate risk score: ' + error.message);
    }
  }

  // Feature 4: Medical Record Insights
  async generateMedicalInsights(medicalRecords) {
    try {
      // Validate input
      if (!Array.isArray(medicalRecords) || medicalRecords.length === 0) {
        throw new Error('No medical records provided');
      }

      const recordsText = medicalRecords.map(record => `
Date: ${record.date || 'Unknown'}
Type: ${record.examinationType || 'General'}
Doctor: ${record.doctorName || 'Unknown'}
Diagnosis: ${record.diagnosis || 'None'}
Prescription: ${record.prescription || 'None'}
      `).join('\n---\n');

      const prompt = `Analyze these medical records and provide comprehensive insights:

${recordsText}

Provide a detailed summary including:
1. **Overall Health Status**: Brief overview of patient's health trajectory
2. **Recurring Issues**: Any patterns or recurring health problems
3. **Treatment Effectiveness**: Are treatments showing improvement?
4. **Risk Factors**: Identified health risks based on history
5. **Key Recommendations**: Top 3-5 actionable recommendations for the doctor
6. **Follow-up Priority**: Should this patient be prioritized for follow-up? (Low/Medium/High)

Use clear medical language but keep it concise and actionable.`;

      console.log('💡 Generating medical insights...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Medical insights generated');
      return text;
    } catch (error) {
      console.error('Medical Insights Error:', error);
      throw new Error('Failed to generate insights: ' + error.message);
    }
  }

  // Validate API key
  async testConnection() {
    try {
      console.log('🔌 Testing AI connection...');
      const result = await this.model.generateContent("Say 'API connection successful'");
      const response = await result.response;
      const isSuccessful = response.text().toLowerCase().includes('successful');
      console.log(isSuccessful ? '✅ AI connected' : '❌ AI connection failed');
      return isSuccessful;
    } catch (error) {
      console.error('AI Connection Test Failed:', error);
      return false;
    }
  }
}

module.exports = new AIService();