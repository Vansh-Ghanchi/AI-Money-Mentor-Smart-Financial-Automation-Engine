import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext();

export const useExpense = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('budget');
    return saved ? JSON.parse(saved) : { limit: 50000, period: 'monthly' };
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      // Clear data on logout
      setTransactions([]);
      setWallets([]);
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh data every 10 seconds to catch new SMS transactions
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      // Silently fetch new data without showing loading state
      fetchDataSilently();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  const fetchDataSilently = async () => {
    try {
      const [txRes, walletRes] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/transactions`),
        axios.get(`${import.meta.env.VITE_API_URL}/wallets`)
      ]);
      
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.data);
      }
      
      if (walletRes.status === 'fulfilled') {
        setWallets(walletRes.value.data);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled instead of Promise.all to handle partial failures
      const [txRes, walletRes] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/transactions`),
        axios.get(`${import.meta.env.VITE_API_URL}/wallets`)
      ]);
      
      // Set data for successful requests, keep previous state for failed ones
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.data);
      } else {
        console.error('Error fetching transactions:', txRes.reason);
      }
      
      if (walletRes.status === 'fulfilled') {
        setWallets(walletRes.value.data);
      } else {
        console.error('Error fetching wallets:', walletRes.reason);
      }
    } catch (error) {
      console.error('Unexpected error fetching data:', error);
      // Set empty arrays as fallback
      setTransactions([]);
      setWallets([]);
    } finally {
      // Always set loading to false, even if all requests fail
      setLoading(false);
    }
  };

  // Keep local settings (budget, theme) in localStorage for now
  useEffect(() => {
    localStorage.setItem('budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const addTransaction = async (transaction) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/transactions`, transaction);
      setTransactions((prev) => [res.data, ...prev]);
      
      // Refresh wallets to get updated balances
      const walletRes = await axios.get(`${import.meta.env.VITE_API_URL}/wallets`);
      setWallets(walletRes.data);
      
      return res.data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t._id !== id));
      
      // Refresh wallets to get updated balances
      const walletRes = await axios.get(`${import.meta.env.VITE_API_URL}/wallets`);
      setWallets(walletRes.data);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id, updates) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/transactions/${id}`, updates);
      setTransactions(prev => prev.map(t => t._id === id ? res.data : t));
      
      // Refresh wallets to get updated balances
      const walletRes = await axios.get(`${import.meta.env.VITE_API_URL}/wallets`);
      setWallets(walletRes.data);
      
      return res.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };


  const addWallet = async (wallet) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/wallets`, wallet);
      setWallets(prev => [...prev, res.data]);
      return res.data;
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  };

  const deleteWallet = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/wallets/${id}`);
      setWallets(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  };

  const transfer = async (fromWalletId, toWalletId, amount, description, date) => {
    try {
      const transaction = {
        amount: parseFloat(amount),
        description: description || 'Transfer',
        category: 'Transfer',
        walletId: fromWalletId,
        toWalletId: toWalletId,
        date: date || new Date().toISOString(),
        type: 'transfer',
        mood: 'neutral'
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/transactions`, transaction);
      setTransactions(prev => [res.data, ...prev]);
      
      // Refresh wallets to get updated balances
      const walletRes = await axios.get(`${import.meta.env.VITE_API_URL}/wallets`);
      setWallets(walletRes.data);
      
      return res.data;
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getBalance = () => {
    return wallets.reduce((acc, curr) => acc + curr.balance, 0);
  };

  const getMonthlySpend = () => {
    const now = new Date();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  };

  return (
    <ExpenseContext.Provider value={{
      transactions,
      wallets,
      budget,
      theme,
      loading,
      setBudget,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      toggleTheme,
      getBalance,
      getMonthlySpend,
      setWallets, 
      addWallet,
      deleteWallet,
      transfer,
      refreshData: fetchData
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};
