import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, History } from 'lucide-react';
import { walletApiService, type WalletTransaction } from '@/services/walletApi';
import { useToast } from '@/hooks/use-toast';

interface WalletCardProps {
  patientId: number;
}

export function WalletCard({ patientId }: WalletCardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const { toast } = useToast();

  // Predefined amounts
  const quickAmounts = [500, 1000, 2000, 5000];

  useEffect(() => {
    loadBalance();
  }, [patientId]);

  const loadBalance = async () => {
    try {
      setLoadingBalance(true);
      const bal = await walletApiService.getBalance(patientId);
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet balance",
        variant: "destructive"
      });
    } finally {
      setLoadingBalance(false);
    }
  };
  const isToday = (dateStr: string) => {
    const txnDate = new Date(dateStr);
    const today = new Date();
  
    return (
      txnDate.getFullYear() === today.getFullYear() &&
      txnDate.getMonth() === today.getMonth() &&
      txnDate.getDate() === today.getDate()
    );
  };
  const todaysTransactions = transactions.filter(txn =>
    isToday(txn.created_at)
  );
    
  const loadTransactions = async () => {
    try {
      const txns = await walletApiService.getTransactions(patientId, 20);
      const normalizedTxns = txns.map((txn) => ({
        ...txn,
        amount: Number(txn.amount),
        balance_after: Number(txn.balance_after),
      }));
      setTransactions(normalizedTxns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    }
  };

  const handleAddMoney = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (amountNum > 50000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum ₹50,000 can be added at once",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const result = await walletApiService.addMoney(patientId, amountNum);
      
      toast({
        title: "Success!",
        description: `₹${result.amount} added to wallet`,
      });

      setBalance(parseFloat(result.newBalance));
      setAmount('');
      setIsAddMoneyOpen(false);
      
      // Reload transactions if the dialog is open
      if (isTransactionsOpen) {
        loadTransactions();
      }
    } catch (error) {
      console.error('Error adding money:', error);
      toast({
        title: "Error",
        description: "Failed to add money to wallet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactions = async () => {
    setIsTransactionsOpen(true);
    await loadTransactions();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add_money':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'debit':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'refund':
      case 'partial_refund':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'add_money':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      case 'refund':
      case 'partial_refund':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet
              </CardTitle>
              <CardDescription>Money makes all </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewTransactions}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Balance Display */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-1">Available Balance</p>
              {loadingBalance ? (
                <div className="h-10 flex items-center">
                  <div className="animate-pulse text-3xl font-bold">Loading...</div>
                </div>
              ) : (
                <h2 className="text-4xl font-bold">₹{balance.toFixed(2)}</h2>
              )}
              <Button
                className="mt-4 bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => setIsAddMoneyOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Money
              </Button>
            </div>

            {/* Recent Transactions Preview */}
            {transactions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                {todaysTransactions.slice(0, 2).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(txn.transaction_type)}
                        <div>
                          <p className="text-sm font-medium">{txn.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${getTransactionColor(txn.transaction_type)}`}>
                        {txn.transaction_type === 'debit' ? '-' : '+'}₹{txn.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Money Dialog */}
      <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
            <DialogDescription>
              Add money to your wallet for video consultations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Amount Buttons */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quick Add</label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                    className={amount === quickAmount.toString() ? 'border-blue-600 bg-blue-50' : ''}
                  >
                    ₹{quickAmount}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Or Enter Custom Amount</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max="50000"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum ₹1, Maximum ₹50,000</p>
            </div>

            {/* Payment Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> This is a simulated payment. No real money will be charged.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddMoneyOpen(false);
                  setAmount('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMoney}
                disabled={loading || !amount}
              >
                {loading ? 'Processing...' : `Add ₹${amount || '0'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              View all your wallet transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No transactions yet</p>
              </div>
            ) : (
              transactions.map((txn) => (
                <div key={txn.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTransactionIcon(txn.transaction_type)}
                      <div>
                        <p className="font-medium">{txn.description}</p>
                        {txn.doctor_name && (
                          <p className="text-sm text-gray-600">Dr. {txn.doctor_name}</p>
                        )}
                        {txn.scheduled_date && (
                          <p className="text-xs text-gray-500">
                            {new Date(txn.scheduled_date).toLocaleDateString()} at {txn.scheduled_time}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {formatTransactionType(txn.transaction_type)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(txn.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Transaction ID: {txn.transaction_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(txn.transaction_type)}`}>
                        {txn.transaction_type === 'debit' ? '-' : '+'}₹{txn.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Balance: ₹{txn.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}