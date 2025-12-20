import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { parseExpenseNLP, predictCategory } from '../services/ai';
import { Mic, Send, Loader2, Smile, Frown, Meh, Calendar as CalendarIcon, Wallet, Sparkles, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';

const AddExpense = () => {
  const { addTransaction, wallets } = useExpense();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('manual'); // manual or nlp
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  
  // Manual Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'cash');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-ddTHH:mm'));
  const [type, setType] = useState('expense');

  useEffect(() => {
    if (location.state?.type) {
      setType(location.state.type);
    }
  }, [location.state]);

  const handleAcceptSuggestion = () => {
    if (suggestion?.category) {
      setCategory(suggestion.category);
    }
    setSuggestion(null);
  };

  const handleDismissSuggestion = () => {
    setSuggestion(null);
  };

  // Advanced Rule-Based NLP for Instant Detection
  const predictLocal = (text) => {
    const lower = text.toLowerCase();
    
    // Food: synonyms, context (ate, dining), typos (burgr)
    if (lower.match(/(burger|burgr|pizza|piza|food|lunch|dinner|breakfast|snack|coffee|tea|chai|restaurant|swiggy|zomato|eat|ate|dining|hungry)/)) return 'Food';
    
    // Transport: synonyms (cab, auto), context (commute), typos
    if (lower.match(/(fuel|gas|petrol|diesel|uber|ola|taxi|cab|auto|bus|train|flight|metro|travel|commute|pass|ticket|ride)/)) return 'Transport';
    
    // Shopping: synonyms (buy, purchase), context (online), typos (shping)
    if (lower.match(/(t-shirt|shirt|jeans|clothes|shoe|wear|dress|amazon|flipkart|myntra|shopping|shping|shop|buy|bought|purchase|ordered|online)/)) return 'Shopping';
    
    // Bills: synonyms (recharge), context (paid bill)
    if (lower.match(/(bill|rent|electricity|water|wifi|broadband|recharge|mobile|prepaid|postpaid|gas cylinder|dth)/)) return 'Bills';
    
    // Entertainment: synonyms (fun, show)
    if (lower.match(/(movie|film|netflix|prime|hulu|game|gaming|concert|event|show|cinema|theatre|fun|party)/)) return 'Entertainment';
    
    // Health: synonyms (meds, dr)
    if (lower.match(/(medicine|meds|doctor|dr|hospital|clinic|pharmacy|gym|fitness|workout|health|checkup)/)) return 'Health';
    
    // Education: synonyms (tuition, learning)
    if (lower.match(/(book|course|udemy|coursera|school|college|fee|tuition|class|lesson|learning|study)/)) return 'Education';
    
    // Salary: synonyms (earnings, credited)
    if (lower.match(/(salary|bonus|paycheck|income|earnings|profit|received|credited)/)) return 'Salary';
    
    // Investment: synonyms (sip, crypto)
    if (lower.match(/(stock|share|mutual fund|sip|fd|gold|silver|crypto|bitcoin|invest)/)) return 'Investment';
    
    return null;
  };

  // Auto-detect category based on description
  useEffect(() => {
    // Clear suggestion if description is empty
    if (description.length === 0) {
      setSuggestion(null);
      return;
    }

    // 1. Show "analyzing" state immediately
    if (description.length > 0) {
      setSuggestion({ analyzing: true });
    }

    // 2. Try Local Match first (after 700ms to match the HTML behavior)
    const timer = setTimeout(async () => {
      if (description.length > 0) {
        const localMatch = predictLocal(description);
        if (localMatch) {
          setSuggestion({ category: localMatch, source: 'Instant Match', analyzing: false });
          return; // Skip AI if local match found
        }

        // 3. Try AI Match if no local match
        if (description.length > 2 && activeTab === 'manual') {
          setPredicting(true);
          const predicted = await predictCategory(description);
          
          if (predicted) {
            const match = categories.find(c => c.toLowerCase() === predicted.toLowerCase());
            if (match) {
              setSuggestion({ category: match, source: 'AI Analysis', analyzing: false });
            } else {
              setSuggestion({ noMatch: true, analyzing: false });
            }
          } else {
            setSuggestion({ noMatch: true, analyzing: false });
          }
          setPredicting(false);
        } else {
          setSuggestion({ noMatch: true, analyzing: false });
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [description, activeTab]);
  const [mood, setMood] = useState('neutral');

  // NLP State
  const [nlpText, setNlpText] = useState('');

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Salary', 'Investment', 'Other'];
  const moods = [
    { id: 'happy', icon: Smile, color: 'text-green-500' },
    { id: 'neutral', icon: Meh, color: 'text-yellow-500' },
    { id: 'sad', icon: Frown, color: 'text-red-500' },
  ];

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !walletId) return;

    setLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        description,
        category,
        walletId,
        date,
        type,
        mood
      });

      // Reset form
      setAmount('');
      setDescription('');
      setMood('neutral');
      
      // Show confirmation modal
      setConfirmationMessage('Transaction added successfully!');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      // Optional: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleNLPSubmit = async (e) => {
    e.preventDefault();
    if (!nlpText) return;

    setLoading(true);
    try {
      const result = await parseExpenseNLP(nlpText);

      if (result) {
        // Result is already normalized to an array by parseExpenseNLP
        const items = Array.isArray(result) ? result : [result];
        
        await Promise.all(items.map(item => 
          addTransaction({
            amount: item.amount,
            description: item.description || item.category,
            category: item.category || 'Other',
            walletId: walletId || (wallets[0]?.id || 'cash'), // Use selected wallet or safe fallback
            date: new Date().toISOString(),
            type: item.type || 'expense',
            mood: 'neutral'
          })
        ));
        
        setNlpText('');
        
        // Show confirmation modal
        setConfirmationMessage(`Successfully added ${items.length} transaction${items.length > 1 ? 's' : ''}!`);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 2000);
      } else {
        // Show error modal
        setConfirmationMessage('Failed to parse text. Please try again.');
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 2000);
      }
    } catch (error) {
      console.error('NLP Error:', error);
      setConfirmationMessage('An error occurred. Please try again.');
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold">Add Transaction</h2>
        <p className="text-slate-500">Track your spending or income manually or with AI.</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button 
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
        >
          Manual Entry
        </button>
        <button 
          onClick={() => setActiveTab('nlp')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'nlp' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}
        >
          AI Entry
        </button>
      </div>

      {activeTab === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          {/* Amount Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-4 text-3xl sm:text-4xl font-bold bg-transparent border-b-2 border-slate-100 dark:border-slate-700 focus:border-blue-500 outline-none transition-colors placeholder:text-slate-200 dark:placeholder:text-slate-700 no-spinner"
              autoFocus
            />
          </div>

          {/* Type Toggle */}
          <div className="flex gap-4">
            <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 text-center font-medium transition-all ${type === 'expense' ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20' : 'border-slate-100 dark:border-slate-700 text-slate-500'}`}>
              <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} className="hidden" />
              Expense
            </label>
            <label className={`flex-1 cursor-pointer p-3 rounded-xl border-2 text-center font-medium transition-all ${type === 'income' ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20' : 'border-slate-100 dark:border-slate-700 text-slate-500'}`}>
              <input type="radio" name="type" value="income" checked={type === 'income'} onChange={() => setType('income')} className="hidden" />
              Income
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Description</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (e.target.value.length === 0) setSuggestion(null);
                  }}
                  placeholder="What was this for?"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* AI Suggestion Box */}
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
                          <span className="typing-text">AI is analyzing your note</span>
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
                              <span className="capitalize text-slate-700 dark:text-slate-300">{suggestion.category}</span> matches your note.
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
                    ) : suggestion.noMatch ? (
                      // No match found
                      <div className="ai-box bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                        </svg>
                        No relevant category found from your note.
                      </div>
                    ) : null}
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
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} (₹{w.balance})</option>)}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                Category
                {predicting && <Sparkles size={14} className="text-purple-500 animate-pulse" />}
              </label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Mood Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500">How did this purchase make you feel?</label>
            <div className="flex gap-4">
              {moods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`flex-1 p-3 rounded-xl flex justify-center items-center transition-all ${mood === m.id ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-blue-500' : 'bg-slate-50 dark:bg-slate-900'}`}
                >
                  <m.icon className={mood === m.id ? m.color : 'text-slate-400'} />
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
            Add Transaction
          </button>
        </form>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center space-y-6">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto text-purple-600">
            <Mic size={32} />
          </div>
          <h3 className="text-xl font-bold">Tell me what you spent</h3>
          <p className="text-slate-500">Try saying: "I spent 500 on groceries and 200 on petrol today"</p>
          
          <form onSubmit={handleNLPSubmit} className="relative">
            <textarea
              value={nlpText}
              onChange={(e) => setNlpText(e.target.value)}
              placeholder="Type here..."
              className="w-full p-4 pr-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-purple-500 min-h-[120px] resize-none"
            />
            <button 
              type="submit" 
              disabled={loading || !nlpText}
              className="absolute bottom-4 right-4 p-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-700 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
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
