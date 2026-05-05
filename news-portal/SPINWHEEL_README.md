# 🎲 Admin Spin Wheel Management - Hướng dẫn nhanh

## Tính năng

Bạn đã tạo admin dashboard hoàn chỉnh để quản lý mini game xúc sắc với 4 chức năng chính:

### ✅ 1. **Thống kê chung** (📊 Tab)
- Tổng lượt chơi toàn hệ thống
- Số lượng người chơi
- Phân phối giải thưởng (50% VIP, Free VIP Silver, Lucky, 5% VIP)
- Tỷ lệ chơi (% người chơi đã sử dụng)
- Tổng giá trị thưởng đã phát hành

### ✅ 2. **Quản lý giải thưởng** (⚙️ Tab)
- Xem danh sách 4 giải thưởng khác nhau
- Chi tiết mỗi giải thưởng (mã, tên, % giảm)
- Cấu hình bật/tắt mini game
- Số lượt chơi tối đa per user (hiện là 1)

### ✅ 3. **Lịch sử chơi** (📜 Tab)
- Bảng lịch sử chi tiết ai đã chơi
- Thông tin: User name, email, giải thưởng, voucher %
- Thời gian chơi (dạng locale)
- **Reset lượt chơi** cho mỗi user
- Phân trang (20 items/trang)

### ✅ 4. **Thiết lập cấu hình** (⚙️ Tab)
- Xem cấu hình hiện tại
- Danh sách giải thưởng
- Trạng thái hệ thống
- Lưu ý về quy trình cập nhật

## 📁 Các file tạo

```
frontend/src/components/
├── AdminSpinWheelTab.jsx       # Component chính
└── AdminSpinWheelTab.css       # Styles

Backend:
├── ADMIN_SPINWHEEL_API.md      # Code endpoints (copy vào server.js)
└── SPINWHEEL_INTEGRATION_GUIDE.md # Hướng dẫn tích hợp
```

## 🚀 Cách cài đặt (nhanh)

### Step 1: Backend - Thêm API Endpoints

1. Mở `backend/server.js`
2. Tìm dòng có `app.post("/api/auth/spin-wheel/spin", ...)`
3. **Sau endpoint này**, thêm toàn bộ code từ `ADMIN_SPINWHEEL_API.md`

**Bao gồm 4 endpoints:**
- `GET /api/admin/spin-wheel/stats` - Thống kê
- `GET /api/admin/spin-wheel/history` - Lịch sử  
- `GET /api/admin/spin-wheel/config` - Cấu hình
- `PUT /api/admin/spin-wheel/reset/:userId` - Reset

### Step 2: Frontend - Import Component

1. Mở `frontend/src/App.jsx`
2. **Ở đầu file**, thêm 2 dòng import:
```javascript
import AdminSpinWheelTab from "./components/AdminSpinWheelTab";
import "./components/AdminSpinWheelTab.css";
```

3. **Tìm `const adminTabMeta = {...}`**, thêm:
```javascript
"spin-wheel": { label: "Quản lý xúc sắc", shortLabel: "Xúc sắc", icon: "🎲" }
```

4. **Tìm render admin tabs** (cuối hàm App), thêm:
```javascript
{adminTab === "spin-wheel" && (
  <AdminSpinWheelTab
    authUser={authUser}
    adminLoading={adminLoading}
    setAdminLoading={setAdminLoading}
    adminError={adminError}
    setAdminError={setAdminError}
    adminSuccess={adminSuccess}
    setAdminSuccess={setAdminSuccess}
  />
)}
```

### Step 3: Kiểm tra

1. **Restart backend:** `npm start` hoặc `npm run dev`
2. **Restart frontend:** `npm run dev`
3. **Đăng nhập admin** → Vào Admin Panel
4. **Klikk tab "🎲 Xúc sắc"** → Xem dữ liệu

## 📊 API Response Examples

### Thống kê
```json
{
  "stats": {
    "totalSpins": 5,
    "totalPlayers": 10,
    "totalRewardValue": 120,
    "spinRate": 50,
    "prizeStats": {
      "vip_discount_50": { "label": "Giảm 50%", "count": 1 },
      "free_vip_silver": { "label": "Free VIP Silver", "count": 2 },
      "lucky_next_time": { "label": "May mắn lần sau", "count": 1 },
      "vip_discount_5": { "label": "Giảm 5%", "count": 1 }
    }
  }
}
```

### Lịch sử
```json
{
  "history": [
    {
      "userId": 2,
      "userName": "chung1",
      "userEmail": "chung123@gmail.com",
      "prizeCode": "free_vip_silver",
      "prizeLabel": "Free VIP Bạc",
      "spunAt": "2026-05-03T10:30:00Z",
      "hasDiscount": true,
      "discountPercent": 50
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

## 🎯 Chức năng chi tiết

### Thống kê chung
- **Thẻ thống kê:** 4 card hiển thị metrics chính
- **Bảng phân phối:** Chi tiết số lượt mỗi giải thưởng
- **Đa màu sắc:** Gradient purple/blue UI

### Lịch sử chơi
- **Bảng dữ liệu:** Danh sách user chơi + kết quả
- **Reset button:** Cho phép reset từng user
- **Phân trang:** Tự động load 20 items
- **Responsive:** Mobile-friendly table

### Cấu hình
- **Danh sách giải:** 4 giải thưởng với chi tiết
- **Thông tin hệ thống:** Số lượt, trạng thái
- **Ghi chú:** Hướng dẫn cập nhật cấu hình

## ⚙️ Yêu cầu

- ✅ Admin role để truy cập
- ✅ Valid JWT token  
- ✅ Backend đã cài đặt API endpoints
- ✅ Frontend đã import component

## 🔧 Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|----------|
| 403 Forbidden | Không phải admin | Login lại với admin account |
| 404 Not Found | API endpoint chưa thêm | Kiểm tra backend server.js |
| Empty data | Chưa có user chơi | Test spin wheel trước |
| CORS error | Backend config | Kiểm tra CORS settings |

## 📝 Notes

- Component sử dụng **localStorage** để lưu token
- Tự động refresh data khi chuyển tab
- Có loading state và error handling
- Mobile responsive design
- Pagination hỗ trợ unlimited users

## 🚀 Mở rộng trong tương lai

- [ ] Export lịch sử sang CSV/Excel
- [ ] Biểu đồ thống kê (Chart.js)
- [ ] Quản lý giải thưởng động (add/edit/delete)
- [ ] Cấu hình tỷ lệ giải thưởng
- [ ] Lên lịch reset tự động
- [ ] Xem chi tiết từng user
- [ ] Khôi phục lịch sử đã xóa

---

**Tạo bởi:** AI Assistant  
**Ngày:** May 3, 2026  
**Status:** ✅ Sẵn sàng sử dụng
