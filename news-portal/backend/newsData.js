export const categories = [
  "Công nghệ",
  "Kinh doanh",
  "Thể thao",
  "Giải trí",
  "Giáo dục",
  "Sức khỏe",
  "Môi trường",
  "Du lịch"
];

const baseArticles = [
  {
    id: 1,
    title: "AI Việt Nam tăng tốc: startup gọi vốn kỷ lục trong quý I",
    category: "Công nghệ",
    summary:
      "Hệ sinh thái AI trong nước bắt đầu bước vào giai đoạn mở rộng, tập trung vào ứng dụng doanh nghiệp và giáo dục.",
    author: "Minh Châu",
    source: "Trung tâm Phân tích Công nghệ Việt Nam",
    location: "Hà Nội",
    publishedAt: "2026-03-06T07:30:00.000Z",
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 2,
    title: "Thị trường bán lẻ online tăng 18% nhờ xu hướng mua sắm trên di động",
    category: "Kinh doanh",
    summary:
      "Người dùng ưu tiên trải nghiệm app nhanh, đơn giản và thanh toán không tiền mặt trong mùa cao điểm.",
    author: "Thanh Tùng",
    source: "Viện Nghiên cứu Bán lẻ Số",
    location: "TP. Hồ Chí Minh",
    publishedAt: "2026-03-06T06:15:00.000Z",
    image:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 3,
    title: "Đội tuyển U23 công bố danh sách tập trung trước giải châu lục",
    category: "Thể thao",
    summary:
      "Ban huấn luyện ưu tiên cầu thủ có khả năng đá đa năng và thể lực bền bỉ để tối ưu đội hình.",
    author: "Quang Huy",
    source: "Liên đoàn Bóng đá Việt Nam",
    location: "Đà Nẵng",
    publishedAt: "2026-03-06T05:00:00.000Z",
    image:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 4,
    title: "Liên hoan âm nhạc mùa xuân thu hút hơn 40 nghệ sĩ trong khu vực",
    category: "Giải trí",
    summary:
      "Sự kiện dự kiến kéo dài 3 đêm, kết hợp trình diễn trực tiếp và không gian nghệ thuật mở.",
    author: "Hà My",
    source: "Hiệp hội Âm nhạc Đương đại",
    location: "Huế",
    publishedAt: "2026-03-06T03:45:00.000Z",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 5,
    title: "Đại học mở rộng chương trình học lại kỹ năng số cho sinh viên năm cuối",
    category: "Giáo dục",
    summary:
      "Chương trình mới bổ sung học phần trí tuệ nhân tạo cơ bản và kỹ năng quản lý dự án thực tế.",
    author: "Lan Anh",
    source: "Đại học Quốc gia TP. Hồ Chí Minh",
    location: "TP. Hồ Chí Minh",
    publishedAt: "2026-03-05T16:30:00.000Z",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80"
  }
];

const titleFragments = [
  "Doanh nghiệp đẩy mạnh chuyển đổi số",
  "Thị trường ghi nhận biến động mới",
  "Chuyên gia cảnh báo rủi ro ngắn hạn",
  "Địa phương thu hút đầu tư chất lượng cao",
  "Giải pháp mới cho bài toán nhân lực",
  "Nhóm nghiên cứu công bố kết quả đáng chú ý",
  "Người dùng tăng mạnh trong quý đầu năm",
  "Chính sách mới tác động đến nhiều lĩnh vực",
  "Hệ sinh thái khởi nghiệp tiếp tục mở rộng",
  "Nâng cấp hạ tầng để tối ưu vận hành",
  "Các địa phương thí điểm mô hình quản trị mới",
  "Nhiều doanh nghiệp công bố chiến lược bền vững",
  "Hành vi tiêu dùng thay đổi theo chu kỳ mùa vụ",
  "Giải pháp số giúp tăng hiệu suất vận hành"
];

const summaryFragments = [
  "Báo cáo mới nhất cho thấy tốc độ tăng trưởng ổn định và xu hướng đầu tư dài hạn.",
  "Nhiều đơn vị ưu tiên nâng cao chất lượng dịch vụ và tối ưu trải nghiệm người dùng.",
  "Các bên liên quan đề xuất lộ trình triển khai cụ thể trong 6 tháng tới.",
  "Số liệu từ thị trường cho thấy nhu cầu tăng đều ở nhóm khách hàng trẻ.",
  "Nguồn lực được tập trung cho công nghệ, đào tạo và mở rộng kênh tiếp cận.",
  "Đánh giá sơ bộ cho thấy mô hình mới có hiệu quả tại các đô thị lớn.",
  "Mục tiêu tiếp theo là cải thiện năng suất và tăng tính kết nối giữa các bên.",
  "Đơn vị quản lý kỳ vọng tạo ra tác động tích cực trong giai đoạn cuối năm.",
  "Chiến lược mới hướng đến sự bền vững và tối ưu chi phí vận hành.",
  "Nhiệm vụ trọng tâm là đảm bảo tiến độ và nâng cao chất lượng triển khai.",
  "Các chuyên gia nhận định thị trường sẽ bước vào giai đoạn cạnh tranh bằng chất lượng dữ liệu.",
  "Động lực tăng trưởng đến từ hạ tầng số, kỹ năng nhân lực và mức độ sẵn sàng đổi mới.",
  "Nhiều chỉ số cho thấy nhu cầu tiêu dùng đang dịch chuyển mạnh sang nền tảng trực tuyến.",
  "Ưu tiên của giai đoạn mới là khả năng thích ứng nhanh và phối hợp liên ngành hiệu quả."
];

const authors = [
  "Minh Châu",
  "Thanh Tùng",
  "Quang Huy",
  "Hà My",
  "Lan Anh",
  "Anh Tuấn",
  "Thu Trang",
  "Bảo Nam",
  "Trà My",
  "Ngọc Khánh"
];

const sourcePool = [
  "Trung tâm Dữ liệu Kinh tế số",
  "Viện Nghiên cứu Chính sách Đô thị",
  "Hiệp hội Doanh nghiệp Công nghệ Việt Nam",
  "Cổng Thông tin Sở Công Thương",
  "Tổ công tác Chuyển đổi số địa phương",
  "Nhóm Phân tích Thị trường Mở",
  "Ban Điều phối Phát triển Bền vững",
  "Mạng lưới Đổi mới Sáng tạo Việt Nam"
];

const locationPool = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Khánh Hòa",
  "Quảng Ninh",
  "Bình Dương"
];

const categoryTags = {
  "Công nghệ": ["AI", "Cloud", "Cybersecurity", "SaaS", "Dữ liệu mở"],
  "Kinh doanh": ["Bán lẻ", "Chuỗi cung ứng", "Đầu tư", "SME", "Tài chính số"],
  "Thể thao": ["Phong độ", "Chiến thuật", "Đào tạo trẻ", "Giải đấu", "Thể lực"],
  "Giải trí": ["Sự kiện", "Nghệ sĩ", "Xu hướng", "Sân khấu", "Nội dung số"],
  "Giáo dục": ["Kỹ năng số", "Đại học", "EdTech", "Học liệu", "Nghiên cứu"],
  "Sức khỏe": ["Y tế số", "Phòng bệnh", "Dinh dưỡng", "Tâm lý", "Điều trị"],
  "Môi trường": ["Phát thải", "Năng lượng sạch", "Tái chế", "Đa dạng sinh học", "ESG"],
  "Du lịch": ["Điểm đến", "Lữ hành", "Khách quốc tế", "Lưu trú", "Văn hóa địa phương"]
};

const imagePool = [
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80"
];

const generatedArticles = Array.from({ length: 45 }, (_, idx) => {
  const id = idx + 6;
  const category = categories[idx % categories.length];
  const title = `${category}: ${titleFragments[idx % titleFragments.length]} ${id}`;
  const summary = summaryFragments[idx % summaryFragments.length];
  const author = authors[idx % authors.length];
  const source = sourcePool[idx % sourcePool.length];
  const location = locationPool[idx % locationPool.length];
  const publishedAt = new Date(Date.UTC(2026, 2, 6, 7, 30, 0) - id * 45 * 60 * 1000).toISOString();
  const image = imagePool[idx % imagePool.length];

  return {
    id,
    title,
    category,
    summary,
    author,
    source,
    location,
    publishedAt,
    image
  };
});

const detailFragments = [
  "Theo ghi nhận từ phóng viên, nhiều đơn vị đang ưu tiên nâng cao chất lượng triển khai và bổ sung quy trình giám sát theo từng giai đoạn.",
  "Đại diện nhóm chuyên gia cho biết việc phối hợp liên ngành và chia sẻ dữ liệu đúng thời điểm sẽ là yếu tố quyết định hiệu quả trong trung hạn.",
  "Trong báo cáo cập nhật, các bên liên quan đề xuất lộ trình cụ thể gồm ba bước: rà soát hiện trạng, thử nghiệm mô hình và đánh giá kết quả theo chỉ số rõ ràng.",
  "Ngoài mục tiêu trước mắt, chính sách vận hành mới còn hướng đến sự bền vững, tối ưu chi phí và nâng cao trải nghiệm của người dùng cuối.",
  "Giới quan sát kỳ vọng những thay đổi này sẽ tạo hiệu ứng lan tỏa, đồng thời mở rộng cơ hội hợp tác giữa doanh nghiệp, cơ quan quản lý và cơ sở đào tạo.",
  "Những tín hiệu tích cực gần đây cho thấy doanh nghiệp đã chủ động hơn trong việc đo lường hiệu quả, quản trị dữ liệu và kiểm soát chi phí theo thời gian thực.",
  "Từ góc nhìn dài hạn, chuyên gia đề xuất cần ưu tiên tiêu chuẩn hóa quy trình để các mô hình triển khai có thể nhân rộng ở nhiều địa phương."
];

function getArticleTags(category, idx) {
  const pool = categoryTags[category] || ["Tin tức", "Phân tích", "Cập nhật", "Xu hướng", "Dữ liệu"];
  return [pool[idx % pool.length], pool[(idx + 1) % pool.length], pool[(idx + 2) % pool.length]];
}

function estimateReadTime(content) {
  const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 200));
}

function buildStats(idx) {
  const baseViews = 1200 + idx * 67;
  const likes = 80 + (idx % 15) * 12;
  const comments = 10 + (idx % 11) * 3;
  const shares = 5 + (idx % 9) * 2;

  return {
    views: baseViews,
    likes,
    comments,
    shares
  };
}

function buildLongContent(article, idx) {
  const first = detailFragments[idx % detailFragments.length];
  const second = detailFragments[(idx + 1) % detailFragments.length];
  const third = detailFragments[(idx + 2) % detailFragments.length];
  const fourth = detailFragments[(idx + 3) % detailFragments.length];
  const dataPointA = 58 + (idx % 27);
  const dataPointB = 34 + (idx % 21);
  const dataPointC = 12 + (idx % 14);

  return [
    article.summary,
    `${first} Chủ đề ${article.category.toLowerCase()} được đánh giá là có dư địa tăng trưởng trong giai đoạn tới.`,
    `${second} Bên cạnh đó, nhiều ý kiến nhấn mạnh cần tiếp tục đầu tư vào nhân lực, hạ tầng và năng lực quản trị rủi ro.`,
    `${third} Qua theo dõi ban đầu, xu hướng mới đang tác động tích cực đến thị trường và tạo cơ sở cho các chương trình hành động tiếp theo.`,
    `Dữ liệu nhanh:\n- ${dataPointA}% đơn vị ghi nhận cải thiện hiệu suất vận hành\n- ${dataPointB}% người dùng đánh giá trải nghiệm tích cực hơn\n- ${dataPointC}% chi phí triển khai được tối ưu sau giai đoạn thử nghiệm`,
    `${fourth} Đây được xem là điều kiện nền tảng để mở rộng quy mô và nâng cao chất lượng dịch vụ trong các quý tiếp theo.`
  ].join("\n\n");
}

const generatedArticlesCount = 95;

const fullGeneratedArticles = Array.from({ length: generatedArticlesCount }, (_, idx) => {
  if (idx < generatedArticles.length) {
    return generatedArticles[idx];
  }

  const id = idx + 6;
  const category = categories[idx % categories.length];

  return {
    id,
    title: `${category}: ${titleFragments[idx % titleFragments.length]} ${id}`,
    category,
    summary: summaryFragments[idx % summaryFragments.length],
    author: authors[idx % authors.length],
    source: sourcePool[idx % sourcePool.length],
    location: locationPool[idx % locationPool.length],
    publishedAt: new Date(Date.UTC(2026, 2, 6, 7, 30, 0) - id * 32 * 60 * 1000).toISOString(),
    image: imagePool[idx % imagePool.length]
  };
});

export const headlines = [...baseArticles, ...fullGeneratedArticles].map((article, idx) => {
  const content = buildLongContent(article, idx);
  const tags = getArticleTags(article.category, idx);

  return {
    ...article,
    tags,
    readTimeMinutes: estimateReadTime(content),
    stats: buildStats(idx),
    content
  };
});
