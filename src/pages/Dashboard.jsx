import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { transactions, getBalance, getMonthlySpend, budget, loading } = useExpense();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold">{user?.businessId?.name || 'Dashboard'}</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {user?.businessId ? `Welcome back, ${user.name}. Here's ${user?.businessId?.name}'s overview.` : "Welcome back, here's your financial overview."}
          </p>
        </div>
      </header>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Safe to Spend Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl text-white shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden`}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${getSafeColor()}`}></div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Safe to Spend</h3>
          <div className="text-3xl font-bold mb-4">₹{safeToSpend.toFixed(2)}</div>
          <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getSafeColor()}`} 
              style={{ width: `${Math.min(spendPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 gap-2">
            <span className="truncate">Spent: ₹{monthlySpend}</span>
            <span className="truncate shrink-0">Limit: ₹{budget.limit}</span>
          </div>
        </motion.div>

        {/* Total Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <div className="flex justify-between items-start mb-4 gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium truncate">Total Balance</h3>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 break-all">₹{balance.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Wallet size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded-lg">
            <TrendingUp size={16} />
            <span>+2.5% vs last month</span>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between"
        >
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quick Actions</h3>
          <div className="mt-4">
            <button 
              onClick={() => navigate('/add', { state: { type: 'income' } })}
              className="w-full p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              Add Income
            </button>
          </div>
        </motion.div>
      </div>




    </div>
  );
};

export default Dashboard;
