# Hướng dẫn cấu hình gửi email Gmail

## Bước 1: Tạo App Password cho Gmail

Gmail không cho phép dùng mật khẩu thông thường để gửi email qua SMTP. Bạn cần tạo **App Password**.

### Các bước tạo App Password:

1. Truy cập: https://myaccount.google.com/apppasswords
2. Đăng nhập bằng tài khoản Gmail: `phanthechung9a3nct@gmail.com`
3. Nhập tên ứng dụng: `News Portal Backend`
4. Click **Create**
5. Gmail sẽ tạo mật khẩu 16 ký tự (dạng: `xxxx xxxx xxxx xxxx`)
6. **Copy mật khẩu này** (bỏ dấu cách)

**Lưu ý**: Nếu không thấy trang App Passwords, bạn cần bật **2-Step Verification** trước:
- Truy cập: https://myaccount.google.com/security
- Bật **2-Step Verification**
- Sau đó mới tạo được App Password

## Bước 2: Cập nhật file .env

Mở file `backend/.env` và thay thế:

```env
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD_HERE
```

Thành:

```env
SMTP_PASS=abcdefghijklmnop
```

(Thay `abcdefghijklmnop` bằng App Password 16 ký tự vừa copy, **bỏ hết dấu cách**)

## Bước 3: Khởi động lại Backend

```bash
cd backend
npm run dev
```

## Bước 4: Test gửi email

1. Mở frontend: http://localhost:5173
2. Đăng nhập tài khoản user (không phải admin)
3. Click vào avatar → **Nâng cấp VIP**
4. Chọn gói Silver/Gold/Platinum
5. Quét QR code/nhập thông tin chuyển khoản
6. Click **Gửi xác nhận thanh toán**

Sau đó, email sẽ được gửi đến: `phanthechung9a3nct@gmail.com`

## Kiểm tra email đã gửi

Vào hộp thư `phanthechung9a3nct@gmail.com`, bạn sẽ thấy email với:
- Tiêu đề: `[News Portal] Yêu cầu nâng cấp VIP Bac/Vang/Bach kim`
- Nội dung: Thông tin user, gói đăng ký, số tiền
- 2 nút: **Duyệt nâng cấp VIP** và **Từ chối**

Click **Duyệt nâng cấp VIP** để nâng tài khoản user lên VIP thật.

## Xử lý lỗi thường gặp

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"
- **Nguyên nhân**: Chưa dùng App Password hoặc App Password sai
- **Giải pháp**: Tạo lại App Password và cập nhật file .env

### Lỗi: "SMTP is not configured"
- **Nguyên nhân**: File .env chưa có hoặc thiếu biến SMTP_USER/SMTP_PASS
- **Giải pháp**: Kiểm tra file .env có đầy đủ các biến SMTP_*

### Email không nhận được
- Kiểm tra thư mục **Spam** trong Gmail
- Kiểm tra terminal backend có lỗi gì không
- Thử gửi lại yêu cầu VIP từ frontend

## Cấu hình nâng cao (tùy chọn)

### Đổi email người nhận
Sửa trong `backend/.env`:
```env
VIP_APPROVAL_EMAIL=email_khac@gmail.com
```

### Đổi email người gửi
```env
SMTP_USER=email_gui@gmail.com
SMTP_PASS=app_password_cua_email_gui
MAIL_FROM=Tên hiển thị <email_gui@gmail.com>
```

### Deploy lên server thật
Cập nhật `PUBLIC_API_URL` trong `.env`:
```env
PUBLIC_API_URL=https://your-domain.com
```

Link duyệt/từ chối trong email sẽ dùng domain này.
