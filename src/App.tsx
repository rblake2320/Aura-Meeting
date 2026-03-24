import React, { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
  useChat,
  useLocalParticipant,
  ControlBar,
  LayoutContextProvider,
  RoomAudioRenderer,
  Chat,
  MessageFormatter,
} from "@livekit/components-react";
import { RoomOptions, VideoPresets, ExternalE2EEKeyProvider } from "livekit-client";
import { 
  Video, 
  Mic, 
  Monitor, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Unlock
} from "lucide-react";
import { cn } from "./lib/utils";
import MeetingAssistant from "./components/MeetingAssistant";
import TranscriptionAssistant from "./components/TranscriptionAssistant";
import MeetingRecorder from "./components/MeetingRecorder";
import ParticipantList from "./components/ParticipantList";
import NoiseSuppression from "./components/NoiseSuppression";
import ScreenShareControl from "./components/ScreenShareControl";
import MediaControls from "./components/MediaControls";
import EncryptionBadge from "./components/EncryptionBadge";
import ChatSidebar from "./components/ChatSidebar";
import BreakoutManager from "./components/BreakoutManager";
import CustomConference from "./components/CustomConference";
import LayoutSwitcher, { VideoLayout } from "./components/LayoutSwitcher";

const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [isSecure, setIsSecure] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"assistant" | "participants" | "chat" | "breakout">("assistant");
  const [mainRoomName, setMainRoomName] = useState("");
  const [isBreakoutActive, setIsBreakoutActive] = useState(false);
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set());
  const [videoLayout, setVideoLayout] = useState<VideoLayout>("speaker");

  const keyProvider = React.useMemo(() => new ExternalE2EEKeyProvider(), []);

  const encryptionOptions = React.useMemo(() => ({
    publishDefaults: {
      isEncryptionEnabled: isSecure,
    },
    keyProvider,
  }), [isSecure, keyProvider]);

  useEffect(() => {
    if (isSecure && passphrase) {
      keyProvider.setKey(passphrase);
    }
  }, [isSecure, passphrase, keyProvider]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !username) return;

    setIsJoining(true);
    setError(null);

    try {
      const resp = await fetch(`/api/token?room=${roomName}&username=${username}`);
      const data = await resp.json();
      if (data.token) {
        setToken(data.token);
        setMainRoomName(roomName);
      } else {
        setError(data.error || "Failed to get token");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server");
    } finally {
      setIsJoining(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <Zap className="w-3 h-3" />
              Powered by LiveKit & Gemini
            </div>
            <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Aura Meeting
            </h1>
            <p className="text-zinc-400 text-lg">
              Next-generation video collaboration for high-performance teams.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-xl">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Room Name</label>
              <input
                type="text"
                placeholder="e.g. Design Sync"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-700"
                required
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn("w-4 h-4", isSecure ? "text-emerald-400" : "text-zinc-500")} />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">End-to-End Encryption</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSecure(!isSecure)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-all relative",
                    isSecure ? "bg-emerald-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    isSecure ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              {isSecure && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Security Passphrase
                  </label>
                  <input
                    type="password"
                    placeholder="Enter a shared secret"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700"
                    required={isSecure}
                  />
                  <p className="text-[10px] text-zinc-500 italic">
                    All participants must use the same passphrase to communicate securely.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isJoining ? "Connecting..." : "Join Meeting"}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
              <Globe className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Global</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">AI Ready</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        onDisconnected={() => setToken(null)}
        className="flex-1 flex flex-col"
      >
        <BreakoutObserver 
          onMoveToRoom={async (newRoom) => {
            try {
              const resp = await fetch(`/api/token?room=${newRoom}&username=${username}`);
              const data = await resp.json();
              if (data.token) {
                setToken(data.token);
                setIsBreakoutActive(true);
              }
            } catch (err) {
              console.error("Failed to move to breakout room:", err);
            }
          }}
          onReturnToMain={async () => {
            try {
              const resp = await fetch(`/api/token?room=${mainRoomName}&username=${username}`);
              const data = await resp.json();
              if (data.token) {
                setToken(data.token);
                setIsBreakoutActive(false);
              }
            } catch (err) {
              console.error("Failed to return to main room:", err);
            }
          }}
        />
        <ChatDeleteObserver onMessageDeleted={(id) => setDeletedMessageIds(prev => new Set(prev).add(id))} />
        <div className="flex-1 flex relative">
          <LayoutContextProvider>
            <div className="flex-1 relative">
              <CustomConference layout={videoLayout} />
            </div>

            {/* Sidebar for Chat and AI Assistant */}
            <div className={cn(
              "w-[350px] bg-zinc-950 border-l border-zinc-800 flex flex-col transition-all duration-300 ease-in-out",
              !showAssistant && "w-0 border-none overflow-hidden"
            )}>
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSidebarTab("assistant")}
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-colors",
                      sidebarTab === "assistant" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    AI Assistant
                  </button>
                  <button 
                    onClick={() => setSidebarTab("chat")}
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-colors",
                      sidebarTab === "chat" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Chat
                  </button>
                  <button 
                    onClick={() => setSidebarTab("breakout")}
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-colors",
                      sidebarTab === "breakout" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Breakout
                  </button>
                  <button 
                    onClick={() => setSidebarTab("participants")}
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-colors",
                      sidebarTab === "participants" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Participants
                  </button>
                </div>
                <button 
                  onClick={() => setShowAssistant(false)}
                  className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 rotate-180" />
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-hidden">
                <ChatObserver 
                  onMessagesUpdate={setChatMessages} 
                  deletedMessageIds={deletedMessageIds}
                />
                {sidebarTab === "assistant" && <MeetingAssistant chatMessages={chatMessages} />}
                {sidebarTab === "chat" && <ChatSidebar deletedMessageIds={deletedMessageIds} />}
                {sidebarTab === "participants" && <ParticipantList />}
                {sidebarTab === "breakout" && (
                  <BreakoutManager 
                    isStarted={isBreakoutActive}
                    onStart={() => setIsBreakoutActive(true)}
                    onEnd={() => setIsBreakoutActive(false)}
                  />
                )}
              </div>
            </div>
          </LayoutContextProvider>
        </div>

        {/* Custom Control Bar Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
          <div className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800/50 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
            <EncryptionBadge isSecure={isSecure} />
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <MediaControls />
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <LayoutSwitcher currentLayout={videoLayout} onLayoutChange={setVideoLayout} />
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <MeetingRecorder />
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <ScreenShareControl />
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <NoiseSuppression />
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <TranscriptionAssistant />
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <button 
              onClick={() => {
                if (showAssistant && sidebarTab === "assistant") {
                  setShowAssistant(false);
                } else {
                  setShowAssistant(true);
                  setSidebarTab("assistant");
                }
              }}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                showAssistant && sidebarTab === "assistant" ? "bg-blue-600 text-white" : "hover:bg-zinc-800 text-zinc-400"
              )}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">AI Assistant</span>
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <button 
              onClick={() => {
                if (showAssistant && sidebarTab === "chat") {
                  setShowAssistant(false);
                } else {
                  setShowAssistant(true);
                  setSidebarTab("chat");
                }
              }}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                showAssistant && sidebarTab === "chat" ? "bg-blue-600 text-white" : "hover:bg-zinc-800 text-zinc-400"
              )}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Chat</span>
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <button 
              onClick={() => {
                if (showAssistant && sidebarTab === "participants") {
                  setShowAssistant(false);
                } else {
                  setShowAssistant(true);
                  setSidebarTab("participants");
                }
              }}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                showAssistant && sidebarTab === "participants" ? "bg-blue-600 text-white" : "hover:bg-zinc-800 text-zinc-400"
              )}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Participants</span>
            </button>
            <div className="w-px h-6 bg-zinc-800 mx-1" />
            <button 
              onClick={() => setToken(null)}
              className="p-3 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all flex items-center gap-2"
              title="Leave Meeting"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Leave</span>
            </button>
          </div>
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

/**
 * Helper component to observe chat messages and update the assistant state
 */
function ChatObserver({ 
  onMessagesUpdate, 
  deletedMessageIds 
}: { 
  onMessagesUpdate: (msgs: string[]) => void;
  deletedMessageIds: Set<string>;
}) {
  const { chatMessages } = useChat();
  
  useEffect(() => {
    const messages = chatMessages
      .filter(m => !deletedMessageIds.has(m.id))
      .map(m => `${m.from?.identity}: ${m.message}`);
    onMessagesUpdate(messages);
  }, [chatMessages, onMessagesUpdate, deletedMessageIds]);

  return null;
}

/**
 * Helper component to listen for chat message deletions
 */
function ChatDeleteObserver({ onMessageDeleted }: { onMessageDeleted: (id: string) => void }) {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (data.type === "CHAT_DELETE") {
          onMessageDeleted(data.id);
        }
      } catch (e) {
        // Not a chat delete message
      }
    };

    localParticipant.on("dataReceived", handleData);
    return () => {
      localParticipant.off("dataReceived", handleData);
    };
  }, [localParticipant, onMessageDeleted]);

  return null;
}

/**
 * Helper component to listen for breakout room signals
 */
function BreakoutObserver({ 
  onMoveToRoom, 
  onReturnToMain 
}: { 
  onMoveToRoom: (room: string) => void; 
  onReturnToMain: () => void;
}) {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant: any) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (data.type === "BREAKOUT_START") {
          // Check if I'm assigned to this room
          if (data.assignments[localParticipant.identity]) {
            onMoveToRoom(data.assignments[localParticipant.identity]);
          }
        } else if (data.type === "BREAKOUT_END") {
          onReturnToMain();
        }
      } catch (e) {
        // Not a breakout message
      }
    };

    localParticipant.on("dataReceived", handleData);
    return () => {
      localParticipant.off("dataReceived", handleData);
    };
  }, [localParticipant, onMoveToRoom, onReturnToMain]);

  return null;
}
