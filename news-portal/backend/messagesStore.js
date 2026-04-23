import { access, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MESSAGES_FILE = path.join(__dirname, "messages.json");

async function ensureMessagesFile() {
  try {
    await access(MESSAGES_FILE);
  } catch {
    await writeFile(MESSAGES_FILE, "[]", "utf8");
  }
}

async function getAllMessages() {
  await ensureMessagesFile();
  const raw = await readFile(MESSAGES_FILE, "utf8");

  try {
    const messages = JSON.parse(raw);
    return Array.isArray(messages) ? messages : [];
  } catch {
    return [];
  }
}

async function saveAllMessages(messages) {
  await writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf8");
}

function buildConversationKey(userId, otherUserId) {
  return [userId, otherUserId].map((value) => Number.parseInt(value, 10)).sort((a, b) => a - b).join(":");
}

export async function getConversationMessages(userId, otherUserId) {
  const conversationKey = buildConversationKey(userId, otherUserId);
  const messages = await getAllMessages();

  return messages
    .filter((item) => item.conversationKey === conversationKey)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function appendConversationMessage({ senderId, receiverId, content }) {
  const messages = await getAllMessages();
  const nextId = messages.length > 0 ? Math.max(...messages.map((item) => item.id || 0)) + 1 : 1;
  const nextMessage = {
    id: nextId,
    conversationKey: buildConversationKey(senderId, receiverId),
    senderId,
    receiverId,
    content,
    createdAt: new Date().toISOString()
  };

  messages.push(nextMessage);
  await saveAllMessages(messages);
  return nextMessage;
}