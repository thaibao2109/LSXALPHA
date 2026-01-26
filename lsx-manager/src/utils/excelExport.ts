import * as XLSX from 'xlsx';
import type { LSXData, ActivityLog } from '../types';

export const exportDailyReport = (logs: ActivityLog[], date: string) => {
    // Filter logs by date
    const targetDate = new Date(date).toDateString();
    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toDateString();
        return logDate === targetDate;
    });

    // Format data for Excel
    const data = filteredLogs.map(log => ({
        'Thời gian': new Date(log.timestamp).toLocaleString('vi-VN'),
        'Đơn hàng': log.orderName,
        'Mã hàng': log.itemName || '',
        'Công đoạn': log.taskName || '',
        'Hành động': getActionLabel(log.action),
        'Chi tiết': formatDetails(log),
        'Người làm': log.details.assignee || ''
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo ngày ' + date);

    // Download
    XLSX.writeFile(wb, `BaoCao_${date}.xlsx`);
};

export const exportOrderDetail = (order: LSXData) => {
    // Sheet 1: Thông tin đơn hàng
    const metaData = [
        ['Phiếu xuất', order.meta.phieuXuat],
        ['Khách hàng', order.meta.khachHang],
        ['Đơn hàng số', order.meta.donHangSo],
        ['Ngày yêu cầu', order.meta.ngayYeuCau],
        ['Ngày giao hàng', order.meta.ngayGiaoHang],
        ['Người lập', order.meta.nguoiLap]
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(metaData);

    // Sheet 2: Danh sách sản phẩm
    const itemsData = order.items.map(item => ({
        'STT': item.stt,
        'Tên hàng hóa': item.tenHangHoa,
        'Quy cách': item.quyCach,
        'SL yêu cầu': item.slYeuCau,
        'SL dự phòng': item.slDuPhong,
        'Đơn vị': item.donVi,
        'Bề mặt': item.beMat,
        'Vật liệu': item.vatLieu
    }));
    const wsItems = XLSX.utils.json_to_sheet(itemsData);

    // Sheet 3: Tiến độ công đoạn
    const tasksData: any[] = [];
    order.items.forEach(item => {
        (item.tasks || []).forEach(task => {
            tasksData.push({
                'Mã hàng': item.tenHangHoa,
                'Công đoạn': task.name,
                'Trạng thái': getStatusLabel(task.status),
                'Người làm': task.assignee || '',
                'Thời gian bắt đầu': task.startTime || '',
                'Thời gian kết thúc': task.endTime || ''
            });
        });
    });
    const wsTasks = XLSX.utils.json_to_sheet(tasksData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Thông tin');
    XLSX.utils.book_append_sheet(wb, wsItems, 'Sản phẩm');
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Tiến độ');

    // Download
    XLSX.writeFile(wb, `DonHang_${order.meta.phieuXuat}.xlsx`);
};

// Helper functions
const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
        'task_status_change': 'Thay đổi trạng thái',
        'task_assigned': 'Gán người làm',
        'task_time_set': 'Cập nhật thời gian',
        'order_created': 'Tạo đơn hàng',
        'order_deleted': 'Xóa đơn hàng',
        'item_edited': 'Sửa sản phẩm'
    };
    return labels[action] || action;
};

const formatDetails = (log: ActivityLog): string => {
    if (log.action === 'task_status_change') {
        return `${getStatusLabel(log.details.oldValue || '')} → ${getStatusLabel(log.details.newValue || '')}`;
    }
    if (log.action === 'task_assigned') {
        return `Gán cho: ${log.details.newValue || log.details.assignee || ''}`;
    }
    if (log.details.field) {
        return `${log.details.field}: ${log.details.oldValue || ''} → ${log.details.newValue || ''}`;
    }
    return '';
};

const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        'pending': 'Chờ',
        'in_progress': 'Đang làm',
        'completed': 'Hoàn thành'
    };
    return labels[status] || status;
};
