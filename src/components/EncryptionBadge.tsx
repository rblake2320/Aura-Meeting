import React from "react";
import { ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import { cn } from "../lib/utils";

interface EncryptionBadgeProps {
  isSecure: boolean;
}

export default function EncryptionBadge({ isSecure }: EncryptionBadgeProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
      isSecure 
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
        : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
    )}>
      {isSecure ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold uppercase tracking-widest">E2EE Active</span>
            <span className="text-[8px] opacity-60 font-medium uppercase tracking-tighter">End-to-End Encrypted</span>
          </div>
        </>
      ) : (
        <>
          <ShieldAlert className="w-3.5 h-3.5" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold uppercase tracking-widest">Standard Mode</span>
            <span className="text-[8px] opacity-60 font-medium uppercase tracking-tighter">Not E2EE</span>
          </div>
        </>
      )}
    </div>
  );
}
