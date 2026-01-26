import React from 'react';
import { LayoutDashboard, Package, Activity, AlertCircle } from 'lucide-react';
import type { LSXData } from '../types';

interface DashboardStatsProps {
    data: LSXData;
}

const DetailStatCard = ({ label, value, subValue, icon: Icon, colorClass, children }: any) => (
    <div className="premium-card p-6 flex flex-col justify-between group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${colorClass} transition-all duration-300`}>
                <Icon className="w-6 h-6" />
            </div>
            {subValue && <span className="text-[10px] font-bold text-surface-400 bg-surface-50 px-2 py-1 rounded-lg border border-surface-100 uppercase tracking-tighter">{subValue}</span>}
        </div>
        <div>
            <p className="text-sm font-semibold text-surface-500 mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-surface-900 tracking-tight">{value}</h3>
            {children}
        </div>
    </div>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
    const totalItems = data.items.length;
    const totalQuantity = data.items.reduce((sum, item) => sum + item.slYeuCau, 0);

    let totalProgressSum = 0;
    let itemsCompleted = 0;
    let itemsInProgress = 0;
    let itemsPending = 0;

    data.items.forEach(item => {
        const tasks = item.tasks || [];
        if (tasks.length === 0) {
            itemsPending++;
            return;
        }

        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = (completedTasks / tasks.length) * 100;
        totalProgressSum += progress;

        if (progress === 100) itemsCompleted++;
        else if (tasks.some(t => t.status === 'in_progress' || t.status === 'completed')) itemsInProgress++;
        else itemsPending++;
    });

    const overallProgress = totalItems > 0 ? Math.round(totalProgressSum / totalItems) : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DetailStatCard
                label="Mã hàng trong đơn"
                value={totalItems}
                subValue="Danh mục LSX"
                icon={LayoutDashboard}
                colorClass="bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
            >
                <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {itemsCompleted} mã đã xong
                </p>
            </DetailStatCard>

            <DetailStatCard
                label="Số lượng cần làm"
                value={totalQuantity.toLocaleString()}
                subValue="Tổng sản phẩm"
                icon={Package}
                colorClass="bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
            >
                <p className="text-[10px] text-surface-400 font-medium mt-2 italic">*Số lượng tính theo đơn vị gốc</p>
            </DetailStatCard>

            <DetailStatCard
                label="Tiến độ đơn hàng"
                value={`${overallProgress}%`}
                subValue="Weighted Avg"
                icon={Activity}
                colorClass="bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
            >
                <div className="w-full h-1.5 bg-surface-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${overallProgress}%` }}></div>
                </div>
            </DetailStatCard>

            <div className="premium-card p-6 flex flex-col justify-between group bg-surface-900 border-surface-800">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-surface-400 uppercase tracking-widest">Trạng thái kỹ thuật</p>
                    <AlertCircle className="w-4 h-4 text-surface-500" />
                </div>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-surface-300 uppercase">Hoàn thành</span>
                            <span className="text-xs font-bold text-green-400">{Math.round((itemsCompleted / totalItems) * 100) || 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${(itemsCompleted / totalItems) * 100}%` }} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-surface-300 uppercase">Đang chạy</span>
                            <span className="text-xs font-bold text-brand-400">{Math.round((itemsInProgress / totalItems) * 100) || 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500" style={{ width: `${(itemsInProgress / totalItems) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
