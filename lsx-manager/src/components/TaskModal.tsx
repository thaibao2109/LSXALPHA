import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, Printer } from 'lucide-react';
import type { LSXItem, Task, LSXData, ActivityLog } from '../types';
import { clsx } from 'clsx';
import { printWorkOrder } from './WorkOrderSheet';

interface TaskModalProps {
    item: LSXItem;
    isOpen: boolean;
    onClose: () => void;
    onUpdateTasks: (itemId: string, tasks: Task[]) => void;
    availableTasks: string[];
    order: LSXData;
    onLogActivity?: (action: ActivityLog['action'], orderId: string, orderName: string, details: Partial<Omit<ActivityLog, 'id' | 'timestamp' | 'action' | 'orderId' | 'orderName'>>) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ item, isOpen, onClose, onUpdateTasks, availableTasks, order, onLogActivity }) => {
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

    const initialAssigneeRef = useRef<string>('');

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
        const updatedTasks = (item.tasks || []).filter(t => t.id !== taskId);
        onUpdateTasks(item.id, updatedTasks);
    };

    const updateTaskTime = (taskId: string, field: 'startTime' | 'endTime', value: string) => {
        const updatedTasks = (item.tasks || []).map(t =>
            t.id === taskId ? { ...t, [field]: value } : t
        );
        onUpdateTasks(item.id, updatedTasks);
    };

    const suggestTasks = ["Cắt phôi", "Dập", "Tiện thô", "Tiện tinh", "Phay", "Khoan", "Nhiệt luyện", "Mạ", "Đóng gói"];

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
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* Progress Bar */}
                    <div className="mb-8">
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

                    {/* Quick Add Suggestions */}
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chọn công đoạn</p>
                        <div className="flex flex-wrap gap-2">
                            {availableTasks.map(task => (
                                <button
                                    key={task}
                                    onClick={() => {
                                        const newTask: Task = { id: crypto.randomUUID(), name: task, status: 'pending' };
                                        onUpdateTasks(item.id, [...(item.tasks || []), newTask]);
                                    }}
                                    className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 text-gray-600 rounded-md hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all font-medium"
                                >
                                    + {task}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                        {(!item.tasks || item.tasks.length === 0) && (
                            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-lg">
                                <p className="text-gray-400">Chưa có công đoạn nào được tạo.</p>
                            </div>
                        )}
                        {item.tasks?.map((task) => (
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
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); printWorkOrder(order, item, task); }}
                                        className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="In phiếu công đoạn"
                                    >
                                        <Printer className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer removed: No more manual entry */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl text-center text-xs text-gray-400">
                    Cần thêm công đoạn khác? Liên hệ Quản lý để cấu hình.
                </div>
            </div>
        </div>
    );
};
