import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Trash2, Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight, Pencil, X, Lock, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth } from 'date-fns';

const Transactions = () => {
  const { transactions, deleteTransaction, updateTransaction, wallets } = useExpense();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterWallet, setFilterWallet] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Edit Modal State
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  const categories = ['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Salary', 'Investment', 'Income', 'Others'];
  const editCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Salary', 'Investment', 'Income', 'Others'];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase()) || 
                            t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesWallet = filterWallet === 'All' || t.walletId === filterWallet;
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesDate = !filterDate || isSameDay(new Date(t.date), new Date(filterDate));
      
      return matchesSearch && matchesCategory && matchesWallet && matchesType && matchesDate;
    });
  }, [transactions, search, filterCategory, filterWallet, filterType, filterDate]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDailyTotal = (date) => {
    return transactions
      .filter(t => isSameDay(new Date(t.date), date) && t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const getDailyIncome = (date) => {
    return transactions
      .filter(t => isSameDay(new Date(t.date), date) && t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;
    
    setEditLoading(true);
    try {
      await updateTransaction(editingTransaction._id, {
        amount: parseFloat(editingTransaction.amount),
        description: editingTransaction.description,
        category: editingTransaction.category,
        walletId: editingTransaction.walletId,
        date: editingTransaction.date,
        type: editingTransaction.type,
        mood: editingTransaction.mood
      });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert(error.response?.data?.message || 'Failed to update transaction');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-slate-500">View and filter your spending history</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ListIcon size={18} />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'calendar' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CalendarIcon size={18} />
            Calendar
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select 
            value={filterWallet} 
            onChange={(e) => setFilterWallet(e.target.value)}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"
          >
            <option value="All">All Wallets</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"
          >
            <option value="All">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div key={t._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-3 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} dark:bg-opacity-20`}>
                      {t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate text-base">{t.description || t.category}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                          {t.category}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                          {wallets.find(w => w.id === t.walletId)?.name || 'Unknown Wallet'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {format(new Date(t.date), 'MMM dd, yyyy • hh:mm a')}
                        </span>
                        {t.addedBy?.name && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-600 dark:text-yellow-400 font-medium whitespace-nowrap">By {t.addedBy.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className={`text-xl font-black ${t.type === 'income' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount}
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      {(() => {
                        const twentyFourHours = 24 * 60 * 60 * 1000;
                        const isLocked = (Date.now() - new Date(t.createdAt).getTime()) > twentyFourHours;
                        
                        return isLocked ? (
                          <div className="p-2 text-slate-300 dark:text-slate-600 cursor-not-allowed" title="Locked after 24h">
                            <Lock size={18} />
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingTransaction({
                                ...t,
                                date: format(new Date(t.date), "yyyy-MM-dd'T'HH:mm")
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 bg-slate-100 dark:bg-slate-700 sm:bg-transparent text-slate-500 hover:text-blue-500 transition-colors rounded-lg"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                        );
                      })()}
                      
                      <button 
                        onClick={() => deleteTransaction(t._id)}
                        className="p-2 bg-slate-100 dark:bg-slate-700 sm:bg-transparent text-slate-500 hover:text-red-500 transition-colors rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500">
                <Filter size={48} className="mx-auto mb-4 opacity-20" />
                <p>No transactions found matching your filters</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 md:p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container with Scroll */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[600px]"> {/* Ensure minimum width to prevent squashing */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-slate-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const expense = getDailyTotal(day);
                  const income = getDailyIncome(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = filterDate && isSameDay(day, new Date(filterDate));

                  // Helper to format compact numbers (e.g. 25000 -> 25k)
                  const formatCompact = (num) => {
                    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
                    return num;
                  };

                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        setFilterDate(format(day, 'yyyy-MM-dd'));
                        setViewMode('list');
                      }}
                      className={`
                        min-h-[80px] p-1 md:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between
                        ${isCurrentMonth ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'}
                        ${isSelected ? 'ring-2 ring-blue-500' : 'hover:border-blue-200 dark:hover:border-blue-800'}
                      `}
                    >
                      <div className="text-right text-xs md:text-sm mb-1 text-slate-400">{format(day, 'd')}</div>
                      <div className="space-y-1">
                        {expense > 0 && (
                          <div className="text-[10px] md:text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-1 py-0.5 rounded text-center truncate">
                            -₹{formatCompact(expense)}
                          </div>
                        )}
                        {income > 0 && (
                          <div className="text-[10px] md:text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-1 py-0.5 rounded text-center truncate">
                            +₹{formatCompact(income)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Transaction Modal */}
      {isEditModalOpen && editingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold">Edit Transaction</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <form id="edit-transaction-form" onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Amount (₹)</label>
                  <input 
                    type="number" 
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value})}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500 text-2xl font-bold no-spinner"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Description</label>
                  <input 
                    type="text" 
                    value={editingTransaction.description}
                    onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                    placeholder="What was this for?"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Category</label>
                    <select 
                      value={editingTransaction.category}
                      onChange={(e) => setEditingTransaction({...editingTransaction, category: e.target.value})}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
                    >
                      {editCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500">Wallet</label>
                    <select 
                      value={editingTransaction.walletId}
                      onChange={(e) => setEditingTransaction({...editingTransaction, walletId: e.target.value})}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
                    >
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTransaction({...editingTransaction, type: 'expense'})}
                      className={`flex-1 py-2 rounded-lg font-medium border-2 transition-all ${editingTransaction.type === 'expense' ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20' : 'border-slate-100 dark:border-slate-700 text-slate-500'}`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTransaction({...editingTransaction, type: 'income'})}
                      className={`flex-1 py-2 rounded-lg font-medium border-2 transition-all ${editingTransaction.type === 'income' ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20' : 'border-slate-100 dark:border-slate-700 text-slate-500'}`}
                    >
                      Income
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                form="edit-transaction-form"
                type="submit"
                disabled={editLoading}
                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
