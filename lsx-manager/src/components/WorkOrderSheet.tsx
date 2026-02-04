import React from 'react';
import type { LSXData, LSXItem } from '../types';
import { getRelevantSpecs, type PrintConfig, DEFAULT_PRINT_CONFIG } from '../utils/printConfig';

interface WorkOrderSheetProps {
    order: LSXData;
    item: LSXItem;
    printConfig: PrintConfig;
}

export const WorkOrderSheet: React.FC<WorkOrderSheetProps> = ({ order, item, printConfig }) => {
    // We will render a table of all tasks
    const tasks = item.tasks || [];

    return (
        <div className="print-container">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-container, .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    @page {
                        size: A5 landscape; /* Changed to A5 Landscape */
                        margin: 5mm;
                    }
                }
                
                .print-container {
                    font-family: 'Times New Roman', Times, serif; /* Formal document font */
                    width: 210mm; /* A5 Landscape width */
                    min-height: 148mm; /* A5 Landscape height */
                    margin: 0 auto;
                    padding: 10px;
                    background: white;
                    box-sizing: border-box;
                    color: #000;
                }
                
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .print-title {
                    font-size: 20px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
// ... (rest of the React style block remains similar but I need to replace the whole block effectively or use multiple chunks if I want to just change specific lines. Since I have to be contiguous, I will replace the component style block and the print function style block).

// Actually, I'll do this in two chunks or one big update.
                
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .print-title {
                    font-size: 24px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }

                .print-subtitle {
                    font-size: 14px;
                    font-style: italic;
                }
                
                .print-info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 14px;
                }

                .print-info-table td {
                    padding: 4px 8px;
                    border: 1px solid #ccc;
                }

                .print-info-label {
                    font-weight: bold;
                    background: #f0f0f0;
                    width: 120px;
                }

                .print-tasks-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .print-tasks-table th {
                    border: 1px solid #000;
                    padding: 8px;
                    background: #eee;
                    font-weight: bold;
                    text-align: center;
                }

                .print-tasks-table td {
                    border: 1px solid #000;
                    padding: 8px;
                    vertical-align: top;
                }

                .print-footer {
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                    page-break-inside: avoid;
                }

                .print-signature-section {
                    text-align: center;
                    width: 200px;
                }
                
                .print-signature-box {
                    height: 80px;
                    margin-top: 10px;
                }
            `}</style>

            <div className="print-header">
                <div className="print-title">LỆNH SẢN XUẤT / PHIẾU THEO DÕI QUY TRÌNH</div>
                <div className="print-subtitle">
                    Số phiếu: <strong>{order.meta.phieuXuat}</strong> | Ngày: {new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>

            <table className="print-info-table">
                <tbody>
                    <tr>
                        <td className="print-info-label">Khách hàng</td>
                        <td>{order.meta.khachHang}</td>
                        <td className="print-info-label">Ngày giao</td>
                        <td>{order.meta.ngayGiaoHang}</td>
                    </tr>
                    <tr>
                        <td className="print-info-label">Mã hàng / Tên</td>
                        <td colSpan={3} style={{ fontWeight: 'bold', fontSize: '15px' }}>{item.tenHangHoa}</td>
                    </tr>
                    <tr>
                        <td className="print-info-label">Quy cách</td>
                        <td>{item.quyCach}</td>
                        <td className="print-info-label">Số lượng</td>
                        <td>
                            <strong style={{ fontSize: '16px' }}>{item.slYeuCau}</strong> {item.donVi}
                            {item.slDuPhong ? <span style={{ fontSize: '12px', marginLeft: '10px' }}>(Dự phòng: {item.slDuPhong})</span> : ''}
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="print-tasks-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>STT</th>
                        <th style={{ width: '150px' }}>Công Đoạn</th>
                        <th>Thông số / Yêu cầu Kỹ thuật</th>
                        <th style={{ width: '120px' }}>Người làm<br />Thời gian</th>
                        <th style={{ width: '100px' }}>Xác nhận<br />(Ký tên)</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map((task, index) => {
                        const specs = getRelevantSpecs(item, task.name, printConfig);
                        return (
                            <tr key={task.id}>
                                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ fontWeight: 'bold' }}>{task.name}</td>
                                <td>
                                    {specs.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
                                            {specs.map((spec, idx) => (
                                                <div key={idx}>
                                                    <span style={{ color: '#555' }}>{spec.label}:</span> <b>{spec.value}</b>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px 0', borderBottom: '1px dotted #ccc' }}></div>
                                    )}
                                </td>
                                <td style={{ fontSize: '11px' }}>
                                    <div>{task.assignee || '..................'}</div>
                                    <div style={{ marginTop: '5px', color: '#666' }}>
                                        {task.startTime ? new Date(task.startTime).toLocaleDateString('vi-VN') : ''}
                                    </div>
                                </td>
                                <td></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '14px', marginBottom: '10px' }}><strong>Ghi chú / Phát sinh:</strong></div>
                <div style={{ border: '1px solid #000', padding: '10px', minHeight: '60px' }}></div>
            </div>

            <div style={{ marginTop: '20px', fontSize: '12px' }}>
                <strong>Người Lập Phiếu:</strong> {order.meta.nguoiLap}
            </div>

            <div style={{ marginTop: '20px', fontSize: '11px', textAlign: 'center', fontStyle: 'italic', color: '#999' }}>
                Hệ thống Quản lý Sản xuất LSX Manager Alpha - In lúc: {new Date().toLocaleString('vi-VN')}
            </div>
        </div>
    );
};

// Helper to open print window
export const printWorkOrder = (order: LSXData, item: LSXItem, printConfig?: PrintConfig) => {
    printAllWorkOrders(order, [item], printConfig);
};


export const printAllWorkOrders = (order: LSXData, items: LSXItem[], printConfig?: PrintConfig) => {
    const config = printConfig || DEFAULT_PRINT_CONFIG;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Vui lòng cho phép popup để in phiếu');
        return;
    }

    const contentHTML = items.map((item, index) => {
        const itemHTML = generateWorkOrderHTML(order, item, config);
        // Add page break after each item except the last one
        return `
            <div style="${index < items.length - 1 ? 'page-break-after: always;' : ''}">
                ${itemHTML}
            </div>
        `;
    }).join('');

    // Generate Cover Page if multiple items are being printed
    let finalContentHTML = contentHTML;
    if (items.length > 1) {
        const coverPageHTML = generateCoverPageHTML(order, items.length);
        finalContentHTML = `
            <div style="page-break-after: always;">
                ${coverPageHTML}
            </div>
            ${contentHTML}
        `;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>In Lệnh Sản Xuất</title>
            <style>
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 2mm; 
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                    }
                }
                body {
                    font-family: 'Times New Roman', Times, serif;
                    background: white;
                    color: black;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 4px 6px;
                    vertical-align: top;
                }
            </style>
        </head>
        <body>
            ${finalContentHTML}
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

const generateWorkOrderHTML = (order: LSXData, item: LSXItem, printConfig: PrintConfig): string => {
    const tasks = item.tasks || [];

    return `
        <div style="width: 200mm; margin: 0 auto; padding-top: 5px;">
            
            <!-- HEADER -->
            <div style="text-align: center; margin-bottom: 10px;">
                <h1 style="margin: 0 0 2px 0; font-size: 16pt; text-transform: uppercase;">LỆNH SẢN XUẤT / PHIẾU THEO DÕI QT</h1>
                <div style="font-size: 10pt; font-style: italic;">
                    Số phiếu: <strong>${order.meta.phieuXuat}</strong> | Ngày in: ${new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>

            <!-- INFO TABLE -->
            <table style="width: 100%; border: 1px solid #000; margin-bottom: 15px; font-size: 10pt;">
                <tr>
                    <td style="width: 15%; background: #eee; font-weight: bold; padding: 3px 5px;">Khách hàng</td>
                    <td style="width: 35%; padding: 3px 5px;">${order.meta.khachHang}</td>
                    <td style="width: 15%; background: #eee; font-weight: bold; padding: 3px 5px;">Ngày giao</td>
                    <td style="width: 35%; padding: 3px 5px;">${order.meta.ngayGiaoHang}</td>
                </tr>
                <tr>
                    <td style="background: #eee; font-weight: bold; padding: 3px 5px;">Tên hàng</td>
                    <td colspan="3" style="font-weight: bold; font-size: 12pt; padding: 3px 5px;">${item.tenHangHoa}</td>
                </tr>
                <tr>
                    <td style="background: #eee; font-weight: bold; padding: 3px 5px;">Quy cách</td>
                    <td style="padding: 3px 5px;">${item.quyCach}</td>
                    <td style="background: #eee; font-weight: bold; padding: 3px 5px;">Số lượng</td>
                     <td style="padding: 3px 5px;">
                        <strong style="font-size: 12pt;">${item.slYeuCau}</strong> ${item.donVi}
                        ${item.slDuPhong ? `<span style="font-size: 9pt; margin-left: 8px;">(Dự phòng: ${item.slDuPhong})</span>` : ''}
                    </td>
                </tr>
                ${item.vatLieu ? `
                <tr>
                    <td style="background: #eee; font-weight: bold; padding: 3px 5px;">Vật liệu</td>
                    <td colspan="3" style="padding: 3px 5px;">${item.vatLieu} ${item.quyCachPhoi ? `- Phôi: ${item.quyCachPhoi}` : ''}</td>
                </tr>
                ` : ''}
            </table>

            <!-- TASKS TABLE -->
            <table style="width: 100%; border: 1px solid #000; margin-bottom: 0; font-size: 10pt;">
                <thead>
                    <tr style="background: #eee;">
                        <th style="width: 35px; text-align: center; padding: 4px;">STT</th>
                        <th style="width: 130px; text-align: left; padding: 4px;">Công Đoạn</th>
                        <th style="text-align: left; padding: 4px;">Thông số / Yêu cầu Kỹ thuật</th>
                        <th style="width: 100px; text-align: center; padding: 4px;">Thực hiện</th>
                        <th style="width: 70px; text-align: center; padding: 4px;">Ký tên</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.length > 0 ? tasks.map((task, index) => {
        const specs = getRelevantSpecs(item, task.name, printConfig);
        return `
                            <tr>
                                <td style="text-align: center; padding: 4px;">${index + 1}</td>
                                <td style="font-weight: bold; padding: 4px;">${task.name}</td>
                                <td style="padding: 4px;">
                                    ${specs.length > 0 ? `
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; font-size: 9.5pt;">
                                            ${specs.map(spec => `
                                                <div style="white-space: nowrap;">
                                                    <span style="color: #444;">${spec.label}:</span> <b>${spec.value}</b>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : '<div style="height: 15px; border-bottom: 1px dotted #ccc;"></div>'}
                                </td>
                                <td style="font-size: 9pt; text-align: center; padding: 4px;">
                                    ${task.assignee || ''}<br/>
                                    <span style="color: #666; font-size: 8pt;">${task.startTime ? new Date(task.startTime).toLocaleDateString('vi-VN') : ''}</span>
                                </td>
                                <td></td>
                            </tr>
                        `;
    }).join('') : `<tr><td colspan="5" style="text-align: center; padding: 15px;">Chưa có công đoạn nào</td></tr>`}
                </tbody>
            </table>
        </div>
    `;
};

const generateCoverPageHTML = (order: LSXData, totalItems: number): string => {
    return `
        <div style="width: 200mm; margin: 0 auto; padding-top: 20px; height: 90vh; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px double #000; padding: 20px;">
            
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="margin: 0 0 10px 0; font-size: 32pt; text-transform: uppercase;">LỆNH SẢN XUẤT</h1>
                <div style="width: 100px; height: 2px; bg-color: #000; margin: 0 auto 20px auto;"></div>
                <h2 style="margin: 0; font-size: 26pt; font-weight: bold;">Đơn: ${order.meta.donHangSo}</h2>
            </div>

            <div style="width: 80%; font-size: 16pt; line-height: 1.8;">
                <div style="display: flex; margin-bottom: 15px; border-bottom: 1px dotted #999;">
                    <strong style="width: 180px;">Khách hàng:</strong>
                    <span>${order.meta.khachHang}</span>
                </div>
                <div style="display: flex; margin-bottom: 15px; border-bottom: 1px dotted #999;">
                    <strong style="width: 180px;">Phiếu xuất:</strong>
                    <span>${order.meta.phieuXuat}</span>
                </div>
                <div style="display: flex; margin-bottom: 15px; border-bottom: 1px dotted #999;">
                    <strong style="width: 180px;">Ngày giao:</strong>
                    <span>${order.meta.ngayGiaoHang ? new Date(order.meta.ngayGiaoHang).toLocaleDateString('vi-VN') : '...'}</span>
                </div>
                <div style="display: flex; margin-bottom: 15px; border-bottom: 1px dotted #999;">
                    <strong style="width: 180px;">Tổng số mục:</strong>
                    <span>${totalItems} sản phẩm</span>
                </div>
                <div style="display: flex; margin-bottom: 15px; border-bottom: 1px dotted #999;">
                   <strong style="width: 180px;">Người lập:</strong>
                   <span>${order.meta.nguoiLap}</span>
               </div>
            </div>

        </div>
    `;
};
