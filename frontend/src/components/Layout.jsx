import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Wallet, PieChart, Settings, List, Shield, BadgeCheck } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import Chatbot from './Chatbot';

const Layout = ({ children }) => {
  const { theme } = useExpense();
  const { user } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Wallets', path: '/wallets' },
    { icon: List, label: 'History', path: '/transactions' },
    { icon: PlusCircle, label: 'Add', path: '/add' },
    { icon: PieChart, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ icon: Shield, label: 'Admin', path: '/admin' });
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      <div className="flex flex-col h-screen">
        {/* Mobile Header */}
        <header className="md:hidden p-4 flex justify-between items-center glass sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
            <h1 className="text-xl font-bold text-gradient">ExpenseAI</h1>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-inner">
             <img src="/assets/logo.png" alt="User Profile" className="w-full h-full object-cover" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 md:pl-72 pt-4 md:pt-8">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl animate-fade-in">
            {children}
          </div>
        </main>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-72 fixed inset-y-0 left-0 h-full glass z-50 shadow-[5px_0_30px_rgba(0,0,0,0.02)] dark:shadow-2xl dark:shadow-blue-900/5">
          <div className="p-8 flex items-center gap-4 shrink-0">
            <img src="/assets/logo.png" alt="ExpenseAI Logo" className="w-12 h-12 rounded-2xl shadow-xl shadow-blue-500/20" />
            <div>
              <h1 className="text-2xl font-bold text-gradient tracking-tight">ExpenseAI</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest truncate max-w-[120px]">
                {user?.businessId?.name || 'Personal Pro'}
              </p>
            </div>
          </div>
          
          <nav className="flex-1 px-6 space-y-3 overflow-y-auto scrollbar-hide">
            {navItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                      : 'hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:scale-105'
                  }`
                }
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon size={22} className="transition-transform duration-300 group-hover:rotate-12" />
                <span className="font-semibold tracking-wide">{item.label}</span>
                {/* Active Indicator Glow */}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </NavLink>
            ))}
          </nav>

          <div className="p-6 space-y-3">
            {/* Security Badge */}
            <div className="glass-card p-4 rounded-2xl bg-gradient-to-br from-green-100/40 to-emerald-100/40 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300/30 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <Shield className="text-green-600 dark:text-green-400" size={14} />
                </div>
                <p className="text-xs font-bold text-green-900 dark:text-green-100">100% Secure</p>
              </div>
              <p className="text-[10px] text-green-700 dark:text-green-300 leading-relaxed">
                Your data is protected with bank-grade security
              </p>
            </div>

            {/* Trust Badge */}
            <div className="glass-card p-4 rounded-2xl bg-gradient-to-br from-blue-100/40 to-indigo-100/40 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-300/30 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <BadgeCheck className="text-blue-600 dark:text-blue-400" size={14} />
                </div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Verified Platform</p>
              </div>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                Join millions who trust us with their finances
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Bottom Nav - Compact Single-Screen Layout */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/20 dark:border-slate-700/30 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center px-1 py-2 pb-safe">
            {navItems
              .filter(item => item.label !== 'Wallets') // Hide Wallets on Mobile Bottom Nav
              .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 min-w-0 py-1 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400 font-bold' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`
                }
              >
                <item.icon size={18} strokeWidth={2.5} className="shrink-0" />
                <span className="text-[8px] sm:text-[10px] mt-0.5 uppercase tracking-tighter text-center truncate w-full px-0.5">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
        <Chatbot />
      </div>
    </div>
  );

};

export default Layout;
