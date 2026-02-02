import React from 'react';
import type { LSXItem, LSXData } from '../types';
import { CheckCircle2, Circle, Printer } from 'lucide-react';
import { printWorkOrder } from './WorkOrderSheet';
import type { PrintConfig } from '../utils/printConfig';

interface LSXTableProps {
    items: LSXItem[];
    onItemClick: (item: LSXItem) => void;
    order: LSXData;
    printConfig: PrintConfig;
}

export const LSXTable: React.FC<LSXTableProps & {
    selectedItems?: Set<string>;
    onSelectionChange?: (selectedIds: Set<string>) => void;
}> = ({ items, onItemClick, order, printConfig, selectedItems, onSelectionChange }) => {
    const allSelected = items.length > 0 && selectedItems?.size === items.length;
    const someSelected = (selectedItems?.size || 0) > 0 && (selectedItems?.size || 0) < items.length;

    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(items.map(i => i.id)));
        }
    };

    const handleSelectRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onSelectionChange) return;
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        onSelectionChange(newSelected);
    };

    return (
        <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="min-w-full">
                    <thead className="bg-surface-50/50 border-b border-surface-100">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest sticky left-0 bg-surface-50/50 z-20 min-w-[50px]">
                                {onSelectionChange && (
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                                            checked={allSelected}
                                            ref={input => {
                                                if (input) input.indeterminate = someSelected;
                                            }}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                )}
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest sticky left-[50px] bg-surface-50/50 z-20">STT</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest sticky left-[100px] bg-surface-50/50 z-20 min-w-[240px]">Tên hàng hóa</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest min-w-[150px]">QC / Kích thước</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest">Vật liệu</th>
                            <th scope="col" className="px-6 py-4 text-center text-[10px] font-bold text-surface-400 uppercase tracking-widest">Sản lượng</th>
                            <th scope="col" className="px-6 py-4 text-center text-[10px] font-bold text-surface-400 uppercase tracking-widest">Đơn vị</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest">Thông số</th>
                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest min-w-[250px]">Tiến độ tác vụ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {items.map((item, index) => {
                            const tasks = item.tasks || [];

                            return (
                                <tr
                                    key={item.id}
                                    className="hover:bg-brand-50/30 transition-colors cursor-pointer group"
                                    onClick={() => onItemClick(item)}
                                >
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-surface-400 text-center sticky left-0 bg-white group-hover:bg-transparent z-10">
                                        {onSelectionChange && (
                                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                                                    checked={selectedItems?.has(item.id)}
                                                    onChange={(e) => handleSelectRow(item.id, e as any)}
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-surface-400 text-center sticky left-[50px] bg-white group-hover:bg-transparent z-10">{index + 1}</td>
                                    <td className="px-6 py-5 sticky left-[100px] bg-white group-hover:bg-transparent z-10">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-surface-900 group-hover:text-brand-600 transition-colors">{item.tenHangHoa}</span>
                                            <span className="text-[10px] text-surface-400 font-medium">Mã hệ thống: {item.id.slice(0, 8)}</span>

                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-surface-700">{item.quyCach}</span>
                                            <span className="text-[11px] text-surface-400">Phôi: {item.quyCachPhoi}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-surface-600">{item.vatLieu}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-brand-600 font-extrabold text-center">{item.slYeuCau.toLocaleString()}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-surface-500 text-center">
                                        <span className="px-2 py-1 bg-surface-100 rounded-md uppercase tracking-tighter">{item.donVi}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {item.buocRen && <span className="text-[9px] font-bold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded uppercase">P:{item.buocRen}</span>}
                                            {item.chieuDaiRen && <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded uppercase">L:{item.chieuDaiRen}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-between gap-4">
                                            {tasks.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {tasks.map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-tight ${task.status === 'completed'
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : 'bg-surface-50 text-surface-500 border-surface-200'
                                                                }`}
                                                        >
                                                            {task.status === 'completed' ? (
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                                            ) : (
                                                                <Circle className="w-3.5 h-3.5 text-surface-300" />
                                                            )}
                                                            <span>{task.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-surface-400 italic">Chưa có tác vụ</span>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    printWorkOrder(order, item, printConfig);
                                                }}
                                                className="p-2 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                title="In Lệnh Sản Xuất"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-8 py-4 bg-surface-50/30 flex justify-between items-center">
                <span className="text-xs font-semibold text-surface-400">TỔNG CỘNG</span>
                <span className="text-sm font-bold text-surface-900">{items.length} mặt hàng trong danh mục</span>
            </div>
        </div>
    );
};
