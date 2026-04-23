# Hướng dẫn sử dụng tính năng ĐĂNG TIN

## ✅ Đã hoàn thành Frontend

Tính năng đăng tin đã được thêm vào giao diện người dùng với:
- Tab "Đăng tin" ✍️ trong trang Profile
- Form đăng tin hoàn chỉnh với validation
- Liên kết với "Bảng tin của bạn"
- UI/UX đẹp với thông báo lỗi/thành công

## ⚙️ Cần cấu hình Backend

### Bước 1: Thêm middleware vào server.js

Mở file `backend/server.js` và thêm function sau **NGAY SAU** function `adminOnlyMiddleware` (khoảng dòng 157):

```javascript
function editorOrAdminMiddleware(req, res, next) {
  const allowedRoles = ["admin", "editor", "user"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Bạn không có quyền đăng tin" });
  }
  return next();
}
```

### Bước 2: Thêm endpoint mới

Thêm đoạn code sau **NGAY SAU** endpoint `app.get("/api/news/:id")` (khoảng dòng 305):

```javascript
// Endpoint cho user/editor đăng tin
app.post("/api/news/create", authMiddleware, editorOrAdminMiddleware, async (req, res) => {
  try {
    const { title, category, summary, author, image, content } = req.body;
    
    if (!title || !category || !summary) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    
    const normalizedTitle = restoreVietnameseText(title.trim());
    const normalizedCategory = restoreVietnameseText(category.trim());
    const normalizedSummary = restoreVietnameseText(summary.trim());
    const normalizedAuthor = restoreVietnameseText(author?.trim() || req.user.name);
    const normalizedContentSource = typeof content === "string" && content.trim()
      ? content.trim()
      : buildFallbackContentFromSummary(normalizedSummary);

    const newArticle = {
      id: headlines.length > 0 ? Math.max(...headlines.map(h => h.id)) + 1 : 1,
      title: normalizedTitle,
      category: normalizedCategory,
      summary: normalizedSummary,
      author: normalizedAuthor,
      publishedAt: new Date().toISOString(),
      image: normalizeImageUrl(image),
      content: restoreVietnameseText(normalizedContentSource),
      createdBy: req.user.id // Lưu ID người tạo
    };
    
    headlines.unshift(newArticle);
    res.status(201).json({ message: "Đăng tin thành công", article: newArticle });
  } catch (err) {
    res.status(500).json({ message: "Lỗi đăng tin tức" });
  }
});
```

### Bước 3: Cập nhật Frontend

Mở file `frontend/src/App.jsx`, tìm dòng (khoảng dòng 871):
```javascript
const response = await fetch("/api/admin/news", {
```

Thay bằng:
```javascript
const response = await fetch("/api/news/create", {
```

### Bước 4: Khởi động lại Backend

```bash
cd backend
node server.js
```

## 🎯 Cách sử dụng

### Đối với tất cả User đã đăng nhập:

1. Đăng nhập vào hệ thống
2. Click vào avatar → "Trang cá nhân"
3. Chọn tab "✍️ Đăng tin"
4. Điền form:
   - **Tiêu đề tin** *
   - **Danh mục** *
   - **Nội dung tóm tắt** * (tối đa 2000 ký tự)
   - Tác giả (tùy chọn, mặc định là tên user)
   - URL hình ảnh (tùy chọn)
5. Click "📤 Đăng tin"
6. Tin sẽ xuất hiện trong tab "📰 Bảng tin của bạn"

### Quyền theo Role:

- **User**: Có thể đăng tin, xem tin của mình
- **Editor**: Có thể đăng tin, xem tin của mình
- **Admin**: Có thể đăng tin, xem, sửa, xóa TẤT CẢ tin

## ✨ Tính năng

✅ Form đăng tin đầy đủ với validation  
✅ Character counter cho tiêu đề và nội dung  
✅ Preview hình ảnh khi nhập URL  
✅ Thông báo lỗi/thành công rõ ràng  
✅ Auto-set tác giả là tên user nếu không điền  
✅ Tự động chuyển sang "Bảng tin của bạn" sau khi đăng  
✅ Nút "Đặt lại" để reset form  
✅ Ghi chú hướng dẫn sử dụng  
✅ Responsive design  

## 🎨 Giao diện

- Form gradient đẹp mắt
- Nút submit màu xanh accent gradient
- Animation slide-down cho thông báo
- Preview ảnh realtime
- Validation trực quan với focus state

## 🔒 Bảo mật

- Yêu cầu đăng nhập (authMiddleware)
- Check role user/editor/admin
- Validate dữ liệu bắt buộc
- Sanitize Vietnamese text
- Fallback image nếu không nhập

## 📝 Lưu ý

- Tin đăng sẽ xuất hiện ở đầu danh sách (unshift)
- Lưu ID người tạo (createdBy) để lọc tin
- Content tự động generate nếu không nhập
- Image tự động dùng DEFAULT nếu không có

## 🐛 Troubleshooting

**Lỗi 403: "Bạn không có quyền đăng tin"**
→ Kiểm tra đã thêm middleware `editorOrAdminMiddleware` chưa

**Lỗi 404: Endpoint not found**
→ Kiểm tra đã thêm endpoint `/api/news/create` chưa

**Tin không xuất hiện trong "Bảng tin của bạn"**
→ Kiểm tra logic filter `myNewsList` trong App.jsx
