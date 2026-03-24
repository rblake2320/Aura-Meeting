import React, { useState, useEffect, useRef } from "react";
import { useChat, useLocalParticipant } from "@livekit/components-react";
import { Send, User, Trash2, X, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface ChatSidebarProps {
  deletedMessageIds: Set<string>;
}

export default function ChatSidebar({ deletedMessageIds }: ChatSidebarProps) {
  const { chatMessages, send } = useChat();
  const { localParticipant } = useLocalParticipant();
  const [message, setMessage] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      await send(message);
      setMessage("");
    }
  };

  const handleDelete = async (id: string) => {
    const payload = JSON.stringify({
      type: "CHAT_DELETE",
      id
    });
    const encoder = new TextEncoder();
    await localParticipant.publishData(encoder.encode(payload), {
      reliable: true
    });
    setConfirmDeleteId(null);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-2xl border border-zinc-800/50 overflow-hidden">
      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
            <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
              <Send className="w-6 h-6 opacity-20" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest">No messages yet</p>
          </div>
        ) : (
          (() => {
            const filtered = chatMessages.filter(msg => !deletedMessageIds.has(msg.id));
            return filtered.map((msg, i) => {
              const isMe = msg.from?.identity === localParticipant.identity;
              const isConfirming = confirmDeleteId === msg.id;
              
              const prevMsg = i > 0 ? filtered[i - 1] : null;
              const nextMsg = i < filtered.length - 1 ? filtered[i + 1] : null;
              
              const isSameSenderAsPrev = prevMsg && prevMsg.from?.identity === msg.from?.identity;
              const isSameSenderAsNext = nextMsg && nextMsg.from?.identity === msg.from?.identity;
              
              const timeDiffPrev = prevMsg ? msg.timestamp - prevMsg.timestamp : Infinity;
              const isGroupStart = !isSameSenderAsPrev || timeDiffPrev > 300000; // 5 mins gap
              
              const timeDiffNext = nextMsg ? nextMsg.timestamp - msg.timestamp : Infinity;
              const isGroupEnd = !isSameSenderAsNext || timeDiffNext > 300000;

              return (
                <div 
                  key={msg.id || i} 
                  className={cn(
                    "flex flex-col max-w-[85%] group relative",
                    isMe ? "ml-auto items-end" : "items-start",
                    isGroupStart ? "mt-4" : "mt-0.5"
                  )}
                >
                  {isGroupStart && (
                    <div className={cn(
                      "flex items-center gap-2 mb-1 px-1",
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}>
                      {!isMe && (
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                          {msg.from?.name || msg.from?.identity}
                        </span>
                      )}
                      <span className="text-[9px] text-zinc-500 font-medium">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  <div className="relative group/msg flex items-center gap-2">
                    {isMe && !isConfirming && (
                      <button
                        onClick={() => setConfirmDeleteId(msg.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover/msg:opacity-100 transition-all shrink-0"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isConfirming && (
                      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 shadow-2xl z-10 shrink-0">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1 text-red-500 hover:text-red-400 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className={cn(
                      "px-3 py-2 text-sm leading-relaxed shadow-sm transition-all",
                      isMe 
                        ? "bg-blue-600 text-white shadow-blue-900/10" 
                        : "bg-zinc-800 text-zinc-200 shadow-black/20",
                      // Custom rounding for grouping
                      isMe ? (
                        cn(
                          "rounded-2xl rounded-tr-none",
                          !isGroupStart && "rounded-tr-none",
                          !isGroupEnd && "rounded-br-none"
                        )
                      ) : (
                        cn(
                          "rounded-2xl rounded-tl-none",
                          !isGroupStart && "rounded-tl-none",
                          !isGroupEnd && "rounded-bl-none"
                        )
                      )
                    )}>
                      {msg.message}
                    </div>
                    
                    {!isMe && (
                      <span className="text-[8px] text-zinc-600 opacity-0 group-hover/msg:opacity-100 transition-opacity whitespace-nowrap">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSend}
        className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
