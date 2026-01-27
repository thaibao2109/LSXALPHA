import React, { useState } from 'react';
import { X, Plus, Trash2, Settings, Printer, ListChecks, CheckSquare, Square, Tags, ArrowUp, ArrowDown, Copy, Pencil, Check } from 'lucide-react';
import { AVAILABLE_SPECS, type PrintConfig, DEFAULT_PRINT_CONFIG } from '../utils/printConfig';
import type { ProductType } from '../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { clsx } from 'clsx';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: string[];
    defaultTemplates?: string[];
    onUpdateTemplates: (newTemplates: string[]) => void;
    printConfig?: PrintConfig;
    onUpdatePrintConfig?: (newConfig: PrintConfig) => void;
    productTypes?: ProductType[];
    onUpdateProductTypes?: (newTypes: ProductType[]) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
    isOpen,
    onClose,
    templates,
    defaultTemplates,
    onUpdateTemplates,
    printConfig,
    onUpdatePrintConfig,
    productTypes = [],
    onUpdateProductTypes
}) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'print' | 'product-types'>('product-types');
    const [newTemplate, setNewTemplate] = useState('');
    const [selectedPrintTask, setSelectedPrintTask] = useState<string | null>(null);

    // Product Type State
    const [newProductTypeName, setNewProductTypeName] = useState('');
    const [selectedProductType, setSelectedProductType] = useState<ProductType | null>(null);
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
    const [editTypeName, setEditTypeName] = useState('');

    // Task Editing State
    const [editingTaskName, setEditingTaskName] = useState<string | null>(null);
    const [editTaskValue, setEditTaskValue] = useState('');

    // Confirmation Modal State
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

    // Initial check for selected print task
    React.useEffect(() => {
        if (isOpen && templates.length > 0 && !selectedPrintTask) {
            setSelectedPrintTask(templates[0]);
        }
    }, [isOpen, templates]);

    if (!isOpen) return null;

    // --- Task Management Logic ---
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
        setConfirmation({
            isOpen: true,
            title: 'Xóa công đoạn mẫu',
            message: `Bạn có chắc muốn xóa công đoạn mẫu "${template}" không?`,
            isDelete: true,
            onConfirm: () => {
                onUpdateTemplates(templates.filter(t => t !== template));
                if (selectedPrintTask === template) {
                    setSelectedPrintTask(templates.find(t => t !== template) || null);
                }
            }
        });
    };

    const handleReset = () => {
        if (!defaultTemplates) return;
        setConfirmation({
            isOpen: true,
            title: 'Khôi phục mặc định',
            message: 'Bạn có chắc muốn khôi phục danh sách công đoạn về mặc định? Các công đoạn tùy chỉnh hiện tại sẽ bị mất.',
            isDelete: true,
            onConfirm: () => {
                onUpdateTemplates(defaultTemplates);
                setSelectedPrintTask(defaultTemplates[0] || null);
            }
        });
    };

    // --- Print Config Logic ---
    const toggleSpec = (taskName: string, specKey: string) => {
        if (!printConfig || !onUpdatePrintConfig) return;

        const currentSpecs = printConfig[taskName] || [];
        const isChecked = currentSpecs.includes(specKey);

        let newSpecs: string[];
        if (isChecked) {
            newSpecs = currentSpecs.filter(k => k !== specKey);
        } else {
            newSpecs = [...currentSpecs, specKey];
        }

        const newConfig = {
            ...printConfig,
            [taskName]: newSpecs
        };
        onUpdatePrintConfig(newConfig);
    };

    const getSpecsForTask = (taskName: string) => {
        if (!printConfig) return [];
        // Use exact match first, or empty array (don't use helper defaults here to show true state)
        return printConfig[taskName] || [];
    };

    // --- Task Editing Logic ---
    const handleStartEditTask = (task: string) => {
        setEditingTaskName(task);
        setEditTaskValue(task);
    };

    const handleCancelEditTask = () => {
        setEditingTaskName(null);
        setEditTaskValue('');
    };

    const handleSaveTaskEdit = () => {
        if (!editingTaskName || !editTaskValue.trim()) return;
        const oldName = editingTaskName;
        const newName = editTaskValue.trim();

        if (oldName === newName) {
            handleCancelEditTask();
            return;
        }

        if (templates.includes(newName)) {
            alert('Tên công đoạn này đã tồn tại!');
            return;
        }

        // 1. Update Templates List
        const newTemplates = templates.map(t => t === oldName ? newName : t);
        onUpdateTemplates(newTemplates);

        // 2. Update Product Types (Function references)
        if (onUpdateProductTypes) {
            const newProductTypes = productTypes.map(pt => ({
                ...pt,
                tasks: pt.tasks.map(t => t === oldName ? newName : t)
            }));
            onUpdateProductTypes(newProductTypes);

            // Update local selected state if needed
            if (selectedProductType) {
                setSelectedProductType(newProductTypes.find(pt => pt.id === selectedProductType.id) || null);
            }
        }

        // 3. Update Print Config
        if (printConfig && onUpdatePrintConfig) {
            const newConfig = { ...printConfig };
            if (newConfig[oldName]) {
                newConfig[newName] = newConfig[oldName];
                delete newConfig[oldName];
            }
            onUpdatePrintConfig(newConfig);
        }

        // Update local selection for Print Tab if it was the one being edited
        if (selectedPrintTask === oldName) {
            setSelectedPrintTask(newName);
        }

        handleCancelEditTask();
    };

    // --- Product Type Logic ---
    const handleAddProductType = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProductTypeName.trim() || !onUpdateProductTypes) return;

        const newType: ProductType = {
            id: crypto.randomUUID(),
            name: newProductTypeName.trim(),
            tasks: []
        };

        onUpdateProductTypes([...productTypes, newType]);
        setNewProductTypeName('');
        setSelectedProductType(newType);
    };

    const handleDeleteProductType = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateProductTypes) return;

        setConfirmation({
            isOpen: true,
            title: 'Xóa loại sản phẩm',
            message: 'Bạn có chắc muốn xóa loại sản phẩm này?',
            isDelete: true,
            onConfirm: () => {
                onUpdateProductTypes(productTypes.filter(t => t.id !== id));
                if (selectedProductType?.id === id) {
                    setSelectedProductType(null);
                }
            }
        });
    };

    const handleCloneProductType = (typeToClone: ProductType, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateProductTypes) return;

        const newType: ProductType = {
            id: crypto.randomUUID(),
            name: `${typeToClone.name} - Copy`,
            tasks: [...typeToClone.tasks]
        };

        onUpdateProductTypes([...productTypes, newType]);
        setSelectedProductType(newType);
    };

    const updateProductTypeTasks = (newTasks: string[]) => {
        if (!selectedProductType || !onUpdateProductTypes) return;
        const updatedType = { ...selectedProductType, tasks: newTasks };
        const updatedList = productTypes.map(pt => pt.id === selectedProductType.id ? updatedType : pt);
        onUpdateProductTypes(updatedList);
        setSelectedProductType(updatedType);
    };

    const handleStartEditProductType = (type: ProductType) => {
        setEditingTypeId(type.id);
        setEditTypeName(type.name);
    };

    const handleCancelEditProductType = () => {
        setEditingTypeId(null);
        setEditTypeName('');
    };

    const handleSaveProductTypeEdit = () => {
        if (!editingTypeId || !editTypeName.trim() || !onUpdateProductTypes) return;

        const updatedList = productTypes.map(pt =>
            pt.id === editingTypeId ? { ...pt, name: editTypeName.trim() } : pt
        );
        onUpdateProductTypes(updatedList);

        if (selectedProductType?.id === editingTypeId) {
            setSelectedProductType({ ...selectedProductType, name: editTypeName.trim() });
        }
        handleCancelEditProductType();
    };

    const addTaskToProductType = (taskName: string) => {
        if (!selectedProductType) return;
        if (selectedProductType.tasks.includes(taskName)) return;
        updateProductTypeTasks([...selectedProductType.tasks, taskName]);
    };

    const removeTaskFromProductType = (taskName: string) => {
        if (!selectedProductType) return;
        updateProductTypeTasks(selectedProductType.tasks.filter(t => t !== taskName));
    };

    const moveTask = (index: number, direction: 'up' | 'down') => {
        if (!selectedProductType) return;
        const newTasks = [...selectedProductType.tasks];

        if (direction === 'up') {
            if (index === 0) return;
            [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
        } else {
            if (index === newTasks.length - 1) return;
            [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
        }
        updateProductTypeTasks(newTasks);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Settings className="w-5 h-5 text-gray-700" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Cấu hình Hệ thống</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                    <button
                        onClick={() => setActiveTab('product-types')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'product-types'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Tags className="w-4 h-4" />
                        Loại Sản Phẩm (Mẫu)
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'tasks'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <ListChecks className="w-4 h-4" />
                        Quản lý Công đoạn
                    </button>
                    {printConfig && (
                        <button
                            onClick={() => setActiveTab('print')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'print'
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Printer className="w-4 h-4" />
                            Cấu hình Bản in
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 min-h-[400px]">
                    {activeTab === 'product-types' && (
                        <div className="flex h-full gap-6">
                            {/* Left: Product Types List */}
                            <div className="w-1/3 flex flex-col border-r border-gray-100 pr-4">
                                <form onSubmit={handleAddProductType} className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newProductTypeName}
                                        onChange={(e) => setNewProductTypeName(e.target.value)}
                                        placeholder="Tên loại SP mới..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </form>
                                <div className="space-y-1 overflow-y-auto max-h-[400px]">
                                    {productTypes.map(type => (
                                        <div
                                            key={type.id}
                                            onClick={() => setSelectedProductType(type)}
                                            className={clsx(
                                                "group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors",
                                                selectedProductType?.id === type.id
                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                    : "text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {editingTypeId === type.id ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editTypeName}
                                                        onChange={(e) => setEditTypeName(e.target.value)}
                                                        className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveProductTypeEdit();
                                                            if (e.key === 'Escape') handleCancelEditProductType();
                                                        }}
                                                    />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSaveProductTypeEdit(); }}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancelEditProductType(); }}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>{type.name}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleStartEditProductType(type); }}
                                                            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                                            title="Sửa tên"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleCloneProductType(type, e)}
                                                            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                                            title="Nhân bản"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteProductType(type.id, e)}
                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {productTypes.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 text-xs italic">
                                            Chưa có loại sản phẩm nào.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Task Configuration - Split View */}
                            <div className="flex-1 pl-2 flex flex-col gap-6">
                                {selectedProductType ? (
                                    <>
                                        <div className="flex-1 flex flex-col min-h-0">
                                            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center justify-between">
                                                <span>Quy trình sản xuất (Theo thứ tự)</span>
                                                <span className="text-xs font-normal text-gray-500">{selectedProductType.tasks.length} bước</span>
                                            </h3>

                                            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50/50 p-2 space-y-2">
                                                {selectedProductType.tasks.length === 0 && (
                                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                                                        Chưa có công đoạn nào. Chọn từ danh sách bên dưới để thêm.
                                                    </div>
                                                )}
                                                {selectedProductType.tasks.map((taskName, index) => (
                                                    <div key={`${taskName}-${index}`} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 shadow-sm group">
                                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                                                            {index + 1}
                                                        </span>
                                                        <span className="flex-1 text-sm font-medium text-gray-700">{taskName}</span>

                                                        <div className="flex items-center gap-1 opacity-100">
                                                            <button
                                                                onClick={() => moveTask(index, 'up')}
                                                                disabled={index === 0}
                                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"
                                                            >
                                                                <ArrowUp className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => moveTask(index, 'down')}
                                                                disabled={index === selectedProductType.tasks.length - 1}
                                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30"
                                                            >
                                                                <ArrowDown className="w-4 h-4" />
                                                            </button>
                                                            <div className="w-px h-4 bg-gray-200 mx-1" />
                                                            <button
                                                                onClick={() => removeTaskFromProductType(taskName)}
                                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-1/3 flex flex-col min-h-0 border-t border-gray-100 pt-4">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thêm công đoạn có sẵn</h3>
                                            <div className="flex-1 overflow-y-auto">
                                                <div className="flex flex-wrap gap-2">
                                                    {templates
                                                        .filter(t => !selectedProductType.tasks.includes(t))
                                                        .map(template => (
                                                            <button
                                                                key={template}
                                                                onClick={() => addTaskToProductType(template)}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                {template}
                                                            </button>
                                                        ))}
                                                    {templates.filter(t => !selectedProductType.tasks.includes(t)).length === 0 && (
                                                        <span className="text-xs text-gray-400 italic py-2">Đã thêm tất cả công đoạn mẫu.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <Tags className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm italic">Chọn một loại sản phẩm để cấu hình quy trình.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <>
                            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newTemplate}
                                    onChange={(e) => setNewTemplate(e.target.value)}
                                    placeholder="Nhập tên công đoạn mới..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </form>

                            <div className="space-y-2">
                                {templates.map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                        {editingTaskName === t ? (
                                            <div className="flex items-center gap-2 flex-1 mr-2">
                                                <input
                                                    type="text"
                                                    value={editTaskValue}
                                                    onChange={(e) => setEditTaskValue(e.target.value)}
                                                    className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveTaskEdit();
                                                        if (e.key === 'Escape') handleCancelEditTask();
                                                    }}
                                                />
                                                <button onClick={handleSaveTaskEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={handleCancelEditTask} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-medium text-gray-700">{t}</span>
                                                <div className="flex items-center gap-1 opacity-100">
                                                    <button
                                                        onClick={() => handleStartEditTask(t)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Sửa tên"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className="text-center py-4">
                                        <p className="text-gray-400 italic mb-2">Chưa có công đoạn mẫu nào.</p>
                                        {defaultTemplates && (
                                            <button
                                                onClick={handleReset}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                Khôi phục mặc định
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {defaultTemplates && templates.length > 0 && (
                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center">
                                    <button
                                        onClick={handleReset}
                                        className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        Khôi phục danh sách mặc định
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'print' && printConfig && (
                        <div className="flex h-full gap-6">
                            {/* Sidebar: List of Templates */}
                            <div className="w-1/3 border-r border-gray-100 pr-4 overflow-y-auto max-h-[400px]">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chọn công đoạn</h3>
                                <div className="space-y-1">
                                    {templates.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setSelectedPrintTask(t)}
                                            className={clsx(
                                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                                selectedPrintTask === t
                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                    : "text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Main: Checkboxes */}
                            <div className="flex-1 pl-2 overflow-y-auto max-h-[400px]">
                                {selectedPrintTask ? (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Thông số in cho: <span className="text-blue-600">{selectedPrintTask}</span>
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(AVAILABLE_SPECS).map(([key, label]) => {
                                                const specs = getSpecsForTask(selectedPrintTask);
                                                const isChecked = specs.includes(key);
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => toggleSpec(selectedPrintTask, key)}
                                                        className={clsx(
                                                            "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                                            isChecked
                                                                ? "border-blue-200 bg-blue-50/50"
                                                                : "border-gray-200 hover:border-gray-300"
                                                        )}
                                                    >
                                                        <div className={clsx(
                                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                            isChecked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                                                        )}>
                                                            {isChecked && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <span className={clsx("text-sm", isChecked ? "font-medium text-gray-900" : "text-gray-600")}>
                                                            {label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="mt-4 text-xs text-gray-400 italic">
                                            Lưu ý: Các thông số đã chọn sẽ được hiển thị trên phiếu in khi in công đoạn này.
                                            Nếu không chọn gì, hệ thống sẽ sử dụng các thông số mặc định (Quy cách, Vật liệu).
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                                        Vui lòng chọn một công đoạn để cấu hình.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
        </div>
    );
};
