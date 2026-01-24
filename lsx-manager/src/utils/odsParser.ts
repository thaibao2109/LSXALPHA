import * as XLSX from 'xlsx';
import type { LSXData, LSXItem } from '../types';

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

                // 2. Find Header Row
                let headerRowIndex = -1;
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row.includes("STT") && row.includes("TÊN HÀNG HÓA")) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    reject(new Error("Cannot find valid header row (STT, TÊN HÀNG HÓA)"));
                    return;
                }

                // 3. Extract Items
                const items: LSXItem[] = [];
                // skipped header map logic as we use fixed indices

                // Manual mapping based on known columns to avoid ambiguity

                // Manual mapping based on known columns to avoid ambiguity
                // Row 8: ["STT","TÊN HÀNG HÓA","Bề mặt","BỘ","QUY CÁCH","SL yêu cầu","SL dự phòng","Bước ren",...]
                // Column indices based on log:
                // 0: STT, 1: Tên, 2: Bề mặt, 3: Bộ, 4: QC, 5: SL YC, 6: SL DP, 7: Bước ren
                // 8: Marking, 9: Chiều dài ren, 10: ĐK Tiện, 11: ĐK Thân, 12: ĐK Đỉnh, 13: Độ dày, 14: KT Lục giác, 15: WH, 16: VL, 17: QC Phôi

                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

                    // Simple mapping by index for now to be precise
                    const item: LSXItem = {
                        id: `item-${i}`,
                        stt: row[0],
                        tenHangHoa: row[1],
                        beMat: row[2],
                        donVi: row[3],
                        quyCach: row[4],
                        slYeuCau: typeof row[5] === 'number' ? row[5] : parseInt(String(row[5] || 0)) || 0,
                        slDuPhong: typeof row[6] === 'number' ? row[6] : parseInt(String(row[6] || 0)) || 0,
                        buocRen: row[7],
                        // skipping marking
                        chieuDaiRen: row[9],
                        duongKinhTien: row[10],
                        duongKinhThan: row[11],
                        duongKinhDinhRen: row[12],
                        doDay: row[13],
                        kichThuocLucGiac: row[14],
                        wh: row[15],
                        vatLieu: row[16],
                        quyCachPhoi: row[17],
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
