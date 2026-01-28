import React from 'react';
import { Package, Layers, Briefcase } from 'lucide-react';
import type { LSXData } from '../types';

interface GlobalDashboardStatsProps {
    orders: LSXData[];
}

const StatCard = ({ label, value, icon: Icon, colorClass, trend }: any) => (
    <div className="premium-card p-6 flex flex-col justify-between group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${colorClass} transition-colors duration-300`}>
                <Icon className="w-6 h-6" />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-sm font-semibold text-surface-500 mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-surface-900 tracking-tight">{value}</h3>
        </div>
    </div>
);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                label="Đơn hàng đang chạy"
                value={totalOrders}
                icon={Briefcase}
                colorClass="bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                trend={12}
            />
            <StatCard
                label="Tổng mã hàng"
                value={totalItems}
                icon={Layers}
                colorClass="bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
            />
            <StatCard
                label="Tổng sản lượng"
                value={totalQuantity.toLocaleString()}
                icon={Package}
                colorClass="bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                trend={5}
            />

            <div className="premium-card p-6 flex items-center gap-6 group">
                <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="40" cy="40" r="34"
                            className="stroke-surface-100 fill-none"
                            strokeWidth="8"
                        />
                        <circle
                            cx="40" cy="40" r="34"
                            className="stroke-brand-500 fill-none transition-all duration-1000 ease-out"
                            strokeWidth="8"
                            strokeDasharray={213.6}
                            strokeDashoffset={213.6 - (213.6 * globalProgress) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-extrabold text-surface-900">{globalProgress}%</span>
                    </div>
                </div>
                <div>
                    <p className="text-sm font-semibold text-surface-500 mb-0.5">Tiến độ xưởng</p>
                    <p className="text-[10px] text-surface-400 font-medium leading-tight">Dựa trên {globalItemCount} mã hàng đang sản xuất</p>
                </div>
            </div>
        </div>
    );
};
