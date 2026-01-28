import React, { useState } from 'react';
import type { User } from '../types';
import { User as UserIcon, Lock, KeyRound } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (username === 'admin' && password === 'admin') {
            onLogin({
                id: '1',
                username: 'admin',
                name: 'Quản trị viên',
                role: 'admin'
            });
        } else if (username === 'manager' && password === 'manager') {
            onLogin({
                id: '2',
                username: 'manager',
                name: 'Quản lý xưởng',
                role: 'manager'
            });
        } else {
            setError('Sai tên đăng nhập hoặc mật khẩu');
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-surface-50 p-4 md:p-12 lg:p-24 items-center justify-center font-sans">
            <div className="w-full max-w-[1400px] h-[800px] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative">

                {/* Left Panel */}
                <div className="w-full lg:w-[45%] bg-white p-12 lg:p-20 flex flex-col z-10 relative">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 mb-24">
                        <div className="relative w-32 h-32">
                            <img src="/logo-alpha.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="mt-auto mb-auto">
                        <h1 className="text-4xl font-black text-brand-600 mb-6 tracking-tight">XIN CHÀO!</h1>
                        <div className="w-20 h-1.5 bg-brand-500 mb-8 rounded-full"></div>
                        <p className="text-xl text-surface-500 font-medium max-w-sm leading-relaxed">
                            Phần mềm hệ thống quản lí tiến độ sản xuất
                        </p>
                    </div>

                    <div className="mt-auto">
                        <p className="text-xs text-surface-300 font-medium">© 2026 Alpha Industries</p>
                    </div>
                </div>

                {/* Right Panel (Blue Gradient) */}
                <div className="flex-1 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-12 overflow-hidden">
                    {/* Background Pattern Icons (Subtle) */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <KeyRound className="absolute top-20 left-20 w-12 h-12 text-white rotate-12" />
                        <Lock className="absolute bottom-40 right-40 w-16 h-16 text-white -rotate-12" />
                        <UserIcon className="absolute top-1/2 right-20 w-10 h-10 text-white rotate-6" />
                    </div>

                    {/* Wave Separator SVG */}
                    <div className="absolute top-0 bottom-0 -left-1 w-24 lg:w-32 h-full z-20 pointer-events-none text-white hidden lg:block">
                        <svg viewBox="0 0 100 800" preserveAspectRatio="none" className="w-full h-full fill-current">
                            <path d="M0,0 L0,800 C40,600 80,450 60,400 C30,320 90,200 60,100 C40,40 20,20 0,0 Z" />
                            {/* Adjusted path to try and match the "convex/concave" feel roughly, simpler curve here */}
                            <path d="M-2,0 L-2,800 L30,800 C80,600 90,500 60,400 C20,280 95,150 40,0 L0,0 Z" />
                        </svg>
                    </div>
                    {/* Better Curve using a simple big radius div masking */}
                    <div className="absolute top-0 bottom-0 -left-16 w-32 bg-white rounded-r-[100%] z-20 hidden lg:block scale-y-150 transform origin-left"></div>


                    {/* Login Form Container */}
                    <div className="w-full max-w-md relative z-30 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wider">ĐĂNG NHẬP</h2>
                        <p className="text-blue-100 text-sm mb-12 uppercase tracking-widest font-medium">ĐỂ TRUY CẬP HỆ THỐNG</p>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-brand-700 group-focus-within:text-brand-900 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-14 pr-6 py-4 bg-white text-gray-900 placeholder-gray-400 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all font-medium shadow-xl"
                                    placeholder="Tên đăng nhập"
                                    autoFocus
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-brand-700 group-focus-within:text-brand-900 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-14 pr-6 py-4 bg-white text-gray-900 placeholder-gray-400 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all font-medium shadow-xl"
                                    placeholder="Mật khẩu"
                                />
                            </div>

                            {error && (
                                <div className="text-red-200 bg-red-500/20 py-2 px-4 rounded-lg text-sm font-semibold animate-in fade-in slide-in-from-top-1 backdrop-blur-sm border border-red-500/30">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-4 px-6 bg-green-500 hover:bg-green-400 text-white rounded-full font-bold text-lg shadow-lg shadow-green-900/20 transform transition-all active:scale-[0.98] mt-4 uppercase tracking-wider"
                            >
                                ĐĂNG NHẬP
                            </button>

                            <div className="pt-4">
                                <a href="#" className="text-blue-100 hover:text-white text-sm font-medium underline-offset-4 hover:underline transition-colors">
                                    Quên mật khẩu?
                                </a>
                            </div>
                        </form>
                        <p className="mt-12 text-blue-200/60 text-[10px] uppercase tracking-widest">
                            Bản quyền © 2026 Alpha Industries.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
