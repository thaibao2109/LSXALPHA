export interface LSXItem {
    stt: number | string;
    tenHangHoa: string;
    beMat: string;
    donVi: string;
    quyCach: string;
    slYeuCau: number;
    slDuPhong: number;
    buocRen: string;
    chieuDaiRen: string;
    duongKinhTien: string;
    duongKinhThan: string;
    duongKinhDinhRen: string;
    doDay: string;
    kichThuocLucGiac: string;
    wh: string;
    vatLieu: string;
    quyCachPhoi: string;
    marking: string;

    // Custom fields for management
    id: string; // Unique ID generated from ODS data
    tasks?: Task[];
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
    id: string;
    name: string;
    status: TaskStatus;
    assignee?: string;
    startTime?: string;
    endTime?: string;
    // Backward compatibility for migration
    completed?: boolean;
}

export interface LSXData {
    id?: string; // New: Unique ID for multi-order management
    meta: {
        phieuXuat: string;
        ngayYeuCau: string;
        nguoiLap: string;
        donHangSo: string;
        khachHang: string;
        ngayGiaoHang: string;
    };
    items: LSXItem[];
}

export interface ActivityLog {
    id: string;
    timestamp: string; // ISO string
    orderId: string;
    orderName: string; // Phiếu xuất
    itemId?: string;
    itemName?: string; // Tên hàng hóa
    taskId?: string;
    taskName?: string; // Tên công đoạn
    action: 'task_status_change' | 'task_assigned' | 'task_time_set' | 'order_created' | 'order_deleted' | 'item_edited';
    details: {
        field?: string;
        oldValue?: any;
        newValue?: any;
        assignee?: string;
    };
}

export interface ProductType {
    id: string;
    name: string;
    tasks: string[]; // List of task names that belong to this product type
}
