import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, XCircle, Wallet, Calendar, Tag, MessageSquare, Lock } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import axios from 'axios';

const SMSTransactionPopup = ({ smsTransaction, onClose, onConfirm, onReject }) => {
  const { wallets } = useExpense();
  const [type, setType] = useState(smsTransaction.confirmedType || 'expense');
  const [description, setDescription] = useState(smsTransaction.merchantName || '');
  const [category, setCategory] = useState('Shopping');
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Salary', 'Investment', 'Refund', 'Income', 'Others'];

  // Set default wallet to 'Online' for SMS transactions
  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      const onlineWallet = wallets.find(w => w.name.toLowerCase() === 'online');
      setWalletId(onlineWallet ? onlineWallet.id : wallets[0].id);
    }
  }, [wallets, walletId]);

  // Auto-suggest category based on merchant name and type
  useEffect(() => {
    if (smsTransaction.merchantName) {
      const merchantLower = smsTransaction.merchantName.toLowerCase();
      
      if (type === 'income') {
        if (merchantLower.includes('salary') || merchantLower.includes('company') || merchantLower.includes('pvt')) {
          setCategory('Salary');
        } else if (merchantLower.includes('refund') || merchantLower.includes('cashback')) {
          setCategory('Refund');
        } else if (merchantLower.includes('dividend') || merchantLower.includes('stock') || merchantLower.includes('mutual')) {
          setCategory('Investment');
        } else {
          setCategory('Salary'); // Default income category
        }
        return;
      }

      // Expense categories
      if (merchantLower.includes('swiggy') || merchantLower.includes('zomato') || merchantLower.includes('restaurant')) {
        setCategory('Food');
      } else if (merchantLower.includes('uber') || merchantLower.includes('ola') || merchantLower.includes('metro')) {
        setCategory('Transport');
      } else if (merchantLower.includes('amazon') || merchantLower.includes('flipkart') || merchantLower.includes('myntra')) {
        setCategory('Shopping');
      } else if (merchantLower.includes('electricity') || merchantLower.includes('water') || merchantLower.includes('gas')) {
        setCategory('Bills');
      } else if (merchantLower.includes('netflix') || merchantLower.includes('spotify') || merchantLower.includes('prime')) {
        setCategory('Entertainment');
      }
    }
  }, [smsTransaction.merchantName, type]);



  const handleConfirm = async () => {
    if (!walletId) {
      alert('Please select a wallet');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        type,
        description,
        category,
        walletId
      });
    } catch (error) {
      console.error('Failed to confirm transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject();
    } catch (error) {
      console.error('Failed to reject transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getPaymentAppIcon = (app) => {
    const icons = {
      'Google Pay': '🟢',
      'PhonePe': '🟣',
      'Paytm': '🔵',
      'BHIM UPI': '🟠',
      'Amazon Pay': '🟡',
      'Cred Pay': '💳',
      'Other': '💳'
    };
    return icons[app] || icons['Other'];
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Payment Detected!</h3>
                <p className="text-sm text-blue-100">Add this to your expenses?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Amount</p>
              <p className="text-4xl font-bold text-slate-900 dark:text-white">₹{smsTransaction.amount.toFixed(2)}</p>
            </div>
            
            {/* Payment App & Merchant */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Payment App</span>
                <span className="font-medium flex items-center gap-2">
                  <span className="text-xl">{getPaymentAppIcon(smsTransaction.paymentApp)}</span>
                  {smsTransaction.paymentApp}
                </span>
              </div>
              {smsTransaction.merchantName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Merchant</span>
                  <span className="font-medium">{smsTransaction.merchantName}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Time</span>
                <span className="font-medium">{formatDate(smsTransaction.smsTimestamp)}</span>
              </div>
            </div>
          </div>

          {/* Auto-detected Type indicator */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Transaction Type</span>
            </div>
            <span className={`text-sm font-black uppercase flex items-center gap-1 ${type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {type === 'income' ? '💰 Income (+)' : '💸 Expense (-)'}
              <span className="text-[10px] text-slate-400 italic font-normal">(Auto)</span>
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Description (Optional)
            </label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Wallet Info (Locked to Online) */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Auto-assigned Wallet</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Online Wallet</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase">
              <Lock size={10} />
              Reserved
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Ignore
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSTransactionPopup;
