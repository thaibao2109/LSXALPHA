import React from 'react';
import type { LSXData, LSXItem, Task } from '../types';

interface WorkOrderSheetProps {
    order: LSXData;
    item: LSXItem;
    task: Task;
}

export const WorkOrderSheet: React.FC<WorkOrderSheetProps> = ({ order, item, task }) => {
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
                        size: A5;
                        margin: 10mm;
                    }
                }
                
                .print-container {
                    font-family: 'Arial', sans-serif;
                    max-width: 148mm;
                    margin: 20px auto;
                    padding: 15px;
                    border: 2px solid #000;
                    background: white;
                }
                
                .print-header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                
                .print-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .print-section {
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 1px solid #333;
                }
                
                .print-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 12px;
                }
                
                .print-label {
                    font-weight: bold;
                }
                
                .print-task-name {
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    padding: 10px;
                    background: #f0f0f0;
                    border: 2px solid #000;
                    margin: 15px 0;
                }
                
                .print-signature {
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px dashed #666;
                }
                
                .print-signature-row {
                    margin-bottom: 25px;
                }
                
                .print-underline {
                    display: inline-block;
                    min-width: 150px;
                    border-bottom: 1px solid #000;
                    margin-left: 10px;
                }
            `}</style>

            <div className="print-header">
                <div className="print-title">PHIẾU CÔNG ĐOẠN SẢN XUẤT</div>
                <div style={{ fontSize: '11px', marginTop: '5px' }}>
                    Đơn hàng: {order.meta.phieuXuat}
                </div>
            </div>

            <div className="print-section">
                <div className="print-row">
                    <span className="print-label">Khách hàng:</span>
                    <span>{order.meta.khachHang}</span>
                </div>
                <div className="print-row">
                    <span className="print-label">Ngày giao:</span>
                    <span>{order.meta.ngayGiaoHang}</span>
                </div>
            </div>

            <div className="print-section">
                <div className="print-row">
                    <span className="print-label">Mã hàng:</span>
                    <span>{item.tenHangHoa}</span>
                </div>
                <div className="print-row">
                    <span className="print-label">Quy cách:</span>
                    <span>{item.quyCach}</span>
                </div>
                <div className="print-row">
                    <span className="print-label">Số lượng:</span>
                    <span>{item.slYeuCau} {item.donVi}</span>
                </div>
                {item.vatLieu && (
                    <div className="print-row">
                        <span className="print-label">Vật liệu:</span>
                        <span>{item.vatLieu}</span>
                    </div>
                )}
            </div>

            <div className="print-task-name">
                CÔNG ĐOẠN: {task.name.toUpperCase()}
            </div>

            <div className="print-signature">
                <div className="print-signature-row">
                    <span className="print-label">Người thực hiện:</span>
                    <span className="print-underline">{task.assignee || ''}</span>
                </div>

                <div className="print-signature-row">
                    <span className="print-label">Thời gian bắt đầu:</span>
                    <span className="print-underline"></span>
                </div>

                <div className="print-signature-row">
                    <span className="print-label">Thời gian kết thúc:</span>
                    <span className="print-underline"></span>
                </div>

                <div className="print-signature-row" style={{ marginTop: '30px' }}>
                    <span className="print-label">Ký nhận:</span>
                    <span className="print-underline"></span>
                    <span style={{ marginLeft: '20px' }} className="print-label">Ngày:</span>
                    <span className="print-underline" style={{ minWidth: '100px' }}></span>
                </div>

                <div className="print-signature-row" style={{ marginTop: '30px' }}>
                    <span className="print-label">QC kiểm tra:</span>
                    <span className="print-underline"></span>
                    <span style={{ marginLeft: '20px' }} className="print-label">Ngày:</span>
                    <span className="print-underline" style={{ minWidth: '100px' }}></span>
                </div>

                <div style={{ marginTop: '15px' }}>
                    <div className="print-label">Ghi chú:</div>
                    <div style={{ borderBottom: '1px solid #000', marginTop: '5px', minHeight: '20px' }}></div>
                    <div style={{ borderBottom: '1px solid #000', marginTop: '5px', minHeight: '20px' }}></div>
                </div>
            </div>
        </div>
    );
};

// Helper function to open print window
export const printWorkOrder = (order: LSXData, item: LSXItem, task: Task) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Vui lòng cho phép popup để in phiếu');
        return;
    }

    const container = document.createElement('div');
    const root = document.createElement('div');
    container.appendChild(root);

    // Render component to string (simplified approach)
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Phiếu Công đoạn - ${task.name}</title>
        </head>
        <body>
            ${generateWorkOrderHTML(order, item, task)}
            <script>
                window.onload = function() {
                    window.print();
                    // window.close(); // Uncomment if you want to auto-close after print
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

const generateWorkOrderHTML = (order: LSXData, item: LSXItem, task: Task): string => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 148mm; margin: 20px auto; padding: 15px; border: 2px solid #000;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">PHIẾU CÔNG ĐOẠN SẢN XUẤT</div>
                <div style="font-size: 11px;">Đơn hàng: ${order.meta.phieuXuat}</div>
            </div>
            
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #333;">
                <div style="margin-bottom: 8px; font-size: 12px;"><strong>Khách hàng:</strong> ${order.meta.khachHang}</div>
                <div style="font-size: 12px;"><strong>Ngày giao:</strong> ${order.meta.ngayGiaoHang}</div>
            </div>
            
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #333;">
                <div style="margin-bottom: 8px; font-size: 12px;"><strong>Mã hàng:</strong> ${item.tenHangHoa}</div>
                <div style="margin-bottom: 8px; font-size: 12px;"><strong>Quy cách:</strong> ${item.quyCach}</div>
                <div style="margin-bottom: 8px; font-size: 12px;"><strong>Số lượng:</strong> ${item.slYeuCau} ${item.donVi}</div>
                ${item.vatLieu ? `<div style="font-size: 12px;"><strong>Vật liệu:</strong> ${item.vatLieu}</div>` : ''}
            </div>
            
            <div style="font-size: 16px; font-weight: bold; text-align: center; padding: 10px; background: #f0f0f0; border: 2px solid #000; margin: 15px 0;">
                CÔNG ĐOẠN: ${task.name.toUpperCase()}
            </div>
            
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px dashed #666;">
                <div style="margin-bottom: 25px;">
                    <strong>Người thực hiện:</strong> <span style="display: inline-block; min-width: 150px; border-bottom: 1px solid #000; margin-left: 10px;">${task.assignee || ''}</span>
                </div>
                <div style="margin-bottom: 25px;">
                    <strong>Thời gian bắt đầu:</strong> <span style="display: inline-block; min-width: 150px; border-bottom: 1px solid #000; margin-left: 10px;"></span>
                </div>
                <div style="margin-bottom: 25px;">
                    <strong>Thời gian kết thúc:</strong> <span style="display: inline-block; min-width: 150px; border-bottom: 1px solid #000; margin-left: 10px;"></span>
                </div>
                <div style="margin-top: 30px; margin-bottom: 25px;">
                    <strong>Ký nhận:</strong> <span style="display: inline-block; min-width: 150px; border-bottom: 1px solid #000; margin-left: 10px;"></span>
                    <strong style="margin-left: 20px;">Ngày:</strong> <span style="display: inline-block; min-width: 100px; border-bottom: 1px solid #000; margin-left: 10px;"></span>
                </div>
                <div style="margin-top: 30px; margin-bottom: 25px;">
                    <strong>QC kiểm tra:</strong> <span style="display: inline-block; min-width: 150px; border-bottom: 1px solid #000; margin-left: 10px;"></span>
                    <strong style="margin-left: 20px;">Ngày:</strong> <span style="display: inline-block; min-width: 100px; border-bottom: 1px solid #000; margin-left: 10px;"></span>
                </div>
                <div style="margin-top: 15px;">
                    <div><strong>Ghi chú:</strong></div>
                    <div style="border-bottom: 1px solid #000; margin-top: 5px; min-height: 20px;"></div>
                    <div style="border-bottom: 1px solid #000; margin-top: 5px; min-height: 20px;"></div>
                </div>
            </div>
        </div>
    `;
};
