import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../context/ExpenseContext';
import { Wallet, CreditCard, Banknote, Smartphone, Plus, X, Trash2 } from 'lucide-react';

const Wallets = () => {
  const navigate = useNavigate();
  const { wallets, transactions, addWallet, deleteWallet } = useExpense();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('cash');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [walletToDelete, setWalletToDelete] = useState(null);

  const getIcon = (type) => {
    switch (type) {
      case 'cash': return Banknote;
      case 'card': return CreditCard;
      case 'upi': return Smartphone;
      default: return Wallet;
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (newWalletName.trim()) {
      // Check for duplicate wallet name
      const duplicateWallet = wallets.find(
        w => w.name.toLowerCase() === newWalletName.trim().toLowerCase()
      );
      
      if (duplicateWallet) {
        setErrorMessage('You have already added a wallet with this name. Please create a new one with a different name.');
        return;
      }

      try {
        await addWallet({
          id: Date.now().toString(),
          name: newWalletName.trim(),
          balance: 0,
          type: newWalletType
        });
        setNewWalletName('');
        setNewWalletType('cash');
        setShowAddModal(false);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } catch (error) {
        console.error('Add wallet error:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to add wallet. Please try again.';
        setErrorMessage(errorMsg);
      }
    }
  };

  const handleDeleteWallet = async () => {
    if (walletToDelete) {
      try {
        await deleteWallet(walletToDelete.id);
        setWalletToDelete(null);
      } catch (error) {
        console.error('Delete wallet error:', error);
        setErrorMessage('Failed to delete wallet. Please try again.');
        setWalletToDelete(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold">My Wallets</h2>
            <p className="text-slate-500">Manage your accounts and balances</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          <span className="font-bold">Add Wallet</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((wallet) => {
          const Icon = getIcon(wallet.type);
          
          return (
            <div 
              key={wallet.id}
              className="p-6 rounded-2xl transition-all border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 shrink-0">
                  <Icon size={24} />
                </div>
                <div className="text-right min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black truncate">{wallet.type}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1 truncate" title={wallet.name}>{wallet.name}</h3>
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white break-all">₹{wallet.balance.toFixed(2).toLocaleString()}</p>
                {/* Only show delete button for non-default wallets */}
                {wallet.name.toLowerCase() !== 'cash' && wallet.name.toLowerCase() !== 'online' && (
                  <button
                    onClick={() => setWalletToDelete(wallet)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shrink-0"
                    title="Delete wallet"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Wallet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold">Add New Wallet</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 text-center">
              <form id="add-wallet-form" onSubmit={handleAddWallet} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Wallet Name
                    </label>
                    <input
                      type="text"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      placeholder="e.g., My Savings"
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Wallet Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'cash', label: 'Cash', icon: Banknote },
                        { id: 'card', label: 'Card', icon: CreditCard },
                        { id: 'upi', label: 'UPI', icon: Smartphone }
                      ].map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewWalletType(t.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                              newWalletType === t.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                : 'border-slate-50 dark:border-slate-900 text-slate-400'
                            }`}
                          >
                            <Icon size={20} />
                            <span className="text-[10px] font-bold uppercase">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                form="add-wallet-form"
                type="submit"
                className="flex-1 px-4 py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
              >
                Add Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Success!</h3>
                <p className="text-slate-600 dark:text-slate-300">Wallet added successfully!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setErrorMessage('')}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Duplicate Wallet Name</h3>
                <p className="text-slate-600 dark:text-slate-300">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {walletToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setWalletToDelete(null)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Wallet?</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-1">
                  Are you sure you want to delete <strong>"{walletToDelete.name}"</strong>?
                </p>
                <p className="text-sm text-slate-500">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setWalletToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWallet}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
