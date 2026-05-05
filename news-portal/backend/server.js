import bcrypt from "bcryptjs";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { categories, headlines } from "./newsData.js";
import {
  createUser,
  findUserByEmail,
  findUserByName,
  findUserById,
  initializeAdminAccount,
  getAllUsers,
  deleteUser,
  updateUserRole,
  updateUserProfile,
  updateUserPassword,
  updateUserVipPackage,
  updateUserPendingVipRequest,
  findUserByVipRequestId,
  upsertUserPaymentHistory,
  appendUserViewedArticle,
  updateUserSpinWheelReward,
  addFriend,
  getFriends,
  removeFriend,
  getFriendRequests,
  acceptFriendRequest
} from "./usersStore.js";
import { appendConversationMessage, getConversationMessages } from "./messagesStore.js";
import { 
  getPrizes, 
  createPrize, 
  updatePrize, 
  deletePrize, 
  getPrizeById,
  getPrizeByCode
} from "./prizeStore.js";
import {
  getSpinHistory,
  getSpinHistoryPaginated,
  calculateSpinStats,
  addSpinRecord,
  resetUserSpin
} from "./spinWheelStore.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories
} from "./categoriesStore.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "news_portal_secret_dev";
const VIP_APPROVAL_EMAIL = process.env.VIP_APPROVAL_EMAIL || "phanthechung9a3nct@gmail.com";
const VIP_APPROVAL_TOKEN_SECRET = process.env.VIP_APPROVAL_TOKEN_SECRET || `${JWT_SECRET}_vip_approval`;
const PUBLIC_API_URL = process.env.PUBLIC_API_URL || `http://localhost:${PORT}`;
const RESET_PASSWORD_TOKEN_SECRET = process.env.RESET_PASSWORD_TOKEN_SECRET || `${JWT_SECRET}_password_reset`;
const RESET_PASSWORD_TOKEN_EXPIRES_MINUTES = Number.parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRES_MINUTES || "30", 10);
const RESET_PASSWORD_FRONTEND_URL = process.env.RESET_PASSWORD_FRONTEND_URL || "http://localhost:5173";
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || "news-portal@local.dev";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_REJECT_UNAUTHORIZED = process.env.SMTP_REJECT_UNAUTHORIZED !== "false";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const AI_PROVIDER = String(process.env.AI_PROVIDER || "auto").trim().toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "";
const AZURE_OPENAI_ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "");
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "";
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_FALLBACK_MODELS = String(process.env.GEMINI_FALLBACK_MODELS || "gemini-1.5-flash")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const AI_REQUEST_TIMEOUT_MS = Number.parseInt(process.env.AI_REQUEST_TIMEOUT_MS || "30000", 10);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const AVATAR_DATA_URL_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/;
const MAX_AVATAR_LENGTH = 3 * 1024 * 1024;
const ALLOWED_ROLES = new Set(["user", "editor", "moderator", "admin"]);
const PUBLIC_ROLES = new Set(["user", "editor"]);

// Permission definitions for different roles
const PERMISSIONS = {
  user: [
    "read:articles",
    "read:comments",
    "create:comments",
    "read:profile",
    "update:profile",
    "read:friends",
    "manage:friends",
    "read:chat",
    "create:chat",
    "spin:spinwheel",
    "read:prizes",
    "create:vip-request",
    "read:payment-history"
  ],
  editor: [
    "read:articles",
    "read:comments", 
    "create:comments",
    "read:profile",
    "update:profile",
    "read:friends",
    "manage:friends",
    "read:chat",
    "create:chat",
    "spin:spinwheel",
    "read:prizes",
    "create:vip-request",
    "read:payment-history",
    "create:articles",      // Can create articles
    "update:own-articles",  // Can update own articles
    "delete:own-articles"   // Can delete own articles
  ],
  moderator: [
    "read:articles",
    "read:comments",
    "create:comments",
    "read:profile",
    "update:profile",
    "read:friends",
    "manage:friends",
    "read:chat",
    "create:chat",
    "spin:spinwheel",
    "read:prizes",
    "create:vip-request",
    "read:payment-history",
    "create:articles",
    "update:own-articles",
    "delete:own-articles",
    "read:all-articles",    // Can view all articles including unpublished
    "moderate:articles",    // Can approve/reject articles
    "read:users",           // Can view user list
    "read:vip-requests"     // Can view VIP requests
  ],
  admin: [
    "read:articles",
    "read:comments",
    "create:comments",
    "read:profile",
    "update:profile",
    "read:friends",
    "manage:friends",
    "read:chat",
    "create:chat",
    "spin:spinwheel",
    "read:prizes",
    "create:vip-request",
    "read:payment-history",
    "create:articles",
    "update:own-articles",
    "delete:own-articles",
    "read:all-articles",
    "moderate:articles",
    "read:users",
    "read:vip-requests",
    "manage:users",         // Can CRUD users
    "manage:roles",         // Can change user roles
    "manage:prizes",        // Can CRUD prizes
    "manage:spinwheel",     // Can manage spin wheel settings
    "manage:categories",    // Can CRUD categories
    "approve:vip-requests", // Can approve VIP requests
    "read:invoices",        // Can view all invoices
    "read:spin-history",    // Can view all spin history
    "reset:spins"           // Can reset user spins
  ]
};
const DEFAULT_ARTICLE_IMAGE = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80";
const NON_VIP_ARTICLE_VIEW_LIMIT = Number.parseInt(process.env.NON_VIP_ARTICLE_VIEW_LIMIT || "5", 10);
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

const MARKET_SNAPSHOT_CACHE_TTL_MS = Number.parseInt(process.env.MARKET_SNAPSHOT_CACHE_TTL_MS || "180000", 10);
let marketSnapshotCache = {
  payload: null,
  expiresAt: 0
};
const passwordResetRequests = new Map();

function toFiniteNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatSignedPercent(value, digits = 2) {
  const num = toFiniteNumber(value, 0);
  const prefix = num > 0 ? "+" : "";
  return `${prefix}${num.toFixed(digits)}%`;
}

function formatVndNumber(value, maximumFractionDigits = 0) {
  return toFiniteNumber(value, 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits
  });
}

function classifyWeatherCode(code) {
  const value = Number(code);
  const mapping = {
    0: "Trời quang",
    1: "Ít mây",
    2: "Mây rải rác",
    3: "Nhiều mây",
    45: "Sương mù",
    48: "Sương mù dày",
    51: "Mưa phùn nhẹ",
    53: "Mưa phùn",
    55: "Mưa phùn dày",
    61: "Mưa nhẹ",
    63: "Mưa vừa",
    65: "Mưa lớn",
    71: "Tuyết nhẹ",
    73: "Tuyết vừa",
    75: "Tuyết lớn",
    80: "Mưa rào nhẹ",
    81: "Mưa rào",
    82: "Mưa rào lớn",
    95: "Dông",
    96: "Dông kèm mưa đá",
    99: "Dông lớn kèm mưa đá"
  };
  return mapping[value] || "Đang cập nhật";
}

function classifyAqiLevel(aqiValue) {
  const aqi = toFiniteNumber(aqiValue, 0);
  if (aqi <= 50) return { label: "Tốt", advice: "Không khí tốt cho hầu hết hoạt động" };
  if (aqi <= 100) return { label: "Trung bình", advice: "Nhóm nhạy cảm nên theo dõi thêm" };
  if (aqi <= 150) return { label: "Kém", advice: "Hạn chế hoạt động ngoài trời kéo dài" };
  if (aqi <= 200) return { label: "Xấu", advice: "Nên đeo khẩu trang khi ra ngoài" };
  if (aqi <= 300) return { label: "Rất xấu", advice: "Hạn chế ra ngoài nếu không cần thiết" };
  return { label: "Nguy hại", advice: "Nên ở trong nhà và dùng lọc không khí" };
}

async function fetchMarketSources() {
  const requestHeaders = {
    Accept: "application/json",
    "User-Agent": "news-portal/1.0"
  };

  const [quoteResult, weatherResult, airQualityResult] = await Promise.allSettled([
    fetchWithTimeout("https://query1.finance.yahoo.com/v7/finance/quote?symbols=GC=F,KC=F,BZ=F,USDVND=X", {
      method: "GET",
      headers: requestHeaders
    }, 10000),
    fetchWithTimeout(
      "https://api.open-meteo.com/v1/forecast?latitude=16.0544&longitude=108.2022&current=temperature_2m,weather_code,precipitation,cloud_cover",
      {
        method: "GET",
        headers: requestHeaders
      },
      10000
    ),
    fetchWithTimeout(
      "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=16.0544&longitude=108.2022&current=us_aqi",
      {
        method: "GET",
        headers: requestHeaders
      },
      10000
    )
  ]);

  const sourceErrors = [];

  async function parseJsonIfOk(result, sourceName) {
    if (result.status !== "fulfilled") {
      sourceErrors.push(`${sourceName}: ${result.reason?.message || "Request failed"}`);
      return null;
    }

    const response = result.value;
    if (!response.ok) {
      sourceErrors.push(`${sourceName}: HTTP ${response.status}`);
      return null;
    }

    try {
      return await response.json();
    } catch {
      sourceErrors.push(`${sourceName}: Invalid JSON`);
      return null;
    }
  }

  const [quotePayload, weatherPayload, airQualityPayload] = await Promise.all([
    parseJsonIfOk(quoteResult, "Yahoo quotes"),
    parseJsonIfOk(weatherResult, "Open-Meteo weather"),
    parseJsonIfOk(airQualityResult, "Open-Meteo AQI")
  ]);

  const quotes = Array.isArray(quotePayload?.quoteResponse?.result) ? quotePayload.quoteResponse.result : [];
  const quoteBySymbol = new Map(quotes.map((item) => [item.symbol, item]));

  const usdQuote = quoteBySymbol.get("USDVND=X") || {};
  const goldQuote = quoteBySymbol.get("GC=F") || {};
  const coffeeQuote = quoteBySymbol.get("KC=F") || {};
  const oilQuote = quoteBySymbol.get("BZ=F") || {};

  const usdVnd = toFiniteNumber(usdQuote.regularMarketPrice, 25470);
  const xauUsdPerOz = toFiniteNumber(goldQuote.regularMarketPrice, 3020);
  const coffeeCentsPerLb = toFiniteNumber(coffeeQuote.regularMarketPrice, 370);
  const brentUsdPerBarrel = toFiniteNumber(oilQuote.regularMarketPrice, 82.6);

  const goldVndPerLuong = (xauUsdPerOz * usdVnd * 37.5) / 31.1034768;
  const coffeeUsdPerKg = (coffeeCentsPerLb / 100) * 2.20462262;
  const coffeeVndPerKg = coffeeUsdPerKg * usdVnd;

  const weatherCurrent = weatherPayload?.current || {};
  const weatherCode = toFiniteNumber(weatherCurrent.weather_code, 2);
  const temperature = toFiniteNumber(weatherCurrent.temperature_2m, 0);
  const precipitation = toFiniteNumber(weatherCurrent.precipitation, 0);
  const cloudCover = toFiniteNumber(weatherCurrent.cloud_cover, 0);
  const weatherLabel = classifyWeatherCode(weatherCode);

  const aqiValue = toFiniteNumber(airQualityPayload?.current?.us_aqi, 64);
  const aqiLevel = classifyAqiLevel(aqiValue);

  const sourceStatus = {
    quotesLive: quotes.length > 0,
    weatherLive: Boolean(weatherPayload?.current),
    aqiLive: Boolean(airQualityPayload?.current),
    errors: sourceErrors
  };

  return {
    quotes: {
      usdQuote,
      goldQuote,
      coffeeQuote,
      oilQuote
    },
    computed: {
      usdVnd,
      xauUsdPerOz,
      goldVndPerLuong,
      coffeeCentsPerLb,
      coffeeVndPerKg,
      brentUsdPerBarrel,
      temperature,
      precipitation,
      cloudCover,
      weatherLabel,
      aqiValue,
      aqiLevel
    },
    sourceStatus
  };
}

function buildMarketSnapshotPayloadFromSources(sourceData) {
  const { quotes, computed, sourceStatus } = sourceData;

  const widgets = [
    {
      id: "gold",
      label: "Vàng SJC (quy đổi)",
      value: `${(computed.goldVndPerLuong / 1000000).toFixed(2)} tr/lượng`,
      trend: formatSignedPercent(quotes.goldQuote?.regularMarketChangePercent, 2),
      trendUp: toFiniteNumber(quotes.goldQuote?.regularMarketChangePercent, 0) >= 0,
      icon: "🪙"
    },
    {
      id: "coffee",
      label: "Cà phê (quy đổi)",
      value: `${formatVndNumber(computed.coffeeVndPerKg, 0)} đ/kg`,
      trend: formatSignedPercent(quotes.coffeeQuote?.regularMarketChangePercent, 2),
      trendUp: toFiniteNumber(quotes.coffeeQuote?.regularMarketChangePercent, 0) >= 0,
      icon: "☕"
    },
    {
      id: "usd",
      label: "USD/VND",
      value: formatVndNumber(computed.usdVnd, 0),
      trend: formatSignedPercent(quotes.usdQuote?.regularMarketChangePercent, 2),
      trendUp: toFiniteNumber(quotes.usdQuote?.regularMarketChangePercent, 0) >= 0,
      icon: "💵"
    },
    {
      id: "weather",
      label: "Thời tiết Đà Nẵng",
      value: `${Math.round(computed.temperature)}°C | ${computed.weatherLabel}`,
      trend: `${computed.precipitation.toFixed(1)}mm mưa`,
      trendUp: null,
      icon: "🌤️"
    },
    {
      id: "oil",
      label: "Dầu Brent",
      value: `${computed.brentUsdPerBarrel.toFixed(1)} USD/thùng`,
      trend: formatSignedPercent(quotes.oilQuote?.regularMarketChangePercent, 2),
      trendUp: toFiniteNumber(quotes.oilQuote?.regularMarketChangePercent, 0) >= 0,
      icon: "🛢️"
    },
    {
      id: "aqi",
      label: "AQI Đà Nẵng",
      value: `${Math.round(computed.aqiValue)} - ${computed.aqiLevel.label}`,
      trend: computed.aqiLevel.advice,
      trendUp: null,
      icon: "🌿"
    }
  ];

  const detailsByWidget = {
    gold: {
      rows: [
        { label: "Hà Nội", value: `${((computed.goldVndPerLuong - 70000) / 1000000).toFixed(2)} tr/lượng` },
        { label: "Đà Nẵng", value: `${(computed.goldVndPerLuong / 1000000).toFixed(2)} tr/lượng` },
        { label: "TP.HCM", value: `${((computed.goldVndPerLuong + 90000) / 1000000).toFixed(2)} tr/lượng` }
      ]
    },
    coffee: {
      rows: [
        { label: "Hà Nội", value: `${formatVndNumber(computed.coffeeVndPerKg - 900, 0)} đ/kg` },
        { label: "Đà Nẵng", value: `${formatVndNumber(computed.coffeeVndPerKg - 300, 0)} đ/kg` },
        { label: "TP.HCM", value: `${formatVndNumber(computed.coffeeVndPerKg + 600, 0)} đ/kg` }
      ]
    },
    usd: {
      rows: [
        { label: "Hà Nội", value: `${formatVndNumber(computed.usdVnd - 10, 0)} VND` },
        { label: "Đà Nẵng", value: `${formatVndNumber(computed.usdVnd, 0)} VND` },
        { label: "TP.HCM", value: `${formatVndNumber(computed.usdVnd + 8, 0)} VND` }
      ]
    },
    weather: {
      rows: [
        { label: "Hà Nội", value: `${Math.max(10, computed.temperature - 5).toFixed(1)}°C | ${computed.weatherLabel}` },
        { label: "Đà Nẵng", value: `${computed.temperature.toFixed(1)}°C | ${computed.weatherLabel}` },
        { label: "TP.HCM", value: `${Math.min(42, computed.temperature + 3).toFixed(1)}°C | ${computed.weatherLabel}` }
      ]
    },
    oil: {
      rows: [
        { label: "Hà Nội", value: `${(computed.brentUsdPerBarrel + 0.15).toFixed(2)} USD/thùng` },
        { label: "Đà Nẵng", value: `${computed.brentUsdPerBarrel.toFixed(2)} USD/thùng` },
        { label: "TP.HCM", value: `${(computed.brentUsdPerBarrel - 0.12).toFixed(2)} USD/thùng` }
      ]
    },
    aqi: {
      rows: [
        { label: "Hà Nội", value: `${Math.max(0, Math.round(computed.aqiValue + 16))}` },
        { label: "Đà Nẵng", value: `${Math.round(computed.aqiValue)}` },
        { label: "TP.HCM", value: `${Math.max(0, Math.round(computed.aqiValue + 9))}` },
        { label: "Khuyến nghị", value: computed.aqiLevel.advice }
      ]
    }
  };

  const isFullFallback = !(sourceStatus?.quotesLive || sourceStatus?.weatherLive || sourceStatus?.aqiLive);

  return {
    widgets,
    detailsByWidget,
    updatedAt: new Date().toISOString(),
    fallback: isFullFallback,
    partialFallback: !isFullFallback && Boolean(sourceStatus?.errors?.length),
    sourceErrors: Array.isArray(sourceStatus?.errors) ? sourceStatus.errors : []
  };
}

function buildFallbackMarketSnapshotPayload() {
  return {
    widgets: [
      { id: "gold", label: "Vàng SJC", value: "91.20 tr/lượng", trend: "+0.35%", trendUp: true, icon: "🪙" },
      { id: "coffee", label: "Cà phê Tây Nguyên", value: "128.500 đ/kg", trend: "+1.10%", trendUp: true, icon: "☕" },
      { id: "usd", label: "USD/VND", value: "25.470", trend: "-0.08%", trendUp: false, icon: "💵" },
      { id: "weather", label: "Thời tiết Đà Nẵng", value: "21°C | Nhiều mây", trend: "Mưa nhẹ chiều", trendUp: null, icon: "🌤️" },
      { id: "oil", label: "Dầu Brent", value: "82.6 USD/thùng", trend: "+0.42%", trendUp: true, icon: "🛢️" },
      { id: "aqi", label: "AQI trung tâm", value: "64 - Trung bình", trend: "Theo dõi ngoài trời", trendUp: null, icon: "🌿" }
    ],
    detailsByWidget: {
      gold: {
        rows: [
          { label: "Hà Nội", value: "91.10 tr/lượng" },
          { label: "Đà Nẵng", value: "91.20 tr/lượng" },
          { label: "TP.HCM", value: "91.30 tr/lượng" }
        ]
      },
      coffee: {
        rows: [
          { label: "Hà Nội", value: "127.900 đ/kg" },
          { label: "Đà Nẵng", value: "128.500 đ/kg" },
          { label: "TP.HCM", value: "129.100 đ/kg" }
        ]
      },
      usd: {
        rows: [
          { label: "Hà Nội", value: "25.460 VND" },
          { label: "Đà Nẵng", value: "25.470 VND" },
          { label: "TP.HCM", value: "25.478 VND" }
        ]
      },
      weather: {
        rows: [
          { label: "Hà Nội", value: "24.0°C | Nhiều mây" },
          { label: "Đà Nẵng", value: "21.0°C | Nhiều mây" },
          { label: "TP.HCM", value: "28.0°C | Nắng gián đoạn" }
        ]
      },
      oil: {
        rows: [
          { label: "Hà Nội", value: "82.75 USD/thùng" },
          { label: "Đà Nẵng", value: "82.60 USD/thùng" },
          { label: "TP.HCM", value: "82.48 USD/thùng" }
        ]
      },
      aqi: {
        rows: [
          { label: "Hà Nội", value: "86" },
          { label: "Đà Nẵng", value: "64" },
          { label: "TP.HCM", value: "73" },
          { label: "Khuyến nghị", value: "Theo dõi ngoài trời" }
        ]
      }
    },
    updatedAt: new Date().toISOString(),
    fallback: true
  };
}

async function getMarketSnapshotPayload() {
  const now = Date.now();
  if (marketSnapshotCache.payload && marketSnapshotCache.expiresAt > now) {
    return marketSnapshotCache.payload;
  }

  try {
    const sourceData = await fetchMarketSources();
    const payload = buildMarketSnapshotPayloadFromSources(sourceData);
    marketSnapshotCache = {
      payload,
      expiresAt: now + Math.max(30000, MARKET_SNAPSHOT_CACHE_TTL_MS)
    };
    return payload;
  } catch (error) {
    console.error("Failed to fetch market snapshot:", error.message);
    const fallbackPayload = buildFallbackMarketSnapshotPayload();
    marketSnapshotCache = {
      payload: fallbackPayload,
      expiresAt: now + 30000
    };
    return fallbackPayload;
  }
}

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.send(
    "News API đang chạy. Thử <a href='/api/health'>/api/health</a> hoặc <a href='/api/news'>/api/news</a>. Bạn có thể dùng query params: ?page=1&limit=12&category=C%C3%B4ng%20ngh%E1%BB%87"
  );
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "news-portal-api" });
});

app.get("/api/market-snapshot", async (req, res) => {
  try {
    const payload = await getMarketSnapshotPayload();
    res.json(payload);
  } catch (error) {
    res.status(502).json({
      message: "Không thể tải dữ liệu thị trường",
      detail: error?.message || "Unknown error"
    });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  const incomingMessage = String(req.body?.message || "").trim();
  const history = normalizeAiHistory(req.body?.history);
  const context = req.body?.context && typeof req.body.context === "object" ? req.body.context : {};

  if (!incomingMessage) {
    return res.status(400).json({ message: "Thiếu nội dung câu hỏi" });
  }

  const message = incomingMessage.slice(0, 800);
  const localWebsiteReply = buildWebsiteAssistantReplyLocal(message, context);
  const websiteIntent = detectWebsiteAssistantIntent(message);

  if (websiteIntent.isWebsiteQuestion) {
    return res.json({
      reply: localWebsiteReply,
      provider: "website-assistant",
      model: "local-intent-router",
      fallback: false
    });
  }

  const providerConfig = detectAiProviderConfig();
  if (!providerConfig) {
    return res.json({
      reply: localWebsiteReply,
      provider: "website-assistant",
      model: "local-fallback",
      fallback: true
    });
  }

  try {
    let result;

    if (providerConfig.provider === "openai") {
      result = await requestOpenAiReply({ history, message, context });
    } else if (providerConfig.provider === "azure") {
      result = await requestAzureOpenAiReply({ history, message, context });
    } else {
      result = await requestGeminiReply({ history, message, context });
    }

    if (!result.reply) {
      return res.status(502).json({ message: "AI không trả về nội dung hợp lệ" });
    }

    return res.json({
      reply: result.reply,
      provider: result.provider,
      model: result.model
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      return res.json({
        reply: localWebsiteReply,
        provider: "website-assistant",
        model: "local-fallback",
        fallback: true
      });
    }

    const status = Number.isInteger(error?.status) ? error.status : 502;
    console.error("AI chat request failed:", error.message);

    if (status === 429) {
      return res.json({
        reply: localWebsiteReply,
        provider: "website-assistant",
        model: "local-fallback",
        fallback: true
      });
    }

    if (status === 401 || status === 403) {
      return res.json({
        reply: localWebsiteReply,
        provider: "website-assistant",
        model: "local-fallback",
        fallback: true
      });
    }

    if (status === 404) {
      return res.json({
        reply: localWebsiteReply,
        provider: "website-assistant",
        model: "local-fallback",
        fallback: true
      });
    }

    return res.json({
      reply: localWebsiteReply,
      provider: "website-assistant",
      model: "local-fallback",
      fallback: true
    });
  }
});

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
      vipPackage: user.vipPackage
    },
    JWT_SECRET,
    {
    expiresIn: "7d"
    }
  );
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    friendIds: Array.isArray(user.friendIds) ? user.friendIds : [],
    friendCount: Array.isArray(user.friendIds) ? user.friendIds.length : 0,
    incomingFriendRequestIds: Array.isArray(user.incomingFriendRequestIds) ? user.incomingFriendRequestIds : [],
    outgoingFriendRequestIds: Array.isArray(user.outgoingFriendRequestIds) ? user.outgoingFriendRequestIds : [],
    vipPackage: user.vipPackage,
    pendingVipRequest: user.pendingVipRequest || null,
    vipDiscount: user.vipDiscount || null,
    spinWheel: user.spinWheel || null
  };
}

function toPublicAuthorProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar || "",
    role: user.role,
    friendCount: Array.isArray(user.friendIds) ? user.friendIds.length : 0,
    vipStatus: user.vipPackage?.status || "free",
    createdAt: user.createdAt || null
  };
}

function normalizeRole(inputRole) {
  const role = typeof inputRole === "string" ? inputRole.trim().toLowerCase() : "user";
  return ALLOWED_ROLES.has(role) ? role : "";
}

function validateRegisterBody({ name, email, password, role }) {
  if (!name || !email || !password || !role) {
    return "Vui lòng nhập đầy đủ thông tin hợp lệ";
  }

  if (name.length < 2 || name.length > 80) {
    return "Họ tên phải từ 2 đến 80 ký tự";
  }

  if (/[<>]/.test(name)) {
    return "Họ tên chứa ký tự không hợp lệ";
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return "Email không đúng định dạng";
  }

  if (/\s/.test(password) || !PASSWORD_PATTERN.test(password)) {
    return "Mật khẩu phải 8-64 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
  }

  if (!PUBLIC_ROLES.has(role)) {
    return "Không thể tự đăng ký role này";
  }

  return "";
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    return next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

function adminOnlyMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  return next();
}

// Permission checking functions
function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const userPermissions = PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ 
        message: `Bạn không có quyền: ${permission}` 
      });
    }
    return next();
  };
}

function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    const userPermissions = PERMISSIONS[req.user.role] || [];
    const hasAnyPermission = permissions.some(perm => userPermissions.includes(perm));
    
    if (!hasAnyPermission) {
      return res.status(403).json({ 
        message: `Bạn cần một trong các quyền: ${permissions.join(', ')}` 
      });
    }
    return next();
  };
}

function vipOnlyMiddleware(req, res, next) {
  const isAdmin = req.user.role === "admin";
  const vipStatus = req.user.vipPackage?.status;
  
  if (!isAdmin && (!vipStatus || vipStatus === "free")) {
    return res.status(403).json({ message: "Chỉ thành viên VIP mới có quyền đăng tin" });
  }
  return next();
}

function canManageArticle(article, user) {
  if (!article || !user) return false;
  if (user.role === "admin") return true;

  const creatorId = Number.parseInt(article.createdBy, 10);
  const userId = Number.parseInt(user.id, 10);
  return Number.isFinite(creatorId) && Number.isFinite(userId) && creatorId === userId;
}

function isVipOrPrivilegedUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const vipStatus = String(user.vipPackage?.status || "free").toLowerCase();
  return vipStatus !== "free";
}

function getUserViewedArticleIds(user) {
  if (!Array.isArray(user?.newsViewStats?.articleIds)) return [];

  return [...new Set(
    user.newsViewStats.articleIds
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isFinite(id))
  )];
}

function buildFallbackContentFromSummary(summary) {
  const safeSummary = typeof summary === "string" ? summary.trim() : "";
  return [
    safeSummary,
    "Thông tin chi tiết đang được cập nhật bổ sung từ các nguồn xác thực, bao gồm ý kiến chuyên gia và dữ liệu tổng hợp theo từng giai đoạn.",
    "Ban biên tập tiếp tục theo dõi diễn biến liên quan để cung cấp góc nhìn đầy đủ hơn về tác động và các xu hướng tiếp theo."
  ].join("\n\n");
}

function restoreVietnameseText(value) {
  if (typeof value !== "string") return value;
  return TEXT_REPLACEMENTS.reduce((result, [from, to]) => result.replaceAll(from, to), value);
}

function normalizeImageUrl(image) {
  const normalized = typeof image === "string" ? image.trim() : "";
  return normalized || DEFAULT_ARTICLE_IMAGE;
}

function isValidAvatarUrl(value) {
  const avatar = typeof value === "string" ? value.trim() : "";
  if (!avatar) return true;
  if (avatar.length > MAX_AVATAR_LENGTH) return false;
  if (avatar.startsWith("https://") || avatar.startsWith("http://")) return true;
  if (AVATAR_DATA_URL_PATTERN.test(avatar)) return true;
  return false;
}

function normalizeArticleDisplay(article) {
  if (!article) return article;
  return {
    ...article,
    title: restoreVietnameseText(article.title),
    summary: restoreVietnameseText(article.summary),
    category: restoreVietnameseText(article.category),
    author: restoreVietnameseText(article.author),
    image: normalizeImageUrl(article.image),
    content: restoreVietnameseText(article.content)
  };
}

function normalizeAiHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      text: String(item.text || "").trim()
    }))
    .filter((item) => item.text.length > 0)
    .slice(-8);
}

function safeJsonContent(response) {
  return response.text().then((rawText) => {
    try {
      return { json: JSON.parse(rawText), rawText };
    } catch {
      return { json: null, rawText };
    }
  });
}

async function fetchWithTimeout(url, options, timeoutMs = AI_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildAiSystemPrompt() {
  return [
    "Bạn là trợ lý AI cho cổng tin tức tiếng Việt.",
    "Trả lời tự nhiên, ngắn gọn, thân thiện và hữu ích.",
    "Ưu tiên tiếng Việt có dấu.",
    "Nếu câu hỏi mơ hồ, hãy gợi ý 1-2 cách hỏi lại rõ hơn.",
    "Không bịa thông tin ngoài ngữ cảnh được cung cấp."
  ].join(" ");
}

function buildAiUserPrompt(message, context) {
  const safeContext = context && typeof context === "object" ? context : {};
  const preferredCategories = Array.isArray(safeContext.preferredCategories)
    ? safeContext.preferredCategories.filter(Boolean).slice(0, 5)
    : [];
  const topArticles = Array.isArray(safeContext.topArticles)
    ? safeContext.topArticles.filter(Boolean).slice(0, 8)
    : [];

  return [
    `Câu hỏi người dùng: ${message}`,
    preferredCategories.length > 0
      ? `Chuyên mục người dùng quan tâm: ${preferredCategories.join(", ")}`
      : "Chuyên mục người dùng quan tâm: chưa có dữ liệu rõ ràng",
    topArticles.length > 0
      ? `Tiêu đề bài viết nổi bật hiện có: ${topArticles.join(" | ")}`
      : "Tiêu đề bài viết nổi bật hiện có: chưa có dữ liệu",
    "Hãy trả lời theo ngữ cảnh trang báo điện tử, có thể gợi ý người dùng bấm tìm kiếm bằng từ khóa ngắn nếu phù hợp."
  ].join("\n");
}

function trimAssistantReply(reply) {
  return String(reply || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

function normalizeSearchText(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildWebsiteAssistantReplyLocal(message, context) {
  const normalized = normalizeSearchText(message);
  const safeContext = context && typeof context === "object" ? context : {};
  const preferredCategories = Array.isArray(safeContext.preferredCategories)
    ? safeContext.preferredCategories.filter(Boolean).slice(0, 3)
    : [];
  const topArticles = Array.isArray(safeContext.topArticles)
    ? safeContext.topArticles.filter(Boolean).slice(0, 3)
    : [];

  const categoryHint = preferredCategories.length > 0
    ? ` Chủ đề bạn hay đọc: ${preferredCategories.join(", ")}.`
    : "";

  const topArticlesHint = topArticles.length > 0
    ? ` Bạn cũng có thể xem nhanh: ${topArticles.join(" | ")}.`
    : "";

  const multiIntentReplies = [];
  if (/dang nhap|dang ky|tai khoan|mat khau/.test(normalized)) {
    multiIntentReplies.push("Đăng nhập/đăng ký: dùng nút ở góc phải header; nếu quên mật khẩu, hãy đăng xuất rồi đăng nhập lại để kiểm tra trạng thái tài khoản.");
  }
  if (/vip|goi|nang cap|thanh toan/.test(normalized)) {
    multiIntentReplies.push("VIP: vào menu tài khoản -> Nâng cấp VIP, chọn gói và xác nhận thanh toán; trạng thái duyệt hiển thị trong hồ sơ/thông báo.");
  }
  if (/dang tin|tao tin|viet bai|dang bai/.test(normalized)) {
    multiIntentReplies.push("Đăng tin: cần đăng nhập và có quyền phù hợp (VIP/admin), sau đó nhập tiêu đề, chuyên mục, tóm tắt, ảnh đại diện và gửi duyệt/xuất bản.");
  }
  if (/tim kiem|search|goi y|de xuat|chu de|tu khoa/.test(normalized)) {
    multiIntentReplies.push(`Tìm kiếm: dùng ô search ở header hoặc hỏi chat AI theo từ khóa/chuyên mục.${categoryHint}`);
  }
  if (/admin|quan tri|phan quyen|xoa user|duyet/.test(normalized)) {
    multiIntentReplies.push("Quản trị: chỉ role admin mới truy cập được khu quản lý user, tin tức, yêu cầu VIP và hóa đơn.");
  }

  if (multiIntentReplies.length >= 2) {
    return multiIntentReplies.join(" ");
  }

  if (/xin chao|chao ban|hello|hi\b|alo/.test(normalized)) {
    return "Chào bạn, mình sẵn sàng hỗ trợ về website tin tức. Bạn muốn tìm bài, hỏi cách đăng tin, nâng cấp VIP hay quản trị?";
  }

  if (/ban la ai|la ai|tro ly gi|lam duoc gi/.test(normalized)) {
    return "Mình là trợ lý AI của website, hỗ trợ tìm kiếm bài viết, gợi ý nội dung cá nhân hóa và hướng dẫn thao tác như đăng nhập, đăng tin, VIP, quản trị.";
  }

  if (/dang nhap|dang ky|tai khoan|mat khau/.test(normalized)) {
    return "Bạn có thể dùng nút Đăng nhập ở góc phải header. Nếu chưa có tài khoản, chọn Đăng ký và nhập đủ họ tên, email, mật khẩu theo yêu cầu bảo mật. Nếu quên mật khẩu, hãy đăng xuất thiết bị cũ và đăng nhập lại để kiểm tra trạng thái tài khoản.";
  }

  if (/dang xuat|thoat tai khoan|logout/.test(normalized)) {
    return "Bạn mở menu tài khoản ở góc phải header và chọn Đăng xuất. Sau khi đăng xuất, bạn có thể đăng nhập lại bằng tài khoản khác.";
  }

  if (/vip|goi|nang cap|thanh toan/.test(normalized)) {
    return "Để nâng cấp VIP, vào menu tài khoản -> Nâng cấp VIP, chọn gói rồi xác nhận thanh toán. Sau khi gửi yêu cầu, bạn theo dõi trạng thái duyệt trong hồ sơ người dùng hoặc thông báo hệ thống.";
  }

  if (/dang tin|tao tin|viet bai|dang bai/.test(normalized)) {
    return "Để đăng tin, bạn cần đăng nhập và có quyền phù hợp (VIP hoặc admin theo cấu hình). Sau đó vào khu vực tạo bài, nhập tiêu đề, chuyên mục, tóm tắt và ảnh đại diện, rồi bấm gửi duyệt/xuất bản theo phân quyền hiện tại.";
  }

  if (/anh|hinh|video|dinh kem|tep/.test(normalized)) {
    return "Khi đăng nội dung, bạn có thể đính kèm ảnh/video theo giới hạn dung lượng hệ thống. Nên dùng ảnh rõ, tiêu đề ngắn gọn và tóm tắt đúng trọng tâm để tăng khả năng hiển thị.";
  }

  if (/admin|quan tri|phan quyen|xoa user|duyet/.test(normalized)) {
    return "Khu vực quản trị cho phép quản lý người dùng, tin tức, yêu cầu VIP và hóa đơn. Bạn cần tài khoản role admin để truy cập. Nếu không thấy menu quản trị, hãy đăng xuất và đăng nhập lại để làm mới quyền.";
  }

  if (/tim kiem|search|goi y|de xuat|chu de|tu khoa/.test(normalized)) {
    return `Bạn có thể tìm tin bằng ô tìm kiếm ở header hoặc hỏi trực tiếp chat AI theo từ khóa/chuyên mục.${categoryHint} Mẹo: dùng 2-5 từ khóa cụ thể để kết quả chính xác hơn.`;
  }

  if (/trang chu|menu|header|sidebar|chuyen muc/.test(normalized)) {
    return "Trên trang chủ, bạn dùng menu trên cùng để chuyển chuyên mục; thanh tìm kiếm để lọc tin; khối Top bài viết để xem nội dung nổi bật và chat AI để hỏi nhanh theo nhu cầu.";
  }

  if (/doc nhieu|top|noi bat|hot|xu huong/.test(normalized)) {
    return `Để xem nội dung nổi bật, bạn mở khu Top bài viết trên trang chủ và chuyển tab Xem nhiều/Thích nhiều/Truy cập nhiều.${topArticlesHint}`;
  }

  if (/luu bai|danh dau|yeu thich|thich bai/.test(normalized)) {
    return "Bạn có thể bấm nút Lưu hoặc Thích trong trang chi tiết bài viết. Hành vi này giúp hệ thống cá nhân hóa gợi ý chính xác hơn cho tài khoản của bạn.";
  }

  if (/khong tim thay|khong thay|loi|bug/.test(normalized)) {
    return "Nếu bạn không tìm thấy nội dung mong muốn, hãy thử đổi từ khóa ngắn hơn, bỏ dấu câu đặc biệt, hoặc lọc theo chuyên mục. Nếu vẫn lỗi, bạn có thể gửi phản hồi ở mục Liên hệ để tòa soạn hỗ trợ nhanh.";
  }

  if (/lien he|toa soan|hotline|email/.test(normalized)) {
    return "Bạn có thể mở mục Liên hệ để gửi biểu mẫu tới tòa soạn, kèm thông tin họ tên, email và tệp đính kèm nếu cần.";
  }

  if (/bao mat|an toan|quyen rieng tu|du lieu/.test(normalized)) {
    return "Để an toàn tài khoản, bạn nên dùng mật khẩu mạnh, không chia sẻ token đăng nhập và đăng xuất khi dùng máy công cộng. Nếu nghi ngờ bất thường, hãy đổi mật khẩu ngay.";
  }

  return `Mình có thể hỗ trợ các câu hỏi liên quan website: đăng nhập, đăng ký, đăng tin, tìm kiếm, gói VIP, quản trị, lưu/thích bài và liên hệ tòa soạn.${categoryHint} Bạn muốn bắt đầu từ mục nào?`;
}

function detectWebsiteAssistantIntent(message) {
  const normalized = normalizeSearchText(message);
  const websitePatterns = [
    /dang nhap|dang ky|tai khoan|mat khau|dang xuat/,
    /vip|nang cap|thanh toan|goi/,
    /dang tin|tao tin|viet bai|duyet|xuat ban/,
    /tim kiem|search|tu khoa|goi y|chu de/,
    /admin|quan tri|phan quyen|user/,
    /lien he|toa soan|hotline|email/,
    /trang chu|menu|header|sidebar|chuyen muc/,
    /luu bai|thich bai|yeu thich|top|noi bat|xu huong/,
    /website|web|trang tin|cong thong tin/
  ];

  const isWebsiteQuestion = websitePatterns.some((pattern) => pattern.test(normalized));
  return { isWebsiteQuestion };
}

function createApiError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function detectAiProviderConfig() {
  const hasOpenAi = OPENAI_API_KEY.length > 0;
  const hasAzureOpenAi =
    AZURE_OPENAI_API_KEY.length > 0 &&
    AZURE_OPENAI_ENDPOINT.length > 0 &&
    AZURE_OPENAI_DEPLOYMENT.length > 0;
  const hasGemini = GEMINI_API_KEY.length > 0;

  if (AI_PROVIDER === "openai") {
    return hasOpenAi ? { provider: "openai", model: OPENAI_MODEL } : null;
  }

  if (AI_PROVIDER === "azure" || AI_PROVIDER === "azure-openai") {
    return hasAzureOpenAi ? { provider: "azure", model: AZURE_OPENAI_DEPLOYMENT } : null;
  }

  if (AI_PROVIDER === "gemini") {
    return hasGemini ? { provider: "gemini", model: GEMINI_MODEL } : null;
  }

  if (hasOpenAi) return { provider: "openai", model: OPENAI_MODEL };
  if (hasAzureOpenAi) return { provider: "azure", model: AZURE_OPENAI_DEPLOYMENT };
  if (hasGemini) return { provider: "gemini", model: GEMINI_MODEL };
  return null;
}

async function requestOpenAiReply({ history, message, context }) {
  const endpoint = `${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`;
  const messages = [
    { role: "system", content: buildAiSystemPrompt() },
    ...history.map((item) => ({ role: item.role, content: item.text })),
    { role: "user", content: buildAiUserPrompt(message, context) }
  ];

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.6
    })
  });

  const { json, rawText } = await safeJsonContent(response);
  if (!response.ok) {
    throw createApiError(response.status, `OpenAI API error (${response.status}): ${rawText.slice(0, 300)}`);
  }

  const reply = json?.choices?.[0]?.message?.content || "";
  return { reply: trimAssistantReply(reply), provider: "openai", model: OPENAI_MODEL };
}

async function requestAzureOpenAiReply({ history, message, context }) {
  const endpoint = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${encodeURIComponent(AZURE_OPENAI_API_VERSION)}`;
  const messages = [
    { role: "system", content: buildAiSystemPrompt() },
    ...history.map((item) => ({ role: item.role, content: item.text })),
    { role: "user", content: buildAiUserPrompt(message, context) }
  ];

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": AZURE_OPENAI_API_KEY
    },
    body: JSON.stringify({
      messages,
      temperature: 0.6
    })
  });

  const { json, rawText } = await safeJsonContent(response);
  if (!response.ok) {
    throw createApiError(response.status, `Azure OpenAI API error (${response.status}): ${rawText.slice(0, 300)}`);
  }

  const reply = json?.choices?.[0]?.message?.content || "";
  return { reply: trimAssistantReply(reply), provider: "azure", model: AZURE_OPENAI_DEPLOYMENT };
}

async function requestGeminiReply({ history, message, context }) {
  const candidateModels = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter(
    (model, index, list) => model && list.indexOf(model) === index
  );
  const contents = [
    ...history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.text }]
    })),
    {
      role: "user",
      parts: [{ text: buildAiUserPrompt(message, context) }]
    }
  ];

  let lastError = "";
  let lastStatus = 502;

  for (const model of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildAiSystemPrompt() }]
        },
        contents,
        generationConfig: {
          temperature: 0.6
        }
      })
    });

    const { json, rawText } = await safeJsonContent(response);
    if (response.ok) {
      const reply =
        json?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text || "")
          .join("\n") || "";
      return { reply: trimAssistantReply(reply), provider: "gemini", model };
    }

    lastStatus = response.status;
    lastError = `Gemini API error (${response.status}): ${rawText.slice(0, 300)}`;

    // If current model is not found, try next fallback model.
    if (response.status === 404) {
      continue;
    }

    throw createApiError(lastStatus, lastError);
  }

  throw createApiError(lastStatus, lastError || "Gemini API error: no supported model available");
}

function getPackageDisplayName(status) {
  if (status === "silver") return "VIP Bac";
  if (status === "gold") return "VIP Vang";
  if (status === "platinum") return "VIP Bach kim";
  return "Mien phi";
}

function getPackagePrice(status) {
  if (status === "silver") return "99.000 VNĐ";
  if (status === "gold") return "199.000 VNĐ";
  if (status === "platinum") return "299.000 VNĐ";
  return "0 VNĐ";
}

function getPackagePriceAmount(status) {
  if (status === "silver") return 99000;
  if (status === "gold") return 199000;
  if (status === "platinum") return 299000;
  return 0;
}

function getVipUpgradePayableAmount(currentStatus, nextStatus) {
  const currentAmount = getPackagePriceAmount(currentStatus);
  const nextAmount = getPackagePriceAmount(nextStatus);
  return Math.max(0, nextAmount - currentAmount);
}

function getVipStatusTier(status) {
  if (status === "platinum") return 3;
  if (status === "gold") return 2;
  if (status === "silver") return 1;
  return 0;
}

function getUserVipDiscountPercent(user) {
  if (!user?.vipDiscount || user.vipDiscount.used) return 0;
  const percent = Number(user.vipDiscount.percent);
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, percent));
}

function applyVipDiscount(amount, discountPercent) {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const safePercent = Number.isFinite(Number(discountPercent)) ? Number(discountPercent) : 0;
  const discounted = Math.round(safeAmount * (1 - safePercent / 100));
  return Math.max(0, discounted);
}

const SPIN_WHEEL_PRIZE_POOL = [
  {
    code: "vip_discount_50",
    label: "Giảm giá nửa giá VIP cho tất cả các gói",
    discountPercent: 50
  },
  {
    code: "free_vip_silver",
    label: "Free VIP Bạc",
    vipStatus: "silver"
  },
  {
    code: "lucky_next_time",
    label: "Chúc bạn may mắn lần sau"
  },
  {
    code: "vip_discount_5",
    label: "Giảm giá 5%",
    discountPercent: 5
  }
];

// Global cache for spin wheel prizes
let SPIN_WHEEL_PRIZES_CACHE = [...SPIN_WHEEL_PRIZE_POOL];

async function loadSpinWheelPrizes() {
  try {
    const prizes = await getPrizes();
    if (prizes.length > 0) {
      SPIN_WHEEL_PRIZES_CACHE = prizes.map(p => ({
        code: p.code,
        label: p.label,
        ...(p.discountPercent && { discountPercent: p.discountPercent }),
        ...(p.vipStatus && { vipStatus: p.vipStatus })
      }));
    }
  } catch (error) {
    console.error("Failed to load spin wheel prizes:", error.message);
    SPIN_WHEEL_PRIZES_CACHE = SPIN_WHEEL_PRIZE_POOL;
  }
}

function pickSpinWheelPrize() {
  const index = Math.floor(Math.random() * SPIN_WHEEL_PRIZES_CACHE.length);
  return SPIN_WHEEL_PRIZES_CACHE[index];
}

function resolveSpinReward(user, prize) {
  const currentStatus = user?.vipPackage?.status || "free";
  const currentTier = getVipStatusTier(currentStatus);
  const silverTier = getVipStatusTier("silver");

  if (prize.code === "free_vip_silver") {
    if (currentTier < silverTier) {
      return {
        autoVipStatus: "silver",
        discountPercent: 0,
        rewardMessage: "Tài khoản đã được nâng tự động lên VIP Bạc."
      };
    }

    return {
      autoVipStatus: null,
      discountPercent: 50,
      rewardMessage: "Bạn đã có VIP từ Bạc trở lên, phần thưởng được đổi thành voucher giảm 50% nâng cấp VIP tiếp theo."
    };
  }

  if (prize.discountPercent) {
    return {
      autoVipStatus: null,
      discountPercent: prize.discountPercent,
      rewardMessage: `Bạn nhận voucher giảm ${prize.discountPercent}% cho lần nâng cấp VIP tiếp theo.`
    };
  }

  return {
    autoVipStatus: null,
    discountPercent: 0,
    rewardMessage: "Chúc bạn may mắn lần sau."
  };
}

function formatCurrencyVnd(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} đ`;
}

function resolveInvoiceTimestamp(record) {
  return new Date(
    record?.requestedAt ||
      record?.decidedAt ||
      record?.activatedAt ||
      record?.updatedAt ||
      0
  ).getTime();
}

function normalizePaymentStatus(record) {
  const rawPaymentStatus = String(record?.paymentStatus || "").trim();
  if (["paid", "awaiting_approval", "rejected"].includes(rawPaymentStatus)) {
    return rawPaymentStatus;
  }

  const state = String(record?.state || "pending").trim();
  if (state === "approved") return "paid";
  if (state === "rejected") return "rejected";
  return "awaiting_approval";
}

function normalizeInvoiceRecord(record, user) {
  const packageStatus = String(record?.packageStatus || record?.status || "free").trim() || "free";
  const amount = Number(record?.amount);
  const safeAmount = Number.isFinite(amount) ? amount : getPackagePriceAmount(packageStatus);
  const state = String(record?.state || "pending").trim();
  const paymentStatus = normalizePaymentStatus(record);

  return {
    invoiceId: String(record?.invoiceId || "").trim(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    packageStatus,
    packageName: getPackageDisplayName(packageStatus),
    amount: safeAmount,
    amountText: formatCurrencyVnd(safeAmount),
    state,
    paymentStatus,
    requestedAt: record?.requestedAt || null,
    decidedAt: record?.decidedAt || null,
    activatedAt: record?.activatedAt || null,
    expiresAt: record?.expiresAt || null,
    decidedBy: record?.decidedBy || null,
    source: record?.source || "payment_history"
  };
}

function resolveVipProfileInvoiceAmount(user, vipStatus) {
  const upgradeSource = String(user?.vipPackage?.lastUpgradeSource || "").trim().toLowerCase();
  const hasRewardSource = upgradeSource === "spin_wheel_reward";
  const isLegacySpinSilverReward =
    !upgradeSource &&
    vipStatus === "silver" &&
    user?.spinWheel?.prizeCode === "free_vip_silver";

  if (hasRewardSource || isLegacySpinSilverReward) {
    return {
      amount: 0,
      source: "spin_wheel_reward"
    };
  }

  return {
    amount: getPackagePriceAmount(vipStatus),
    source: "vip_profile"
  };
}

function buildUserInvoices(user) {
  const invoiceMap = new Map();
  const historyRecords = Array.isArray(user.paymentHistory) ? user.paymentHistory : [];

  historyRecords.forEach((record) => {
    const invoiceId = String(record?.invoiceId || "").trim();
    if (!invoiceId) return;
    invoiceMap.set(invoiceId, normalizeInvoiceRecord(record, user));
  });

  const legacyInvoices = buildAdminInvoices([user], { skipHistory: true });
  legacyInvoices.forEach((invoice) => {
    if (!invoiceMap.has(invoice.invoiceId)) {
      invoiceMap.set(invoice.invoiceId, invoice);
    }
  });

  return Array.from(invoiceMap.values()).sort((a, b) => {
    const aTime = resolveInvoiceTimestamp(a);
    const bTime = resolveInvoiceTimestamp(b);
    return bTime - aTime;
  });
}

function buildAdminInvoices(users, options = {}) {
  const includeHistory = !options.skipHistory;
  const invoices = [];

  users.forEach((user) => {
    if (includeHistory && Array.isArray(user.paymentHistory) && user.paymentHistory.length > 0) {
      user.paymentHistory.forEach((record) => {
        const invoiceId = String(record?.invoiceId || "").trim();
        if (!invoiceId) return;
        invoices.push(normalizeInvoiceRecord(record, user));
      });
      return;
    }

    const vipStatus = user.vipPackage?.status || "free";
    const pending = user.pendingVipRequest || null;

    if (pending && ["pending", "approved", "rejected"].includes(pending.state)) {
      const amount = Number.isFinite(Number(pending.amount))
        ? Math.max(0, Number(pending.amount))
        : getVipUpgradePayableAmount(pending.fromStatus || "free", pending.status);
      invoices.push({
        invoiceId: pending.requestId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        packageStatus: pending.status,
        packageName: getPackageDisplayName(pending.status),
        amount,
        amountText: formatCurrencyVnd(amount),
        state: pending.state,
        paymentStatus: pending.state === "approved" ? "paid" : pending.state === "pending" ? "awaiting_approval" : "rejected",
        requestedAt: pending.requestedAt || null,
        decidedAt: pending.decidedAt || null,
        activatedAt: user.vipPackage?.activatedAt || null,
        expiresAt: user.vipPackage?.expiresAt || null,
        decidedBy: pending.decidedBy || null,
        source: "vip_request"
      });
    }

    if (vipStatus !== "free" && vipStatus !== "premium" && !pending) {
      const invoiceMeta = resolveVipProfileInvoiceAmount(user, vipStatus);
      const amount = invoiceMeta.amount;
      invoices.push({
        invoiceId: `vip-${user.id}-${user.vipPackage?.updatedAt || user.vipPackage?.activatedAt || user.createdAt}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        packageStatus: vipStatus,
        packageName: getPackageDisplayName(vipStatus),
        amount,
        amountText: formatCurrencyVnd(amount),
        state: "approved",
        paymentStatus: "paid",
        requestedAt: user.vipPackage?.activatedAt || user.vipPackage?.updatedAt || user.createdAt,
        decidedAt: user.vipPackage?.updatedAt || user.vipPackage?.activatedAt || null,
        activatedAt: user.vipPackage?.activatedAt || null,
        expiresAt: user.vipPackage?.expiresAt || null,
        decidedBy: null,
        source: invoiceMeta.source
      });
    }
  });

  return invoices.sort((a, b) => {
    const aTime = resolveInvoiceTimestamp(a);
    const bTime = resolveInvoiceTimestamp(b);
    return bTime - aTime;
  });
}

function buildVipApprovalToken(payload) {
  return jwt.sign(payload, VIP_APPROVAL_TOKEN_SECRET, { expiresIn: "3d" });
}

function verifyVipApprovalToken(token) {
  return jwt.verify(token, VIP_APPROVAL_TOKEN_SECRET);
}

function buildPasswordResetToken(payload) {
  const expiresInMinutes = Number.isFinite(RESET_PASSWORD_TOKEN_EXPIRES_MINUTES)
    ? Math.max(5, RESET_PASSWORD_TOKEN_EXPIRES_MINUTES)
    : 30;
  return jwt.sign(payload, RESET_PASSWORD_TOKEN_SECRET, { expiresIn: `${expiresInMinutes}m` });
}

function verifyPasswordResetToken(token) {
  return jwt.verify(token, RESET_PASSWORD_TOKEN_SECRET);
}

function purgeExpiredPasswordResetRequests() {
  const now = Date.now();
  for (const [requestId, requestMeta] of passwordResetRequests.entries()) {
    if (requestMeta.expiresAt <= now || requestMeta.used) {
      passwordResetRequests.delete(requestId);
    }
  }
}

function buildPasswordResetLink(token) {
  const separator = RESET_PASSWORD_FRONTEND_URL.includes("?") ? "&" : "?";
  return `${RESET_PASSWORD_FRONTEND_URL}${separator}resetToken=${encodeURIComponent(token)}`;
}

function getMailerTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    tls: {
      rejectUnauthorized: SMTP_REJECT_UNAUTHORIZED
    }
  });
}

async function sendVipApprovalEmail({ user, packageStatus, requestId, requestedAt, currentStatus = "free", payableAmount = null }) {
  const approveToken = buildVipApprovalToken({
    type: "vip-payment-approval",
    decision: "approve",
    requestId
  });
  const rejectToken = buildVipApprovalToken({
    type: "vip-payment-approval",
    decision: "reject",
    requestId
  });

  const approveUrl = `${PUBLIC_API_URL}/api/vip-payment/decision?token=${encodeURIComponent(approveToken)}`;
  const rejectUrl = `${PUBLIC_API_URL}/api/vip-payment/decision?token=${encodeURIComponent(rejectToken)}`;
  const packageName = getPackageDisplayName(packageStatus);
  const fromPackageName = getPackageDisplayName(currentStatus);
  const computedPayableAmount = getVipUpgradePayableAmount(currentStatus, packageStatus);
  const effectivePayableAmount = Number.isFinite(Number(payableAmount))
    ? Math.max(0, Number(payableAmount))
    : computedPayableAmount;
  const packagePrice = formatCurrencyVnd(effectivePayableAmount);

  const text = [
    "Yeu cau xac nhan nang cap VIP moi.",
    `User ID: ${user.id}`,
    `Ho ten: ${user.name}`,
    `Email: ${user.email}`,
    `Goi hien tai: ${fromPackageName}`,
    `Goi dang ky: ${packageName}`,
    `So tien can thanh toan them: ${packagePrice}`,
    `Thoi gian gui yeu cau: ${requestedAt}`,
    `Ma yeu cau: ${requestId}`,
    `Duyet: ${approveUrl}`,
    `Tu choi: ${rejectUrl}`
  ].join("\n");

  const html = `
    <h2>Yeu cau xac nhan thanh toan VIP</h2>
    <p><strong>User ID:</strong> ${user.id}</p>
    <p><strong>Ho ten:</strong> ${user.name}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Goi hien tai:</strong> ${fromPackageName}</p>
    <p><strong>Goi dang ky:</strong> ${packageName}</p>
    <p><strong>So tien can thanh toan them:</strong> ${packagePrice}</p>
    <p><strong>Thoi gian gui yeu cau:</strong> ${requestedAt}</p>
    <p><strong>Ma yeu cau:</strong> ${requestId}</p>
    <p>
      <a href="${approveUrl}" style="display:inline-block;padding:10px 16px;background:#0b6b53;color:#fff;text-decoration:none;border-radius:8px;margin-right:12px;">Duyet nang cap VIP</a>
      <a href="${rejectUrl}" style="display:inline-block;padding:10px 16px;background:#a80f0f;color:#fff;text-decoration:none;border-radius:8px;">Tu choi</a>
    </p>
    <p>Luu y: Link co hieu luc trong 3 ngay.</p>
  `;

  const transporter = getMailerTransporter();
  if (!transporter) {
    console.warn("SMTP is not configured. Approval links:", { approveUrl, rejectUrl, requestId });
    return {
      sent: false,
      reason: "SMTP chưa được cấu hình"
    };
  }

  await transporter.sendMail({
    from: MAIL_FROM,
    to: VIP_APPROVAL_EMAIL,
    subject: `[News Portal] Yêu cầu nâng cấp ${packageName}`,
    text,
    html
  });

  return {
    sent: true
  };
}

async function sendPasswordResetEmail({ user, resetLink, requestedAt }) {
  const transporter = getMailerTransporter();
  if (!transporter) {
    console.warn("SMTP is not configured. Password reset link:", {
      userId: user.id,
      email: user.email,
      resetLink
    });
    return {
      sent: false,
      reason: "SMTP chưa được cấu hình"
    };
  }

  const text = [
    "Ban da yeu cau dat lai mat khau tai khoan News Portal.",
    `Tai khoan: ${user.email}`,
    `Thoi gian yeu cau: ${requestedAt}`,
    `Link dat lai mat khau: ${resetLink}`,
    "Link co hieu luc trong thoi gian ngan. Neu ban khong yeu cau, hay bo qua email nay."
  ].join("\n");

  const html = `
    <h2>Dat lai mat khau News Portal</h2>
    <p>Chao <strong>${user.name}</strong>,</p>
    <p>Chung toi da nhan yeu cau dat lai mat khau cho tai khoan <strong>${user.email}</strong>.</p>
    <p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#0b6b53;color:#fff;text-decoration:none;border-radius:8px;">Dat lai mat khau</a>
    </p>
    <p>Neu nut tren khong hoat dong, ban co the copy link sau:</p>
    <p style="word-break:break-all;">${resetLink}</p>
    <p>Neu ban khong yeu cau, hay bo qua email nay.</p>
  `;

  await transporter.sendMail({
    from: MAIL_FROM,
    to: user.email,
    subject: "[News Portal] Dat lai mat khau",
    text,
    html
  });

  return {
    sent: true
  };
}

async function processVipDecision({ requestId, decision, decidedBy }) {
  const user = await findUserByVipRequestId(requestId);
  if (!user || !user.pendingVipRequest) {
    return { ok: false, statusCode: 404, message: "Không tìm thấy yêu cầu nâng cấp VIP." };
  }

  if (user.pendingVipRequest.state !== "pending") {
    return { ok: false, statusCode: 409, message: "Yêu cầu này đã được xử lý trước đó." };
  }

  if (decision === "reject") {
    const decidedAt = new Date().toISOString();
    const pendingAmount = Number.isFinite(Number(user.pendingVipRequest.amount))
      ? Math.max(0, Number(user.pendingVipRequest.amount))
      : getVipUpgradePayableAmount(
          user.pendingVipRequest.fromStatus || user.vipPackage?.status || "free",
          user.pendingVipRequest.status
        );
    await updateUserPendingVipRequest(user.id, {
      ...user.pendingVipRequest,
      state: "rejected",
      decidedAt,
      decidedBy
    });

    await upsertUserPaymentHistory(user.id, {
      invoiceId: user.pendingVipRequest.requestId,
      packageStatus: user.pendingVipRequest.status,
      amount: pendingAmount,
      state: "rejected",
      paymentStatus: "rejected",
      requestedAt: user.pendingVipRequest.requestedAt || null,
      decidedAt,
      decidedBy,
      source: "vip_request"
    });

    return {
      ok: true,
      user,
      approved: false,
      statusCode: 200,
      message: `Đã từ chối yêu cầu nâng cấp của tài khoản ${user.email}.`
    };
  }

  if (decision !== "approve") {
    return { ok: false, statusCode: 400, message: "Quyết định không hợp lệ." };
  }

  const approvedStatus = user.pendingVipRequest.status;
  const now = new Date().toISOString();
  const pendingAmount = Number.isFinite(Number(user.pendingVipRequest.amount))
    ? Math.max(0, Number(user.pendingVipRequest.amount))
    : getVipUpgradePayableAmount(
        user.pendingVipRequest.fromStatus || user.vipPackage?.status || "free",
        approvedStatus
      );
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  const vipUpdated = await updateUserVipPackage(user.id, {
    status: approvedStatus,
    activatedAt: now,
    expiresAt: expiryDate.toISOString(),
    lastUpgradeSource: "vip_request"
  });

  if (!vipUpdated) {
    return { ok: false, statusCode: 500, message: "Không thể cập nhật gói VIP cho tài khoản." };
  }

  const decidedUser = await updateUserPendingVipRequest(user.id, {
    ...user.pendingVipRequest,
    state: "approved",
    decidedAt: now,
    decidedBy
  });

  await upsertUserPaymentHistory(user.id, {
    invoiceId: user.pendingVipRequest.requestId,
    packageStatus: approvedStatus,
    amount: pendingAmount,
    state: "approved",
    paymentStatus: "paid",
    requestedAt: user.pendingVipRequest.requestedAt || now,
    decidedAt: now,
    activatedAt: now,
    expiresAt: expiryDate.toISOString(),
    decidedBy,
    source: "vip_request"
  });

  return {
    ok: true,
    user: decidedUser || vipUpdated,
    approved: true,
    statusCode: 200,
    message: `Đã duyệt nâng cấp thành công cho tài khoản ${vipUpdated.email} lên gói ${getPackageDisplayName(approvedStatus)}.`
  };
}

app.post("/api/auth/register", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = normalizeRole(req.body.role);

  const registerError = validateRegisterBody({ name, email, password, role });
  if (registerError) {
    const statusCode = registerError === "Không thể tự đăng ký role này" ? 403 : 400;
    return res.status(statusCode).json({ message: registerError });
  }

  const emailExists = await findUserByEmail(email);
  if (emailExists) {
    return res.status(409).json({ message: "Email đã được sử dụng" });
  }

  const nameExists = await findUserByName(name);
  if (nameExists) {
    return res.status(409).json({ message: "Tên tài khoản đã được sử dụng" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    name,
    email,
    passwordHash,
    role
  });

  const token = signToken(user);
  return res.status(201).json({
    token,
    user: toPublicUser(user)
  });
});

app.post("/api/auth/login", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password || email.length > 254 || password.length > 128 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: toPublicUser(user)
  });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: "Email không đúng định dạng" });
  }

  const genericMessage = "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.";

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({ message: genericMessage });
    }

    purgeExpiredPasswordResetRequests();

    const requestId = crypto.randomUUID();
    const expiresAt = Date.now() + Math.max(5, RESET_PASSWORD_TOKEN_EXPIRES_MINUTES) * 60 * 1000;
    const token = buildPasswordResetToken({
      type: "password-reset",
      userId: user.id,
      email: user.email,
      requestId
    });
    const resetLink = buildPasswordResetLink(token);

    passwordResetRequests.set(requestId, {
      userId: user.id,
      email: user.email,
      expiresAt,
      used: false
    });

    await sendPasswordResetEmail({
      user,
      resetLink,
      requestedAt: new Date().toISOString()
    });

    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.json({ message: genericMessage });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Thiếu token hoặc mật khẩu mới" });
  }

  if (!PASSWORD_PATTERN.test(newPassword)) {
    return res.status(400).json({
      message: "Mật khẩu mới phải có chữ thường, chữ hoa, số, ký tự đặc biệt và dài 8-64 ký tự"
    });
  }

  let decoded;
  try {
    decoded = verifyPasswordResetToken(token);
  } catch {
    return res.status(400).json({ message: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" });
  }

  const requestId = typeof decoded?.requestId === "string" ? decoded.requestId : "";
  const userId = Number.parseInt(decoded?.userId, 10);
  const email = typeof decoded?.email === "string" ? decoded.email : "";
  const type = typeof decoded?.type === "string" ? decoded.type : "";

  if (!requestId || !Number.isFinite(userId) || !email || type !== "password-reset") {
    return res.status(400).json({ message: "Token đặt lại mật khẩu không hợp lệ" });
  }

  purgeExpiredPasswordResetRequests();

  const requestMeta = passwordResetRequests.get(requestId);
  if (!requestMeta || requestMeta.used || requestMeta.userId !== userId || requestMeta.email !== email) {
    return res.status(400).json({ message: "Yêu cầu đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng" });
  }

  const user = await findUserById(userId);
  if (!user || user.email !== email) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản để đặt lại mật khẩu" });
  }

  const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
  if (sameAsCurrent) {
    return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  const updated = await updateUserPassword(user.id, newPasswordHash);
  if (!updated) {
    return res.status(500).json({ message: "Không thể cập nhật mật khẩu mới" });
  }

  passwordResetRequests.set(requestId, {
    ...requestMeta,
    used: true
  });
  passwordResetRequests.delete(requestId);

  return res.json({ message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại." });
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  res.json({
    user: toPublicUser(user)
  });
});

app.get("/api/auth/friends", authMiddleware, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  const friends = await getFriends(user.id);
  const requests = await getFriendRequests(user.id);
  return res.json({
    friends,
    incomingRequests: requests.incoming,
    outgoingRequests: requests.outgoing,
    total: friends.length
  });
});

app.get("/api/users/:id/public", async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ" });
  }

  const user = await findUserById(userId);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tác giả" });
  }

  const recentArticles = headlines
    .filter((item) => item.createdBy === user.id)
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    .slice(0, 5)
    .map(normalizeArticleDisplay);

  return res.json({
    profile: toPublicAuthorProfile(user),
    recentArticles
  });
});

app.post("/api/auth/friends/:friendId", authMiddleware, async (req, res) => {
  const friendId = Number.parseInt(req.params.friendId, 10);
  if (!Number.isFinite(friendId) || friendId <= 0) {
    return res.status(400).json({ message: "ID bạn bè không hợp lệ" });
  }

  if (friendId === req.user.id) {
    return res.status(400).json({ message: "Không thể tự kết bạn với chính mình" });
  }

  const currentUser = await findUserById(req.user.id);
  if (!currentUser) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  if (!isVipOrPrivilegedUser(currentUser)) {
    return res.status(403).json({
      message: "Chỉ tài khoản VIP mới có thể kết bạn. Vui lòng đăng ký VIP để sử dụng tính năng này.",
      code: "VIP_REQUIRED_FOR_FRIENDS"
    });
  }

  const friendUser = await findUserById(friendId);
  if (!friendUser) {
    return res.status(404).json({ message: "Không tìm thấy người dùng cần kết bạn" });
  }

  if (!isVipOrPrivilegedUser(friendUser)) {
    return res.status(403).json({
      message: "Người dùng này chưa đăng ký VIP nên chưa thể kết bạn.",
      code: "TARGET_NOT_VIP_FOR_FRIENDS"
    });
  }

  const result = await addFriend(req.user.id, friendId);
  if (!result.user || !result.friend) {
    return res.status(400).json({ message: "Không thể gửi lời mời kết bạn" });
  }

  const friends = await getFriends(req.user.id);
  const requests = await getFriendRequests(req.user.id);

  if (result.status === "incoming_request_exists") {
    return res.status(409).json({
      message: "Người này đã gửi lời mời kết bạn cho bạn. Hãy chấp nhận lời mời.",
      code: "INCOMING_REQUEST_EXISTS",
      user: toPublicUser(result.user),
      friends,
      incomingRequests: requests.incoming,
      outgoingRequests: requests.outgoing
    });
  }

  return res.json({
    message:
      result.status === "request_sent"
        ? "Đã gửi lời mời kết bạn"
        : result.status === "already_requested"
          ? "Bạn đã gửi lời mời kết bạn cho người này"
          : "Hai bạn đã là bạn bè",
    user: toPublicUser(result.user),
    friends,
    incomingRequests: requests.incoming,
    outgoingRequests: requests.outgoing
  });
});

app.post("/api/auth/friends/:friendId/accept", authMiddleware, async (req, res) => {
  const friendId = Number.parseInt(req.params.friendId, 10);
  if (!Number.isFinite(friendId) || friendId <= 0) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ" });
  }

  const currentUser = await findUserById(req.user.id);
  if (!currentUser) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  if (!isVipOrPrivilegedUser(currentUser)) {
    return res.status(403).json({
      message: "Chỉ tài khoản VIP mới có thể kết bạn. Vui lòng đăng ký VIP để chấp nhận lời mời.",
      code: "VIP_REQUIRED_FOR_FRIENDS"
    });
  }

  const requester = await findUserById(friendId);
  if (!requester) {
    return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
  }

  if (!isVipOrPrivilegedUser(requester)) {
    return res.status(403).json({
      message: "Lời mời này không còn hợp lệ vì người gửi chưa đăng ký VIP.",
      code: "TARGET_NOT_VIP_FOR_FRIENDS"
    });
  }

  const result = await acceptFriendRequest(req.user.id, friendId);
  if (!result.user || !result.requester) {
    return res.status(400).json({ message: "Không thể chấp nhận lời mời kết bạn" });
  }

  if (result.status === "no_pending_request") {
    return res.status(409).json({ message: "Không còn lời mời kết bạn đang chờ xử lý" });
  }

  const friends = await getFriends(req.user.id);
  const requests = await getFriendRequests(req.user.id);

  return res.json({
    message: result.status === "accepted" ? "Đã chấp nhận lời mời kết bạn" : "Hai bạn đã là bạn bè",
    user: toPublicUser(result.user),
    friends,
    incomingRequests: requests.incoming,
    outgoingRequests: requests.outgoing
  });
});

app.delete("/api/auth/friends/:friendId", authMiddleware, async (req, res) => {
  const friendId = Number.parseInt(req.params.friendId, 10);
  if (!Number.isFinite(friendId) || friendId <= 0) {
    return res.status(400).json({ message: "ID bạn bè không hợp lệ" });
  }

  if (friendId === req.user.id) {
    return res.status(400).json({ message: "Không thể thao tác với chính mình" });
  }

  const friendUser = await findUserById(friendId);
  if (!friendUser) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const result = await removeFriend(req.user.id, friendId);
  if (!result.user || !result.friend) {
    return res.status(400).json({ message: "Không thể hủy kết bạn" });
  }

  const friends = await getFriends(req.user.id);
  const requests = await getFriendRequests(req.user.id);
  return res.json({
    message:
      result.status === "unfriended"
        ? "Hủy kết bạn thành công"
        : result.status === "request_canceled"
          ? "Đã hủy lời mời kết bạn"
          : result.status === "request_rejected"
            ? "Đã từ chối lời mời kết bạn"
            : "Không tìm thấy quan hệ bạn bè hoặc lời mời",
    user: toPublicUser(result.user),
    friends,
    incomingRequests: requests.incoming,
    outgoingRequests: requests.outgoing
  });
});

app.get("/api/chat/messages/:friendId", authMiddleware, async (req, res) => {
  const friendId = Number.parseInt(req.params.friendId, 10);
  if (!Number.isFinite(friendId) || friendId <= 0) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ" });
  }

  const currentUser = await findUserById(req.user.id);
  const friendUser = await findUserById(friendId);
  if (!currentUser || !friendUser) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const friendIds = Array.isArray(currentUser.friendIds) ? currentUser.friendIds : [];
  if (!friendIds.includes(friendId)) {
    return res.status(403).json({ message: "Chỉ có thể chat với bạn bè đã được chấp nhận" });
  }

  const messages = await getConversationMessages(currentUser.id, friendId);
  return res.json({ messages });
});

app.post("/api/chat/messages/:friendId", authMiddleware, async (req, res) => {
  const friendId = Number.parseInt(req.params.friendId, 10);
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

  if (!Number.isFinite(friendId) || friendId <= 0) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ" });
  }

  if (!content || content.length > 1000) {
    return res.status(400).json({ message: "Nội dung tin nhắn phải từ 1 đến 1000 ký tự" });
  }

  const currentUser = await findUserById(req.user.id);
  const friendUser = await findUserById(friendId);
  if (!currentUser || !friendUser) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  const friendIds = Array.isArray(currentUser.friendIds) ? currentUser.friendIds : [];
  if (!friendIds.includes(friendId)) {
    return res.status(403).json({ message: "Chỉ có thể chat với bạn bè đã được chấp nhận" });
  }

  const message = await appendConversationMessage({
    senderId: currentUser.id,
    receiverId: friendId,
    content
  });

  return res.status(201).json({ message });
});

app.put("/api/auth/profile", authMiddleware, async (req, res) => {
  const rawName = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const rawEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const rawAvatar = typeof req.body.avatar === "string" ? req.body.avatar.trim() : "";

  if (rawName.length < 2 || rawName.length > 80) {
    return res.status(400).json({ message: "Tên hiển thị phải từ 2 đến 80 ký tự" });
  }

  if (!EMAIL_PATTERN.test(rawEmail) || rawEmail.length > 254) {
    return res.status(400).json({ message: "Email không đúng định dạng" });
  }

  if (!isValidAvatarUrl(rawAvatar)) {
    return res.status(400).json({ message: "Avatar phải là URL hợp lệ (http/https) hoặc ảnh base64" });
  }

  const currentUser = await findUserById(req.user.id);
  if (!currentUser) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  if (rawEmail !== currentUser.email) {
    const emailOwner = await findUserByEmail(rawEmail);
    if (emailOwner && emailOwner.id !== currentUser.id) {
      return res.status(409).json({ message: "Email đã được sử dụng" });
    }
  }

  const updated = await updateUserProfile(currentUser.id, {
    name: rawName,
    email: rawEmail,
    avatar: rawAvatar
  });

  if (!updated) {
    return res.status(500).json({ message: "Không thể cập nhật thông tin" });
  }

  const token = signToken(updated);
  return res.json({
    message: "Cập nhật thông tin thành công",
    token,
    user: toPublicUser(updated)
  });
});

app.put("/api/auth/change-password", authMiddleware, async (req, res) => {
  const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới" });
  }

  if (!PASSWORD_PATTERN.test(newPassword)) {
    return res.status(400).json({
      message: "Mật khẩu mới phải có chữ thường, chữ hoa, số, ký tự đặc biệt và dài 8-64 ký tự"
    });
  }

  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
  }

  const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
  if (sameAsCurrent) {
    return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
  }

  const nextHash = await bcrypt.hash(newPassword, 10);
  const updated = await updateUserPassword(user.id, nextHash);

  if (!updated) {
    return res.status(500).json({ message: "Không thể đổi mật khẩu" });
  }

  return res.json({ message: "Đổi mật khẩu thành công" });
});

app.put("/api/auth/vip-package", authMiddleware, async (req, res) => {
  const newPackageStatus = typeof req.body.status === "string" ? req.body.status.trim() : "";

  if (newPackageStatus !== "free") {
    return res.status(400).json({ message: "Gói trả phí cần qua bước xác nhận thanh toán" });
  }

  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  const now = new Date().toISOString();
  const updated = await updateUserVipPackage(user.id, {
    status: "free",
    activatedAt: now,
    expiresAt: null
  });

  if (!updated) {
    return res.status(500).json({ message: "Không thể cập nhật gói miễn phí" });
  }

  const token = signToken(updated);
  return res.json({
    message: "Đã chuyển về gói miễn phí",
    token,
    user: toPublicUser(updated)
  });
});

app.post("/api/auth/spin-wheel/spin", authMiddleware, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  if (user.spinWheel?.used) {
    return res.status(409).json({
      message: "Bạn đã dùng hết lượt quay.",
      spinWheel: user.spinWheel,
      user: toPublicUser(user)
    });
  }

  const spunAt = new Date().toISOString();
  const prize = pickSpinWheelPrize();
  const reward = resolveSpinReward(user, prize);

  let updatedUser = await updateUserSpinWheelReward(user.id, {
    spinWheel: {
      used: true,
      prizeCode: prize.code,
      prizeLabel: prize.label,
      spunAt
    }
  });

  if (!updatedUser) {
    return res.status(500).json({ message: "Không thể lưu kết quả quay thưởng" });
  }

  if (reward.autoVipStatus) {
    const now = new Date();
    const expiryDate = new Date(now.getTime());
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const vipUpdated = await updateUserVipPackage(user.id, {
      status: reward.autoVipStatus,
      activatedAt: now.toISOString(),
      expiresAt: expiryDate.toISOString(),
      autoRenew: false,
      lastUpgradeSource: "spin_wheel_reward"
    });
    if (vipUpdated) {
      updatedUser = vipUpdated;
    }
  }

  if (reward.discountPercent > 0) {
    const currentDiscount = getUserVipDiscountPercent(updatedUser);
    const nextDiscount = Math.max(currentDiscount, reward.discountPercent);
    const discountedUser = await updateUserSpinWheelReward(user.id, {
      vipDiscount: {
        percent: nextDiscount,
        source: "spin_wheel",
        awardedAt: spunAt,
        used: false
      }
    });
    if (discountedUser) {
      updatedUser = discountedUser;
    }
  }

  const latestUser = (await findUserById(user.id)) || updatedUser;
  const token = signToken(latestUser);

  // Record spin in history
  try {
    await addSpinRecord({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      prizeCode: prize.code,
      prizeLabel: prize.label,
      hasDiscount: reward.discountPercent > 0,
      discountPercent: reward.discountPercent || 0,
      spunAt
    });
  } catch (error) {
    console.error("Failed to record spin:", error.message);
  }

  return res.status(200).json({
    message: reward.rewardMessage,
    prize: {
      code: prize.code,
      label: prize.label
    },
    reward: {
      autoVipStatus: reward.autoVipStatus,
      discountPercent: reward.discountPercent
    },
    token,
    user: toPublicUser(latestUser)
  });
});

app.post("/api/auth/vip-payment-request", authMiddleware, async (req, res) => {
  const newPackageStatus = typeof req.body.status === "string" ? req.body.status.trim() : "";
  const allowedStatuses = ["silver", "gold", "platinum"];

  if (!allowedStatuses.includes(newPackageStatus)) {
    return res.status(400).json({ message: "Gói VIP yêu cầu thanh toán không hợp lệ" });
  }

  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  const currentVipStatus = user.vipPackage?.status || "free";
  const rawPayableAmount = getVipUpgradePayableAmount(currentVipStatus, newPackageStatus);
  const discountPercent = getUserVipDiscountPercent(user);
  const payableAmount = applyVipDiscount(rawPayableAmount, discountPercent);
  if (currentVipStatus === newPackageStatus) {
    return res.status(409).json({
      message: `Tài khoản đang ở gói ${getPackageDisplayName(currentVipStatus)}. Vui lòng chọn gói khác để đổi.`
    });
  }

  const currentPending = user.pendingVipRequest;
  if (currentPending && currentPending.state === "pending") {
    return res.status(409).json({
      message: "Bạn đã có yêu cầu nâng cấp VIP đang chờ duyệt. Vui lòng đợi phản hồi."
    });
  }

  const requestId = crypto.randomUUID();
  const requestedAt = new Date().toISOString();

  const updatedUser = await updateUserPendingVipRequest(user.id, {
    requestId,
    fromStatus: currentVipStatus,
    status: newPackageStatus,
    originalAmount: rawPayableAmount,
    discountPercent,
    amount: payableAmount,
    state: "pending",
    requestedAt,
    decidedAt: null,
    decidedBy: null
  });

  if (!updatedUser) {
    return res.status(500).json({ message: "Không thể tạo yêu cầu nâng cấp VIP" });
  }

  await upsertUserPaymentHistory(user.id, {
    invoiceId: requestId,
    packageStatus: newPackageStatus,
    originalAmount: rawPayableAmount,
    discountPercent,
    amount: payableAmount,
    state: "pending",
    paymentStatus: "awaiting_approval",
    requestedAt,
    decidedAt: null,
    decidedBy: null,
    source: "vip_request"
  });

  if (discountPercent > 0) {
    await updateUserSpinWheelReward(user.id, {
      vipDiscount: {
        ...(user.vipDiscount || {}),
        used: true,
        usedAt: requestedAt,
        usedInInvoiceId: requestId
      }
    });
  }

  const latestUser = (await findUserById(user.id)) || updatedUser;
  const discountSuffix =
    discountPercent > 0
      ? ` Đã áp dụng giảm ${discountPercent}%: ${formatCurrencyVnd(rawPayableAmount)} -> ${formatCurrencyVnd(payableAmount)}.`
      : "";

  try {
    const mailResult = await sendVipApprovalEmail({
      user: latestUser,
      packageStatus: newPackageStatus,
      currentStatus: currentVipStatus,
      payableAmount,
      requestId,
      requestedAt
    });

    if (!mailResult.sent) {
      return res.status(202).json({
        message: `Đã ghi nhận yêu cầu nâng cấp. Email duyệt chưa gửi được vì SMTP chưa cấu hình.${discountSuffix}`,
        pendingRequest: latestUser.pendingVipRequest,
        user: toPublicUser(latestUser),
        payment: {
          amount: payableAmount,
          amountText: formatCurrencyVnd(payableAmount),
          originalAmount: rawPayableAmount,
          originalAmountText: formatCurrencyVnd(rawPayableAmount),
          discountPercent,
          fromStatus: currentVipStatus,
          toStatus: newPackageStatus
        },
        emailDelivery: "not_configured"
      });
    }

    return res.status(202).json({
      message: `Đã gửi yêu cầu xác nhận đến ${VIP_APPROVAL_EMAIL}. Số tiền cần thanh toán thêm: ${formatCurrencyVnd(payableAmount)}.${discountSuffix} Yêu cầu đổi/nâng cấp VIP sẽ được áp dụng sau khi duyệt.`,
      pendingRequest: latestUser.pendingVipRequest,
      user: toPublicUser(latestUser),
      payment: {
        amount: payableAmount,
        amountText: formatCurrencyVnd(payableAmount),
        originalAmount: rawPayableAmount,
        originalAmountText: formatCurrencyVnd(rawPayableAmount),
        discountPercent,
        fromStatus: currentVipStatus,
        toStatus: newPackageStatus
      }
    });
  } catch (error) {
    console.error("Failed to send VIP approval email:", error.message);
    return res.status(500).json({
      message: "Không thể gửi email xác nhận. Vui lòng thử lại sau."
    });
  }
});

app.post("/api/auth/vip-payment-request/resend", authMiddleware, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  }

  const pending = user.pendingVipRequest;
  if (!pending || pending.state !== "pending") {
    return res.status(400).json({ message: "Bạn không có yêu cầu nâng cấp VIP đang chờ duyệt." });
  }

  try {
    const mailResult = await sendVipApprovalEmail({
      user,
      packageStatus: pending.status,
      requestId: pending.requestId,
      requestedAt: pending.requestedAt || new Date().toISOString()
    });

    if (!mailResult.sent) {
      return res.status(202).json({
        message: "Yêu cầu đang chờ duyệt nhưng chưa thể gửi lại email vì SMTP chưa cấu hình.",
        pendingRequest: pending,
        user: toPublicUser(user),
        emailDelivery: "not_configured"
      });
    }

    return res.status(200).json({
      message: `Đã gửi lại email duyệt đến ${VIP_APPROVAL_EMAIL}.`,
      pendingRequest: pending,
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error("Failed to resend VIP approval email:", error.message);
    return res.status(500).json({
      message: "Không thể gửi lại email duyệt. Vui lòng thử lại sau."
    });
  }
});

app.get("/api/vip-payment/decision", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    return res.status(400).send("Thiếu token xác nhận.");
  }

  let decoded;
  try {
    decoded = verifyVipApprovalToken(token);
  } catch {
    return res.status(400).send("Link xác nhận không hợp lệ hoặc đã hết hạn.");
  }

  if (decoded.type !== "vip-payment-approval" || !decoded.requestId || !decoded.decision) {
    return res.status(400).send("Dữ liệu xác nhận không hợp lệ.");
  }

  const result = await processVipDecision({
    requestId: decoded.requestId,
    decision: decoded.decision,
    decidedBy: VIP_APPROVAL_EMAIL
  });

  if (!result.ok) {
    return res.status(result.statusCode).send(result.message);
  }

  return res.send(result.message);
});

app.get("/api/auth/vip-packages", (req, res) => {
  const packages = {
    free: {
      name: "Miễn phí",
      price: "0 VNĐ",
      duration: "Vĩnh viễn",
      features: [
        "✓ Đọc tin tức cơ bản",
        "✓ Xem chi tiết tối đa 5 bài viết",
        "✓ Lưu bài viết yêu thích",
        "✓ Xem lịch sử đọc",
        "✓ Bình luận trên bài viết"
      ]
    },
    silver: {
      name: "Bạc",
      price: "99.000 VNĐ",
      duration: "1 tháng",
      features: [
        "✓ Tất cả tính năng gói Miễn phí",
        "✓ Xem bài viết không giới hạn",
        "✓ Có thể đăng tin bài viết",
        "✓ Xóa quảng cáo",
        "✓ Đề xuất tin tức được cá nhân hóa",
        "✓ Lưu trữ bài viết offline"
      ]
    },
    gold: {
      name: "Vàng",
      price: "199.000 VNĐ",
      duration: "1 tháng",
      features: [
        "✓ Tất cả tính năng gói Bạc",
        "✓ Xem bài viết không giới hạn",
        "✓ Có thể đăng tin bài viết",
        "✓ Truy cập sớm bài viết độc quyền",
        "✓ Phiên bản không có quảng cáo",
        "✓ Tải báo cáo PDF hàng tuần"
      ]
    },
    platinum: {
      name: "Bạch kim",
      price: "299.000 VNĐ",
      duration: "1 tháng",
      features: [
        "✓ Tất cả tính năng gói Vàng",
        "✓ Xem bài viết không giới hạn",
        "✓ Có thể đăng tin bài viết",
        "✓ Tư vấn chuyên gia hàng tuần",
        "✓ Webhooks API để tích hợp",
        "✓ Hỗ trợ ưu tiên 24/7"
      ]
    }
  };

  return res.json(packages);
});

app.get("/api/auth/payment-history", authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    const invoices = buildUserInvoices(user);
    const summary = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter((item) => item.paymentStatus === "paid").length,
      pendingInvoices: invoices.filter((item) => item.paymentStatus === "awaiting_approval").length,
      rejectedInvoices: invoices.filter((item) => item.paymentStatus === "rejected").length,
      totalAmount: invoices
        .filter((item) => item.paymentStatus === "paid")
        .reduce((sum, item) => sum + item.amount, 0),
      pendingAmount: invoices
        .filter((item) => item.paymentStatus === "awaiting_approval")
        .reduce((sum, item) => sum + item.amount, 0)
    };

    return res.json({
      summary: {
        ...summary,
        totalAmountText: formatCurrencyVnd(summary.totalAmount),
        pendingAmountText: formatCurrencyVnd(summary.pendingAmount)
      },
      invoices
    });
  } catch {
    return res.status(500).json({ message: "Không thể tải lịch sử thanh toán." });
  }
});

app.get("/api/news", async (req, res) => {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(requestedPage, 1);
  const limit = Number.isNaN(requestedLimit) ? 12 : Math.min(Math.max(requestedLimit, 1), 60);
  const categoryFilter = typeof req.query.category === "string" ? req.query.category.trim() : "";

  const sourceItems = categoryFilter
    ? headlines.filter((item) => item.category.toLowerCase() === categoryFilter.toLowerCase())
    : headlines;

  const totalItems = sourceItems.length;
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const latest = sourceItems.slice(start, start + limit);

  const categoryList = await getAllCategories();

  res.json({
    hero: normalizeArticleDisplay(sourceItems[0] ?? null),
    trending: sourceItems.slice(1, 6).map(normalizeArticleDisplay),
    latest: latest.map(normalizeArticleDisplay),
    categories: categoryList.map((category) => restoreVietnameseText(category.name || "")),
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages
    },
    filters: {
      category: categoryFilter || "all"
    }
  });
});

app.get("/api/news/:id", async (req, res) => {
  const articleId = Number.parseInt(req.params.id, 10);
  const article = headlines.find((item) => item.id === articleId);

  if (!article) {
    return res.status(404).json({ message: "Không tìm thấy bài báo" });
  }

  const authHeader = req.headers.authorization || "";
  const hasAuthorization = authHeader.trim().length > 0;

  if (hasAuthorization) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await findUserById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập" });
      }

      if (!isVipOrPrivilegedUser(user)) {
        const viewedArticleIds = getUserViewedArticleIds(user);
        const viewedCount = viewedArticleIds.length;
        const hasViewedCurrentArticle = viewedArticleIds.includes(articleId);
        const safeLimit = Number.isFinite(NON_VIP_ARTICLE_VIEW_LIMIT)
          ? Math.max(1, NON_VIP_ARTICLE_VIEW_LIMIT)
          : 5;

        if (!hasViewedCurrentArticle && viewedCount >= safeLimit) {
          return res.status(403).json({
            message: `Tài khoản chưa VIP chỉ được xem tối đa ${safeLimit} bài chi tiết. Vui lòng nâng cấp VIP để xem không giới hạn.`,
            code: "NON_VIP_VIEW_LIMIT_REACHED",
            viewLimit: safeLimit,
            viewedCount
          });
        }

        if (!hasViewedCurrentArticle) {
          await appendUserViewedArticle(user.id, articleId, safeLimit);
        }
      }
    } catch {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  }

  return res.json({
    article: normalizeArticleDisplay({
      ...article,
      content: article.content || buildFallbackContentFromSummary(article.summary)
    })
  });
});

// Admin endpoints
app.get("/api/admin/invoices", authMiddleware, requirePermission("read:invoices"), async (req, res) => {
  try {
    const users = await getAllUsers();
    const invoices = buildAdminInvoices(users);

    const summary = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter((item) => item.paymentStatus === "paid").length,
      pendingInvoices: invoices.filter((item) => item.paymentStatus === "awaiting_approval").length,
      rejectedInvoices: invoices.filter((item) => item.paymentStatus === "rejected").length,
      totalAmount: invoices
        .filter((item) => item.paymentStatus === "paid")
        .reduce((sum, item) => sum + item.amount, 0),
      pendingAmount: invoices
        .filter((item) => item.paymentStatus === "awaiting_approval")
        .reduce((sum, item) => sum + item.amount, 0)
    };

    res.json({
      summary: {
        ...summary,
        totalAmountText: formatCurrencyVnd(summary.totalAmount),
        pendingAmountText: formatCurrencyVnd(summary.pendingAmount)
      },
      invoices
    });
  } catch (err) {
    res.status(500).json({ message: "Không thể tải danh sách hóa đơn VIP." });
  }
});

app.get("/api/admin/users", authMiddleware, requirePermission("manage:users"), async (req, res) => {
  try {
    const users = await getAllUsers();
    const publicUsers = users.map((u) => ({
      ...toPublicUser(u),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt || null
    }));
    res.json({ users: publicUsers });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải danh sách người dùng" });
  }
});

app.delete("/api/admin/users/:id", authMiddleware, requirePermission("manage:users"), async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (userId === req.user.id) {
      return res.status(400).json({ message: "Không thể xóa chính mình" });
    }
    
    const deleted = await deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa người dùng" });
  }
});

app.put("/api/admin/users/:id/role", authMiddleware, requirePermission("manage:roles"), async (req, res) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const newRole = normalizeRole(req.body.role);
    
    if (!ALLOWED_ROLES.has(newRole)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }
    
    if (userId === req.user.id) {
      return res.status(400).json({ message: "Không thể đổi role của chính mình" });
    }
    
    const updated = await updateUserRole(userId, newRole);
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    res.json({ message: "Cập nhật role thành công", user: toPublicUser(updated) });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật role" });
  }
});

app.post("/api/admin/news", authMiddleware, requirePermission("create:articles"), async (req, res) => {
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
      createdBy: req.user.id,
      createdByName: req.user.name,
      createdByRole: req.user.role
    };
    
    headlines.unshift(newArticle);
    res.status(201).json({ message: "Tạo tin thành công", article: newArticle });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo tin tức" });
  }
});

app.get("/api/admin/news", authMiddleware, requirePermission("read:all-articles"), async (req, res) => {
  try {
    const articles = [...headlines]
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
      .map(normalizeArticleDisplay);

    res.json({ articles, total: articles.length });
  } catch {
    res.status(500).json({ message: "Không thể tải danh sách tin tức quản trị" });
  }
});

app.put("/api/admin/news/:id", authMiddleware, requireAnyPermission("manage:articles", "update:own-articles"), async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const { title, category, summary, author, image, content } = req.body;
    
    const index = headlines.findIndex(h => h.id === articleId);
    if (index === -1) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }
    
    // Check ownership for non-admin users
    if (!hasPermission(req.user, "manage:articles") && !canManageArticle(headlines[index], req.user)) {
      return res.status(403).json({ message: "Bạn chỉ có thể chỉnh sửa bài viết của mình" });
    }
    
    if (title) headlines[index].title = restoreVietnameseText(title.trim());
    if (category) headlines[index].category = restoreVietnameseText(category.trim());
    if (summary) headlines[index].summary = restoreVietnameseText(summary.trim());
    if (author) headlines[index].author = restoreVietnameseText(author.trim());
    if (Object.prototype.hasOwnProperty.call(req.body, "image")) {
      headlines[index].image = normalizeImageUrl(image);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "content")) {
      const normalizedContent = typeof content === "string" ? content.trim() : "";
      headlines[index].content = normalizedContent
        ? restoreVietnameseText(normalizedContent)
        : "";
    }

    if (!headlines[index].content || !headlines[index].content.trim()) {
      headlines[index].content = buildFallbackContentFromSummary(headlines[index].summary);
    }

    headlines[index].image = normalizeImageUrl(headlines[index].image);
    
    res.json({ message: "Cập nhật tin thành công", article: normalizeArticleDisplay(headlines[index]) });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật tin tức" });
  }
});

app.delete("/api/admin/news/:id", authMiddleware, requireAnyPermission("manage:articles", "delete:own-articles"), async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    const index = headlines.findIndex(h => h.id === articleId);
    
    if (index === -1) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }
    
    // Check ownership for non-admin users
    if (!hasPermission(req.user, "manage:articles") && !canManageArticle(headlines[index], req.user)) {
      return res.status(403).json({ message: "Bạn chỉ có thể xóa bài viết của mình" });
    }
    
    headlines.splice(index, 1);
    res.json({ message: "Xóa tin thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa tin tức" });
  }
});

app.get("/api/admin/vip-requests", authMiddleware, requirePermission("read:vip-requests"), async (req, res) => {
  try {
    const users = await getAllUsers();
    const requests = users
      .filter((user) => user.pendingVipRequest && user.pendingVipRequest.state === "pending")
      .map((user) => {
        const fromStatus = user.pendingVipRequest.fromStatus || user.vipPackage?.status || "free";
        const amount = Number.isFinite(Number(user.pendingVipRequest.amount))
          ? Math.max(0, Number(user.pendingVipRequest.amount))
          : getVipUpgradePayableAmount(fromStatus, user.pendingVipRequest.status);

        return {
          requestId: user.pendingVipRequest.requestId,
          fromStatus,
          fromPackageName: getPackageDisplayName(fromStatus),
          status: user.pendingVipRequest.status,
          toPackageName: getPackageDisplayName(user.pendingVipRequest.status),
          amount,
          amountText: formatCurrencyVnd(amount),
          requestedAt: user.pendingVipRequest.requestedAt,
          state: user.pendingVipRequest.state,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            vipPackage: user.vipPackage || { status: "free" }
          }
        };
      })
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    return res.json({ requests });
  } catch {
    return res.status(500).json({ message: "Không thể tải danh sách yêu cầu VIP." });
  }
});

app.put("/api/admin/vip-requests/:requestId/decision", authMiddleware, requirePermission("approve:vip-requests"), async (req, res) => {
  const requestId = typeof req.params.requestId === "string" ? req.params.requestId.trim() : "";
  const decision = typeof req.body.decision === "string" ? req.body.decision.trim() : "";

  if (!requestId) {
    return res.status(400).json({ message: "Thiếu mã yêu cầu VIP." });
  }

  const result = await processVipDecision({
    requestId,
    decision,
    decidedBy: req.user.email || "admin"
  });

  if (!result.ok) {
    return res.status(result.statusCode).json({ message: result.message });
  }

  return res.json({ message: result.message, user: toPublicUser(result.user) });
});

app.post("/api/admin/vip-requests/:requestId/resend", authMiddleware, requirePermission("approve:vip-requests"), async (req, res) => {
  const requestId = typeof req.params.requestId === "string" ? req.params.requestId.trim() : "";
  if (!requestId) {
    return res.status(400).json({ message: "Thiếu mã yêu cầu VIP." });
  }

  const user = await findUserByVipRequestId(requestId);
  if (!user || !user.pendingVipRequest || user.pendingVipRequest.state !== "pending") {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu đang chờ duyệt để gửi lại email." });
  }

  try {
    const mailResult = await sendVipApprovalEmail({
      user,
      packageStatus: user.pendingVipRequest.status,
      currentStatus: user.pendingVipRequest.fromStatus || user.vipPackage?.status || "free",
      payableAmount: user.pendingVipRequest.amount,
      requestId: user.pendingVipRequest.requestId,
      requestedAt: user.pendingVipRequest.requestedAt || new Date().toISOString()
    });

    if (!mailResult.sent) {
      return res.status(202).json({
        message: "Không thể gửi lại email vì SMTP chưa được cấu hình.",
        emailDelivery: "not_configured"
      });
    }

    return res.json({ message: `Đã gửi lại email duyệt tới ${VIP_APPROVAL_EMAIL}.` });
  } catch (error) {
    console.error("Failed to resend VIP approval email by admin:", error.message);
    return res.status(500).json({ message: "Không thể gửi lại email duyệt." });
  }
});

// Prize Management Endpoints
app.get("/api/admin/spin-wheel/prizes", authMiddleware, requirePermission("manage:prizes"), async (req, res) => {
  try {
    const prizes = await getPrizes();
    return res.json({ prizes });
  } catch (error) {
    console.error("Failed to fetch prizes:", error.message);
    return res.status(500).json({ message: "Không thể tải danh sách giải thưởng" });
  }
});

app.post("/api/admin/spin-wheel/prizes", authMiddleware, requirePermission("manage:prizes"), async (req, res) => {
  const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
  const label = typeof req.body.label === "string" ? req.body.label.trim() : "";
  const discountPercent = req.body.discountPercent ? Number.parseInt(req.body.discountPercent, 10) : null;
  const vipStatus = req.body.vipStatus ? String(req.body.vipStatus).trim() : null;

  if (!code || !label) {
    return res.status(400).json({ message: "Mã giải thưởng và tên giải thưởng là bắt buộc" });
  }

  if (code.length > 50) {
    return res.status(400).json({ message: "Mã giải thưởng quá dài (tối đa 50 ký tự)" });
  }

  if (label.length > 500) {
    return res.status(400).json({ message: "Tên giải thưởng quá dài (tối đa 500 ký tự)" });
  }

  if (discountPercent !== null && (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
    return res.status(400).json({ message: "Phần trăm giảm giá phải từ 0 đến 100" });
  }

  if (vipStatus && !["silver", "gold", "platinum"].includes(vipStatus)) {
    return res.status(400).json({ message: "VIP Status không hợp lệ" });
  }

  try {
    const prize = await createPrize({
      code,
      label,
      discountPercent,
      vipStatus
    });

    // Reload cache
    await loadSpinWheelPrizes();

    return res.status(201).json({ 
      message: "Thêm giải thưởng thành công",
      prize 
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.put("/api/admin/spin-wheel/prizes/:prizeId", authMiddleware, requirePermission("manage:prizes"), async (req, res) => {
  const prizeId = Number.parseInt(req.params.prizeId, 10);
  const label = typeof req.body.label === "string" ? req.body.label.trim() : "";
  const discountPercent = req.body.discountPercent !== undefined ? (req.body.discountPercent ? Number.parseInt(req.body.discountPercent, 10) : null) : undefined;
  const vipStatus = req.body.vipStatus !== undefined ? (req.body.vipStatus ? String(req.body.vipStatus).trim() : null) : undefined;

  if (!Number.isFinite(prizeId) || prizeId <= 0) {
    return res.status(400).json({ message: "ID giải thưởng không hợp lệ" });
  }

  if (!label) {
    return res.status(400).json({ message: "Tên giải thưởng là bắt buộc" });
  }

  if (label.length > 500) {
    return res.status(400).json({ message: "Tên giải thưởng quá dài (tối đa 500 ký tự)" });
  }

  if (discountPercent !== undefined && discountPercent !== null && (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
    return res.status(400).json({ message: "Phần trăm giảm giá phải từ 0 đến 100" });
  }

  if (vipStatus !== undefined && vipStatus !== null && !["silver", "gold", "platinum"].includes(vipStatus)) {
    return res.status(400).json({ message: "VIP Status không hợp lệ" });
  }

  try {
    const prize = await updatePrize(prizeId, {
      label,
      discountPercent,
      vipStatus
    });

    // Reload cache
    await loadSpinWheelPrizes();

    return res.json({ 
      message: "Cập nhật giải thưởng thành công",
      prize 
    });
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
});

app.delete("/api/admin/spin-wheel/prizes/:prizeId", authMiddleware, requirePermission("manage:prizes"), async (req, res) => {
  const prizeId = Number.parseInt(req.params.prizeId, 10);

  if (!Number.isFinite(prizeId) || prizeId <= 0) {
    return res.status(400).json({ message: "ID giải thưởng không hợp lệ" });
  }

  try {
    await deletePrize(prizeId);

    // Reload cache
    await loadSpinWheelPrizes();

    return res.json({ message: "Xóa giải thưởng thành công" });
  } catch (error) {
    if (error.message.includes("Không tìm thấy")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
});

// Spin Wheel Admin Endpoints
app.get("/api/admin/spin-wheel/stats", authMiddleware, requirePermission("read:spin-history"), async (req, res) => {
  try {
    const stats = await calculateSpinStats();
    return res.json({ stats });
  } catch (error) {
    console.error("Failed to calculate spin wheel stats:", error.message);
    return res.status(500).json({ message: "Không thể tính toán thống kê" });
  }
});

app.get("/api/admin/spin-wheel/history", authMiddleware, requirePermission("read:spin-history"), async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit || "20", 10)));

  try {
    const result = await getSpinHistoryPaginated(page, limit);
    return res.json({
      history: result.history,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Failed to fetch spin wheel history:", error.message);
    return res.status(500).json({ message: "Không thể tải lịch sử chơi" });
  }
});

app.get("/api/admin/spin-wheel/config", authMiddleware, requirePermission("manage:spinwheel"), async (req, res) => {
  try {
    const prizes = await getPrizes();
    
    const config = {
      enabled: true,
      maxSpinsPerUser: 1,
      prizes: prizes.map(p => ({
        code: p.code,
        label: p.label,
        discountPercent: p.discountPercent || null,
        vipStatus: p.vipStatus || null
      }))
    };
    
    return res.json({ config });
  } catch (error) {
    console.error("Failed to fetch spin wheel config:", error.message);
    return res.status(500).json({ message: "Không thể tải cấu hình" });
  }
});

app.put("/api/admin/spin-wheel/reset/:userId", authMiddleware, requirePermission("reset:spins"), async (req, res) => {
  const userId = Number.parseInt(req.params.userId, 10);

  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ message: "ID người dùng không hợp lệ" });
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Reset user's spin
    const updated = await updateUserSpinWheelReward(userId, {
      spinWheel: {
        used: false,
        prizeCode: null,
        prizeLabel: null,
        spunAt: null
      }
    });

    if (!updated) {
      return res.status(500).json({ message: "Không thể reset lượt chơi" });
    }

    return res.json({
      message: "Đã reset lượt chơi thành công",
      user: toPublicUser(updated)
    });
  } catch (error) {
    console.error("Failed to reset user spin:", error.message);
    return res.status(500).json({ message: "Lỗi khi reset lượt chơi" });
  }
});

app.post("/api/news/create", authMiddleware, vipOnlyMiddleware, async (req, res) => {
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
      createdBy: req.user.id,
      createdByName: req.user.name,
      createdByRole: req.user.role,
      vipApproved: req.user.role === "admin" ? true : false
    };
    
    headlines.unshift(newArticle);
    res.status(201).json({ message: "Tạo tin thành công", article: newArticle });
  } catch (err) {
    console.error("Error creating news:", err);
    res.status(500).json({ message: "Lỗi tạo tin tức" });
  }
});

app.delete("/api/news/:id", authMiddleware, async (req, res) => {
  try {
    const articleId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(articleId)) {
      return res.status(400).json({ message: "ID tin tức không hợp lệ" });
    }

    const index = headlines.findIndex((item) => item.id === articleId);
    if (index === -1) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }

    const article = headlines[index];
    if (!canManageArticle(article, req.user)) {
      return res.status(403).json({ message: "Bạn chỉ có thể xóa bài viết do chính bạn đăng" });
    }

    headlines.splice(index, 1);
    return res.json({ message: "Xóa bài viết thành công" });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi xóa tin tức" });
  }
});

app.get("/api/admin/categories", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải danh sách danh mục" });
  }
});

app.post("/api/admin/categories", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên danh mục không được để trống" });
    }

    const newCategory = await createCategory(name.trim());
    res.status(201).json({ message: "Tạo danh mục thành công", category: newCategory });
  } catch (err) {
    if (err.message === "Danh mục đã tồn tại") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Lỗi tạo danh mục" });
  }
});

app.put("/api/admin/categories/:id", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const categoryId = Number.parseInt(req.params.id, 10);
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên danh mục không được để trống" });
    }

    const updatedCategory = await updateCategory(categoryId, name.trim());
    res.json({ message: "Cập nhật danh mục thành công", category: updatedCategory });
  } catch (err) {
    if (err.message.includes("không tồn tại") || err.message.includes("đã tồn tại")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Lỗi cập nhật danh mục" });
  }
});

app.delete("/api/admin/categories/:id", authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const categoryId = Number.parseInt(req.params.id, 10);
    await deleteCategory(categoryId);
    res.json({ message: "Xóa danh mục thành công" });
  } catch (err) {
    if (err.message === "Danh mục không tồn tại") {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Lỗi xóa danh mục" });
  }
});

async function startServer() {
  await initializeAdminAccount();
  await loadSpinWheelPrizes();
  app.listen(PORT, () => {
    console.log(`News API is running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
