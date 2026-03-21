import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Download, Upload, Trash2, Shield, Bell, User, LogOut, LogIn, Wallet, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import axios from 'axios';
import ConfirmationModal from '../components/ConfirmationModal';
import StatusModal from '../components/StatusModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import HTMLFlipBook from 'react-pageflip';
import { X, BookOpen } from 'lucide-react';

// 1. STABLE PAGE COMPONENT (Defined outside to prevent re-creation)
const Page = React.forwardRef(({ children, number, density }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-[#fdfcf0] dark:bg-slate-900 shadow-inner flex flex-col border-l border-slate-200 dark:border-slate-800 h-full w-full overflow-hidden"
        data-density={density || "soft"}
      >
        <div className="flex-1 flex flex-col p-4 sm:p-6 pb-3 sm:pb-4 select-none overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 text-[8px] sm:text-[10px] text-slate-400 font-bold flex justify-between border-t border-slate-100 dark:border-slate-800 uppercase tracking-tighter shrink-0">
             <span>ExpenseAI Ledger</span>
             <span>PG {number}</span>
          </div>
        </div>
      </div>
    );
  });
  
  // 2. STABLE OVERLAY COMPONENT (Memoized to isolate from Settings re-renders)
    const PhysicalReportOverlay = React.memo(({ isOpen, onClose, transactions, wallets, user, isMobile, theme }) => {
    const flipBook = useRef();
  
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;
  
    const handlePrevPage = () => {
      if (flipBook.current) flipBook.current.pageFlip().flipPrev();
    };
  
    const handleNextPage = () => {
      if (flipBook.current) flipBook.current.pageFlip().flipNext();
    };
  
    // Calculate dimensions based on viewport
    const pageWidth = isMobile ? window.innerWidth : 400;
    const pageHeight = isMobile ? window.innerHeight * 0.75 : 600;

    const modalContent = (
      <div className={`fixed inset-0 z-[100000] flex flex-col items-center overflow-hidden ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        {/* Superior Backdrop */}
        <div className={`absolute inset-0 z-[-1] ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`} />

        {/* Close Button - More Prominent for Mobile */}
        <button 
            onClick={onClose}
            className={`absolute top-6 right-6 p-4 rounded-full transition-all z-[100002] border backdrop-blur-xl active:scale-90 ${
                theme === 'dark' 
                ? 'bg-white/10 hover:bg-red-500/20 text-white border-white/10' 
                : 'bg-black/5 hover:bg-red-500/10 text-slate-900 border-black/10'
            }`}
        >
            <X size={28} />
        </button>
  
        <div className="w-full h-full flex flex-col items-center justify-between py-6 sm:py-10">
            {/* Header branding */}
            <div className="text-center px-4 animate-slide-down">
                <div className={`inline-flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                    <BookOpen className="text-blue-500" size={16} /> 
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Official Ledger</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Financial Report
                </h2>
            </div>
  
            {/* The Book */}
            <div className="relative w-full flex-1 flex justify-center items-center my-4 overflow-visible">
                 <HTMLFlipBook 
                    key="stable-report-portal"
                    ref={flipBook}
                    width={pageWidth} 
                    height={pageHeight}
                    size={isMobile ? "stretch" : "fixed"}
                    minWidth={200}
                    maxWidth={450}
                    minHeight={300}
                    maxHeight={700}
                    showCover={true}
                    mobileScrollSupport={true}
                    flippingTime={800}
                    usePortrait={isMobile}
                    startPage={0}
                    drawShadow={true}
                    className="shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] antialiased"
                >
                    {/* FRONT COVER */}
                    <div className={`p-8 sm:p-14 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white' : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'}`} data-density="hard">
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 shadow-2xl backdrop-blur-sm mx-auto">
                                <BookOpen size={isMobile ? 40 : 56} className="text-blue-400" />
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-black text-white mb-6 uppercase tracking-[-0.05em] leading-none">
                                EXPENSE<br/><span className="text-blue-500 opacity-90">LEDGER</span>
                            </h1>
                            <div className="w-16 h-1.5 bg-blue-500 rounded-full mb-8 mx-auto shadow-lg shadow-blue-500/50"></div>
                            
                            <div className="space-y-1 mb-10">
                                <p className="text-white font-bold text-lg tracking-tight truncate max-w-[250px] mx-auto">
                                    {user?.businessId?.name || user?.name || 'Authorized Member'}
                                </p>
                                <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">Fiscal Period {new Date().getFullYear()}</p>
                            </div>
                            
                            <div className="py-3 px-6 border border-white/10 bg-white/5 rounded-2xl text-[10px] sm:text-xs text-white/40 uppercase tracking-[0.3em] font-black backdrop-blur-md inline-block">
                                Confidential Document
                            </div>
                        </div>
                    </div>
  
                    {/* SUMMARY */}
                    <Page number={1} density="soft">
                        <div className="h-full flex flex-col pt-2">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-6 tracking-tighter">System Summary</h3>
                            <div className="space-y-5">
                                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Clock size={48} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Transactions</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{transactions.length}</p>
                                        <span className="text-xs text-slate-400 font-bold uppercase">Logged</span>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Active Wallets</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{wallets.length}</p>
                                        <span className="text-xs text-slate-400 font-bold uppercase">Linked</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 p-5 border-l-4 border-blue-500 bg-blue-500/5 rounded-r-xl">
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                        This automated ledger provides a high-fidelity audit trail of all verified financial activities.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Page>
  
                    {/* TRANSACTION PAGES */}
                    {(() => {
                        const pageSize = isMobile ? 5 : 7;
                        const pages = [];
                        for (let i = 0; i < transactions.length; i += pageSize) {
                            const chunk = transactions.slice(i, i + pageSize);
                            pages.push(
                                <Page key={`portal-page-${i}`} number={pages.length + 2} density="soft">
                                    <div className="h-full flex flex-col pt-2">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Activity Log</h3>
                                            <div className="w-8 h-1 bg-slate-100 dark:bg-white/5 rounded-full" />
                                        </div>
                                        <div className="space-y-4 sm:space-y-5 flex-1">
                                            {chunk.map((t, idx) => (
                                                <div key={`ptx-${i}-${idx}`} className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                                                    <div className="min-w-0 pr-4 flex-1">
                                                        <p className="text-[11px] sm:text-[13px] font-black text-slate-800 dark:text-white truncate mb-0.5 tracking-tight">{t.category}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-tighter shrink-0">{new Date(t.date).toLocaleDateString()}</p>
                                                            <span className="w-1 h-1 bg-slate-300 dark:bg-white/10 rounded-full shrink-0" />
                                                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate italic font-medium">{t.description || 'Verified Tx'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <p className="text-[11px] sm:text-[13px] font-black text-slate-900 dark:text-white tracking-tight">₹{t.amount}</p>
                                                        <p className="text-[8px] font-black text-blue-500/70 uppercase tracking-tighter leading-none mt-1">
                                                            {wallets.find(w => w.id === t.walletId || w._id === t.walletId)?.name || 'Credit'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Page>
                            );
                        }
                        
                        if (!isMobile && (pages.length + 3) % 2 !== 0) {
                            pages.push(
                                <Page key="portal-empty" number={pages.length + 2} density="soft">
                                    <div className="h-full flex flex-col items-center justify-center text-slate-200 dark:text-white/10 text-center">
                                        <div className="p-6 border-2 border-dashed border-current rounded-[2rem] opacity-30 group-hover:opacity-100 transition-opacity">
                                            <BookOpen size={48} />
                                            <p className="mt-4 font-black uppercase tracking-[0.2em] text-[10px]">End of Records</p>
                                        </div>
                                    </div>
                                </Page>
                            );
                        }
  
                        return pages;
                    })()}
  
                    {/* BACK COVER */}
                    <div className={`p-8 sm:p-14 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-indigo-900'}`} data-density="hard">
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 sm:w-20 bg-white/5 rounded-2xl flex items-center justify-center mb-8 mx-auto border border-white/10 shadow-xl">
                                <Shield size={isMobile ? 32 : 40} className="text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Audit Complete</p>
                            <div className="w-8 h-1 bg-white/10 rounded-full mb-6 mx-auto"></div>
                            <div className="text-[9px] text-slate-600 dark:text-slate-500 max-w-[150px] mx-auto leading-relaxed font-bold uppercase tracking-tight">
                                This document is a generated representation of cloud-stored data. Verified by ExpenseAI.
                            </div>
                        </div>
                    </div>
                </HTMLFlipBook>
            </div>
            
            {/* Footer Navigation */}
            <div className="flex items-center gap-8 py-4 sm:py-8 animate-slide-up">
                <button 
                    onClick={handlePrevPage}
                    className="group flex flex-col items-center gap-2"
                    aria-label="Previous Page"
                >
                    <div className={`p-4 rounded-full transition-all group-active:scale-90 border ${
                        theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' 
                        : 'bg-black/5 hover:bg-black/10 text-slate-900 border-black/5'
                    }`}>
                        <ChevronLeft size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-white/30 group-hover:text-white/60' : 'text-slate-400 group-hover:text-slate-600'}`}>Prev</span>
                </button>

                <div className={`h-10 w-[1px] ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} />

                <button 
                    onClick={handleNextPage}
                    className="group flex flex-col items-center gap-2"
                    aria-label="Next Page"
                >
                    <div className={`p-4 rounded-full transition-all group-active:scale-90 border ${
                        theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' 
                        : 'bg-black/5 hover:bg-black/10 text-slate-900 border-black/5'
                    }`}>
                        <ChevronRight size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-white/30 group-hover:text-white/60' : 'text-slate-400 group-hover:text-slate-600'}`}>Next</span>
                </button>
            </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
  });


const Settings = () => {
  const { theme, toggleTheme, budget, setBudget, transactions, wallets } = useExpense();
  const { user, logout, refreshUser } = useAuth();
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
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [flipbookTransactions, setFlipbookTransactions] = useState([]);
  const [flipbookWallets, setFlipbookWallets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  


  /* Polling for real-time status updates and logo */
  React.useEffect(() => {
    let interval;
    if (user) {
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
    if (file.size > 2 * 1024 * 1024) {
      setSuccessMessage("File size too large. Please upload a logo smaller than 2MB.");
      setIsSuccessOpen(true);
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsLogoUploading(true);
      try {
        const logoData = reader.result;
        await axios.put(`${import.meta.env.VITE_API_URL}/business/logo`, { logo: logoData });
        setBusinessLogo(logoData);
        await refreshUser(); // Sync user state to get businessId if new
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
      await refreshUser();
      setIsRemoveConfirmOpen(false);
      setSuccessMessage("Successfully removed");
      setIsSuccessOpen(true);
    } catch (error) {
      console.error("Failed to remove logo", error);
      alert("Failed to remove logo");
      setIsRemoveConfirmOpen(false);
    }
  };

  const formatLastActive = (dateString, createdAt) => {
    const rawDate = dateString || createdAt;
    if (!rawDate) return 'Never';
    
    const date = new Date(rawDate);
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

    // 1. Within last 24 hours
    if (diffInMs < 24 * 60 * 60 * 1000) {
        if (diffInMinutes < 60) {
            return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } 
    
    // 2. Calendar day was yesterday
    if (activityDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } 
    
    // 3. Fallback to absolute date
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
    const itemsPerPage = 20;

    // Define table columns
    const columns = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Wallet', dataKey: 'wallet' },
    ];

    if (user?.businessId) {
      columns.push({ header: 'Performed By', dataKey: 'performedBy' });
    }

    // Process all transactions
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const totalPages = Math.ceil(safeTransactions.length / itemsPerPage) || 1;

    for (let i = 0; i < totalPages; i++) {
        if (i > 0) doc.addPage();
        
        // Reset styles for new page
        doc.setTextColor(0, 0, 0);
        
        const chunk = safeTransactions.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
        
        // ---------------- Header ----------------
        let yPos = 22;
        let logoError = false;
        
        // Business Name
        // ---------------- Mandatory App Logo (ExpenseAI) ----------------
        // Position: Top Left (Discrete Branding)
        const appLogo = '/assets/logo.png'; 
        try {
            doc.setFont('helvetica', 'normal');
            doc.addImage(appLogo, 'PNG', 14, 12, 10, 10); // Moved down and slightly smaller
            doc.setFontSize(7);
            doc.setTextColor(180);
            doc.text("ExpenseAI", 25, 18); // Aligned with logo center
        } catch (e) {
            console.error("App logo error", e);
        }

        // ---------------- Header Content ----------------
        doc.setTextColor(0, 0, 0); // Reset color
        
        const businessName = user?.businessId?.name;
        const businessLogoToUse = businessLogo || user?.businessId?.logo;
        
        // Title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(businessName || "Personal Expense Report", 105, 21, { align: 'center' });

        // Logo
        if (businessLogoToUse) {
            try {
                const match = businessLogoToUse.match(/^data:image\/(\w+);base64,/);
                let format = match ? match[1].toUpperCase() : 'PNG';
                if (format === 'JPG') format = 'JPEG';
                doc.addImage(businessLogoToUse, format, 175, 10, 18, 18);
            } catch (e) {
                console.error("Business logo error", e);
            }
        }
        yPos = businessName ? 42 : 38;

        // Sub-header details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, yPos);
        


        // Hint for animations (First Page Only)
        if (i === 0) {
            yPos += 6;
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text("(Open in Adobe Acrobat Reader (Full Screen) to see page-turn animations)", 14, yPos);
            doc.setTextColor(0, 0, 0);
        }

        yPos += 10;

        // ---------------- Table ----------------
        const data = chunk.map(t => {
            const row = {
                date: new Date(t.date).toLocaleDateString(),
                amount: `Rs. ${t.amount}`,
                category: t.category,
                description: t.description || '-',
                wallet: wallets?.find(w => w.id === t.walletId)?.name || 'Wallet'
            };
            if (user?.businessId) {
                row.performedBy = t.addedBy?.name || 'Unknown';
            }
            return row;
        });

        autoTable(doc, {
            head: [columns.map(c => c.header)],
            body: data.map(row => columns.map(c => row[c.dataKey])),
            startY: yPos,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [37, 99, 235] },
            margin: { bottom: 20 },
            // Don't auto page break inside this chunk of 20 - we want exactly 20.
            pageBreak: 'avoid', 
        });

        // ---------------- Footer ----------------
        const pageHeight = doc.internal.pageSize.height || 297;
        const footerY = pageHeight - 10;
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`ID: ${user?._id || user?.id || '---'} | CONFIDENTIAL`, 14, footerY);
        doc.text(`Page ${i + 1} of ${totalPages}`, 105, footerY, { align: 'center' });
        doc.text(`Page ${i + 1}`, 196, footerY, { align: 'right' });
        doc.setTextColor(0, 0, 0);

        // ---------------- Navigation Arrows (Interactive) ----------------
        doc.setFontSize(24);
        doc.setTextColor(59, 130, 246); // Blue-500
        doc.setFont('courier', 'bold'); // Monospace for easier centering

        // NEXT Arrow (Bottom Right) - Only if not last page
        if (i < totalPages - 1) {
            const nextX = 200;
            const nextY = 150; // Vertical Center
            
            // Draw visually
            doc.text('>', nextX, nextY);
            
            // Add interaction: Link to next page (pageNumber is 1-based, so i+1 is current, i+2 is next)
            // doc.link(x, y, w, h, options)
            doc.link(nextX - 2, nextY - 5, 10, 10, { pageNumber: i + 2 });
        }

        // PREV Arrow (Bottom Left) - Only if not first page
        if (i > 0) {
            const prevX = 10;
            const prevY = 150;
            
            doc.text('<', prevX, prevY);
            doc.link(prevX - 2, prevY - 5, 10, 10, { pageNumber: i }); // i is previous (1-based because loop is 0-based but effectively current is i+1, so prev is i)
        }
    }
    
    // Set Viewer Preferences
    try {
        if (doc.setViewerPreferences) {
            doc.setViewerPreferences({
                'PageLayout': 'SinglePage', 
                'FitWindow': true,
                'HideToolbar': true,
                'CenterWindow': true
            });
        }
    } catch (e) {
        console.log("Preferences error");
    }

    // Inject Page Transitions (Push/Slide effect)
    // /S /Push = Push effect (New page pushes old page off screen)
    // /D 1.0 = 1 second duration (Slower for visibility)
    // /Di 180 = Moves Right-to-Left (Like turning a page forward)
    // Note: This requires Adobe Reader (Full Screen) or compatible presentation software.
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        if (doc.internal.pages[p]) {
            doc.internal.pages[p].push('/Trans << /Type /Trans /S /Push /D 1.0 /Di 180 >>');
        }
    }

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

      {/* Business & Logo Management Section */}
      {user && (
        <section className="premium-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg">Business & Logo</h3>
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
                <>
                {businessMembers.length > 1 && (
                    <div className="mb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Partners</p>
                        {businessMembers.map((member) => {
                            const active = isUserActive(member.lastActive);
                            return (
                            <div key={member._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 mb-2">
                                <div className="flex items-center gap-3 min-w-0">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                    {member.name ? member.name[0].toUpperCase() : 'U'}
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
                                        {formatLastActive(member.lastActive, member.createdAt)}
                                    </div>
                                    </div>
                                )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
                </>
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


      <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-orange-500" />
          <h3 className="font-bold text-lg">Payment Automation</h3>
        </div>

        {/* UPI Toggle Section */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-200">UPI Payment Tracking</p>
              <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                Generate a unique UPI to automatically track payment SMS and save them to history.
              </p>
            </div>
            <button 
              onClick={async () => {
                try {
                  const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/toggle-upi`, {}, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  await refreshUser();
                  setSuccessMessage(res.data.upiEnabled ? 'UPI Tracking Enabled!' : 'UPI Tracking Disabled');
                  setIsSuccessOpen(true);
                } catch (error) {
                  console.error('Toggle UPI error:', error);
                  alert('Failed to toggle UPI');
                }
              }}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${user?.upiEnabled ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${user?.upiEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          {user?.upiEnabled && user?.generatedUPI && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Your Tracking UPI</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={user.generatedUPI} 
                  className="flex-1 p-2 text-xs font-mono bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-emerald-600"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(user.generatedUPI);
                    setSuccessMessage('UPI copied! Use this in the SMS Tester.');
                    setIsSuccessOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Copy UPI
                </button>
              </div>
              <p className="text-[9px] text-slate-500 italic">Copy this UPI and paste it into the SMS-Tester browser.</p>
            </div>
          )}
        </div>
      </section>

      {/* Appearance */}
      <section className="premium-card p-6">
        <h3 className="font-bold text-lg mb-4">Appearance</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex-shrink-0">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-slate-500">Switch between light and dark themes</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${theme === 'dark' ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>
      </section>

      {/* Budget */}
      <section className="premium-card p-6">
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
      <section className="premium-card p-6">
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
            
            {/* New Flipbook Preview Trigger */}
            <button 
              onClick={() => {
                setFlipbookTransactions([...transactions]);
                setFlipbookWallets([...wallets]);
                setShowFlipbook(true);
              }}
              className="w-full flex items-center justify-center gap-2 mt-2 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
            >
              <BookOpen size={20} />
              Preview Physical Book Report
              <div className="px-2 py-0.5 bg-blue-400/30 rounded text-[10px] uppercase">New</div>
            </button>
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

      <StatusModal 
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        message={successMessage}
      />



      {/* Upload/Import Loading State */}
      <LoadingSpinner isOpen={isLogoUploading} message="Updating Logo..." />

      {/* 3D Flipbook Overlay */}
      <PhysicalReportOverlay 
        isOpen={showFlipbook}
        onClose={() => setShowFlipbook(false)}
        transactions={flipbookTransactions}
        wallets={flipbookWallets}
        user={user}
        isMobile={isMobile}
        theme={theme}
      />
    </div>
  );
};

export default Settings;
