import React, { useRef, useState } from 'react';
import { X, Trash2, CheckCircle2, Circle, Printer, ArrowDownToLine, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import type { LSXItem, Task, LSXData, ActivityLog, ProductType } from '../types';
import { clsx } from 'clsx';
import { printWorkOrder } from './WorkOrderSheet';
import type { PrintConfig } from '../utils/printConfig';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface TaskModalProps {
    item: LSXItem;
    isOpen: boolean;
    onClose: () => void;
    onUpdateTasks: (itemId: string, tasks: Task[]) => void;
    availableTasks: string[];
    order: LSXData;
    onLogActivity?: (action: ActivityLog['action'], orderId: string, orderName: string, details: Partial<Omit<ActivityLog, 'id' | 'timestamp' | 'action' | 'orderId' | 'orderName'>>) => void;
    printConfig: PrintConfig;
    productTypes?: ProductType[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
    item,
    isOpen,
    onClose,
    onUpdateTasks,
    availableTasks,
    order,
    onLogActivity,
    printConfig,
    productTypes = []
}) => {
    const [selectedProductTypeId, setSelectedProductTypeId] = useState<string>('');
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const initialAssigneeRef = useRef<string>('');
    const addMenuRef = useRef<HTMLDivElement>(null);

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

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const cycleStatus = (taskId: string, currentStatus: string) => {
        let nextStatus: 'pending' | 'in_progress' | 'completed' = 'pending';
        if (currentStatus === 'pending') nextStatus = 'in_progress';
        else if (currentStatus === 'in_progress') nextStatus = 'completed';
        else if (currentStatus === 'completed') nextStatus = 'pending';

        const task = (item.tasks || []).find(t => t.id === taskId);
        const updatedTasks = (item.tasks || []).map(t =>
            t.id === taskId ? { ...t, status: nextStatus } : t
        );
        onUpdateTasks(item.id, updatedTasks);

        // Log activity
        if (onLogActivity && task) {
            onLogActivity('task_status_change', order.id!, order.meta.phieuXuat, {
                itemId: item.id,
                itemName: item.tenHangHoa,
                taskId: task.id,
                taskName: task.name,
                details: {
                    oldValue: currentStatus,
                    newValue: nextStatus
                }
            });
        }
    };

    const updateAssignee = (taskId: string, assignee: string) => {
        const updatedTasks = (item.tasks || []).map(t =>
            t.id === taskId ? { ...t, assignee } : t
        );
        onUpdateTasks(item.id, updatedTasks);
    };

    const handleAssigneeLog = (taskId: string, currentAssignee: string) => {
        const oldAssignee = initialAssigneeRef.current;
        if (onLogActivity && currentAssignee !== oldAssignee) {
            const task = (item.tasks || []).find(t => t.id === taskId);
            if (task) {
                onLogActivity('task_assigned', order.id!, order.meta.phieuXuat, {
                    itemId: item.id,
                    itemName: item.tenHangHoa,
                    taskId: task.id,
                    taskName: task.name,
                    details: {
                        assignee: currentAssignee
                    }
                });
            }
        }
    };

    const deleteTask = (taskId: string) => {
        const task = (item.tasks || []).find(t => t.id === taskId);
        const updatedTasks = (item.tasks || []).filter(t => t.id !== taskId);
        onUpdateTasks(item.id, updatedTasks);

        if (onLogActivity && task) {
            onLogActivity('item_edited', order.id!, order.meta.phieuXuat, {
                itemId: item.id,
                itemName: item.tenHangHoa,
                details: {
                    field: 'task_deleted',
                    oldValue: task.name
                }
            });
        }
    };

    const updateTaskTime = (taskId: string, field: 'startTime' | 'endTime', value: string) => {
        const updatedTasks = (item.tasks || []).map(t =>
            t.id === taskId ? { ...t, [field]: value } : t
        );
        onUpdateTasks(item.id, updatedTasks);

        const task = (item.tasks || []).find(t => t.id === taskId);
        if (onLogActivity && task) {
            onLogActivity('task_time_set', order.id!, order.meta.phieuXuat, {
                itemId: item.id,
                itemName: item.tenHangHoa,
                taskId: task.id,
                taskName: task.name,
                details: {
                    field: field,
                    newValue: value
                }
            });
        }
    };

    const applyTemplateLogic = (template: ProductType) => {
        const newTasks: Task[] = template.tasks.map(taskName => ({
            id: crypto.randomUUID(),
            name: taskName,
            status: 'pending'
        }));

        onUpdateTasks(item.id, newTasks);
        setSelectedProductTypeId(''); // Reset selection

        // Log Activity
        if (onLogActivity) {
            onLogActivity('item_edited', order.id!, order.meta.phieuXuat, {
                itemId: item.id,
                itemName: item.tenHangHoa,
                details: {
                    field: 'tasks (template)',
                    newValue: template.name
                }
            });
        }
    };

    const handleApplyTemplate = () => {
        const template = productTypes.find(t => t.id === selectedProductTypeId);
        if (!template) return;

        if ((item.tasks || []).length > 0) {
            setConfirmation({
                isOpen: true,
                title: 'Áp dụng mẫu công đoạn',
                message: 'Hành động này sẽ XÓA TOÀN BỘ các công đoạn hiện tại và thay thế bằng mẫu mới. Bạn có chắc chắn không?',
                isDelete: true,
                onConfirm: () => applyTemplateLogic(template)
            });
            return;
        }

        applyTemplateLogic(template);
    };

    const moveTask = (index: number, direction: 'up' | 'down') => {
        const currentTasks = item.tasks || [];
        const newTasks = [...currentTasks];

        if (direction === 'up') {
            if (index === 0) return;
            [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
        } else {
            if (index === newTasks.length - 1) return;
            [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
        }
        onUpdateTasks(item.id, newTasks);
    };

    const addTask = (taskName: string) => {
        const newTask: Task = { id: crypto.randomUUID(), name: taskName, status: 'pending' };
        onUpdateTasks(item.id, [...(item.tasks || []), newTask]);
        setIsAddMenuOpen(false);

        if (onLogActivity) {
            onLogActivity('item_edited', order.id!, order.meta.phieuXuat, {
                itemId: item.id,
                itemName: item.tenHangHoa,
                taskId: newTask.id,
                taskName: newTask.name,
                details: {
                    field: 'task_added',
                    newValue: taskName
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{item.tenHangHoa}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            QC: {item.quyCach} | SL: <span className="font-semibold text-blue-600">{item.slYeuCau} {item.donVi}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => printWorkOrder(order, item, printConfig)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                            title="In Lệnh Sản Xuất (Toàn bộ quy trình)"
                        >
                            <Printer className="w-4 h-4" />
                            <span>In Lệnh SX</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-gray-600">Tiến độ hoàn thành</span>
                            <span className="text-blue-600">
                                {item.tasks?.length ? Math.round((item.tasks.filter(t => t.status === 'completed').length / item.tasks.length) * 100) : 0}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                style={{ width: `${item.tasks?.length ? (item.tasks.filter(t => t.status === 'completed').length / item.tasks.length) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Apply Template Section */}
                    {productTypes.length > 0 && (
                        <div className="mb-8 bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                                    Áp dụng Mẫu Loại Sản Phẩm
                                </label>
                                <select
                                    value={selectedProductTypeId}
                                    onChange={(e) => setSelectedProductTypeId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">-- Chọn mẫu sản phẩm --</option>
                                    {productTypes.map(pt => (
                                        <option key={pt.id} value={pt.id}>{pt.name} ({pt.tasks.length} công đoạn)</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleApplyTemplate}
                                disabled={!selectedProductTypeId}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowDownToLine className="w-4 h-4" />
                                Áp dụng
                            </button>
                        </div>
                    )}

                    {/* Task List */}
                    <div className="space-y-3 mb-20">
                        {(!item.tasks || item.tasks.length === 0) && (
                            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-lg">
                                <p className="text-gray-400">Chưa có công đoạn nào được tạo.</p>
                            </div>
                        )}
                        {item.tasks?.map((task, index) => (
                            <div
                                key={task.id}
                                className={clsx(
                                    "group flex items-center justify-between p-4 rounded-lg border transition-all",
                                    task.status === 'completed' ? "bg-green-50 border-green-200" :
                                        task.status === 'in_progress' ? "bg-blue-50 border-blue-200" :
                                            "bg-white border-gray-200 hover:border-gray-300"
                                )}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => cycleStatus(task.id, task.status)}
                                        className={clsx(
                                            "transition-colors rounded-full p-1",
                                            task.status === 'completed' ? "text-green-600 hover:text-green-700" :
                                                task.status === 'in_progress' ? "text-blue-600 hover:text-blue-700" :
                                                    "text-gray-300 hover:text-gray-400"
                                        )}
                                        title="Click to cycle status"
                                    >
                                        {task.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
                                            task.status === 'in_progress' ? <Circle className="w-6 h-6 fill-current" /> :
                                                <Circle className="w-6 h-6" />}
                                    </button>

                                    <div className="flex flex-col flex-1">
                                        <span className={clsx(
                                            "font-medium select-none",
                                            task.status === 'completed' ? "text-green-800 line-through decoration-green-800/30" :
                                                task.status === 'in_progress' ? "text-blue-800" :
                                                    "text-gray-700"
                                        )}>
                                            {task.name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={clsx(
                                                "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                                                task.status === 'completed' ? "bg-green-100 text-green-700" :
                                                    task.status === 'in_progress' ? "bg-blue-100 text-blue-700" :
                                                        "bg-gray-100 text-gray-600"
                                            )}>
                                                {task.status === 'completed' ? 'Hoàn thành' :
                                                    task.status === 'in_progress' ? 'Đang làm' : 'Chờ'}
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Người làm..."
                                                className="text-xs border-none bg-transparent focus:ring-0 text-gray-500 placeholder:text-gray-300 p-0 w-32"
                                                value={task.assignee || ''}
                                                onChange={(e) => updateAssignee(task.id, e.target.value)}
                                                onFocus={(e) => initialAssigneeRef.current = e.target.value}
                                                onBlur={(e) => handleAssigneeLog(task.id, e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <span className="w-12">Bắt đầu:</span>
                                                <input
                                                    type="datetime-local"
                                                    value={task.startTime || ''}
                                                    onChange={(e) => updateTaskTime(task.id, 'startTime', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="border border-gray-200 rounded px-1 py-0.5 bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-12">Kết thúc:</span>
                                                <input
                                                    type="datetime-local"
                                                    value={task.endTime || ''}
                                                    onChange={(e) => updateTaskTime(task.id, 'endTime', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="border border-gray-200 rounded px-1 py-0.5 bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex flex-col gap-1 mr-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); moveTask(index, 'up'); }}
                                            disabled={index === 0}
                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); moveTask(index, 'down'); }}
                                            disabled={!item.tasks || index === item.tasks.length - 1}
                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                        ))}
                    </div>
                </div>

                {/* Footer: Add Task Button & Dropdown */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl relative">
                    <div className="relative" ref={addMenuRef}>
                        <button
                            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                            className="w-full py-2.5 bg-white border border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm công đoạn thủ công
                        </button>

                        {isAddMenuOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-10 animate-in slide-in-from-bottom-2 duration-200">
                                <div className="max-h-[240px] overflow-y-auto p-1.5 grid grid-cols-2 gap-1">
                                    {availableTasks.map(task => (
                                        <button
                                            key={task}
                                            onClick={() => addTask(task)}
                                            className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                                        >
                                            {task}
                                        </button>
                                    ))}
                                    {availableTasks.length === 0 && (
                                        <div className="col-span-2 p-3 text-center text-sm text-gray-400 italic">
                                            Không có công đoạn mẫu nào.
                                        </div>
                                    )}
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
        </div >
    );
};
