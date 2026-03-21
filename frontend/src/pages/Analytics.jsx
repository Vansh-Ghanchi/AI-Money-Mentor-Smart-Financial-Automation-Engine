import React, { useState, useMemo, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { ChevronDown, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const Analytics = () => {
  const { transactions } = useExpense();
  
  // Get available years from transactions
  const years = useMemo(() => {
    const transactionYears = transactions.map(t => new Date(t.date).getFullYear());
    const currentYear = new Date().getFullYear();
    const uniqueYears = [...new Set([...transactionYears, currentYear])];
    return uniqueYears.sort((a, b) => b - a); // Sort descending
  }, [transactions]);


  const [spendingYear, setSpendingYear] = useState(new Date().getFullYear());
  const [showSpendingYearDropdown, setShowSpendingYearDropdown] = useState(false);



  // Monthly spending data for bar chart
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    
    // Initialize all months with 0
    months.forEach((month, index) => {
      monthlyMap[index] = { month, monthIndex: index, amount: 0 };
    });

    // Aggregate transactions
    transactions
      .filter(t => {
        if (!t.date) return false;
        const txYear = new Date(t.date).getFullYear();
        const matches = spendingYear === 'All' || txYear === parseInt(spendingYear);
        return matches;
      })
      .forEach(curr => {
        if (curr.type === 'expense' && curr.amount) {
          const monthIndex = new Date(curr.date).getMonth();
          const amount = parseFloat(curr.amount);
          if (!isNaN(amount)) {
            monthlyMap[monthIndex].amount += amount;
          }
        }
      });

    return Object.values(monthlyMap);
  }, [transactions, spendingYear]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const categoryMap = {};
    
    transactions
      .filter(t => {
        if (!t.date) return false;
        const txYear = new Date(t.date).getFullYear();
        return (spendingYear === 'All' || txYear === parseInt(spendingYear)) && t.type === 'expense';
      })
      .forEach(t => {
        if (t.amount) {
          const cat = t.category || 'Others';
          const amount = parseFloat(t.amount);
          if (!isNaN(amount)) {
            categoryMap[cat] = (categoryMap[cat] || 0) + amount;
          }
        }
      });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [transactions, spendingYear]);

  // Calculate statistics
  const stats = useMemo(() => {
    const filteredTransactions = transactions.filter(t => {
      if (!t.date) return false;
      const txYear = new Date(t.date).getFullYear();
      return spendingYear === 'All' || txYear === parseInt(spendingYear);
    });

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense' && t.amount)
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.amount)
      .reduce((sum, t) => {
        const amount = parseFloat(t.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    // Dynamic Average: Divide by count of unique months in data
    const activeMonths = new Set(filteredTransactions
      .filter(t => t.type === 'expense')
      .map(t => new Date(t.date).getMonth())
    ).size || 1;

    const avgMonthlyExpense = totalExpense / activeMonths;

    return { totalExpense, totalIncome, avgMonthlyExpense };
  }, [transactions, spendingYear]);

  const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  const YearSelector = ({ selectedYear, onSelect, isOpen, setIsOpen }) => (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-slate-50 dark:bg-slate-700 rounded-lg"
      >
        {selectedYear === 'All' ? 'All Years' : selectedYear}
        <ChevronDown size={16} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-20 min-w-[120px]">
            <button
              onClick={() => { onSelect('All'); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${selectedYear === 'All' ? 'text-blue-600 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
            >
              All Years
            </button>
            {years.map(year => (
              <button
                key={year}
                onClick={() => { onSelect(year); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${selectedYear === year ? 'text-blue-600 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
              >
                {year}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const hasData = monthlyData.some(m => m.amount > 0);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-slate-500">Visualize your financial health</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Total Expenses</span>
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.totalExpense.toFixed(2)}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Total Income</span>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.totalIncome.toFixed(2)}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Avg Monthly</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.avgMonthlyExpense.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Monthly Spending</h3>
            <YearSelector 
              selectedYear={spendingYear} 
              onSelect={setSpendingYear}
              isOpen={showSpendingYearDropdown}
              setIsOpen={setShowSpendingYearDropdown}
            />
          </div>

          {!hasData ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">No spending data</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Add transactions to see your spending trends</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Spending']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
