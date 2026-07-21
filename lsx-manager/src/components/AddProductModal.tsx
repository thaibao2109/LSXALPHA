import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { LSXItem } from '../types';
import { uuid } from '../utils/uuid';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: LSXItem) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState<Partial<LSXItem>>({
        tenHangHoa: '',
        quyCach: '',
        vatLieu: '',
        slYeuCau: 1,
        donVi: 'cái',
        beMat: '',
        slDuPhong: 0,
        buocRen: '',
        chieuDaiRen: '',
        duongKinhTien: '',
        duongKinhThan: '',
        duongKinhDinhRen: '',
        doDay: '',
        kichThuocLucGiac: '',
        wh: '',
        quyCachPhoi: '',
        marking: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newItem: LSXItem = {
            id: uuid(),
            stt: '',
            tenHangHoa: formData.tenHangHoa || '',
            quyCach: formData.quyCach || '',
            vatLieu: formData.vatLieu || '',
            slYeuCau: Number(formData.slYeuCau) || 0,
            donVi: formData.donVi || '',
            beMat: formData.beMat || '',
            slDuPhong: Number(formData.slDuPhong) || 0,
            buocRen: formData.buocRen || '',
            chieuDaiRen: formData.chieuDaiRen || '',
            duongKinhTien: formData.duongKinhTien || '',
            duongKinhThan: formData.duongKinhThan || '',
            duongKinhDinhRen: formData.duongKinhDinhRen || '',
            doDay: formData.doDay || '',
            kichThuocLucGiac: formData.kichThuocLucGiac || '',
            wh: formData.wh || '',
            quyCachPhoi: formData.quyCachPhoi || '',
            marking: formData.marking || '',
            tasks: []
        };

        onAdd(newItem);
        setFormData({
            tenHangHoa: '', quyCach: '', vatLieu: '', slYeuCau: 1, donVi: 'cái', beMat: '',
            slDuPhong: 0, buocRen: '', chieuDaiRen: '', duongKinhTien: '', duongKinhThan: '',
            duongKinhDinhRen: '', doDay: '', kichThuocLucGiac: '', wh: '', quyCachPhoi: '', marking: ''
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-surface-900">Thêm Sản Phẩm Mới</h3>
                    <button type="button" onClick={onClose} className="p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="add-product-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Hàng 1: Tên hàng hóa và Quy cách (Cột lớn) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Tên Hàng Hóa *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.tenHangHoa}
                                    onChange={e => setFormData(p => ({ ...p, tenHangHoa: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="VD: Bu lông neo..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Quy Cách / Kích Thước</label>
                                <input
                                    type="text"
                                    value={formData.quyCach}
                                    onChange={e => setFormData(p => ({ ...p, quyCach: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Các hàng còn lại chia 4 cột */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Sản Lượng *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.slYeuCau}
                                    onChange={e => setFormData(p => ({ ...p, slYeuCau: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">SL Dự Phòng</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.slDuPhong}
                                    onChange={e => setFormData(p => ({ ...p, slDuPhong: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Đơn Vị</label>
                                <input
                                    type="text"
                                    value={formData.donVi}
                                    onChange={e => setFormData(p => ({ ...p, donVi: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="VD: cái, bộ..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Vật Liệu</label>
                                <input
                                    type="text"
                                    value={formData.vatLieu}
                                    onChange={e => setFormData(p => ({ ...p, vatLieu: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Bề Mặt / Lớp Mạ</label>
                                <input
                                    type="text"
                                    value={formData.beMat}
                                    onChange={e => setFormData(p => ({ ...p, beMat: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Marking</label>
                                <input
                                    type="text"
                                    value={formData.marking}
                                    onChange={e => setFormData(p => ({ ...p, marking: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Bước Ren (P)</label>
                                <input
                                    type="text"
                                    value={formData.buocRen}
                                    onChange={e => setFormData(p => ({ ...p, buocRen: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Chiều Dài Ren</label>
                                <input
                                    type="text"
                                    value={formData.chieuDaiRen}
                                    onChange={e => setFormData(p => ({ ...p, chieuDaiRen: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Đường Kính Tiện</label>
                                <input
                                    type="text"
                                    value={formData.duongKinhTien}
                                    onChange={e => setFormData(p => ({ ...p, duongKinhTien: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Đường Kính Thân</label>
                                <input
                                    type="text"
                                    value={formData.duongKinhThan}
                                    onChange={e => setFormData(p => ({ ...p, duongKinhThan: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">ĐK Đỉnh Ren</label>
                                <input
                                    type="text"
                                    value={formData.duongKinhDinhRen}
                                    onChange={e => setFormData(p => ({ ...p, duongKinhDinhRen: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">Độ Dày</label>
                                <input
                                    type="text"
                                    value={formData.doDay}
                                    onChange={e => setFormData(p => ({ ...p, doDay: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">KT Lục Giác</label>
                                <input
                                    type="text"
                                    value={formData.kichThuocLucGiac}
                                    onChange={e => setFormData(p => ({ ...p, kichThuocLucGiac: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-surface-700 mb-1">W/H</label>
                                <input
                                    type="text"
                                    value={formData.wh}
                                    onChange={e => setFormData(p => ({ ...p, wh: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-surface-700 mb-1">Quy Cách Phôi</label>
                                <input
                                    type="text"
                                    value={formData.quyCachPhoi}
                                    onChange={e => setFormData(p => ({ ...p, quyCachPhoi: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-end gap-3 bg-surface-50/50 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-surface-600 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="add-product-form"
                        className="px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all active:scale-95"
                    >
                        Thêm Sản Phẩm
                    </button>
                </div>
            </div>
        </div>
    );
};
