import React, { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import type { ActivityLog } from '../types';
import { exportDailyReport } from '../utils/excelExport';

interface DailyReportModalProps {
    logs: ActivityLog[];
    isOpen: boolean;
    onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({ logs, isOpen, onClose }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    // Filter logs: only selected date and remove 'order_created'
    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === selectedDate && log.action !== 'order_created';
    });

    // Group logs by product (itemId)
    const groupedLogs = filteredLogs.reduce((groups, log) => {
        const key = `${log.orderId}-${log.itemId || 'general'}`;
        if (!groups[key]) {
            groups[key] = {
                orderName: log.orderName,
                itemName: log.itemName,
                items: []
            };
        }
        groups[key].items.push(log);
        return groups;
    }, {} as Record<string, { orderName: string; itemName?: string; items: ActivityLog[] }>);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Báo cáo Hoạt động</h2>
                            <p className="text-sm text-gray-500">Hoạt động trong ngày gộp theo sản phẩm</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filter */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Chọn ngày:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex-1"></div>
                        <button
                            onClick={() => exportDailyReport(filteredLogs, selectedDate)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Xuất Excel
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {Object.keys(groupedLogs).length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Không có hoạt động nào trong ngày này</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedLogs).map(([key, group]) => (
                                <div key={key} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{group.orderName}</span>
                                                <h3 className="text-sm font-bold text-gray-900 mt-0.5">
                                                    {group.itemName || 'Hoạt động chung'}
                                                </h3>
                                            </div>
                                            <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 text-gray-500 font-medium">
                                                {group.items.length} tác vụ
                                            </span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {group.items.map((log) => (
                                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <span className="text-xs font-mono text-gray-400 mt-1">{formatTime(log.timestamp)}</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded border border-blue-100">
                                                                {getActionLabel(log.action)}
                                                            </span>
                                                            <span className="text-sm font-medium text-gray-700">{log.taskName}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                            {log.details.assignee && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="text-gray-400">Người:</span>
                                                                    <span className="font-semibold text-gray-700">{log.details.assignee}</span>
                                                                </span>
                                                            )}
                                                            {(log.details.oldValue || log.details.newValue) && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="text-gray-400">Thay đổi:</span>
                                                                    <span className="font-medium text-orange-600 uppercase text-[10px]">{getStatusLabel(log.details.oldValue || '...')}</span>
                                                                    <span className="text-gray-300">→</span>
                                                                    <span className="font-bold text-green-600 uppercase text-[10px]">{getStatusLabel(log.details.newValue || '')}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Tổng cộng: <span className="font-semibold text-blue-600">{filteredLogs.length}</span> hoạt động
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
