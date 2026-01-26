import React, { useRef, useState } from 'react';
import { FileText, ChevronRight, Plus, Search } from 'lucide-react';
import { GlobalDashboardStats } from './GlobalDashboardStats';
import { ImportPreviewModal } from './ImportPreviewModal';
import { parseODS } from '../utils/odsParser';
import type { LSXData } from '../types';

interface OrderListProps {
    orders: LSXData[];
    onSelectOrder: (orderId: string) => void;
    onImportOrder: (data: LSXData) => void;
    isDashboardView?: boolean;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onSelectOrder, onImportOrder, isDashboardView }) => {
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

    const displayedOrders = isDashboardView ? orders.slice(0, 4) : orders;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
                        {isDashboardView ? "Trạng thái sản xuất" : "Quản lý Đơn hàng"}
                    </h1>
                    <p className="text-surface-500 mt-1">
                        {isDashboardView
                            ? "Thống kê tổng quan và các đơn hàng gần đây"
                            : `Tổng cộng ${orders.length} lệnh sản xuất đang được theo dõi`}
                    </p>
                </div>
                {!isDashboardView && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all font-semibold active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Nhập đơn mới
                    </button>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".ods,.xlsx,.xls"
                />
            </div>

            <GlobalDashboardStats orders={orders} />

            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                        {isDashboardView ? "Lệnh sản xuất gần đây" : "Danh sách lệnh sản xuất"}
                        <span className="bg-surface-100 text-surface-600 px-2 py-0.5 rounded-lg text-xs font-bold">
                            {displayedOrders.length}
                        </span>
                    </h2>
                    {isDashboardView && (
                        <button className="text-brand-600 text-sm font-semibold hover:underline">Xem tất cả</button>
                    )}
                </div>

                {orders.length === 0 ? (
                    <div className=" premium-card p-16 text-center text-surface-400 group border-dashed border-2 border-surface-200 bg-surface-50/50">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                            <Search className="w-8 h-8 text-surface-300 group-hover:text-brand-500 transition-colors" />
                        </div>
                        <p className="text-lg font-medium text-surface-600">Không tìm thấy đơn hàng</p>
                        <p className="text-sm">Thử tìm theo tên phiếu xuất, khách hàng hoặc tên sản phẩm khác.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedOrders.map((order) => {
                            const totalItems = order.items.length;
                            const tasks = order.items.flatMap(i => i.tasks || []);
                            const totalTasks = tasks.length;
                            const completedTasks = tasks.filter(t => t.status === 'completed').length;
                            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => order.id && onSelectOrder(order.id)}
                                    className="premium-card p-6 cursor-pointer group hover:-translate-y-1"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${progress === 100
                                            ? 'bg-green-100 text-green-700'
                                            : progress > 0 ? 'bg-orange-100 text-orange-700' : 'bg-surface-100 text-surface-600'
                                            }`}>
                                            {progress === 100 ? 'Hoàn thành' : progress > 0 ? 'Đang chạy' : 'Chưa bắt đầu'}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-surface-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-1" title={order.meta.phieuXuat}>
                                        {order.meta.phieuXuat}
                                    </h3>
                                    <p className="text-surface-500 text-sm line-clamp-1 mb-6 font-medium leading-relaxed">
                                        {order.meta.khachHang}
                                    </p>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-[11px] font-bold text-surface-400 uppercase tracking-tighter">
                                            <span>Tiến độ</span>
                                            <span className="text-brand-600">{progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${progress === 100 ? 'bg-green-500' : 'bg-brand-500'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-surface-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Mã hàng</span>
                                                <span className="text-sm font-bold text-surface-700">{totalItems}</span>
                                            </div>
                                            <div className="w-px h-6 bg-surface-100" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">Giao hàng</span>
                                                <span className="text-sm font-bold text-surface-700">{order.meta.ngayGiaoHang}</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center text-surface-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                                            <ChevronRight className="w-4 h-4" />
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

