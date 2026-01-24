import React from 'react';
import { Package, Activity, Layers, Briefcase } from 'lucide-react';
import type { LSXData } from '../types';

interface GlobalDashboardStatsProps {
    orders: LSXData[];
}

export const GlobalDashboardStats: React.FC<GlobalDashboardStatsProps> = ({ orders }) => {
    // 1. Total Active Orders
    const totalOrders = orders.length;

    // 2. Total Items across all orders
    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);

    // 3. Total Quantity across all orders
    const totalQuantity = orders.reduce((sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.slYeuCau, 0)
        , 0);

    // 4. Global Progress
    // Calculate average progress weighted by number of items per order? Or just simple average of order progress?
    // Let's do average of all items individually for accuracy.
    let globalProgressSum = 0;
    let globalItemCount = 0;

    orders.forEach(order => {
        order.items.forEach(item => {
            globalItemCount++;
            const tasks = item.tasks || [];
            if (tasks.length > 0) {
                const completed = tasks.filter(t => t.status === 'completed').length;
                globalProgressSum += (completed / tasks.length);
            }
        });
    });

    const globalProgress = globalItemCount > 0 ? Math.round((globalProgressSum / globalItemCount) * 100) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Orders */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Đơn hàng đang chạy</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <Briefcase className="w-6 h-6" />
                </div>
            </div>

            {/* Total Items */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tổng mã hàng</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <Layers className="w-6 h-6" />
                </div>
            </div>

            {/* Total Quantity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tổng sản lượng</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalQuantity.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                    <Package className="w-6 h-6" />
                </div>
            </div>

            {/* Global Efficiency */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">Tiến độ toàn xưởng</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{globalProgress}%</h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <Activity className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};
