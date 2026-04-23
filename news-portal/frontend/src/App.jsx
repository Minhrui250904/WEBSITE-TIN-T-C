import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpinWheel from "./components/SpinWheel";
import ChatBubble from "./components/ChatBubble";

const TOKEN_KEY = "news_portal_token";
const COMMENTS_STORAGE_KEY = "news_portal_comments";
const READ_HISTORY_STORAGE_KEY = "news_portal_read_history";
const SAVED_ARTICLES_STORAGE_KEY = "news_portal_saved_articles";
const LIKED_ARTICLES_STORAGE_KEY = "news_portal_liked_articles";
const VIEW_COUNTS_STORAGE_KEY = "news_portal_view_counts";
const AI_CHAT_STORAGE_KEY_PREFIX = "news_portal_ai_chat_history";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const AVATAR_DATA_URL_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/;
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_AVATAR_LENGTH = 3 * 1024 * 1024;
const REGISTER_ROLES = new Set(["user", "editor"]);

const MENU_PAGES = {
  "Trang chủ": {
    title: "Trang chủ",
    description: "Tổng hợp toàn bộ tin tức nổi bật trong ngày."
  },
  "Mới nhất": {
    title: "Dòng tin mới cập nhật liên tục",
    description:
      "Mục Mới nhất ưu tiên tốc độ cập nhật, hiển thị các bài viết vừa đăng theo thứ tự thời gian. Phù hợp khi bạn muốn nắm bắt diễn biến mới nhất của thị trường và xã hội.",
    sections: [
      "Tin nóng trong 1 giờ gần đây",
      "Tổng hợp sự kiện được quan tâm nhiều nhất",
      "Đề xuất đọc nhanh trong 5 phút"
    ]
  },
  Video: {
    title: "Nội dung tin tức bằng hình ảnh",
    description:
      "Cung cấp các bản tin video ngắn và phóng sự tổng hợp để bạn tiếp cận thông tin trực quan hơn. Định dạng video giúp giải thích vấn đề phức tạp dễ hiểu hơn.",
    sections: ["Bản tin 60 giây", "Video giải thích", "Phóng sự hiện trường"]
  },
  Podcast: {
    title: "Nghe tin tức mọi lúc mọi nơi",
    description:
      "Chuỗi podcast phân tích sâu về các chủ đề được quan tâm như tài chính, việc làm, giáo dục và công nghệ. Bạn có thể nghe khi di chuyển, làm việc hoặc thư giãn.",
    sections: ["Điểm tin sáng", "Phân tích cuối ngày", "Góc nhìn chuyên gia"]
  },
  "Dữ liệu": {
    title: "Thông tin được trình bày bằng số liệu",
    description:
      "Tập trung vào các bài viết data-driven, sử dụng biểu đồ và bộ số liệu để làm rõ xu hướng. Giúp người đọc có góc nhìn khách quan dựa trên thống kê thực tế.",
    sections: ["Báo cáo theo tháng", "Đồ thị so sánh", "Phân tích xu hướng"]
  },
  "Liên hệ": {
    title: "Kênh kết nối với tòa soạn",
    description:
      "Nơi tiếp nhận ý kiến đóng góp, đề xuất chủ đề và thông tin hợp tác nội dung. Bạn có thể gửi phản hồi để giúp chúng tôi nâng cao chất lượng thông tin.",
    sections: ["Gửi góp ý", "Đề xuất chủ đề", "Thông tin hợp tác"]
  }
};

const SHORT_VIDEO_ITEMS = [
  {
    id: "v1",
    title: "Bản tin 60s: Công nghệ AI trong giáo dục",
    duration: "01:08",
    description: "Tổng hợp nhanh 3 ứng dụng AI đang được trường học triển khai trong học kỳ này.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    type: "youtube",
    embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U"
  },
  {
    id: "v2",
    title: "Thị trường hôm nay: Cổ phiếu và dòng tiền ngắn hạn",
    duration: "01:22",
    description: "Cập nhật diễn biến chính của thị trường và nhóm ngành thu hút dòng tiền mạnh.",
    thumbnail: "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=900&q=80",
    type: "youtube",
    embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ"
  },
  {
    id: "v3",
    title: "Nhịp sống đô thị: 3 thay đổi đáng chú ý",
    duration: "00:54",
    description: "Góc nhìn nhanh về giao thông, dịch vụ công và nhu cầu nhà ở tại khu vực trung tâm.",
    thumbnail: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80",
    type: "mp4",
    mediaUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
  }
];

const SHORT_PODCAST_ITEMS = [
  {
    id: "p1",
    title: "Điểm tin sáng: 5 sự kiện cần biết",
    duration: "03:40",
    host: "Host: Minh Châu",
    description: "Bản tóm tắt âm thanh ngắn gọn để bắt nhịp ngày mới trong 4 phút.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "p2",
    title: "Tài chính cá nhân: Quản lý chi tiêu tuần",
    duration: "04:25",
    host: "Host: Thanh Tùng",
    description: "Gợi ý cách chia ngân sách 50-30-20 và 2 mẹo giảm chi phí cố định.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "p3",
    title: "Công nghệ dễ hiểu: AI agent là gì?",
    duration: "05:10",
    host: "Host: Lan Anh",
    description: "Giải thích ngắn gọn về AI agent và ví dụ áp dụng trong công việc hằng ngày.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

const DATA_INSIGHT_SECTIONS = [
  {
    id: "monthly-report",
    title: "Báo cáo theo tháng",
    summary:
      "Theo dõi tốc độ tăng trưởng, mức độ quan tâm của độc giả và tỷ lệ hoàn thành kế hoạch nội dung theo từng tháng.",
    lastUpdated: "07/03/2026 - 09:30",
    metrics: [
      { label: "Bài viết xuất bản", value: "1,248", delta: "+12.4% so với tháng trước" },
      { label: "Lượt đọc trung bình", value: "186K", delta: "+8.1% MoM" },
      { label: "Tỷ lệ đọc hết bài", value: "63.7%", delta: "+2.9 điểm" }
    ]
  },
  {
    id: "comparison-chart",
    title: "Đồ thị so sánh",
    summary:
      "So sánh hiệu quả giữa các chuyên mục để xác định nhóm nội dung dẫn đầu và khu vực cần tối ưu trong quý hiện tại.",
    lastUpdated: "07/03/2026 - 10:15",
    metrics: [
      { label: "Công nghệ vs Kinh doanh", value: "+18.6%", delta: "Công nghệ cao hơn về lượng truy cập" },
      { label: "Video completion rate", value: "71.2%", delta: "+6.5 điểm so với Q4" },
      { label: "Podcast retention 7 ngày", value: "54.9%", delta: "+4.2 điểm" }
    ]
  },
  {
    id: "trend-analysis",
    title: "Phân tích xu hướng",
    summary:
      "Tổng hợp tín hiệu từ hành vi người đọc để dự báo chủ đề tăng trưởng nhanh, giúp ưu tiên nguồn lực sản xuất nội dung.",
    lastUpdated: "07/03/2026 - 11:00",
    metrics: [
      { label: "Từ khóa tăng nhanh", value: "42", delta: "+15 từ khóa trong 30 ngày" },
      { label: "Lượt tìm kiếm nội bộ", value: "93K", delta: "+21.3% WoW" },
      { label: "Chủ đề tăng mạnh nhất", value: "AI ứng dụng", delta: "Tăng 2.4 lần trong 4 tuần" }
    ]
  }
];

const DEFAULT_QUICK_INFO_WIDGETS = [
  { id: "gold", label: "Vàng SJC", value: "91.20 tr/lượng", trend: "+0.35%", trendUp: true, icon: "🪙" },
  { id: "coffee", label: "Cà phê Tây Nguyên", value: "128.500 đ/kg", trend: "+1.10%", trendUp: true, icon: "☕" },
  { id: "usd", label: "USD/VND", value: "25.470", trend: "-0.08%", trendUp: false, icon: "💵" },
  { id: "weather", label: "Thời tiết Đà Nẵng", value: "21°C | Nhiều mây", trend: "Mưa nhẹ chiều", trendUp: null, icon: "🌤️" },
  { id: "oil", label: "Dầu Brent", value: "82.6 USD/thùng", trend: "+0.42%", trendUp: true, icon: "🛢️" },
  { id: "aqi", label: "AQI trung tâm", value: "64 - Trung bình", trend: "Theo dõi ngoài trời", trendUp: null, icon: "🌿" }
];

const DEFAULT_QUICK_INFO_DETAILS = {
  gold: { rows: [{ label: "Nguồn", value: "Đang đồng bộ dữ liệu" }] },
  coffee: { rows: [{ label: "Nguồn", value: "Đang đồng bộ dữ liệu" }] },
  usd: { rows: [{ label: "Nguồn", value: "Đang đồng bộ dữ liệu" }] },
  weather: { rows: [{ label: "Nguồn", value: "Đang đồng bộ dữ liệu" }] },
  oil: { rows: [{ label: "Nguồn", value: "Đang đồng bộ dữ liệu" }] },
  aqi: { rows: [{ label: "Nguồn", value: "Đang đồng bộ dữ liệu" }] }
};

const MAX_IMAGE_FILES = 5;
const MAX_VIDEO_FILES = 2;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 200;
const AUTH_MODES = {
  LOGIN: "login",
  REGISTER: "register",
  FORGOT: "forgot",
  RESET: "reset"
};

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatCurrency(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return "0 đ";
  }

  return `${numericValue.toLocaleString("vi-VN")} đ`;
}

const VIP_PRICE_BY_STATUS = {
  free: 0,
  silver: 99000,
  gold: 199000,
  platinum: 299000
};

function getVipPackagePrice(status) {
  const key = String(status || "free").trim().toLowerCase();
  return VIP_PRICE_BY_STATUS[key] || 0;
}

function getVipPackageName(status) {
  if (status === "silver") return "Bạc";
  if (status === "gold") return "Vàng";
  if (status === "platinum") return "Bạch kim";
  return "Miễn phí";
}

function getVipUpgradeCharge(currentStatus, targetStatus) {
  const currentPrice = getVipPackagePrice(currentStatus);
  const targetPrice = getVipPackagePrice(targetStatus);
  return Math.max(0, targetPrice - currentPrice);
}

function getVipDiscountPercent(user) {
  const rawPercent = Number(user?.vipDiscount?.percent || 0);
  const isUsed = Boolean(user?.vipDiscount?.used);
  if (isUsed || !Number.isFinite(rawPercent)) {
    return 0;
  }
  return Math.max(0, Math.min(100, rawPercent));
}

function applyVipDiscount(amount, discountPercent) {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const safePercent = Number.isFinite(Number(discountPercent)) ? Number(discountPercent) : 0;
  return Math.max(0, Math.round(safeAmount * (1 - safePercent / 100)));
}

function getVipUpgradeChargeWithDiscount(currentStatus, targetStatus, discountPercent) {
  const baseCharge = getVipUpgradeCharge(currentStatus, targetStatus);
  if (baseCharge <= 0) {
    return { baseCharge: 0, discountedCharge: 0, appliedPercent: 0 };
  }

  const appliedPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const discountedCharge = applyVipDiscount(baseCharge, appliedPercent);

  return {
    baseCharge,
    discountedCharge,
    appliedPercent: discountedCharge < baseCharge ? appliedPercent : 0
  };
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function tokenizeNormalizedText(value) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function buildCategoryPreferenceMap(readHistory, savedArticles, likedArticles) {
  const preferences = new Map();

  function addCategory(category, scoreWeight) {
    const categoryLabel = String(category || "").trim();
    const categoryKey = normalizeSearchText(categoryLabel);
    if (!categoryKey) return;

    const previous = preferences.get(categoryKey) || { label: categoryLabel, score: 0 };
    preferences.set(categoryKey, {
      label: previous.label || categoryLabel,
      score: previous.score + scoreWeight
    });
  }

  readHistory.forEach((item) => addCategory(item.category, 1));
  savedArticles.forEach((item) => addCategory(item.category, 2));
  likedArticles.forEach((item) => addCategory(item.category, 3));

  return preferences;
}

function rankArticlesForPersonalization(articles, categoryPreferenceMap, viewCounts) {
  return articles
    .map((article) => {
      const categoryKey = normalizeSearchText(article.category);
      const categoryScore = categoryPreferenceMap.get(categoryKey)?.score || 0;
      const viewScore = Math.log10((viewCounts[article.id] || 0) + 1);
      const publishedTime = new Date(article.publishedAt || Date.now()).getTime();
      const daysAgo = Math.max(0, (Date.now() - publishedTime) / (1000 * 60 * 60 * 24));
      const freshnessScore = Math.max(0, 2 - daysAgo * 0.1);
      const score = categoryScore * 2.5 + viewScore + freshnessScore;

      return { ...article, personalizationScore: score };
    })
    .filter((article) => article.personalizationScore > 0)
    .sort((a, b) => b.personalizationScore - a.personalizationScore);
}

function smartSearchArticles(articles, query, preferredCategoryKeys, viewCounts) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const queryTokens = tokenizeNormalizedText(query);

  return articles
    .map((article) => {
      const title = String(article.title || "");
      const summary = String(article.summary || "");
      const category = String(article.category || "");

      const normalizedTitle = normalizeSearchText(title);
      const normalizedSummary = normalizeSearchText(summary);
      const normalizedCategory = normalizeSearchText(category);

      let score = 0;

      if (normalizedTitle.includes(normalizedQuery)) score += 8;
      if (normalizedSummary.includes(normalizedQuery)) score += 5;
      if (normalizedCategory.includes(normalizedQuery)) score += 6;

      queryTokens.forEach((token) => {
        if (normalizedTitle.includes(token)) score += 2;
        if (normalizedSummary.includes(token)) score += 1;
      });

      if (preferredCategoryKeys.has(normalizedCategory)) {
        score += 2;
      }

      score += Math.min(2.5, Math.log10((viewCounts[article.id] || 0) + 1));

      return { ...article, smartSearchScore: score };
    })
    .filter((item) => item.smartSearchScore > 0)
    .sort((a, b) => b.smartSearchScore - a.smartSearchScore);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(text, query) {
  const sourceText = typeof text === "string" ? text : "";
  const keyword = String(query || "").trim();
  if (!keyword) return sourceText;

  const escapedKeyword = escapeRegex(keyword);
  if (!escapedKeyword) return sourceText;

  const pattern = new RegExp(`(${escapedKeyword})`, "ig");
  const parts = sourceText.split(pattern);

  return parts.map((part, index) => {
    if (part.toLowerCase() === keyword.toLowerCase()) {
      return <mark key={`hl-${index}`}>{part}</mark>;
    }
    return <span key={`txt-${index}`}>{part}</span>;
  });
}

const TEXT_REPLACEMENTS = [
  ["Cong nghe", "Công nghệ"],
  ["The thao", "Thể thao"],
  ["Giai tri", "Giải trí"],
  ["Giao duc", "Giáo dục"],
  ["Viet Nam", "Việt Nam"],
  ["Thi truong", "Thị trường"],
  ["Doi tuyen", "Đội tuyển"],
  ["Lien hoan", "Liên hoan"],
  ["Dai hoc", "Đại học"],
  ["Nguoi dung", "Người dùng"],
  ["Nhom nghien cuu", "Nhóm nghiên cứu"],
  ["Chinh sach", "Chính sách"],
  ["He sinh thai", "Hệ sinh thái"],
  ["Nang cap", "Nâng cấp"],
  ["chuyen doi so", "chuyển đổi số"],
  ["ghi nhan bien dong moi", "ghi nhận biến động mới"],
  ["canh bao rui ro ngan han", "cảnh báo rủi ro ngắn hạn"],
  ["thu hut dau tu chat luong cao", "thu hút đầu tư chất lượng cao"],
  ["Giai phap moi cho bai toan nhan luc", "Giải pháp mới cho bài toán nhân lực"],
  ["ket qua dang chu y", "kết quả đáng chú ý"],
  ["tang manh trong quy dau nam", "tăng mạnh trong quý đầu năm"],
  ["tac dong den nhieu linh vuc", "tác động đến nhiều lĩnh vực"],
  ["khoi nghiep tiep tuc mo rong", "khởi nghiệp tiếp tục mở rộng"],
  ["de toi uu van hanh", "để tối ưu vận hành"],
  ["Ban huan luyen", "Ban huấn luyện"],
  ["cau thu", "cầu thủ"],
  ["the luc ben bi", "thể lực bền bỉ"],
  ["toi uu doi hinh", "tối ưu đội hình"],
  ["Su kien", "Sự kiện"],
  ["du kien", "dự kiến"],
  ["ket hop", "kết hợp"],
  ["truc tiep", "trực tiếp"],
  ["nghe thuat", "nghệ thuật"],
  ["mo rong", "mở rộng"],
  ["chuong trinh", "chương trình"],
  ["ky nang", "kỹ năng"],
  ["sinh vien", "sinh viên"],
  ["nam cuoi", "năm cuối"],
  ["tri tue nhan tao", "trí tuệ nhân tạo"],
  ["thuc te", "thực tế"],
  ["Bao cao", "Báo cáo"],
  ["Nhieu", "Nhiều"],
  ["Cac", "Các"],
  ["So lieu", "Số liệu"],
  ["Nguon luc", "Nguồn lực"],
  ["Danh gia", "Đánh giá"],
  ["Muc tieu", "Mục tiêu"],
  ["Don vi", "Đơn vị"],
  ["Chien luoc", "Chiến lược"],
  ["Nhiem vu", "Nhiệm vụ"],
  ["Minh Chau", "Minh Châu"],
  ["Thanh Tung", "Thanh Tùng"],
  ["Ha My", "Hà My"],
  ["Anh Tuan", "Anh Tuấn"],
  ["Bao Nam", "Bảo Nam"]
];

function restoreVietnameseText(value) {
  if (typeof value !== "string") return value;
  return TEXT_REPLACEMENTS.reduce((result, [from, to]) => result.replaceAll(from, to), value);
}

function normalizeArticleDisplay(article) {
  if (!article) return article;
  return {
    ...article,
    title: restoreVietnameseText(article.title),
    summary: restoreVietnameseText(article.summary),
    category: restoreVietnameseText(article.category),
    author: restoreVietnameseText(article.author),
    content: restoreVietnameseText(article.content)
  };
}

function normalizeNewsPayload(payload) {
  return {
    ...payload,
    hero: normalizeArticleDisplay(payload.hero),
    trending: Array.isArray(payload.trending) ? payload.trending.map(normalizeArticleDisplay) : [],
    latest: Array.isArray(payload.latest) ? payload.latest.map(normalizeArticleDisplay) : [],
    categories: Array.isArray(payload.categories) ? payload.categories.map(restoreVietnameseText) : []
  };
}

function normalizeAdminArticlesPayload(articles) {
  if (!Array.isArray(articles)) return [];
  return articles
    .map(normalizeArticleDisplay)
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
}

function getUserInitial(name) {
  return String(name || "").trim().charAt(0).toUpperCase() || "B";
}

function isValidAvatarUrl(value) {
  const avatar = String(value || "").trim();
  if (!avatar) return true;
  if (avatar.length > MAX_AVATAR_LENGTH) return false;
  if (avatar.startsWith("https://") || avatar.startsWith("http://")) return true;
  if (AVATAR_DATA_URL_PATTERN.test(avatar)) return true;
  return false;
}

function UserAvatar({ name, avatar, className, onClick, title }) {
  const avatarUrl = String(avatar || "").trim();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl) && !imageError;

  return (
    <div
      className={`${className}${showImage ? " has-image" : ""}${onClick ? " is-clickable" : ""}`}
      aria-hidden="true"
      onClick={(event) => {
        if (!onClick) return;
        event.stopPropagation();
        onClick();
      }}
      title={title}
    >
      {showImage ? (
        <img src={avatarUrl} alt="" loading="lazy" onError={() => setImageError(true)} />
      ) : (
        getUserInitial(name)
      )}
    </div>
  );
}

function App() {
  const [news, setNews] = useState({
    hero: null,
    trending: [],
    latest: [],
    categories: [],
    pagination: { page: 1, limit: 50, totalItems: 0, totalPages: 1 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [authMode, setAuthMode] = useState(AUTH_MODES.LOGIN);
  const [authUser, setAuthUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState([]);
  const [friendActionLoadingByUser, setFriendActionLoadingByUser] = useState({});
  const [publicAuthorProfile, setPublicAuthorProfile] = useState(null);
  const [publicAuthorArticles, setPublicAuthorArticles] = useState([]);
  const [publicAuthorLoading, setPublicAuthorLoading] = useState(false);
  const [publicAuthorError, setPublicAuthorError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatError, setChatError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", resetToken: "" });

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState("users");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminVipRequests, setAdminVipRequests] = useState([]);
  const [adminVipLoading, setAdminVipLoading] = useState(false);
  const [adminVipActionLoading, setAdminVipActionLoading] = useState("");
  const [adminInvoices, setAdminInvoices] = useState([]);
  const [adminInvoiceFilter, setAdminInvoiceFilter] = useState("all");
  const [adminInvoiceKeyword, setAdminInvoiceKeyword] = useState("");
  const [adminInvoiceSort, setAdminInvoiceSort] = useState("newest");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [newsForm, setNewsForm] = useState({ title: "", category: "", summary: "", content: "", author: "", image: "" });
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [allNewsList, setAllNewsList] = useState([]);
  const [newsListLoading, setNewsListLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeSectionMenu, setActiveSectionMenu] = useState("Trang chủ");
  const userMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const searchFormRef = useRef(null);
  const avatarFileInputRef = useRef(null);
  const chatStreamRef = useRef(null);
  const latestSectionRef = useRef(null);
  const personalizationSectionRef = useRef(null);
  const videoSectionRef = useRef(null);
  const podcastSectionRef = useRef(null);
  const dataSectionRef = useRef(null);
  const contactSectionRef = useRef(null);
  const knownArticleIdsRef = useRef(new Set());
  const knownVipRequestIdsRef = useRef(new Set());
  const notificationBootstrappedRef = useRef(false);
  const previousVipRequestStateRef = useRef(null);
  const previousVipDecisionAtRef = useRef(null);

  // User profile & pages
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("info"); // info, payments, comments, mynews, createnews, viewed, saved, liked, friends
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [friendRemovingByUser, setFriendRemovingByUser] = useState({});
  const [friendAcceptingByUser, setFriendAcceptingByUser] = useState({});
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [passwordEditMode, setPasswordEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", avatar: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [vipPackages, setVipPackages] = useState({});
  const [showVipUpgrade, setShowVipUpgrade] = useState(false);
  const [vipUpgrading, setVipUpgrading] = useState(false);
  const [vipError, setVipError] = useState("");
  const [vipSuccess, setVipSuccess] = useState("");
  const [selectedVipPackage, setSelectedVipPackage] = useState(null);
  const [vipPaymentStep, setVipPaymentStep] = useState("select"); // select, payment, confirm
  const [vipPaymentConfirming, setVipPaymentConfirming] = useState(false);
  const [vipResendingApproval, setVipResendingApproval] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistorySummary, setPaymentHistorySummary] = useState(null);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState("");
  const [paymentHistoryFilter, setPaymentHistoryFilter] = useState("all");
  const [userNewsForm, setUserNewsForm] = useState({ title: "", category: "", summary: "", author: "", image: "" });
  const [userNewsSubmitting, setUserNewsSubmitting] = useState(false);
  const [userNewsDeletingId, setUserNewsDeletingId] = useState(null);
  const [userNewsError, setUserNewsError] = useState("");
  const [userNewsSuccess, setUserNewsSuccess] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState("Trang chủ");
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [quickInfoWidgets, setQuickInfoWidgets] = useState(DEFAULT_QUICK_INFO_WIDGETS);
  const [quickInfoDetailsByWidget, setQuickInfoDetailsByWidget] = useState(DEFAULT_QUICK_INFO_DETAILS);
  const [activeQuickInfoWidgetId, setActiveQuickInfoWidgetId] = useState("");
  const [contactForm, setContactForm] = useState({
    title: "",
    content: "",
    fullName: "",
    email: "",
    files: []
  });
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [commentsByArticle, setCommentsByArticle] = useState(() => {
    try {
      const rawValue = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load comments from localStorage:", error);
    }
    return {};
  });
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentArticleId, setEditingCommentArticleId] = useState(null);
  const [editingCommentDraft, setEditingCommentDraft] = useState("");
  const [commentEditError, setCommentEditError] = useState("");
  const [readHistory, setReadHistory] = useState(() => {
    try {
      const rawValue = localStorage.getItem(READ_HISTORY_STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load read history from localStorage:", error);
    }
    return [];
  });
  const [savedArticles, setSavedArticles] = useState(() => {
    try {
      const rawValue = localStorage.getItem(SAVED_ARTICLES_STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load saved articles from localStorage:", error);
    }
    return [];
  });
  const [likedArticles, setLikedArticles] = useState(() => {
    try {
      const rawValue = localStorage.getItem(LIKED_ARTICLES_STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load liked articles from localStorage:", error);
    }
    return [];
  });
  const [viewCounts, setViewCounts] = useState(() => {
    try {
      const rawValue = localStorage.getItem(VIEW_COUNTS_STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load view counts from localStorage:", error);
    }
    return {};
  });
  const [topArticlesTab, setTopArticlesTab] = useState("viewed"); // viewed, liked, accessed

  const hero = news.hero;
  const leftColumn = useMemo(() => news.trending.slice(0, 2), [news.trending]);
  const rightColumn = useMemo(() => news.trending.slice(2, 5), [news.trending]);
  const spotlight = useMemo(() => news.latest.slice(0, 3), [news.latest]);
  const latestStreamArticles = useMemo(() => news.latest.slice(3, 50), [news.latest]);
  const latestGroupedByCategory = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    latestStreamArticles.forEach((item) => {
      const categoryName = item.category || "Khác";
      if (!groupMap.has(categoryName)) {
        const group = { category: categoryName, items: [] };
        groupMap.set(categoryName, group);
        groups.push(group);
      }
      groupMap.get(categoryName).items.push(item);
    });

    return groups;
  }, [latestStreamArticles]);
  const searchableNews = useMemo(() => {
    const map = new Map();
    [news.hero, ...news.trending, ...news.latest].filter(Boolean).forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [news.hero, news.trending, news.latest]);

  const topArticlesByViews = useMemo(() => {
    return searchableNews
      .map(article => ({
        ...article,
        viewCount: viewCounts[article.id] || 0
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5);
  }, [searchableNews, viewCounts]);

  const topArticlesByLikes = useMemo(() => {
    const likesMap = new Map();
    likedArticles.forEach(item => {
      likesMap.set(item.id, (likesMap.get(item.id) || 0) + 1);
    });

    return searchableNews
      .map(article => ({
        ...article,
        likeCount: likesMap.get(article.id) || 0
      }))
      .filter(article => article.likeCount > 0)
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 5);
  }, [searchableNews, likedArticles]);

  const topArticlesByAccess = useMemo(() => {
    const accessMap = new Map();
    readHistory.forEach(item => {
      accessMap.set(item.id, (accessMap.get(item.id) || 0) + 1);
    });

    return searchableNews
      .map(article => ({
        ...article,
        accessCount: accessMap.get(article.id) || 0
      }))
      .filter(article => article.accessCount > 0)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);
  }, [searchableNews, readHistory]);
  const categoryPreferenceMap = useMemo(
    () => buildCategoryPreferenceMap(readHistory, savedArticles, likedArticles),
    [readHistory, savedArticles, likedArticles]
  );
  const preferredCategoryDetails = useMemo(() => {
    return Array.from(categoryPreferenceMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [categoryPreferenceMap]);
  const preferredCategoryKeys = useMemo(() => {
    return new Set(
      preferredCategoryDetails.map((item) => normalizeSearchText(item.label)).filter(Boolean)
    );
  }, [preferredCategoryDetails]);
  const personalizedArticles = useMemo(() => {
    return rankArticlesForPersonalization(searchableNews, categoryPreferenceMap, viewCounts);
  }, [searchableNews, categoryPreferenceMap, viewCounts]);
  const personalizedHighlights = useMemo(() => {
    if (personalizedArticles.length > 0) {
      return personalizedArticles.slice(0, 6);
    }
    return topArticlesByViews.slice(0, 6);
  }, [personalizedArticles, topArticlesByViews]);
  const hasBehaviorData = readHistory.length + savedArticles.length + likedArticles.length > 0;
  const filteredNews = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    if (!normalizedQuery) return [];

    return searchableNews.filter((item) => {
      const haystack = normalizeSearchText(
        `${item.title || ""} ${item.summary || ""} ${item.category || ""} ${item.author || ""}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, searchableNews]);
  const liveSearchResults = useMemo(() => {
    const normalizedInput = normalizeSearchText(searchInput);
    if (!normalizedInput) return [];

    return searchableNews
      .filter((item) => {
        const haystack = normalizeSearchText(
          `${item.title || ""} ${item.summary || ""} ${item.category || ""} ${item.author || ""}`
        );
        return haystack.includes(normalizedInput);
      })
      .slice(0, 6);
  }, [searchInput, searchableNews]);
  const menuItems = ["Trang chủ", "Mới nhất", "Cá nhân hóa", "Video", "Podcast", "Dữ liệu", "Liên hệ"];
  const partnerLinks = ["Kinh tế", "Số hóa", "Nhịp sống"];
  const isHomePage = activeMenuItem === "Trang chủ";
  const hasActiveSearch = searchQuery.trim().length > 0;
  const showSearchSuggestions = searchFocused && normalizeSearchText(searchInput).length > 0;
  const activeMenuPage = MENU_PAGES[activeMenuItem] || MENU_PAGES["Trang chủ"];
  const menuThemeClassMap = {
    Video: "theme-video",
    Podcast: "theme-podcast",
    "Dữ liệu": "theme-data",
    "Liên hệ": "theme-contact"
  };
  const activeMenuThemeClass = menuThemeClassMap[activeMenuItem] || "";
  const renderDataInsightCards = (keyPrefix) => (
    <div className="menu-page-grid data-insight-grid">
      {DATA_INSIGHT_SECTIONS.map((section) => (
        <article className="menu-page-card data-insight-card" key={`${keyPrefix}-${section.id}`}>
          <div className="data-insight-head">
            <h3>{section.title}</h3>
            <span className="data-insight-updated">Cập nhật: {section.lastUpdated}</span>
          </div>
          <p>{section.summary}</p>
          <div className="data-insight-metrics">
            {section.metrics.map((metric) => (
              <div className="data-metric-row" key={`${section.id}-${metric.label}`}>
                <p className="data-metric-label">{metric.label}</p>
                <strong className="data-metric-value">{metric.value}</strong>
                <span className="data-metric-delta">{metric.delta}</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
  const allComments = useMemo(
    () =>
      Object.values(commentsByArticle)
        .flat()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [commentsByArticle]
  );
  const myComments = useMemo(() => {
    if (!authUser?.email) return [];
    const normalizedEmail = authUser.email.trim().toLowerCase();
    return allComments.filter((item) => item.authorEmail === normalizedEmail);
  }, [allComments, authUser]);

  const myNewsList = useMemo(() => {
    if (!authUser) return [];
    return allNewsList.filter((item) => 
      (item.author || "").toLowerCase().includes((authUser.name || "").toLowerCase()) ||
      item.createdBy === authUser.id
    );
  }, [allNewsList, authUser]);
  const filteredFriends = useMemo(() => {
    const normalizedQuery = normalizeSearchText(friendSearchQuery);
    if (!normalizedQuery) return friends;

    return friends.filter((friend) => {
      const haystack = normalizeSearchText(`${friend.name || ""} ${friend.email || ""}`);
      return haystack.includes(normalizedQuery);
    });
  }, [friends, friendSearchQuery]);
  const filteredIncomingFriendRequests = useMemo(() => {
    const normalizedQuery = normalizeSearchText(friendSearchQuery);
    if (!normalizedQuery) return incomingFriendRequests;

    return incomingFriendRequests.filter((friend) => {
      const haystack = normalizeSearchText(`${friend.name || ""} ${friend.email || ""}`);
      return haystack.includes(normalizedQuery);
    });
  }, [incomingFriendRequests, friendSearchQuery]);
  const filteredOutgoingFriendRequests = useMemo(() => {
    const normalizedQuery = normalizeSearchText(friendSearchQuery);
    if (!normalizedQuery) return outgoingFriendRequests;

    return outgoingFriendRequests.filter((friend) => {
      const haystack = normalizeSearchText(`${friend.name || ""} ${friend.email || ""}`);
      return haystack.includes(normalizedQuery);
    });
  }, [outgoingFriendRequests, friendSearchQuery]);

  const articleTitleById = useMemo(() => {
    const map = new Map();
    searchableNews.forEach((item) => {
      map.set(item.id, item.title);
    });
    if (selectedArticle?.id) {
      map.set(selectedArticle.id, selectedArticle.title);
    }
    return map;
  }, [searchableNews, selectedArticle]);
  const selectedArticleComments = useMemo(() => {
    if (!selectedArticle?.id) return [];
    const source = commentsByArticle[selectedArticle.id] || [];
    return [...source].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [commentsByArticle, selectedArticle]);
  const currentUserEmail = (authUser?.email || "").trim().toLowerCase();
  const friendIdSet = useMemo(() => new Set(friends.map((item) => item.id)), [friends]);
  const incomingFriendRequestIdSet = useMemo(
    () => new Set(incomingFriendRequests.map((item) => item.id)),
    [incomingFriendRequests]
  );
  const outgoingFriendRequestIdSet = useMemo(
    () => new Set(outgoingFriendRequests.map((item) => item.id)),
    [outgoingFriendRequests]
  );
  const currentVipStatus = authUser?.vipPackage?.status || "free";
  const vipDiscountPercent = getVipDiscountPercent(authUser);
  const silverUpgradeCharge = getVipUpgradeChargeWithDiscount(currentVipStatus, "silver", vipDiscountPercent);
  const goldUpgradeCharge = getVipUpgradeChargeWithDiscount(currentVipStatus, "gold", vipDiscountPercent);
  const platinumUpgradeCharge = getVipUpgradeChargeWithDiscount(currentVipStatus, "platinum", vipDiscountPercent);
  const selectedUpgradeCharge = getVipUpgradeChargeWithDiscount(currentVipStatus, selectedVipPackage || "free", vipDiscountPercent);
  const isVipUser = Boolean(authUser?.vipPackage?.status && authUser.vipPackage.status !== "free");
  const canUseFriendFeature = Boolean(authUser && (authUser.role === "admin" || isVipUser));
  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );
  const adminTabMeta = {
    users: { label: "Quản lý người dùng", shortLabel: "Người dùng", icon: "👥" },
    news: { label: "Quản lý tin tức", shortLabel: "Tin tức", icon: "📰" },
    "vip-requests": { label: "Duyệt VIP", shortLabel: "VIP", icon: "💎" },
    invoices: { label: "Quản lý hóa đơn", shortLabel: "Hóa đơn", icon: "🧾" },
    comments: { label: "Quản lý bình luận", shortLabel: "Bình luận", icon: "💬" }
  };
  const adminTabBadges = {
    users: adminUsers.length,
    news: allNewsList.length,
    "vip-requests": adminVipRequests.length,
    invoices: adminInvoices.length,
    comments: allComments.length
  };
  const adminInvoiceSummary = useMemo(() => {
    const summary = {
      totalInvoices: adminInvoices.length,
      paid: 0,
      pending: 0,
      rejected: 0,
      totalAmountValue: 0,
      paidAmountValue: 0,
      pendingAmountValue: 0
    };

    adminInvoices.forEach((invoice) => {
      if (invoice.paymentStatus === "paid") {
        summary.paid += 1;
      } else if (invoice.paymentStatus === "awaiting_approval") {
        summary.pending += 1;
      } else if (invoice.paymentStatus === "rejected") {
        summary.rejected += 1;
      }

      const amountValue = Number(invoice.amount || 0);
      if (Number.isFinite(amountValue)) {
        summary.totalAmountValue += amountValue;

        if (invoice.paymentStatus === "paid") {
          summary.paidAmountValue += amountValue;
        } else if (invoice.paymentStatus === "awaiting_approval") {
          summary.pendingAmountValue += amountValue;
        }
      }
    });

    return summary;
  }, [adminInvoices]);
  const adminSummaryCards = [
    {
      id: "summary-users",
      icon: "👥",
      label: "Tài khoản hệ thống",
      value: adminUsers.length,
      note: `${adminUsers.filter((item) => item.role === "admin").length} admin`
    },
    {
      id: "summary-news",
      icon: "📰",
      label: "Bài viết đang quản lý",
      value: allNewsList.length,
      note: `${myNewsList.length} bài do bạn phụ trách`
    },
    {
      id: "summary-vip",
      icon: "💎",
      label: "Yêu cầu VIP chờ duyệt",
      value: adminVipRequests.length,
      note: adminVipRequests.length > 0 ? "Cần xử lý sớm" : "Không có yêu cầu tồn"
    },
    {
      id: "summary-invoices",
      icon: "🧾",
      label: "Tổng hóa đơn VIP",
      value: adminInvoiceSummary.totalInvoices,
      note: `${adminInvoiceSummary.paid} đã duyệt • ${adminInvoiceSummary.pending} chờ duyệt`
    },
    {
      id: "summary-invoices-amount",
      icon: "💰",
      label: "Tổng tiền VIP",
      value: adminInvoiceSummary.paidAmountValue,
      displayValue: formatCurrency(adminInvoiceSummary.paidAmountValue),
      note: `Chờ duyệt: ${formatCurrency(adminInvoiceSummary.pendingAmountValue)}`
    },
    {
      id: "summary-comments",
      icon: "💬",
      label: "Tổng bình luận",
      value: allComments.length,
      note: `${allComments.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString()).length} bình luận hôm nay`
    }
  ];
  const filteredAdminInvoices = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(adminInvoiceKeyword);

    let items = adminInvoices.filter((item) => {
      if (adminInvoiceFilter === "paid" && item.paymentStatus !== "paid") return false;
      if (adminInvoiceFilter === "pending" && item.paymentStatus !== "awaiting_approval") return false;
      if (adminInvoiceFilter === "rejected" && item.paymentStatus !== "rejected") return false;

      if (!normalizedKeyword) return true;

      const haystack = normalizeSearchText(
        `${item.invoiceId || ""} ${item.userName || ""} ${item.userEmail || ""} ${item.packageName || ""} ${item.packageStatus || ""}`
      );

      return haystack.includes(normalizedKeyword);
    });

    items = [...items].sort((a, b) => {
      const timeA = new Date(a.requestedAt || a.decidedAt || a.activatedAt || 0).getTime();
      const timeB = new Date(b.requestedAt || b.decidedAt || b.activatedAt || 0).getTime();

      if (adminInvoiceSort === "oldest") {
        return timeA - timeB;
      }

      if (adminInvoiceSort === "amount_desc") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }

      if (adminInvoiceSort === "amount_asc") {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }

      return timeB - timeA;
    });

    return items;
  }, [adminInvoiceFilter, adminInvoiceKeyword, adminInvoiceSort, adminInvoices]);
  const filteredPaymentHistory = useMemo(() => {
    if (paymentHistoryFilter === "all") return paymentHistory;
    if (paymentHistoryFilter === "paid") {
      return paymentHistory.filter((item) => item.paymentStatus === "paid");
    }
    if (paymentHistoryFilter === "pending") {
      return paymentHistory.filter((item) => item.paymentStatus === "awaiting_approval");
    }
    if (paymentHistoryFilter === "rejected") {
      return paymentHistory.filter((item) => item.paymentStatus === "rejected");
    }
    return paymentHistory;
  }, [paymentHistory, paymentHistoryFilter]);

  const addNotification = useCallback((message, type = "system") => {
    const notification = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsByArticle));
  }, [commentsByArticle]);

  useEffect(() => {
    localStorage.setItem(READ_HISTORY_STORAGE_KEY, JSON.stringify(readHistory));
  }, [readHistory]);

  useEffect(() => {
    localStorage.setItem(SAVED_ARTICLES_STORAGE_KEY, JSON.stringify(savedArticles));
  }, [savedArticles]);

  useEffect(() => {
    localStorage.setItem(LIKED_ARTICLES_STORAGE_KEY, JSON.stringify(likedArticles));
  }, [likedArticles]);

  useEffect(() => {
    localStorage.setItem(VIEW_COUNTS_STORAGE_KEY, JSON.stringify(viewCounts));
  }, [viewCounts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("resetToken");
    if (!resetToken) {
      return;
    }

    setAuthMode(AUTH_MODES.RESET);
    setAuthOpen(true);
    setAuthError("");
    setAuthSuccess("");
    setFormData((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      resetToken
    }));

    params.delete("resetToken");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          localStorage.removeItem(TOKEN_KEY);
          return;
        }

        let payload;
        try {
          payload = await response.json();
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          return;
        }

        setAuthUser(payload.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }

    fetchCurrentUser();
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu tin tức");
      }

      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error("Dữ liệu tin tức không hợp lệ");
      }

      setNews(normalizeNewsPayload(payload));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    let stopped = false;

    async function fetchMarketSnapshot() {
      try {
        const response = await fetch("/api/market-snapshot", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json();
        if (stopped) return;

        if (Array.isArray(payload?.widgets) && payload.widgets.length > 0) {
          setQuickInfoWidgets(payload.widgets);
        }

        if (payload?.detailsByWidget && typeof payload.detailsByWidget === "object") {
          setQuickInfoDetailsByWidget(payload.detailsByWidget);
        }
      } catch {
        // Keep default fallback widgets if remote market snapshot is unavailable.
      }
    }

    fetchMarketSnapshot();
    const intervalId = setInterval(fetchMarketSnapshot, 180000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!quickInfoWidgets.some((item) => item.id === activeQuickInfoWidgetId)) {
      setActiveQuickInfoWidgetId("");
    }
  }, [quickInfoWidgets, activeQuickInfoWidgetId]);

  useEffect(() => {
    if (showVipUpgrade) {
      fetchVipPackages();
    }
  }, [showVipUpgrade]);

  useEffect(() => {
    if (!authUser) {
      setFriends([]);
      setIncomingFriendRequests([]);
      setOutgoingFriendRequests([]);
      setFriendActionLoadingByUser({});
      setFriendAcceptingByUser({});
      setFriendRemovingByUser({});
      setChatOpen(false);
      setActiveChatFriend(null);
      setChatMessages([]);
      setChatDraft("");
      setChatError("");
      setShowNotifications(false);
      notificationBootstrappedRef.current = false;
      knownArticleIdsRef.current = new Set();
      knownVipRequestIdsRef.current = new Set();
      previousVipRequestStateRef.current = null;
      previousVipDecisionAtRef.current = null;
    }
  }, [authUser]);

  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [chatMessages, chatOpen]);

  useEffect(() => {
    const isStillFriend = friends.some((item) => item.id === activeChatFriend?.id);
    if (!chatOpen || !activeChatFriend || !authUser || !isStillFriend) {
      return undefined;
    }

    let cancelled = false;

    async function refreshChatSilently() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        const response = await fetch(`/api/chat/messages/${activeChatFriend.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        if (!response.ok || cancelled) {
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setChatMessages(Array.isArray(data.messages) ? data.messages : []);
        }
      } catch {
        // Polling failures should stay silent.
      }
    }

    const intervalId = setInterval(refreshChatSilently, 4000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [chatOpen, activeChatFriend, authUser, friends]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!authUser || !token) return;

    async function fetchFriends() {
      try {
        const response = await fetch("/api/auth/friends", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setFriends(Array.isArray(data.friends) ? data.friends : []);
        setIncomingFriendRequests(Array.isArray(data.incomingRequests) ? data.incomingRequests : []);
        setOutgoingFriendRequests(Array.isArray(data.outgoingRequests) ? data.outgoingRequests : []);
      } catch {
        // Keep UI stable on transient network issues.
      }
    }

    fetchFriends();
  }, [authUser]);

  useEffect(() => {
    function handleWindowScroll() {
      const isHome = activeMenuItem === "Trang chủ";
      setShowScrollTop(isHome && window.scrollY > 320);
    }

    handleWindowScroll();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [activeMenuItem]);

  useEffect(() => {
    let stopped = false;

    async function pollNotifications() {
      try {
        const pollTs = Date.now();
        const newsResponse = await fetch(`/api/news?page=1&limit=12&_=${pollTs}`, {
          cache: "no-store"
        });
        if (newsResponse.ok) {
          const payload = await newsResponse.json();
          const articles = [payload.hero, ...(payload.trending || []), ...(payload.latest || [])].filter(Boolean);

          const currentArticleIds = new Set(articles.map((item) => item.id));
          if (notificationBootstrappedRef.current) {
            const newArticles = articles.filter((item) => !knownArticleIdsRef.current.has(item.id));
            newArticles.reverse().forEach((article) => {
              const creatorName = article.createdByName || article.author || "Ban biên tập";
              const creatorRoleLabel = article.createdByRole === "admin" ? "Admin" : "Người dùng";
              addNotification(`${creatorRoleLabel} ${creatorName} vừa đăng bài: ${article.title}`, "news");
            });
          }
          knownArticleIdsRef.current = currentArticleIds;
        }

        const token = localStorage.getItem(TOKEN_KEY);
        if (authUser && token) {
          const meResponse = await fetch(`/api/auth/me?_=${pollTs}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store"
          });

          if (meResponse.ok) {
            const mePayload = await meResponse.json();
            const latestUser = mePayload?.user;
            const latestPendingState = latestUser?.pendingVipRequest?.state || null;
            const latestDecisionAt = latestUser?.pendingVipRequest?.decidedAt || null;
            const decider = latestUser?.pendingVipRequest?.decidedBy || "quản trị viên";

            if (notificationBootstrappedRef.current) {
              const decisionJustUpdated =
                latestDecisionAt &&
                latestDecisionAt !== previousVipDecisionAtRef.current &&
                latestPendingState !== previousVipRequestStateRef.current;

              if (decisionJustUpdated && latestPendingState === "approved") {
                addNotification(`Yêu cầu VIP của bạn đã được duyệt bởi ${decider}.`, "vip");
              }

              if (decisionJustUpdated && latestPendingState === "rejected") {
                addNotification(`Yêu cầu VIP của bạn đã bị từ chối bởi ${decider}.`, "vip");
              }
            }

            previousVipRequestStateRef.current = latestPendingState;
            previousVipDecisionAtRef.current = latestDecisionAt;
          }
        }

        if (authUser?.role === "admin") {
          if (token) {
            const vipResponse = await fetch(`/api/admin/vip-requests?_=${pollTs}`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store"
            });

            if (vipResponse.ok) {
              const vipPayload = await vipResponse.json();
              const requests = Array.isArray(vipPayload.requests) ? vipPayload.requests : [];
              const currentRequestIds = new Set(requests.map((request) => request.requestId));

              if (notificationBootstrappedRef.current) {
                const newRequests = requests.filter(
                  (request) => !knownVipRequestIdsRef.current.has(request.requestId)
                );

                newRequests.reverse().forEach((request) => {
                  const requesterName = request.user?.name || "Người dùng";
                  const fromPackageName = request.fromPackageName || getVipPackageName(request.fromStatus);
                  const toPackageName = request.toPackageName || getVipPackageName(request.status);
                  const payable = request.amountText || formatCurrency(request.amount);
                  addNotification(
                    `Admin: ${requesterName} gửi yêu cầu đổi VIP ${fromPackageName} -> ${toPackageName} (thanh toán thêm ${payable}).`,
                    "vip"
                  );
                });
              }

              knownVipRequestIdsRef.current = currentRequestIds;
            }
          }
        }

        if (!notificationBootstrappedRef.current && !stopped) {
          notificationBootstrappedRef.current = true;
        }
      } catch {
        // Keep polling silently to avoid noisy UX on transient network issues.
      }
    }

    pollNotifications();
    const intervalId = setInterval(pollNotifications, 20000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [authUser, addNotification]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      if (searchFormRef.current && !searchFormRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    }

    if (showUserMenu || searchFocused || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu, searchFocused, showNotifications]);

  useEffect(() => {
    if (!authUser) return;
    setContactForm((prev) => ({
      ...prev,
      fullName: prev.fullName || authUser.name || "",
      email: prev.email || authUser.email || ""
    }));
  }, [authUser]);

  function handleCategoryChange(value) {
    setSelectedCategory(value);
    setPage(1);
  }

  function formatNotificationTime(value) {
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function toggleNotifications() {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) {
        setNotifications((items) => items.map((item) => ({ ...item, read: true })));
        setShowUserMenu(false);
      }
      return next;
    });
  }

  function onChangeField(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validateRegisterInput() {
    if (formData.name.trim().length < 2 || formData.name.trim().length > 80) {
      return "Họ tên phải từ 2 đến 80 ký tự";
    }

    if (!EMAIL_PATTERN.test(formData.email.trim())) {
      return "Email không đúng định dạng";
    }

    if (!PASSWORD_PATTERN.test(formData.password)) {
      return "Mật khẩu 8-64 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Mật khẩu nhập lại không khớp";
    }

    return "";
  }

  function validateLoginInput() {
    if (!EMAIL_PATTERN.test(formData.email.trim())) {
      return "Email không đúng định dạng";
    }

    if (formData.password.length < 8) {
      return "Mật khẩu tối thiểu 8 ký tự";
    }

    return "";
  }

  function validateForgotInput() {
    if (!EMAIL_PATTERN.test(formData.email.trim())) {
      return "Email không đúng định dạng";
    }

    return "";
  }

  function validateResetInput() {
    if (!formData.resetToken.trim()) {
      return "Thiếu token đặt lại mật khẩu";
    }

    if (!PASSWORD_PATTERN.test(formData.password)) {
      return "Mật khẩu 8-64 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Mật khẩu nhập lại không khớp";
    }

    return "";
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      if (authMode === AUTH_MODES.REGISTER) {
        const registerError = validateRegisterInput();
        if (registerError) {
          throw new Error(registerError);
        }
      } else if (authMode === AUTH_MODES.LOGIN) {
        const loginError = validateLoginInput();
        if (loginError) {
          throw new Error(loginError);
        }
      } else if (authMode === AUTH_MODES.FORGOT) {
        const forgotError = validateForgotInput();
        if (forgotError) {
          throw new Error(forgotError);
        }
      } else if (authMode === AUTH_MODES.RESET) {
        const resetError = validateResetInput();
        if (resetError) {
          throw new Error(resetError);
        }
      }

      const payload =
        authMode === AUTH_MODES.REGISTER
          ? {
              name: formData.name.trim(),
              email: formData.email.trim(),
              password: formData.password,
              role: "user"
            }
          : authMode === AUTH_MODES.LOGIN
            ? { email: formData.email.trim(), password: formData.password }
            : authMode === AUTH_MODES.FORGOT
              ? { email: formData.email.trim() }
              : { token: formData.resetToken.trim(), newPassword: formData.password };

      const endpoint =
        authMode === AUTH_MODES.REGISTER
          ? "/api/auth/register"
          : authMode === AUTH_MODES.LOGIN
            ? "/api/auth/login"
            : authMode === AUTH_MODES.FORGOT
              ? "/api/auth/forgot-password"
              : "/api/auth/reset-password";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Lỗi máy chủ, vui lòng thử lại");
      }

      if (!response.ok) {
        throw new Error(data.message || "Xác thực thất bại");
      }

      if (authMode === AUTH_MODES.REGISTER || authMode === AUTH_MODES.LOGIN) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setAuthUser(data.user);
        setAuthSuccess(authMode === AUTH_MODES.REGISTER ? "Đăng ký thành công" : "Đăng nhập thành công");
        setFormData({ name: "", email: "", password: "", confirmPassword: "", resetToken: "" });
        setAuthOpen(false);
      } else if (authMode === AUTH_MODES.FORGOT) {
        setAuthSuccess(data.message || "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.");
        setAuthMode(AUTH_MODES.LOGIN);
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        setAuthSuccess(data.message || "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.");
        setAuthMode(AUTH_MODES.LOGIN);
        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
          resetToken: ""
        }));
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setConfirmAction({
      title: "Xác nhận đăng xuất",
      message: "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      onConfirm: () => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthUser(null);
        setNotifications([]);
        setShowNotifications(false);
        setAuthSuccess("Đã đăng xuất");
        setAuthError("");
        setShowProfilePage(false);
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }

  async function openAuthorProfile(userId) {
    if (!Number.isFinite(userId) || userId <= 0) {
      return;
    }

    setPublicAuthorLoading(true);
    setPublicAuthorError("");
    setPublicAuthorProfile(null);
    setPublicAuthorArticles([]);

    try {
      const response = await fetch(`/api/users/${userId}/public`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải hồ sơ tác giả");
      }

      setPublicAuthorProfile(data.profile || null);
      setPublicAuthorArticles(Array.isArray(data.recentArticles) ? data.recentArticles : []);
    } catch (error) {
      setPublicAuthorError(error.message || "Không thể tải hồ sơ tác giả");
    } finally {
      setPublicAuthorLoading(false);
    }
  }

  async function openChatWithFriend(friend) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !authUser) {
      setAuthOpen(true);
      setAuthMode(AUTH_MODES.LOGIN);
      return;
    }

    if (!friend?.id || !friendIdSet.has(friend.id)) {
      setChatError("Chỉ có thể chat với bạn bè đã được chấp nhận.");
      return;
    }

    setActiveChatFriend(friend);
    setChatOpen(true);
    setChatError("");
    setChatLoading(true);

    try {
      const response = await fetch(`/api/chat/messages/${friend.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải cuộc trò chuyện");
      }

      setChatMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      setChatError(error.message || "Không thể tải cuộc trò chuyện");
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSendChatMessage(event) {
    event.preventDefault();

    const token = localStorage.getItem(TOKEN_KEY);
    const content = chatDraft.trim();
    if (!token || !authUser || !activeChatFriend?.id || !content) {
      return;
    }

    setChatSending(true);
    setChatError("");

    try {
      const response = await fetch(`/api/chat/messages/${activeChatFriend.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi tin nhắn");
      }

      if (data.message) {
        setChatMessages((prev) => [...prev, data.message]);
      }
      setChatDraft("");
    } catch (error) {
      setChatError(error.message || "Không thể gửi tin nhắn");
    } finally {
      setChatSending(false);
    }
  }

  function closePublicAuthorProfile() {
    setPublicAuthorProfile(null);
    setPublicAuthorArticles([]);
    setPublicAuthorError("");
    setPublicAuthorLoading(false);
  }

  function renderAuthorLink(article, className = "") {
    const creatorId = Number.parseInt(article?.createdBy, 10);
    const authorName = article?.createdByName || article?.author || "Ban biên tập";

    if (!Number.isFinite(creatorId) || creatorId <= 0) {
      return <span className={`author-name-static ${className}`.trim()}>{authorName}</span>;
    }

    return (
      <button
        type="button"
        className={`author-link-btn ${className}`.trim()}
        onClick={(event) => {
          event.stopPropagation();
          openAuthorProfile(creatorId);
        }}
      >
        {authorName}
      </button>
    );
  }

  async function fetchAdminUsers() {
    const token = localStorage.getItem(TOKEN_KEY);

    try {
      setAdminLoading(true);
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Không thể tải danh sách người dùng");
      }

      const data = await response.json();
      setAdminUsers(data.users);
      setAdminError("");
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function fetchAdminNews() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      setNewsListLoading(true);
      const response = await fetch("/api/admin/news", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể tải danh sách tin tức quản trị");
      }

      const data = await response.json();
      setAllNewsList(normalizeAdminArticlesPayload(data.articles));
      setAdminError("");
    } catch (err) {
      setAdminError(err.message || "Không thể tải danh sách tin tức quản trị");
    } finally {
      setNewsListLoading(false);
    }
  }

  async function fetchUserPaymentHistory() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      setPaymentHistoryLoading(true);
      const response = await fetch("/api/auth/payment-history", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể tải lịch sử thanh toán");
      }

      const data = await response.json();
      setPaymentHistory(Array.isArray(data.invoices) ? data.invoices : []);
      setPaymentHistorySummary(data.summary || null);
      setPaymentHistoryError("");
    } catch (err) {
      setPaymentHistoryError(err.message || "Không thể tải lịch sử thanh toán");
    } finally {
      setPaymentHistoryLoading(false);
    }
  }

  async function fetchAdminInvoices() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      setAdminLoading(true);
      const response = await fetch("/api/admin/invoices", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể tải danh sách hóa đơn");
      }

      const data = await response.json();
      const normalizedInvoices = Array.isArray(data.invoices)
        ? data.invoices.map((item) => {
            const amount = Number(item.amount);
            const safeAmount = Number.isFinite(amount) ? amount : 0;

            return {
              ...item,
              invoiceId: String(item.invoiceId || ""),
              userName: item.userName || item.user?.name || `User #${item.userId || "?"}`,
              userEmail: item.userEmail || item.user?.email || "-",
              amount: safeAmount,
              amountText: item.amountText || formatCurrency(safeAmount),
              paymentStatus: item.paymentStatus || "awaiting_approval"
            };
          })
        : [];

      setAdminInvoices(normalizedInvoices);
      setAdminError("");
    } catch (err) {
      setAdminError(err.message || "Không thể tải danh sách hóa đơn");
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDeleteUser(userId) {
    setConfirmAction({
      title: "Xóa người dùng",
      message: "Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Xóa thất bại");
          }

          setAdminSuccess("Xóa người dùng thành công");
          fetchAdminUsers();
        } catch (err) {
          setAdminError(err.message);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }

  async function handleUpdateRole(userId, newRole) {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Cập nhật thất bại");
      }

      setAdminSuccess("Cập nhật role thành công");
      fetchAdminUsers();
    } catch (err) {
      setAdminError(err.message);
    }
  }

  async function handleNewsSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    const method = editingNewsId ? "PUT" : "POST";
    const url = editingNewsId ? `/api/admin/news/${editingNewsId}` : "/api/admin/news";

    try {
      setAdminLoading(true);
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newsForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Thao tác thất bại");
      }

      setAdminSuccess(editingNewsId ? "Cập nhật tin thành công" : "Tạo tin thành công");
      setNewsForm({ title: "", category: "", summary: "", content: "", author: "", image: "" });
      setEditingNewsId(null);
      await Promise.all([fetchNews(), fetchAdminNews()]);
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }

  function handleEditNews(article) {
    setNewsForm({
      title: article.title,
      category: article.category,
      summary: article.summary,
      content: article.content || "",
      author: article.author,
      image: article.image
    });
    setEditingNewsId(article.id);
    setAdminTab("news");
    setShowAdminPanel(true);
  }

  function canManageMyNews(article) {
    if (!authUser || !article) return false;
    if (authUser.role === "admin") return true;

    const creatorId = Number.parseInt(article.createdBy, 10);
    const userId = Number.parseInt(authUser.id, 10);
    return Number.isFinite(creatorId) && Number.isFinite(userId) && creatorId === userId;
  }

  async function handleDeleteMyNews(newsId) {
    setConfirmAction({
      title: "Xóa bài viết của bạn",
      message: "Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setUserNewsError("Bạn chưa đăng nhập");
          setShowConfirmModal(false);
          return;
        }

        try {
          setUserNewsDeletingId(newsId);
          setUserNewsError("");
          setUserNewsSuccess("");

          const response = await fetch(`/api/news/${newsId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });

          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(payload.message || "Xóa thất bại");
          }

          setAllNewsList((prev) => prev.filter((item) => item.id !== newsId));
          if (selectedArticle?.id === newsId) {
            setSelectedArticle(null);
          }

          setUserNewsSuccess(payload.message || "Đã xóa bài viết của bạn");
          await fetchNews();
        } catch (error) {
          setUserNewsError(error.message || "Không thể xóa bài viết");
        } finally {
          setUserNewsDeletingId(null);
          setShowConfirmModal(false);
        }
      }
    });
    setShowConfirmModal(true);
  }

  async function handleDeleteNews(newsId) {
    setConfirmAction({
      title: "Xóa tin tức",
      message: "Bạn có chắc muốn xóa tin tức này? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        try {
          const response = await fetch(`/api/admin/news/${newsId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Xóa thất bại");
          }

          setAdminSuccess("Xóa tin thành công");
          if (selectedArticle?.id === newsId) {
            setSelectedArticle(null);
          }
          await Promise.all([fetchNews(), fetchAdminNews()]);
        } catch (err) {
          setAdminError(err.message);
        }
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }

  function openAdminPanel() {
    setShowAdminPanel(true);
    fetchAdminUsers();
    fetchAdminNews();
    fetchAdminVipRequests();
    fetchAdminInvoices();
  }

  async function refreshAdminDashboard() {
    setAdminError("");
    setAdminSuccess("");

    try {
      await Promise.all([fetchAdminUsers(), fetchAdminNews(), fetchAdminVipRequests(), fetchAdminInvoices(), fetchNews()]);
      setAdminSuccess("Đã làm mới dữ liệu quản trị.");
    } catch {
      setAdminError("Không thể làm mới toàn bộ dữ liệu quản trị.");
    }
  }

  async function fetchAllNews() {
    setNewsListLoading(true);
    try {
      const response = await fetch("/api/news");
      if (!response.ok) throw new Error("Failed to fetch news");
      
      const data = await response.json();
      const allArticles = [
        data.hero,
        ...data.trending,
        ...data.latest
      ].filter(Boolean);
      
      // Remove duplicates by id
      const uniqueArticles = Array.from(
        new Map(allArticles.map(item => [item.id, item])).values()
      );
      
      setAllNewsList(uniqueArticles);
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setNewsListLoading(false);
    }
  }

  function openProfilePage(tab = "info") {
    setActiveProfileTab(tab);
    setFriendSearchQuery("");
    setShowProfilePage(true);
    setShowUserMenu(false);
    if (tab === "mynews" || tab === "createnews") {
      fetchAllNews();
    }
    if (tab === "payments") {
      fetchUserPaymentHistory();
    }
  }

  async function handleUserNewsSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    
    setUserNewsError("");
    setUserNewsSuccess("");
    setUserNewsSubmitting(true);

    try {
      // Set author to current user name if not provided
      const newsData = {
        ...userNewsForm,
        author: userNewsForm.author || authUser.name
      };

      const response = await fetch("/api/news/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newsData)
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Đăng tin thất bại");
      }

      const createdArticle = {
        ...(payload.article || {}),
        createdBy: payload.article?.createdBy ?? authUser.id,
        author: payload.article?.author || authUser.name
      };

      if (createdArticle.id) {
        setAllNewsList((prev) => {
          const withoutDuplicate = prev.filter((item) => item.id !== createdArticle.id);
          return [createdArticle, ...withoutDuplicate];
        });
      }

      setUserNewsSuccess("Đăng tin thành công! Tin của bạn đã được gửi.");
      setUserNewsForm({ title: "", category: "", summary: "", author: "", image: "" });
      setActiveProfileTab("mynews");
      fetchAllNews();
    } catch (err) {
      setUserNewsError(err.message || "Có lỗi xảy ra khi đăng tin");
    } finally {
      setUserNewsSubmitting(false);
    }
  }

  useEffect(() => {
    if (showAdminPanel && adminTab === "news") {
      fetchAdminNews();
    }
  }, [showAdminPanel, adminTab]);

  useEffect(() => {
    if (showAdminPanel && adminTab === "vip-requests") {
      fetchAdminVipRequests();
    }
  }, [showAdminPanel, adminTab]);

  useEffect(() => {
    if (showAdminPanel && adminTab === "invoices") {
      fetchAdminInvoices();
    }
  }, [showAdminPanel, adminTab]);

  useEffect(() => {
    if (showProfilePage && activeProfileTab === "payments") {
      fetchUserPaymentHistory();
    }
  }, [showProfilePage, activeProfileTab]);

  useEffect(() => {
    if (!authUser) return;
    setProfileForm({
      name: authUser.name || "",
      email: authUser.email || "",
      avatar: authUser.avatar || ""
    });
  }, [authUser]);

  useEffect(() => {
    if (!avatarPreview?.canChange || !authUser) return;
    setAvatarPreview((prev) => {
      if (!prev?.canChange) return prev;
      return {
        ...prev,
        name: authUser.name || prev.name,
        avatar: authUser.avatar || "",
        userId: authUser.id
      };
    });
  }, [authUser, avatarPreview?.canChange]);

  function openAvatarPreview({ userId = null, name = "", avatar = "", canChange = false }) {
    setAvatarPreview({ userId, name, avatar, canChange });
  }

  function closeAvatarPreview() {
    setAvatarPreview(null);
  }

  async function saveProfileData({ name, email, avatar, closeEditMode = true, successMessage = "Cập nhật thông tin thành công." }) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("Bạn chưa đăng nhập");
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedAvatar = avatar.trim();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new Error("Tên hiển thị phải từ 2 đến 80 ký tự.");
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      throw new Error("Email không đúng định dạng.");
    }

    if (!isValidAvatarUrl(normalizedAvatar)) {
      throw new Error("Ảnh đại diện không hợp lệ.");
    }

    setProfileSaving(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          avatar: normalizedAvatar
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể cập nhật thông tin tài khoản");
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }

      setAuthUser(data.user);
      setProfileForm({
        name: data.user?.name || normalizedName,
        email: data.user?.email || normalizedEmail,
        avatar: data.user?.avatar || normalizedAvatar
      });
      setAvatarPreview((prev) => {
        if (!prev?.canChange) return prev;
        return {
          ...prev,
          userId: data.user?.id || prev.userId,
          name: data.user?.name || normalizedName,
          avatar: data.user?.avatar || normalizedAvatar
        };
      });
      setProfileSuccess(data.message || successMessage);
      if (closeEditMode) {
        setProfileEditMode(false);
      }
    } finally {
      setProfileSaving(false);
    }
  }

  function openAvatarFilePicker() {
    if (!authUser || profileSaving) return;
    avatarFileInputRef.current?.click();
  }

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !authUser) return;

    setProfileError("");
    setProfileSuccess("");

    if (!file.type.startsWith("image/")) {
      setProfileError("Chỉ được chọn tệp hình ảnh.");
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setProfileError("Ảnh đại diện tối đa 2MB.");
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
        reader.readAsDataURL(file);
      });

      await saveProfileData({
        name: authUser.name || profileForm.name,
        email: authUser.email || profileForm.email,
        avatar: dataUrl,
        closeEditMode: false,
        successMessage: "Đã cập nhật ảnh đại diện."
      });
    } catch (err) {
      setProfileError(err.message || "Không thể cập nhật ảnh đại diện.");
    }
  }

  async function handleRemoveAvatar() {
    if (!authUser || profileSaving) return;

    setProfileError("");
    setProfileSuccess("");

    try {
      await saveProfileData({
        name: authUser.name || profileForm.name,
        email: authUser.email || profileForm.email,
        avatar: "",
        closeEditMode: false,
        successMessage: "Đã xóa ảnh đại diện."
      });
    } catch (err) {
      setProfileError(err.message || "Không thể xóa ảnh đại diện.");
    }
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();

    setProfileError("");
    setProfileSuccess("");

    try {
      await saveProfileData({
        name: profileForm.name,
        email: profileForm.email,
        avatar: profileForm.avatar,
        closeEditMode: true
      });
    } catch (err) {
      setProfileError(err.message || "Đã xảy ra lỗi khi cập nhật thông tin.");
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Vui lòng nhập đầy đủ các trường mật khẩu.");
      return;
    }

    if (!PASSWORD_PATTERN.test(passwordForm.newPassword)) {
      setPasswordError("Mật khẩu mới cần 8-64 ký tự và gồm chữ hoa, chữ thường, số, ký tự đặc biệt.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể đổi mật khẩu");
      }

      setPasswordSuccess(data.message || "Đổi mật khẩu thành công.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordEditMode(false);
    } catch (err) {
      setPasswordError(err.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function fetchVipPackages() {
    try {
      const response = await fetch("/api/auth/vip-packages");
      if (!response.ok) {
        throw new Error("Không thể tải danh sách gói VIP");
      }
      const data = await response.json();
      setVipPackages(data);
    } catch (err) {
      console.error("Failed to fetch VIP packages:", err);
    }
  }

  async function handleSpinWheelRequest() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("Vui lòng đăng nhập để quay thưởng.");
    }

    const response = await fetch("/api/auth/spin-wheel/spin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Dữ liệu quay thưởng không hợp lệ.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Không thể quay thưởng lúc này.");
    }

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }

    if (data.user) {
      setAuthUser(data.user);
    }

    if (data.message) {
      setVipSuccess(data.message);
      setTimeout(() => setVipSuccess(""), 4000);
    }

    return data;
  }

  async function handleUpgradeVip(packageStatus) {
    if (packageStatus === "free") {
      if (currentVipStatus !== "free") {
        const confirmedDowngrade = window.confirm("Bạn có chắc chắn muốn về gói Free không?");
        if (!confirmedDowngrade) {
          return;
        }
      }

      // Free tier doesn't need payment
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      setVipError("");
      setVipSuccess("");

      try {
        setVipUpgrading(true);
        const response = await fetch("/api/auth/vip-package", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: packageStatus })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Không thể nâng cấp gói VIP");
        }

        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        setAuthUser(data.user);
        setVipSuccess(data.message || "Nâng cấp gói VIP thành công");
        setShowVipUpgrade(false);
        setVipPaymentStep("select");
        setSelectedVipPackage(null);
        setTimeout(() => setVipSuccess(""), 3000);
      } catch (err) {
        setVipError(err.message || "Đã xảy ra lỗi khi nâng cấp gói VIP");
      } finally {
        setVipUpgrading(false);
      }
    } else {
      // Paid tiers need payment confirmation
      setSelectedVipPackage(packageStatus);
      setVipPaymentStep("payment");
      setVipError("");
    }
  }

  async function handleConfirmVipPayment() {
    if (!selectedVipPackage) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setVipError("");
    setVipSuccess("");

    try {
      setVipPaymentConfirming(true);
      const response = await fetch("/api/auth/vip-payment-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: selectedVipPackage })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi yêu cầu xác nhận thanh toán");
      }

      if (data.user) {
        setAuthUser(data.user);
      }

      setVipSuccess(data.message || "Đã gửi yêu cầu duyệt VIP qua email quản trị.");
      setShowVipUpgrade(false);
      setVipPaymentStep("select");
      setSelectedVipPackage(null);
      setTimeout(() => setVipSuccess(""), 5000);
    } catch (err) {
      setVipError(err.message || "Đã xảy ra lỗi khi xác nhận thanh toán");
    } finally {
      setVipPaymentConfirming(false);
    }
  }

  async function handleResendVipApprovalEmail() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setVipError("");
    setVipSuccess("");

    try {
      setVipResendingApproval(true);
      const response = await fetch("/api/auth/vip-payment-request/resend", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi lại email duyệt");
      }

      if (data.user) {
        setAuthUser(data.user);
      }

      setVipSuccess(data.message || "Đã gửi lại email duyệt.");
    } catch (err) {
      setVipError(err.message || "Đã xảy ra lỗi khi gửi lại email duyệt.");
    } finally {
      setVipResendingApproval(false);
    }
  }

  async function fetchAdminVipRequests() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      setAdminVipLoading(true);
      const response = await fetch("/api/admin/vip-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể tải danh sách yêu cầu VIP");
      }

      const data = await response.json();
      setAdminVipRequests(Array.isArray(data.requests) ? data.requests : []);
      setAdminError("");
    } catch (err) {
      setAdminError(err.message || "Không thể tải danh sách yêu cầu VIP");
    } finally {
      setAdminVipLoading(false);
    }
  }

  async function handleAdminVipDecision(requestId, decision) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      setAdminVipActionLoading(`${decision}:${requestId}`);
      const response = await fetch(`/api/admin/vip-requests/${requestId}/decision`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể xử lý yêu cầu VIP");
      }

      setAdminSuccess(data.message || "Đã xử lý yêu cầu VIP.");
      await fetchAdminVipRequests();
      await fetchAdminUsers();
    } catch (err) {
      setAdminError(err.message || "Không thể xử lý yêu cầu VIP");
    } finally {
      setAdminVipActionLoading("");
    }
  }

  async function handleAdminResendVipEmail(requestId) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      setAdminVipActionLoading(`resend:${requestId}`);
      const response = await fetch(`/api/admin/vip-requests/${requestId}/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi lại email duyệt");
      }

      setAdminSuccess(data.message || "Đã gửi lại email duyệt.");
    } catch (err) {
      setAdminError(err.message || "Không thể gửi lại email duyệt");
    } finally {
      setAdminVipActionLoading("");
    }
  }

  async function openArticleDetail(article) {
    if (!article?.id) return;

    setCommentError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`/api/news/${article.id}`, { headers });

      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const isVipLimitReached =
          response.status === 403 &&
          (payload.code === "NON_VIP_VIEW_LIMIT_REACHED" || String(payload.message || "").toLowerCase().includes("vip"));

        if (isVipLimitReached) {
          const vipPromptMessage = payload.message || "Bạn đã hết lượt xem miễn phí. Vui lòng đăng ký VIP để xem tiếp.";
          setVipError(vipPromptMessage);
          setVipSuccess("");
          setShowVipUpgrade(true);
          addNotification("Bạn đã chạm giới hạn xem. Hãy đăng ký VIP để mở khóa không giới hạn.", "vip");
          return;
        }

        throw new Error(payload.message || "Không thể mở chi tiết bài viết.");
      }

      const detailArticle = normalizeArticleDisplay(payload.article || article);
      setSelectedArticle(detailArticle);

      setViewCounts((prev) => ({
        ...prev,
        [detailArticle.id]: (prev[detailArticle.id] || 0) + 1
      }));

      const historyEntry = {
        id: detailArticle.id,
        title: detailArticle.title,
        description: detailArticle.description,
        image: detailArticle.image,
        category: detailArticle.category,
        author: detailArticle.author,
        readAt: new Date().toISOString()
      };

      setReadHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== detailArticle.id);
        return [historyEntry, ...filtered].slice(0, 50);
      });
    } catch (err) {
      addNotification(err.message || "Không thể mở chi tiết bài viết.", "system");
    }
  }

  function closeArticleDetail() {
    setSelectedArticle(null);
    closePublicAuthorProfile();
    setCommentDraft("");
    setCommentError("");
    setEditingCommentId("");
    setEditingCommentArticleId(null);
    setEditingCommentDraft("");
    setCommentEditError("");
  }

  function handleCommentSubmit(event) {
    event.preventDefault();

    if (!selectedArticle?.id) {
      setCommentError("Không xác định được bài viết để bình luận.");
      return;
    }

    if (!authUser) {
      setCommentError("Vui lòng đăng nhập để gửi bình luận.");
      return;
    }

    const normalizedContent = commentDraft.trim();
    if (normalizedContent.length < 2) {
      setCommentError("Bình luận cần tối thiểu 2 ký tự.");
      return;
    }

    if (normalizedContent.length > 500) {
      setCommentError("Bình luận không được vượt quá 500 ký tự.");
      return;
    }

    const newComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      articleId: selectedArticle.id,
      articleTitle: selectedArticle.title,
      authorName: authUser.name,
      authorEmail: authUser.email.trim().toLowerCase(),
      content: normalizedContent,
      createdAt: new Date().toISOString()
    };

    setCommentsByArticle((prev) => {
      const currentArticleComments = prev[selectedArticle.id] || [];
      return {
        ...prev,
        [selectedArticle.id]: [newComment, ...currentArticleComments]
      };
    });

    setCommentDraft("");
    setCommentError("");
  }

  function canEditComment(comment) {
    if (!currentUserEmail) return false;
    return comment?.authorEmail === currentUserEmail;
  }

  function canDeleteComment(comment) {
    if (!authUser) return false;
    if (authUser.role === "admin") return true;
    return canEditComment(comment);
  }

  function startEditComment(comment) {
    if (!canEditComment(comment)) return;
    setEditingCommentId(comment.id);
    setEditingCommentArticleId(comment.articleId);
    setEditingCommentDraft(comment.content || "");
    setCommentEditError("");
  }

  function cancelEditComment() {
    setEditingCommentId("");
    setEditingCommentArticleId(null);
    setEditingCommentDraft("");
    setCommentEditError("");
  }

  function toggleSaveArticle(article) {
    if (!article || !article.id) return;
    
    setSavedArticles((prev) => {
      const exists = prev.some(item => item.id === article.id);
      
      if (exists) {
        // Remove from saved
        return prev.filter(item => item.id !== article.id);
      } else {
        // Add to saved
        const savedEntry = {
          id: article.id,
          title: article.title,
          description: article.description,
          image: article.image,
          category: article.category,
          author: article.author,
          savedAt: new Date().toISOString()
        };
        return [savedEntry, ...prev];
      }
    });
  }

  function isArticleSaved(articleId) {
    return savedArticles.some(item => item.id === articleId);
  }

  function toggleLikeArticle(article) {
    if (!article || !article.id) return;
    
    setLikedArticles((prev) => {
      const exists = prev.some(item => item.id === article.id);
      
      if (exists) {
        return prev.filter(item => item.id !== article.id);
      } else {
        const likedEntry = {
          id: article.id,
          title: article.title,
          summary: article.summary,
          image: article.image,
          category: article.category,
          author: article.author,
          likedAt: new Date().toISOString()
        };
        return [likedEntry, ...prev];
      }
    });
  }

  function isArticleLiked(articleId) {
    return likedArticles.some(item => item.id === articleId);
  }

  function removeFromHistory(articleId) {
    setReadHistory((prev) => prev.filter(item => item.id !== articleId));
  }

  function clearAllHistory() {
    setConfirmAction({
      title: "Xóa tất cả lịch sử",
      message: "Bạn có chắc muốn xóa toàn bộ lịch sử đọc tin? Hành động này không thể hoàn tác.",
      onConfirm: () => {
        setReadHistory([]);
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }

  function clearAllSaved() {
    setConfirmAction({
      title: "Bỏ lưu tất cả",
      message: "Bạn có chắc muốn bỏ lưu toàn bộ tin đã lưu? Hành động này không thể hoàn tác.",
      onConfirm: () => {
        setSavedArticles([]);
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }

  function clearAllMyComments() {
    if (!currentUserEmail) return;

    setConfirmAction({
      title: "Xóa tất cả bình luận",
      message: "Bạn có chắc muốn xóa toàn bộ bình luận của mình? Hành động này không thể hoàn tác.",
      onConfirm: () => {
        setCommentsByArticle((prev) => {
          const next = {};

          Object.entries(prev).forEach(([articleId, comments]) => {
            const filtered = comments.filter((item) => item.authorEmail !== currentUserEmail);
            if (filtered.length > 0) {
              next[articleId] = filtered;
            }
          });

          return next;
        });

        if (editingCommentId) {
          cancelEditComment();
        }

        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }

  function saveEditedComment() {
    if (!editingCommentId || !editingCommentArticleId) return;

    const normalizedContent = editingCommentDraft.trim();
    if (normalizedContent.length < 2) {
      setCommentEditError("Nội dung bình luận phải từ 2 ký tự.");
      return;
    }

    if (normalizedContent.length > 500) {
      setCommentEditError("Nội dung bình luận không quá 500 ký tự.");
      return;
    }

    setCommentsByArticle((prev) => {
      const source = prev[editingCommentArticleId] || [];
      return {
        ...prev,
        [editingCommentArticleId]: source.map((item) => {
          if (item.id !== editingCommentId) return item;
          return {
            ...item,
            content: normalizedContent,
            editedAt: new Date().toISOString()
          };
        })
      };
    });

    cancelEditComment();
  }

  function deleteComment(comment) {
    if (!canDeleteComment(comment)) return;

    setConfirmAction({
      title: "Xóa bình luận",
      message: "Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.",
      onConfirm: () => {
        setCommentsByArticle((prev) => {
          const source = prev[comment.articleId] || [];
          const filtered = source.filter((item) => item.id !== comment.id);
          const next = { ...prev };

          if (filtered.length === 0) {
            delete next[comment.articleId];
          } else {
            next[comment.articleId] = filtered;
          }

          return next;
        });

        if (editingCommentId === comment.id) {
          cancelEditComment();
        }

        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  }

  function goHomePage() {
    setActiveSectionMenu("Trang chủ");
    setActiveMenuItem("Trang chủ");
    setSelectedCategory("all");
    setPage(1);
    setPlayingVideoId(null);
    setSelectedArticle(null);
    setSearchInput("");
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleMenuNavigation(item) {
    setActiveSectionMenu(item);
    setActiveMenuItem("Trang chủ");
    setSearchInput("");
    setSearchQuery("");
    setSelectedArticle(null);

    const sectionMap = {
      "Mới nhất": latestSectionRef,
      "Cá nhân hóa": personalizationSectionRef,
      Video: videoSectionRef,
      Podcast: podcastSectionRef,
      "Dữ liệu": dataSectionRef,
      "Liên hệ": contactSectionRef
    };

    if (item === "Trang chủ") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const targetRef = sectionMap[item];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setActiveSectionMenu("Trang chủ");
    setSearchQuery(searchInput.trim());
    setSearchFocused(false);
    setActiveMenuItem("Trang chủ");
    setPage(1);
    setSelectedArticle(null);
  }

  function selectSearchSuggestion(article) {
    const title = article?.title || "";
    setActiveSectionMenu("Trang chủ");
    setSearchInput(title);
    setSearchQuery(title);
    setSearchFocused(false);
    setActiveMenuItem("Trang chủ");
    setPage(1);
    setSelectedArticle(null);
  }

  function getArticleContent(article) {
    if (article?.content && typeof article.content === "string" && article.content.trim()) {
      return article.content;
    }

    const summary = article?.summary || "";
    return [
      summary,
      "Trong bối cảnh hiện nay, các bên liên quan đang tập trung vào việc nâng cao chất lượng triển khai và khả năng phối hợp đa ngành để tạo hiệu quả bền vững.",
      "Nhiệm vụ trọng tâm ở giai đoạn tiếp theo là đảm bảo tiến độ, tối ưu chi phí vận hành và mở rộng tác động tích cực đến người dùng cuối.",
      "Các chuyên gia nhận định đây là thời điểm quan trọng để tăng tốc đổi mới, đồng thời xây dựng hệ thống đánh giá minh bạch nhằm nâng cao độ tin cậy của dữ liệu."
    ].join("\n\n");
  }

  function promptVipRequiredForFriendFeature(message) {
    const nextMessage = message || "Chỉ tài khoản VIP mới có thể kết bạn. Vui lòng đăng ký VIP để sử dụng tính năng này.";
    setAuthError(nextMessage);
    setVipError(nextMessage);
    setVipSuccess("");
    setShowVipUpgrade(true);
    addNotification(nextMessage, "vip");
  }

  async function handleAddFriend(friendId) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !authUser) {
      setAuthOpen(true);
      setAuthMode("login");
      return;
    }

    if (!Number.isFinite(friendId) || friendId <= 0 || friendId === authUser.id) {
      return;
    }

    if (!canUseFriendFeature) {
      promptVipRequiredForFriendFeature();
      return;
    }

    if (friendIdSet.has(friendId)) {
      return;
    }

    if (incomingFriendRequestIdSet.has(friendId)) {
      handleAcceptFriendRequest(friendId);
      return;
    }

    if (outgoingFriendRequestIdSet.has(friendId)) {
      return;
    }

    setFriendActionLoadingByUser((prev) => ({ ...prev, [friendId]: true }));
    setAuthError("");

    try {
      const response = await fetch(`/api/auth/friends/${friendId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 && data.code === "VIP_REQUIRED_FOR_FRIENDS") {
          promptVipRequiredForFriendFeature(data.message);
          return;
        }
        throw new Error(data.message || "Không thể kết bạn lúc này");
      }

      if (data.user) {
        setAuthUser(data.user);
      }

      if (Array.isArray(data.friends)) {
        setFriends(data.friends);
      }
      if (Array.isArray(data.incomingRequests)) {
        setIncomingFriendRequests(data.incomingRequests);
      }
      if (Array.isArray(data.outgoingRequests)) {
        setOutgoingFriendRequests(data.outgoingRequests);
      }

      if (data.message) {
        setAuthSuccess(data.message);
        setTimeout(() => setAuthSuccess(""), 2200);
      }
    } catch (error) {
      setAuthError(error.message || "Đã xảy ra lỗi khi kết bạn");
    } finally {
      setFriendActionLoadingByUser((prev) => {
        const next = { ...prev };
        delete next[friendId];
        return next;
      });
    }
  }

  async function handleAcceptFriendRequest(friendId) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !authUser) {
      return;
    }

    if (!Number.isFinite(friendId) || friendId <= 0) {
      return;
    }

    if (!canUseFriendFeature) {
      promptVipRequiredForFriendFeature("Chỉ tài khoản VIP mới có thể chấp nhận lời mời kết bạn. Vui lòng đăng ký VIP.");
      return;
    }

    setFriendAcceptingByUser((prev) => ({ ...prev, [friendId]: true }));
    setAuthError("");

    try {
      const response = await fetch(`/api/auth/friends/${friendId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 && data.code === "VIP_REQUIRED_FOR_FRIENDS") {
          promptVipRequiredForFriendFeature(data.message);
          return;
        }
        throw new Error(data.message || "Không thể chấp nhận lời mời kết bạn");
      }

      if (data.user) {
        setAuthUser(data.user);
      }
      if (Array.isArray(data.friends)) {
        setFriends(data.friends);
      }
      if (Array.isArray(data.incomingRequests)) {
        setIncomingFriendRequests(data.incomingRequests);
      }
      if (Array.isArray(data.outgoingRequests)) {
        setOutgoingFriendRequests(data.outgoingRequests);
      }
      if (data.message) {
        setAuthSuccess(data.message);
        setTimeout(() => setAuthSuccess(""), 2200);
      }
    } catch (error) {
      setAuthError(error.message || "Đã xảy ra lỗi khi chấp nhận lời mời");
    } finally {
      setFriendAcceptingByUser((prev) => {
        const next = { ...prev };
        delete next[friendId];
        return next;
      });
    }
  }

  async function handleUnfriend(friendId) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !authUser) return;
    if (!Number.isFinite(friendId) || friendId <= 0) return;

    const friend = [
      ...friends,
      ...incomingFriendRequests,
      ...outgoingFriendRequests
    ].find((item) => item.id === friendId);
    const friendName = friend?.name || "người dùng này";

    const isIncomingRequest = incomingFriendRequestIdSet.has(friendId);
    const isOutgoingRequest = outgoingFriendRequestIdSet.has(friendId);
    const title = isIncomingRequest
      ? "Từ chối lời mời kết bạn"
      : isOutgoingRequest
        ? "Hủy lời mời kết bạn"
        : "Xác nhận hủy kết bạn";
    const message = isIncomingRequest
      ? `Bạn có chắc muốn từ chối lời mời kết bạn từ ${friendName}?`
      : isOutgoingRequest
        ? `Bạn có chắc muốn hủy lời mời kết bạn đã gửi cho ${friendName}?`
        : `Bạn có chắc muốn hủy kết bạn với ${friendName}?`;

    setConfirmAction({
      title,
      message,
      onConfirm: async () => {
        setShowConfirmModal(false);
        setFriendRemovingByUser((prev) => ({ ...prev, [friendId]: true }));

        try {
          const response = await fetch(`/api/auth/friends/${friendId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Không thể hủy kết bạn");
          }

          if (data.user) {
            setAuthUser(data.user);
          }

          if (Array.isArray(data.friends)) {
            setFriends(data.friends);
          }
          if (Array.isArray(data.incomingRequests)) {
            setIncomingFriendRequests(data.incomingRequests);
          }
          if (Array.isArray(data.outgoingRequests)) {
            setOutgoingFriendRequests(data.outgoingRequests);
          }

          if (data.message) {
            setAuthSuccess(data.message);
            setTimeout(() => setAuthSuccess(""), 2200);
          }
        } catch (error) {
          setAuthError(error.message || "Đã xảy ra lỗi khi hủy kết bạn");
        } finally {
          setFriendRemovingByUser((prev) => {
            const next = { ...prev };
            delete next[friendId];
            return next;
          });
        }
      }
    });
    setShowConfirmModal(true);
  }

  function renderAddFriendButton(article, className = "") {
    const creatorId = Number.parseInt(article?.createdBy, 10);
    if (!Number.isFinite(creatorId) || creatorId <= 0) {
      return null;
    }

    if (creatorId === authUser?.id) {
      return <span className={`friend-chip self ${className}`.trim()}>Bài của bạn</span>;
    }

    const isFriend = friendIdSet.has(creatorId);
    const hasIncomingRequest = incomingFriendRequestIdSet.has(creatorId);
    const hasOutgoingRequest = outgoingFriendRequestIdSet.has(creatorId);
    const isLoading = Boolean(friendActionLoadingByUser[creatorId]);
    const isAccepting = Boolean(friendAcceptingByUser[creatorId]);
    const requiresVip = Boolean(authUser && !canUseFriendFeature);

    return (
      <button
        type="button"
        className={`add-friend-btn ${className}`.trim()}
        onClick={(event) => {
          event.stopPropagation();
          if (hasIncomingRequest) {
            handleAcceptFriendRequest(creatorId);
            return;
          }
          handleAddFriend(creatorId);
        }}
        disabled={isLoading || isAccepting || isFriend || hasOutgoingRequest}
      >
        {isAccepting
          ? "Đang chấp nhận..."
          : isLoading
            ? "Đang gửi..."
            : isFriend
              ? "Đã là bạn"
              : requiresVip
                ? "Cần VIP"
              : hasIncomingRequest
                ? "Chấp nhận"
                : hasOutgoingRequest
                  ? "Đã gửi lời mời"
                  : "Add Friend"}
      </button>
    );
  }

  function renderPersonalizationSection(sectionId = "default", sectionRef = undefined) {
    return (
      <section className="ai-home-shell" aria-label="Cá nhân hóa nội dung" data-section-id={sectionId} ref={sectionRef}>
        <article className="ai-personal-panel">
          <div className="ai-panel-head">
            <p>Cá nhân hóa</p>
            <h2>Gợi ý nội dung cho bạn</h2>
            <p>
              {hasBehaviorData
                ? "Mục gợi ý được tính từ lịch sử đọc, bài đã lưu và bài đã thích của bạn."
                : "Bạn chưa có dữ liệu hành vi, hệ thống đang sử dụng xu hướng chung để đề xuất."}
            </p>
          </div>

          <div className="ai-interest-tags">
            {preferredCategoryDetails.length === 0 ? (
              <span className="ai-interest-tag">Đề xuất tổng hợp</span>
            ) : (
              preferredCategoryDetails.map((item) => (
                <span className="ai-interest-tag" key={`pref-${sectionId}-${item.label}`}>
                  {item.label}
                </span>
              ))
            )}
          </div>

          <div className="ai-recommend-list">
            {personalizedHighlights.map((article) => (
              <button
                key={`personal-${sectionId}-${article.id}`}
                type="button"
                className="ai-recommend-item"
                onClick={() => openArticleDetail(article)}
              >
                <img src={article.image} alt={article.title} loading="lazy" />
                <div>
                  <span>{article.category}</span>
                  <p>{article.title}</p>
                </div>
              </button>
            ))}
          </div>
        </article>
      </section>
    );
  }

  function onContactFieldChange(event) {
    const { name, value } = event.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  }

  function onContactFilesChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
    const videoFiles = selectedFiles.filter((file) => file.type.startsWith("video/"));

    if (imageFiles.length > MAX_IMAGE_FILES) {
      setContactError(`Chỉ được chọn tối đa ${MAX_IMAGE_FILES} ảnh.`);
      return;
    }

    if (videoFiles.length > MAX_VIDEO_FILES) {
      setContactError(`Chỉ được chọn tối đa ${MAX_VIDEO_FILES} video.`);
      return;
    }

    const oversizedImage = imageFiles.find((file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);
    if (oversizedImage) {
      setContactError(`Ảnh \"${oversizedImage.name}\" vượt quá ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    const oversizedVideo = videoFiles.find((file) => file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024);
    if (oversizedVideo) {
      setContactError(`Video \"${oversizedVideo.name}\" vượt quá ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }

    setContactError("");
    setContactForm((prev) => ({ ...prev, files: selectedFiles }));
  }

  async function onContactSubmit(event) {
    event.preventDefault();
    setContactError("");
    setContactSuccess("");

    if (contactForm.title.trim().length < 5) {
      setContactError("Tiêu đề cần ít nhất 5 ký tự.");
      return;
    }

    if (contactForm.content.trim().length < 20) {
      setContactError("Nội dung cần ít nhất 20 ký tự để tòa soạn dễ xử lý.");
      return;
    }

    if (contactForm.fullName.trim().length < 2) {
      setContactError("Vui lòng nhập họ và tên hợp lệ.");
      return;
    }

    if (!EMAIL_PATTERN.test(contactForm.email.trim())) {
      setContactError("Email không đúng định dạng.");
      return;
    }

    try {
      setContactSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 450));

      setContactSuccess("Đã gửi liên hệ thành công. Tòa soạn sẽ phản hồi sớm nhất.");
      setContactForm((prev) => ({
        ...prev,
        title: "",
        content: "",
        files: []
      }));
    } catch {
      setContactError("Không thể gửi liên hệ lúc này. Vui lòng thử lại sau.");
    } finally {
      setContactSubmitting(false);
    }
  }

  if (loading) {
    return <p className="status-text">Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p className="status-text error">{error}</p>;
  }

  return (
    <div className="page-shell">
      <SpinWheel key={authUser?.id || 'guest'} authUser={authUser} onSpinRequest={handleSpinWheelRequest} />
      <main className="news-layout">
        <div className="top-accent" />
        <header className="site-header">
          <div className="header-left">
            <button type="button" className="site-logo" onClick={goHomePage} aria-label="Về trang chủ">
              NEWSAI
            </button>
            <div className="header-meta">
              <p>Đà Nẵng</p>
              <p>{formatDate(Date.now())}</p>
            </div>
            <div className="weather-pill">
              <span className="weather-dot" />
              <span>21degC</span>
            </div>
          </div>

          <div className="header-right">
            <div className="partner-links">
              {partnerLinks.map((item) => (
                <button key={item} type="button" className="partner-item">
                  <span className="partner-badge">{item[0]}</span>
                  <span>{item}</span>
                </button>
              ))}
            </div>
            <div className="account-actions">
              <form className="search-form" onSubmit={handleSearchSubmit} ref={searchFormRef}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSearchFocused(false);
                    }
                  }}
                  placeholder="Nhập từ khóa..."
                  aria-label="Tìm kiếm bài viết"
                />
                <button type="submit" className="icon-btn" aria-label="Tìm kiếm">
                  Tìm
                </button>

                {showSearchSuggestions && (
                  <div className="search-suggest-panel" role="listbox" aria-label="Gợi ý tìm kiếm">
                    {liveSearchResults.length === 0 ? (
                      <p className="search-suggest-empty">Không có bài phù hợp với từ khóa đang nhập.</p>
                    ) : (
                      liveSearchResults.map((item) => (
                        <button
                          key={`suggest-${item.id}`}
                          type="button"
                          className="search-suggest-item"
                          onClick={() => selectSearchSuggestion(item)}
                        >
                          <p className="search-suggest-title">{renderHighlightedText(item.title, searchInput)}</p>
                          <p className="search-suggest-meta">{item.category}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </form>
              <div className="notification-menu-container" ref={notificationMenuRef}>
                <button
                  type="button"
                  className="notification-btn"
                  onClick={toggleNotifications}
                  aria-label="Thông báo hoạt động"
                >
                  <span className="notification-icon">🔔</span>
                  {unreadNotificationCount > 0 && <span className="notification-badge">{unreadNotificationCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <h4>Thông báo</h4>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="notification-empty">Chưa có hoạt động mới.</p>
                    ) : (
                      <div className="notification-list">
                        {notifications.map((item) => (
                          <div key={item.id} className={`notification-item notification-${item.type}`}>
                            <p>{item.message}</p>
                            <span>{formatNotificationTime(item.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {authUser ? (
                <>
                  <div className="user-menu-container" ref={userMenuRef}>
                    <button
                      type="button"
                      className="login-btn user-btn"
                      onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                      }}
                    >
                      <UserAvatar
                        name={authUser.name}
                        avatar={authUser.avatar}
                        className="user-avatar"
                        onClick={() =>
                          openAvatarPreview({
                            userId: authUser.id,
                            name: authUser.name,
                            avatar: authUser.avatar,
                            canChange: true
                          })
                        }
                        title="Ấn để xem ảnh đại diện"
                      />
                      <span>Xin chào, {authUser.name}</span>
                    </button>
                    {showUserMenu && (
                      <div className="user-dropdown">
                        <div className="user-dropdown-header">
                          <UserAvatar
                            name={authUser.name}
                            avatar={authUser.avatar}
                            className="user-dropdown-avatar"
                            onClick={() =>
                              openAvatarPreview({
                                userId: authUser.id,
                                name: authUser.name,
                                avatar: authUser.avatar,
                                canChange: true
                              })
                            }
                            title="Ấn để xem ảnh đại diện"
                          />
                          <div>
                            <div className="user-dropdown-name">{authUser.name}</div>
                            <div className="user-dropdown-email">{authUser.email}</div>
                          </div>
                        </div>
                        <div className="user-dropdown-divider"></div>
                        <button type="button" className="user-dropdown-item" onClick={() => openProfilePage("info")}>
                          <span className="dropdown-icon">👤</span>
                          Thông tin tài khoản
                        </button>
                        <button type="button" className="user-dropdown-item" onClick={() => openProfilePage("comments")}>
                          <span className="dropdown-icon">💬</span>
                          Hoạt động bình luận
                        </button>
                        <button type="button" className="user-dropdown-item" onClick={() => openProfilePage("mynews")}>
                          <span className="dropdown-icon">📰</span>
                          Bảng tin của bạn
                        </button>
                        <button type="button" className="user-dropdown-item" onClick={() => openProfilePage("viewed")}>
                          <span className="dropdown-icon">👁️</span>
                          Tin đã xem
                        </button>
                        <button type="button" className="user-dropdown-item" onClick={() => openProfilePage("saved")}>
                          <span className="dropdown-icon">🔖</span>
                          Tin đã lưu
                        </button>
                        {authUser.role === "admin" && (
                          <>
                            <div className="user-dropdown-divider"></div>
                            <button type="button" className="user-dropdown-item admin-item" onClick={() => { setShowUserMenu(false); openAdminPanel(); }}>
                              <span className="dropdown-icon">⚙️</span>
                              Quản trị hệ thống
                            </button>
                          </>
                        )}
                        <div className="user-dropdown-divider"></div>
                        <button type="button" className="user-dropdown-item logout-item" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                          <span className="dropdown-icon">🚪</span>
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="login-btn"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setAuthSuccess("");
                    setAuthOpen(true);
                  }}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="menu-shell">
          <nav className="menu-main" aria-label="Menu chính">
            {menuItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`${activeSectionMenu === item ? "active" : ""} ${item === "Trang chủ" ? "menu-home" : ""} ${item === "Cá nhân hóa" ? "menu-personalize" : ""}`.trim()}
                onClick={() => handleMenuNavigation(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          {isHomePage && (
            <nav className="menu-categories" aria-label="Danh mục tin tức">
              <button
                type="button"
                className={selectedCategory === "all" ? "active" : ""}
                onClick={() => handleCategoryChange("all")}
              >
                Tất cả
              </button>
              {news.categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={selectedCategory === item ? "active" : ""}
                  onClick={() => handleCategoryChange(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
          )}
        </section>

        {isHomePage ? (
          <>
            {hasActiveSearch ? (
              <section className="search-results-block">
                <h2>
                  Kết quả tìm kiếm cho: <span>"{searchQuery}"</span>
                </h2>
                <p>Tìm thấy {filteredNews.length} bài phù hợp.</p>

                {filteredNews.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🔎</span>
                    <p>Không tìm thấy bài viết phù hợp. Vui lòng thử từ khóa khác.</p>
                  </div>
                ) : (
                  <div className="latest-list-grid">
                    {filteredNews.map((item) => (
                      <article
                        className="latest-card detail-clickable"
                        key={`search-${item.id}`}
                        onClick={() => openArticleDetail(item)}
                      >
                        <img src={item.image} alt={item.title} loading="lazy" />
                        <div>
                          <p className="category">{item.category}</p>
                          <h3>{renderHighlightedText(item.title, searchQuery)}</h3>
                          <p className="latest-summary">{renderHighlightedText(item.summary, searchQuery)}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
            <section className="headline-ticker" aria-label="Tin nóng">
              <span className="ticker-label">TIN NÓNG</span>
              <div className="ticker-track">
                {news.trending.map((item) => (
                  <span key={`ticker-${item.id}`}>{item.title}</span>
                ))}
              </div>
            </section>

            <section className="micro-info-grid" aria-label="Thông tin nhanh thị trường">
              {quickInfoWidgets.map((widget) => (
                <article
                  className={`micro-info-card ${activeQuickInfoWidgetId === widget.id ? "active" : ""}`}
                  key={widget.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveQuickInfoWidgetId((currentId) => (currentId === widget.id ? "" : widget.id))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveQuickInfoWidgetId((currentId) => (currentId === widget.id ? "" : widget.id));
                    }
                  }}
                >
                  <div className="micro-info-top">
                    <span className="micro-info-icon">{widget.icon}</span>
                    <p>{widget.label}</p>
                  </div>
                  <strong>{widget.value}</strong>
                  <span
                    className={`micro-info-trend ${widget.trendUp === true ? "up" : ""} ${widget.trendUp === false ? "down" : ""}`}
                  >
                    {widget.trend}
                  </span>

                  {activeQuickInfoWidgetId === widget.id && quickInfoDetailsByWidget[widget.id] && (
                    <div className="micro-info-inline-details">
                      {Array.isArray(quickInfoDetailsByWidget[widget.id].rows) &&
                        quickInfoDetailsByWidget[widget.id].rows.map((detailRow, detailIndex) => (
                        <div className="micro-info-inline-row" key={`${widget.id}-${detailRow.label}-${detailIndex}`}>
                          <p>{detailRow.label}</p>
                          <strong>{detailRow.value}</strong>
                        </div>
                        ))}
                    </div>
                  )}
                </article>
              ))}
            </section>

            {authUser && (
              <section className="friends-home-panel" aria-label="Bạn bè của bạn">
                <div className="friends-home-head">
                  <h3>Bạn bè của bạn</h3>
                  <span>{friends.length} người • {incomingFriendRequests.length} lời mời</span>
                </div>
                {friends.length === 0 ? (
                  <p className="friends-empty">Bạn chưa có bạn bè. Hãy dùng nút Add Friend ở các bài viết mới.</p>
                ) : (
                  <div className="friends-home-list">
                    {friends.map((friend) => (
                      <article className="friend-pill" key={`friend-${friend.id}`}>
                            <div className="friend-pill-content">
                              <strong>{friend.name}</strong>
                              <small>{friend.email}</small>
                            </div>
                            <button type="button" className="btn-chat-mini" onClick={() => openChatWithFriend(friend)}>
                              Chat
                            </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="hero-news-grid">
              <div className="left-stack">
                {leftColumn.map((item) => (
                  <article className="small-feature detail-clickable" key={item.id} onClick={() => openArticleDetail(item)}>
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <h3>{item.title}</h3>
                    <div className="article-author-row">
                      <span>{item.author || "Ban biên tập"}</span>
                      {renderAddFriendButton(item)}
                    </div>
                  </article>
                ))}
              </div>

              {hero && (
                <article className="main-story detail-clickable" onClick={() => openArticleDetail(hero)}>
                  <img src={hero.image} alt={hero.title} />
                  <h2>{hero.title}</h2>
                  <p>{hero.summary}</p>
                  <div className="article-author-row">
                    <span>{hero.author || "Ban biên tập"}</span>
                    {renderAddFriendButton(hero)}
                  </div>
                </article>
              )}

              <aside className="headline-list">
                {rightColumn.map((item) => (
                  <article key={item.id} className="detail-clickable" onClick={() => openArticleDetail(item)}>
                    <h3>{item.title}</h3>
                    <div className="side-row">
                      <span>{item.category}</span>
                      <span>
                        {new Date(item.publishedAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <div className="article-author-row compact">
                      <span>{item.author || "Ban biên tập"}</span>
                      {renderAddFriendButton(item)}
                    </div>
                  </article>
                ))}
              </aside>
            </section>

            <section className="spotlight-block" ref={latestSectionRef}>
              <h2>Tin mới nhất</h2>
              <div className="spotlight-grid">
                {spotlight.map((item) => (
                  <article className="spotlight-card detail-clickable" key={`spot-${item.id}`} onClick={() => openArticleDetail(item)}>
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <div>
                      <p className="category">{item.category}</p>
                      <h3>{item.title}</h3>
                      <div className="article-author-row compact">
                        <span>{item.author || "Ban biên tập"}</span>
                        {renderAddFriendButton(item)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="latest-stream-wrap">
                <div className="latest-stream-header">
                  <p>Đang hiển thị tối đa 50 bài mới nhất theo từng chuyên mục.</p>
                </div>

                <section className="top-articles-section">
                  <div className="top-articles-header">
                    <h2>📊 Top bài viết</h2>
                    <div className="top-articles-tabs">
                      <button
                        type="button"
                        className={topArticlesTab === "viewed" ? "active" : ""}
                        onClick={() => setTopArticlesTab("viewed")}
                      >
                        👁️ Xem nhiều
                      </button>
                      <button
                        type="button"
                        className={topArticlesTab === "liked" ? "active" : ""}
                        onClick={() => setTopArticlesTab("liked")}
                      >
                        ❤️ Thích nhiều
                      </button>
                      <button
                        type="button"
                        className={topArticlesTab === "accessed" ? "active" : ""}
                        onClick={() => setTopArticlesTab("accessed")}
                      >
                        🔥 Truy cập nhiều
                      </button>
                    </div>
                  </div>

                  <div className="top-articles-list">
                    {topArticlesTab === "viewed" && (
                      topArticlesByViews.length === 0 ? (
                        <p className="top-articles-empty">Chưa có bài viết nào được xem.</p>
                      ) : (
                        topArticlesByViews.map((article, index) => (
                          <article
                            key={`top-viewed-${article.id}`}
                            className="top-article-item"
                            onClick={() => openArticleDetail(article)}
                          >
                            <span className="top-article-rank">#{index + 1}</span>
                            <img src={article.image} alt={article.title} />
                            <div className="top-article-content">
                              <h4>{article.title}</h4>
                              <div className="top-article-stats">
                                <span className="top-article-category">{article.category}</span>
                                <span className="top-article-count">👁️ {article.viewCount} lượt xem</span>
                              </div>
                            </div>
                          </article>
                        ))
                      )
                    )}

                    {topArticlesTab === "liked" && (
                      topArticlesByLikes.length === 0 ? (
                        <p className="top-articles-empty">Chưa có bài viết nào được thích.</p>
                      ) : (
                        topArticlesByLikes.map((article, index) => (
                          <article
                            key={`top-liked-${article.id}`}
                            className="top-article-item"
                            onClick={() => openArticleDetail(article)}
                          >
                            <span className="top-article-rank">#{index + 1}</span>
                            <img src={article.image} alt={article.title} />
                            <div className="top-article-content">
                              <h4>{article.title}</h4>
                              <div className="top-article-stats">
                                <span className="top-article-category">{article.category}</span>
                                <span className="top-article-count">❤️ {article.likeCount} lượt thích</span>
                              </div>
                            </div>
                          </article>
                        ))
                      )
                    )}

                    {topArticlesTab === "accessed" && (
                      topArticlesByAccess.length === 0 ? (
                        <p className="top-articles-empty">Chưa có lịch sử truy cập.</p>
                      ) : (
                        topArticlesByAccess.map((article, index) => (
                          <article
                            key={`top-accessed-${article.id}`}
                            className="top-article-item"
                            onClick={() => openArticleDetail(article)}
                          >
                            <span className="top-article-rank">#{index + 1}</span>
                            <img src={article.image} alt={article.title} />
                            <div className="top-article-content">
                              <h4>{article.title}</h4>
                              <div className="top-article-stats">
                                <span className="top-article-category">{article.category}</span>
                                <span className="top-article-count">🔥 {article.accessCount} lần truy cập</span>
                              </div>
                            </div>
                          </article>
                        ))
                      )
                    )}
                  </div>
                </section>

                {latestGroupedByCategory.map((group) => (
                  <section className="category-stream-section" key={`group-${group.category}`}>
                    <div className="category-stream-title-row">
                      <h3>{group.category}</h3>
                      <span>{group.items.length} bài</span>
                    </div>
                    <div className="category-stream-grid">
                      {group.items.map((item) => (
                        <article className="latest-card detail-clickable" key={`latest-${item.id}`} onClick={() => openArticleDetail(item)}>
                          <img src={item.image} alt={item.title} loading="lazy" />
                          <div>
                            <p className="category">{item.category}</p>
                            <h3>{item.title}</h3>
                            <p className="latest-summary">{item.summary}</p>
                            <div className="article-author-row compact">
                              <span>{item.author || "Ban biên tập"}</span>
                              {renderAddFriendButton(item)}
                            </div>
                            {authUser?.role === "admin" && (
                              <div className="admin-actions">
                                <button type="button" className="btn-edit" onClick={(e) => { e.stopPropagation(); handleEditNews(item); }}>Sửa</button>
                                <button type="button" className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteNews(item.id); }}>Xóa</button>
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            {renderPersonalizationSection("home-latest", personalizationSectionRef)}

            <section className="menu-page-shell home-linear-section theme-video" ref={videoSectionRef}>
              <header className="menu-page-head">
                <p>Video</p>
                <h2>{MENU_PAGES.Video.title}</h2>
                <p>{MENU_PAGES.Video.description}</p>
              </header>
              <div className="media-quick-grid">
                {SHORT_VIDEO_ITEMS.map((item) => (
                  <article className="media-quick-card" key={`home-video-${item.id}`}>
                    <div className="media-thumb-wrap">
                      <img className="media-thumb" src={item.thumbnail} alt={item.title} loading="lazy" />
                      <span className="media-duration">{item.duration}</span>
                    </div>
                    <div className="media-meta">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <button
                        type="button"
                        className="media-action-btn"
                        onClick={() => setPlayingVideoId((prev) => (prev === item.id ? null : item.id))}
                      >
                        {playingVideoId === item.id ? "Đóng video" : "Xem video ngắn"}
                      </button>
                    </div>

                    {playingVideoId === item.id && (
                      <div className="media-player-wrap">
                        {item.type === "youtube" ? (
                          <iframe
                            className="media-player"
                            src={item.embedUrl}
                            title={item.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <video className="media-player" src={item.mediaUrl} controls preload="metadata">
                            Trình duyệt không hỗ trợ video.
                          </video>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="menu-page-shell home-linear-section theme-podcast" ref={podcastSectionRef}>
              <header className="menu-page-head">
                <p>Podcast</p>
                <h2>{MENU_PAGES.Podcast.title}</h2>
                <p>{MENU_PAGES.Podcast.description}</p>
              </header>
              <div className="media-quick-grid podcast-grid">
                {SHORT_PODCAST_ITEMS.map((item) => (
                  <article className="media-quick-card podcast-card" key={`home-podcast-${item.id}`}>
                    <div className="podcast-icon">🎧</div>
                    <div className="media-meta">
                      <p className="podcast-host">{item.host}</p>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <audio className="podcast-audio" controls preload="none" src={item.audioUrl}>
                        Trình duyệt không hỗ trợ audio.
                      </audio>
                      <div className="podcast-footer-row">
                        <span className="media-duration">{item.duration}</span>
                        <span className="podcast-note">Có thể play/pause trực tiếp tại player</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="menu-page-shell home-linear-section theme-data" ref={dataSectionRef}>
              <header className="menu-page-head">
                <p>Dữ liệu</p>
                <h2>{MENU_PAGES["Dữ liệu"].title}</h2>
                <p>{MENU_PAGES["Dữ liệu"].description}</p>
              </header>
              {renderDataInsightCards("home-data")}
            </section>

            <section className="menu-page-shell home-linear-section theme-contact" ref={contactSectionRef}>
              <header className="menu-page-head">
                <p>Liên hệ</p>
                <h2>{MENU_PAGES["Liên hệ"].title}</h2>
                <p>{MENU_PAGES["Liên hệ"].description}</p>
              </header>
              <div className="contact-page-shell">
                <section className="contact-form-panel">
                  <h3>Liên hệ tòa soạn</h3>
                  <form className="contact-form" onSubmit={onContactSubmit}>
                    <label htmlFor="contact-title">Tiêu đề <span>*</span></label>
                    <input
                      id="contact-title"
                      name="title"
                      type="text"
                      value={contactForm.title}
                      onChange={onContactFieldChange}
                      required
                    />

                    <label htmlFor="contact-content">Nội dung <span>*</span></label>
                    <textarea
                      id="contact-content"
                      name="content"
                      rows={6}
                      value={contactForm.content}
                      onChange={onContactFieldChange}
                      required
                    />

                    <label htmlFor="contact-files">File đính kèm</label>
                    <div className="contact-file-box">
                      <div>
                        <p>Cho phép tối đa 5 ảnh (.jpeg, .jpg, .png) tối đa 5MB mỗi file.</p>
                        <p>Cho phép tối đa 2 video (.mp4, .mpeg) tối đa 200MB mỗi file.</p>
                        {contactForm.files.length > 0 && (
                          <p className="contact-file-count">Đã chọn: {contactForm.files.length} tệp</p>
                        )}
                      </div>
                      <label className="contact-file-btn" htmlFor="contact-files">Chọn file</label>
                      <input
                        id="contact-files"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,video/mp4,video/mpeg"
                        multiple
                        onChange={onContactFilesChange}
                      />
                    </div>

                    <label htmlFor="contact-fullName">Họ và tên</label>
                    <input
                      id="contact-fullName"
                      name="fullName"
                      type="text"
                      value={contactForm.fullName}
                      onChange={onContactFieldChange}
                      required
                    />

                    <label htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={contactForm.email}
                      onChange={onContactFieldChange}
                      required
                    />

                    {contactError && <p className="contact-message error">{contactError}</p>}
                    {contactSuccess && <p className="contact-message success">{contactSuccess}</p>}

                    <button type="submit" className="contact-submit-btn" disabled={contactSubmitting}>
                      {contactSubmitting ? "Đang gửi..." : "Gửi"}
                    </button>
                  </form>
                </section>

                <aside className="contact-info-panel">
                  <h3>Thông tin tòa soạn</h3>

                  <div className="contact-info-block">
                    <h4>Tòa soạn</h4>
                    <p>Số 120 đường 2/9, phường Hải Châu, thành phố Đà Nẵng</p>
                    <p><strong>Đường dây nóng:</strong> 0905.123.456</p>
                    <p><strong>Hotline Đà Nẵng:</strong> 0236-3818-888</p>
                    <p><strong>Email:</strong> toasoan@dantridanang.vn</p>
                  </div>

                  <div className="contact-info-block">
                    <h4>Văn phòng đại diện miền Trung</h4>
                    <p>Số 25 đường Nguyễn Văn Linh, phường Thanh Khê, thành phố Đà Nẵng</p>
                    <p><strong>Điện thoại:</strong> 0236-3555-222</p>
                    <p><strong>Fax:</strong> 0236-3555-223</p>
                    <p><strong>Hotline miền Trung:</strong> 0905-686-868</p>
                  </div>

                  <div className="contact-info-block">
                    <h4>Theo dõi tòa soạn</h4>
                    <p><strong>Liên hệ quảng cáo:</strong> 0905.909.303</p>
                    <p><strong>Email:</strong> quangcao@dantridanang.vn</p>
                  </div>
                </aside>
              </div>
            </section>
              </>
            )}
          </>
        ) : (
          <section className={`menu-page-shell ${activeMenuThemeClass}`}>
            <header className="menu-page-head">
              <p>{activeMenuItem}</p>
              <h2>{activeMenuPage.title}</h2>
              <p>{activeMenuPage.description}</p>
            </header>

            {activeMenuItem === "Video" ? (
              <div className="media-quick-grid">
                {SHORT_VIDEO_ITEMS.map((item) => (
                  <article className="media-quick-card" key={item.id}>
                    <div className="media-thumb-wrap">
                      <img className="media-thumb" src={item.thumbnail} alt={item.title} loading="lazy" />
                      <span className="media-duration">{item.duration}</span>
                    </div>
                    <div className="media-meta">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <button
                        type="button"
                        className="media-action-btn"
                        onClick={() => setPlayingVideoId((prev) => (prev === item.id ? null : item.id))}
                      >
                        {playingVideoId === item.id ? "Đóng video" : "Xem video ngắn"}
                      </button>
                    </div>

                    {playingVideoId === item.id && (
                      <div className="media-player-wrap">
                        {item.type === "youtube" ? (
                          <iframe
                            className="media-player"
                            src={item.embedUrl}
                            title={item.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <video className="media-player" src={item.mediaUrl} controls preload="metadata">
                            Trình duyệt không hỗ trợ video.
                          </video>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : activeMenuItem === "Podcast" ? (
              <div className="media-quick-grid podcast-grid">
                {SHORT_PODCAST_ITEMS.map((item) => (
                  <article className="media-quick-card podcast-card" key={item.id}>
                    <div className="podcast-icon">🎧</div>
                    <div className="media-meta">
                      <p className="podcast-host">{item.host}</p>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <audio className="podcast-audio" controls preload="none" src={item.audioUrl}>
                        Trình duyệt không hỗ trợ audio.
                      </audio>
                      <div className="podcast-footer-row">
                        <span className="media-duration">{item.duration}</span>
                        <span className="podcast-note">Có thể play/pause trực tiếp tại player</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : activeMenuItem === "Liên hệ" ? (
              <>
                <div className="contact-page-shell">
                  <section className="contact-form-panel">
                  <h3>Liên hệ tòa soạn</h3>
                  <form className="contact-form" onSubmit={onContactSubmit}>
                    <label htmlFor="contact-title">Tiêu đề <span>*</span></label>
                    <input
                      id="contact-title"
                      name="title"
                      type="text"
                      value={contactForm.title}
                      onChange={onContactFieldChange}
                      required
                    />

                    <label htmlFor="contact-content">Nội dung <span>*</span></label>
                    <textarea
                      id="contact-content"
                      name="content"
                      rows={6}
                      value={contactForm.content}
                      onChange={onContactFieldChange}
                      required
                    />

                    <label htmlFor="contact-files">File đính kèm</label>
                    <div className="contact-file-box">
                      <div>
                        <p>Cho phép tối đa 5 ảnh (.jpeg, .jpg, .png) tối đa 5MB mỗi file.</p>
                        <p>Cho phép tối đa 2 video (.mp4, .mpeg) tối đa 200MB mỗi file.</p>
                        {contactForm.files.length > 0 && (
                          <p className="contact-file-count">Đã chọn: {contactForm.files.length} tệp</p>
                        )}
                      </div>
                      <label className="contact-file-btn" htmlFor="contact-files">Chọn file</label>
                      <input
                        id="contact-files"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,video/mp4,video/mpeg"
                        multiple
                        onChange={onContactFilesChange}
                      />
                    </div>

                    <label htmlFor="contact-fullName">Họ và tên</label>
                    <input
                      id="contact-fullName"
                      name="fullName"
                      type="text"
                      value={contactForm.fullName}
                      onChange={onContactFieldChange}
                      required
                    />

                    <label htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={contactForm.email}
                      onChange={onContactFieldChange}
                      required
                    />

                    {contactError && <p className="contact-message error">{contactError}</p>}
                    {contactSuccess && <p className="contact-message success">{contactSuccess}</p>}

                    <button type="submit" className="contact-submit-btn" disabled={contactSubmitting}>
                      {contactSubmitting ? "Đang gửi..." : "Gửi"}
                    </button>
                  </form>
                  </section>

                  <aside className="contact-info-panel">
                  <h3>Thông tin tòa soạn</h3>

                  <div className="contact-info-block">
                    <h4>Tòa soạn</h4>
                    <p>Số 120 đường 2/9, phường Hải Châu, thành phố Đà Nẵng</p>
                    <p><strong>Đường dây nóng:</strong> 0905.123.456</p>
                    <p><strong>Hotline Đà Nẵng:</strong> 0236-3818-888</p>
                    <p><strong>Email:</strong> toasoan@dantridanang.vn</p>
                  </div>

                  <div className="contact-info-block">
                    <h4>Văn phòng đại diện miền Trung</h4>
                    <p>Số 25 đường Nguyễn Văn Linh, phường Thanh Khê, thành phố Đà Nẵng</p>
                    <p><strong>Điện thoại:</strong> 0236-3555-222</p>
                    <p><strong>Fax:</strong> 0236-3555-223</p>
                    <p><strong>Hotline miền Trung:</strong> 0905-686-868</p>
                  </div>

                  <div className="contact-info-block">
                    <h4>Theo dõi tòa soạn</h4>
                    <p><strong>Liên hệ quảng cáo:</strong> 0905.909.303</p>
                    <p><strong>Email:</strong> quangcao@dantridanang.vn</p>
                  </div>
                  </aside>
                </div>
              </>
            ) : activeMenuItem === "Dữ liệu" ? (
              renderDataInsightCards("menu-data")
            ) : (
              <div className="menu-page-grid">
                {(activeMenuPage.sections || []).map((sectionTitle) => (
                  <article className="menu-page-card" key={`${activeMenuItem}-${sectionTitle}`}>
                    <h3>{sectionTitle}</h3>
                    <p>
                      Nội dung đang được cập nhật cho chuyên mục {activeMenuItem.toLowerCase()}. Bạn có thể theo dõi để xem các bài viết và dữ liệu mới nhất trong phiên bản tiếp theo.
                    </p>
                    <button type="button" onClick={() => setActiveMenuItem("Trang chủ")}>Về trang chủ</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {selectedArticle && (
          <div className="article-detail-backdrop" onClick={closeArticleDetail}>
            <article className="article-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="article-detail-header-actions">
                <button 
                  type="button" 
                  className={`article-detail-like ${isArticleLiked(selectedArticle.id) ? 'liked' : ''}`}
                  onClick={() => toggleLikeArticle(selectedArticle)}
                  title={isArticleLiked(selectedArticle.id) ? "Đã thích" : "Thích bài viết"}
                >
                  {isArticleLiked(selectedArticle.id) ? '❤️ Đã thích' : '🤍 Thích'}
                </button>
                <button 
                  type="button" 
                  className={`article-detail-save ${isArticleSaved(selectedArticle.id) ? 'saved' : ''}`}
                  onClick={() => toggleSaveArticle(selectedArticle)}
                  title={isArticleSaved(selectedArticle.id) ? "Đã lưu" : "Lưu bài viết"}
                >
                  {isArticleSaved(selectedArticle.id) ? '🔖 Đã lưu' : '🔖 Lưu'}
                </button>
                <button type="button" className="article-detail-close" onClick={closeArticleDetail}>
                  ✕ Đóng
                </button>
              </div>
              <img
                className="article-detail-image"
                src={selectedArticle.image}
                alt={selectedArticle.title}
              />
              <div className="article-detail-body">
                <div className="article-detail-meta-row">
                  <span className="article-detail-category">{selectedArticle.category}</span>
                  <span>{new Date(selectedArticle.publishedAt).toLocaleString("vi-VN")}</span>
                </div>
                <h2>{selectedArticle.title}</h2>
                <p className="article-detail-author">
                  Tác giả: {renderAuthorLink(selectedArticle)}
                </p>
                {getArticleContent(selectedArticle)
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={`${selectedArticle.id}-${index}`} className="article-detail-paragraph">
                      {paragraph}
                    </p>
                  ))}

                <section className="article-comments">
                  <div className="article-comments-header">
                    <h3>Bình luận</h3>
                    <span>{selectedArticleComments.length} bình luận</span>
                  </div>

                  <form className="article-comment-form" onSubmit={handleCommentSubmit}>
                    <textarea
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder={authUser ? "Chia sẻ ý kiến của bạn về bài viết này..." : "Đăng nhập để bình luận"}
                      disabled={!authUser}
                      maxLength={500}
                    />
                    <div className="article-comment-form-footer">
                      <small>{commentDraft.trim().length}/500</small>
                      <button type="submit" disabled={!authUser}>
                        Gửi bình luận
                      </button>
                    </div>
                  </form>

                  {commentError && <p className="article-comment-error">{commentError}</p>}

                  <div className="article-comment-list">
                    {selectedArticleComments.length === 0 ? (
                      <p className="article-comment-empty">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến.</p>
                    ) : (
                      selectedArticleComments.map((item) => (
                        <article className="article-comment-item" key={item.id}>
                          <div className="article-comment-top">
                            <strong>{item.authorName}</strong>
                            <span>
                              {new Date(item.createdAt).toLocaleString("vi-VN")}
                              {item.editedAt ? " (đã sửa)" : ""}
                            </span>
                          </div>

                          {editingCommentId === item.id ? (
                            <div className="article-comment-edit-box">
                              <textarea
                                value={editingCommentDraft}
                                onChange={(event) => setEditingCommentDraft(event.target.value)}
                                maxLength={500}
                              />
                              <div className="article-comment-edit-actions">
                                <small>{editingCommentDraft.trim().length}/500</small>
                                <div>
                                  <button type="button" onClick={cancelEditComment}>Hủy</button>
                                  <button type="button" className="btn-save" onClick={saveEditedComment}>Lưu</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p>{item.content}</p>
                          )}

                          {editingCommentId !== item.id && (
                            <div className="article-comment-item-actions">
                              {canEditComment(item) && (
                                <button type="button" onClick={() => startEditComment(item)}>
                                  <span>✏️</span> Sửa
                                </button>
                              )}
                              {canDeleteComment(item) && (
                                <button type="button" className="btn-danger" onClick={() => deleteComment(item)}>
                                  <span>🗑️</span> Xóa
                                </button>
                              )}
                            </div>
                          )}
                        </article>
                      ))
                    )}
                  </div>

                  {commentEditError && <p className="article-comment-error">{commentEditError}</p>}
                </section>
              </div>
            </article>
          </div>
        )}

        {authOpen && (
          <div className="auth-modal-backdrop" onClick={() => setAuthOpen(false)}>
            <section className="auth-modal" onClick={(event) => event.stopPropagation()}>
              <div className="auth-modal-head">
                <h2>
                  {authMode === AUTH_MODES.LOGIN
                    ? "Đăng nhập"
                    : authMode === AUTH_MODES.REGISTER
                      ? "Đăng ký tài khoản"
                      : authMode === AUTH_MODES.FORGOT
                        ? "Quên mật khẩu"
                        : "Đặt lại mật khẩu"}
                </h2>
                <button type="button" className="auth-close" onClick={() => setAuthOpen(false)}>
                  Đóng
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {authMode === AUTH_MODES.REGISTER && (
                  <>
                    <input
                      name="name"
                      placeholder="Họ tên"
                      value={formData.name}
                      onChange={onChangeField}
                      minLength={2}
                      maxLength={80}
                      required
                    />
                  </>
                )}
                {(authMode === AUTH_MODES.LOGIN || authMode === AUTH_MODES.REGISTER || authMode === AUTH_MODES.FORGOT) && (
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={onChangeField}
                    required
                  />
                )}
                {(authMode === AUTH_MODES.LOGIN || authMode === AUTH_MODES.REGISTER || authMode === AUTH_MODES.RESET) && (
                  <input
                    name="password"
                    type="password"
                    placeholder={authMode === AUTH_MODES.RESET ? "Mật khẩu mới" : "Mật khẩu"}
                    value={formData.password}
                    onChange={onChangeField}
                    required
                  />
                )}
                {(authMode === AUTH_MODES.REGISTER || authMode === AUTH_MODES.RESET) && (
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder={authMode === AUTH_MODES.RESET ? "Nhập lại mật khẩu mới" : "Nhập lại mật khẩu"}
                    value={formData.confirmPassword}
                    onChange={onChangeField}
                    required
                  />
                )}
                <button type="submit" disabled={authLoading}>
                  {authLoading
                    ? "Đang xử lý..."
                    : authMode === AUTH_MODES.REGISTER
                      ? "Tạo tài khoản"
                      : authMode === AUTH_MODES.LOGIN
                        ? "Đăng nhập"
                        : authMode === AUTH_MODES.FORGOT
                          ? "Gửi link đặt lại"
                          : "Đặt lại mật khẩu"}
                </button>
                {authMode === AUTH_MODES.LOGIN && (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => {
                      setAuthMode(AUTH_MODES.FORGOT);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                )}
                {authMode === AUTH_MODES.RESET && (
                  <p className="auth-helper-text">Bạn đang đặt lại mật khẩu bằng liên kết được gửi qua email.</p>
                )}
              </form>

              {(authMode === AUTH_MODES.LOGIN || authMode === AUTH_MODES.REGISTER) && (
                <p className="auth-switch-inline">
                  {authMode === AUTH_MODES.LOGIN ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode((prev) => (prev === AUTH_MODES.LOGIN ? AUTH_MODES.REGISTER : AUTH_MODES.LOGIN));
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                  >
                    {authMode === AUTH_MODES.LOGIN ? "Đăng ký ngay" : "Đăng nhập"}
                  </button>
                </p>
              )}

              {(authMode === AUTH_MODES.FORGOT || authMode === AUTH_MODES.RESET) && (
                <p className="auth-switch-inline">
                  Quay lại đăng nhập?
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(AUTH_MODES.LOGIN);
                      setAuthError("");
                    }}
                  >
                    Đăng nhập
                  </button>
                </p>
              )}

              {authError && <p className="auth-message error">{authError}</p>}
              {authSuccess && <p className="auth-message success">{authSuccess}</p>}
            </section>
          </div>
        )}

        {showAdminPanel && authUser?.role === "admin" && (
          <div className="auth-modal-backdrop" onClick={() => setShowAdminPanel(false)}>
            <section className="admin-panel" onClick={(e) => e.stopPropagation()}>
              <div className="admin-panel-head">
                <div>
                  <p className="admin-kicker">Admin Console</p>
                  <h2>Quản trị hệ thống</h2>
                  <p className="admin-head-subtitle">
                    Không gian điều phối tập trung, sẵn sàng mở rộng thêm tính năng kiểm duyệt, báo cáo và phân quyền nâng cao.
                  </p>
                </div>
                <div className="admin-head-actions">
                  <button type="button" className="btn-refresh-admin" onClick={refreshAdminDashboard}>
                    ↻ Làm mới dữ liệu
                  </button>
                  <button type="button" className="auth-close" onClick={() => setShowAdminPanel(false)}>
                    Đóng
                  </button>
                </div>
              </div>

              <section className="admin-summary-grid" aria-label="Thống kê nhanh quản trị">
                {adminSummaryCards.map((card) => (
                  <article className="admin-summary-card" key={card.id}>
                    <div className="admin-summary-top">
                      <span>{card.icon}</span>
                      <p>{card.label}</p>
                    </div>
                    <strong>{card.displayValue || card.value.toLocaleString("vi-VN")}</strong>
                    <small>{card.note}</small>
                  </article>
                ))}
              </section>

              <div className="admin-tabs">
                <button
                  type="button"
                  className={adminTab === "users" ? "active" : ""}
                  onClick={() => {
                    setAdminTab("users");
                    fetchAdminUsers();
                  }}
                >
                  <span>{adminTabMeta.users.icon}</span>
                  <span>{adminTabMeta.users.shortLabel}</span>
                  <small>{adminTabBadges.users}</small>
                </button>
                <button
                  type="button"
                  className={adminTab === "news" ? "active" : ""}
                  onClick={() => setAdminTab("news")}
                >
                  <span>{adminTabMeta.news.icon}</span>
                  <span>{adminTabMeta.news.shortLabel}</span>
                  <small>{adminTabBadges.news}</small>
                </button>
                <button
                  type="button"
                  className={adminTab === "vip-requests" ? "active" : ""}
                  onClick={() => {
                    setAdminTab("vip-requests");
                    fetchAdminVipRequests();
                  }}
                >
                  <span>{adminTabMeta["vip-requests"].icon}</span>
                  <span>{adminTabMeta["vip-requests"].shortLabel}</span>
                  <small>{adminTabBadges["vip-requests"]}</small>
                </button>
                <button
                  type="button"
                  className={adminTab === "invoices" ? "active" : ""}
                  onClick={() => {
                    setAdminTab("invoices");
                    fetchAdminInvoices();
                  }}
                >
                  <span>{adminTabMeta.invoices.icon}</span>
                  <span>{adminTabMeta.invoices.shortLabel}</span>
                  <small>{adminTabBadges.invoices}</small>
                </button>
                <button
                  type="button"
                  className={adminTab === "comments" ? "active" : ""}
                  onClick={() => setAdminTab("comments")}
                >
                  <span>{adminTabMeta.comments.icon}</span>
                  <span>{adminTabMeta.comments.shortLabel}</span>
                  <small>{adminTabBadges.comments}</small>
                </button>
              </div>

              <div className="admin-toolbar">
                <p>
                  <strong>Module hiện tại:</strong> {adminTabMeta[adminTab]?.label || "Quản trị"}
                </p>
                <div className="admin-upcoming-modules">
                  <span>Audit log</span>
                  <span>Workflow kiểm duyệt</span>
                  <span>Báo cáo KPI</span>
                </div>
              </div>

              {adminError && <p className="auth-message error">{adminError}</p>}
              {adminSuccess && <p className="auth-message success">{adminSuccess}</p>}

              {adminTab === "users" && (
                <div className="admin-content">
                  {adminLoading ? (
                    <p>Đang tải...</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tên</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Ngày tạo</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                disabled={user.id === authUser.id}
                              >
                                <option value="user">User</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td>
                              {user.id !== authUser.id && (
                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Xóa
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {adminTab === "vip-requests" && (
                <div className="admin-content">
                  {adminVipLoading ? (
                    <p>Đang tải yêu cầu VIP...</p>
                  ) : adminVipRequests.length === 0 ? (
                    <p>Hiện chưa có yêu cầu nâng cấp VIP nào đang chờ duyệt.</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Người dùng</th>
                          <th>Email</th>
                          <th>Chuyển đổi gói</th>
                          <th>Tiền cộng thêm</th>
                          <th>Thời gian gửi</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminVipRequests.map((request) => {
                          const fromPackageName = request.fromPackageName || getVipPackageName(request.fromStatus);
                          const packageName = request.toPackageName || getVipPackageName(request.status);
                          const payableAmount = request.amountText || formatCurrency(request.amount);
                          const isApproving = adminVipActionLoading === `approve:${request.requestId}`;
                          const isRejecting = adminVipActionLoading === `reject:${request.requestId}`;
                          const isResending = adminVipActionLoading === `resend:${request.requestId}`;
                          const actionDisabled = Boolean(adminVipActionLoading);

                          return (
                            <tr key={request.requestId}>
                              <td>{request.user?.name || `User #${request.user?.id || "?"}`}</td>
                              <td>{request.user?.email || "-"}</td>
                              <td>
                                <span className={`vip-request-badge vip-${request.fromStatus || "free"}`}>{fromPackageName}</span>
                                {" -> "}
                                <span className={`vip-request-badge vip-${request.status}`}>{packageName}</span>
                              </td>
                              <td>{payableAmount}</td>
                              <td>{new Date(request.requestedAt).toLocaleString("vi-VN")}</td>
                              <td>
                                <div className="admin-actions vip-request-actions">
                                  <button
                                    type="button"
                                    className="btn-edit"
                                    disabled={actionDisabled}
                                    onClick={() => handleAdminVipDecision(request.requestId, "approve")}
                                  >
                                    {isApproving ? "Đang duyệt..." : "Duyệt"}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-delete"
                                    disabled={actionDisabled}
                                    onClick={() => handleAdminVipDecision(request.requestId, "reject")}
                                  >
                                    {isRejecting ? "Đang từ chối..." : "Từ chối"}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-resend-admin"
                                    disabled={actionDisabled}
                                    onClick={() => handleAdminResendVipEmail(request.requestId)}
                                  >
                                    {isResending ? "Đang gửi..." : "Gửi lại email"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {adminTab === "news" && (
                <div className="admin-content">
                  <form className="admin-form" onSubmit={handleNewsSubmit}>
                    <h3>{editingNewsId ? "Chỉnh sửa tin" : "Tạo tin mới"}</h3>
                    <input
                      placeholder="Tiêu đề tin"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                      required
                    />
                    <select
                      value={newsForm.category}
                      onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {news.categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Tóm tắt tin"
                      value={newsForm.summary}
                      onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                      rows={3}
                      required
                    />
                    <textarea
                      placeholder="Nội dung chi tiết bài viết"
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                      rows={8}
                    />
                    <input
                      placeholder="Tác giả (tùy chọn)"
                      value={newsForm.author}
                      onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                    />
                    <input
                      placeholder="URL hình ảnh (tùy chọn)"
                      value={newsForm.image}
                      onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                    />
                    <div className="form-actions">
                      <button type="submit" disabled={adminLoading}>
                        {adminLoading ? "Đang xử lý..." : editingNewsId ? "Cập nhật" : "Tạo tin"}
                      </button>
                      {editingNewsId && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewsForm({ title: "", category: "", summary: "", content: "", author: "", image: "" });
                            setEditingNewsId(null);
                          }}
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="admin-news-list">
                    <h3>Tất cả tin tức ({allNewsList.length})</h3>
                    {newsListLoading ? (
                      <p>Đang tải danh sách tin...</p>
                    ) : allNewsList.length === 0 ? (
                      <p>Chưa có tin tức nào trong hệ thống.</p>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Ảnh</th>
                            <th>Tiêu đề</th>
                            <th>Danh mục</th>
                            <th>Tác giả</th>
                            <th>Đăng bởi</th>
                            <th>Ngày đăng</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allNewsList.map((article) => (
                            <tr key={`admin-news-${article.id}`}>
                              <td>
                                <img 
                                  src={article.image} 
                                  alt={article.title}
                                  className="admin-news-thumbnail"
                                />
                              </td>
                              <td className="admin-news-title">{article.title}</td>
                              <td>
                                <span className="admin-news-category">{article.category}</span>
                              </td>
                              <td>{article.author || "Ban biên tập"}</td>
                              <td>{article.createdByName || article.author || "Hệ thống"}</td>
                              <td>{new Date(article.publishedAt).toLocaleDateString("vi-VN")}</td>
                              <td>
                                <div className="admin-actions">
                                  <button 
                                    type="button" 
                                    className="btn-edit"
                                    onClick={() => handleEditNews(article)}
                                  >
                                    ✏️ Sửa
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn-delete" 
                                    onClick={() => handleDeleteNews(article.id)}
                                  >
                                    🗑️ Xóa
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {adminTab === "invoices" && (
                <div className="admin-content invoices-admin-content">
                  <div className="admin-invoice-summary">
                    <div className="admin-invoice-card">
                      <p>Tổng hóa đơn</p>
                      <strong>{adminInvoiceSummary.totalInvoices.toLocaleString("vi-VN")}</strong>
                    </div>
                    <div className="admin-invoice-card">
                      <p>Đã duyệt</p>
                      <strong>{adminInvoiceSummary.paid.toLocaleString("vi-VN")}</strong>
                    </div>
                    <div className="admin-invoice-card">
                      <p>Chờ duyệt</p>
                      <strong>{adminInvoiceSummary.pending.toLocaleString("vi-VN")}</strong>
                    </div>
                    <div className="admin-invoice-card">
                      <p>Tổng giá trị</p>
                      <strong>{formatCurrency(adminInvoiceSummary.totalAmountValue)}</strong>
                    </div>
                  </div>

                  <div className="admin-invoice-form" aria-label="Bộ lọc hóa đơn">
                    <div className="admin-invoice-form-row">
                      <input
                        type="text"
                        value={adminInvoiceKeyword}
                        onChange={(event) => setAdminInvoiceKeyword(event.target.value)}
                        placeholder="Tìm theo mã hóa đơn, tên, email, gói..."
                      />
                      <select
                        value={adminInvoiceSort}
                        onChange={(event) => setAdminInvoiceSort(event.target.value)}
                        aria-label="Sắp xếp hóa đơn"
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="amount_desc">Số tiền cao đến thấp</option>
                        <option value="amount_asc">Số tiền thấp đến cao</option>
                      </select>
                    </div>

                    <div className="admin-invoice-chip-group">
                      <button
                        type="button"
                        className={adminInvoiceFilter === "all" ? "active" : ""}
                        onClick={() => setAdminInvoiceFilter("all")}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        className={adminInvoiceFilter === "paid" ? "active" : ""}
                        onClick={() => setAdminInvoiceFilter("paid")}
                      >
                        Đã duyệt
                      </button>
                      <button
                        type="button"
                        className={adminInvoiceFilter === "pending" ? "active" : ""}
                        onClick={() => setAdminInvoiceFilter("pending")}
                      >
                        Chờ duyệt
                      </button>
                      <button
                        type="button"
                        className={adminInvoiceFilter === "rejected" ? "active" : ""}
                        onClick={() => setAdminInvoiceFilter("rejected")}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>

                  {adminLoading ? (
                    <p>Đang tải danh sách hóa đơn...</p>
                  ) : filteredAdminInvoices.length === 0 ? (
                    <p>Không có hóa đơn phù hợp với bộ lọc hiện tại.</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã hóa đơn</th>
                          <th>Người dùng</th>
                          <th>Email</th>
                          <th>Gói VIP</th>
                          <th>Số tiền</th>
                          <th>Yêu cầu lúc</th>
                          <th>Quyết định lúc</th>
                          <th>Hết hạn</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminInvoices.map((invoice) => (
                          <tr key={`admin-invoice-${invoice.invoiceId}`}>
                            <td>{invoice.invoiceId}</td>
                            <td>{invoice.userName}</td>
                            <td>{invoice.userEmail}</td>
                            <td>
                              <span className={`vip-request-badge vip-${invoice.packageStatus}`}>{invoice.packageName}</span>
                            </td>
                            <td>{invoice.amountText}</td>
                            <td>{invoice.requestedAt ? new Date(invoice.requestedAt).toLocaleString("vi-VN") : "-"}</td>
                            <td>{(invoice.decidedAt || invoice.activatedAt) ? new Date(invoice.decidedAt || invoice.activatedAt).toLocaleString("vi-VN") : "-"}</td>
                            <td>{invoice.expiresAt ? new Date(invoice.expiresAt).toLocaleString("vi-VN") : "Không giới hạn"}</td>
                            <td>
                              <span className={`invoice-status-badge invoice-${invoice.paymentStatus}`}>
                                {invoice.paymentStatus === "paid"
                                  ? "Đã duyệt"
                                  : invoice.paymentStatus === "awaiting_approval"
                                    ? "Chờ duyệt"
                                    : "Từ chối"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {adminTab === "comments" && (
                <div className="admin-content">
                  {allComments.length === 0 ? (
                    <p>Chưa có bình luận nào trong hệ thống.</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Bài viết</th>
                          <th>Người bình luận</th>
                          <th>Nội dung</th>
                          <th>Thời gian</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allComments.map((item) => (
                          <tr key={`admin-comment-${item.id}`}>
                            <td>{articleTitleById.get(item.articleId) || item.articleTitle || `Bài #${item.articleId}`}</td>
                            <td>
                              {item.authorName}
                              <br />
                              <small>{item.authorEmail}</small>
                            </td>
                            <td>{item.content}</td>
                            <td>{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => deleteComment(item)}
                              >
                                <span>🗑️</span> Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {showScrollTop && (
          <button
            type="button"
            className="scroll-top-btn"
            onClick={scrollToTop}
            aria-label="Lên đầu trang"
            title="Lên đầu trang"
          >
            ↑
          </button>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && confirmAction && (
          <div className="auth-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
            <section className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="confirm-modal-header">
                <h3>{confirmAction.title}</h3>
              </div>
              <div className="confirm-modal-body">
                <p>{confirmAction.message}</p>
              </div>
              <div className="confirm-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowConfirmModal(false)}>
                  Hủy
                </button>
                <button type="button" className="btn-confirm" onClick={confirmAction.onConfirm}>
                  Xác nhận
                </button>
              </div>
            </section>
          </div>
        )}

        {/* VIP Upgrade Modal */}
        {showVipUpgrade && (
          <div className="auth-modal-backdrop" onClick={() => {
            setShowVipUpgrade(false);
            setVipPaymentStep("select");
            setSelectedVipPackage(null);
          }}>
            <section className="vip-upgrade-modal" onClick={(e) => e.stopPropagation()}>
              <div className="vip-modal-header">
                <h2>{vipPaymentStep === "payment" ? "💳 Thanh toán" : "🚀 Nâng cấp / đổi gói VIP"}</h2>
                <button
                  type="button"
                  className="vip-modal-close"
                  onClick={() => {
                    setShowVipUpgrade(false);
                    setVipPaymentStep("select");
                    setSelectedVipPackage(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="vip-modal-body">
                {vipError && <p className="vip-form-error">{vipError}</p>}
                {vipSuccess && <p className="vip-form-success">{vipSuccess}</p>}

                {authUser?.pendingVipRequest?.state === "pending" && (
                  <div className="vip-pending-request-box">
                    <h3>Yêu cầu VIP đang chờ duyệt</h3>
                    <p>
                      Gói đăng ký: {authUser.pendingVipRequest.status === "platinum"
                        ? "Bạch kim"
                        : authUser.pendingVipRequest.status === "gold"
                          ? "Vàng"
                          : "Bạc"}
                    </p>
                    <p>
                      Thời gian gửi: {new Date(authUser.pendingVipRequest.requestedAt).toLocaleString("vi-VN")}
                    </p>
                    <button
                      type="button"
                      className="btn-resend-vip-email"
                      disabled={vipResendingApproval}
                      onClick={handleResendVipApprovalEmail}
                    >
                      {vipResendingApproval ? "Đang gửi lại..." : "Gửi lại email duyệt"}
                    </button>
                  </div>
                )}

                {vipPaymentStep === "select" && (
                  <div className="vip-packages-grid">
                    {vipPackages.free && (
                      <div className={`vip-package-card vip-free ${authUser.vipPackage?.status === "free" ? "active" : ""}`}>
                        <div className="vip-package-header">
                          <h3>📱 {vipPackages.free.name}</h3>
                          <p className="vip-price">{vipPackages.free.price}</p>
                        </div>
                        <p className="vip-duration">{vipPackages.free.duration}</p>
                        <ul className="vip-features">
                          {vipPackages.free.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="btn-select-vip"
                          disabled={authUser.vipPackage?.status === "free"}
                          onClick={() => handleUpgradeVip("free")}
                        >
                          {authUser.vipPackage?.status === "free" ? "Gói hiện tại" : "Chọn"}
                        </button>
                      </div>
                    )}
                    {vipPackages.silver && (
                      <div className={`vip-package-card vip-silver ${authUser.vipPackage?.status === "silver" ? "active" : ""}`}>
                        <div className="vip-package-header">
                          <h3>⭐ {vipPackages.silver.name}</h3>
                          <p className="vip-price">
                            {formatCurrency(silverUpgradeCharge.discountedCharge)}
                            {silverUpgradeCharge.appliedPercent > 0 && (
                              <span className="vip-price-original">{formatCurrency(silverUpgradeCharge.baseCharge)}</span>
                            )}
                          </p>
                          {silverUpgradeCharge.appliedPercent > 0 && (
                            <p className="vip-discount-tag">Đã giảm {silverUpgradeCharge.appliedPercent}% từ vòng quay</p>
                          )}
                        </div>
                        <p className="vip-duration">{vipPackages.silver.duration}</p>
                        <ul className="vip-features">
                          {vipPackages.silver.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="btn-select-vip"
                          disabled={vipUpgrading || authUser.vipPackage?.status === "silver"}
                          onClick={() => handleUpgradeVip("silver")}
                        >
                          {authUser.vipPackage?.status === "silver" ? "Gói hiện tại" : vipUpgrading ? "Đang xử lý..." : "Chọn gói này"}
                        </button>
                      </div>
                    )}
                    {vipPackages.gold && (
                      <div className={`vip-package-card vip-gold ${authUser.vipPackage?.status === "gold" ? "active" : ""}`}>
                        <div className="vip-package-header popular-badge">
                          <span className="popular-label">Phổ biến nhất</span>
                          <h3>👑 {vipPackages.gold.name}</h3>
                          <p className="vip-price">
                            {formatCurrency(goldUpgradeCharge.discountedCharge)}
                            {goldUpgradeCharge.appliedPercent > 0 && (
                              <span className="vip-price-original">{formatCurrency(goldUpgradeCharge.baseCharge)}</span>
                            )}
                          </p>
                          {goldUpgradeCharge.appliedPercent > 0 && (
                            <p className="vip-discount-tag">Đã giảm {goldUpgradeCharge.appliedPercent}% từ vòng quay</p>
                          )}
                        </div>
                        <p className="vip-duration">{vipPackages.gold.duration}</p>
                        <ul className="vip-features">
                          {vipPackages.gold.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="btn-select-vip"
                          disabled={vipUpgrading || authUser.vipPackage?.status === "gold"}
                          onClick={() => handleUpgradeVip("gold")}
                        >
                          {authUser.vipPackage?.status === "gold" ? "Gói hiện tại" : vipUpgrading ? "Đang xử lý..." : "Chọn gói này"}
                        </button>
                      </div>
                    )}
                    {vipPackages.platinum && (
                      <div className={`vip-package-card vip-platinum ${authUser.vipPackage?.status === "platinum" ? "active" : ""}`}>
                        <div className="vip-package-header">
                          <h3>🏆 {vipPackages.platinum.name}</h3>
                          <p className="vip-price">
                            {formatCurrency(platinumUpgradeCharge.discountedCharge)}
                            {platinumUpgradeCharge.appliedPercent > 0 && (
                              <span className="vip-price-original">{formatCurrency(platinumUpgradeCharge.baseCharge)}</span>
                            )}
                          </p>
                          {platinumUpgradeCharge.appliedPercent > 0 && (
                            <p className="vip-discount-tag">Đã giảm {platinumUpgradeCharge.appliedPercent}% từ vòng quay</p>
                          )}
                        </div>
                        <p className="vip-duration">{vipPackages.platinum.duration}</p>
                        <ul className="vip-features">
                          {vipPackages.platinum.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="btn-select-vip"
                          disabled={vipUpgrading || authUser.vipPackage?.status === "platinum"}
                          onClick={() => handleUpgradeVip("platinum")}
                        >
                          {authUser.vipPackage?.status === "platinum" ? "Gói hiện tại" : vipUpgrading ? "Đang xử lý..." : "Chọn gói này"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {vipPaymentStep === "payment" && selectedVipPackage && (
                  <div className="vip-payment-section">
                    <div className="payment-instruction">
                      <h3>📋 Hướng dẫn thanh toán</h3>
                      <ol className="payment-guide-list">
                        <li>
                          Chuyển khoản số tiền cần thanh toán thêm khi đổi gói: <strong>
                            {formatCurrency(selectedUpgradeCharge.discountedCharge)}
                            {selectedUpgradeCharge.appliedPercent > 0
                              ? ` (đã giảm ${selectedUpgradeCharge.appliedPercent}% từ ${formatCurrency(selectedUpgradeCharge.baseCharge)})`
                              : ""}
                          </strong>
                        </li>
                        <li>
                          Tên tài khoản nhận phải đúng: <strong>PHAN THE CHUNG</strong>
                        </li>
                        <li>
                          Nội dung chuyển khoản: <strong>
                            VIP {selectedVipPackage === "silver" ? "BAC" : selectedVipPackage === "gold" ? "VANG" : "BACHKIM"} - {authUser?.id}
                          </strong>
                        </li>
                        <li>
                          Sau khi chuyển khoản thành công, bấm <strong>"Gửi xác nhận thanh toán"</strong> để gửi yêu cầu duyệt VIP.
                        </li>
                      </ol>
                    </div>

                    <div className="payment-qr-container">
                      <div className="payment-bank-info">
                        <h4>🏦 Thông tin ngân hàng</h4>
                        <div className="bank-detail">
                          <p><strong>Ngân hàng:</strong> VietinBank CN Đà Nẵng - Hội Sở</p>
                          <p><strong>Tên tài khoản (đúng):</strong> PHAN THE CHUNG</p>
                          <p><strong>Số tài khoản:</strong> 104878265290</p>
                        </div>
                      </div>

                      <div className="payment-qr-code">
                        <img
                          src="/qr-vietinbank.png"
                          alt="QR thanh toan VietinBank"
                          className="qr-code-image"
                        />
                      </div>

                      <div className="payment-amount">
                        <p className="amount-label">Số tiền cần thanh toán:</p>
                        <p className="amount-value">
                          {formatCurrency(selectedUpgradeCharge.discountedCharge)}
                        </p>
                        {selectedUpgradeCharge.appliedPercent > 0 && (
                          <p className="amount-original-value">
                            Giá gốc: {formatCurrency(selectedUpgradeCharge.baseCharge)} (giảm {selectedUpgradeCharge.appliedPercent}%)
                          </p>
                        )}
                        <p className="amount-note">Vui lòng chuyển đúng số tiền để hệ thống duyệt nhanh hơn.</p>
                      </div>
                    </div>

                    <div className="payment-actions">
                      <button
                        type="button"
                        className="btn-back-payment"
                        onClick={() => {
                          setVipPaymentStep("select");
                          setSelectedVipPackage(null);
                          setVipError("");
                        }}
                      >
                        ← Quay lại
                      </button>
                      <button
                        type="button"
                        className="btn-confirm-payment"
                        disabled={vipPaymentConfirming}
                        onClick={handleConfirmVipPayment}
                      >
                        {vipPaymentConfirming ? "Đang gửi yêu cầu..." : "✓ Gửi xác nhận thanh toán"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Profile Page */}
        {showProfilePage && authUser && (
          <div className="profile-page-backdrop" onClick={() => setShowProfilePage(false)}>
            <div className="profile-page-container" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="profile-close-btn" onClick={() => setShowProfilePage(false)}>
                ✕
              </button>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only-input"
                onChange={handleAvatarFileChange}
              />
              
              <aside className="profile-sidebar">
                <div className="profile-sidebar-header">
                  <UserAvatar
                    name={authUser.name}
                    avatar={authUser.avatar}
                    className="profile-sidebar-avatar"
                    onClick={() =>
                      openAvatarPreview({
                        userId: authUser.id,
                        name: authUser.name,
                        avatar: authUser.avatar,
                        canChange: true
                      })
                    }
                    title="Ấn để xem ảnh đại diện"
                  />
                  <div>
                    <div className="profile-sidebar-name">{authUser.name}</div>
                    <div className="profile-sidebar-email">{authUser.email}</div>
                  </div>
                </div>
                
                <nav className="profile-nav">
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "info" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("info")}
                  >
                    <span className="profile-nav-icon">👤</span>
                    Thông tin tài khoản
                  </button>
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "comments" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("comments")}
                  >
                    <span className="profile-nav-icon">💬</span>
                    Hoạt động bình luận
                  </button>
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "payments" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("payments")}
                  >
                    <span className="profile-nav-icon">🧾</span>
                    Lịch sử thanh toán
                  </button>
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "mynews" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("mynews")}
                  >
                    <span className="profile-nav-icon">📰</span>
                    Bảng tin của bạn
                  </button>
                  {(authUser.role === "admin" || (authUser.vipPackage?.status && authUser.vipPackage?.status !== "free")) && (
                    <button
                      type="button"
                      className={`profile-nav-item ${activeProfileTab === "createnews" ? "active" : ""}`}
                      onClick={() => setActiveProfileTab("createnews")}
                    >
                      <span className="profile-nav-icon">✍️</span>
                      Đăng tin
                    </button>
                  )}
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "viewed" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("viewed")}
                  >
                    <span className="profile-nav-icon">👁️</span>
                    Tin đã xem
                  </button>
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "saved" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("saved")}
                  >
                    <span className="profile-nav-icon">🔖</span>
                    Tin đã lưu
                  </button>
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "liked" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("liked")}
                  >
                    <span className="profile-nav-icon">❤️</span>
                    Tin đã thích
                  </button>
                  <button
                    type="button"
                    className={`profile-nav-item ${activeProfileTab === "friends" ? "active" : ""}`}
                    onClick={() => setActiveProfileTab("friends")}
                  >
                    <span className="profile-nav-icon">🤝</span>
                    Danh sách bạn bè
                  </button>
                </nav>

                <button type="button" className="profile-logout-btn" onClick={handleLogout}>
                  <span className="profile-nav-icon">🚪</span>
                  Đăng xuất
                </button>
              </aside>

              <main className="profile-content">
                {activeProfileTab === "info" && (
                  <div className="profile-tab-content">
                    <h2>Thông tin tài khoản</h2>
                    <div className="profile-info-card">
                      <div className="profile-info-row">
                        <label>Tên hiển thị</label>
                        <div className="profile-info-value">{authUser.name}</div>
                      </div>
                      <div className="profile-info-row">
                        <label>Email</label>
                        <div className="profile-info-value">{authUser.email}</div>
                      </div>
                      <div className="profile-info-row">
                        <label>Avatar</label>
                        <div className="profile-info-value">
                          <div className="profile-avatar-preview-wrap">
                            <UserAvatar
                              name={authUser.name}
                              avatar={authUser.avatar}
                              className="profile-avatar-preview"
                              onClick={() =>
                                openAvatarPreview({
                                  userId: authUser.id,
                                  name: authUser.name,
                                  avatar: authUser.avatar,
                                  canChange: true
                                })
                              }
                              title="Ấn để xem ảnh đại diện"
                            />
                            <span className="profile-avatar-help">
                              Ấn vào ảnh để xem lớn. Trong popup bạn có thể đổi ảnh mới.
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="profile-info-row">
                        <label>Vai trò</label>
                        <div className="profile-info-value">
                          <span className={`role-badge role-${authUser.role}`}>
                            {authUser.role === "admin" ? "Quản trị viên" : authUser.role === "editor" ? "Biên tập viên" : "Người dùng"}
                          </span>
                        </div>
                      </div>
                      <div className="profile-info-row">
                        <label>Gói VIP</label>
                        <div className="profile-info-value">
                          <span className={`vip-badge vip-${authUser.vipPackage?.status || "free"}`}>
                            {authUser.vipPackage?.status === "platinum" ? "🏆 Bạch kim" : authUser.vipPackage?.status === "gold" ? "👑 Vàng" : authUser.vipPackage?.status === "silver" ? "⭐ Bạc" : "📱 Miễn phí"}
                          </span>
                        </div>
                      </div>
                      <div className="profile-actions">
                        <button
                          type="button"
                          className="btn-edit-profile"
                          onClick={() => {
                            setProfileEditMode((prev) => !prev);
                            setProfileError("");
                            setProfileSuccess("");
                          }}
                        >
                          {profileEditMode ? "Đóng chỉnh sửa" : "Chỉnh sửa thông tin"}
                        </button>
                        <button
                          type="button"
                          className="btn-change-password"
                          onClick={() => {
                            setPasswordEditMode((prev) => !prev);
                            setPasswordError("");
                            setPasswordSuccess("");
                          }}
                        >
                          {passwordEditMode ? "Đóng đổi mật khẩu" : "Đổi mật khẩu"}
                        </button>
                        <button
                          type="button"
                          className="btn-upgrade-vip"
                          onClick={() => {
                            setShowVipUpgrade(true);
                            setVipError("");
                            setVipSuccess("");
                          }}
                        >
                          {isVipUser ? "🔁 Đổi gói VIP" : "🚀 Nâng cấp VIP"}
                        </button>
                      </div>

                      {profileError && <p className="profile-form-error">{profileError}</p>}
                      {profileSuccess && <p className="profile-form-success">{profileSuccess}</p>}
                      {profileEditMode && (
                        <form className="profile-inline-form" onSubmit={handleProfileUpdate}>
                          <div className="profile-inline-grid">
                            <label htmlFor="profile-name">Tên hiển thị</label>
                            <input
                              id="profile-name"
                              type="text"
                              value={profileForm.name}
                              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                              maxLength={80}
                              required
                            />
                          </div>
                          <div className="profile-inline-grid">
                            <label htmlFor="profile-email">Email</label>
                            <input
                              id="profile-email"
                              type="email"
                              value={profileForm.email}
                              onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                              maxLength={254}
                              required
                            />
                          </div>
                          <div className="profile-inline-actions">
                            <button type="submit" className="btn-save-profile" disabled={profileSaving}>
                              {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                          </div>
                        </form>
                      )}

                      {passwordError && <p className="profile-form-error">{passwordError}</p>}
                      {passwordSuccess && <p className="profile-form-success">{passwordSuccess}</p>}
                      {passwordEditMode && (
                        <form className="profile-inline-form" onSubmit={handleChangePassword}>
                          <div className="profile-inline-grid">
                            <label htmlFor="current-password">Mật khẩu hiện tại</label>
                            <input
                              id="current-password"
                              type="password"
                              value={passwordForm.currentPassword}
                              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                              required
                            />
                          </div>
                          <div className="profile-inline-grid">
                            <label htmlFor="new-password">Mật khẩu mới</label>
                            <input
                              id="new-password"
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                              required
                            />
                          </div>
                          <div className="profile-inline-grid">
                            <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                            <input
                              id="confirm-password"
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                              required
                            />
                          </div>
                          <div className="profile-inline-actions">
                            <button type="submit" className="btn-save-profile" disabled={passwordSaving}>
                              {passwordSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {activeProfileTab === "comments" && (
                  <div className="profile-tab-content">
                    <div className="profile-tab-header">
                      <h2>Hoạt động bình luận</h2>
                      {myComments.length > 0 && (
                        <button type="button" className="btn-clear-all" onClick={clearAllMyComments}>
                          <span>🗑️</span> Xóa tất cả
                        </button>
                      )}
                    </div>
                    {myComments.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">💬</div>
                        <p>Bạn chưa có bình luận nào.</p>
                      </div>
                    ) : (
                      <div className="profile-comments-list">
                        {myComments.map((item) => (
                          <article className="profile-comment-item" key={`profile-comment-${item.id}`}>
                            <div className="profile-comment-meta">
                              <strong>{articleTitleById.get(item.articleId) || item.articleTitle || `Bài #${item.articleId}`}</strong>
                              <span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                            <p>{item.content}</p>
                            <div className="profile-comment-actions">
                              <button
                                type="button"
                                className="btn-unsave"
                                onClick={() => deleteComment(item)}
                              >
                                <span>🗑️</span> Xóa
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "payments" && (
                  <div className="profile-tab-content">
                    <h2>Lịch sử thanh toán</h2>

                    <div className="profile-payment-summary-row">
                      <article>
                        <p>Tổng hóa đơn</p>
                        <strong>{(paymentHistorySummary?.totalInvoices ?? paymentHistory.length).toLocaleString("vi-VN")}</strong>
                      </article>
                      <article>
                        <p>Đã thanh toán</p>
                        <strong>{paymentHistorySummary?.totalAmountText || "0 đ"}</strong>
                      </article>
                      <article>
                        <p>Đang chờ duyệt</p>
                        <strong>{paymentHistorySummary?.pendingAmountText || "0 đ"}</strong>
                      </article>
                    </div>

                    <div className="profile-payment-filters">
                      <button
                        type="button"
                        className={paymentHistoryFilter === "all" ? "active" : ""}
                        onClick={() => setPaymentHistoryFilter("all")}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        className={paymentHistoryFilter === "paid" ? "active" : ""}
                        onClick={() => setPaymentHistoryFilter("paid")}
                      >
                        Đã thanh toán
                      </button>
                      <button
                        type="button"
                        className={paymentHistoryFilter === "pending" ? "active" : ""}
                        onClick={() => setPaymentHistoryFilter("pending")}
                      >
                        Chờ duyệt
                      </button>
                      <button
                        type="button"
                        className={paymentHistoryFilter === "rejected" ? "active" : ""}
                        onClick={() => setPaymentHistoryFilter("rejected")}
                      >
                        Từ chối
                      </button>
                    </div>

                    {paymentHistoryError && <p className="profile-form-error">{paymentHistoryError}</p>}

                    {paymentHistoryLoading ? (
                      <p>Đang tải lịch sử thanh toán...</p>
                    ) : filteredPaymentHistory.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">🧾</div>
                        <p>Chưa có giao dịch thanh toán nào.</p>
                      </div>
                    ) : (
                      <div className="profile-payment-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Mã hóa đơn</th>
                              <th>Gói VIP</th>
                              <th>Số tiền</th>
                              <th>Thời gian đăng ký</th>
                              <th>Thời gian duyệt/kích hoạt</th>
                              <th>Hết hạn</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPaymentHistory.map((invoice) => (
                              <tr key={`profile-payment-${invoice.invoiceId}`}>
                                <td>{invoice.invoiceId}</td>
                                <td>
                                  <span className={`vip-request-badge vip-${invoice.packageStatus}`}>{invoice.packageName}</span>
                                </td>
                                <td>{invoice.amountText}</td>
                                <td>{invoice.requestedAt ? new Date(invoice.requestedAt).toLocaleString("vi-VN") : "-"}</td>
                                <td>{(invoice.decidedAt || invoice.activatedAt) ? new Date(invoice.decidedAt || invoice.activatedAt).toLocaleString("vi-VN") : "-"}</td>
                                <td>{invoice.expiresAt ? new Date(invoice.expiresAt).toLocaleString("vi-VN") : "Không giới hạn"}</td>
                                <td>
                                  <span className={`invoice-status-badge invoice-${invoice.paymentStatus}`}>
                                    {invoice.paymentStatus === "paid"
                                      ? "Đã thanh toán"
                                      : invoice.paymentStatus === "awaiting_approval"
                                        ? "Chờ duyệt"
                                        : "Từ chối"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "mynews" && (
                  <div className="profile-tab-content">
                    <h2>Bảng tin của bạn</h2>
                    {newsListLoading ? (
                      <p>Đang tải...</p>
                    ) : myNewsList.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">📰</div>
                        <p>Bạn chưa có bài viết nào</p>
                      </div>
                    ) : (
                      <div className="user-news-list">
                        {myNewsList.map((article) => (
                          <article className="user-news-item" key={`my-news-${article.id}`}>
                            <img src={article.image} alt={article.title} onClick={() => openArticleDetail(article)} />
                            <div className="user-news-content">
                              <h3 onClick={() => openArticleDetail(article)}>{article.title}</h3>
                              <p>{article.summary}</p>
                              <div className="user-news-meta">
                                <span className="news-category">{article.category}</span>
                                <span className="news-date">Đăng lúc {new Date(article.publishedAt).toLocaleString("vi-VN")}</span>
                                {canManageMyNews(article) && (
                                  <div className="user-news-actions">
                                    {authUser?.role === "admin" && (
                                      <button
                                        type="button"
                                        className="btn-edit-news"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditNews(article);
                                        }}
                                      >
                                        ✏️ Sửa
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn-delete-news"
                                      disabled={userNewsDeletingId === article.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMyNews(article.id);
                                      }}
                                    >
                                      {userNewsDeletingId === article.id ? "Đang xóa..." : "🗑️ Xóa"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "createnews" && (
                  <div className="profile-tab-content">
                    <h2>Đăng tin mới</h2>
                    
                    {authUser.role !== "admin" && (!authUser.vipPackage?.status || authUser.vipPackage?.status === "free") ? (
                      <div className="vip-required-message">
                        <div className="vip-required-icon">🔒</div>
                        <h3>Chỉ thành viên VIP mới có thể đăng tin</h3>
                        <p>Nâng cấp lên gói VIP để tận hưởng quyền lợi đăng bài viết trên nền tảng của chúng tôi.</p>
                        <button 
                          type="button" 
                          className="btn-upgrade-now"
                          onClick={() => {
                            setShowVipUpgrade(true);
                            setShowProfilePage(false);
                          }}
                        >
                          🚀 Nâng cấp VIP ngay
                        </button>
                      </div>
                    ) : (
                      <>
                        {userNewsError && <div className="user-news-error">{userNewsError}</div>}
                        {userNewsSuccess && <div className="user-news-success">{userNewsSuccess}</div>}
                        
                        <form className="user-news-form" onSubmit={handleUserNewsSubmit}>
                          <div className="form-group">
                            <label>Tiêu đề tin <span className="required">*</span></label>
                            <input
                              type="text"
                              placeholder="Nhập tiêu đề bài viết..."
                              value={userNewsForm.title}
                              onChange={(e) => setUserNewsForm({ ...userNewsForm, title: e.target.value })}
                              required
                              maxLength={200}
                            />
                            <small>{userNewsForm.title.length}/200 ký tự</small>
                          </div>

                          <div className="form-group">
                            <label>Danh mục <span className="required">*</span></label>
                            <select
                              value={userNewsForm.category}
                              onChange={(e) => setUserNewsForm({ ...userNewsForm, category: e.target.value })}
                              required
                            >
                              <option value="">-- Chọn danh mục --</option>
                              {news.categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Nội dung tóm tắt <span className="required">*</span></label>
                            <textarea
                              placeholder="Nhập nội dung bài viết (tóm tắt hoặc nội dung đầy đủ)..."
                              value={userNewsForm.summary}
                              onChange={(e) => setUserNewsForm({ ...userNewsForm, summary: e.target.value })}
                              rows={8}
                              required
                              maxLength={2000}
                            />
                            <small>{userNewsForm.summary.length}/2000 ký tự</small>
                          </div>

                          <div className="form-group">
                            <label>Tác giả (tùy chọn)</label>
                            <input
                              type="text"
                              placeholder={`Để trống sẽ dùng tên: ${authUser?.name || ""}`}
                              value={userNewsForm.author}
                              onChange={(e) => setUserNewsForm({ ...userNewsForm, author: e.target.value })}
                              maxLength={100}
                            />
                          </div>

                          <div className="form-group">
                            <label>URL hình ảnh (tùy chọn)</label>
                            <input
                              type="url"
                              placeholder="https://example.com/image.jpg"
                              value={userNewsForm.image}
                              onChange={(e) => setUserNewsForm({ ...userNewsForm, image: e.target.value })}
                            />
                            {userNewsForm.image && (
                              <div className="image-preview">
                                <img src={userNewsForm.image} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                              </div>
                            )}
                          </div>

                          <div className="form-actions">
                            <button type="submit" className="btn-submit-news" disabled={userNewsSubmitting}>
                              {userNewsSubmitting ? "Đang đăng..." : "📤 Đăng tin"}
                            </button>
                            <button 
                              type="button" 
                              className="btn-reset-news"
                              onClick={() => {
                                setUserNewsForm({ title: "", category: "", summary: "", author: "", image: "" });
                                setUserNewsError("");
                                setUserNewsSuccess("");
                              }}
                            >
                              🔄 Đặt lại
                            </button>
                          </div>
                        </form>

                        <div className="user-news-note">
                          <p><strong>📌 Lưu ý:</strong></p>
                          <ul>
                            <li>Tin của bạn sẽ xuất hiện trong mục "Bảng tin của bạn" sau khi đăng thành công</li>
                            <li>Vui lòng viết nội dung rõ ràng, chính xác và có ý nghĩa</li>
                            <li>Hình ảnh nên có kích thước tối thiểu 800x600px để hiển thị đẹp</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeProfileTab === "viewed" && (
                  <div className="profile-tab-content">
                    <div className="profile-tab-header">
                      <h2>Tin đã xem</h2>
                      {readHistory.length > 0 && (
                        <button type="button" className="btn-clear-all" onClick={clearAllHistory}>
                          <span>🗑️</span> Xóa tất cả
                        </button>
                      )}
                    </div>
                    {readHistory.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">👁️</div>
                        <p>Chưa có tin tức nào được xem</p>
                      </div>
                    ) : (
                      <div className="history-list">
                        {readHistory.map((item) => (
                          <article className="history-item" key={`history-${item.id}`}>
                            <img src={item.image} alt={item.title} onClick={() => openArticleDetail(item)} />
                            <div className="history-item-content">
                              <h3 onClick={() => openArticleDetail(item)}>{item.title}</h3>
                              <p>{item.description}</p>
                              <div className="history-item-meta">
                                <span className="history-category">{item.category}</span>
                                <span className="history-time">Đọc lúc {new Date(item.readAt).toLocaleString("vi-VN")}</span>
                                <button
                                  type="button"
                                  className="btn-unsave"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromHistory(item.id);
                                  }}
                                >
                                  <span>🗑️</span> Xóa
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "saved" && (
                  <div className="profile-tab-content">
                    <div className="profile-tab-header">
                      <h2>Tin đã lưu</h2>
                      {savedArticles.length > 0 && (
                        <button type="button" className="btn-clear-all" onClick={clearAllSaved}>
                          <span>🗑️</span> Bỏ lưu tất cả
                        </button>
                      )}
                    </div>
                    {savedArticles.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">🔖</div>
                        <p>Chưa có tin tức nào được lưu</p>
                      </div>
                    ) : (
                      <div className="history-list">
                        {savedArticles.map((item) => (
                          <article className="history-item" key={`saved-${item.id}`}>
                            <img src={item.image} alt={item.title} onClick={() => openArticleDetail(item)} />
                            <div className="history-item-content">
                              <h3 onClick={() => openArticleDetail(item)}>{item.title}</h3>
                              <p>{item.description}</p>
                              <div className="history-item-meta">
                                <span className="history-category">{item.category}</span>
                                <span className="history-time">Lưu lúc {new Date(item.savedAt).toLocaleString("vi-VN")}</span>
                                <button
                                  type="button"
                                  className="btn-unsave"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveArticle(item);
                                  }}
                                >
                                  <span>🗑️</span> Bỏ lưu
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "liked" && (
                  <div className="profile-tab-content">
                    <div className="profile-tab-header">
                      <h2>Tin đã thích</h2>
                      {likedArticles.length > 0 && (
                        <p className="profile-tab-subtitle">{likedArticles.length} bài viết</p>
                      )}
                    </div>
                    {likedArticles.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">❤️</div>
                        <p>Chưa có tin tức nào được thích</p>
                      </div>
                    ) : (
                      <div className="history-list">
                        {likedArticles.map((item) => (
                          <article className="history-item" key={`liked-${item.id}`}>
                            <img src={item.image} alt={item.title} onClick={() => openArticleDetail(item)} />
                            <div className="history-item-content">
                              <h3 onClick={() => openArticleDetail(item)}>{item.title}</h3>
                              <p>{item.summary}</p>
                              <div className="history-item-meta">
                                <span className="history-category">{item.category}</span>
                                <span className="history-time">Thích lúc {new Date(item.likedAt).toLocaleString("vi-VN")}</span>
                                <button
                                  type="button"
                                  className="btn-unlike"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLikeArticle(item);
                                  }}
                                >
                                  <span>💔</span> Bỏ thích
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === "friends" && (
                  <div className="profile-tab-content">
                    <div className="profile-tab-header">
                      <h2>Danh sách bạn bè</h2>
                      <p className="profile-tab-subtitle">
                        {friends.length} bạn bè • {incomingFriendRequests.length} lời mời đến • {outgoingFriendRequests.length} lời mời đi
                      </p>
                    </div>

                    <div className="friends-toolbar">
                      <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        value={friendSearchQuery}
                        onChange={(event) => setFriendSearchQuery(event.target.value)}
                      />
                    </div>

                    <section className="friend-request-section">
                      <div className="profile-tab-header compact">
                        <h3>Lời mời kết bạn</h3>
                        <p className="profile-tab-subtitle">{incomingFriendRequests.length} lời mời</p>
                      </div>

                      {incomingFriendRequests.length === 0 ? (
                        <p className="author-profile-state">Bạn chưa có lời mời kết bạn nào.</p>
                      ) : filteredIncomingFriendRequests.length === 0 ? (
                        <p className="author-profile-state">Không tìm thấy lời mời phù hợp.</p>
                      ) : (
                        <div className="friends-list-grid">
                          {filteredIncomingFriendRequests.map((friend) => {
                            const isAccepting = Boolean(friendAcceptingByUser[friend.id]);
                            const isRemoving = Boolean(friendRemovingByUser[friend.id]);

                            return (
                              <article className="friend-list-item" key={`incoming-friend-${friend.id}`}>
                                <div className="friend-list-identity">
                                  <UserAvatar
                                    name={friend.name}
                                    avatar={friend.avatar}
                                    className="friend-chat-avatar friend-list-avatar"
                                    onClick={() => openAvatarPreview({ userId: friend.id, name: friend.name, avatar: friend.avatar })}
                                    title="Xem ảnh đại diện"
                                  />
                                  <div className="friend-list-main">
                                    <strong>{friend.name}</strong>
                                    <small>{friend.email}</small>
                                  </div>
                                </div>
                                <div className="friend-request-actions">
                                  <button
                                    type="button"
                                    className="btn-accept-friend"
                                    disabled={isAccepting}
                                    onClick={() => handleAcceptFriendRequest(friend.id)}
                                  >
                                    {isAccepting ? "Đang chấp nhận..." : canUseFriendFeature ? "Chấp nhận" : "Cần VIP"}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-unfriend"
                                    disabled={isRemoving}
                                    onClick={() => handleUnfriend(friend.id)}
                                  >
                                    {isRemoving ? "Đang từ chối..." : "Từ chối"}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    <section className="friend-request-section">
                      <div className="profile-tab-header compact">
                        <h3>Lời mời đã gửi</h3>
                        <p className="profile-tab-subtitle">{outgoingFriendRequests.length} lời mời</p>
                      </div>

                      {outgoingFriendRequests.length === 0 ? (
                        <p className="author-profile-state">Bạn chưa gửi lời mời kết bạn nào.</p>
                      ) : filteredOutgoingFriendRequests.length === 0 ? (
                        <p className="author-profile-state">Không tìm thấy lời mời phù hợp.</p>
                      ) : (
                        <div className="friends-list-grid">
                          {filteredOutgoingFriendRequests.map((friend) => {
                            const isRemoving = Boolean(friendRemovingByUser[friend.id]);

                            return (
                              <article className="friend-list-item" key={`outgoing-friend-${friend.id}`}>
                                <div className="friend-list-identity">
                                  <UserAvatar
                                    name={friend.name}
                                    avatar={friend.avatar}
                                    className="friend-chat-avatar friend-list-avatar"
                                    onClick={() => openAvatarPreview({ userId: friend.id, name: friend.name, avatar: friend.avatar })}
                                    title="Xem ảnh đại diện"
                                  />
                                  <div className="friend-list-main">
                                    <strong>{friend.name}</strong>
                                    <small>{friend.email}</small>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn-unfriend"
                                  disabled={isRemoving}
                                  onClick={() => handleUnfriend(friend.id)}
                                >
                                  {isRemoving ? "Đang hủy..." : "Hủy lời mời"}
                                </button>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    <section className="friend-request-section">
                      <div className="profile-tab-header compact">
                        <h3>Bạn bè hiện tại</h3>
                        <p className="profile-tab-subtitle">{friends.length} bạn bè</p>
                      </div>

                      {friends.length === 0 ? (
                        <div className="empty-state compact">
                          <div className="empty-icon">🤝</div>
                          <p>Bạn chưa có bạn bè nào.</p>
                        </div>
                      ) : filteredFriends.length === 0 ? (
                        <div className="empty-state compact">
                          <div className="empty-icon">🔎</div>
                          <p>Không tìm thấy bạn bè phù hợp từ khóa.</p>
                        </div>
                      ) : (
                        <div className="friends-list-grid">
                          {filteredFriends.map((friend) => {
                            const isRemoving = Boolean(friendRemovingByUser[friend.id]);
                            return (
                              <article className="friend-list-item" key={`profile-friend-${friend.id}`}>
                                <div className="friend-list-identity">
                                  <UserAvatar
                                    name={friend.name}
                                    avatar={friend.avatar}
                                    className="friend-chat-avatar friend-list-avatar"
                                    onClick={() => openAvatarPreview({ userId: friend.id, name: friend.name, avatar: friend.avatar })}
                                    title="Xem ảnh đại diện"
                                  />
                                  <div className="friend-list-main">
                                    <strong>{friend.name}</strong>
                                    <small>{friend.email}</small>
                                  </div>
                                </div>
                                <div className="friend-request-actions">
                                  <button
                                    type="button"
                                    className="btn-chat-mini"
                                    onClick={() => openChatWithFriend(friend)}
                                  >
                                    Chat
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-unfriend"
                                    disabled={isRemoving}
                                    onClick={() => handleUnfriend(friend.id)}
                                  >
                                    {isRemoving ? "Đang hủy..." : "Hủy kết bạn"}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}

        {(publicAuthorLoading || publicAuthorProfile || publicAuthorError) && (
          <div className="author-profile-backdrop" onClick={closePublicAuthorProfile}>
            <section className="author-profile-modal" onClick={(event) => event.stopPropagation()}>
              <div className="author-profile-head">
                <h3>Trang cá nhân tác giả</h3>
                <button type="button" className="author-profile-close" onClick={closePublicAuthorProfile}>
                  Đóng
                </button>
              </div>

              {publicAuthorLoading ? (
                <p className="author-profile-state">Đang tải hồ sơ tác giả...</p>
              ) : publicAuthorError ? (
                <p className="author-profile-state error">{publicAuthorError}</p>
              ) : publicAuthorProfile ? (
                <>
                  <div className="author-profile-card">
                    <UserAvatar
                      name={publicAuthorProfile.name}
                      avatar={publicAuthorProfile.avatar}
                      className="author-profile-avatar"
                      onClick={() =>
                        openAvatarPreview({
                          userId: publicAuthorProfile.id,
                          name: publicAuthorProfile.name,
                          avatar: publicAuthorProfile.avatar,
                          canChange: authUser?.id === publicAuthorProfile.id
                        })
                      }
                      title="Xem ảnh đại diện"
                    />
                    <div className="author-profile-main">
                      <h4>{publicAuthorProfile.name}</h4>
                      <p>
                        {publicAuthorProfile.role === "admin"
                          ? "Quản trị viên"
                          : publicAuthorProfile.role === "editor"
                            ? "Biên tập viên"
                            : "Người dùng"}
                      </p>
                      <div className="author-profile-meta">
                        <span>{publicAuthorProfile.friendCount} bạn bè</span>
                        <span>
                          VIP: {publicAuthorProfile.vipStatus === "platinum"
                            ? "Bạch kim"
                            : publicAuthorProfile.vipStatus === "gold"
                              ? "Vàng"
                              : publicAuthorProfile.vipStatus === "silver"
                                ? "Bạc"
                                : "Miễn phí"}
                        </span>
                        <span>
                          Tham gia: {publicAuthorProfile.createdAt
                            ? new Date(publicAuthorProfile.createdAt).toLocaleDateString("vi-VN")
                            : "Không rõ"}
                        </span>
                      </div>
                    </div>
                    <div className="author-profile-actions">
                      {authUser?.id === publicAuthorProfile.id ? (
                        <button
                          type="button"
                          className="add-friend-btn"
                          onClick={() => {
                            closePublicAuthorProfile();
                            openProfilePage("info");
                          }}
                        >
                          Hồ sơ của bạn
                        </button>
                      ) : friendIdSet.has(publicAuthorProfile.id) ? (
                        <div className="friend-request-actions">
                          <button
                            type="button"
                            className="btn-chat-mini"
                            onClick={() =>
                              openChatWithFriend({
                                id: publicAuthorProfile.id,
                                name: publicAuthorProfile.name,
                                avatar: publicAuthorProfile.avatar,
                                email: "",
                                role: publicAuthorProfile.role
                              })
                            }
                          >
                            Chat
                          </button>
                          <button
                            type="button"
                            className="btn-unfriend"
                            disabled={Boolean(friendRemovingByUser[publicAuthorProfile.id])}
                            onClick={() => handleUnfriend(publicAuthorProfile.id)}
                          >
                            {friendRemovingByUser[publicAuthorProfile.id] ? "Đang hủy..." : "Hủy kết bạn"}
                          </button>
                        </div>
                      ) : incomingFriendRequestIdSet.has(publicAuthorProfile.id) ? (
                        <button
                          type="button"
                          className="btn-accept-friend"
                          disabled={Boolean(friendAcceptingByUser[publicAuthorProfile.id])}
                          onClick={() => handleAcceptFriendRequest(publicAuthorProfile.id)}
                        >
                          {friendAcceptingByUser[publicAuthorProfile.id]
                            ? "Đang chấp nhận..."
                            : canUseFriendFeature
                              ? "Chấp nhận lời mời"
                              : "Cần VIP"}
                        </button>
                      ) : outgoingFriendRequestIdSet.has(publicAuthorProfile.id) ? (
                        <button
                          type="button"
                          className="add-friend-btn"
                          disabled
                        >
                          Đã gửi lời mời
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="add-friend-btn"
                          disabled={Boolean(friendActionLoadingByUser[publicAuthorProfile.id])}
                          onClick={() => handleAddFriend(publicAuthorProfile.id)}
                        >
                          {friendActionLoadingByUser[publicAuthorProfile.id]
                            ? "Đang thêm..."
                            : canUseFriendFeature
                              ? "Add Friend"
                              : "Cần VIP"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="author-profile-articles">
                    <h4>Bài viết gần đây</h4>
                    {publicAuthorArticles.length === 0 ? (
                      <p className="author-profile-state">Tác giả này chưa có bài viết công khai nào.</p>
                    ) : (
                      <div className="author-article-list">
                        {publicAuthorArticles.map((item) => (
                          <article
                            className="author-article-item"
                            key={`author-article-${item.id}`}
                            onClick={() => {
                              closePublicAuthorProfile();
                              openArticleDetail(item);
                            }}
                          >
                            <img src={item.image} alt={item.title} />
                            <div>
                              <p>{item.category}</p>
                              <h5>{item.title}</h5>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </section>
          </div>
        )}

        {chatOpen && activeChatFriend && (
          <div className="friend-chat-widget">
            <section className="friend-chat-panel">
              <div className="friend-chat-head">
                <div className="friend-chat-head-main">
                  <UserAvatar
                    name={activeChatFriend.name}
                    avatar={activeChatFriend.avatar}
                    className="friend-chat-avatar"
                    onClick={() =>
                      openAvatarPreview({
                        userId: activeChatFriend.id,
                        name: activeChatFriend.name,
                        avatar: activeChatFriend.avatar
                      })
                    }
                    title="Xem ảnh đại diện"
                  />
                  <div>
                    <strong>{activeChatFriend.name}</strong>
                    <p>Đang trò chuyện</p>
                  </div>
                </div>
                <button type="button" className="friend-chat-close" onClick={() => setChatOpen(false)}>
                  ×
                </button>
              </div>

              <div className="friend-chat-stream" ref={chatStreamRef}>
                {chatLoading ? (
                  <p className="friend-chat-state">Đang tải cuộc trò chuyện...</p>
                ) : chatMessages.length === 0 ? (
                  <p className="friend-chat-state">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.</p>
                ) : (
                  chatMessages.map((message) => {
                    const isMine = message.senderId === authUser?.id;
                    return (
                      <div className={`friend-chat-row ${isMine ? "mine" : "other"}`} key={`chat-${message.id}`}>
                        {!isMine && (
                          <UserAvatar
                            name={activeChatFriend.name}
                            avatar={activeChatFriend.avatar}
                            className="friend-chat-avatar small"
                            onClick={() =>
                              openAvatarPreview({
                                userId: activeChatFriend.id,
                                name: activeChatFriend.name,
                                avatar: activeChatFriend.avatar
                              })
                            }
                            title="Xem ảnh đại diện"
                          />
                        )}
                        <article className={`friend-chat-message ${isMine ? "mine" : "other"}`}>
                          <p>{message.content}</p>
                          <time>{new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</time>
                        </article>
                      </div>
                    );
                  })
                )}
              </div>

              {chatError && <p className="friend-chat-error">{chatError}</p>}

              <form className="friend-chat-form" onSubmit={handleSendChatMessage}>
                <textarea
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder={`Nhắn cho ${activeChatFriend.name}...`}
                  maxLength={1000}
                />
                <div className="friend-chat-form-foot">
                  <small>{chatDraft.trim().length}/1000</small>
                  <button type="submit" disabled={chatSending || !chatDraft.trim()}>
                    {chatSending ? "Đang gửi..." : "Gửi"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {avatarPreview && (
          <div className="avatar-preview-backdrop" onClick={closeAvatarPreview}>
            <section className="avatar-preview-modal" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="avatar-preview-close" onClick={closeAvatarPreview}>
                ✕
              </button>
              <div className="avatar-preview-media-wrap">
                {avatarPreview.avatar ? (
                  <img src={avatarPreview.avatar} alt={avatarPreview.name || "Ảnh đại diện"} className="avatar-preview-image" />
                ) : (
                  <div className="avatar-preview-fallback">{getUserInitial(avatarPreview.name)}</div>
                )}
              </div>
              <div className="avatar-preview-meta">
                <span className="avatar-preview-kicker">Ảnh đại diện</span>
                <h4>{avatarPreview.name || "Ảnh đại diện"}</h4>
                <p>{avatarPreview.canChange ? "Bạn có thể đổi ảnh đại diện ngay tại đây." : "Ảnh đại diện tài khoản."}</p>
              </div>
              {avatarPreview.canChange && (
                <div className="avatar-preview-actions">
                  <button
                    type="button"
                    className="avatar-preview-change-btn"
                    onClick={openAvatarFilePicker}
                    disabled={profileSaving}
                  >
                    <span className="avatar-preview-change-icon" aria-hidden="true">📷</span>
                    <span>{profileSaving ? "Đang cập nhật..." : "Đổi ảnh đại diện"}</span>
                  </button>
                  <button
                    type="button"
                    className="avatar-preview-remove-btn"
                    onClick={handleRemoveAvatar}
                    disabled={profileSaving || !avatarPreview.avatar}
                  >
                    Xóa ảnh hiện tại
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {showAiChat && (
          <ChatBubble
            onClose={() => setShowAiChat(false)}
            aiContext={{
              preferredCategories: preferredCategoryDetails.map((item) => item.label),
              topArticles: personalizedHighlights.map((item) => item.title)
            }}
            storageKey={`${AI_CHAT_STORAGE_KEY_PREFIX}_${authUser?.id || "guest"}`}
          />
        )}

        <button
          type="button"
          className="ai-chat-toggle-btn"
          onClick={() => setShowAiChat((prev) => !prev)}
          aria-label={showAiChat ? "Ẩn chat AI" : "Mở chat AI"}
          title={showAiChat ? "Ẩn chat AI" : "Mở chat AI"}
        >
          {showAiChat ? "Ẩn AI" : "AI Chat"}
        </button>
      </main>

      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Liên hệ</h4>
            <p>Email: contact@newsportal.com</p>
            <p>Điện thoại: 0123-456-789</p>
          </div>
          <div className="footer-section">
            <h4>Theo dõi chúng tôi</h4>
            <div className="social-links">
              <button className="social-btn">Facebook</button>
              <button className="social-btn">Twitter</button>
              <button className="social-btn">Instagram</button>
            </div>
          </div>
          <div className="footer-section">
            <h4>Công cụ</h4>
            <div className="tool-links">
              <button className="tool-btn">RSS Feed</button>
              <button className="tool-btn">API</button>
              <button className="tool-btn">Mobile App</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 News Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
