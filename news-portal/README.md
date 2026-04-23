# News Portal (Node.js + React)

Dự án gồm 2 phần:

- `backend`: API tin tức bằng Node.js + Express
- `frontend`: Trang chủ website tin tức bằng React + Vite

## Tài khoản Admin mặc định

Khi khởi động backend lần đầu, hệ thống tự động tạo tài khoản admin:

- **Email**: `admin@gmail.com`
- **Mật khẩu**: `12345678`

**Quyền của Admin:**
- Xem danh sách tất cả người dùng
- Xóa người dùng (trừ chính mình)
- Thay đổi role của người dùng (user/editor/admin)
- Tạo tin tức mới
- Chỉnh sửa tin tức
- Xóa tin tức

## 1. Chạy backend

### Cấu hình cho backend

1. Trong thư mục `backend`, tạo file `.env` từ mẫu `.env.example`.
2. Chỉnh sửa thông tin trong `.env` (tùy chọn):

```env
PORT=5000
JWT_SECRET=replace_with_a_strong_secret_key
VIP_APPROVAL_EMAIL=phanthechung9a3nct@gmail.com
PUBLIC_API_URL=http://localhost:5000
VIP_APPROVAL_TOKEN_SECRET=replace_with_another_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
MAIL_FROM=News Portal <your_gmail@gmail.com>

# AI provider config (OpenAI | Azure OpenAI | Gemini)
AI_PROVIDER=auto
AI_REQUEST_TIMEOUT_MS=30000

# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=your_deployment_name
AZURE_OPENAI_API_VERSION=2024-08-01-preview

# Gemini
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash
```

**Lưu ý:** Backend sử dụng file storage (users.json) thay vì MySQL, không cần cài MySQL.

```bash
cd backend
npm install
npm run dev
```

Backend mặc định chạy ở `http://localhost:5000`.

## 2. Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy ở `http://localhost:5173`.

## API chính

**Public APIs:**
- `GET /api/health` - Kiểm tra trạng thái server
- `GET /api/news` - Lấy danh sách tin tức (có phân trang, lọc theo category)
- `POST /api/ai/chat` - Chat với LLM thật qua backend proxy (OpenAI/Azure/Gemini)
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại (cần token)
- `POST /api/auth/vip-payment-request` - Gửi yêu cầu nâng VIP và email duyệt tới quản trị
- `GET /api/vip-payment/decision?token=...` - Link duyệt/từ chối yêu cầu VIP từ email

**Admin APIs (yêu cầu token với role admin):**
- `GET /api/admin/users` - Lấy danh sách tất cả người dùng
- `DELETE /api/admin/users/:id` - Xóa người dùng
- `PUT /api/admin/users/:id/role` - Thay đổi role của người dùng
- `POST /api/admin/news` - Tạo tin tức mới
- `PUT /api/admin/news/:id` - Cập nhật tin tức
- `DELETE /api/admin/news/:id` - Xóa tin tức

Frontend đã được cấu hình proxy `/api` sang backend trong `frontend/vite.config.js`.

## Cấu hình AI Chatbox với LLM thật

Chatbox AI ở trang chủ đã được nối qua backend endpoint `/api/ai/chat` để bảo vệ API key.

Thiết lập nhanh:

1. Mở `backend/.env`.
2. Chọn provider bằng `AI_PROVIDER`:
   - `openai`: dùng OpenAI
   - `azure`: dùng Azure OpenAI
   - `gemini`: dùng Gemini
   - `auto`: tự chọn theo key có sẵn (ưu tiên OpenAI -> Azure -> Gemini)
3. Điền key tương ứng cho provider đã chọn.
4. Khởi động lại backend: `npm run dev`.

Nếu chưa cấu hình key, chatbox vẫn hoạt động ở chế độ fallback nội bộ (không gọi LLM thật).

## Hướng dẫn sử dụng Admin Panel

1. Đăng nhập bằng tài khoản admin (thông tin ở trên)
2. Sau khi đăng nhập, click nút **"Quản trị"** trên header
3. Trong Admin Panel có 2 tab:
   - **Quản lý người dùng**: Xem, xóa và thay đổi role của users
   - **Quản lý tin tức**: Tạo, sửa tin tức mới
4. Khi xem danh sách tin, admin sẽ thấy nút **"Sửa"** và **"Xóa"** trên mỗi tin
