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
      {/* ── Main Wallet Card ── */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-6">
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500/50 via-green-400/30 to-transparent" />
  
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                  Wallet
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Manage your balance for consultations
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all h-9 px-4"
              onClick={handleViewTransactions}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </CardHeader>
  
        <CardContent className="px-6 pb-6 space-y-4">
  
          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6 text-white">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
  
            <div className="relative z-10">
              <p className="text-xs font-black text-white/70 uppercase tracking-widest mb-2">
                Available Balance
              </p>
              {loadingBalance ? (
                <div className="h-10 flex items-center mb-4">
                  <div className="animate-pulse text-3xl font-black text-white/60">
                    Loading...
                  </div>
                </div>
              ) : (
                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                  ₹{balance.toFixed(2)}
                </h2>
              )}
              <Button
                className="bg-white text-emerald-700 hover:bg-white/90 font-bold rounded-xl h-10 px-5 shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-all"
                onClick={() => setIsAddMoneyOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Money
              </Button>
            </div>
          </div>
  
          {/* Recent Activity */}
          {transactions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Today's Activity
              </p>
              {todaysTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">
                  No transactions today
                </p>
              ) : (
                <div className="space-y-2">
                  {todaysTransactions.slice(0, 2).map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          txn.transaction_type === 'add_money' ? 'bg-green-50 border border-green-100' :
                          txn.transaction_type === 'debit'    ? 'bg-red-50 border border-red-100' :
                          'bg-blue-50 border border-blue-100'
                        }`}>
                          {getTransactionIcon(txn.transaction_type)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 leading-tight">
                            {txn.description}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-black ${getTransactionColor(txn.transaction_type)}`}>
                        {txn.transaction_type === 'debit' ? '-' : '+'}₹{txn.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
  
        </CardContent>
      </Card>
  
      {/* ── Add Money Dialog ── */}
      <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
  
          {/* Header */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full mb-3 w-fit">
                <Wallet className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white/90 tracking-wider uppercase">Wallet</span>
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">
                Add Money
              </DialogTitle>
              <DialogDescription className="text-green-100/90 text-sm mt-1 font-medium">
                Top up your wallet for video consultations
              </DialogDescription>
            </div>
          </div>
  
          <div className="p-8 space-y-5 bg-white">
  
            {/* Quick Amounts */}
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Quick Add
              </p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`h-12 rounded-xl text-sm font-black border transition-all hover:-translate-y-0.5 ${
                      amount === quickAmount.toString()
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    ₹{quickAmount}
                  </button>
                ))}
              </div>
            </div>
  
            {/* Custom Amount */}
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Custom Amount
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max="50000"
                  className="h-12 pl-8 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Minimum ₹1 · Maximum ₹50,000
              </p>
            </div>
  
            {/* Demo Note */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-amber-600 text-xs font-black">!</span>
              </div>
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-0.5">
                  Demo Mode
                </p>
                <p className="text-xs text-amber-700 font-medium">
                  This is a simulated payment. No real money will be charged.
                </p>
              </div>
            </div>
  
            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                className="flex-1 h-12 rounded-2xl font-black text-sm shadow-md shadow-emerald-200 hover:-translate-y-0.5 transition-all bg-emerald-500 hover:bg-emerald-600"
                onClick={handleAddMoney}
                disabled={loading || !amount}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />Processing...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" />Add ₹{amount || '0'}</>
                )}
              </Button>
              <Button
                variant="outline"
                className="px-6 h-12 rounded-2xl font-bold border-slate-200 text-slate-500 hover:bg-slate-50"
                onClick={() => { setIsAddMoneyOpen(false); setAmount(''); }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
  
          </div>
        </DialogContent>
      </Dialog>
  
      {/* ── Transaction History Dialog ── */}
      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0">
  
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full mb-3 w-fit">
                <History className="w-3 h-3 text-white/70" />
                <span className="text-xs font-bold text-white/70 tracking-wider uppercase">Wallet</span>
              </div>
              <DialogTitle className="text-2xl font-black text-white tracking-tight">
                Transaction History
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm mt-1 font-medium">
                All your wallet transactions
              </DialogDescription>
            </div>
          </div>
  
          <div className="p-6 space-y-3 bg-white">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <History className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-bold text-slate-500">No transactions yet</p>
                <p className="text-xs text-slate-400 mt-1">Your transactions will appear here</p>
              </div>
            ) : (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="group border border-slate-200/80 rounded-2xl p-4 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        txn.transaction_type === 'add_money'                           ? 'bg-green-50 border border-green-100' :
                        txn.transaction_type === 'debit'                               ? 'bg-red-50 border border-red-100' :
                        txn.transaction_type === 'refund' || txn.transaction_type === 'partial_refund' ? 'bg-blue-50 border border-blue-100' :
                        'bg-slate-50 border border-slate-100'
                      }`}>
                        {getTransactionIcon(txn.transaction_type)}
                      </div>
  
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">
                          {txn.description}
                        </p>
                        {txn.doctor_name && (
                          <p className="text-xs text-primary font-bold mt-0.5">
                            Dr. {txn.doctor_name}
                          </p>
                        )}
                        {txn.scheduled_date && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {new Date(txn.scheduled_date).toLocaleDateString()} · {txn.scheduled_time}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                            {formatTransactionType(txn.transaction_type)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(txn.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium mt-1">
                          ID: {txn.transaction_id}
                        </p>
                      </div>
                    </div>
  
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-black ${getTransactionColor(txn.transaction_type)}`}>
                        {txn.transaction_type === 'debit' ? '-' : '+'}₹{txn.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
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