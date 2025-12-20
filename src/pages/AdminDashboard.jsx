import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, User, Users, TrendingUp, DollarSign, Activity, 
  Download, Calendar, ArrowUpRight, ArrowDownRight, Clock,
  BarChart3, PieChart, Shield, Briefcase, AlertCircle, Lock,
  History
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userMetrics, setUserMetrics] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [activity, setActivity] = useState(null);
  const [insights, setInsights] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [businessTransactions, setBusinessTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, activity
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [showTransactionsDropdown, setShowTransactionsDropdown] = useState(false);
  const [userSubTab, setUserSubTab] = useState('individual'); // individual, partner

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, usersRes, activityRes, insightsRes, metricsRes, businessesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/activity`),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/insights`),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/users/metrics`),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/businesses`)
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setActivity(activityRes.data);
      setInsights(insightsRes.data);
      setUserMetrics(metricsRes.data);
      setBusinesses(businessesRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async (userId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/transactions`);
      setUserTransactions(res.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleUserClick = (user) => {
    if (selectedUser?._id === user._id) {
      setSelectedUser(null);
      setUserTransactions([]);
    } else {
      setSelectedUser(user);
      setSelectedBusiness(null);
      fetchUserTransactions(user._id);
    }
  };

  const fetchBusinessTransactions = async (businessId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/businesses/${businessId}/transactions`);
      setBusinessTransactions(res.data);
    } catch (error) {
      console.error('Error fetching business transactions:', error);
    }
  };

  const handleBusinessClick = (business) => {
    if (selectedBusiness?._id === business._id) {
      setSelectedBusiness(null);
      setBusinessTransactions([]);
    } else {
      setSelectedBusiness(business);
      setSelectedUser(null);
      fetchBusinessTransactions(business._id);
    }
  };

  const handleExport = async (endpoint, filename) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const filteredUsers = userMetrics.filter(u => 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!u.businessId) // Only show users without businessId in Individual tab
  );

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Stats Card Component
  const StatsCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-slate-500">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-blue-600" size={28} />
            Admin Dashboard
          </h2>
          <p className="text-slate-500">Platform management and analytics</p>
        </div>
        <div className="flex gap-2">
          {/* Export Users Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUsersDropdown(!showUsersDropdown);
                setShowTransactionsDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Export Users
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showUsersDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-10 min-w-[150px]">
                <button
                  onClick={() => {
                    handleExport('/admin/export/users', 'users.csv');
                    setShowUsersDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV Format
                </button>
                <button
                  onClick={() => {
                    handleExport('/admin/export/users/pdf', 'users.pdf');
                    setShowUsersDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 border-t border-slate-200 dark:border-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF Format
                </button>
              </div>
            )}
          </div>

          {/* Export Transactions Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTransactionsDropdown(!showTransactionsDropdown);
                setShowUsersDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <Download size={18} />
              Export Transactions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showTransactionsDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-10 min-w-[180px]">
                <button
                  onClick={() => {
                    handleExport('/admin/export/transactions', 'transactions.csv');
                    setShowTransactionsDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV Format
                </button>
                <button
                  onClick={() => {
                    handleExport('/admin/export/transactions/pdf', 'transactions.pdf');
                    setShowTransactionsDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 border-t border-slate-200 dark:border-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF Format
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'activity'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Activity
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              icon={Users}
              title="Total Users"
              value={stats.totalUsers}
              subtitle={`${stats.newUsersThisMonth} new this month`}
              color="bg-blue-600"
            />
            <StatsCard
              icon={TrendingUp}
              title="Total Transactions"
              value={stats.totalTransactions}
              subtitle={`${stats.avgTransactionsPerUser} avg per user`}
              color="bg-green-600"
            />
            <StatsCard
              icon={DollarSign}
              title="Money Tracked"
              value={`₹${parseFloat(stats.totalMoneyTracked).toLocaleString()}`}
              color="bg-purple-600"
            />
            <StatsCard
              icon={Activity}
              title="Active Users"
              value={stats.activeUsers}
              subtitle="Last 30 days"
              color="bg-orange-600"
            />
            <StatsCard
              icon={Calendar}
              title="New Users"
              value={stats.newUsersThisMonth}
              subtitle="This month"
              color="bg-pink-600"
            />
            <StatsCard
              icon={BarChart3}
              title="Avg Transactions"
              value={stats.avgTransactionsPerUser}
              subtitle="Per user"
              color="bg-indigo-600"
            />
          </div>

        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={userSubTab === 'individual' ? "Search users..." : "Search businesses..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Account Type Sub-Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                onClick={() => {
                  setUserSubTab('individual');
                  setSelectedUser(null);
                  setSelectedBusiness(null);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${userSubTab === 'individual' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                Individual
              </button>
              <button
                onClick={() => {
                  setUserSubTab('partner');
                  setSelectedUser(null);
                  setSelectedBusiness(null);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${userSubTab === 'partner' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                Partner
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[550px] overflow-y-auto">
              {userSubTab === 'individual' ? (
                filteredUsers.map(u => (
                  <div 
                    key={u._id}
                    onClick={() => handleUserClick(u)}
                    className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${selectedUser?._id === u._id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Transactions</p>
                        <p className="font-bold">{u.transactionCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Total Amount</p>
                        <p className="font-bold">₹{parseFloat(u.totalAmount).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                filteredBusinesses.map(b => (
                  <div 
                    key={b._id}
                    onClick={() => handleBusinessClick(b)}
                    className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${selectedBusiness?._id === b._id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                        <Briefcase size={20} />
                      </div>
                      <p className="font-medium">{b.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-2xl">
                      {selectedUser.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                      <p className="text-slate-500">{selectedUser.email}</p>
                      <p className="text-xs text-slate-400 mt-1">Joined: {format(new Date(selectedUser.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  <h4 className="font-bold mb-4">Full Transaction History</h4>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {userTransactions.length > 0 ? (
                      userTransactions.map(t => (
                         <div key={t._id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100 dark:border-slate-800">
                           <div className="flex items-center gap-4 min-w-0 flex-1">
                             <div className={`p-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                               {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                             </div>
                             <div className="min-w-0 flex-1">
                               <p className="font-bold text-sm truncate" title={t.description || t.category}>{t.description || t.category}</p>
                               <div className="flex flex-wrap items-center gap-2 mt-1">
                                 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold whitespace-nowrap">
                                   {t.category}
                                 </span>
                                 <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                   {format(new Date(t.date), 'MMM dd, yy')}
                                 </span>
                               </div>
                             </div>
                           </div>
                           <div className={`font-black text-lg sm:text-right shrink-0 flex items-center sm:block ${t.type === 'income' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                             {t.type === 'income' ? '+' : '-'}₹{t.amount}
                           </div>
                         </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-8">No transactions found for this user.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : selectedBusiness ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-2xl">
                      <Briefcase size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedBusiness.name}</h3>
                      <p className="text-slate-500">{selectedBusiness.partners.length} Total Members</p>
                      <p className="text-xs text-slate-400 mt-1">Created: {format(new Date(selectedBusiness.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {/* Partners List with Transaction Summary */}
                  <div className="mb-8">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Users size={18} className="text-slate-400" />
                      Member Transaction Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedBusiness.partners.map(p => {
                        const memberTransactions = businessTransactions.filter(t => t.addedBy?._id === p._id);
                        const memberTotal = memberTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        
                        return (
                          <div key={p._id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {p.name[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold">{p.name}</p>
                                <p className="text-[10px] text-slate-500">{p.email}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <p className="text-slate-400 uppercase font-medium">Transactions</p>
                                <p className="text-sm font-bold">{memberTransactions.length}</p>
                              </div>
                              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                                <p className="text-slate-400 uppercase font-medium">Total Volume</p>
                                <p className="text-sm font-bold">₹{memberTotal.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-slate-400" />
                    Full Transaction History
                  </h4>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {businessTransactions.length > 0 ? (
                      businessTransactions.map(t => (
                        <div key={t._id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-blue-500 border-t border-r border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`p-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-bold text-sm truncate">{t.description || t.category}</p>
                                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                  {t.addedBy?.name || 'Unknown'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">{format(new Date(t.date), 'MMM dd, yyyy')} • {t.category}</p>
                            </div>
                          </div>
                          <div className={`font-black text-lg sm:text-right shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                            {t.type === 'income' ? '+' : '-'}₹{t.amount}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-8">No transactions yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12">
                <User size={48} className="mb-4 opacity-50" />
                <p>Select an account to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && activity && (
        <div className="space-y-6">
          {/* Platform-wide Net Flow Monitor */}
          {activity.netFlow && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Platform-wide Net Flow (Last 30 Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/30">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Total Inflow (Income)</p>
                  <p className="text-2xl font-black text-green-600">₹{activity.netFlow.inflow.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800/30">
                  <p className="text-xs font-bold text-red-600 uppercase mb-1">Total Outflow (Expenses)</p>
                  <p className="text-2xl font-black text-red-600">₹{activity.netFlow.outflow.toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-2xl border ${activity.netFlow.net >= 0 ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30'}`}>
                  <p className={`text-xs font-bold uppercase mb-1 ${activity.netFlow.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    Net Platform Growth (Savings)
                  </p>
                  <p className={`text-2xl font-black ${activity.netFlow.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {activity.netFlow.net >= 0 ? '+' : ''}₹{activity.netFlow.net.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transaction Security Log (Audit Trail) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                <Shield size={20} />
                Transaction Security Log (Audit Trail)
              </h3>
              <div className="space-y-4">
                {activity.securityLogs && activity.securityLogs.length > 0 ? (
                  activity.securityLogs.map(t => (
                    <div key={t._id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold shrink-0">
                            {t.userId?.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm truncate max-w-[150px]">{t.userId?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-500">{t.category} • {format(new Date(t.date), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 w-full min-w-0">
                          <div className="space-y-2">
                            {t.modifiedLogs.map((log, idx) => (
                              <div key={idx} className="flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-4 text-[11px] bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-blue-500 shrink-0">
                                  <History size={12} className="shrink-0" />
                                  <span className="xl:hidden font-bold">Modification History</span>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                  <div className="flex items-center justify-between sm:justify-start gap-2 border-b sm:border-0 border-slate-50 dark:border-slate-700/50 pb-1 sm:pb-0 min-w-0">
                                    <span className="text-slate-400 font-medium shrink-0">Prev:</span>
                                    <span className="font-bold line-through text-slate-500 truncate">₹{log.previousAmount}</span>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
                                    <span className="text-slate-400 font-medium shrink-0">Curr:</span>
                                    <span className="font-bold text-green-600 truncate">₹{log.newAmount}</span>
                                  </div>
                                </div>
                                <div className="text-[9px] text-slate-400 italic whitespace-nowrap pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-50 dark:border-slate-700/50 shrink-0">
                                  {format(new Date(log.modifiedAt), 'MMM dd, HH:mm')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="shrink-0 flex lg:block">
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                            <Lock size={10} />
                            24h Lock Protocol Active
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <p>No transaction modifications detected. Data integrity is high.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Retention Risk Users */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-600">
                <AlertCircle size={20} />
                Retention Risk (Inactive 30+ Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activity.retentionRisk && activity.retentionRisk.length > 0 ? (
                  activity.retentionRisk.map(u => (
                    <div key={u._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">Last Active</p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          {u.lastActive === 'Never' ? 'Never' : format(new Date(u.lastActive), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-500">
                    <p>Great! No users are currently at retention risk.</p>
                  </div>
                )}
              </div>
            </div>

          {/* High Value Transactions */}
          {activity.highValueTransactions && activity.highValueTransactions.length > 0 && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-orange-600" />
                High-Value Transactions (₹10,000+)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activity.highValueTransactions.map(t => (
                  <div key={t._id} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-lg">₹{t.amount.toLocaleString()}</p>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{t.category}</p>
                    <p className="text-xs text-slate-500">{t.userId?.name || 'Unknown'} • {format(new Date(t.date), 'MMM dd, yyyy')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
