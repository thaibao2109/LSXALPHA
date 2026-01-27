import React, { useRef, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import type { ActivityLog } from '../types';

interface NotificationMenuProps {
    logs: ActivityLog[];
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationMenu: React.FC<NotificationMenuProps> = ({ logs, isOpen, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Group logs by product (itemId) - Logic similar to DailyReportModal but for ALL logs
    // We limit to most recent 50 logs for performance in the dropdown if needed, but user asked for "all"
    // Let's take top 100 for now to avoid rendering thousands of DOM nodes in a small dropdown.
    const displayLogs = logs.slice(0, 100);

    const groupedLogs = displayLogs.reduce((groups, log) => {
        // Group Key: DATE + ORDER + ITEM
        const date = new Date(log.timestamp).toLocaleDateString();
        const key = `${date}-${log.orderId}-${log.itemId || 'general'}`;

        if (!groups[key]) {
            groups[key] = {
                date: date,
                orderName: log.orderName,
                itemName: log.itemName,
                items: []
            };
        }
        groups[key].items.push(log);
        return groups;
    }, {} as Record<string, { date: string; orderName: string; itemName?: string; items: ActivityLog[] }>);

    const getActionLabel = (action: string): string => {
        const labels: Record<string, string> = {
            'task_status_change': 'Trạng thái',
            'task_assigned': 'Người làm',
            'task_time_set': 'Thời gian',
            'order_created': 'Tạo đơn',
            'order_deleted': 'Xóa đơn',
            'item_edited': 'Sửa SP'
        };
        return labels[action] || action;
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            'pending': 'Chờ',
            'in_progress': 'Đang làm',
            'completed': 'Hoàn thành'
        };
        return labels[status] || status;
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div ref={menuRef} className="absolute top-full right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col max-h-[600px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Thông báo hoạt động</h3>
                    <p className="text-xs text-gray-500">Mới nhất 100 hoạt động</p>
                </div>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50/30">
                {Object.keys(groupedLogs).length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">Chưa có thông báo nào</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(groupedLogs).map(([key, group]) => {
                            // Only show the latest log for this item
                            const latestLog = group.items[0];
                            return (
                                <div key={key} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 hover:bg-gray-50 transition-colors group">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono font-bold">{group.orderName}</span>
                                            <span className="text-[10px] text-gray-400">{formatTime(latestLog.timestamp)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="font-bold text-sm text-gray-800 truncate">
                                            {group.itemName || 'Hoạt động chung'}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                                                {getActionLabel(latestLog.action)}
                                            </span>

                                            <span className="font-medium text-gray-600 truncate">{latestLog.taskName}</span>

                                            {(latestLog.details.newValue) && (
                                                <span className="ml-auto inline-flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                                    <span className="font-bold text-green-700 text-[10px] uppercase">{getStatusLabel(latestLog.details.newValue)}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center rounded-b-xl">
                <span className="text-xs text-gray-400">Hiển thị 100 hoạt động gần nhất</span>
            </div>
        </div>
    );
};
