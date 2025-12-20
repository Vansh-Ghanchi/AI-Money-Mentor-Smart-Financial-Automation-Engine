import React, { useState, useRef, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { chatWithCFO } from '../services/ai';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';

const Chatbot = () => {
  const { transactions, wallets, budget, subscriptions } = useExpense();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI CFO. Ask me anything about your spending, budget, or financial advice.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Prepare context
    // Prepare context
    const simplifiedTransactions = transactions.map(t => ({
      date: t.date.split('T')[0],
      amount: t.amount,
      category: t.category,
      type: t.type,
      desc: t.description
    }));

    const contextData = {
      totalBalance: wallets.reduce((acc, w) => acc + w.balance, 0),
      monthlyBudget: budget.limit,
      monthlySpend: transactions
        .filter(t => {
          const d = new Date(t.date);
          const now = new Date();
          return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
      wallets: wallets.map(w => ({ name: w.name, balance: w.balance, type: w.type })),
      transactions: simplifiedTransactions,
      subscriptions: subscriptions.map(s => ({ name: s.name, amount: s.amount, due: s.nextDate }))
    };

    const response = await chatWithCFO(userMessage, contextData);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-8 right-4 md:right-8 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-[90vw] md:w-[400px] h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <h3 className="font-bold">AI CFO</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700">
                  <Loader2 className="animate-spin text-blue-600" size={20} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              className="flex-1 p-2 bg-slate-100 dark:bg-slate-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
