import { useState, useEffect, useCallback } from "react";
import "./chatbot-main.css";
import Sidebar from "../../component/sidebar/sidebar";
import ChatWindow from "../../component/chatwindow/chatwindow";
import { Getconversation } from "../../services/userServices/userServices";

export default function Chatbot() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(
    () => localStorage.getItem("activeChat") || null
  );
  const [open, setOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);


  useEffect(() => {
    if (active) localStorage.setItem("activeChat", active);
    else localStorage.removeItem("activeChat");
  }, [active]);

  const fetchConversations = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const select = (id) => {
  setActive(id);
  setChatKey((k) => k + 1);  
  setOpen(false);
};

  const newChat = () => {
    setActive(null);
    setChatKey((k) => k + 1);
    setOpen(false);
  };

  const activeTitle =
    conversations.find((c) => c._id === active)?.title || "New Chat";

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        setConversations={setConversations}
        active={active}
        open={open}
        onSelect={select}
        onNewChat={newChat}
        onDeleted={newChat}
      />

      <ChatWindow
  key={chatKey}               
  title={activeTitle}
  conversationId={active}
  onMenu={() => setOpen(!open)}
  onConversationCreated={(id) => {
    setActive(id);            
    fetchConversations();
  }}
/>
    </div>
  );
}