import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Download, Upload, Trash2, Shield, Bell, User, LogOut, LogIn, Wallet, ChevronRight, Users, Clock } from 'lucide-react';
import axios from 'axios';
import ConfirmationModal from '../components/ConfirmationModal';
import StatusModal from '../components/StatusModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { theme, toggleTheme, budget, setBudget, transactions, wallets, subscriptions } = useExpense();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [newLimit, setNewLimit] = useState(budget.limit);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [businessMembers, setBusinessMembers] = useState([]);
  const [businessLogo, setBusinessLogo] = useState(null); // Local state for logo
  const [loadingBusiness, setLoadingBusiness] = useState(false);

  // Modal States
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  /* Polling for real-time status updates */
  React.useEffect(() => {
    let interval;
    if (user?.businessId) {
      fetchBusinessMembers(); // Initial fetch
      interval = setInterval(fetchBusinessMembers, 60000); // Poll every minute
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const fetchBusinessMembers = async () => {
    // Only set loading on initial load or manual refresh, not polling
    // We can check if businessMembers is empty to decide whether to show spinner
    if (businessMembers.length === 0) setLoadingBusiness(true);
    
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/business/me`);
      setBusinessMembers(res.data.partners || []);
      // Only set logo if not already set or changed (optional optimization, but simple set is fine)
      if (!businessLogo) setBusinessLogo(res.data.logo || null); 
    } catch (error) {
      console.error('Failed to fetch business members:', error);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const updateLogo = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsLogoUploading(true);
      try {
        const logoData = reader.result;
        await axios.put(`${import.meta.env.VITE_API_URL}/business/logo`, { logo: logoData });
        setBusinessLogo(logoData);
        setSuccessMessage("Successfully added");
        setIsSuccessOpen(true);
      } catch (error) {
        console.error("Failed to update logo", error);
        alert("Failed to update logo");
      } finally {
        setIsLogoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setIsRemoveConfirmOpen(true);
  };
  
  const confirmRemoveLogo = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/business/logo`);
      setBusinessLogo(null);
      setIsRemoveConfirmOpen(false);
      setSuccessMessage("Successfully removed");
      setIsSuccessOpen(true);
    } catch (error) {
      console.error("Failed to remove logo", error);
      alert("Failed to remove logo");
      setIsRemoveConfirmOpen(false);
    }
  };

  const formatLastActive = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    // Check if it's "Yesterday" in calendar days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);

    // Logic:
    // 1. If < 24h ago: Show "X hours/minutes ago"
    // 2. If calendar day is yesterday: Show "Yesterday"
    // 3. Else: Show full date
    
    // Note: The "24h" check (diffInMs) might conflict with "Yesterday" if it was 23 hours ago but yesterday calendar day.
    // The user requirement says "If a user was active within the last 24 hours, show the hours ago".
    // "If the user was last active yesterday, show Yesterday".
    // Use diffInHours for strict 24h window.

    if (diffInMs < 24 * 60 * 60 * 1000) {
        if (diffInMinutes < 60) {
            return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } 
    
    if (activityDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } 
    
    // Fallback to absolute date
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isUserActive = (dateString) => {
    if (!dateString) return false;
    const diffInMs = new Date() - new Date(dateString);
    return diffInMs < 5 * 60 * 1000; // Consider active if seen in last 5 minutes
  };

  const handleSaveBudget = () => {
    setBudget({ ...budget, limit: parseFloat(newLimit) });
    alert('Budget updated!');
  };

  const exportToCSV = () => {
    // Define CSV headers
    const headers = ['Date', 'Amount', 'Category', 'Description', 'Wallet'];
    
    // Add "Performed By" column if user is part of a business
    if (user?.businessId) {
      headers.push('Performed By');
    }
    
    // Format transaction data
    const rows = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString();
      // Escape quotes and handle commas in description
      const description = t.description ? `"${t.description.replace(/"/g, '""')}"` : '';
      const walletName = wallets.find(w => w.id === t.walletId)?.name || t.walletId;
      
      let row = [date, t.amount, t.category, description, walletName];
      
      if (user?.businessId) {
        // Use addedBy.name if populated, otherwise fallback
        const addedByName = t.addedBy?.name || 'Unknown';
        row.push(addedByName);
      }
      
      return row.join(',');
    });

    // Prepare content
    let csvContent = '';
    
    // Add Business Name as first line if applicable
    if (user?.businessId?.name) {
      csvContent += `${user.businessId.name}\n`; // Simple banner line
    }
    
    csvContent += [headers.join(','), ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    let yPos = 22;

    // Add Business Name (Center Aligned) if applicable
    if (user?.businessId?.name) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(user.businessId.name, 105, yPos, { align: 'center' }); // 105 is center of A4

      // Use local state if available (updates immediately), fallback to user context
      const logoToUse = businessLogo || user.businessId.logo;

      if (logoToUse) {
        try {
            // Robustly extract format from Data URI (e.g. data:image/png;base64,...)
            // Matches "image/png" or "image/jpeg" etc.
            const match = logoToUse.match(/^data:image\/(\w+);base64,/);
            let format = 'PNG'; // Default fallback
            
            if (match && match[1]) {
                format = match[1].toUpperCase();
            }

            // Handle standard aliases for jsPDF
            if (format === 'JPG') format = 'JPEG';
            
            // Validate supported formats
            const supportedFormats = ['PNG', 'JPEG', 'WEBP'];
            if (!supportedFormats.includes(format)) {
                 console.warn(`Unsupported logo format: ${format}. Attempting to add anyway.`);
            }

            // Add image. Format: doc.addImage(imageData, format, x, y, width, height)
            doc.addImage(logoToUse, format, 160, 10, 25, 25); // Top right
        } catch (e) {
            console.error("Error adding logo to PDF:", e);
            // Don't block PDF generation, just log error
        }
      }
      
      yPos += 10;
    }

    // Add Report Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('Expense Report', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, yPos);
    yPos += 10; // Spacing before table

    // Define columns
    const columns = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Wallet', dataKey: 'wallet' },
    ];

    // Add "Performed By" column if user is part of a business
    if (user?.businessId) {
      columns.push({ header: 'Performed By', dataKey: 'performedBy' });
    }

    // Format data
    const data = transactions.map(t => {
      const row = {
        date: new Date(t.date).toLocaleDateString(),
        amount: `Rs. ${t.amount}`,
        category: t.category,
        description: t.description || '-',
        wallet: wallets.find(w => w.id === t.walletId)?.name || t.walletId
      };

      if (user?.businessId) {
        row.performedBy = t.addedBy?.name || 'Unknown';
      }

      return row;
    });

    // Generate table
    autoTable(doc, {
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => row[c.dataKey])),
      startY: yPos,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] }, // Blue-600
    });

    doc.save(`expense_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  /* New Import/Export handlers */
  // Import functionality removed

  const handleExportJSON = async () => {
    try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/data/export`);
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", "expense_backup_" + new Date().toISOString().split('T')[0] + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url); // Clean up memory
    } catch (error) {
        console.error("Export failed", error);
        alert("Failed to export data");
    }
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-slate-500">Customize your experience</p>
      </header>

      {/* Mobile Only: Wallets Quick Access */}
      <section className="md:hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4">Quick Access</h3>
        <button 
          onClick={() => navigate('/wallets')}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <span className="font-medium">Manage Wallets</span>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </button>
      </section>

      {/* Account Section */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4">Account</h3>
        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-xl">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{user.name || 'User'}</p>
                <p className="text-sm text-slate-500 truncate">{user.email || user.phone}</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">Not Logged In</p>
                <p className="text-sm text-slate-500">Sign in to sync your data</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                <LogIn size={18} />
                Login
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Signup
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Business Management Section - Only for business accounts */}
      {user?.businessId && (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg">Business Management</h3>
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest">
                {businessMembers.length} Members
                </div>
            </div>

            {/* Logo Management UI */}
            <div className="flex items-center gap-3">
                {businessLogo ? (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                         <div className="h-10 w-10 relative group shrink-0">
                            <img src={businessLogo} alt="Logo" className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
                         </div>
                         <div className="flex gap-2">
                             <label className="cursor-pointer px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors">
                                Change
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && updateLogo(e.target.files[0])} />
                             </label>
                             <button onClick={() => removeLogo()} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                Remove
                             </button>
                         </div>
                    </div>
                ) : (
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-200 dark:shadow-none transition-all hover:scale-105 active:scale-95">
                        <span className="text-lg leading-none">+</span> Add Business Logo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && updateLogo(e.target.files[0])} />
                    </label>
                )}
            </div>
          </div>

          <div className="space-y-4">
            {loadingBusiness ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              businessMembers.map((member) => {
                const active = isUserActive(member.lastActive);
                return (
                  <div key={member._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                          {member.name[0].toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${active ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{member.name} {member._id === user._id && <span className="text-[10px] text-blue-500 font-black ml-1">(You)</span>}</p>
                        <p className="text-[10px] text-slate-500 truncate font-medium">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      {active ? (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-[10px] font-black uppercase tracking-tighter">Active Now</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Inactive</span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                            <Clock size={10} />
                            {formatLastActive(member.lastActive)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-300">Managed Account</p>
                <p className="text-[10px] text-blue-700/70 dark:text-blue-400/70 mt-0.5">
                  This account is part of <strong>{user.businessId?.name}</strong>. Data is shared among all active partners.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Appearance */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4">Appearance</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-slate-500">Switch between light and dark themes</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>
      </section>

      {/* Budget */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4">Budget Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Monthly Budget Limit</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={newLimit} 
                onChange={(e) => setNewLimit(e.target.value)}
                className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-none no-spinner"
              />
              <button onClick={handleSaveBudget} className="px-6 py-2 bg-blue-600 text-white rounded-xl">Save</button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Download size={20} className="text-blue-600" />
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-slate-500">Download your data in various formats</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={exportToCSV} 
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                CSV (Excel)
              </button>
              <button 
                onClick={exportToPDF} 
                className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                PDF (Report)
              </button>
              <button 
                onClick={handleExportJSON} 
                className="flex-1 px-4 py-2 text-sm font-medium text-emerald-600 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                JSON (Backup)
              </button>
            </div>
          </div>

          {/* Import Data Removed */}

          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-red-600" />
              <div>
                <p className="font-medium text-red-600">Reset App Settings</p>
                <p className="text-sm text-red-400">Clear local cache & logout (Data Safe)</p>
              </div>
            </div>
            <button 
              onClick={() => setIsClearModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <ConfirmationModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearData}
        title="Reset App Settings?"
        message="This will log you out and reset your local theme preferences. Your account data (transactions & wallets) remains SAFE on the server."
        confirmText="Yes, Reset"
        cancelText="Cancel"
        isDangerous={false}
      />

      {/* Logo Removal Confirmation */}
      <ConfirmationModal 
        isOpen={isRemoveConfirmOpen}
        onClose={() => setIsRemoveConfirmOpen(false)}
        onConfirm={confirmRemoveLogo}
        title="Remove Business Logo?"
        message="Are you sure you want to remove the business logo? This will affect all reports generated by your business members."
        confirmText="Remove"
        cancelText="Cancel"
        isDangerous={true}
      />

      {/* Success Modal */}
      <StatusModal 
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        message={successMessage}
      />

      {/* Upload/Import Loading State */}
      <LoadingSpinner isOpen={isLogoUploading} message="Updating Logo..." />
    </div>
  );
};

export default Settings;
