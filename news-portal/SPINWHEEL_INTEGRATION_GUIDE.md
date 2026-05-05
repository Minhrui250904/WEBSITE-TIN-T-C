# Hướng dẫn tích hợp Admin Spin Wheel Dashboard

## 1. Thêm API Endpoints vào Backend

Copy đoạn code từ `ADMIN_SPINWHEEL_API.md` và thêm vào `backend/server.js`:

**Vị trí:** Sau endpoint `PUT /api/admin/users/:id/role` hoặc trước `app.listen()`

```javascript
// ========== ADMIN SPIN WHEEL MANAGEMENT ==========
// Copy toàn bộ code từ ADMIN_SPINWHEEL_API.md
```

## 2. Import Component trong App.jsx

**Trong phần import ở đầu file App.jsx:**

```javascript
import AdminSpinWheelTab from "./components/AdminSpinWheelTab";
import "./components/AdminSpinWheelTab.css";
```

## 3. Cập nhật adminTabMeta trong App.jsx

**Tìm đoạn code:**
```javascript
const adminTabMeta = {
  users: { label: "Quản lý người dùng", shortLabel: "Người dùng", icon: "👥" },
  news: { label: "Quản lý tin tức", shortLabel: "Tin tức", icon: "📰" },
  "vip-requests": { label: "Duyệt VIP", shortLabel: "VIP", icon: "💎" },
  invoices: { label: "Quản lý hóa đơn", shortLabel: "Hóa đơn", icon: "🧾" },
  comments: { label: "Quản lý bình luận", shortLabel: "Bình luận", icon: "💬" }
};
```

**Thêm dòng mới:**
```javascript
const adminTabMeta = {
  users: { label: "Quản lý người dùng", shortLabel: "Người dùng", icon: "👥" },
  news: { label: "Quản lý tin tức", shortLabel: "Tin tức", icon: "📰" },
  "vip-requests": { label: "Duyệt VIP", shortLabel: "VIP", icon: "💎" },
  invoices: { label: "Quản lý hóa đơn", shortLabel: "Hóa đơn", icon: "🧾" },
  comments: { label: "Quản lý bình luận", shortLabel: "Bình luận", icon: "💬" },
  "spin-wheel": { label: "Quản lý xúc sắc", shortLabel: "Xúc sắc", icon: "🎲" }  // THÊM DÒNG NÀY
};
```

## 4. Cập nhật adminTabBadges

**Tìm đoạn code:**
```javascript
const adminTabBadges = {
  users: adminUsers.length,
  news: allNewsList.length,
  "vip-requests": adminVipRequests.length,
  invoices: adminInvoices.length,
  comments: allComments.length
};
```

**Thêm dòng mới:**
```javascript
const adminTabBadges = {
  users: adminUsers.length,
  news: allNewsList.length,
  "vip-requests": adminVipRequests.length,
  invoices: adminInvoices.length,
  comments: allComments.length,
  "spin-wheel": 0  // Có thể cập nhật giá trị này nếu cần
};
```

## 5. Cập nhật adminSummaryCards

**Tìm đoạn code adminSummaryCards và thêm card mới:**

```javascript
const adminSummaryCards = [
  // ... cards hiện tại ...
  {
    id: "summary-spin-wheel",
    icon: "🎲",
    label: "Mini Game Xúc Sắc",
    value: "Xem chi tiết",
    note: "Quản lý thống kê và lịch sử chơi"
  }
];
```

## 6. Render Component trong Admin Panel

**Tìm đoạn code render admin tabs (thường ở cuối hàm App hoặc JSX), thêm:**

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

## 7. Kiểm tra Backend API

Đảm bảo thêm các import cần thiết vào `backend/server.js`:
- `getAllUsers` từ usersStore.js
- `updateUserSpinWheelReward` từ usersStore.js

Các hàm này thường đã được import, nếu chưa có thì thêm:

```javascript
import {
  // ... imports hiện tại ...
  updateUserSpinWheelReward,
  // ...
} from "./usersStore.js";
```

## 8. Kiểm tra Middleware

Đảm bảo các middleware `authMiddleware` và `adminOnlyMiddleware` đã được định nghĩa trong `backend/server.js`.

## Kiểm tra lại

1. **Frontend:** Đăng nhập với tài khoản admin
2. **Vào Admin Panel:** Klik vào icon quản lý hoặc menu admin
3. **Kiểm tra tab mới:** Tab "🎲 Xúc sắc" sẽ hiển thị trong danh sách
4. **Kiểm tra 3 sub-tabs:**
   - 📊 Thống kê chung - Hiển thị stats
   - 📜 Lịch sử chơi - Hiển thị bảng lịch sử
   - ⚙️ Cấu hình - Hiển thị cấu hình hiện tại

## Các API Endpoints Available

### 1. GET `/api/admin/spin-wheel/stats`
Lấy thống kê chung:
- Tổng lượt chơi
- Tổng người chơi
- Tổng giá trị thưởng
- Phân phối giải thưởng

### 2. GET `/api/admin/spin-wheel/history?page=1&limit=20`
Lấy lịch sử chơi:
- Supports pagination
- Hiển thị user, email, prize, voucher, timestamp

### 3. GET `/api/admin/spin-wheel/config`
Lấy cấu hình:
- Danh sách giải thưởng
- Số lượt chơi tối đa
- Trạng thái bật/tắt

### 4. PUT `/api/admin/spin-wheel/reset/:userId`
Reset lượt chơi cho user:
- Đặt `spinWheel.used = false`
- Cho phép user chơi lại

## Lưu ý quan trọng

1. **Chỉ Admin mới có quyền:** Tất cả endpoint được bảo vệ bằng `adminOnlyMiddleware`
2. **Token phải hợp lệ:** Mỗi request phải kèm token Bearer hợp lệ
3. **Performance:** Khi số lượng user lớn, có thể cần optimize việc load stats

## Troubleshooting

Nếu gặp lỗi:

1. **"403 Chỉ admin mới có quyền":** Kiểm tra role của user hiện tại có phải admin không
2. **"401 Bạn chưa đăng nhập":** Token không được gửi hoặc hết hạn
3. **API not found (404):** Kiểm tra lại đã thêm endpoint vào backend chưa
4. **CORS error:** Kiểm tra lại CORS configuration trong backend

## Mở rộng trong tương lai

- Thêm biểu đồ thống kê trực quan (chart/graph)
- Quản lý giải thưởng (thêm/sửa/xóa)
- Export dữ liệu lịch sử
- Cấu hình tỷ lệ giải thưởng động
- Thiết lập thời gian reset tự động cho users
