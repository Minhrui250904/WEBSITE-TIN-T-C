// THÊM CODE NÀY VÀO FILE server.js

// 1. Thêm middleware mới sau adminOnlyMiddleware (sau dòng 157):
function editorOrAdminMiddleware(req, res, next) {
  const allowedRoles = ["admin", "editor", "user"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Bạn không có quyền đăng tin" });
  }
  return next();
}

// 2. Thêm endpoint mới sau app.get("/api/news/:id") (sau dòng ~305):
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
