import { access, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SPIN_HISTORY_FILE = path.join(__dirname, "spin-history.json");

async function ensureSpinHistoryFile() {
  try {
    await access(SPIN_HISTORY_FILE);
  } catch {
    await writeFile(SPIN_HISTORY_FILE, "[]", "utf8");
  }
}

export async function getSpinHistory() {
  await ensureSpinHistoryFile();
  const raw = await readFile(SPIN_HISTORY_FILE, "utf8");
  try {
    const history = JSON.parse(raw);
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

export async function saveSpinHistory(history) {
  await writeFile(SPIN_HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

export async function addSpinRecord(record) {
  const history = await getSpinHistory();
  const newRecord = {
    id: history.length > 0 ? Math.max(...history.map(r => r.id), 0) + 1 : 1,
    ...record,
    spunAt: record.spunAt || new Date().toISOString()
  };
  history.push(newRecord);
  await saveSpinHistory(history);
  return newRecord;
}

export async function getSpinHistoryPaginated(page = 1, limit = 20) {
  const history = await getSpinHistory();
  const total = history.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  // Sort by spunAt descending (newest first)
  const sorted = [...history].sort((a, b) => 
    new Date(b.spunAt).getTime() - new Date(a.spunAt).getTime()
  );
  
  return {
    history: sorted.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function calculateSpinStats() {
  const history = await getSpinHistory();
  
  if (history.length === 0) {
    return {
      totalSpins: 0,
      totalPlayers: 0,
      spinRate: 0,
      totalRewardValue: 0,
      prizeStats: {}
    };
  }

  // Get unique players
  const uniquePlayers = new Set(history.map(h => h.userId));
  const totalPlayers = uniquePlayers.size;

  // Calculate prize stats
  const prizeStats = {};
  let totalRewardValue = 0;

  history.forEach(record => {
    const prizeCode = record.prizeCode || 'unknown';
    if (!prizeStats[prizeCode]) {
      prizeStats[prizeCode] = {
        code: prizeCode,
        label: record.prizeLabel || 'Không xác định',
        count: 0,
        totalValue: 0
      };
    }
    prizeStats[prizeCode].count += 1;
    
    // Add discount value if applicable
    if (record.discountPercent) {
      prizeStats[prizeCode].totalValue += record.discountPercent;
      totalRewardValue += record.discountPercent;
    }
  });

  return {
    totalSpins: history.length,
    totalPlayers,
    spinRate: totalPlayers > 0 ? Math.round((history.length / totalPlayers) * 100) : 0,
    totalRewardValue,
    prizeStats
  };
}

export async function resetUserSpin(userId) {
  const history = await getSpinHistory();
  // Mark all user spins as reset (optional - you could also delete them)
  // For now, we just keep the history but the user's spinWheel.used flag is managed in usersStore
  return true;
}
