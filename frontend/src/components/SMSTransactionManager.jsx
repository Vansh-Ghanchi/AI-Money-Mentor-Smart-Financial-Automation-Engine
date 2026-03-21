import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpense } from '../context/ExpenseContext';
import SMSTransactionPopup from './SMSTransactionPopup';
import { useSMSTransactions } from '../hooks/useSMSTransactions';

const SMSTransactionManager = () => {
  const { user } = useAuth();
  const [currentSMSTransaction, setCurrentSMSTransaction] = useState(null);
  
  // Always call hooks at the top level
  const { refreshData } = useExpense();
  const { pendingTransactions, confirmTransaction, rejectTransaction } = useSMSTransactions();

  // Show popup for the first pending transaction
  useEffect(() => {
    // Only process if user is logged in
    if (!user) {
      setCurrentSMSTransaction(null);
      return;
    }

    if (pendingTransactions.length > 0 && !currentSMSTransaction) {
      setCurrentSMSTransaction(pendingTransactions[0]);
    }
  }, [pendingTransactions, currentSMSTransaction, user]);

  const handleConfirmSMS = async (data) => {
    if (!currentSMSTransaction) return;
    
    try {
      await confirmTransaction(currentSMSTransaction._id, data);
      await refreshData(); // Refresh global transactions and wallets
      setCurrentSMSTransaction(null);
    } catch (error) {
      console.error('Failed to confirm SMS transaction:', error);
    }
  };

  const handleRejectSMS = async () => {
    if (!currentSMSTransaction) return;
    
    try {
      await rejectTransaction(currentSMSTransaction._id);
      setCurrentSMSTransaction(null);
    } catch (error) {
      console.error('Failed to reject SMS transaction:', error);
    }
  };

  return (
    <>
      {currentSMSTransaction && (
        <SMSTransactionPopup
          smsTransaction={currentSMSTransaction}
          onClose={() => setCurrentSMSTransaction(null)}
          onConfirm={handleConfirmSMS}
          onReject={handleRejectSMS}
        />
      )}
    </>
  );
};

export default SMSTransactionManager;
