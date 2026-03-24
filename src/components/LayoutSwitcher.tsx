import React from "react";
import { LayoutGrid, UserSquare2, Maximize2 } from "lucide-react";
import { cn } from "../lib/utils";

export type VideoLayout = "grid" | "speaker" | "focus";

interface LayoutSwitcherProps {
  currentLayout: VideoLayout;
  onLayoutChange: (layout: VideoLayout) => void;
}

export default function LayoutSwitcher({ currentLayout, onLayoutChange }: LayoutSwitcherProps) {
  const layouts: { id: VideoLayout; icon: any; label: string }[] = [
    { id: "grid", icon: LayoutGrid, label: "Grid View" },
    { id: "speaker", icon: UserSquare2, label: "Speaker View" },
    { id: "focus", icon: Maximize2, label: "Focus View" },
  ];

  return (
    <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/50">
      {layouts.map((layout) => {
        const Icon = layout.icon;
        const isActive = currentLayout === layout.id;
        
        return (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout.id)}
            className={cn(
              "p-2 rounded-lg transition-all flex items-center gap-2 group",
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
            title={layout.label}
          >
            <Icon className="w-4 h-4" />
            {isActive && (
              <span className="text-[10px] font-bold uppercase tracking-wider pr-1">
                {layout.id}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
