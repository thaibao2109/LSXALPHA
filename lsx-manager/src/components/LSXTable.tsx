import React from 'react';
import type { LSXItem } from '../types';

interface LSXTableProps {
    items: LSXItem[];
    onItemClick: (item: LSXItem) => void;
}

export const LSXTable: React.FC<LSXTableProps> = ({ items, onItemClick }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">STT</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-12 bg-gray-50 min-w-[200px]">Tên hàng hóa</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QC / Kích thước</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vật liệu</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SL Yêu Cầu</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết kỹ thuật</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiến độ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => {
                            const totalTasks = item.tasks?.length || 0;
                            const completedTasks = item.tasks?.filter(t => t.status === 'completed').length || 0;
                            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                            return (
                                <tr
                                    key={item.id}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={() => onItemClick(item)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center sticky left-0 bg-white group-hover:bg-blue-50">{item.stt}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-12 bg-white group-hover:bg-blue-50">{item.tenHangHoa}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.quyCach}</span>
                                            <span className="text-xs text-gray-400">Phôi: {item.quyCachPhoi}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.vatLieu}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-center">{item.slYeuCau}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{item.donVi}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <ul className="list-disc pl-4 space-y-1 text-xs text-gray-500">
                                            {item.buocRen && <li>Bước ren: {item.buocRen}</li>}
                                            {item.chieuDaiRen && <li>Chiều dài ren: {item.chieuDaiRen}</li>}
                                            {item.duongKinhThan && <li>ĐK Thân: {item.duongKinhThan}</li>}
                                            {item.kichThuocLucGiac && <li>Lục giác: {item.kichThuocLucGiac}</li>}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {totalTasks > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">{completedTasks}/{totalTasks}</span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                Chưa có quy trình
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-right text-sm text-gray-500">
                Hiển thị {items.length} mục
            </div>
        </div>
    );
};
