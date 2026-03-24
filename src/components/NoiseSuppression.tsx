import React, { useState, useEffect, useCallback } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { KrispNoiseFilter } from "@livekit/krisp-noise-filter";
import { Track, LocalAudioTrack } from "livekit-client";
import { cn } from "../lib/utils";

export default function NoiseSuppression() {
  const { localParticipant } = useLocalParticipant();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<any>(null);

  const toggleNoiseSuppression = useCallback(async () => {
    if (!localParticipant) return;
    
    setIsProcessing(true);
    try {
      const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
      const micTrack = micPublication?.track as LocalAudioTrack | undefined;
      
      if (!micTrack || micTrack.kind !== "audio") {
        console.warn("No microphone track found to apply noise suppression");
        setIsProcessing(false);
        return;
      }

      if (isEnabled) {
        // Disable
        await micTrack.stopProcessor();
        setIsEnabled(false);
      } else {
        // Enable
        let currentFilter = filter;
        if (!currentFilter) {
          currentFilter = KrispNoiseFilter();
          setFilter(currentFilter);
        }
        
        await micTrack.setProcessor(currentFilter);
        setIsEnabled(true);
      }
    } catch (error) {
      console.error("Failed to toggle noise suppression:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [localParticipant, isEnabled, filter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isEnabled && localParticipant) {
        const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
        const micTrack = micPublication?.track as LocalAudioTrack | undefined;
        if (micTrack) {
          micTrack.stopProcessor();
        }
      }
    };
  }, [isEnabled, localParticipant]);

  return (
    <button
      onClick={toggleNoiseSuppression}
      disabled={isProcessing}
      className={cn(
        "p-3 rounded-xl transition-all flex items-center gap-2 group relative",
        isEnabled 
          ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
      )}
      title={isEnabled ? "Disable AI Noise Suppression" : "Enable AI Noise Suppression"}
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isEnabled ? (
        <ShieldCheck className="w-5 h-5" />
      ) : (
        <Sparkles className="w-5 h-5" />
      )}
      
      <div className="flex flex-col items-start leading-none hidden md:flex">
        <span className="text-[10px] font-bold uppercase tracking-wider">AI Noise</span>
        <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">
          {isEnabled ? "Active" : "Suppression"}
        </span>
      </div>

      {/* Status Indicator Dot */}
      {isEnabled && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-zinc-900 rounded-full animate-pulse" />
      )}
    </button>
  );
}
