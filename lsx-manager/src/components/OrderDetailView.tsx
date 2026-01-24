import React, { useState } from 'react';
import { LSXTable } from './LSXTable';
import { TaskModal } from './TaskModal';
import { DashboardStats } from './DashboardStats';
import { ConfigModal } from './ConfigModal';
import { ArrowLeft, Settings, Trash2, Download } from 'lucide-react';
import { exportOrderDetail } from '../utils/excelExport';
import type { LSXData, LSXItem, Task, ActivityLog } from '../types';

interface OrderDetailViewProps {
    data: LSXData;
    onUpdate: (updatedData: LSXData) => void;
    onBack: () => void;
    onDelete: () => void;
    taskTemplates: string[];
    onUpdateTemplates: (templates: string[]) => void;
    onLogActivity?: (action: ActivityLog['action'], orderId: string, orderName: string, details: Partial<Omit<ActivityLog, 'id' | 'timestamp' | 'action' | 'orderId' | 'orderName'>>) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
    data,
    onUpdate,
    onBack,
    onDelete,
    taskTemplates,
    onUpdateTemplates,
    onLogActivity
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
            if (item.id === itemId) {
                return { ...item, tasks };
            }
            return item;
        });

        onUpdate({ ...data, items: newItems });
    };

    const currentSelectedItem = selectedItem
        ? data.items.find(i => i.id === selectedItem.id) || selectedItem
        : null;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-900 hover:shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{data.meta.phieuXuat}</h1>
                        <p className="text-gray-500">Khách hàng: {data.meta.khachHang}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => exportOrderDetail(data)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-md hover:bg-green-100 shadow-sm transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Xuất Excel
                    </button>
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm transition-colors text-sm font-medium"
                    >
                        <Settings className="w-4 h-4" />
                        Cấu hình
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-md hover:bg-red-100 shadow-sm transition-colors text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa đơn
                    </button>
                </div>
            </header>

            <DashboardStats data={data} />

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold border-b pb-2 mb-4 text-gray-800">Thông tin chung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                    <div>
                        <span className="text-gray-500 block">Đơn hàng số</span>
                        <span className="font-semibold text-gray-900">{data.meta.donHangSo}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Ngày yêu cầu</span>
                        <span className="font-semibold text-gray-900">{data.meta.ngayYeuCau}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Ngày giao hàng</span>
                        <span className="font-semibold text-gray-900">{data.meta.ngayGiaoHang}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Người lập</span>
                        <span className="font-semibold text-gray-900">{data.meta.nguoiLap}</span>
                    </div>
                </div>
            </div>

            <LSXTable items={data.items} onItemClick={handleItemClick} />

            {currentSelectedItem && (
                <TaskModal
                    item={currentSelectedItem}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUpdateTasks={handleUpdateTasks}
                    availableTasks={taskTemplates}
                    order={data}
                    onLogActivity={onLogActivity}
                />
            )}

            <ConfigModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                templates={taskTemplates}
                onUpdateTemplates={onUpdateTemplates}
            />
        </div>
    );
};
