import React, { useRef, useState } from 'react';
import { FileText, Calendar, ChevronRight, Plus, Upload } from 'lucide-react';
import { GlobalDashboardStats } from './GlobalDashboardStats';
import { ImportPreviewModal } from './ImportPreviewModal';
import { parseODS } from '../utils/odsParser';
import type { LSXData } from '../types';

interface OrderListProps {
    orders: LSXData[];
    onSelectOrder: (orderId: string) => void;
    onImportOrder: (data: LSXData) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onSelectOrder, onImportOrder }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewData, setPreviewData] = useState<LSXData | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const data = await parseODS(file);
                setPreviewData(data);
                setIsPreviewOpen(true);
            } catch (err) {
                console.error(err);
                alert("Lỗi khi đọc file: " + (err instanceof Error ? err.message : String(err)));
            }
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirmImport = (editedData: LSXData) => {
        onImportOrder(editedData);
        setIsPreviewOpen(false);
        setPreviewData(null);
    };

    const handleCancelImport = () => {
        setIsPreviewOpen(false);
        setPreviewData(null);
    };

    return (
        <div className="max-w-[1600px] mx-auto pt-6">
            <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn Hàng LSX</h1>
                    <p className="text-gray-500 text-sm mt-1">Hệ thống theo dõi tiến độ sản xuất tập trung</p>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Tạo đơn mới
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".ods,.xlsx,.xls"
                />
            </header>

            <GlobalDashboardStats orders={orders} />

            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Danh sách đơn hàng ({orders.length})
                </h2>

                {orders.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Chưa có đơn hàng nào. Hãy nhấn "Tạo đơn mới" để bắt đầu.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.map((order) => {
                            const totalItems = order.items.length;
                            const totalTasks = order.items.flatMap(i => i.tasks || []).length;
                            const completedTasks = order.items.flatMap(i => i.tasks || []).filter(t => t.status === 'completed').length;
                            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => order.id && onSelectOrder(order.id)}
                                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1" title={order.meta.phieuXuat}>
                                                {order.meta.phieuXuat}
                                            </h3>
                                            <span className={
                                                `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                                ${progress === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`
                                            }>
                                                {progress}%
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{order.meta.khachHang}</p>

                                        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" />
                                                {totalItems} mã
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {order.meta.ngayGiaoHang}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ImportPreviewModal
                data={previewData}
                isOpen={isPreviewOpen}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelImport}
            />
        </div>
    );
};
