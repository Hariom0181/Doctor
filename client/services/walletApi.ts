const API_BASE_URL = 'http://localhost:5000/api';

export interface WalletTransaction {
  id: number;
  patient_id: number;
  transaction_type: 'add_money' | 'debit' | 'refund' | 'partial_refund';
  amount: number;
  balance_after: number;
  description: string;
  consultation_id?: number;
  transaction_id: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  doctor_name?: string;
  scheduled_date?: string;
  scheduled_time?: string;
}

export interface WalletBalance {
  success: boolean;
  balance: string;
}

export interface AddMoneyResponse {
  success: boolean;
  message: string;
  transactionId: string;
  amount: string;
  newBalance: string;
}

class WalletApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('PatientToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getBalance(patientId: number): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/balance/${patientId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet balance');
      }

      const result: WalletBalance = await response.json();
      return parseFloat(result.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }

  async getTransactions(patientId: number, limit: number = 10, offset: number = 0): Promise<WalletTransaction[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/wallet/transactions/${patientId}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async addMoney(patientId: number, amount: number): Promise<AddMoneyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/add-money`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ patientId, amount })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add money');
      }

      const result: AddMoneyResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error adding money:', error);
      throw error;
    }
  }
}

export const walletApiService = new WalletApiService();
export default walletApiService;