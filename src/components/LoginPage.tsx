'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Zap, AlertCircle } from 'lucide-react';

interface LoginPageProps {
    onLoginSuccess: (sessionToken: string, agency: any, user: any) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Login form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Register form
    const [regEmail, setRegEmail] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regFullName, setRegFullName] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.login(username, password);
            
            // Store session token
            localStorage.setItem('session_token', response.session_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('agency', JSON.stringify(response.agency));
            
            onLoginSuccess(response.session_token, response.agency, response.user);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.register(regEmail, regUsername, regPassword, regFullName);
            
            // Store session token
            localStorage.setItem('session_token', response.session_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('agency', JSON.stringify(response.agency));
            
            onLoginSuccess(response.session_token, response.agency, response.user);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
            <div className="max-w-md w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[#0F0F0F] border border-[#262626] flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-8 h-8 text-[#00E37C]" />
                    </div>
                    <h1 className="text-3xl font-semibold text-white mb-2">HYDRA Monitor</h1>
                    <p className="text-[#888888]">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#0F0F0F] border border-[#262626] rounded-2xl p-8"
                >
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}

                    {isLogin ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[#888888] mb-2">
                                    Username or Email
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter username or email"
                                        className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00E37C] transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#888888] mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00E37C] transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#00E37C] text-black font-medium py-3 px-4 rounded-xl hover:bg-[#00E37C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[#888888] mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                                    <input
                                        type="email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00E37C] transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#888888] mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                                    <input
                                        type="text"
                                        value={regUsername}
                                        onChange={(e) => setRegUsername(e.target.value)}
                                        placeholder="Choose a username"
                                        className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00E37C] transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#888888] mb-2">
                                    Full Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={regFullName}
                                    onChange={(e) => setRegFullName(e.target.value)}
                                    placeholder="Your full name"
                                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00E37C] transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#888888] mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
                                    <input
                                        type="password"
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        placeholder="Choose a strong password"
                                        className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-white placeholder-[#666666] focus:outline-none focus:border-[#00E37C] transition-colors"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#00E37C] text-black font-medium py-3 px-4 rounded-xl hover:bg-[#00E37C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm text-[#888888] hover:text-white transition-colors"
                        >
                            {isLogin ? (
                                <>Don't have an account? <span className="text-[#00E37C]">Sign up</span></>
                            ) : (
                                <>Already have an account? <span className="text-[#00E37C]">Sign in</span></>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Demo credentials hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-4 bg-[#0F0F0F] border border-[#262626] rounded-xl"
                >
                    <p className="text-xs text-[#666666] text-center">
                        Demo accounts available - check console for credentials
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
