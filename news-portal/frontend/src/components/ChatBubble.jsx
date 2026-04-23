import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ChatBubble.css";

const DEFAULT_ASSISTANT_MESSAGE =
  "Tôi là NewsAI. Hãy coi tôi như một trợ lý sẵn sàng giúp bạn học hỏi, lập kế hoạch và kết nối. Tôi có thể giúp gì cho bạn hôm nay?";

function getDefaultMessages() {
  return [
    {
      id: "m1",
      role: "assistant",
      text: DEFAULT_ASSISTANT_MESSAGE
    }
  ];
}

function normalizeStoredMessages(rawValue) {
  if (!Array.isArray(rawValue)) {
    return getDefaultMessages();
  }

  const normalized = rawValue
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: String(item.id || `stored-${index}`),
      role: item.role === "user" ? "user" : "assistant",
      text: String(item.text || "").trim()
    }))
    .filter((item) => item.text.length > 0)
    .slice(-40);

  return normalized.length > 0 ? normalized : getDefaultMessages();
}

function readStoredMessages(storageKey) {
  if (!storageKey) {
    return getDefaultMessages();
  }

  try {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) {
      return getDefaultMessages();
    }

    return normalizeStoredMessages(JSON.parse(rawValue));
  } catch {
    return getDefaultMessages();
  }
}

const ChatBubble = ({ onClose, aiContext, storageKey }) => {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [messages, setMessages] = useState(() => readStoredMessages(storageKey));
  const streamRef = useRef(null);

  const nowLabel = useMemo(() => {
    return new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }, []);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages, isSending, requestError]);

  useEffect(() => {
    setMessages(readStoredMessages(storageKey));
    setRequestError("");
    setDraft("");
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      // Ignore storage quota or browser persistence failures.
    }
  }, [messages, storageKey]);

  function handleClearMessages() {
    const shouldClear = window.confirm("Bạn có muốn xóa toàn bộ lịch sử chat với NewsAI không?");
    if (!shouldClear) return;

    setMessages(getDefaultMessages());
    setDraft("");
    setRequestError("");

    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore browser storage failures.
    }
  }

  async function handleSendMessage() {
    const content = draft.trim();
    if (!content || isSending) return;

    const userMessage = {
      id: `${Date.now()}`,
      role: "user",
      text: content
    };

    const nextHistory = [...messages, userMessage]
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({
        role: item.role,
        text: item.text
      }))
      .slice(-8);

    setMessages((prev) => [...prev, userMessage]);
    setRequestError("");
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: content,
          history: nextHistory,
          context: aiContext || {}
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Không thể kết nối trợ lý AI lúc này.");
      }

      const assistantText = String(data.reply || "").trim() || "Mình chưa có câu trả lời phù hợp.";
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: assistantText
        }
      ]);
    } catch (error) {
      const fallbackText =
        "Mình chưa lấy được phản hồi từ AI. Bạn có thể thử lại, hoặc hỏi ngắn gọn hơn theo tên chuyên mục, từ khóa, VIP hay đăng tin.";

      setRequestError(error.message || fallbackText);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: fallbackText
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    await handleSendMessage();
  }

  return (
    <div className="chat-bubble-ai">
      <div className="chat-bubble-header">
        <div className="chat-bubble-header-left">
          <div className="chat-bubble-avatar-ring" aria-hidden="true">
            <div className="chat-bubble-avatar-core" />
          </div>
          <div>
            <p className="chat-bubble-title">NewsAI</p>
          </div>
        </div>
        <div className="chat-bubble-actions">
          <button type="button" className="chat-bubble-action" aria-label="Thu nhỏ">
            _
          </button>
          <button
            type="button"
            className="chat-bubble-action chat-bubble-action-danger"
            onClick={handleClearMessages}
            aria-label="Xóa lịch sử chat"
            title="Xóa lịch sử chat"
            disabled={isSending}
          >
            🗑
          </button>
          <button type="button" className="chat-bubble-action" onClick={onClose} aria-label="Đóng">
            x
          </button>
        </div>
      </div>

      <div className="chat-bubble-body">
        <div className="chat-bubble-date-chip">13:36 | {nowLabel}</div>
        <div className="chat-bubble-stream" ref={streamRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble-row ${message.role === "user" ? "row-user" : "row-bot"}`}
            >
              <div className={`chat-bubble-message ${message.role === "user" ? "user" : "bot"}`}>
                {message.text}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="chat-bubble-row row-bot">
              <div className="chat-bubble-message bot chat-bubble-message-loading">NewsAI đang suy nghĩ...</div>
            </div>
          )}
        </div>
      </div>

      <form className="chat-bubble-footer" onSubmit={handleFormSubmit}>
        <div className="chat-bubble-tools" aria-hidden="true">
          <span>+</span>
          <span>gif</span>
          <span>@</span>
        </div>
        <div className="chat-bubble-compose-wrap">
          <input
            type="text"
            placeholder="Aa"
            className="chat-bubble-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={isSending}
          />
          <button type="submit" className="chat-bubble-send" aria-label="Gửi tin nhắn" disabled={isSending || !draft.trim()}>
            {">"}
          </button>
        </div>
        {requestError && <p className="chat-bubble-request-error">{requestError}</p>}
      </form>
    </div>
  );
};

export default ChatBubble;
