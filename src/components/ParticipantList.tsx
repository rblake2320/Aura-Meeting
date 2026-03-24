import React from "react";
import { 
  useParticipants, 
  useLocalParticipant, 
  useLayoutContext 
} from "@livekit/components-react";
import { Users, Video, VideoOff, Mic, MicOff, Pin, PinOff } from "lucide-react";
import { cn } from "../lib/utils";

export default function ParticipantList() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const layoutContext = useLayoutContext();

  const handlePin = (p: any) => {
    const trackReference = {
      participant: p,
      source: "camera",
    };

    if (layoutContext?.pin.state.some(pinned => pinned.participant.sid === p.sid)) {
      (layoutContext.pin.dispatch as any)?.({ type: 'clear_pin' });
    } else {
      (layoutContext.pin.dispatch as any)?.({ type: 'set_pin', trackReference });
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-zinc-800 rounded-lg">
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wider">Participants</h3>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-0.5 rounded-md">
            {participants.length}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 font-medium">Manage and view all attendees</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {participants.map((p) => {
          const isLocal = p.identity === localParticipant.identity;
          const isVideoOn = p.isCameraEnabled;
          const isAudioOn = p.isMicrophoneEnabled;
          const isPinned = layoutContext?.pin.state.some(pinned => pinned.participant.sid === p.sid);

          return (
            <div 
              key={p.sid}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
                  {p.identity?.slice(0, 2)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    {p.identity || "Anonymous"}
                    {isLocal && (
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                        You
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {isVideoOn ? "Camera Active" : "Camera Off"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePin(p)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
                    isPinned ? "text-blue-400 bg-blue-400/10 opacity-100" : "text-zinc-500 hover:bg-zinc-800"
                  )}
                  title={isPinned ? "Unpin Participant" : "Pin Participant"}
                >
                  {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                
                <button
                  onClick={() => isLocal && (p as any).setMicrophoneEnabled(!isAudioOn)}
                  disabled={!isLocal}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    isAudioOn 
                      ? "text-zinc-400 hover:bg-zinc-800" 
                      : "text-red-500 bg-red-500/10 hover:bg-red-500/20",
                    !isLocal && "cursor-default hover:bg-transparent"
                  )}
                  title={isLocal ? (isAudioOn ? "Mute Microphone" : "Unmute Microphone") : (isAudioOn ? "Microphone On" : "Microphone Off")}
                >
                  {isAudioOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => isLocal && (p as any).setCameraEnabled(!isVideoOn)}
                  disabled={!isLocal}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    isVideoOn 
                      ? "text-zinc-400 hover:bg-zinc-800" 
                      : "text-red-500 bg-red-500/10 hover:bg-red-500/20",
                    !isLocal && "cursor-default hover:bg-transparent"
                  )}
                  title={isLocal ? (isVideoOn ? "Stop Video" : "Start Video") : (isVideoOn ? "Video On" : "Video Off")}
                >
                  {isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
