import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Edit2, Trash2, Plus } from 'lucide-react';
import type { LSXData, LSXItem } from '../types';

interface ImportPreviewModalProps {
    data: LSXData | null;
    isOpen: boolean;
    onConfirm: (editedData: LSXData) => void;
    onCancel: () => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({ data, isOpen, onConfirm, onCancel }) => {
    const [editedData, setEditedData] = useState<LSXData | null>(data);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    React.useEffect(() => {
        setEditedData(data);
    }, [data]);

    if (!isOpen || !editedData) return null;

    const handleFieldChange = (itemId: string, field: keyof LSXItem, value: any) => {
        setEditedData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId ? { ...item, [field]: value } : item
                )
            };
        });
    };

    const handleDeleteItem = (itemId: string) => {
        if (confirm('Bạn có chắc muốn xóa dòng này?')) {
            setEditedData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    items: prev.items.filter(item => item.id !== itemId)
                };
            });
        }
    };

    const handleAddItem = () => {
        setEditedData(prev => {
            if (!prev) return prev;
            const newItem: LSXItem = {
                id: `item-new-${Date.now()}`,
                stt: '',
                tenHangHoa: '',
                beMat: '',
                donVi: '',
                quyCach: '',
                slYeuCau: 0,
                slDuPhong: 0,
                buocRen: '',
                chieuDaiRen: '',
                duongKinhTien: '',
                duongKinhThan: '',
                duongKinhDinhRen: '',
                doDay: '',
                kichThuocLucGiac: '',
                wh: '',
                vatLieu: '',
                quyCachPhoi: '',
                tasks: []
            };
            return {
                ...prev,
                items: [...prev.items, newItem]
            };
        });
    };

    const totalItems = editedData.items.length;
    const totalQuantity = editedData.items.reduce((sum, item) => sum + (item.slYeuCau || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Kiểm tra dữ liệu nhập</h2>
                            <p className="text-sm text-gray-500">Xem trước và chỉnh sửa trước khi xác nhận</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Metadata */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">Thông tin đơn hàng</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Phiếu xuất:</span>
                                <span className="ml-2 font-semibold">{editedData.meta.phieuXuat}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Khách hàng:</span>
                                <span className="ml-2 font-semibold">{editedData.meta.khachHang}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Đơn hàng số:</span>
                                <span className="ml-2 font-semibold">{editedData.meta.donHangSo}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Ngày giao:</span>
                                <span className="ml-2 font-semibold">{editedData.meta.ngayGiaoHang}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Tổng mã hàng:</span>
                                <span className="ml-2 font-semibold text-blue-600">{totalItems}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Tổng sản lượng:</span>
                                <span className="ml-2 font-semibold text-green-600">{totalQuantity.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Danh sách sản phẩm</h3>
                        <button
                            onClick={handleAddItem}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm dòng
                        </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-12">STT</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 min-w-[200px]">Tên hàng hóa</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Quy cách</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">SL yêu cầu</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">SL dự phòng</th>
                                        <th className="px-3 py-2 text-center font-semibold text-gray-700 w-24">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {editedData.items.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.stt || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'stt', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.tenHangHoa || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'tenHangHoa', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.quyCach || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'quyCach', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    value={item.slYeuCau || 0}
                                                    onChange={(e) => handleFieldChange(item.id, 'slYeuCau', parseInt(e.target.value) || 0)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    value={item.slDuPhong || 0}
                                                    onChange={(e) => handleFieldChange(item.id, 'slDuPhong', parseInt(e.target.value) || 0)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => editedData && onConfirm(editedData)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Xác nhận nhập
                    </button>
                </div>
            </div>
        </div>
    );
};
