import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Calendar, Plus, AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react';
import { format, addMonths, differenceInDays } from 'date-fns';
import { predictSubscriptionCategory } from '../services/ai';

const POPULAR_SERVICES = [
  { name: 'Netflix', category: 'Entertainment' },
  { name: 'Prime Video', category: 'Entertainment' },
  { name: 'Disney+ Hotstar', category: 'Entertainment' },
  { name: 'JioHotstar', category: 'Entertainment' },
  { name: 'JioSaavn', category: 'Entertainment' },
  { name: 'Spotify', category: 'Entertainment' },
  { name: 'YouTube Premium', category: 'Entertainment' },
  { name: 'Apple Music', category: 'Entertainment' },
  { name: 'SonyLIV', category: 'Entertainment' },
  { name: 'Zee5', category: 'Entertainment' },
  { name: 'PlayStation Plus', category: 'Entertainment' },
  { name: 'Xbox Game Pass', category: 'Entertainment' },
  { name: 'Electricity Bill', category: 'Bills' },
  { name: 'Water Bill', category: 'Bills' },
  { name: 'Gas Bill', category: 'Bills' },
  { name: 'Internet/WiFi', category: 'Bills' },
  { name: 'Mobile Recharge', category: 'Bills' },
  { name: 'Jio Fiber', category: 'Bills' },
  { name: 'Airtel Xstream', category: 'Bills' },
  { name: 'Google One', category: 'Bills' },
  { name: 'iCloud', category: 'Bills' },
  { name: 'ChatGPT Plus', category: 'Bills' },
  { name: 'Gym Membership', category: 'Health' },
  { name: 'Health Insurance', category: 'Health' },
  { name: 'Cult.fit', category: 'Health' },
  { name: 'Practo', category: 'Health' },
  { name: 'PharmEasy', category: 'Health' },
  { name: 'Swiggy One', category: 'Other' },
  { name: 'Zomato Gold', category: 'Other' },
  { name: 'Amazon Prime', category: 'Shopping' }
];

const Subscriptions = () => {
  const { subscriptions, addSubscription, removeSubscription } = useExpense();
  const [showAdd, setShowAdd] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [billingDate, setBillingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cycle, setCycle] = useState('monthly');
  
  // AI Suggestion State (matching AddExpense)
  const [suggestion, setSuggestion] = useState(null);
  
  // Autocomplete State
  const [filteredServices, setFilteredServices] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isSelection, setIsSelection] = useState(false);

  // Auto-detect category based on service name (matching AddExpense logic)
  useEffect(() => {
    // Clear suggestion if name is empty
    if (name.length === 0) {
      setSuggestion(null);
      setFilteredServices([]);
      setShowAutocomplete(false);
      return;
    }

    // Filter Autocomplete Suggestions
    if (name.length > 0 && !isSelection) {
      const matches = POPULAR_SERVICES.filter(service => 
        service.name.toLowerCase().includes(name.toLowerCase())
      );
      setFilteredServices(matches);
      setShowAutocomplete(matches.length > 0);
    } else {
      setShowAutocomplete(false);
    }

    // Reset selection flag if user continues typing
    if (!isSelection) {
      setIsSelection(false);
    }

    // Show "analyzing" state immediately
    if (name.length > 0) {
      setSuggestion({ analyzing: true });
    }

    // Check for exact local match first (Instant Suggestion)
    const exactMatch = POPULAR_SERVICES.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (exactMatch) {
      setSuggestion({ category: exactMatch.category, analyzing: false });
      return;
    }

    // Try AI Match after 700ms (matching AddExpense timing)
    const timer = setTimeout(async () => {
      if (name.length > 2) {
        const predicted = await predictSubscriptionCategory(name);
        if (predicted) {
          setSuggestion({ category: predicted, analyzing: false });
        } else {
          setSuggestion(null);
        }
      }
    }, 700); // Match AddExpense 700ms timing

    return () => clearTimeout(timer);
  }, [name]);

  const handleSelectService = (service) => {
    setIsSelection(true);
    setName(service.name);
    setSuggestion({ category: service.category, analyzing: false });
    setShowAutocomplete(false);
  };

  const handleAcceptSuggestion = () => {
    if (suggestion?.category) {
      setCategory(suggestion.category);
    }
    setSuggestion(null);
  };

  const handleDismissSuggestion = () => {
    setSuggestion(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addSubscription({ 
        name, 
        amount: parseFloat(amount), 
        nextDate: billingDate,
        frequency: cycle,
        category
      });
      setShowAdd(false);
      setName('');
      setAmount('');
      setCategory('Entertainment');
      setSuggestion(null);
      
      // Show confirmation modal
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to add subscription');
    }
  };

  const getNextBillingDate = (dateStr, cycle) => {
    const date = new Date(dateStr);
    const now = new Date();
    // Simple logic: if date passed, add month/year until future
    // For demo, just showing the day of month
    return date; 
  };

  const getDaysUntilDue = (subscription) => {
    // Handle both nextDate and billingDate field names
    const dateStr = subscription?.nextDate || subscription?.billingDate;
    
    if (!dateStr) {
      return 0; // Return 0 if no date is available
    }
    
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 0;
    }
    
    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth(), date.getDate());
    if (nextDate < now) nextDate.setMonth(nextDate.getMonth() + 1);
    return differenceInDays(nextDate, now);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Subscriptions</h2>
          <p className="text-slate-500">Track your recurring payments</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          <span className="font-bold">Add Subscription</span>
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Service Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Service Name (e.g. Netflix)" 
                  value={name} 
                  onChange={(e) => {
                    setIsSelection(false);
                    setName(e.target.value);
                  }}
                  onFocus={() => name.length > 0 && setShowAutocomplete(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                {/* Autocomplete Dropdown */}
                {showAutocomplete && filteredServices.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto">
                    {filteredServices.map((service, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectService(service)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex justify-between items-center group"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-200">{service.name}</span>
                        <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">{service.category}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* AI Suggestion Box (matching AddExpense exactly) */}
                {suggestion && (
                  <div className="absolute top-full left-0 right-0 z-10">
                    {suggestion.analyzing ? (
                      // Stage 1: Analyzing state with pulsing robot icon and animated dots
                      <div className="ai-suggestion flex items-center gap-2">
                        <div className="ai-icon pulse-animation">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25 25 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135"/>
                            <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5"/>
                          </svg>
                        </div>
                        <div className="ai-text">
                          <span className="typing-text">AI is analyzing your service</span>
                          <span className="dots"></span>
                        </div>
                      </div>
                    ) : suggestion.category ? (
                      // Stage 2: Suggestion with stars icon and accept button
                      <div className="ai-box relative group">
                        <button
                          type="button"
                          onClick={handleDismissSuggestion}
                          className="absolute -top-2 -right-2 p-1 bg-white dark:bg-slate-700 rounded-full shadow-md text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                        <div className="flex items-start gap-2">
                          <div className="ai-icon pulse-animation bg-white dark:bg-blue-800 shadow-sm">
                            <Sparkles size={20} className="text-blue-500 dark:text-blue-300" />
                          </div>
                          <div className="ai-message flex-1">
                            <div className="text-sm">
                              <strong className="text-slate-900 dark:text-white">Smart Suggestion:</strong>{' '}
                              <span className="capitalize text-slate-700 dark:text-slate-300">{suggestion.category}</span> matches your service.
                            </div>
                            <button 
                              type="button"
                              onClick={handleAcceptSuggestion}
                              className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm rounded-lg transition-colors shadow-sm flex items-center gap-1"
                            >
                              Accept Suggestion
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Amount</label>
              <input 
                type="number" 
                placeholder="Amount" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none no-spinner"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Billing Date</label>
              <input 
                type="date" 
                value={billingDate} 
                onChange={e => setBillingDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none date-input-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"
              >
                <option value="Entertainment">Entertainment</option>
                <option value="Bills">Bills</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Billing Cycle</label>
              <select 
                value={cycle} 
                onChange={e => setCycle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map(sub => {
          const daysLeft = getDaysUntilDue(sub);
          const isUrgent = daysLeft <= 3;

          return (
            <div key={sub._id} className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${isUrgent ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0">
                  <Calendar size={24} className="text-slate-600 dark:text-slate-300" />
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await removeSubscription(sub._id);
                    } catch (error) {
                      console.error('Delete error:', error);
                      alert('Failed to delete subscription. Please try again.');
                    }
                  }} 
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Remove subscription"
                >
                  <X size={20} />
                </button>
              </div>
              <h3 className="font-bold text-lg truncate" title={sub.name}>{sub.name}</h3>
              <div className="flex justify-between items-end mt-2 gap-2">
                <div className="min-w-0">
                  <p className="text-2xl font-black truncate">₹{sub.amount}</p>
                  <p className="text-[10px] text-slate-500 capitalize font-bold">{sub.cycle}</p>
                </div>
                <div className={`text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {daysLeft === 0 ? 'DUE TODAY' : `${daysLeft} DAYS LEFT`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmation(false)}></div>
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              {/* Message */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Success!</h3>
                <p className="text-slate-600 dark:text-slate-300">Subscription added successfully!</p>
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

export default Subscriptions;
