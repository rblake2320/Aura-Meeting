import React, { useCallback } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { cn } from "../lib/utils";
import ScreenShareControl from "./ScreenShareControl";

export default function MediaControls() {
  const { localParticipant } = useLocalParticipant();
  const isVideoEnabled = localParticipant.isCameraEnabled;
  const isAudioEnabled = localParticipant.isMicrophoneEnabled;

  const toggleVideo = useCallback(async () => {
    try {
      await localParticipant.setCameraEnabled(!isVideoEnabled);
    } catch (error) {
      console.error("Failed to toggle video:", error);
    }
  }, [localParticipant, isVideoEnabled]);

  const toggleAudio = useCallback(async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isAudioEnabled);
    } catch (error) {
      console.error("Failed to toggle audio:", error);
    }
  }, [localParticipant, isAudioEnabled]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleAudio}
        className={cn(
          "p-3 rounded-xl transition-all flex items-center gap-2 group",
          isAudioEnabled 
            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" 
            : "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30"
        )}
        title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
      >
        {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
          {isAudioEnabled ? "Mute" : "Unmute"}
        </span>
      </button>

      <button
        onClick={toggleVideo}
        className={cn(
          "p-3 rounded-xl transition-all flex items-center gap-2 group",
          isVideoEnabled 
            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" 
            : "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30"
        )}
        title={isVideoEnabled ? "Stop Camera" : "Start Camera"}
      >
        {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
          {isVideoEnabled ? "Stop" : "Start"}
        </span>
      </button>

      <ScreenShareControl />
    </div>
  );
}
