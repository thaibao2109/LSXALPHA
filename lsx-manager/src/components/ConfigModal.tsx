import React, { useState } from 'react';
import { X, Plus, Trash2, Settings } from 'lucide-react';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: string[];
    onUpdateTemplates: (newTemplates: string[]) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, templates, onUpdateTemplates }) => {
    const [newTemplate, setNewTemplate] = useState('');

    if (!isOpen) return null;

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTemplate.trim()) return;
        if (templates.includes(newTemplate.trim())) {
            alert('Công đoạn này đã tồn tại!');
            return;
        }
        onUpdateTemplates([...templates, newTemplate.trim()]);
        setNewTemplate('');
    };

    const handleDelete = (template: string) => {
        if (confirm(`Bạn có chắc muốn xóa công đoạn mẫu "${template}" không?`)) {
            onUpdateTemplates(templates.filter(t => t !== template));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Settings className="w-5 h-5 text-gray-700" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Quản lý Công đoạn</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newTemplate}
                            onChange={(e) => setNewTemplate(e.target.value)}
                            placeholder="Nhập tên công đoạn mới..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="space-y-2">
                        {templates.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                <span className="font-medium text-gray-700">{t}</span>
                                <button
                                    onClick={() => handleDelete(t)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <p className="text-center text-gray-400 py-4 italic">Chưa có công đoạn mẫu nào.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
