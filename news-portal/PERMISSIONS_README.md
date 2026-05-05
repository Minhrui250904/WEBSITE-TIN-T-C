# Hệ thống Phân quyền Quản trị

## Tổng quan

Hệ thống phân quyền đã được nâng cấp từ mô hình binary (chỉ admin/không phải admin) sang mô hình role-based access control (RBAC) chi tiết với 4 cấp độ quyền.

## Các Role và Quyền

### 1. User (Người dùng)
**Quyền cơ bản:**
- Đọc bài viết, bình luận
- Quản lý profile cá nhân
- Chơi mini game xúc sắc
- Yêu cầu nâng cấp VIP
- Xem lịch sử thanh toán

### 2. Editor (Biên tập viên)
**Quyền của User +:**
- Tạo bài viết mới
- Chỉnh sửa/xóa bài viết của chính mình

### 3. Moderator (Điều hành viên)
**Quyền của Editor +:**
- Xem tất cả bài viết (bao gồm chưa xuất bản)
- Kiểm duyệt bài viết (duyệt/từ chối)
- Xem danh sách người dùng
- Xem danh sách yêu cầu VIP

### 4. Admin (Quản trị viên)
**Quyền đầy đủ:**
- Quản lý người dùng (CRUD, thay đổi role)
- Quản lý bài viết (tất cả)
- Quản lý giải thưởng mini game
- Quản lý cấu hình mini game
- Duyệt yêu cầu VIP
- Xem hóa đơn thanh toán
- Xem lịch sử chơi mini game
- Reset lượt chơi cho người dùng

## API Endpoints và Quyền Yêu cầu

### Quản lý Người dùng
- `GET /api/admin/users` → `manage:users`
- `DELETE /api/admin/users/:id` → `manage:users`
- `PUT /api/admin/users/:id/role` → `manage:roles`

### Quản lý Bài viết
- `POST /api/admin/news` → `create:articles`
- `GET /api/admin/news` → `read:all-articles`
- `PUT /api/admin/news/:id` → `update:own-articles` hoặc `manage:articles`
- `DELETE /api/admin/news/:id` → `delete:own-articles` hoặc `manage:articles`

### Quản lý VIP
- `GET /api/admin/vip-requests` → `read:vip-requests`
- `PUT /api/admin/vip-requests/:requestId/decision` → `approve:vip-requests`

### Quản lý Mini Game
- `GET/POST/PUT/DELETE /api/admin/spin-wheel/prizes` → `manage:prizes`
- `GET /api/admin/spin-wheel/stats` → `read:spin-history`
- `GET /api/admin/spin-wheel/history` → `read:spin-history`
- `GET /api/admin/spin-wheel/config` → `manage:spinwheel`
- `PUT /api/admin/spin-wheel/reset/:userId` → `reset:spins`

### Quản lý Hóa đơn
- `GET /api/admin/invoices` → `read:invoices`

## Quy tắc Kiểm tra Quyền Sở hữu

Đối với các tài nguyên có sở hữu (như bài viết), hệ thống kiểm tra:
- **Admin**: Có thể thao tác tất cả
- **Editor/Moderator**: Chỉ có thể thao tác tài nguyên của chính mình

## Giao diện Quản trị

### Tab "Quản lý người dùng"
- Xem danh sách tất cả người dùng
- Thay đổi role của người dùng (không thể tự thay đổi role cho chính mình)
- Xóa người dùng (không thể xóa chính mình)
- Hiển thị thông tin: tên, email, role, ngày tạo

## Lưu ý Bảo mật

1. **Không thể tự thay đổi role**: Người dùng không thể thay đổi role cho chính mình
2. **Không thể tự xóa**: Người dùng không thể xóa tài khoản của chính mình
3. **Kiểm tra sở hữu**: Chỉ admin mới có thể thao tác tài nguyên của người khác
4. **Audit logging**: Tất cả thay đổi role được ghi log (có thể mở rộng trong tương lai)

## Mở rộng trong Tương lai

- Thêm audit logging chi tiết
- Phân quyền theo nhóm/tổ chức
- Quyền tạm thời (temporary permissions)
- Approval workflow cho thay đổi role quan trọng