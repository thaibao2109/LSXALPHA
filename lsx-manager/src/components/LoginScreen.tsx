import React, { useState } from 'react';
import type { User, Role } from '../types';
import { LogIn, ShieldCheck, User as UserIcon } from 'lucide-react';

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
        <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-surface-100 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 pb-0 flex flex-col items-center">
                    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                        <img src="/logo-alpha.png" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-surface-900 mb-2">LSX Manager</h2>
                    <p className="text-surface-500 text-center text-sm">Đăng nhập để tiếp tục vào hệ thống quản lý sản xuất</p>
                </div>

                <form onSubmit={handleLogin} className="p-8 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-500 uppercase tracking-wider ml-1">Tài khoản</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                placeholder="Nhập tên đăng nhập..."
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-surface-500 uppercase tracking-wider ml-1">Mật khẩu</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                                placeholder="Nhập mật khẩu..."
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                    >
                        <LogIn className="w-5 h-5" />
                        Đăng nhập
                    </button>

                    <div className="text-center pt-4">
                        <p className="text-xs text-surface-400 italic">
                            Mặc định: admin / admin hoặc manager / manager
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
