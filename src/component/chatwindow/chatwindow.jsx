import { useState, useRef, useEffect } from "react";

import "./chatwindow.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { I, Icon } from "../icon/icon";
import {
  SendMessage,
  GetconversationId,
} from "../../services/userServices/userServices";

function Feedback({ text }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState(null); // "up" | "down" | null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  const toggleVote = (v) => setVote((prev) => (prev === v ? null : v));

  return (
    <div className="feedback">
      <button aria-label="Copy" onClick={copy}>
        {copied ? <span className="copied">✓</span> : <Icon d={I.copy} size={13} />}
      </button>

      <button
        aria-label="Good response"
        className={vote === "up" ? "active" : ""}
        onClick={() => toggleVote("up")}
      >
        <Icon d={I.up} size={13} />
      </button>

      <button
        aria-label="Bad response"
        className={vote === "down" ? "active" : ""}
        onClick={() => toggleVote("down")}
      >
        <Icon d={I.down} size={13} />
      </button>
    </div>
  );
}

function BotMessage({ m }) {
  return (
    <div className="row bot">
      <div className="bubble bot-bubble">
        <div className="markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
        </div>

        <Feedback text={m.text} />
      </div>
    </div>
  );
}

export default function ChatWindow({
  title,
  conversationId,
  onMenu,
  onConversationCreated,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const skipFetchRef = useRef(false);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const taRef = useRef(null);

  const now = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Textarea text ke hisaab se badhe (max 160px)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Conversation change hone par purane messages load karo
  useEffect(() => {
    // Naya chat abhi bana hai, messages screen par pehle se hain, fetch mat karo
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    let cancelled = false;

    const fetchMessages = async () => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      setLoading(true);

      try {
        const data = await GetconversationId(conversationId);
        if (cancelled) return;

        if (data?.success) {
          setMessages(
            data.messages.map((item) => ({
              id: item._id,
              role: item.role === "assistant" ? "bot" : "user",
              text: item.content,
              time: new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );
        } else {
          setMessages([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load messages:", error);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Naya message aane par neeche scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const stop = () => {
    abortRef.current?.abort();
    setTyping(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;

    setInput("");
    setTyping(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text, time: now() },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await SendMessage(
        { conversationid: conversationId, message: text },
        controller.signal
      );

      setTyping(false);

      if (data?.success) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "bot", text: data.response, time: now() },
        ]);

        if (!conversationId && data.conversationid) {
          skipFetchRef.current = true; // pehle flag, phir parent update
          try {
            onConversationCreated?.(data.conversationid);
          } catch (e) {
            console.error("onConversationCreated failed:", e);
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            role: "bot",
            text: "Something went wrong. Try again.",
            time: now(),
          },
        ]);
      }
    } catch (error) {
      if (error.code === "ERR_CANCELED") return; // stop() ne typing pehle hi band kar di

      console.error("Send message error:", error.response?.data || error);
      setTyping(false);

      const msg =
        error.response?.status === 429
          ? "Too many messages. Please wait a minute."
          : error.response?.data?.message || "Something went wrong. Try again.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: "bot", text: msg, time: now() },
      ]);
    }
  };

  return (
    <main className="main">
      <header className="topbar">
        <button className="ghost burger" onClick={onMenu} aria-label="Menu">
          <Icon d={I.menu} />
        </button>

        <div>
          <h1>{title || "New Chat"}</h1>
          <small>
            {conversationId ? "Conversation" : "Start a new conversation"}
          </small>
        </div>

        <div className="actions">
          <button className="ghost" aria-label="Share">
            <Icon d={I.share} />
          </button>
        </div>
      </header>

      <section className="messages">
        {messages.length === 0 && !loading && !typing && (
          <div className="empty">Ask anything to start a new conversation.</div>
        )}

        {loading && messages.length === 0 && (
          <div className="empty">Loading chat...</div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div className="row user" key={m.id}>
              <div className="bubble user-bubble">
                <p>{m.text}</p>
                <small>{m.time}</small>
              </div>
            </div>
          ) : (
            <BotMessage key={m.id} m={m} />
          )
        )}

        {typing && (
          <div className="row bot">
            <div className="bubble bot-bubble dots">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </section>

      <footer className="composer">
        <div className="field">
          <button className="ghost" aria-label="Attach file">
            <Icon d={I.clip} />
          </button>

          <textarea
            ref={taRef}
            rows={1}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
          />

          <button
            className="send"
            onClick={typing ? stop : send}
            aria-label={typing ? "Stop answering" : "Send"}
          >
            {typing ? <span className="stop-square" /> : <Icon d={I.send} />}
          </button>
        </div>
      </footer>
    </main>
  );
}