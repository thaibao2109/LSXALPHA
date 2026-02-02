import React, { useState } from 'react';
import { Plus, Trash2, Search, Pencil, Check, X, FileText, HardDrive, Settings } from 'lucide-react';
import { uuid } from '../utils/uuid';
import type { Tool, MaterialType, MaterialStatus, MaterialTypeDefinition } from '../types';
import { clsx } from 'clsx';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { api } from '../utils/api';
import { Upload } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

interface ToolManagementProps {
    tools: Tool[];
    onUpdateTools: (newTools: Tool[]) => void;
    materialTypes: MaterialTypeDefinition[];
    onUpdateMaterialTypes: (newTypes: MaterialTypeDefinition[]) => void;
}

export const ToolManagement: React.FC<ToolManagementProps> = ({
    tools,
    onUpdateTools,
    materialTypes,
    onUpdateMaterialTypes
}) => {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [isEditingTool, setIsEditingTool] = useState(false);
    const [showTypeManager, setShowTypeManager] = useState(false); // New state for type manager
    const [toolForm, setToolForm] = useState<Partial<Tool>>({});
    const [toolSearch, setToolSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [isUploading, setIsUploading] = useState(false);

    // Type Manager State
    const [newTypeForm, setNewTypeForm] = useState({ code: '', name: '' });

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDelete: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDelete: true,
    });

    const handleAddTool = () => {
        const newTool: Tool = {
            id: uuid(),
            code: '',
            name: 'Vật tư mới',
            type: materialTypes.length > 0 ? materialTypes[0].id : 'other',
            status: 'good',
            notes: '',
            drawing: '',
            compatibleProducts: [] // Deprecated
        };
        onUpdateTools([newTool, ...tools]);
        setSelectedTool(newTool);
        setToolForm(newTool);
        setIsEditingTool(true);
    };

    const handleSaveTool = () => {
        if (!selectedTool) return;
        const updatedTool = { ...selectedTool, ...toolForm } as Tool;
        const newTools = tools.map(t => t.id === selectedTool.id ? updatedTool : t);
        onUpdateTools(newTools);
        setSelectedTool(updatedTool);
        setIsEditingTool(false);
    };

    const handleDeleteTool = () => {
        if (!selectedTool) return;
        setConfirmation({
            isOpen: true,
            title: 'Xóa Vật tư',
            message: `Bạn có chắc muốn xóa "${selectedTool.name}" không?`,
            isDelete: true,
            onConfirm: () => {
                onUpdateTools(tools.filter(t => t.id !== selectedTool.id));
                setSelectedTool(null);
                setIsEditingTool(false);
            }
        });
    };

    const handleAddType = () => {
        if (!newTypeForm.code || !newTypeForm.name) return;
        const newType: MaterialTypeDefinition = {
            id: uuid(),
            code: newTypeForm.code.toUpperCase(),
            name: newTypeForm.name
        };
        onUpdateMaterialTypes([...materialTypes, newType]);
        setNewTypeForm({ code: '', name: '' });
    };

    const handleDeleteType = (id: string) => {
        if (materialTypes.length <= 1) {
            alert("Phải giữ ít nhất một loại vật tư!");
            return;
        }
        setConfirmation({
            isOpen: true,
            title: 'Xóa Loại Vật tư',
            message: 'Bạn có chắc muốn xóa loại này? Các vật tư thuộc loại này sẽ cần cập nhật lại.',
            isDelete: true,
            onConfirm: () => {
                onUpdateMaterialTypes(materialTypes.filter(t => t.id !== id));
            }
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const url = await api.uploadFile(file);
            setToolForm(prev => ({ ...prev, drawing: url }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload thất bại!");
        } finally {
            setIsUploading(false);
        }
    };


    const filteredTools = tools.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
            t.code.toLowerCase().includes(toolSearch.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="h-full flex flex-col bg-surface-50 animate-in fade-in duration-500">
            {/* Header */}
            <header className="px-8 py-5 flex items-center justify-between bg-white border-b border-surface-200 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-50 rounded-xl">
                        <HardDrive className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Quản lý Vật tư</h1>
                        <p className="text-sm text-surface-500 font-medium">Khuôn, Chày, Cối, Bánh cán và bản vẽ</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex bg-surface-100 rounded-lg p-1 overflow-x-auto max-w-md scrollbar-hide">
                        <button
                            onClick={() => setFilterType('all')}
                            className={clsx(
                                "px-3 py-1.5 text-sm font-semibold rounded-md transition-all whitespace-nowrap",
                                filterType === 'all'
                                    ? "bg-white text-surface-900 shadow-sm"
                                    : "text-surface-500 hover:text-surface-700 hover:bg-surface-200/50"
                            )}
                        >
                            Tất cả
                        </button>
                        {materialTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={clsx(
                                    "px-3 py-1.5 text-sm font-semibold rounded-md transition-all whitespace-nowrap",
                                    filterType === type.id
                                        ? "bg-white text-surface-900 shadow-sm"
                                        : "text-surface-500 hover:text-surface-700 hover:bg-surface-200/50"
                                )}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                    <div className="h-8 w-px bg-surface-200 mx-2 hidden md:block" />

                    <button
                        onClick={() => setShowTypeManager(true)}
                        className="p-2.5 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                        title="Quản lý loại vật tư"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleAddTool}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all font-semibold active:scale-95 text-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm mới
                    </button>
                </div>
            </header>

            {/* Content Body */}
            <div className="flex-1 overflow-hidden p-6 md:p-8">
                <div className="h-full flex flex-col md:flex-row gap-6">
                    {/* Left List */}
                    <div className="w-full md:w-1/3 flex flex-col bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
                        <div className="p-4 border-b border-surface-100 bg-surface-50/30">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                <input
                                    type="text"
                                    value={toolSearch}
                                    onChange={(e) => setToolSearch(e.target.value)}
                                    placeholder="Tìm kiếm vật tư..."
                                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredTools.length > 0 ? (
                                filteredTools.map(tool => (
                                    <button
                                        key={tool.id}
                                        onClick={() => {
                                            setSelectedTool(tool);
                                            setToolForm(tool);
                                            setIsEditingTool(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group",
                                            selectedTool?.id === tool.id
                                                ? "bg-brand-50 border-brand-200 shadow-sm"
                                                : "hover:bg-surface-50 border border-transparent"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className={clsx(
                                                "font-semibold text-sm",
                                                selectedTool?.id === tool.id ? "text-brand-700" : "text-surface-700"
                                            )}>{tool.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold bg-surface-100 text-surface-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                    {tool.code || 'NO CODE'}
                                                </span>
                                                <span className={clsx(
                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-gray-100 text-gray-600"
                                                )}>
                                                    {materialTypes.find(t => t.id === tool.type)?.name || tool.type}
                                                </span>
                                                {tool.status && tool.status !== 'good' && (
                                                    <span className={clsx(
                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                                        tool.status === 'broken' ? "bg-red-50 text-red-600" :
                                                            tool.status === 'maintenance' ? "bg-yellow-50 text-yellow-600" :
                                                                "bg-gray-100 text-gray-400"
                                                    )}>
                                                        {tool.status === 'broken' ? 'Hỏng' :
                                                            tool.status === 'maintenance' ? 'Bảo trì' : 'Đã hủy'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-10 px-4">
                                    <HardDrive className="w-10 h-10 text-surface-200 mx-auto mb-3" />
                                    <p className="text-sm text-surface-400 font-medium">Không tìm thấy vật tư nào.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Details */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden flex flex-col">
                        {selectedTool ? (
                            <>
                                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between bg-surface-50/30">
                                    <div>
                                        <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                                            {selectedTool.name}
                                            {isEditingTool && <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">Đang sửa</span>}
                                        </h2>
                                        <span className="text-xs text-surface-500 font-mono">{selectedTool.id}</span>
                                    </div>
                                    {!isEditingTool ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditingTool(true)}
                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-surface-200 text-surface-600 rounded-lg hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all text-sm font-semibold shadow-sm"
                                            >
                                                <Pencil className="w-4 h-4" /> Sửa
                                            </button>
                                            <button
                                                onClick={handleDeleteTool}
                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-surface-200 text-surface-600 rounded-lg hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-semibold shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" /> Xóa
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditingTool(false);
                                                    setToolForm(selectedTool);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-surface-200 text-surface-600 rounded-lg hover:bg-surface-50 transition-all text-sm font-semibold shadow-sm"
                                            >
                                                <X className="w-4 h-4" /> Hủy
                                            </button>
                                            <button
                                                onClick={handleSaveTool}
                                                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all text-sm font-semibold shadow-md active:scale-95"
                                            >
                                                <Check className="w-4 h-4" /> Lưu thay đổi
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-surface-50/10">
                                    <div className="max-w-3xl space-y-8">
                                        <section className="space-y-4">
                                            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-widest border-b border-surface-100 pb-2">Thông tin chung</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-surface-500">Tên vật tư</label>
                                                    <input
                                                        type="text"
                                                        disabled={!isEditingTool}
                                                        value={isEditingTool ? toolForm.name : selectedTool.name}
                                                        onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                                                        className="w-full px-3 py-2.5 bg-white border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none disabled:bg-surface-50 disabled:text-surface-500 transition-all font-medium text-surface-900"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-surface-500">Mã quản lý</label>
                                                    <input
                                                        type="text"
                                                        disabled={!isEditingTool}
                                                        value={isEditingTool ? toolForm.code : selectedTool.code}
                                                        onChange={(e) => setToolForm({ ...toolForm, code: e.target.value })}
                                                        className="w-full px-3 py-2.5 bg-white border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none disabled:bg-surface-50 disabled:text-surface-500 transition-all font-mono font-medium text-surface-900"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-surface-500">Loại vật tư</label>
                                                    <select
                                                        disabled={!isEditingTool}
                                                        value={isEditingTool ? toolForm.type : selectedTool.type}
                                                        onChange={(e) => setToolForm({ ...toolForm, type: e.target.value as MaterialType })}
                                                        className="w-full px-3 py-2.5 bg-white border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none disabled:bg-surface-50 disabled:text-surface-500 transition-all font-medium text-surface-900"
                                                    >
                                                        {materialTypes.map(type => (
                                                            <option key={type.id} value={type.id}>{type.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-surface-500">Tình trạng</label>
                                                    <select
                                                        disabled={!isEditingTool}
                                                        value={isEditingTool ? (toolForm.status || 'good') : (selectedTool.status || 'good')}
                                                        onChange={(e) => setToolForm({ ...toolForm, status: e.target.value as MaterialStatus })}
                                                        className={clsx(
                                                            "w-full px-3 py-2.5 border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none disabled:bg-surface-50 disabled:text-surface-500 transition-all font-bold",
                                                            (isEditingTool ? toolForm.status : selectedTool.status) === 'good' ? "text-green-600" :
                                                                (isEditingTool ? toolForm.status : selectedTool.status) === 'maintenance' ? "text-yellow-600" :
                                                                    (isEditingTool ? toolForm.status : selectedTool.status) === 'broken' ? "text-red-600" : "text-gray-500"
                                                        )}
                                                    >
                                                        <option value="good">Tốt / Sẵn sàng</option>
                                                        <option value="maintenance">Đang bảo trì</option>
                                                        <option value="broken">Hỏng</option>
                                                        <option value="disposed">Đã thanh lý</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Drawing & Notes */}
                                        <section className="space-y-4">
                                            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-widest border-b border-surface-100 pb-2">Thông tin kỹ thuật & Ghi chú</h3>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-surface-500">Đường dẫn bản vẽ / Link tài liệu</label>
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="flex gap-2 w-full">
                                                        <input
                                                            type="text"
                                                            disabled={!isEditingTool}
                                                            value={isEditingTool ? (toolForm.drawing || '') : (selectedTool.drawing || '')}
                                                            onChange={(e) => setToolForm({ ...toolForm, drawing: e.target.value })}
                                                            placeholder="Link tài liệu hoặc upload file..."
                                                            className="flex-1 px-3 py-2.5 bg-white border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none disabled:bg-surface-50 disabled:text-surface-500 transition-all font-mono text-sm"
                                                        />
                                                        {isEditingTool && (
                                                            <div className="relative">
                                                                <input
                                                                    type="file"
                                                                    id="drawing-upload"
                                                                    className="hidden"
                                                                    onChange={handleFileUpload}
                                                                    disabled={isUploading}
                                                                />
                                                                <label
                                                                    htmlFor="drawing-upload"
                                                                    className={clsx(
                                                                        "px-3 py-2.5 bg-surface-100 text-surface-600 rounded-lg hover:bg-surface-200 cursor-pointer flex items-center gap-2 transition-all h-full",
                                                                        isUploading && "opacity-50 cursor-wait"
                                                                    )}
                                                                >
                                                                    {isUploading ? (
                                                                        <div className="w-4 h-4 border-2 border-surface-600 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <Upload className="w-4 h-4" />
                                                                    )}
                                                                    <span className="text-sm font-semibold hidden md:inline">Upload</span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedTool.drawing && !isEditingTool && (
                                                    <a
                                                        href={selectedTool.drawing.startsWith('http') ? selectedTool.drawing : `${API_BASE_URL}${selectedTool.drawing}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg flex items-center justify-center transition-colors border border-brand-200 w-fit"
                                                        title="Mở tài liệu"
                                                    >
                                                        <FileText className="w-5 h-5 mr-2" />
                                                        <span className="font-medium text-sm">Xem tài liệu</span>
                                                    </a>
                                                )}
                                            </div>


                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-surface-500">Ghi chú (Đơn hàng, Sản phẩm chi tiết...)</label>
                                                <textarea
                                                    disabled={!isEditingTool}
                                                    value={isEditingTool
                                                        ? (toolForm.notes || '')
                                                        : (selectedTool.notes || '')
                                                    }
                                                    onChange={(e) => setToolForm({
                                                        ...toolForm,
                                                        notes: e.target.value
                                                    })}
                                                    placeholder="Ví dụ: Dùng cho đơn hàng ABC, khuôn của sản phẩm X..."
                                                    className="w-full h-32 px-4 py-3 bg-white border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none disabled:bg-surface-50 disabled:text-surface-500 transition-all text-sm leading-relaxed text-surface-700 resize-none shadow-sm"
                                                />
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-surface-300 space-y-4">
                                <div className="w-24 h-24 bg-surface-50 rounded-full flex items-center justify-center">
                                    <HardDrive className="w-10 h-10 opacity-30" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-surface-500 mb-1">Chưa chọn vật tư</h3>
                                    <p className="text-sm">Chọn một vật tư từ danh sách hoặc thêm mới.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                isDelete={confirmation.isDelete}
            />


            {/* Type Manager Modal */}
            {
                showTypeManager && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
                                <h3 className="font-bold text-lg text-surface-900">Quản lý Loại Vật tư</h3>
                                <button onClick={() => setShowTypeManager(false)} className="p-1 hover:bg-surface-200 rounded-lg text-surface-500 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex gap-2 mb-6">
                                    <input
                                        placeholder="Mã (VD: KHUON)"
                                        value={newTypeForm.code}
                                        onChange={e => setNewTypeForm({ ...newTypeForm, code: e.target.value })}
                                        className="w-1/3 px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 outline-none uppercase"
                                    />
                                    <input
                                        placeholder="Tên (VD: Khuôn mẫu)"
                                        value={newTypeForm.name}
                                        onChange={e => setNewTypeForm({ ...newTypeForm, name: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                    <button
                                        onClick={handleAddType}
                                        disabled={!newTypeForm.code || !newTypeForm.name}
                                        className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {materialTypes.map(type => (
                                        <div key={type.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg border border-surface-100 group">
                                            <div>
                                                <div className="font-semibold text-sm text-surface-900">{type.name}</div>
                                                <div className="text-xs text-surface-500 font-mono">{type.code}</div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteType(type.id)}
                                                className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
