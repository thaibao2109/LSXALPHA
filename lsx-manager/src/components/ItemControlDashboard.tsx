import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, LayoutGrid, List, ChevronRight, Package, ClipboardCheck, Circle, CheckCircle2, Eye, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import type { LSXData, Task, StatusDefinition, TaskStatus } from '../types';

const BASE_COLUMNS = [
    { key: 'marking', label: 'Mã hàng' },
    { key: 'tenHangHoa', label: 'Tên sản phẩm' },
    { key: 'slYeuCau', label: 'Số lượng' },
    { key: 'quyCach', label: 'Kích thước' },
    { key: 'beMat', label: 'Lớp mạ' },
    { key: 'phieuXuat', label: 'Lệnh sản xuất' },
    { key: 'preparation', label: 'Chuẩn bị' },
    { key: 'progress', label: 'Tiến độ' },
    { key: 'status', label: 'Trạng thái' },
] as const;

type BaseColumnKey = typeof BASE_COLUMNS[number]['key'];

interface ItemControlDashboardProps {
    orders: LSXData[];
    onSelectOrder: (orderId: string) => void;
    onUpdateTaskStatus?: (orderId: string, itemId: string, taskId: string, newStatus: TaskStatus) => void;
    onUpdatePrepStatus?: (orderId: string, itemId: string, field: 'prepMaterial' | 'prepTool', newStatus: 'đã có' | 'đang làm' | 'chưa có') => void;
    taskStatuses: StatusDefinition[];
}

export const ItemControlDashboard: React.FC<ItemControlDashboardProps> = ({ orders, onSelectOrder, onUpdateTaskStatus, onUpdatePrepStatus, taskStatuses }) => {
    const STORAGE_KEY = 'LSX_ITEM_CONTROL_COLUMNS_V3';
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // --- Column Resizing Logic ---
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('LSX_ITEM_CONTROL_WIDTHS');
        if (saved) return JSON.parse(saved);
        return {
            marking: 100,
            tenHangHoa: 200,
            slYeuCau: 100,
            quyCach: 140,
            beMat: 100,
            phieuXuat: 160,
            preparation: 200,
            progress: 120,
            status: 110,
        };
    });

    const [taskColumnWidths, setTaskColumnWidths] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('LSX_ITEM_CONTROL_TASK_WIDTHS');
        if (saved) return JSON.parse(saved);
        return {};
    });

    const resizingColumn = useRef<{ key: string, isTask: boolean, startX: number, startWidth: number } | null>(null);

    const onMouseDown = (e: React.MouseEvent, key: string, isTask: boolean = false) => {
        e.preventDefault();
        const startWidth = isTask ? (taskColumnWidths[key] || 100) : columnWidths[key];
        resizingColumn.current = { key, isTask, startX: e.pageX, startWidth };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingColumn.current) return;
            const { key, isTask, startX, startWidth } = resizingColumn.current;
            const diff = e.pageX - startX;
            const newWidth = Math.max(50, startWidth + diff);

            if (isTask) {
                setTaskColumnWidths(prev => ({ ...prev, [key]: newWidth }));
            } else {
                setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
            }
        };

        const handleMouseUp = () => {
            if (resizingColumn.current) {
                localStorage.setItem('LSX_ITEM_CONTROL_WIDTHS', JSON.stringify(columnWidths));
                localStorage.setItem('LSX_ITEM_CONTROL_TASK_WIDTHS', JSON.stringify(taskColumnWidths));
            }
            resizingColumn.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [columnWidths, taskColumnWidths]);

    // Flatten items from all orders
    const allItems = useMemo(() => orders.flatMap(order =>
        order.items.map(item => ({
            ...item,
            orderId: order.id,
            phieuXuat: order.meta.phieuXuat,
            donHangSo: order.meta.donHangSo,
            khachHang: order.meta.khachHang,
            ngayYeuCau: order.meta.ngayYeuCau,
            orderStatus: order.status
        }))
    ), [orders]);

    // Extract unique task names in order of appearance
    const uniqueTaskNames = useMemo(() => {
        const names: string[] = [];
        allItems.forEach(item => {
            (item.tasks || []).forEach(task => {
                if (!names.includes(task.name)) {
                    names.push(task.name);
                }
            });
        });
        return names;
    }, [allItems]);

    const [visibleColumns, setVisibleColumns] = useState<BaseColumnKey[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const validKeys = BASE_COLUMNS.map(c => c.key);
                const validParsed = parsed.filter((k: string) => validKeys.includes(k as BaseColumnKey));
                if (validParsed.length > 0) return validParsed;
            }
        } catch (e) {
            console.error("Failed to load columns preference", e);
        }
        return ['marking', 'tenHangHoa', 'slYeuCau', 'quyCach', 'beMat', 'phieuXuat', 'preparation', 'progress', 'status'];
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                setIsColumnMenuOpen(false);
            }
            if (openDropdownId && !(event.target as HTMLElement).closest('.status-dropdown')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    const toggleColumn = (key: BaseColumnKey) => {
        const newColumns = visibleColumns.includes(key)
            ? visibleColumns.filter(k => k !== key)
            : [...visibleColumns, key];
        setVisibleColumns(newColumns);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
    };

    const calculateProgress = (tasks?: Task[]) => {
        if (!tasks || tasks.length === 0) return 0;
        const completedCount = tasks.filter(t => {
            const statusDef = taskStatuses.find(s => s.id === t.status);
            return statusDef?.isDone;
        }).length;
        return Math.round((completedCount / tasks.length) * 100);
    };

    const getItemStatus = (item: any) => {
        const progress = calculateProgress(item.tasks);
        if (progress === 100) return 'completed';
        if (progress > 0) return 'in_progress';
        return 'pending';
    };

    const checkIsOverdue = (item: any) => {
        if (getItemStatus(item) === 'completed') return false;

        const isPrepStuck = item.prepMaterial === 'chưa có' || item.prepTool === 'chưa có';
        
        if (isPrepStuck && item.ngayYeuCau) {
            try {
                let dateStr = item.ngayYeuCau;
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
                const reqDate = new Date(dateStr);
                const now = new Date();
                reqDate.setHours(0,0,0,0);
                now.setHours(0,0,0,0);
                const diffTime = now.getTime() - reqDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24); 
                
                // Alert if stuck for 3 or more days
                if (diffDays >= 3) return true; 
            } catch (e) {
                console.error("Date parse error", e);
            }
        }
        return false;
    };

    const filteredItems = allItems.filter(item => {
        const matchesSearch =
            item.marking?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tenHangHoa.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.phieuXuat.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.donHangSo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.khachHang?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.quyCach?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.beMat?.toLowerCase().includes(searchQuery.toLowerCase());

        const status = getItemStatus(item);
        const matchesStatus = statusFilter === 'all' || status === statusFilter || (statusFilter === 'overdue' && checkIsOverdue(item));

        return matchesSearch && matchesStatus;
    });

    const overdueCount = allItems.filter(i => checkIsOverdue(i)).length;

    const handleUpdateStatus = (orderId: string, itemId: string, taskId: string, newStatus: string) => {
        if (!onUpdateTaskStatus) return;
        onUpdateTaskStatus(orderId, itemId, taskId, newStatus);
        setOpenDropdownId(null);
    };

    const renderTaskStatus = (orderId: string, itemId: string, task: Task) => {
        const currentStatus = taskStatuses.find(s => s.id === task.status) || taskStatuses[0] || { id: 'unknown', label: 'N/A', color: '#cbd5e1', isDone: false };
        const dropdownId = `${orderId}-${itemId}-${task.id}`;
        const isOpen = openDropdownId === dropdownId;

        return (
            <div className="relative status-dropdown flex justify-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(isOpen ? null : dropdownId);
                    }}
                    className={`flex items-center justify-center p-1 rounded transition-all hover:scale-110 active:scale-95 shadow-sm border border-surface-100`}
                    style={{ 
                        backgroundColor: `${currentStatus.color}15`, 
                        color: currentStatus.color 
                    }}
                    title={`${currentStatus.label} - Click để đổi`}
                >
                    {currentStatus.isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : task.status === 'pending' || !task.status ? (
                        <Circle className="w-4 h-4" />
                    ) : (
                        <Circle className="w-4 h-4 fill-current animate-pulse" />
                    )}
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-surface-200 py-1 z-[100] animate-in fade-in zoom-in-95 duration-150">
                        {taskStatuses.map(status => (
                            <button
                                key={status.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(orderId, itemId, task.id, status.id);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-surface-50
                                    ${task.status === status.id ? 'bg-surface-50 text-surface-900' : 'text-surface-600'}`}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                {status.label}
                                {task.status === status.id && <Check className="w-3 h-3 ml-auto text-brand-600" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const PREP_STATUSES = [
        { id: 'chưa có', label: 'Chưa có', color: '#94a3b8' },
        { id: 'đang làm', label: 'Đang làm', color: '#3b82f6' },
        { id: 'đã có', label: 'Đã có', color: '#22c55e' }
    ];

    const renderPrepStatus = (orderId: string, itemId: string, field: 'prepMaterial' | 'prepTool', currentVal: string = 'chưa có') => {
        const dropdownId = `${orderId}-${itemId}-${field}`;
        const isOpen = openDropdownId === dropdownId;
        const currentStatus = PREP_STATUSES.find(s => s.id === currentVal) || PREP_STATUSES[0];

        return (
            <div className="relative status-dropdown flex justify-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(isOpen ? null : dropdownId);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold transition-all shadow-sm border border-surface-100 hover:scale-105 min-w-[70px] justify-center`}
                    style={{ 
                        backgroundColor: `${currentStatus.color}15`, 
                        color: currentStatus.color 
                    }}
                    title="Click để đổi trạng thái"
                >
                    {currentStatus.label}
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-1 w-28 bg-white rounded-lg shadow-xl border border-surface-200 py-1 z-[100] animate-in fade-in zoom-in-95 duration-150">
                        {PREP_STATUSES.map(status => (
                            <button
                                key={status.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onUpdatePrepStatus) {
                                        onUpdatePrepStatus(orderId, itemId, field, status.id as any);
                                    }
                                    setOpenDropdownId(null);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-surface-50
                                    ${currentVal === status.id ? 'bg-surface-50 text-surface-900' : 'text-surface-600'}`}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                {status.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderProgress = (progress: number) => (
        <div className="flex items-center gap-2">
            <div className="grow bg-surface-100 rounded-full h-1.5 overflow-hidden min-w-[60px]">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-brand-500'
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className="text-[10px] font-bold text-surface-600 w-8">{progress}%</span>
        </div>
    );

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-100 text-green-700">Đã xong</span>;
            case 'in_progress':
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">Đang làm</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-surface-100 text-surface-500">Chờ</span>;
        }
    };

    const renderCell = (item: any, key: BaseColumnKey) => {
        const progress = calculateProgress(item.tasks);
        switch (key) {
            case 'marking':
                const overdue = checkIsOverdue(item);
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold px-2 py-1 rounded text-[10px] ${overdue ? 'text-red-700 bg-red-100' : 'text-brand-600 bg-brand-50'}`}>
                            {item.marking || 'N/A'}
                        </span>
                        {overdue && (
                            <span title="Cảnh báo: Thiếu vật tư/dụng cụ quá 3 ngày">
                              <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                            </span>
                        )}
                    </div>
                );
            case 'tenHangHoa':
                return (
                    <div>
                        <div className="font-medium text-surface-900 text-xs line-clamp-1">{item.tenHangHoa}</div>
                    </div>
                );
            case 'quyCach':
                return <div className="text-surface-600 text-[11px] truncate max-w-[120px] font-medium">{item.quyCach}</div>;
            case 'beMat':
                return <div className="text-surface-600 text-[11px] truncate max-w-[100px]">{item.beMat}</div>;
            case 'phieuXuat':
                return (
                    <div>
                        <div className="text-surface-700 font-semibold text-xs">{item.phieuXuat}</div>
                        <div className="text-[10px] text-surface-500 line-clamp-1 max-w-[100px]">{item.khachHang}</div>
                    </div>
                );
            case 'slYeuCau':
                return <div className="text-center font-bold text-surface-700 text-xs">{item.slYeuCau} {item.donVi}</div>;
            case 'preparation':
                return (
                    <div className="flex items-center gap-2 min-w-[160px]">
                        <div className="flex flex-col items-center gap-1.5 w-1/2">
                            <span className="text-[9px] text-surface-400 font-bold uppercase tracking-wider">Vật liệu</span>
                            {renderPrepStatus(item.orderId, item.id, 'prepMaterial', item.prepMaterial)}
                        </div>
                        <div className="w-px h-8 bg-surface-200"></div>
                        <div className="flex flex-col items-center gap-1.5 w-1/2">
                            <span className="text-[9px] text-surface-400 font-bold uppercase tracking-wider">Công cụ</span>
                            {renderPrepStatus(item.orderId, item.id, 'prepTool', item.prepTool)}
                        </div>
                    </div>
                );
            case 'progress':
                return renderProgress(progress);
            case 'status':
                return renderStatusBadge(getItemStatus(item));
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-surface-900 tracking-tight flex items-center gap-3">
                        <ClipboardCheck className="w-8 h-8 text-brand-600" />
                        Kiểm soát Mã hàng
                    </h1>
                    <p className="text-sm md:text-base text-surface-500 mt-1">
                        Theo dõi tiến độ chi tiết từng công đoạn cho tất cả các mã hàng
                    </p>
                </div>
            </div>

            {/* Overdue Alert Banner */}
            {overdueCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-red-800 font-bold text-sm">Cảnh báo trễ hạn</h3>
                        <p className="text-red-600 text-xs mt-1">
                            Có <strong>{overdueCount}</strong> mã hàng đang bị kẹt ở trạng thái "Chờ sản xuất" hoặc thiếu vật tư/dụng cụ quá 3 ngày kể từ ngày yêu cầu. Vui lòng kiểm tra và xử lý gấp.
                        </p>
                        <button 
                            onClick={() => setStatusFilter('overdue')}
                            className="mt-2 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            Xem các mã trễ hạn
                        </button>
                    </div>
                </div>
            )}

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo mã hàng, tên hàng, số đơn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-50 border-none py-2 pl-10 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-surface-50 border-none py-2 px-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 font-medium"
                    >
                        <option value="all">Tất cả mã hàng</option>
                        <option value="pending">Chờ sản xuất</option>
                        <option value="in_progress">Đang sản xuất</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="overdue">⚠️ Trễ hạn / Cảnh báo</option>
                    </select>

                    <div className="flex bg-surface-100 p-1 rounded-xl items-center">
                        {viewMode === 'list' && (
                            <div className="relative mr-1" ref={columnMenuRef}>
                                <button
                                    onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                                    className={`p-1.5 rounded-lg transition-all ${isColumnMenuOpen ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                                    title="Tùy chỉnh cột cơ bản"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>

                                {isColumnMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-surface-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider px-2 py-1.5 border-b border-surface-50 mb-1">Cột cơ bản</div>
                                        <div className="space-y-0.5">
                                            {BASE_COLUMNS.map(col => (
                                                <button
                                                    key={col.key}
                                                    onClick={() => toggleColumn(col.key)}
                                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-50 text-xs transition-colors"
                                                >
                                                    <span className={visibleColumns.includes(col.key) ? 'text-surface-900 font-medium' : 'text-surface-500'}>
                                                        {col.label}
                                                    </span>
                                                    {visibleColumns.includes(col.key) && <Check className="w-3 h-3 text-brand-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="w-px h-4 bg-surface-300 mx-1" />

                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Tổng mã hàng</p>
                    <p className="text-2xl font-black text-surface-900">{allItems.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Đang sản xuất</p>
                    <p className="text-2xl font-black text-blue-600">{allItems.filter(i => getItemStatus(i) === 'in_progress').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Hoàn thành</p>
                    <p className="text-2xl font-black text-green-600">{allItems.filter(i => getItemStatus(i) === 'completed').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Tỉ lệ hoàn thành</p>
                    <p className="text-2xl font-black text-brand-600">
                        {allItems.length > 0 ? Math.round((allItems.filter(i => getItemStatus(i) === 'completed').length / allItems.length) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Main Content */}
            {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-surface-200">
                    <Package className="w-12 h-12 text-surface-200 mx-auto mb-4" />
                    <p className="text-surface-500 font-medium">Không tìm thấy mã hàng nào phù hợp</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm table-fixed min-w-[1200px]">
                            <thead>
                                <tr className="bg-surface-50">
                                    {BASE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => {
                                        if (col.key === 'preparation') {
                                            return (
                                                <th
                                                    key={col.key}
                                                    colSpan={2}
                                                    className="px-2 py-2 font-bold text-surface-900 text-center border-b border-x border-surface-200 bg-green-100/50"
                                                >
                                                    {col.label}
                                                </th>
                                            );
                                        }
                                        return (
                                            <th
                                                key={col.key}
                                                rowSpan={2}
                                                style={{ width: columnWidths[col.key] }}
                                                className={`px-4 py-4 font-bold text-surface-900 relative group border-b border-r border-surface-200 ${col.key === 'slYeuCau' ? 'text-center' : ''}`}
                                            >
                                                {col.label}
                                                <div
                                                    onMouseDown={(e) => onMouseDown(e, col.key)}
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500/30 group-hover:bg-surface-200 transition-colors z-10"
                                                />
                                            </th>
                                        );
                                    })}
                                    {/* Dynamic Task Columns */}
                                    {uniqueTaskNames.length > 0 && (
                                        <th
                                            colSpan={uniqueTaskNames.length}
                                            className="px-2 py-2 font-bold text-surface-900 text-center border-b border-r border-surface-200 bg-blue-50/80"
                                        >
                                            CÔNG ĐOẠN
                                        </th>
                                    )}
                                    <th rowSpan={2} className="px-4 py-4 w-10 border-b border-surface-200"></th>
                                </tr>
                                <tr className="bg-surface-50 border-b border-surface-200">
                                    {BASE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => {
                                        if (col.key === 'preparation') {
                                            return (
                                                <React.Fragment key={`${col.key}-sub`}>
                                                    <th style={{ width: columnWidths[col.key] / 2 }} className="px-2 py-2 font-bold text-green-900 text-center text-[10px] uppercase border-r border-surface-200 bg-green-50 relative group">
                                                        Vật liệu
                                                        <div
                                                            onMouseDown={(e) => onMouseDown(e, col.key)}
                                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500/30 group-hover:bg-surface-200 transition-colors z-10"
                                                        />
                                                    </th>
                                                    <th style={{ width: columnWidths[col.key] / 2 }} className="px-2 py-2 font-bold text-green-900 text-center text-[10px] uppercase border-r border-surface-200 bg-green-50">
                                                        Công cụ
                                                    </th>
                                                </React.Fragment>
                                            );
                                        }
                                        return null;
                                    })}
                                    {uniqueTaskNames.map(taskName => (
                                        <th
                                            key={taskName}
                                            style={{ width: taskColumnWidths[taskName] || 100 }}
                                            className="px-2 py-2 font-bold text-blue-900 text-center text-[10px] uppercase truncate relative group border-r border-surface-200 bg-blue-50/50"
                                            title={taskName}
                                        >
                                            {taskName}
                                            <div
                                                onMouseDown={(e) => onMouseDown(e, taskName, true)}
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-500/30 group-hover:bg-surface-200 transition-colors z-10"
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100">
                                {(() => {
                                    let lastOrderId = '';
                                    let groupIndex = -1;
                                    
                                    return filteredItems.map((item, idx) => {
                                        if (item.orderId !== lastOrderId) {
                                            lastOrderId = item.orderId!;
                                            groupIndex++;
                                        }
                                        const isEvenGroup = groupIndex % 2 === 0;

                                        return (
                                            <tr
                                                key={`${item.orderId}-${item.id}-${idx}`}
                                                className={`cursor-pointer group transition-colors ${
                                                    isEvenGroup ? 'bg-white hover:bg-surface-50' : 'bg-surface-100/60 hover:bg-surface-200/60'
                                                }`}
                                                onClick={() => item.orderId && onSelectOrder(item.orderId)}
                                            >
                                                {BASE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => {
                                                    if (col.key === 'preparation') {
                                                        return (
                                                            <React.Fragment key={col.key}>
                                                                <td className="px-2 py-4 border-l border-r border-surface-200 text-center relative group/td bg-green-50/30">
                                                                    <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover/td:opacity-100 pointer-events-none transition-opacity"></div>
                                                                    {renderPrepStatus(item.orderId!, item.id, 'prepMaterial', item.prepMaterial)}
                                                                </td>
                                                                <td className="px-2 py-4 border-r border-surface-200 text-center relative group/td bg-green-50/30">
                                                                    <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover/td:opacity-100 pointer-events-none transition-opacity"></div>
                                                                    {renderPrepStatus(item.orderId!, item.id, 'prepTool', item.prepTool)}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    }
                                                    return (
                                                        <td key={col.key} className="px-4 py-4 border-r border-surface-200">
                                                            {renderCell(item, col.key)}
                                                        </td>
                                                    );
                                                })}
                                                {/* Dynamic Task Status Cells */}
                                                {uniqueTaskNames.map(taskName => {
                                                    const task = (item.tasks || []).find(t => t.name === taskName);
                                                    return (
                                                        <td key={taskName} className="px-2 py-4 text-center border-r border-surface-200 bg-blue-50/10">
                                                            {task ? renderTaskStatus(item.orderId!, item.id, task) : (
                                                                <span className="text-surface-300 font-medium text-xs">x</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-4 text-right">
                                                    <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item, idx) => {
                        const progress = calculateProgress(item.tasks);
                        return (
                            <div
                                key={`${item.orderId}-${item.id}-${idx}`}
                                onClick={() => item.orderId && onSelectOrder(item.orderId)}
                                className={`bg-white p-5 rounded-2xl border ${checkIsOverdue(item) ? 'border-red-300 shadow-red-100' : 'border-surface-200'} shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group relative`}
                            >
                                {checkIsOverdue(item) && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg animate-pulse" title="Cảnh báo trễ hạn">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`font-mono font-bold px-2 py-1 rounded text-[10px] ${checkIsOverdue(item) ? 'text-red-700 bg-red-100' : 'text-brand-600 bg-brand-50'}`}>
                                        {item.marking || 'N/A'}
                                    </span>
                                    {renderStatusBadge(getItemStatus(item))}
                                </div>
                                <h3 className="font-bold text-surface-900 line-clamp-1 mb-1 text-sm">{item.tenHangHoa}</h3>
                                <p className="text-[10px] text-surface-500 mb-4 line-clamp-1">{item.phieuXuat} | {item.khachHang}</p>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-surface-400 uppercase">Tiến độ</span>
                                            <span className="text-xs font-bold text-brand-600">{progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-brand-500'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-surface-50">
                                        <div className="text-[10px] font-bold text-surface-400 uppercase mb-2">Chuẩn bị</div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-surface-500 font-medium">Vật liệu:</span>
                                                {renderPrepStatus(item.orderId!, item.id, 'prepMaterial', item.prepMaterial)}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-surface-500 font-medium">Công cụ:</span>
                                                {renderPrepStatus(item.orderId!, item.id, 'prepTool', item.prepTool)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-surface-50">
                                        <div className="text-[10px] font-bold text-surface-400 uppercase mb-2">Tác vụ hiện có</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(item.tasks || []).map(task => (
                                                <div key={task.id} className="flex items-center gap-1">
                                                    {renderTaskStatus(item.orderId!, item.id, task)}
                                                </div>
                                            ))}
                                            {(item.tasks || []).length === 0 && <span className="text-[10px] text-surface-400 italic">Chưa có tác vụ</span>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-surface-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-surface-400 uppercase">Số lượng</span>
                                            <span className="text-sm font-bold text-surface-700">{item.slYeuCau}</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center text-surface-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
