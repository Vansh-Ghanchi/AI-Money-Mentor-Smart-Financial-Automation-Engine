import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Shield, Lock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SecurityBadge from '../components/SecurityBadge';


const Dashboard = () => {
  const { transactions, getBalance, getMonthlySpend, budget, loading } = useExpense();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const balance = getBalance();
  const monthlySpend = getMonthlySpend();
  const safeToSpend = budget.limit - monthlySpend;
  const spendPercentage = (monthlySpend / budget.limit) * 100;

  const getSafeColor = () => {
    if (spendPercentage > 90) return 'bg-red-500';
    if (spendPercentage > 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };



  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Header */}
      <div className="flex flex-col gap-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">{user?.businessId?.name || 'Dashboard'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {user?.businessId ? `Welcome back, ${user.name}. Here's ${user?.businessId?.name}'s overview.` : "Welcome back, here's your financial overview."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SecurityBadge variant="default" />
            <SecurityBadge variant="verified" />
          </div>
        </header>

        {/* Security Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <Shield className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                Your financial data is completely secure
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                Bank-grade encryption • Privacy protected • Trusted by millions
              </p>
            </div>
            <Lock className="text-green-600 dark:text-green-400" size={18} />
          </div>
        </motion.div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Safe to Spend Card - PhonePe Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="payment-card"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white/70 text-sm font-medium">Spent</h3>
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={12} className="text-green-400" />
                <span className="text-xs text-white/90 font-medium">Verified</span>
              </div>
            </div>
            <div className="text-4xl font-bold mb-6 text-white">₹{monthlySpend.toLocaleString('en-IN')}</div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getSafeColor()}`} 
                  style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-white tracking-tight">
                <span>Safe to Spend: ₹{safeToSpend.toFixed(2)}</span>
                <span>Limit: ₹{budget.limit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Balance - GPay Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Balance</h3>
                  <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded">
                    <Lock size={10} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">₹{balance.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                <Wallet size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <TrendingUp size={16} />
              <span className="font-medium">+2.5% vs last month</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - Modern Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card"
        >
          <div className="p-6 space-y-3">
            <h3 className="text-slate-700 dark:text-slate-300 text-sm font-semibold mb-4">Quick Actions</h3>
            <button 
              onClick={() => navigate('/add', { state: { type: 'income' } })}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 flex items-center justify-center gap-2"
            >
              <ArrowUpRight size={18} />
              Add Income
            </button>
            <button 
              onClick={() => navigate('/add', { state: { type: 'expense' } })}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold text-sm hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30 flex items-center justify-center gap-2"
            >
              <ArrowDownRight size={18} />
              Add Expense
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="premium-card"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Recent Transactions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your records are private & securely stored</p>
          </div>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View All
            <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((t, index) => (
              <motion.div 
                key={t._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (index * 0.05) }}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    t.type === 'income' 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                      : 'bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30'
                  }`}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{t.description || t.category}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(t.date), 'MMM dd, hh:mm a')}</p>
                  </div>
                </div>
                <div className={`text-sm font-black ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                  {t.type === 'income' ? '+' : '-'}₹{t.amount}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-3">
                <Wallet size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No transactions yet.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Start adding your income and expenses</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
