import { access, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRIZES_FILE = path.join(__dirname, "prizes.json");

// Default prize pool
const DEFAULT_PRIZES = [
  {
    id: 1,
    code: "vip_discount_50",
    label: "Giảm giá nửa giá VIP cho tất cả các gói",
    discountPercent: 50
  },
  {
    id: 2,
    code: "free_vip_silver",
    label: "Free VIP Bạc",
    vipStatus: "silver"
  },
  {
    id: 3,
    code: "lucky_next_time",
    label: "Chúc bạn may mắn lần sau"
  },
  {
    id: 4,
    code: "vip_discount_5",
    label: "Giảm giá 5%",
    discountPercent: 5
  }
];

async function ensurePrizesFile() {
  try {
    await access(PRIZES_FILE);
  } catch {
    await writeFile(PRIZES_FILE, JSON.stringify(DEFAULT_PRIZES, null, 2), "utf8");
  }
}

export async function getPrizes() {
  await ensurePrizesFile();
  const raw = await readFile(PRIZES_FILE, "utf8");
  try {
    const prizes = JSON.parse(raw);
    return Array.isArray(prizes) ? prizes : DEFAULT_PRIZES;
  } catch {
    return DEFAULT_PRIZES;
  }
}

export async function savePrizes(prizes) {
  await writeFile(PRIZES_FILE, JSON.stringify(prizes, null, 2), "utf8");
}

export async function getPrizeById(id) {
  const prizes = await getPrizes();
  return prizes.find(prize => prize.id === id) || null;
}

export async function getPrizeByCode(code) {
  const prizes = await getPrizes();
  return prizes.find(prize => prize.code === code) || null;
}

export async function createPrize({ code, label, discountPercent, vipStatus }) {
  const prizes = await getPrizes();
  
  // Check if code already exists
  if (prizes.some(p => p.code === code)) {
    throw new Error('Mã giải thưởng này đã tồn tại');
  }

  const newPrize = {
    id: Math.max(0, ...prizes.map(p => p.id)) + 1,
    code,
    label,
    ...(discountPercent !== null && { discountPercent }),
    ...(vipStatus !== null && { vipStatus })
  };

  prizes.push(newPrize);
  await savePrizes(prizes);
  return newPrize;
}

export async function updatePrize(id, { label, discountPercent, vipStatus }) {
  const prizes = await getPrizes();
  const prizeIndex = prizes.findIndex(p => p.id === id);
  
  if (prizeIndex === -1) {
    throw new Error('Không tìm thấy giải thưởng');
  }

  prizes[prizeIndex] = {
    ...prizes[prizeIndex],
    label,
    ...(discountPercent !== undefined && { discountPercent }),
    ...(vipStatus !== undefined && { vipStatus })
  };

  await savePrizes(prizes);
  return prizes[prizeIndex];
}

export async function deletePrize(id) {
  const prizes = await getPrizes();
  const filtered = prizes.filter(p => p.id !== id);
  
  if (filtered.length === prizes.length) {
    throw new Error('Không tìm thấy giải thưởng');
  }

  if (filtered.length === 0) {
    throw new Error('Phải giữ lại ít nhất một giải thưởng');
  }

  await savePrizes(filtered);
  return true;
}
