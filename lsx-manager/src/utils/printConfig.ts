import type { LSXItem } from '../types';

export interface SpecConfig {
    label: string;
    field: keyof LSXItem;
}

export type PrintConfig = Record<string, string[]>;

export const AVAILABLE_SPECS: Record<string, string> = {
    'quyCach': 'Quy cách',
    'vatLieu': 'Vật liệu',
    'quyCachPhoi': 'Quy cách phôi',
    'kichThuocLucGiac': 'Kích thước lục giác',
    'doDay': 'Độ dày',
    'duongKinhTien': 'Đường kính tiện',
    'duongKinhThan': 'Đường kính thân',
    'duongKinhDinhRen': 'Đường kính đỉnh ren',
    'buocRen': 'Bước ren',
    'chieuDaiRen': 'Chiều dài ren',
    'beMat': 'Xử lý bề mặt',
    'slYeuCau': 'Số lượng yêu cầu',
    'slDuPhong': 'Số lượng dự phòng'
};

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
    // Default mappings for common tasks
    'Cắt phôi': ['quyCachPhoi', 'vatLieu'],
    'Dập': ['kichThuocLucGiac', 'doDay', 'quyCach'],
    'Tiện thô': ['duongKinhTien', 'duongKinhThan', 'quyCach'],
    'Tiện tinh': ['duongKinhTien', 'duongKinhThan', 'quyCach'],
    'Nhiệt luyện': ['beMat', 'vatLieu'],
    'Mạ': ['beMat', 'vatLieu']
};

export const PRINT_CONSTANTS = {
    pageSize: 'A5 landscape',
    pageMargin: '10mm',
};

// Helper to get specs based on dynamic config
export const getRelevantSpecs = (item: LSXItem, taskName: string, config: PrintConfig) => {
    // 1. Try exact match
    let fields = config[taskName];

    // 2. If no exact match, try partial match (case insensitive)
    if (!fields) {
        const lowerTaskName = taskName.toLowerCase();
        const configKeys = Object.keys(config);
        const matchedKey = configKeys.find(key => lowerTaskName.includes(key.toLowerCase()));
        if (matchedKey) {
            fields = config[matchedKey];
        }
    }

    // 3. Fallback defaults if still no config
    if (!fields || fields.length === 0) {
        // Simple fallback
        fields = ['quyCach', 'vatLieu'];
    }

    // Ensure unique and valid fields
    const uniqueFields = Array.from(new Set(fields)).filter(f => AVAILABLE_SPECS[f]);

    const results: { label: string; value: any }[] = [];

    uniqueFields.forEach(fieldKey => {
        // @ts-ignore
        const value = item[fieldKey];
        if (value) {
            results.push({
                label: AVAILABLE_SPECS[fieldKey] || fieldKey,
                value
            });
        }
    });

    return results;
};
