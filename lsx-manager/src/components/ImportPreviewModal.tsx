import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Trash2, Plus } from 'lucide-react';
import type { LSXData, LSXItem } from '../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface ImportPreviewModalProps {
    data: LSXData | null;
    isOpen: boolean;
    onConfirm: (editedData: LSXData) => void;
    onCancel: () => void;
    title?: string;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({ data, isOpen, onConfirm, onCancel, title }) => {
    const [editedData, setEditedData] = useState<LSXData | null>(data);

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDelete: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDelete: true,
    });

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

    const handleMetaChange = (field: keyof LSXData['meta'], value: string) => {
        setEditedData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                meta: {
                    ...prev.meta,
                    [field]: value
                }
            };
        });
    };

    const handleDeleteItem = (itemId: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Xóa dòng',
            message: 'Bạn có chắc muốn xóa dòng này?',
            isDelete: true,
            onConfirm: () => {
                setEditedData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        items: prev.items.filter(item => item.id !== itemId)
                    };
                });
            }
        });
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
                marking: '',
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
                            <h2 className="text-xl font-bold text-gray-900">{title || "Kiểm tra dữ liệu nhập"}</h2>
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500 block mb-1">Phiếu xuất:</span>
                                <input
                                    type="text"
                                    value={editedData.meta.phieuXuat}
                                    onChange={(e) => handleMetaChange('phieuXuat', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded font-semibold text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Khách hàng:</span>
                                <input
                                    type="text"
                                    value={editedData.meta.khachHang}
                                    onChange={(e) => handleMetaChange('khachHang', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded font-semibold text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Đơn hàng số:</span>
                                <input
                                    type="text"
                                    value={editedData.meta.donHangSo}
                                    onChange={(e) => handleMetaChange('donHangSo', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded font-semibold text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Ngày giao:</span>
                                <input
                                    type="text"
                                    value={editedData.meta.ngayGiaoHang}
                                    onChange={(e) => handleMetaChange('ngayGiaoHang', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded font-semibold text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Ngày yêu cầu:</span>
                                <input
                                    type="text"
                                    value={editedData.meta.ngayYeuCau || ''}
                                    onChange={(e) => handleMetaChange('ngayYeuCau', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded font-semibold text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Người lập:</span>
                                <input
                                    type="text"
                                    value={editedData.meta.nguoiLap || ''}
                                    onChange={(e) => handleMetaChange('nguoiLap', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded font-semibold text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Tổng mã hàng:</span>
                                <div className="px-2 py-1 font-semibold text-blue-600">{totalItems}</div>
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Tổng sản lượng:</span>
                                <div className="px-2 py-1 font-semibold text-green-600">{totalQuantity.toLocaleString()}</div>
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
                            <table className="w-full text-sm whitespace-nowrap">
                                <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-12 sticky left-0 bg-gray-100 z-20">STT</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-48 sticky left-12 bg-gray-100 z-20 shadow-r">Tên hàng hóa</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Bề mặt</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">Đơn vị</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">Quy cách</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">SL yêu cầu</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Bước ren</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Marking</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Chiều dài ren</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">ĐK tiện</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">ĐK đỉnh ren</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Vật liệu</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 w-24">Quy cách phôi</th>
                                        <th className="px-3 py-2 text-center font-semibold text-gray-700 w-24 sticky right-0 bg-gray-100 z-20 shadow-l">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {editedData.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 sticky left-0 bg-white z-10">
                                                <input
                                                    type="text"
                                                    value={item.stt || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'stt', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-center"
                                                />
                                            </td>
                                            <td className="px-3 py-2 sticky left-12 bg-white z-10 shadow-r">
                                                <input
                                                    type="text"
                                                    value={item.tenHangHoa || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'tenHangHoa', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.beMat || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'beMat', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.donVi || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'donVi', e.target.value)}
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
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.buocRen || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'buocRen', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.marking || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'marking', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.chieuDaiRen || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'chieuDaiRen', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.duongKinhTien || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'duongKinhTien', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.duongKinhDinhRen || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'duongKinhDinhRen', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.vatLieu || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'vatLieu', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={item.quyCachPhoi || ''}
                                                    onChange={(e) => handleFieldChange(item.id, 'quyCachPhoi', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-center sticky right-0 bg-white z-10 shadow-l">
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

            <DeleteConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                isDelete={confirmation.isDelete}
            />
        </div >
    );
};
