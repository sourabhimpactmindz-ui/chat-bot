import { useEffect, useState } from "react";
import "./sidebar.css";
import { I, Icon } from "../icon/icon";
import {
  Getconversation,
  DeleteConversation,
} from "../../services/userServices/userServices";

export default function Sidebar({
  active,
  open,
  onSelect,
  onNewChat,
  onDeleted,
  refreshKey,
}) {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [menuId, setMenuId] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await Getconversation();
        if (data?.status) {
          setConversations([...data.getAll].reverse()); 
        } else {
          setConversations([]);
        }
      } catch (error) {
        console.error("Failed to get conversations:", error);
        setConversations([]);
      }
    };
    fetchConversations();
  }, [refreshKey]);

  useEffect(() => {
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setMenuId(null);

    if (!window.confirm("Delete this conversation?")) return;

    try {
      const data = await DeleteConversation(id);
      if (data?.status) {
        setConversations((prev) => prev.filter((c) => c._id !== id));
        if (active === id) onDeleted?.(id);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filtered = conversations.filter((c) =>
    c.title?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="logo"><Icon d={I.chat} size={16} /></div>
        <span>ChatAI</span>
      </div>

      <button className="new-chat" onClick={onNewChat}>
        <Icon d={I.plus} /> New Chat
      </button>

      <div className="search">
        <Icon d={I.search} size={14} />
        <input
          placeholder="Search conversations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <nav className="history">
        {filtered.map((c) => (
          <div
            key={c._id}
            role="button"
            tabIndex={0}
            className={`item ${active === c._id ? "active" : ""}`}
            onClick={() => onSelect(c._id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(c._id)}
          >
            <Icon d={I.chat} size={13} />
            <span className="item-title">{c.title}</span>

            <button
              className="dots-btn"
              aria-label="Options"
              onClick={(e) => {
                e.stopPropagation(); 
                setMenuId(menuId === c._id ? null : c._id);
              }}
            >
              ⋯
            </button>

            {menuId === c._id && (
              <div className="item-menu" onClick={(e) => e.stopPropagation()}>
                <button className="danger" onClick={(e) => handleDelete(e, c._id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}