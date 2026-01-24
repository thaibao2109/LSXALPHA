import React from 'react';
import { LayoutDashboard, Package, Activity, AlertCircle } from 'lucide-react';
import type { LSXData } from '../types';

interface DashboardStatsProps {
    data: LSXData;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
    // 1. Total Items
    const totalItems = data.items.length;

    // 2. Total Quantity
    const totalQuantity = data.items.reduce((sum, item) => sum + item.slYeuCau, 0);

    // 3. Overall Progress
    let totalProgressSum = 0;
    let activeItems = 0; // Items that have at least one task
    let itemsCompleted = 0;
    let itemsInProgress = 0;
    let itemsPending = 0;

    data.items.forEach(item => {
        const tasks = item.tasks || [];
        if (tasks.length === 0) {
            itemsPending++;
            return;
        }

        activeItems++;

        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = (completedTasks / tasks.length) * 100;
        totalProgressSum += progress;

        // Categorize Item Status based on tasks
        if (progress === 100) {
            itemsCompleted++;
        } else if (tasks.some(t => t.status === 'in_progress' || t.status === 'completed')) {
            itemsInProgress++;
        } else {
            itemsPending++;
        }
    });

    const overallProgress = totalItems > 0 ? Math.round(totalProgressSum / totalItems) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Total Items */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tổng mã hàng</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalItems}</h3>
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {itemsCompleted} đã hoàn thành
                    </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <LayoutDashboard className="w-6 h-6" />
                </div>
            </div>

            {/* Card 2: Total Quantity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tổng sản lượng</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalQuantity.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-1">Đơn vị: chiếc/bộ</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                    <Package className="w-6 h-6" />
                </div>
            </div>

            {/* Card 3: Overall Progress */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tiến độ rút gọn</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{overallProgress}%</h3>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${overallProgress}%` }}></div>
                    </div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <Activity className="w-6 h-6" />
                </div>
            </div>

            {/* Card 4: Status Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500">Trạng thái SX</p>
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Hoàn thành
                        </span>
                        <span className="font-semibold">{itemsCompleted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Đang chạy
                        </span>
                        <span className="font-semibold">{itemsInProgress}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span> Chờ
                        </span>
                        <span className="font-semibold">{itemsPending}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
