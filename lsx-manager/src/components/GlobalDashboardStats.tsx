import React from 'react';
import { Package, Layers, Briefcase } from 'lucide-react';
import type { LSXData } from '../types';

interface GlobalDashboardStatsProps {
    orders: LSXData[];
}



export const GlobalDashboardStats: React.FC<GlobalDashboardStatsProps> = ({ orders }) => {
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
    const totalQuantity = orders.reduce((sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.slYeuCau, 0)
        , 0);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                    <Briefcase className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-surface-500 font-medium">Đơn hàng đang chạy</p>
                    <h3 className="text-xl font-bold text-surface-900">{totalOrders}</h3>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <Layers className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-surface-500 font-medium">Tổng mã hàng</p>
                    <h3 className="text-xl font-bold text-surface-900">{totalItems}</h3>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <Package className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-surface-500 font-medium">Tổng sản lượng</p>
                    <h3 className="text-xl font-bold text-surface-900">{totalQuantity.toLocaleString()}</h3>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-4 shadow-sm">
                <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="20" cy="20" r="16" className="stroke-surface-100 fill-none" strokeWidth="4" />
                        <circle cx="20" cy="20" r="16" className="stroke-brand-500 fill-none transition-all duration-1000 ease-out" strokeWidth="4"
                            strokeDasharray={100}
                            strokeDashoffset={100 - (100 * globalProgress) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-surface-900">{globalProgress}%</span>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-surface-500 font-medium">Tiến độ xưởng</p>
                    <p className="text-[10px] text-surface-400">Avg Progress</p>
                </div>
            </div>
        </div>
    );
};
