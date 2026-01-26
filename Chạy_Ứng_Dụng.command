#!/bin/bash
# Chuyển đến thư mục chứa ứng dụng
cd "$(dirname "$0")/lsx-manager"

# Lấy địa chỉ IP nội bộ của máy Mac
IP_ADDRESS=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "không xác định")

# Thông báo khởi động
echo "------------------------------------------------"
echo "Đang khởi động phần mềm LSX Manager - Alpha..."
echo "------------------------------------------------"
echo "Ứng dụng sẽ chạy tại:"
echo "- Máy này: http://localhost:3000"
echo "- LAN:     http://$IP_ADDRESS:3000"
echo "------------------------------------------------"
echo "Vui lòng giữ cửa sổ này mở khi sử dụng ứng dụng."
echo "------------------------------------------------"

# Chạy ứng dụng (bao gồm cả Server và Web)
npm run dev:all
