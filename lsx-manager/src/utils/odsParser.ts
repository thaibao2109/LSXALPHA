import * as XLSX from 'xlsx';
import type { LSXData, LSXItem } from '../types';

// Helper to normalize header strings for comparison
const normalizeHeader = (header: any): string => {
    if (!header) return "";
    return String(header).trim().toLowerCase();
};

// Map of Property Key -> Possible Header Names (lowercased)
const COLUMN_MAPPING: Record<keyof Omit<LSXItem, 'id' | 'tasks' | 'delivered'>, string[]> = {
    stt: ['stt', 'no.'],
    tenHangHoa: ['tên hàng hóa', 'tên hàng', 'tên sản phẩm'],
    beMat: ['bề mặt', 'xử lý bề mặt'],
    donVi: ['đơn vị', 'đvt', 'đơn vị tính', 'bộ'],
    quyCach: ['quy cách', 'kích thước'],
    slYeuCau: ['sl yêu cầu', 'số lượng yêu cầu', 'sl đặt'],
    slDuPhong: ['sl dự phòng', 'số lượng dự phòng'],
    buocRen: ['bước ren', 'pitch'],
    marking: ['marking', 'ký hiệu', 'mác'],
    chieuDaiRen: ['chiều dài ren', 'len.', 'length'],
    duongKinhTien: ['đk tiện', 'đường kính tiện'],
    duongKinhThan: ['đk thân', 'đường kính thân'],
    duongKinhDinhRen: ['đk đỉnh ren', 'đường kính đỉnh ren', 'đk đỉnh'],
    doDay: ['độ dày', 'chiều dày'],
    kichThuocLucGiac: ['kt lục giác', 'kích thước lục giác', 'lục giác'],
    wh: ['wh', 'w.h'],
    vatLieu: ['vl', 'vật liệu', 'mác thép'],
    quyCachPhoi: ['qc phôi', 'quy cách phôi', 'phôi']
};

export const parseODS = (file: File): Promise<LSXData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                if (!jsonData || jsonData.length === 0) {
                    reject(new Error("File is empty"));
                    return;
                }

                // 1. Extract Metadata
                const titleRow = jsonData[0]?.[0] || "";
                const phieuXuat = typeof titleRow === 'string' ? titleRow.split(":")[1]?.trim() || titleRow : "";

                // Helper to find value in rows
                const getValue = (key: string): string => {
                    for (let row of jsonData) {
                        if (row && row[0] && typeof row[0] === 'string' && row[0].includes(key)) {
                            return row[2] || "";
                        }
                    }
                    return "";
                }

                const ngayYeuCau = getValue("Ngày yêu cầu");
                const nguoiLap = getValue("Người Lập");
                const donHangSo = getValue("Đơn hàng số");
                const khachHang = getValue("Khách hàng");
                const ngayGiaoHang = getValue("Ngày giao hàng");

                // Helper to check if a cell matches any alias for a key
                const isHeaderMatch = (cell: any, key: keyof typeof COLUMN_MAPPING): boolean => {
                    const normalized = normalizeHeader(cell);
                    return COLUMN_MAPPING[key].some(alias => normalized === alias || normalized.includes(alias));
                };

                // 2. Find Header Row
                let headerRowIndex = -1;
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    // Flexible check: must contain at least STT *OR* Tên hàng hóa to be a candidate
                    if (row && (row.some(cell => isHeaderMatch(cell, 'stt')) || row.some(cell => isHeaderMatch(cell, 'tenHangHoa')))) {
                        // Stronger check: ideally both, but at least 'tenHangHoa' is critical if STT is missing or named weirdly
                        // Let's require tenHangHoa as the anchor
                        if (row.some(cell => isHeaderMatch(cell, 'tenHangHoa'))) {
                            headerRowIndex = i;
                            break;
                        }
                    }
                }

                if (headerRowIndex === -1) {
                    reject(new Error("Không tìm thấy dòng tiêu đề hợp lệ (phải chứa 'Tên hàng hóa' hoặc tương tự)"));
                    return;
                }

                // 3. Build Column Index Map
                const headerRow = jsonData[headerRowIndex];
                const columnIndices: Partial<Record<keyof LSXItem, number>> = {};

                headerRow.forEach((cell, index) => {
                    const normalizedCell = normalizeHeader(cell);
                    for (const [key, validHeaders] of Object.entries(COLUMN_MAPPING)) {
                        if (validHeaders.some(h => normalizedCell === h || normalizedCell.includes(h))) {
                            // Only assign if not already assigned (first match wins)
                            if (columnIndices[key as keyof LSXItem] === undefined) {
                                columnIndices[key as keyof LSXItem] = index;
                            }
                        }
                    }
                });

                // 4. Extract Items
                const items: LSXItem[] = [];
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0 || !row[columnIndices.stt || 0]) continue; // Skip empty rows or rows without STT

                    const getItemValue = (key: keyof LSXItem): any => {
                        const index = columnIndices[key];
                        if (index === undefined) return "";
                        return row[index] !== undefined ? row[index] : "";
                    };

                    const slYeuCauRaw = getItemValue('slYeuCau');
                    const slDuPhongRaw = getItemValue('slDuPhong');

                    const item: LSXItem = {
                        id: `item-${i}`,
                        stt: getItemValue('stt'),
                        tenHangHoa: getItemValue('tenHangHoa'),
                        beMat: getItemValue('beMat'),
                        donVi: getItemValue('donVi'),
                        quyCach: getItemValue('quyCach'),
                        slYeuCau: typeof slYeuCauRaw === 'number' ? slYeuCauRaw : parseInt(String(slYeuCauRaw || 0)) || 0,
                        slDuPhong: typeof slDuPhongRaw === 'number' ? slDuPhongRaw : parseInt(String(slDuPhongRaw || 0)) || 0,
                        buocRen: getItemValue('buocRen'),
                        marking: getItemValue('marking'),
                        chieuDaiRen: getItemValue('chieuDaiRen'),
                        duongKinhTien: getItemValue('duongKinhTien'),
                        duongKinhThan: getItemValue('duongKinhThan'),
                        duongKinhDinhRen: getItemValue('duongKinhDinhRen'),
                        doDay: getItemValue('doDay'),
                        kichThuocLucGiac: getItemValue('kichThuocLucGiac'),
                        wh: getItemValue('wh'),
                        vatLieu: getItemValue('vatLieu'),
                        quyCachPhoi: getItemValue('quyCachPhoi'),
                        tasks: []
                    };
                    items.push(item);
                }

                resolve({
                    meta: { phieuXuat, ngayYeuCau, nguoiLap, donHangSo, khachHang, ngayGiaoHang },
                    items
                });

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
