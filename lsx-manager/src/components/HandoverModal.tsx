import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { LSXItem } from '../types';

export interface HandoverItemData {
    item: LSXItem;
    quantity: number;
}

interface HandoverModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: LSXItem[];
    onConfirm: (data: HandoverItemData[]) => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ isOpen, onClose, items, onConfirm }) => {
    const [handoverData, setHandoverData] = useState<HandoverItemData[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Khởi tạo data ban đầu: số lượng cần giao = (yêu cầu) - (đã giao)
            const initialData = items.map(item => {
                const slDaGiao = item.slDaGiao || 0;
                const remaining = Math.max(0, item.slYeuCau - slDaGiao);
                return {
                    item: item,
                    quantity: remaining > 0 ? remaining : 0 // Mặc định gợi ý số còn lại
                };
            });
            setHandoverData(initialData);
        }
    }, [isOpen, items]);

    if (!isOpen) return null;

    const handleQuantityChange = (itemId: string, newQuantityStr: string) => {
        const newQuantity = parseInt(newQuantityStr, 10) || 0;
        setHandoverData(prev => prev.map(data =>
            data.item.id === itemId
                ? { ...data, quantity: Math.max(0, newQuantity) }
                : data
        ));
    };

    const hasInvalidQuantity = handoverData.some(d => d.quantity < 0 || d.quantity > (d.item.slYeuCau - (d.item.slDaGiao || 0)));
    const handleConfirm = () => {
        if (hasInvalidQuantity) return;
        onConfirm(handoverData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-surface-100">
                    <div>
                        <h2 className="text-xl font-bold text-surface-900">Bàn giao hàng hóa</h2>
                        <p className="text-sm text-surface-500 mt-1">Nhập số lượng thực tế cần bàn giao đợt này</p>
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
                                const isExceeding = data.quantity > remaining;

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
                                                max={remaining > 0 ? remaining : 0}
                                                value={data.quantity === 0 ? '' : data.quantity}
                                                onChange={(e) => handleQuantityChange(data.item.id, e.target.value)}
                                                className={`w-full px-3 py-1.5 border rounded-lg text-center font-semibold focus:outline-none focus:ring-2 transition-all ${isExceeding ? "border-red-300 focus:ring-red-500 bg-red-50 text-red-600" : "border-surface-200 focus:ring-brand-500"}`}
                                            placeholder="0"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {hasInvalidQuantity && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>Số lượng giao đợt này không được vượt quá số lượng tồn đọng! Vui lòng kiểm tra lại các ô màu đỏ.</span>
                        </div>
                    )}
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
                        disabled={hasInvalidQuantity || handoverData.every(d => d.quantity === 0)}
                        className="px-6 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Save className="w-4 h-4" />
                        Xác nhận & In phiếu
                    </button>
                </div>
            </div>
        </div>
    );
};
