import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const useSMSTransactions = () => {
    const [pendingTransactions, setPendingTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch pending SMS transactions
    const fetchPendingTransactions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_URL}/sms-transactions/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPendingTransactions(response.data);
        } catch (err) {
            console.error('Failed to fetch pending SMS transactions:', err);
            setError(err.response?.data?.message || 'Failed to fetch pending transactions');
        }
    }, []);

    // Parse and create SMS transaction
    const parseSMS = async (smsBody, smsFrom, smsTimestamp) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/sms-transactions/parse`,
                { smsBody, smsFrom, smsTimestamp },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh pending transactions
            await fetchPendingTransactions();

            return response.data.smsTransaction;
        } catch (err) {
            console.error('Failed to parse SMS:', err);
            setError(err.response?.data?.message || 'Failed to parse SMS');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Confirm SMS transaction
    const confirmTransaction = async (smsTransactionId, { type, description, category, walletId }) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/sms-transactions/${smsTransactionId}/confirm`,
                { type, description, category, walletId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove from pending list
            setPendingTransactions(prev => prev.filter(t => t._id !== smsTransactionId));

            return response.data.transaction;
        } catch (err) {
            console.error('Failed to confirm transaction:', err);
            setError(err.response?.data?.message || 'Failed to confirm transaction');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Reject SMS transaction
    const rejectTransaction = async (smsTransactionId) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/sms-transactions/${smsTransactionId}/reject`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove from pending list
            setPendingTransactions(prev => prev.filter(t => t._id !== smsTransactionId));
        } catch (err) {
            console.error('Failed to reject transaction:', err);
            setError(err.response?.data?.message || 'Failed to reject transaction');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Poll for pending transactions every 30 seconds
    useEffect(() => {
        fetchPendingTransactions();
        const interval = setInterval(fetchPendingTransactions, 5000); // Poll every 5 seconds for faster popup response
        return () => clearInterval(interval);
    }, [fetchPendingTransactions]);

    return {
        pendingTransactions,
        loading,
        error,
        parseSMS,
        confirmTransaction,
        rejectTransaction,
        refreshPending: fetchPendingTransactions
    };
};
