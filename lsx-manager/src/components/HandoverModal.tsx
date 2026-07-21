import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { LSXItem } from '../types';

export interface HandoverItemData {
    item: LSXItem;
    quantity: number | '';
}

interface HandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: LSXItem[];
    onConfirm: (data: HandoverItemData[], isReprint: boolean) => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ isOpen, onClose, items, onConfirm }) => {
    const [handoverData, setHandoverData] = useState<HandoverItemData[]>([]);
    const [isReprint, setIsReprint] = useState(false);
    const [isBlank, setIsBlank] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Khởi tạo data ban đầu: số lượng cần giao = (yêu cầu) - (đã giao)
            const initialData: HandoverItemData[] = items.map(item => {
                const slDaGiao = item.slDaGiao || 0;
                const remaining = Math.max(0, item.slYeuCau - slDaGiao);
                return {
                    item: item,
                    quantity: remaining > 0 ? remaining : ('' as const)
                };
            });
            setHandoverData(initialData);
            setIsReprint(false); // Reset chế độ in lại mỗi khi mở modal
            setIsBlank(false);
        }
    }, [isOpen, items]);

    if (!isOpen) return null;

    const handleToggleReprint = () => {
        const newIsReprint = !isReprint;
        setIsReprint(newIsReprint);
        if (newIsReprint) setIsBlank(false); // Tắt phiếu ghi tay nếu bật in in lại

        // Cập nhật lại số lượng mặc định khi chuyển đổi chế độ
        setHandoverData(prev => prev.map(d => ({
            ...d,
            quantity: newIsReprint
                ? (d.item.slDaGiao || 0) // Ở chế độ in lại, mặc định là số đã giao
                : Math.max(0, d.item.slYeuCau - (d.item.slDaGiao || 0)) // Chế độ thường, là số còn lại
        })));
    };

    const handleToggleBlank = () => {
        const newIsBlank = !isBlank;
        setIsBlank(newIsBlank);
        if (newIsBlank) setIsReprint(false); // Tắt in lại nếu bật phiếu ghi tay
    };

    const hasInvalidQuantity = handoverData.some(d => {
        return typeof d.quantity === 'number' && d.quantity < 0;
    });

    const handleConfirm = () => {
        if (hasInvalidQuantity && !isBlank) return;
        const dataToSubmit = isBlank 
            ? handoverData.map(d => ({ ...d, quantity: '' as const }))
            : handoverData;
            
        onConfirm(dataToSubmit, isReprint || isBlank);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-surface-100">
                    <div>
                        <h2 className="text-xl font-bold text-surface-900">Bàn giao hàng hóa</h2>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-surface-500">Nhập số lượng thực tế cần bàn giao đợt này</p>
                            <div className="h-4 w-px bg-surface-200" />
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isReprint}
                                        onChange={handleToggleReprint}
                                        className="sr-only peer"
                                    />
                                    <div className="w-8 h-4 bg-surface-200 rounded-full peer peer-checked:bg-purple-500 transition-colors" />
                                    <div className="absolute left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isReprint ? "text-purple-600" : "text-surface-400 group-hover:text-surface-600"}`}>
                                    Chế độ in lại
                                </span>
                            </label>

                            <div className="h-4 w-px bg-surface-200" />
                            
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isBlank}
                                        onChange={handleToggleBlank}
                                        className="sr-only peer"
                                    />
                                    <div className="w-8 h-4 bg-surface-200 rounded-full peer peer-checked:bg-blue-500 transition-colors" />
                                    <div className="absolute left-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isBlank ? "text-blue-600" : "text-surface-400 group-hover:text-surface-600"}`}>
                                    Phiếu ghi tay
                                </span>
                            </label>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-200 text-sm font-bold text-surface-500 uppercase tracking-wide">
                                <th className="py-3 px-4">Tên hàng hóa</th>
                                <th className="py-3 px-4">Quy cách</th>
                                <th className="py-3 px-4 text-center">Yêu cầu</th>
                                <th className="py-3 px-4 text-center">Đã giao</th>
                                <th className="py-3 px-4 text-center">Tồn đọng</th>
                                <th className="py-3 px-4 text-center w-32">Giao đợt này</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {handoverData.map((data, index) => {
                                const slDaGiao = data.item.slDaGiao || 0;
                                const remaining = data.item.slYeuCau - slDaGiao;

                                return (
                                    <tr key={data.item.id} className="hover:bg-surface-50">
                                        <td className="py-3 px-4 text-sm font-medium text-surface-900">
                                            {index + 1}. {data.item.tenHangHoa}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-surface-600">{data.item.quyCach}</td>
                                        <td className="py-3 px-4 text-sm text-center font-bold text-brand-600">
                                            {data.item.slYeuCau}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-center font-medium text-green-600">
                                            {slDaGiao}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-center font-medium text-surface-500">
                                            {Math.max(0, remaining)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                disabled={isBlank}
                                                value={isBlank ? '' : (data.quantity === 0 ? '' : data.quantity)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newQty = val === '' ? '' : Math.max(0, parseInt(val, 10));
                                                    setHandoverData(prev => prev.map(d =>
                                                        d.item.id === data.item.id ? { ...d, quantity: Number.isNaN(newQty) ? '' : newQty } : d
                                                    ));
                                                }}
                                                className={`w-full px-3 py-1.5 border rounded-lg text-center font-semibold focus:outline-none focus:ring-2 transition-all ${isBlank ? "bg-surface-100 border-surface-200 text-surface-400 cursor-not-allowed" : (isReprint ? "border-purple-200 focus:ring-purple-500" : "border-surface-200 focus:ring-brand-500")}`}
                                                placeholder={isBlank ? "" : "0"}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Validation removed to allow excess quantities */}
                </div>

                <div className="p-6 border-t border-surface-100 flex items-center justify-end gap-3 bg-surface-50/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-surface-600 hover:text-surface-900 hover:bg-surface-200 rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={(hasInvalidQuantity && !isBlank) || (!isBlank && handoverData.every(d => d.quantity === '') && !isReprint)}
                        className={`px-6 py-2 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${isBlank ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : (isReprint ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200" : "bg-brand-600 hover:bg-brand-700 shadow-brand-200")}`}
                    >
                        <Save className="w-4 h-4" />
                        {isBlank ? "In phiếu trắng" : (isReprint ? "Xác nhận & In lại" : "Xác nhận & In phiếu")}
                    </button>
                </div>
            </div>
        </div>
    );
};
