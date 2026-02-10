import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../utils/api';
import { Plus, Edit2, Trash2, X, User as UserIcon, Shield, Key } from 'lucide-react';

interface UserManagementProps {
    currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        password: '',
        role: 'manager' as 'admin' | 'manager'
    });

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users:", error);
            alert("Lỗi tải danh sách người dùng");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData: User = {
                id: editingUser ? editingUser.id : formData.username, // Use username as ID for simplicity or keep existing ID
                username: formData.username,
                name: formData.name,
                role: formData.role,
                password: formData.password || undefined // Only send password if set
            };

            // If editing and no password provided, api.saveUser might need to handle partial update/merge? 
            // Our api.saveUser uses setDoc which overwrites if we don't use {merge: true}.
            // BUT, our api.saveUser implementation does `setDoc(doc(...), user)`.
            // So if we omit password, and the backend expects it to persist, we might lose it if we overwrite?
            // Actually, in api.ts I implemented `setDoc`. 
            // If I am editing, I should fetch the old user or use `updateDoc` or `setDoc` with merge.
            // Let's rely on the fact that for now, admins might reset passwords. 
            // If password is empty during edit, we ideally want to keep the old one.
            // BUT, the `api.saveUser` replaces the document. 
            // I should modify `api.saveUser` to handle merge or fetch-merge-save.
            // OR I can just require password for now, or fetch user details before saving?
            // Let's check `api.getUsers` - it returns passwords (as I implemented it).
            // So `users` state HAS password? 
            // Wait, my `api.getUsers` implementation: 
            /*
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return data as import('../types').User & { password?: string };
            });
            */
            // Yes, it returns it. So `editingUser` might have it if I cast it properly, 
            // BUT `User` type in `types/index.ts` has optional password now.

            // So if `editingUser` has password, better perform a merge.
            // If `formData.password` is empty, use `editingUser.password`.

            if (editingUser) {
                const existing = users.find(u => u.id === editingUser.id);
                if (existing?.password && !formData.password) {
                    userData.password = existing.password;
                }
            }

            await api.saveUser(userData);
            await loadUsers();
            closeModal();
        } catch (error) {
            console.error("Failed to save user:", error);
            alert("Lỗi lưu người dùng");
        }
    };

    const handleDelete = async (user: User) => {
        if (window.confirm(`Bạn có chắc muốn xóa người dùng "${user.name}"?`)) {
            try {
                await api.deleteUser(user.username);
                await loadUsers();
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Lỗi xóa người dùng");
            }
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                name: user.name,
                password: user.password || '', // Pre-fill? No, security risk usually, but here maybe needed if we overwrite.
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                name: '',
                password: '',
                role: 'manager'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    if (currentUser.role !== 'admin') {
        return <div className="p-8 text-center text-red-500">Bạn không có quyền truy cập trang này.</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Quản lý người dùng</h1>
                    <p className="text-surface-500">Thêm, sửa, xóa tài khoản hệ thống</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Thêm người dùng</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-50 border-b border-surface-200">
                                <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Tên đăng nhập</th>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Họ tên</th>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Vai trò</th>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-surface-900">{user.username}</td>
                                    <td className="px-6 py-4 text-sm text-surface-600">{user.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.role === 'admin' ? 'Quản trị viên' : 'Quản lý'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {user.username !== 'admin' && user.username !== currentUser.username && (
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-surface-500">
                                        Chưa có người dùng nào (ngoài admin mặc định nếu chưa lưu).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
                            <h3 className="text-lg font-bold text-surface-900">
                                {editingUser ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
                            </h3>
                            <button onClick={closeModal} className="text-surface-400 hover:text-surface-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Tên đăng nhập</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                    <input
                                        type="text"
                                        required
                                        disabled={!!editingUser}
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-surface-100 disabled:text-surface-500"
                                        placeholder="VD: nguyenvan"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Họ và tên</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                        placeholder="VD: Nguyễn Văn A"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">
                                    {editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu'}
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                    <input
                                        type="text" // Using text to see password for management simplicity as requested usually
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                        placeholder={editingUser ? "******" : "Nhập mật khẩu..."}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-1">Vai trò</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setFormData({ ...formData, role: 'manager' })}
                                        className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.role === 'manager'
                                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                                            : 'border-surface-200 hover:border-brand-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm">Quản lý</div>
                                        <div className="text-[10px] text-surface-500 mt-1">Quyền hạn tiêu chuẩn</div>
                                    </div>
                                    <div
                                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.role === 'admin'
                                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                                            : 'border-surface-200 hover:border-brand-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm">Quản trị viên</div>
                                        <div className="text-[10px] text-surface-500 mt-1">Toàn quyền hệ thống</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-surface-200 text-surface-700 rounded-lg hover:bg-surface-50 font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-sm shadow-brand-200"
                                >
                                    {editingUser ? 'Lưu thay đổi' : 'Thêm người dùng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
