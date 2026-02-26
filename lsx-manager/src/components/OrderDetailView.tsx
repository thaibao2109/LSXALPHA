import React, { useState } from 'react';
import { LSXTable } from './LSXTable';
import { TaskModal } from './TaskModal';

import { ConfigModal } from './ConfigModal';
import { ArrowLeft, Settings, Trash2, Download, ChevronLeft, ChevronRight, CheckSquare, X, ArrowDownToLine, Pencil, Save, Printer, StickyNote } from 'lucide-react';
import { exportOrderDetail } from '../utils/excelExport';
import { printAllWorkOrders } from './WorkOrderSheet';
import { printHandoverMinutes } from './HandoverPrint';
import { uuid } from '../utils/uuid';
import { formatDateWithRemaining } from '../utils/dateUtils';
import type { LSXData, LSXItem, Task, ActivityLog, ProductType, User, Tool, OrderNote } from '../types';
import type { PrintConfig } from '../utils/printConfig';
import { AddProductModal } from './AddProductModal';

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
    currentUser: User;
    tools?: Tool[];
    onUpdateTools?: (newTools: Tool[]) => void;
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
    onNavigate,
    currentUser,
    tools,
    onUpdateTools
}) => {
    const [selectedItem, setSelectedItem] = useState<LSXItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // Notes State
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [selectedBulkTemplate, setSelectedBulkTemplate] = useState<string>('');
    const [selectedBulkTask, setSelectedBulkTask] = useState<string>('');

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(data.meta);
    const [isAddingProduct, setIsAddingProduct] = useState(false);

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
            id: uuid(),
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
                return { ...item, tasks: newTasks.map(t => ({ ...t, id: uuid() })) }; // Clone tasks for each item
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

    // --- Notes Logic ---
    const handleAddNote = () => {
        if (!newNoteContent.trim()) return;

        const newNote: OrderNote = {
            id: uuid(),
            content: newNoteContent.trim(),
            type: 'general', // Default for now, could add selector
            createdAt: new Date().toISOString(),
            createdBy: currentUser.name
        };

        const updatedNotes = data.notes ? [newNote, ...data.notes] : [newNote];
        onUpdate({ ...data, notes: updatedNotes });
        setNewNoteContent('');
        setIsAddingNote(false);
    };

    const handleDeleteNote = (noteId: string) => {
        if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
        const updatedNotes = data.notes?.filter(n => n.id !== noteId) || [];
        onUpdate({ ...data, notes: updatedNotes });
    };

    const currentSelectedItem = selectedItem
        ? data.items.find(i => i.id === selectedItem.id) || selectedItem
        : null;

    const handleDeleteProduct = (product: LSXItem) => {
        if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.tenHangHoa}" không?`)) return;

        const updatedItems = data.items.filter(item => item.id !== product.id);

        // Log activity
        if (onLogActivity) {
            onLogActivity('item_deleted', data.id || '', data.meta.phieuXuat, {
                itemId: product.id,
                itemName: product.tenHangHoa,
                details: {
                    reason: 'Admin deleted item'
                }
            });
        }

        onUpdate({ ...data, items: updatedItems });
    };

    const handleAddProduct = (newItem: LSXItem) => {
        const updatedItems = [...data.items, newItem];
        onUpdate({ ...data, items: updatedItems });
        if (onLogActivity) {
            onLogActivity('item_edited', data.id || '', data.meta.phieuXuat, {
                itemId: newItem.id,
                itemName: newItem.tenHangHoa,
                details: {
                    reason: 'Admin added new item during edit'
                }
            });
        }
    };

    const handleToggleDelivered = (product: LSXItem) => {
        const updatedItems = data.items.map(item =>
            item.id === product.id ? { ...item, delivered: !item.delivered } : item
        );
        onUpdate({ ...data, items: updatedItems });

        if (onLogActivity) {
            onLogActivity('item_edited', data.id || '', data.meta.phieuXuat, {
                itemId: product.id,
                itemName: product.tenHangHoa,
                details: {
                    field: 'delivered',
                    oldValue: product.delivered,
                    newValue: !product.delivered,
                    reason: !product.delivered ? 'Đánh dấu đã giao kho' : 'Bỏ đánh dấu giao kho'
                }
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
            <header className="flex flex-col gap-6">
                <div className="flex flex-col xl:flex-row justify-between gap-6">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        <div className="flex gap-2">
                            <button
                                onClick={onBack}
                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-xl md:rounded-2xl shadow-soft hover:bg-brand-50 hover:text-brand-600 transition-all text-surface-500 border border-surface-100"
                                title="Quay lại danh sách"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            {(onNavigate) && (
                                <div className="flex bg-white rounded-xl md:rounded-2xl shadow-soft border border-surface-100 overflow-hidden h-10 md:h-12">
                                    <button
                                        onClick={() => onNavigate('prev')}
                                        disabled={!hasPrevious}
                                        className="w-10 md:w-12 flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all text-surface-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-surface-500 border-r border-surface-100"
                                        title="Đơn hàng trước"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onNavigate('next')}
                                        disabled={!hasNext}
                                        className="w-10 md:w-12 flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all text-surface-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-surface-500"
                                        title="Đơn hàng tiếp theo"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-surface-400 uppercase tracking-widest mb-1.5 ">
                                <span>Lệnh sản xuất</span>
                                <ChevronRight className="w-3 h-3" />
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
                                    className="text-xl md:text-2xl font-extrabold text-surface-900 tracking-tight border-b-2 border-surface-200 focus:border-brand-500 outline-none bg-transparent w-full mb-3"
                                />
                            ) : (
                                <h1 className="text-xl md:text-2xl font-extrabold text-surface-900 tracking-tight line-clamp-1 mb-3">{data.meta.khachHang}</h1>
                            )}

                            {/* Metadata Inline */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-surface-600">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Đơn số:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.donHangSo || ''}
                                            onChange={(e) => setEditForm({ ...editForm, donHangSo: e.target.value })}
                                            className="font-medium text-surface-900 border-b border-surface-300 focus:border-brand-500 outline-none bg-transparent w-24"
                                        />
                                    ) : (
                                        <span className="font-medium text-surface-900">{data.meta.donHangSo}</span>
                                    )}
                                </div>
                                <div className="w-px h-3 bg-surface-300 hidden md:block" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Giao ngày:</span>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            value={editForm.ngayGiaoHang}
                                            onChange={(e) => setEditForm({ ...editForm, ngayGiaoHang: e.target.value })}
                                            className="font-medium text-brand-600 border-b border-brand-300 focus:border-brand-600 outline-none bg-transparent"
                                        />
                                    ) : (
                                        <span className={`font-medium ${new Date(data.meta.ngayGiaoHang) < new Date() ? 'text-red-600' : 'text-brand-600'}`}>
                                            {formatDateWithRemaining(data.meta.ngayGiaoHang)}
                                        </span>
                                    )}
                                </div>
                                <div className="w-px h-3 bg-surface-300 hidden md:block" />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Phụ trách:</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.nguoiLap}
                                            onChange={(e) => setEditForm({ ...editForm, nguoiLap: e.target.value })}
                                            className="font-medium text-surface-900 border-b border-surface-300 focus:border-brand-500 outline-none bg-transparent w-32"
                                        />
                                    ) : (
                                        <span className="font-medium text-surface-900">{data.meta.nguoiLap}</span>
                                    )}
                                </div>

                                {/* Integrated Dashboard Stats */}
                                <div className="w-px h-3 bg-surface-300 hidden md:block" />
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">SL:</span>
                                        <span className="font-medium text-surface-900">
                                            {data.items.reduce((sum, item) => sum + item.slYeuCau, 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Tiến độ:</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-green-500 transition-all"
                                                    style={{
                                                        width: `${data.items.length > 0 ? Math.round(data.items.reduce((acc, item) => {
                                                            const tasks = item.tasks || [];
                                                            if (tasks.length === 0) return acc;
                                                            const completed = tasks.filter(t => t.status === 'completed').length;
                                                            return acc + (completed / tasks.length) * 100;
                                                        }, 0) / data.items.length) : 0}%`
                                                    }}
                                                    title="Hoàn thành"
                                                />
                                                <div
                                                    className="h-full bg-blue-500 transition-all"
                                                    style={{
                                                        width: `${data.items.length > 0 ? Math.round(data.items.reduce((acc, item) => {
                                                            const tasks = item.tasks || [];
                                                            if (tasks.length === 0) return acc;
                                                            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                                                            return acc + (inProgress / tasks.length) * 100;
                                                        }, 0) / data.items.length) : 0}%`
                                                    }}
                                                    title="Đang thực hiện"
                                                />
                                            </div>
                                            <span className="font-bold text-xs text-brand-600">
                                                {data.items.length > 0 ? Math.round(data.items.reduce((acc, item) => {
                                                    const tasks = item.tasks || [];
                                                    if (tasks.length === 0) return acc;
                                                    const completed = tasks.filter(t => t.status === 'completed').length;
                                                    return acc + (completed / tasks.length) * 100;
                                                }, 0) / data.items.length) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-100 transition-all font-semibold active:scale-95 text-sm flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Lưu
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 bg-surface-100 text-surface-600 rounded-lg hover:bg-surface-200 transition-all font-semibold active:scale-95 text-sm flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Hủy
                                </button>
                            </>
                        ) : (
                            <>
                                {currentUser.role === 'admin' && (
                                    <button
                                        onClick={handleStartEdit}
                                        className="p-2 md:px-4 md:py-2 bg-white text-surface-600 rounded-lg hover:bg-surface-50 border border-surface-200 shadow-sm transition-all font-semibold active:scale-95 text-sm flex items-center gap-2"
                                        title="Chỉnh sửa thông tin"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        <span className="hidden md:inline">Sửa</span>
                                    </button>
                                )}
                                <div className="w-px h-8 bg-surface-200 mx-1" />
                                <button
                                    onClick={() => exportOrderDetail(data)}
                                    className="p-2 md:px-4 md:py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 border border-green-200 shadow-sm transition-all font-semibold active:scale-95 text-sm flex items-center gap-2"
                                    title="Xuất Excel"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden md:inline">Excel</span>
                                </button>
                                <button
                                    onClick={() => printAllWorkOrders(data, data.items, printConfig)}
                                    className="p-2 md:px-4 md:py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all font-semibold active:scale-95 text-sm flex items-center gap-2"
                                    title="In phiếu"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="hidden md:inline">In Lệnh</span>
                                </button>

                                {currentUser.role === 'admin' && (
                                    <>
                                        <div className="w-px h-8 bg-surface-200 mx-1" />
                                        <button
                                            onClick={() => setIsConfigModalOpen(true)}
                                            className="p-2 bg-white text-surface-500 rounded-lg hover:text-brand-600 border border-surface-200 shadow-sm transition-all"
                                            title="Cấu hình"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={onDelete}
                                            className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 hover:text-red-600 border border-surface-200 shadow-sm transition-all"
                                            title="Xóa đơn hàng"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Notes Section - Compact */}
            <div className="bg-white border border-surface-200 rounded-xl overflow-hidden shadow-sm">
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <StickyNote className="w-4 h-4 text-surface-400" />
                        <span className="text-sm font-bold text-surface-700 uppercase tracking-wide">Ghi chú</span>
                        {data.notes && data.notes.length > 0 && (
                            <span className="bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {data.notes.length}
                            </span>
                        )}
                    </div>
                    {!isAddingNote && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsAddingNote(true); }}
                            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline px-2 py-1"
                        >
                            + Thêm ghi chú
                        </button>
                    )}
                </div>

                {(isAddingNote || (data.notes && data.notes.length > 0)) && (
                    <div className="px-4 pb-4 border-t border-surface-100 bg-surface-50/50 pt-4">
                        {isAddingNote && (
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                                        placeholder="Nhập ghi chú nhanh..."
                                        className="flex-1 px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNoteContent.trim()}
                                        className="px-3 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 disabled:opacity-50"
                                    >
                                        Lưu
                                    </button>
                                    <button
                                        onClick={() => setIsAddingNote(false)}
                                        className="px-3 py-2 bg-surface-200 text-surface-600 rounded-lg text-xs font-bold hover:bg-surface-300"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {data.notes?.map(note => (
                                <div key={note.id} className="flex group items-start gap-3 text-sm bg-white p-2 rounded-lg border border-surface-100 shadow-sm">
                                    <div className="min-w-[24px] h-6 rounded-full bg-surface-100 flex items-center justify-center text-[10px] font-bold text-surface-500">
                                        {note.createdBy.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-surface-700 leading-snug">{note.content}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-surface-400 font-medium">{note.createdBy}</span>
                                            <span className="text-[10px] text-surface-300">•</span>
                                            <span className="text-[10px] text-surface-400">{new Date(note.createdAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-surface-900">Danh mục hàng hóa</h3>
                        <span className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-lg text-xs font-bold">{data.items.length} mặt hàng</span>
                    </div>
                    {isEditing && (
                        <button
                            onClick={() => setIsAddingProduct(true)}
                            className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-sm font-bold hover:bg-brand-100 transition-colors flex items-center gap-2"
                        >
                            + Thêm sản phẩm
                        </button>
                    )}
                </div>
                <LSXTable
                    items={data.items}
                    onItemClick={handleItemClick}
                    order={data}
                    printConfig={printConfig}
                    selectedItems={selectedItemIds}
                    onSelectionChange={handleSelectionChange}
                    onDeleteItem={handleDeleteProduct}
                    onToggleDelivered={handleToggleDelivered}
                    canDelete={currentUser?.role === 'admin'}
                />
            </div>

            {/* Bulk Action Bar */}
            {
                selectedItemIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-900 text-white px-4 md:px-6 py-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6 z-50 animate-in slide-in-from-bottom-4 duration-300 border border-surface-700 w-[95%] md:w-auto max-w-full">
                        <div className="flex items-center justify-between w-full md:w-auto gap-3 md:pr-6 border-b md:border-b-0 md:border-r border-surface-700 pb-3 md:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-brand-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                    {selectedItemIds.size}
                                </div>
                                <span className="font-medium text-sm">Đã chọn</span>
                            </div>
                            <button
                                onClick={() => setSelectedItemIds(new Set())}
                                className="md:hidden p-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                            {/* Group 1: Apply Template */}
                            <div className="flex items-center gap-2 w-full md:w-auto border-b md:border-b-0 md:border-r border-surface-700 pb-3 md:pb-0 md:pr-4">
                                <select
                                    value={selectedBulkTemplate}
                                    onChange={(e) => setSelectedBulkTemplate(e.target.value)}
                                    className="bg-surface-800 border-surface-600 text-white text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 flex-1 md:min-w-[180px]"
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
                                    <span className="md:hidden">Áp dụng</span>
                                </button>
                            </div>

                            {/* Group 2: Mark Complete */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <select
                                    value={selectedBulkTask}
                                    onChange={(e) => setSelectedBulkTask(e.target.value)}
                                    className="bg-surface-800 border-surface-600 text-white text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5 flex-1 md:min-w-[180px]"
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
                                    <span className="md:hidden">Hoàn thành</span>
                                </button>
                            </div>

                            {/* Group 3: Print Handover */}
                            <div className="flex items-center gap-2 w-full md:w-auto border-l border-surface-700 pl-3 ml-3">
                                <button
                                    onClick={() => {
                                        const selectedItemsList = data.items.filter(i => selectedItemIds.has(i.id));
                                        printHandoverMinutes(data, selectedItemsList);
                                    }}
                                    className="px-3 py-2 bg-white text-surface-900 hover:bg-surface-100 active:bg-surface-200 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                                    title="In biên bản bàn giao"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="hidden md:inline">Bàn giao</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedItemIds(new Set())}
                                className="hidden md:block p-2 ml-2 hover:bg-surface-800 rounded-lg text-surface-400 hover:text-white transition-colors"
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
                tools={tools}
                onUpdateTools={onUpdateTools}
            />

            <AddProductModal
                isOpen={isAddingProduct}
                onClose={() => setIsAddingProduct(false)}
                onAdd={handleAddProduct}
            />
        </div >
    );
};
