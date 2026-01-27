import React, { useState } from 'react';
import { LSXTable } from './LSXTable';
import { TaskModal } from './TaskModal';
import { DashboardStats } from './DashboardStats';
import { ConfigModal } from './ConfigModal';
import { ArrowLeft, Settings, Trash2, Download, ChevronLeft, ChevronRight, CheckSquare, X, ArrowDownToLine, Pencil, Save } from 'lucide-react';
import { exportOrderDetail } from '../utils/excelExport';
import type { LSXData, LSXItem, Task, ActivityLog, ProductType } from '../types';
import type { PrintConfig } from '../utils/printConfig';

interface OrderDetailViewProps {
    data: LSXData;
    onUpdate: (updatedData: LSXData) => void;
    onBack: () => void;
    onDelete: () => void;
    taskTemplates: string[];
    onUpdateTemplates: (templates: string[]) => void;
    onLogActivity?: (action: ActivityLog['action'], orderId: string, orderName: string, details: Partial<Omit<ActivityLog, 'id' | 'timestamp' | 'action' | 'orderId' | 'orderName'>>) => void;
    printConfig: PrintConfig;
    productTypes?: ProductType[];
    onUpdateProductTypes?: (newTypes: ProductType[]) => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
    onNavigate?: (direction: 'prev' | 'next') => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
    data,
    onUpdate,
    onBack,
    onDelete,
    taskTemplates,
    onUpdateTemplates,
    onLogActivity,
    printConfig,
    productTypes,
    onUpdateProductTypes,
    hasPrevious = false,
    hasNext = false,
    onNavigate
}) => {
    const [selectedItem, setSelectedItem] = useState<LSXItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [selectedBulkTemplate, setSelectedBulkTemplate] = useState<string>('');
    const [selectedBulkTask, setSelectedBulkTask] = useState<string>('');

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(data.meta);

    const handleStartEdit = () => {
        setEditForm(data.meta);
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        onUpdate({ ...data, meta: editForm });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditForm(data.meta);
        setIsEditing(false);
    };

    const handleItemClick = (item: LSXItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleSelectionChange = (newSelected: Set<string>) => {
        setSelectedItemIds(newSelected);
    };

    const handleBulkApplyTemplate = () => {
        if (!productTypes || !selectedBulkTemplate) return;

        const selectedType = productTypes.find(t => t.id === selectedBulkTemplate);
        if (!selectedType) return; // Should not happen

        const newTasks: Task[] = selectedType.tasks.map(taskName => ({
            id: crypto.randomUUID(),
            name: taskName,
            status: 'pending'
        }));

        const newItems = data.items.map(item => {
            if (selectedItemIds.has(item.id)) {
                // Log activity for each item
                if (onLogActivity) {
                    onLogActivity('task_assigned', data.id || '', data.meta.phieuXuat, {
                        itemId: item.id,
                        itemName: item.tenHangHoa,
                        details: {
                            field: 'template',
                            newValue: selectedType.name
                        }
                    });
                }
                // Determine if we should append or replace. For now, let's replace existing tasks if any, or maybe append?
                // The requirement says "Áp dụng Mẫu Loại Sản Phẩm", usually implies setting the state. 
                // Let's replace to be safe and consistent with "Template".
                return { ...item, tasks: newTasks.map(t => ({ ...t, id: crypto.randomUUID() })) }; // Clone tasks for each item
            }
            return item;
        });

        onUpdate({ ...data, items: newItems });
        setSelectedItemIds(new Set()); // Clear selection
        setSelectedBulkTemplate('');
    };

    const handleBulkCompleteTask = () => {
        if (!selectedBulkTask) return;

        let updatedCount = 0;
        const newItems = data.items.map(item => {
            if (selectedItemIds.has(item.id) && item.tasks) {
                const tasks = item.tasks.map(task => {
                    if (task.name === selectedBulkTask && task.status !== 'completed') {
                        updatedCount++;
                        return { ...task, status: 'completed' as const };
                    }
                    return task;
                });
                return { ...item, tasks };
            }
            return item;
        });

        if (updatedCount > 0) {
            onUpdate({ ...data, items: newItems });
            if (onLogActivity) {
                // Log a generic batch activity or individually? 
                // For now, let's log individually for better audit trail, though it might spam execution log.
                // Actually, let's just log one big event or keep it silent for now to avoid spam, 
                // or maybe iterate again to log? Let's iterate selected items to log.
                selectedItemIds.forEach(itemId => {
                    const item = data.items.find(i => i.id === itemId);
                    const task = item?.tasks?.find(t => t.name === selectedBulkTask);
                    if (item && task && task.status !== 'completed') {
                        onLogActivity('task_status_change', data.id || '', data.meta.phieuXuat, {
                            itemId: item.id,
                            itemName: item.tenHangHoa,
                            taskName: selectedBulkTask,
                            details: { oldValue: task.status, newValue: 'completed' }
                        });
                    }
                });
            }
        }

        setSelectedItemIds(new Set());
        setSelectedBulkTask('');
    };

    const handleUpdateTasks = (itemId: string, tasks: Task[]) => {
        const newItems = data.items.map(item => {
            if (item.id === itemId) return { ...item, tasks };
            return item;
        });
        onUpdate({ ...data, items: newItems });
    };

    const currentSelectedItem = selectedItem
        ? data.items.find(i => i.id === selectedItem.id) || selectedItem
        : null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        <button
                            onClick={onBack}
                            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-soft hover:bg-brand-50 hover:text-brand-600 transition-all text-surface-500 border border-surface-100"
                            title="Quay lại danh sách"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        {(onNavigate) && (
                            <div className="flex bg-white rounded-2xl shadow-soft border border-surface-100 overflow-hidden">
                                <button
                                    onClick={() => onNavigate('prev')}
                                    disabled={!hasPrevious}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all text-surface-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-surface-500 border-r border-surface-100"
                                    title="Đơn hàng trước"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => onNavigate('next')}
                                    disabled={!hasNext}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all text-surface-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-surface-500"
                                    title="Đơn hàng tiếp theo"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-surface-400 uppercase tracking-widest mb-1">
                            <span>Lệnh sản xuất</span>
                            <span>/</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.phieuXuat}
                                    onChange={(e) => setEditForm({ ...editForm, phieuXuat: e.target.value })}
                                    className="text-brand-600 border-b border-brand-300 focus:border-brand-600 outline-none bg-transparent px-1 py-0.5 w-32"
                                />
                            ) : (
                                <span className="text-brand-600">{data.meta.phieuXuat}</span>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.khachHang}
                                onChange={(e) => setEditForm({ ...editForm, khachHang: e.target.value })}
                                className="text-3xl font-extrabold text-surface-900 tracking-tight border-b-2 border-surface-200 focus:border-brand-500 outline-none bg-transparent w-full"
                            />
                        ) : (
                            <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">{data.meta.khachHang}</h1>
                        )}
                    </div>
                </div>



                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all font-semibold active:scale-95 text-sm"
                            >
                                <Save className="w-4 h-4" />
                                Lưu
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 px-4 py-3 bg-surface-100 text-surface-600 rounded-xl hover:bg-surface-200 transition-all font-semibold active:scale-95 text-sm"
                            >
                                <X className="w-4 h-4" />
                                Hủy
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleStartEdit}
                                className="flex items-center gap-2 px-4 py-3 bg-white text-brand-600 rounded-xl hover:bg-brand-50 border border-brand-100 shadow-sm transition-all font-semibold active:scale-95 text-sm"
                            >
                                <Pencil className="w-4 h-4" />
                                Sửa
                            </button>
                            <div className="w-px h-10 bg-surface-200 mx-1" />
                            <button
                                onClick={() => exportOrderDetail(data)}
                                className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all font-semibold active:scale-95 text-sm"
                                title="Xuất Excel"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsConfigModalOpen(true)}
                                className="p-3 bg-white text-surface-500 rounded-xl hover:text-brand-600 border border-surface-100 shadow-soft transition-all"
                                title="Cấu hình"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white border border-red-100 shadow-soft transition-all"
                                title="Xóa đơn hàng"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </header >

            <DashboardStats data={data} />

            <div className="premium-card p-8 group">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-surface-900">Thông tin chi tiết</h3>
                    <span className="px-3 py-1 bg-surface-50 text-surface-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-surface-100">Meta Data</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Số đơn hàng</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.donHangSo || ''}
                                onChange={(e) => setEditForm({ ...editForm, donHangSo: e.target.value })}
                                className="w-full text-lg font-bold text-surface-900 border-b border-surface-300 focus:border-brand-500 outline-none bg-transparent"
                            />
                        ) : (
                            <div className="text-lg font-bold text-surface-900">{data.meta.donHangSo}</div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Ngày yêu cầu</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.ngayYeuCau}
                                onChange={(e) => setEditForm({ ...editForm, ngayYeuCau: e.target.value })}
                                className="w-full text-lg font-bold text-surface-900 border-b border-surface-300 focus:border-brand-500 outline-none bg-transparent"
                            />
                        ) : (
                            <div className="text-lg font-bold text-surface-900">{data.meta.ngayYeuCau}</div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Ngày giao hàng</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.ngayGiaoHang}
                                onChange={(e) => setEditForm({ ...editForm, ngayGiaoHang: e.target.value })}
                                className="w-full text-lg font-bold text-brand-600 border-b border-brand-300 focus:border-brand-600 outline-none bg-transparent"
                            />
                        ) : (
                            <div className="text-lg font-bold text-brand-600">{data.meta.ngayGiaoHang}</div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Người phụ trách</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.nguoiLap}
                                onChange={(e) => setEditForm({ ...editForm, nguoiLap: e.target.value })}
                                className="w-full text-lg font-bold text-surface-900 border-b border-surface-300 focus:border-brand-500 outline-none bg-transparent"
                            />
                        ) : (
                            <div className="text-lg font-bold text-surface-900">{data.meta.nguoiLap}</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <h3 className="text-xl font-bold text-surface-900">Danh mục hàng hóa</h3>
                    <span className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-lg text-xs font-bold">{data.items.length} mặt hàng</span>
                </div>
                <LSXTable
                    items={data.items}
                    onItemClick={handleItemClick}
                    order={data}
                    printConfig={printConfig}
                    selectedItems={selectedItemIds}
                    onSelectionChange={handleSelectionChange}
                />
            </div>

            {/* Bulk Action Bar */}
            {
                selectedItemIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 duration-300 border border-surface-700">
                        <div className="flex items-center gap-3 pr-6 border-r border-surface-700">
                            <div className="bg-brand-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {selectedItemIds.size}
                            </div>
                            <span className="font-medium text-sm">Đã chọn</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Group 1: Apply Template */}
                            <div className="flex items-center gap-2 border-r border-surface-700 pr-4">
                                <select
                                    value={selectedBulkTemplate}
                                    onChange={(e) => setSelectedBulkTemplate(e.target.value)}
                                    className="bg-surface-800 border-surface-600 text-white text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 min-w-[180px]"
                                >
                                    <option value="">Mẫu sản phẩm...</option>
                                    {productTypes?.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkApplyTemplate}
                                    disabled={!selectedBulkTemplate}
                                    className="px-3 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                >
                                    <ArrowDownToLine className="w-4 h-4" />
                                    Áp dụng
                                </button>
                            </div>

                            {/* Group 2: Mark Complete */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedBulkTask}
                                    onChange={(e) => setSelectedBulkTask(e.target.value)}
                                    className="bg-surface-800 border-surface-600 text-white text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 min-w-[180px]"
                                >
                                    <option value="">Chọn công đoạn...</option>
                                    {taskTemplates.map(task => (
                                        <option key={task} value={task}>{task}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkCompleteTask}
                                    disabled={!selectedBulkTask}
                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                >
                                    <CheckSquare className="w-4 h-4" />
                                    Hoàn thành
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedItemIds(new Set())}
                                className="p-2 ml-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors"
                                title="Hủy chọn"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )
            }

            {
                currentSelectedItem && (
                    <TaskModal
                        item={currentSelectedItem}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onUpdateTasks={handleUpdateTasks}
                        availableTasks={taskTemplates}
                        order={data}
                        onLogActivity={onLogActivity}
                        printConfig={printConfig}
                        productTypes={productTypes}
                    />
                )
            }

            <ConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                templates={taskTemplates}
                onUpdateTemplates={onUpdateTemplates}
                productTypes={productTypes}
                onUpdateProductTypes={onUpdateProductTypes}
            />
        </div >
    );
};
