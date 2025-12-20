import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChevronDown } from 'lucide-react';

const Analytics = () => {
  const { transactions } = useExpense();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get available years from transactions
  const years = useMemo(() => {
    const transactionYears = transactions.map(t => new Date(t.date).getFullYear());
    const currentYear = new Date().getFullYear();
    const uniqueYears = [...new Set([...transactionYears, currentYear])];
    return uniqueYears.sort((a, b) => b - a); // Sort descending
  }, [transactions]);

  const currentYear = new Date().getFullYear();
  const [categoryYear, setCategoryYear] = useState('All');
  const [spendingYear, setSpendingYear] = useState('All');
  
  const [showCategoryYearDropdown, setShowCategoryYearDropdown] = useState(false);
  const [showSpendingYearDropdown, setShowSpendingYearDropdown] = useState(false);

  // Prepare Data for Category Chart
  const categoryData = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = t.type === 'expense';
        const matchesYear = categoryYear === 'All' || new Date(t.date).getFullYear() === categoryYear;
        return matchesType && matchesYear;
      })
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) {
          existing.value += parseFloat(curr.amount);
        } else {
          acc.push({ name: curr.category, value: parseFloat(curr.amount) });
        }
        return acc;
      }, []);
  }, [transactions, categoryYear]);

  const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71', 
    '#F1C40F', '#E74C3C', '#1ABC9C', '#8E44AD', '#2C3E50', 
    '#F39C12', '#D35400', '#27AE60', '#7F8C8D', '#C0392B'
  ];

  // Month order for sorting
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Monthly spending data for bar chart
  const monthlyData = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesYear = spendingYear === 'All' || new Date(t.date).getFullYear() === spendingYear;
        return matchesYear;
      })
      .reduce((acc, curr) => {
        const date = new Date(curr.date);
        const month = date.toLocaleString('default', { month: 'short' });
        const monthIndex = date.getMonth(); // 0 for Jan, 1 for Feb, etc.
        
        const existing = acc.find(item => item.monthIndex === monthIndex);
        if (existing) {
          if (curr.type === 'expense') existing.amount += parseFloat(curr.amount);
        } else {
          acc.push({ 
            month, 
            monthIndex,
            amount: curr.type === 'expense' ? parseFloat(curr.amount) : 0
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }, [transactions, spendingYear]);

  const BAR_COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#f59e0b'];

  const YearSelector = ({ selectedYear, onSelect, isOpen, setIsOpen }) => (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        {selectedYear === 'All' ? 'All Years' : selectedYear}
        <ChevronDown size={16} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-10 min-w-[100px]">
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
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-slate-500">Visualize your financial health</p>
      </header>

      {/* Tabs - Scrollable on mobile */}
      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit min-w-full sm:min-w-0">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'categories', label: 'Categories' },
            { key: 'spending', label: 'Monthly Spending' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        {(activeTab === 'overview' || activeTab === 'categories') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[400px] relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Expense by Category</h3>
              <YearSelector 
                selectedYear={categoryYear} 
                onSelect={setCategoryYear}
                isOpen={showCategoryYearDropdown}
                setIsOpen={setShowCategoryYearDropdown}
              />
            </div>
            
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">No expense transactions</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Try selecting a different year or add expenses</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value, entry) => {
                      const { payload } = entry;
                      const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((payload.value / total) * 100).toFixed(0);
                      return <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 ml-1">{`${value} (${percent}%)`}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Monthly Bar Chart */}
        {(activeTab === 'overview' || activeTab === 'spending') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[400px] relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Monthly Spending</h3>
              <YearSelector 
                selectedYear={spendingYear} 
                onSelect={setSpendingYear}
                isOpen={showSpendingYearDropdown}
                setIsOpen={setShowSpendingYearDropdown}
              />
            </div>

            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">No spending data</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Try selecting a different year or add transactions</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={0}
                    height={40}
                    tickFormatter={(value) => value.slice(0, 3)} 
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                    formatter={(value) => [`₹${value}`, 'Spending']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
