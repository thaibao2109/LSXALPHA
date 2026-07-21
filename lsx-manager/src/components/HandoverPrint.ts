import type { LSXData, LSXItem } from '../types';

export const printHandoverMinutes = (order: LSXData, handoverItems: { item: LSXItem, quantity: number | '' }[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Vui lòng cho phép popup để in phiếu');
        return;
    }

    const contentHTML = generateHandoverHTML(order, handoverItems);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Biên Bản Bàn Giao</title>
            <style>
                @media print {
                    @page {
                        size: A5 landscape;
                        margin: 10mm; 
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
                    line-height: 1.3;
                }
                .container {
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .title {
                    font-size: 20pt;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .meta-info {
                    margin-bottom: 20px;
                }
                .meta-row {
                    display: flex;
                    margin-bottom: 8px;
                }
                .meta-label {
                    font-weight: bold;
                    width: 120px;
                }
                .watermark {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60%;
                    opacity: 0.03;
                    z-index: 0;
                    pointer-events: none;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 30px;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    vertical-align: middle;
                    font-size: 11pt;
                }
                th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                }
                .footer {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                    padding: 0 40px;
                }
                .signature-block {
                    text-align: center;
                    width: 200px;
                }
                .signature-title {
                    font-weight: bold;
                    margin-bottom: 60px;
                    text-transform: uppercase;
                }
            </style>
        </head>
        <body>
            <div class="container">
                ${contentHTML}
            </div>
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

const generateHandoverHTML = (order: LSXData, handoverItems: { item: LSXItem, quantity: number | '' }[]): string => {
    return `
        <img src="${window.location.origin}${import.meta.env.BASE_URL}logo-alpha.png" class="watermark" />
        <div class="header">
            <div class="title">BIÊN BẢN BÀN GIAO BÁN THÀNH PHẨM</div>
            <div style="font-style: italic;">Ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
        </div>

        <div class="meta-info">
            <div class="meta-row">
                <span class="meta-label">Khách hàng:</span>
                <span>${order.meta.khachHang}</span>
            </div>
             <div class="meta-row" style="align-items: center;">
                <span class="meta-label">Đơn hàng số:</span>
                <span style="font-size: 24pt; font-weight: bold;">${order.meta.donHangSo}</span>
            </div>
              <div class="meta-row">
                <span class="meta-label">Phiếu xuất:</span>
                <span>${order.meta.phieuXuat}</span>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th rowspan="2" style="width: 50px;">STT</th>
                    <th rowspan="2">Tên sản phẩm</th>
                    <th rowspan="2" style="width: 150px;">Kích thước / Quy cách</th>
                    <th rowspan="2" style="width: 100px;">Lớp mạ/Bề mặt</th>
                    <th colspan="2" style="width: 160px;">Số lượng</th>
                    <th rowspan="2" style="width: 100px;">QC Kiểm tra</th>
                </tr>
                <tr>
                    <th style="width: 80px;">Đơn hàng</th>
                    <th style="width: 80px;">Thực tế</th>
                </tr>
            </thead>
            <tbody>
                ${handoverItems.map(({item, quantity}, index) => `
                    <tr>
                        <td style="text-align: center;">${index + 1}</td>
                        <td>
                            <strong>${item.tenHangHoa}</strong>
                        </td>
                        <td style="text-align: center;">${item.quyCach}</td>
                        <td style="text-align: center;">${item.beMat || ''}</td>
                        <td style="text-align: center;">
                            <strong>${item.slYeuCau}</strong> ${item.donVi}
                        </td>
                        <td style="text-align: center;">
                            <strong>${quantity === '' ? '' : quantity}</strong> ${quantity === '' ? '' : item.donVi}
                        </td>
                        <td></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            <div class="signature-block">
                <div class="signature-title">Người giao</div>
            </div>
            <div class="signature-block">
                <div class="signature-title">Người nhận</div>
            </div>
        </div>
    `;
};
