import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Calendar as CalendarIcon, Wallet, CheckCircle, Sparkles, X, ChevronDown, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { predictCategory } from '../services/ai';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';

const AddExpense = () => {
  const { addTransaction, wallets } = useExpense();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Manual Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Custom Category State
  const [customCategories, setCustomCategories] = useState(() => {
    if (!user?._id) return { expense: [], income: [] };
    const saved = localStorage.getItem(`custom_cats_${user._id}`);
    return saved ? JSON.parse(saved) : { expense: [], income: [] };
  });

  // Category Editor State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatIndex, setEditingCatIndex] = useState(null); // null means adding new
  const [catNameInput, setCatNameInput] = useState('');

  // Include all wallets including 'Online'
  const selectableWallets = wallets;
  const [walletId, setWalletId] = useState('');

  // Set default wallet to 'Cash' if available, otherwise first selectable
  useEffect(() => {
    if (!walletId && selectableWallets.length > 0) {
      const cashWallet = selectableWallets.find(w => w.name.toLowerCase() === 'cash');
      setWalletId(cashWallet ? cashWallet.id : selectableWallets[0].id);
    }
  }, [selectableWallets, walletId]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [type, setType] = useState('expense');

  useEffect(() => {
    if (location.state?.type) {
      setType(location.state.type);
    }
  }, [location.state]);



  // AI Category Suggestion Logic
  useEffect(() => {
    if (description.length === 0) {
      setSuggestion(null);
      return;
    }

    setSuggestion({ analyzing: true });
    const timer = setTimeout(async () => {
      if (description.length > 2) {
        const predicted = await predictCategory(description);
        if (predicted) {
          // Split by ' & ' to handle multiple categories
          const predictedArray = predicted.split(' & ').map(s => s.trim());
          
          setSuggestion({ 
            category: predicted, 
            categoryArray: predictedArray,
            analyzing: false,
            matches: predicted === category || predicted.split(' & ').join(', ') === category
          });
        } else {
          setSuggestion(null);
        }
      } else {
        setSuggestion(null);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [description, type, category]);

  // Auto-dismiss confirmation message after 2 seconds
  useEffect(() => {
    if (suggestion?.matches && !suggestion?.analyzing) {
      const dismissTimer = setTimeout(() => {
        setSuggestion(null);
      }, 2000);
      
      return () => clearTimeout(dismissTimer);
    }
  }, [suggestion]);



  const handleDismissSuggestion = () => {
    setSuggestion(null);
  };

  const expenseCategories = [
    'Food', 'Social Life', 'Pets', 'Transport', 'Culture', 'Household', 
    'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Gift', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Allowance', 'Bonus', 'Gift Received', 'Refund', 'Cashback', 
    'Freelance / Business Income', 'Investment Return / Interest', 'Petty Cash', 'Transport', 'Other'
  ];

  // Merge default categories with custom ones
  const categories = [...(type === 'expense' ? expenseCategories : incomeCategories), ...(customCategories[type] || [])];

  // Save custom categories to local storage when they change
  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(`custom_cats_${user._id}`, JSON.stringify(customCategories));
    }
  }, [customCategories, user?._id]);

  useEffect(() => {
    const isMultiCat = category && category.includes(', ');
    if (!isMultiCat && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [type, categories]);

  const handleAcceptSuggestion = () => {
    if (suggestion?.categoryArray) {
      const predictedArray = suggestion.categoryArray;
      const categoryString = predictedArray.join(', ');

      // Create custom categories only on Apply
      let hasNewCategories = false;
      const updatedCustom = { ...customCategories };
      
      predictedArray.forEach(cat => {
        if (cat === 'Others') return;
        const isDefault = (type === 'expense' ? expenseCategories : incomeCategories).includes(cat);
        const isExistingCustom = updatedCustom[type].includes(cat);
        
        if (!isDefault && !isExistingCustom) {
          updatedCustom[type].push(cat);
          hasNewCategories = true;
        }
      });

      if (hasNewCategories) {
        setCustomCategories(updatedCustom);
      }

      setCategory(categoryString);
    }
    setSuggestion(null);
  };

  const handleManagementAction = (e) => {
    e.stopPropagation();
    setEditingCatIndex(null);
    setCatNameInput('');
    setIsCatModalOpen(true);
  };

  const saveCustomCategory = () => {
    if (!catNameInput.trim()) return;

    const newCats = { ...customCategories };
    if (editingCatIndex !== null) {
      // Edit existing
      const oldName = newCats[type][editingCatIndex];
      newCats[type][editingCatIndex] = catNameInput.trim();
      if (category === oldName) setCategory(catNameInput.trim());
    } else {
      // Add new
      if (!newCats[type].includes(catNameInput.trim()) && !categories.includes(catNameInput.trim())) {
        newCats[type].push(catNameInput.trim());
        setCategory(catNameInput.trim());
      }
    }

    setCustomCategories(newCats);
    setIsCatModalOpen(false);
    setEditingCatIndex(null);
    setCatNameInput('');
  };

  const deleteCustomCategory = (e, index) => {
    e.stopPropagation();
    const newCats = { ...customCategories };
    const deletedName = newCats[type][index];
    newCats[type].splice(index, 1);
    setCustomCategories(newCats);
    
    if (category === deletedName) {
      setCategory(type === 'expense' ? expenseCategories[0] : incomeCategories[0]);
    }
  };

  const editCustomCategory = (e, index) => {
    e.stopPropagation();
    setEditingCatIndex(index);
    setCatNameInput(customCategories[type][index]);
    setIsCatModalOpen(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !description) {
      const newErrors = {};
      if (!amount) newErrors.amount = 'Please enter an amount';
      if (!description) newErrors.description = 'Please enter a description';
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        description,
        category, // Store as string now
        walletId,
        date,
        type
      });

      // Reset form
      setAmount('');
      setDescription('');
      
      // Show confirmation modal
      setConfirmationMessage('Transaction added successfully!');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Failed to add transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold">Add Transaction</h2>
        <p className="text-slate-500">Track your spending or income manually.</p>
      </header>

      <form onSubmit={handleManualSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        {/* Amount Input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</span>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
            }}
            placeholder="0.00"
            className={`w-full pl-10 pr-4 py-4 text-3xl sm:text-4xl font-bold bg-transparent border-b-2 ${errors.amount ? 'border-red-500' : 'border-slate-100 dark:border-slate-700'} focus:border-blue-500 outline-none transition-colors placeholder:text-slate-200 dark:placeholder:text-slate-700 no-spinner`}
            autoFocus
          />
          {errors.amount && <p className="text-red-500 text-xs font-bold mt-1 animate-pulse">! {errors.amount}</p>}
        </div>

        {/* Manual Type Selection */}
        <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all ${
              type === 'expense' 
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-100' 
                : 'text-slate-400 hover:text-red-500 scale-[0.98]'
            }`}
          >
            💸 EXPENSE (-)
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all ${
              type === 'income' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 scale-100' 
                : 'text-slate-400 hover:text-green-500 scale-[0.98]'
            }`}
          >
            💰 INCOME (+)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Description */}
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-slate-500">Description</label>
            <div className="relative">
              <input 
                type="text" 
                value={description}
                onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                }}
                placeholder="What was this for?"
                className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 ${errors.description ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-transparent'} focus:ring-2 focus:ring-blue-500 transition-all`}
              />
              {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 animate-pulse uppercase tracking-tighter">! {errors.description}</p>}
              
              {/* AI Suggestion Box */}
              {suggestion && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1">
                  {suggestion.analyzing ? (
                    <div className="ai-suggestion-mini flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 animate-pulse">
                        <Sparkles size={14} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">AI Analyzing...</span>
                    </div>
                  ) : suggestion.matches ? (
                    // When AI matches current category - show green confirmation
                    <div className="ai-box-compact flex items-center justify-between gap-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg shadow-md border border-green-100 dark:border-green-800 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                            <p className="text-[10px] text-slate-700 dark:text-slate-300 truncate">
                                <strong>AI Confirmed:</strong> {suggestion.category} ✓
                            </p>
                        </div>
                        <button 
                            type="button"
                            onClick={handleDismissSuggestion}
                            className="p-1 text-slate-400 hover:text-red-500"
                        >
                            <X size={12} />
                        </button>
                    </div>
                  ) : (
                    // When AI suggests different category - show blue suggestion
                    <div className="ai-box-compact flex items-center justify-between gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-md border border-blue-100 dark:border-blue-800 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Sparkles size={14} className="text-blue-500 shrink-0" />
                            <p className="text-[10px] text-slate-700 dark:text-slate-300 truncate">
                                <strong>AI Suggests:</strong> {suggestion.category}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {!suggestion.matches && (
                                <button 
                                    type="button"
                                    onClick={handleAcceptSuggestion}
                                    className="px-2 py-1 bg-blue-500 text-white text-[9px] font-bold rounded hover:bg-blue-600 transition-colors uppercase"
                                >
                                    Apply
                                </button>
                            )}
                            <button 
                                type="button"
                                onClick={handleDismissSuggestion}
                                className="p-1 text-slate-400 hover:text-red-500"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Wallet */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500">Wallet</label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={walletId} 
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
              >
                {selectableWallets.map(w => <option key={w.id} value={w.id}>{w.name} (₹{w.balance})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Date & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500">Date & Time</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="datetime-local" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500 date-input-white"
              />
            </div>
          </div>
          {/* Category */}
          {/* Category Dropdown */}
          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-500">Category</label>
              <button 
                type="button" 
                onClick={handleManagementAction}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-blue-500"
                title="Manage Categories"
              >
                <Pencil size={14} />
              </button>
            </div>
            <div className="relative">
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent hover:border-blue-500/30 cursor-pointer flex items-center justify-between transition-all ${isDropdownOpen ? 'ring-2 ring-blue-500 border-blue-500 bg-white dark:bg-slate-800' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Layers className="text-slate-400" size={18} />
                  <span className="font-medium text-slate-700 dark:text-slate-200">{category}</span>
                </div>
                <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-40 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-200 py-2">
                    {/* Default Categories */}
                    <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/50 mb-1">Standard</div>
                    {(type === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                      <button
                        key={`def-${c}`}
                        type="button"
                        onClick={() => {
                          setCategory(c);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                          category === c ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${category === c ? 'bg-blue-600' : 'bg-transparent'}`}></div>
                        {c}
                      </button>
                    ))}

                    {/* Custom Categories */}
                    {customCategories[type]?.length > 0 && (
                      <>
                        <div className="px-3 py-1 text-[10px] font-black text-blue-400 uppercase tracking-widest border-y border-slate-50 dark:border-slate-800/50 my-1">My Custom</div>
                        {customCategories[type].map((c, idx) => (
                          <div 
                            key={`custom-${c}`}
                            className={`group w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer ${
                              category === c ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => {
                              setCategory(c);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full ${category === c ? 'bg-blue-600' : 'bg-transparent'}`}></div>
                                <span className={`text-sm font-semibold truncate ${category === c ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}>{c}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => editCustomCategory(e, idx)} 
                                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-500 rounded-lg"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button 
                                  onClick={(e) => deleteCustomCategory(e, idx)} 
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 rounded-lg"
                                >
                                  <Trash2 size={12} />
                                </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* Add Button in Dropdown */}
                    <button
                      type="button"
                      onClick={handleManagementAction}
                      className="w-[calc(100%-16px)] mx-2 mt-2 py-2 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all text-xs font-bold uppercase tracking-tighter"
                    >
                      <Plus size={14} />
                      Add New Category
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50">
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>

      {/* Custom Category Management Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsCatModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 max-w-sm w-full border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Plus className="text-blue-500" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight dark:text-white">
                    {editingCatIndex !== null ? 'Edit Category' : 'New Category'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saving for {type}s</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
                <input 
                  type="text"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="e.g. My Side Hobby"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold dark:text-white"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveCustomCategory()}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl active:scale-95 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={saveCustomCategory}
                  className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm"
                >
                  {editingCatIndex !== null ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowConfirmation(false)}></div>
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              {/* Message */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Success!</h3>
                <p className="text-slate-600 dark:text-slate-300">{confirmationMessage}</p>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setShowConfirmation(false)}
                className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpense;
