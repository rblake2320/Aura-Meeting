import React, { useMemo } from "react";
import { 
  GridLayout, 
  ParticipantTile, 
  useTracks, 
  useLayoutContext,
  CarouselLayout, 
  useParticipants,
  useLocalParticipant,
  TrackReferenceOrPlaceholder,
  isTrackReference
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { VideoLayout } from "./LayoutSwitcher";
import { cn } from "../lib/utils";

interface CustomConferenceProps {
  layout: VideoLayout;
}

export default function CustomConference({ layout }: CustomConferenceProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const layoutContext = useLayoutContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  // Determine the focused track (pinned or active speaker or screen share)
  const focusedTrack = useMemo(() => {
    // 1. Check for pinned track
    if (layoutContext?.pin.state[0]) {
      return layoutContext.pin.state[0];
    }
    
    // 2. Check for screen share
    const screenShare = tracks.find(t => t.source === Track.Source.ScreenShare);
    if (screenShare) {
      return screenShare;
    }

    // 3. Check for active speaker
    const speaker = tracks.find(t => t.participant.isSpeaking);
    if (speaker) {
      return speaker;
    }

    // 4. Default to first track (usually local or first remote)
    return tracks[0];
  }, [tracks, layoutContext?.pin.state]);

  if (layout === "grid") {
    return (
      <div className="h-full w-full p-4 bg-black overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0">
          <GridLayout tracks={tracks}>
            <ParticipantTile />
          </GridLayout>
        </div>
      </div>
    );
  }

  if (layout === "focus") {
    return (
      <div className="h-full w-full p-8 bg-black flex items-center justify-center overflow-hidden">
        {focusedTrack ? (
          <div className="w-full h-full max-w-7xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800/50 relative group">
            <ParticipantTile trackRef={focusedTrack} />
            <div className="absolute top-6 left-6 px-4 py-2 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                Focused: {focusedTrack.participant.identity}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin" />
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Waiting for video...</span>
          </div>
        )}
      </div>
    );
  }

  // Speaker Dominant (Default)
  const otherTracks = tracks.filter(t => {
    if (!focusedTrack) return true;
    // If focusedTrack is a placeholder, we might need to handle it differently
    return t.participant.sid !== focusedTrack.participant.sid || t.source !== focusedTrack.source;
  });

  return (
    <div className="h-full w-full flex flex-col bg-black p-4 gap-4 overflow-hidden">
      {focusedTrack ? (
        <div className="flex-1 min-h-0 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800/50 relative group">
          <ParticipantTile trackRef={focusedTrack} />
          <div className="absolute top-6 left-6 px-4 py-2 bg-blue-600/90 backdrop-blur-xl rounded-2xl text-[10px] font-bold text-white uppercase tracking-[0.2em] shadow-xl border border-blue-400/30">
            {focusedTrack.source === Track.Source.ScreenShare ? "Screen Sharing" : "Active Speaker"}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-zinc-900/20 rounded-3xl border border-zinc-800/50">
           <span className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No active speaker</span>
        </div>
      )}
      
      {/* Carousel of other participants */}
      {otherTracks.length > 0 && (
        <div className="h-[160px] shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CarouselLayout tracks={otherTracks}>
            <ParticipantTile />
          </CarouselLayout>
        </div>
      )}
    </div>
  );
}
