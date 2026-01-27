import React, { useRef, useState, useEffect } from 'react';
import { FileText, ChevronRight, Plus, Search, LayoutGrid, List, Eye, Check } from 'lucide-react';
import { GlobalDashboardStats } from './GlobalDashboardStats';
import { ImportPreviewModal } from './ImportPreviewModal';
import { parseODS } from '../utils/odsParser';
import type { LSXData, User } from '../types';

const AVAILABLE_COLUMNS = [
    { key: 'donHangSo', label: 'Đơn Hàng' },
    { key: 'phieuXuat', label: 'Số Phiếu' },
    { key: 'khachHang', label: 'Khách Hàng' },
    { key: 'nguoiLap', label: 'Người Lập' },
    { key: 'ngayYeuCau', label: 'Ngày Yêu Cầu' },
    { key: 'ngayGiaoHang', label: 'Ngày Giao' },
    { key: 'tienDo', label: 'Tiến Độ' },
    { key: 'trangThai', label: 'Trạng Thái' },
] as const;

type ColumnKey = typeof AVAILABLE_COLUMNS[number]['key'];

interface OrderListProps {
    orders: LSXData[];
    onSelectOrder: (orderId: string) => void;
    onImportOrder: (data: LSXData) => void;
    isDashboardView?: boolean;
    currentUser: User;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, onSelectOrder, onImportOrder, isDashboardView, currentUser }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewData, setPreviewData] = useState<LSXData | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Default columns
    const STORAGE_KEY = 'LSX_ORDER_LIST_COLUMNS';

    // Initialize from localStorage or use default
    const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate that parsed columns are valid keys
                const validKeys = AVAILABLE_COLUMNS.map(c => c.key);
                const validParsed = parsed.filter((k: string) => validKeys.includes(k as ColumnKey));
                if (validParsed.length > 0) return validParsed;
            }
        } catch (e) {
            console.error("Failed to load columns preference", e);
        }
        return ['phieuXuat', 'khachHang', 'ngayYeuCau', 'ngayGiaoHang', 'tienDo', 'trangThai'];
    });

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                setIsColumnMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (key: ColumnKey) => {
        setVisibleColumns(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const saveAsDefault = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
            // Optional: Show a toast or small feedback
            setIsColumnMenuOpen(false);
        } catch (e) {
            console.error("Failed to save columns preference", e);
        }
    };

    const renderCell = (order: LSXData, key: ColumnKey, progress: number) => {
        switch (key) {
            case 'donHangSo': return <span className="font-mono text-xs text-surface-500">{order.meta.donHangSo}</span>;
            case 'phieuXuat': return <span className="font-bold text-brand-600 group-hover:text-brand-700">{order.meta.phieuXuat}</span>;
            case 'khachHang': return <span className="font-medium text-surface-700">{order.meta.khachHang}</span>;
            case 'nguoiLap': return <span className="text-surface-500">{order.meta.nguoiLap}</span>;
            case 'ngayYeuCau': return <span className="text-surface-500">{order.meta.ngayYeuCau}</span>;
            case 'ngayGiaoHang': return <span className="text-surface-500">{order.meta.ngayGiaoHang}</span>;
            case 'tienDo': return (
                <div className="flex items-center gap-2">
                    <div className="grow bg-surface-100 rounded-full h-1.5 overflow-hidden w-24">
                        <div
                            className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-surface-600 w-8">{progress}%</span>
                </div>
            );
            case 'trangThai': return (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${progress === 100 ? 'bg-green-100 text-green-700' :
                    progress > 0 ? 'bg-orange-100 text-orange-700' :
                        'bg-surface-100 text-surface-500'
                    }`}>
                    {progress === 100 ? 'Hoàn thành' : progress > 0 ? 'Đang chạy' : 'Mới'}
                </span>
            );
            default: return null;
        }
    };

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
                {!isDashboardView && currentUser.role === 'admin' && (
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

                    <div className="flex items-center gap-4">
                        {!isDashboardView && (
                            <div className="flex bg-surface-100 p-1 rounded-xl items-center">
                                {/* Column Toggle */}
                                {viewMode === 'list' && (
                                    <div className="relative mr-2" ref={columnMenuRef}>
                                        <button
                                            onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                                            className={`p-2 rounded-lg transition-all ${isColumnMenuOpen ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                                            title="Tùy chỉnh cột"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>

                                        {isColumnMenuOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-surface-200 p-2 z-10 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="text-xs font-bold text-surface-400 uppercase tracking-wider px-3 py-2">Hiển thị cột</div>
                                                <div className="space-y-0.5">
                                                    {AVAILABLE_COLUMNS.map(col => (
                                                        <button
                                                            key={col.key}
                                                            onClick={() => toggleColumn(col.key)}
                                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-50 text-sm transition-colors"
                                                        >
                                                            <span className={visibleColumns.includes(col.key) ? 'text-surface-900 font-medium' : 'text-surface-500'}>
                                                                {col.label}
                                                            </span>
                                                            {visibleColumns.includes(col.key) && <Check className="w-4 h-4 text-brand-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="pt-2 mt-2 border-t border-surface-100">
                                                    <button
                                                        onClick={saveAsDefault}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-50 hover:bg-surface-100 text-xs font-bold text-brand-600 transition-colors"
                                                    >
                                                        Lưu mặc định
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="h-4 w-px bg-surface-300 mx-1" />

                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                                    title="Dạng lưới"
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                                    title="Dạng danh sách"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        {isDashboardView && (
                            <button className="text-brand-600 text-sm font-semibold hover:underline">Xem tất cả</button>
                        )}
                    </div>
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
                    <>
                        {viewMode === 'grid' ? (
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
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-surface-50 border-b border-surface-100">
                                                {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                                                    <th key={col.key} className="px-6 py-4 font-bold text-surface-900 whitespace-nowrap">
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {displayedOrders.map((order) => {
                                                const tasks = order.items.flatMap(i => i.tasks || []);
                                                const totalTasks = tasks.length;
                                                const completedTasks = tasks.filter(t => t.status === 'completed').length;
                                                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                                return (
                                                    <tr
                                                        key={order.id}
                                                        onClick={() => order.id && onSelectOrder(order.id)}
                                                        className="hover:bg-surface-50 cursor-pointer transition-colors group"
                                                    >
                                                        {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                                                            <td key={col.key} className="px-6 py-4">
                                                                {renderCell(order, col.key, progress)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
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
