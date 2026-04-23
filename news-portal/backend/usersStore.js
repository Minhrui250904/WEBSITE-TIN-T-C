import { access, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, "users.json");

async function ensureUsersFile() {
  try {
    await access(USERS_FILE);
  } catch {
    await writeFile(USERS_FILE, "[]", "utf8");
  }
}

export async function getUsers() {
  await ensureUsersFile();
  const raw = await readFile(USERS_FILE, "utf8");
  try {
    const users = JSON.parse(raw);
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

export async function saveUsers(users) {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(email) {
  const users = await getUsers();
  return users.find(user => user.email === email) || null;
}

export async function findUserByName(name) {
  const users = await getUsers();
  const normalizedName = String(name || "").trim().toLowerCase();
  return users.find((user) => String(user.name || "").trim().toLowerCase() === normalizedName) || null;
}

export async function findUserById(id) {
  const users = await getUsers();
  return users.find(user => user.id === id) || null;
}

export async function createUser({ name, email, passwordHash, role }) {
  const users = await getUsers();
  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser = {
    id: newId,
    name,
    email,
    passwordHash,
    role,
    friendIds: [],
    incomingFriendRequestIds: [],
    outgoingFriendRequestIds: [],
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  await saveUsers(users);
  return {
    id: newId,
    name,
    email,
    role
  };
}

export async function initializeAdminAccount() {
  const adminEmail = "admin@gmail.com";
  const existingAdmin = await findUserByEmail(adminEmail);
  
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("12345678", 10);
    await createUser({
      name: "Administrator",
      email: adminEmail,
      passwordHash,
      role: "admin"
    });
    console.log("✓ Admin account created: admin@gmail.com / 12345678");
  }
}

export async function getAllUsers() {
  return await getUsers();
}

export async function deleteUser(userId) {
  const users = await getUsers();
  const filtered = users
    .filter((u) => u.id !== userId)
    .map((user) => ({
      ...user,
      friendIds: Array.isArray(user.friendIds) ? user.friendIds.filter((id) => id !== userId) : [],
      incomingFriendRequestIds: Array.isArray(user.incomingFriendRequestIds)
        ? user.incomingFriendRequestIds.filter((id) => id !== userId)
        : [],
      outgoingFriendRequestIds: Array.isArray(user.outgoingFriendRequestIds)
        ? user.outgoingFriendRequestIds.filter((id) => id !== userId)
        : []
    }));
  await saveUsers(filtered);
  return filtered.length < users.length;
}

export async function addFriend(userId, friendId) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  const friend = users.find((u) => u.id === friendId);

  if (!user || !friend || userId === friendId) {
    return { user: null, friend: null, added: false, status: "invalid" };
  }

  const userFriendIds = Array.isArray(user.friendIds) ? user.friendIds : [];
  const friendFriendIds = Array.isArray(friend.friendIds) ? friend.friendIds : [];
  const userIncomingIds = Array.isArray(user.incomingFriendRequestIds) ? user.incomingFriendRequestIds : [];
  const userOutgoingIds = Array.isArray(user.outgoingFriendRequestIds) ? user.outgoingFriendRequestIds : [];
  const friendIncomingIds = Array.isArray(friend.incomingFriendRequestIds) ? friend.incomingFriendRequestIds : [];
  const friendOutgoingIds = Array.isArray(friend.outgoingFriendRequestIds) ? friend.outgoingFriendRequestIds : [];
  const alreadyFriends = userFriendIds.includes(friendId) && friendFriendIds.includes(userId);

  if (alreadyFriends) {
    return { user, friend, added: false, status: "already_friends" };
  }

  if (userOutgoingIds.includes(friendId) || friendIncomingIds.includes(userId)) {
    return { user, friend, added: false, status: "already_requested" };
  }

  if (userIncomingIds.includes(friendId) || friendOutgoingIds.includes(userId)) {
    return { user, friend, added: false, status: "incoming_request_exists" };
  }

  user.outgoingFriendRequestIds = [...new Set([...userOutgoingIds, friendId])];
  friend.incomingFriendRequestIds = [...new Set([...friendIncomingIds, userId])];
  user.updatedAt = new Date().toISOString();
  friend.updatedAt = new Date().toISOString();
  await saveUsers(users);

  return {
    user,
    friend,
    added: true,
    status: "request_sent"
  };
}

export async function acceptFriendRequest(userId, requesterId) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  const requester = users.find((u) => u.id === requesterId);

  if (!user || !requester || userId === requesterId) {
    return { user: null, requester: null, accepted: false, status: "invalid" };
  }

  const userIncomingIds = Array.isArray(user.incomingFriendRequestIds) ? user.incomingFriendRequestIds : [];
  const requesterOutgoingIds = Array.isArray(requester.outgoingFriendRequestIds) ? requester.outgoingFriendRequestIds : [];
  const userFriendIds = Array.isArray(user.friendIds) ? user.friendIds : [];
  const requesterFriendIds = Array.isArray(requester.friendIds) ? requester.friendIds : [];

  if (userFriendIds.includes(requesterId) && requesterFriendIds.includes(userId)) {
    return { user, requester, accepted: false, status: "already_friends" };
  }

  const hasPendingRequest = userIncomingIds.includes(requesterId) && requesterOutgoingIds.includes(userId);
  if (!hasPendingRequest) {
    return { user, requester, accepted: false, status: "no_pending_request" };
  }

  user.incomingFriendRequestIds = userIncomingIds.filter((id) => id !== requesterId);
  requester.outgoingFriendRequestIds = requesterOutgoingIds.filter((id) => id !== userId);
  user.friendIds = [...new Set([...userFriendIds, requesterId])];
  requester.friendIds = [...new Set([...requesterFriendIds, userId])];
  user.updatedAt = new Date().toISOString();
  requester.updatedAt = new Date().toISOString();
  await saveUsers(users);

  return { user, requester, accepted: true, status: "accepted" };
}

export async function removeFriend(userId, friendId) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  const friend = users.find((u) => u.id === friendId);

  if (!user || !friend || userId === friendId) {
    return { user: null, friend: null, removed: false, status: "invalid" };
  }

  const userFriendIds = Array.isArray(user.friendIds) ? user.friendIds : [];
  const friendFriendIds = Array.isArray(friend.friendIds) ? friend.friendIds : [];
  const userIncomingIds = Array.isArray(user.incomingFriendRequestIds) ? user.incomingFriendRequestIds : [];
  const userOutgoingIds = Array.isArray(user.outgoingFriendRequestIds) ? user.outgoingFriendRequestIds : [];
  const friendIncomingIds = Array.isArray(friend.incomingFriendRequestIds) ? friend.incomingFriendRequestIds : [];
  const friendOutgoingIds = Array.isArray(friend.outgoingFriendRequestIds) ? friend.outgoingFriendRequestIds : [];

  const wasFriend = userFriendIds.includes(friendId) || friendFriendIds.includes(userId);

  if (wasFriend) {
    user.friendIds = userFriendIds.filter((id) => id !== friendId);
    friend.friendIds = friendFriendIds.filter((id) => id !== userId);
    user.updatedAt = new Date().toISOString();
    friend.updatedAt = new Date().toISOString();
    await saveUsers(users);

    return { user, friend, removed: true, status: "unfriended" };
  }

  const canceledOutgoingRequest = userOutgoingIds.includes(friendId) || friendIncomingIds.includes(userId);
  if (canceledOutgoingRequest) {
    user.outgoingFriendRequestIds = userOutgoingIds.filter((id) => id !== friendId);
    friend.incomingFriendRequestIds = friendIncomingIds.filter((id) => id !== userId);
    user.updatedAt = new Date().toISOString();
    friend.updatedAt = new Date().toISOString();
    await saveUsers(users);

    return { user, friend, removed: true, status: "request_canceled" };
  }

  const rejectedIncomingRequest = userIncomingIds.includes(friendId) || friendOutgoingIds.includes(userId);
  if (rejectedIncomingRequest) {
    user.incomingFriendRequestIds = userIncomingIds.filter((id) => id !== friendId);
    friend.outgoingFriendRequestIds = friendOutgoingIds.filter((id) => id !== userId);
    user.updatedAt = new Date().toISOString();
    friend.updatedAt = new Date().toISOString();
    await saveUsers(users);

    return { user, friend, removed: true, status: "request_rejected" };
  }

  return { user, friend, removed: false, status: "not_found" };
}

function mapUsersByIds(users, ids) {
  return users
    .filter((u) => ids.includes(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar || ""
    }));
}

export async function getFriends(userId) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return [];

  const friendIds = Array.isArray(user.friendIds)
    ? user.friendIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isFinite(id))
    : [];

  return users
    .filter((u) => friendIds.includes(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    }));
}

export async function getFriendRequests(userId) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return { incoming: [], outgoing: [] };
  }

  const incomingIds = Array.isArray(user.incomingFriendRequestIds)
    ? user.incomingFriendRequestIds.map((id) => Number.parseInt(id, 10)).filter((id) => Number.isFinite(id))
    : [];
  const outgoingIds = Array.isArray(user.outgoingFriendRequestIds)
    ? user.outgoingFriendRequestIds.map((id) => Number.parseInt(id, 10)).filter((id) => Number.isFinite(id))
    : [];

  return {
    incoming: mapUsersByIds(users, incomingIds),
    outgoing: mapUsersByIds(users, outgoingIds)
  };
}

export async function updateUserRole(userId, newRole) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  
  user.role = newRole;
  await saveUsers(users);
  return user;
}

export async function updateUserProfile(userId, { name, email, avatar = "" }) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  user.name = name;
  user.email = email;
  user.avatar = avatar;
  user.updatedAt = new Date().toISOString();

  await saveUsers(users);
  return user;
}

export async function updateUserPassword(userId, newPasswordHash) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  user.passwordHash = newPasswordHash;
  user.updatedAt = new Date().toISOString();

  await saveUsers(users);
  return user;
}

export async function updateUserVipPackage(userId, vipPackage) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  if (!user.vipPackage) {
    user.vipPackage = { status: "free", activatedAt: new Date().toISOString(), expiresAt: null, autoRenew: false };
  }

  user.vipPackage = {
    ...user.vipPackage,
    ...vipPackage,
    updatedAt: new Date().toISOString()
  };

  await saveUsers(users);
  return user;
}

export async function updateUserPendingVipRequest(userId, pendingRequest) {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  if (pendingRequest === null) {
    user.pendingVipRequest = null;
  } else {
    user.pendingVipRequest = {
      ...(user.pendingVipRequest || {}),
      ...pendingRequest,
      updatedAt: new Date().toISOString()
    };
  }

  user.updatedAt = new Date().toISOString();
  await saveUsers(users);
  return user;
}

export async function findUserByVipRequestId(requestId) {
  const users = await getUsers();
  return users.find((user) => user.pendingVipRequest?.requestId === requestId) || null;
}

export async function upsertUserPaymentHistory(userId, paymentItem) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const invoiceId = String(paymentItem?.invoiceId || "").trim();
  if (!invoiceId) return user;

  if (!Array.isArray(user.paymentHistory)) {
    user.paymentHistory = [];
  }

  const existingIndex = user.paymentHistory.findIndex((item) => item.invoiceId === invoiceId);
  const mergedItem = {
    ...(existingIndex >= 0 ? user.paymentHistory[existingIndex] : {}),
    ...paymentItem,
    invoiceId,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    user.paymentHistory[existingIndex] = mergedItem;
  } else {
    user.paymentHistory.unshift(mergedItem);
  }

  user.updatedAt = new Date().toISOString();
  await saveUsers(users);
  return user;
}

export async function appendUserViewedArticle(userId, articleId, viewLimit = 5) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const numericArticleId = Number.parseInt(articleId, 10);
  if (!Number.isFinite(numericArticleId)) {
    return {
      user,
      viewedCount: Array.isArray(user.newsViewStats?.articleIds) ? user.newsViewStats.articleIds.length : 0,
      isNewView: false
    };
  }

  const existingIds = Array.isArray(user.newsViewStats?.articleIds)
    ? user.newsViewStats.articleIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isFinite(id))
    : [];

  const normalizedIds = [...new Set(existingIds)];
  const alreadyViewed = normalizedIds.includes(numericArticleId);

  if (!alreadyViewed) {
    normalizedIds.push(numericArticleId);
  }

  user.newsViewStats = {
    limit: Number.isFinite(viewLimit) ? Math.max(1, viewLimit) : 5,
    articleIds: normalizedIds,
    viewedCount: normalizedIds.length,
    updatedAt: new Date().toISOString()
  };
  user.updatedAt = new Date().toISOString();

  await saveUsers(users);

  return {
    user,
    viewedCount: normalizedIds.length,
    isNewView: !alreadyViewed
  };
}

export async function updateUserSpinWheelReward(userId, rewardPayload) {
  const users = await getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const now = new Date().toISOString();
  const nextSpinWheel = rewardPayload?.spinWheel || null;
  const nextVipDiscount = rewardPayload?.vipDiscount;

  if (nextSpinWheel) {
    user.spinWheel = {
      ...(user.spinWheel || {}),
      ...nextSpinWheel,
      updatedAt: now
    };
  }

  if (nextVipDiscount === null) {
    user.vipDiscount = null;
  } else if (nextVipDiscount && typeof nextVipDiscount === "object") {
    user.vipDiscount = {
      ...(user.vipDiscount || {}),
      ...nextVipDiscount,
      updatedAt: now
    };
  }

  user.updatedAt = now;
  await saveUsers(users);
  return user;
}
