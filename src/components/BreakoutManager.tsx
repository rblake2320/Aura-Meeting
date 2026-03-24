import React, { useState, useCallback } from "react";
import { Users, Plus, Play, Square, UserPlus, X } from "lucide-react";
import { useParticipants, useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind } from "livekit-client";
import { cn } from "../lib/utils";

interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[]; // identities
}

interface BreakoutManagerProps {
  isStarted: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export default function BreakoutManager({ isStarted, onStart, onEnd }: BreakoutManagerProps) {
  const [rooms, setRooms] = useState<BreakoutRoom[]>([
    { id: "1", name: "Breakout 1", participants: [] },
    { id: "2", name: "Breakout 2", participants: [] },
  ]);
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const addRoom = () => {
    const newId = (rooms.length + 1).toString();
    setRooms([...rooms, { id: newId, name: `Breakout ${newId}`, participants: [] }]);
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const assignParticipant = (roomId: string, identity: string) => {
    setRooms(rooms.map(room => {
      const otherParticipants = room.participants.filter(p => p !== identity);
      if (room.id === roomId) {
        return { ...room, participants: [...otherParticipants, identity] };
      }
      return { ...room, participants: otherParticipants };
    }));
  };

  const unassignParticipant = (identity: string) => {
    setRooms(rooms.map(room => ({
      ...room,
      participants: room.participants.filter(p => p !== identity)
    })));
  };

  const startBreakout = useCallback(async () => {
    const assignments: Record<string, string> = {};
    rooms.forEach(r => {
      r.participants.forEach(p => {
        assignments[p] = `${room.name}-${r.name.replace(/\s+/g, "-").toLowerCase()}`;
      });
    });

    const payload = JSON.stringify({
      type: "BREAKOUT_START",
      assignments
    });

    const encoder = new TextEncoder();
    await localParticipant.publishData(encoder.encode(payload), {
      reliable: true
    });

    onStart();
  }, [rooms, localParticipant, room.name, onStart]);

  const endBreakout = useCallback(async () => {
    const payload = JSON.stringify({
      type: "BREAKOUT_END"
    });

    const encoder = new TextEncoder();
    await localParticipant.publishData(encoder.encode(payload), {
      reliable: true
    });

    onEnd();
  }, [localParticipant, onEnd]);

  const allRemoteParticipants = participants.filter(p => p.identity !== localParticipant.identity);
  const unassignedParticipants = allRemoteParticipants.filter(p => !rooms.some(r => r.participants.includes(p.identity)));

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="p-5 border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wider">Breakout Rooms</h3>
          </div>
          {!isStarted && (
            <button 
              onClick={addRoom}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 font-medium">Divide participants into smaller groups</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {/* Rooms List */}
        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{room.name}</span>
                {!isStarted && (
                  <button 
                    onClick={() => removeRoom(room.id)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Assigned Participants */}
              <div className="flex flex-wrap gap-2">
                {room.participants.map(identity => (
                  <div key={identity} className="flex items-center gap-2 px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg group">
                    <span className="text-[10px] text-zinc-400">{identity}</span>
                    {!isStarted && (
                      <button 
                        onClick={() => unassignParticipant(identity)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-zinc-600 hover:text-zinc-300" />
                      </button>
                    )}
                  </div>
                ))}
                {!isStarted && unassignedParticipants.length > 0 && (
                  <div className="relative group/add">
                    <button className="p-1 bg-zinc-800/30 border border-zinc-700/30 border-dashed rounded-lg text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-all">
                      <UserPlus className="w-3 h-3" />
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover/add:opacity-100 group-hover/add:visible transition-all z-50 p-2">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest p-2 border-b border-zinc-800 mb-1">Assign Participant</p>
                      {unassignedParticipants.map(p => (
                        <button
                          key={p.identity}
                          onClick={() => assignParticipant(room.id, p.identity)}
                          className="w-full text-left px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {p.identity}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Unassigned Participants */}
        {!isStarted && unassignedParticipants.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unassigned ({unassignedParticipants.length})</span>
            <div className="flex flex-wrap gap-2">
              {unassignedParticipants.map(p => (
                <div key={p.identity} className="px-2 py-1 bg-zinc-900/20 border border-zinc-800/50 rounded-lg text-[10px] text-zinc-500">
                  {p.identity}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-zinc-800/50 bg-zinc-900/30">
        {isStarted ? (
          <button
            onClick={endBreakout}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98]"
          >
            <Square className="w-4 h-4" />
            End Breakout Rooms
          </button>
        ) : (
          <button
            onClick={startBreakout}
            disabled={rooms.every(r => r.participants.length === 0)}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-[0.98]"
          >
            <Play className="w-4 h-4" />
            Start Breakout Rooms
          </button>
        )}
      </div>
    </div>
  );
}
