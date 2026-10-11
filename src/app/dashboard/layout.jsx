"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/auth";

// Format timestamps for chat bubbles
const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (isToday) {
    return `${hours}:${minutes}`;
  }

  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  return `${day} ${month}, ${hours}:${minutes}`;
};

// Format timestamps for sidebar chat items
const formatSidebarTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${monthNames[date.getMonth()]}`;
};

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);
  const [user, setUser] = useState({ name: "Arno Mostert", role: "Normal User", email: "arno@coreforge.com" });
  
  // Messaging State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedColleague, setSelectedColleague] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);

  const chatEndRef = useRef(null);

  // Sync user session on mount
  useEffect(() => {
    setHasMounted(true);
    const active = getCurrentUser();
    
    if (active) {
      const email = active.email || (active.name === "Ruan" ? "ruan@coreforge.com" : "arno@coreforge.com");
      setUser({
        name: active.name || "User",
        role: active.role || "Normal User",
        email: email.toLowerCase(),
      });
    }
  }, [pathname]);

  // Check unread count
  const checkUnread = async () => {
    const activeEmail = user.email || "arno@coreforge.com";
    try {
      const res = await fetch(`/api/messages?userEmail=${encodeURIComponent(activeEmail)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setTotalUnread(data.unreadCount || 0);
      }
    } catch (err) {
      // Quiet poll
    }
  };

  useEffect(() => {
    if (!hasMounted) return;
    checkUnread();
    const interval = setInterval(checkUnread, 3000);
    return () => clearInterval(interval);
  }, [user.email, hasMounted]);

  // Reset chat state whenever a different account logs in
  useEffect(() => {
    setSelectedColleague(null);
    setMessages([]);
    setConversations([]);
    setShowPicker(false);
  }, [user.email]);

  // Keep the conversation list fresh while the chat window is open
  useEffect(() => {
    if (!isChatOpen || !hasMounted) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, [isChatOpen, user.email, hasMounted]);

  // Everyone I could start a NEW chat with (all registered users except me)
  const fetchAllUsers = async () => {
    const activeEmail = (user.email || "").toLowerCase();
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        let list = data.data.filter(
          (u) => u.email && u.email.toLowerCase() !== activeEmail
        );
        const hasRuan = data.data.some((u) => u.email?.toLowerCase() === "ruan@coreforge.com");
        if (!hasRuan && activeEmail !== "ruan@coreforge.com") {
          list = [...list, { _id: "ruan-fallback", name: "Ruan", email: "ruan@coreforge.com", role: "Admin" }];
        }
        setAllUsers(list);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // Only people I have actually exchanged messages with
  const fetchConversations = async () => {
    const activeEmail = (user.email || "").toLowerCase();
    if (!activeEmail) return;
    try {
      const res = await fetch(
        `/api/messages?userEmail=${encodeURIComponent(activeEmail)}&conversations=true`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
        setSelectedColleague((current) => current || data.data[0] || null);
      }
    } catch (err) {
      // Quiet poll
    }
  };

  // Fetch messages history
  const loadChatHistory = async () => {
    if (!isChatOpen || !selectedColleague?.email) return;

    const activeEmail = (user.email || "arno@coreforge.com").toLowerCase();
    const peerEmail = selectedColleague.email.toLowerCase();

    try {
      const url = `/api/messages?userEmail=${encodeURIComponent(activeEmail)}&peerEmail=${encodeURIComponent(peerEmail)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
        checkUnread();
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  useEffect(() => {
    if (isChatOpen && selectedColleague && hasMounted) {
      loadChatHistory();
      const interval = setInterval(loadChatHistory, 2500);
      return () => clearInterval(interval);
    }
  }, [isChatOpen, selectedColleague?.email, user.email, hasMounted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedColleague?.email) return;

    const activeEmail = (user.email || "arno@coreforge.com").toLowerCase();

    const payload = {
      senderEmail: activeEmail,
      senderName: user.name,
      recipientEmail: selectedColleague.email.toLowerCase(),
      content: newMessageText.trim(),
    };

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessageText("");
        loadChatHistory();
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Delete a single message for MY side only
  const handleDeleteSingleMessage = async (msgId) => {
    const activeEmail = (user.email || "arno@coreforge.com").toLowerCase();
    setMessages((prev) => prev.filter((m) => (m._id || m.id) !== msgId));

    try {
      await fetch(
        `/api/messages?id=${msgId}&userEmail=${encodeURIComponent(activeEmail)}`,
        { method: "DELETE" }
      );
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // Delete an entire chat conversation for MY side only
  const handleDeleteConversation = async (peerEmail, e) => {
    e.stopPropagation();
    const activeEmail = (user.email || "arno@coreforge.com").toLowerCase();

    setConversations((prev) => prev.filter((c) => c.email.toLowerCase() !== peerEmail.toLowerCase()));

    if (selectedColleague?.email?.toLowerCase() === peerEmail.toLowerCase()) {
      setSelectedColleague(null);
      setMessages([]);
    }

    try {
      await fetch(
        `/api/messages?peerEmail=${encodeURIComponent(peerEmail)}&userEmail=${encodeURIComponent(activeEmail)}`,
        { method: "DELETE" }
      );
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Sidebar = real conversations, plus a freshly picked person until the first message is sent
  const sidebarChats = (() => {
    const list = [...conversations];
    if (
      selectedColleague &&
      !list.some((c) => c.email.toLowerCase() === selectedColleague.email.toLowerCase())
    ) {
      list.unshift({ ...selectedColleague, lastMessage: "" });
    }
    return list;
  })();

  const handleLogout = () => {
    logoutUser();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white relative">
      
      {/* Power Logout Button */}
      <div className="fixed top-4 right-6 z-40">
        <button
          onClick={handleLogout}
          title="Sign Out to Login Screen"
          className="w-11 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 text-lg font-bold"
        >
          ⏻
        </button>
      </div>

      {/* Floating Messaging Button */}
      <div className="fixed bottom-5 right-6 z-40">
        <button
          onClick={() => {
            const nextState = !isChatOpen;
            setIsChatOpen(nextState);
            if (nextState) {
              fetchAllUsers();
            }
          }}
          className="relative w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-xl">💬</span>

          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse shadow-md">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Speech Bubble Messaging Drawer */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-[560px] max-w-[calc(100vw-2rem)] h-[420px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-base">💬</span>
              <div>
                <h3 className="font-bold text-xs text-white">Direct Messaging Subsystem</h3>
                <p className="text-[10px] text-slate-400">Core Forge Internal Communications</p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-xs"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar: only people I have chatted with */}
            <div className="w-48 bg-slate-950/80 border-r border-slate-800 flex flex-col overflow-y-auto p-2 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 px-2 py-1 uppercase tracking-wider">
                Chats
              </span>

              {sidebarChats.length === 0 ? (
                <div className="text-[11px] text-slate-500 p-2 text-center">
                  No chats yet. Use the name at the top to start one.
                </div>
              ) : (
                sidebarChats.map((col) => {
                  const isSelected = selectedColleague?.email?.toLowerCase() === col.email?.toLowerCase();
                  return (
                    <div
                      key={col.email}
                      onClick={() => {
                        setSelectedColleague(col);
                        setShowPicker(false);
                      }}
                      className={`group w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white font-medium shadow-md"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border border-slate-700">
                          {(col.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs truncate font-semibold">{col.name}</p>
                            {col.lastAt && (
                              <span className={`text-[9px] shrink-0 ${isSelected ? "text-blue-200" : "text-slate-500"}`}>
                                {formatSidebarTime(col.lastAt)}
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] truncate ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                            {col.lastMessage || col.role || "New chat"}
                          </p>
                        </div>
                      </div>

                      {col.unread > 0 && !isSelected && (
                        <span className="bg-red-500 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shrink-0">
                          {col.unread}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(col.email, e)}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity shrink-0 ml-1 ${
                          isSelected 
                            ? "text-blue-200 hover:text-white hover:bg-blue-700" 
                            : "text-slate-400 hover:text-red-400 hover:bg-slate-800"
                        }`}
                        title="Delete entire chat"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Thread Panel */}
            <div className="flex-1 flex flex-col bg-slate-900/50">
              
              <div className="relative px-4 py-1.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (!showPicker) fetchAllUsers();
                    setShowPicker(!showPicker);
                  }}
                  className="text-xs font-semibold text-slate-200 hover:bg-slate-800/70 rounded-lg px-2 py-1 -ml-2 transition flex items-center gap-1"
                >
                  {selectedColleague ? (
                    <>
                      Chatting with <span className="text-blue-400">{selectedColleague.name}</span>
                    </>
                  ) : (
                    <span className="text-blue-400">Start a new chat</span>
                  )}
                  <span className="text-[9px] text-slate-400">{showPicker ? "▲" : "▼"}</span>
                </button>
                {selectedColleague && (
                  <span className="text-[10px] text-slate-500">{selectedColleague.email}</span>
                )}

                {showPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
                    <div className="absolute left-3 top-full mt-1 w-64 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 p-1">
                      <p className="text-[10px] font-semibold text-slate-500 px-2 py-1 uppercase tracking-wider">
                        Chat with...
                      </p>
                      {allUsers.length === 0 ? (
                        <p className="text-[11px] text-slate-500 p-2">No other users found.</p>
                      ) : (
                        allUsers.map((u) => (
                          <button
                            key={u._id || u.email}
                            type="button"
                            onClick={() => {
                              setSelectedColleague({ email: u.email.toLowerCase(), name: u.name, role: u.role });
                              setMessages([]);
                              setShowPicker(false);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5 transition"
                          >
                            <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border border-slate-700">
                              {(u.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-200 truncate">{u.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-950/20">
                {!selectedColleague ? (
                  <div className="text-center text-slate-500 text-xs py-12">
                    Click "Start a new chat" above to pick someone.
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-12">
                    No history with <span className="text-slate-300 font-semibold">{selectedColleague.name}</span>.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderEmail.toLowerCase() === (user.email || "arno@coreforge.com").toLowerCase();
                    const msgId = msg._id || msg.id;
                    const formattedTime = formatMessageTime(msg.createdAt);

                    return (
                      <div
                        key={msgId || idx}
                        className={`group relative flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 px-1">
                          <span className="text-[9px] text-slate-400 font-medium">
                            {isMe ? "You" : msg.senderName}
                          </span>
                          {formattedTime && (
                            <span className="text-[8px] text-slate-500">
                              • {formattedTime}
                            </span>
                          )}
                        </div>

                        <div className={`flex items-center gap-1.5 max-w-[85%] ${isMe ? "flex-row" : "flex-row-reverse"}`}>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleMessage(msgId)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-opacity"
                            title="Delete for me"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          <div
                            className={`px-3 py-1.5 rounded-2xl text-xs break-words shadow-sm ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none"
                            }`}
                          >
                            {msg.content}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Bar */}
              <form onSubmit={handleSendMessage} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder={selectedColleague ? `Message ${selectedColleague.name}...` : "Select a colleague..."}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  disabled={!selectedColleague}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!selectedColleague || !newMessageText.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded-xl text-xs transition shadow-md"
                >
                  Send
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

      {/* Main Navigation Sidebar */}
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <Link 
            href="/welcome" 
            className="text-xl font-bold tracking-wider text-blue-400 mb-8 block hover:text-blue-300 transition"
          >
            Core Forge
          </Link>

          <nav className="flex flex-col gap-2">
            <Link 
              href="/dashboard" 
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === "/dashboard" 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Overview
            </Link>

            <Link 
              href="/dashboard/finance" 
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === "/dashboard/finance" 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Finance
            </Link>

            <Link 
              href="/dashboard/clients" 
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === "/dashboard/clients" 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Clients
            </Link>

            <Link 
              href="/dashboard/projects" 
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === "/dashboard/projects" 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Projects
            </Link>

            <Link 
              href="/dashboard/assets" 
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === "/dashboard/assets" 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Assets
            </Link>

            <Link 
              href="/dashboard/invoices" 
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === "/dashboard/invoices" 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Invoices & Approvals
            </Link>

            <Link 
              href="/dashboard/documents" 
              className={`px-4 py-2.5 rounded-lg font-medium transition ${
                pathname === "/dashboard/documents" 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Documents
            </Link>

            {hasMounted && user.role === "Admin" && (
              <Link 
                href="/admin" 
                className={`mt-4 px-4 py-2.5 rounded-lg font-semibold text-xs transition flex items-center justify-between border ${
                  pathname === "/admin"
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30"
                }`}
              >
                <span>User Management</span>
                <span className="text-[12px]">⚙️</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs">
          <div>
            <p className="text-slate-500">Logged in as</p>
            <p className="text-slate-200 font-semibold">{user.name}</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            user.role === "Admin" 
              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}>
            {user.role}
          </span>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pt-10">
        {children}
      </main>
    </div>
  );
}