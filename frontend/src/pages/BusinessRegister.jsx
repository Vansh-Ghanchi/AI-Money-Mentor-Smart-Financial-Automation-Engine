import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

const BusinessRegister = () => {
    const navigate = useNavigate();
    // Assuming useAuth exposes a register function or we use fetch directly. 
    // Since useAuth usually wraps login/signup, we might need to add registerBusiness there or call API directly.
    // For simplicity, I'll call API directly here, then use login from auth context or just save token.
    // Actually, to keep state consistent, calling a method in AuthContext is better, but I don't want to refactor AuthContext too much.
    // I'll call API and then use valid token to "login" via context if possible, or just reload/navigate.
    // The previous auth flow likely saves token to localStorage.

    // Let's assume standard fetch for now.
    const [step, setStep] = useState(1);
    const [partnerCount, setPartnerCount] = useState(2);
    const [partners, setPartners] = useState([]);
    const [businessName, setBusinessName] = useState('');
    const [logo, setLogo] = useState(null); // Logo state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePartnerCountSubmit = (e) => {
        e.preventDefault();
        // Initialize partner array
        const initialPartners = Array(partnerCount).fill().map(() => ({ name: '', email: '', password: '' }));
        setPartners(initialPartners);
        setStep(2);
    };

    const handlePartnerChange = (index, field, value) => {
        const newPartners = [...partners];
        newPartners[index][field] = value;
        setPartners(newPartners);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Manual Validation to enforce strict check
        if (!businessName.trim() || partners.some(p => !p.name.trim() || !p.email.trim() || !p.password.trim())) {
            setLoading(false);
            setError('Please fill the required fields marked with * before proceeding.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register-business`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessName, partners, logo }), // Send logo
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Registration successful. Token is in data.token.
            // We should store it and redirect. 
            // Ideally use AuthContext.login(data.token, data.user) if available.
            // Or manually:
            localStorage.setItem('token', data.token);
            // Force reload to update AuthContext or navigate to dashboard if AuthContext listens to storage
            // Better: navigate to login with success message? Or auto-login.
            // Let's try auto-login by reloading page which triggers AuthContext check, or navigating.
            // Assuming AuthContext reads from localStorage on mount.
            window.location.href = '/dashboard'; 

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-yellow-500 p-6 text-center">
                    <Users className="w-12 h-12 text-white mx-auto mb-2" />
                    <h2 className="text-3xl font-bold text-white">Business Account Setup</h2>
                    <p className="text-yellow-100">Manage finances together with your partners</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handlePartnerCountSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Number of Partners <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={partnerCount}
                                    onChange={(e) => setPartnerCount(Number(e.target.value))}
                                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                                >
                                    {[2, 3, 4, 5, 6].map(num => (
                                        <option key={num} value={num}>{num} Partners</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                Continue <ArrowRight size={20} />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Business Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="e.g. ABC Traders"
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-yellow-500 outline-none"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Business Symbol / Logo (Optional)
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-300 transition-colors">
                                        Choose Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    // Limit size to 2MB to prevent payload issues
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        setError("Logo size too large. Please upload an image smaller than 2MB.");
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setLogo(reader.result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    {logo && (
                                        <div className="h-10 w-10 relative">
                                            <img src={logo} alt="Preview" className="h-full w-full object-cover rounded-md border border-slate-300" />
                                            <button 
                                                type="button"
                                                onClick={() => setLogo(null)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Visible on exported reports (Max 2MB)</p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {partners.map((partner, index) => (
                                    <div key={index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                                        <div className="flex items-center gap-2 mb-4 text-yellow-600 dark:text-yellow-400 font-semibold">
                                            <UserPlus size={18} />
                                            Partner {index + 1}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-slate-500">Full Name <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Full Name"
                                                    value={partner.name}
                                                    onChange={(e) => handlePartnerChange(index, 'name', e.target.value)}
                                                    className="w-full p-2 rounded-lg border dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-1 focus:ring-yellow-500"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-slate-500">Email / Username <span className="text-red-500">*</span></label>
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="Email / Username"
                                                    value={partner.email}
                                                    onChange={(e) => handlePartnerChange(index, 'email', e.target.value)}
                                                    className="w-full p-2 rounded-lg border dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-1 focus:ring-yellow-500"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-slate-500">Password <span className="text-red-500">*</span></label>
                                                <input
                                                    type="password"
                                                    required
                                                    placeholder="Password (min 6 chars)"
                                                    value={partner.password}
                                                    onChange={(e) => handlePartnerChange(index, 'password', e.target.value)}
                                                    className="w-full p-2 rounded-lg border dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-1 focus:ring-yellow-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Creating Account...' : (
                                        <>Create Business Account <ShieldCheck size={20} /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                    
                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-slate-500 hover:text-yellow-600 text-sm">
                            Already have an account? Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessRegister;
