import React, { useCallback } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Monitor, MonitorOff } from "lucide-react";
import { cn } from "../lib/utils";

export default function ScreenShareControl() {
  const { localParticipant } = useLocalParticipant();
  const isScreenShareEnabled = localParticipant.isScreenShareEnabled;

  const toggleScreenShare = useCallback(async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
    }
  }, [localParticipant, isScreenShareEnabled]);

  return (
    <button
      onClick={toggleScreenShare}
      className={cn(
        "p-3 rounded-xl transition-all flex items-center gap-2 group relative",
        isScreenShareEnabled 
          ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
      )}
      title={isScreenShareEnabled ? "Stop Screen Share" : "Start Screen Share"}
    >
      {isScreenShareEnabled ? (
        <MonitorOff className="w-5 h-5" />
      ) : (
        <Monitor className="w-5 h-5" />
      )}
      
      <div className="flex flex-col items-start leading-none hidden md:flex text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider">Screen</span>
        <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">
          {isScreenShareEnabled ? "Sharing" : "Share"}
        </span>
      </div>

      {/* Status Indicator Dot */}
      {isScreenShareEnabled && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 border-2 border-zinc-900 rounded-full animate-pulse" />
      )}
    </button>
  );
}
