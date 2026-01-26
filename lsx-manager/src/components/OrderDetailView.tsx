import React, { useState } from 'react';
import { LSXTable } from './LSXTable';
import { TaskModal } from './TaskModal';
import { DashboardStats } from './DashboardStats';
import { ConfigModal } from './ConfigModal';
import { ArrowLeft, Settings, Trash2, Download } from 'lucide-react';
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
    onUpdateProductTypes
}) => {
    const [selectedItem, setSelectedItem] = useState<LSXItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const handleItemClick = (item: LSXItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
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
                    <button
                        onClick={onBack}
                        className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-soft hover:bg-brand-50 hover:text-brand-600 transition-all text-surface-500 border border-surface-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-surface-400 uppercase tracking-widest mb-1">
                            <span>Lệnh sản xuất</span>
                            <span>/</span>
                            <span className="text-brand-600">{data.meta.phieuXuat}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">{data.meta.khachHang}</h1>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => exportOrderDetail(data)}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all font-semibold active:scale-95 text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Xuất Excel
                    </button>
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="p-3 bg-white text-surface-500 rounded-xl hover:text-brand-600 border border-surface-100 shadow-soft transition-all"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white border border-red-100 shadow-soft transition-all"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <DashboardStats data={data} />

            <div className="premium-card p-8 group">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-surface-900">Thông tin chi tiết</h3>
                    <span className="px-3 py-1 bg-surface-50 text-surface-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-surface-100">Meta Data</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Số đơn hàng</span>
                        <div className="text-lg font-bold text-surface-900">{data.meta.donHangSo}</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Ngày yêu cầu</span>
                        <div className="text-lg font-bold text-surface-900">{data.meta.ngayYeuCau}</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Ngày giao hàng</span>
                        <div className="text-lg font-bold text-brand-600">{data.meta.ngayGiaoHang}</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-surface-400 tracking-widest">Người phụ trách</span>
                        <div className="text-lg font-bold text-surface-900">{data.meta.nguoiLap}</div>
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
                />
            </div>

            {currentSelectedItem && (
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
            )}

            <ConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                templates={taskTemplates}
                onUpdateTemplates={onUpdateTemplates}
                productTypes={productTypes}
                onUpdateProductTypes={onUpdateProductTypes}
            />
        </div>
    );
};
