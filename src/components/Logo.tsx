import React from "react";

export function Logo({ className = "h-9 w-auto", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none group">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_0_12px_rgba(var(--primary),0.2)]">
        {/* Animated glow background */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse-glow" />
        
        {/* Custom Lock Shield SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-primary relative z-10 transition-transform duration-500 group-hover:scale-110"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
          <circle cx="12" cy="16" r="1.5" className="fill-primary" />
        </svg>
      </div>
      
      {showText && (
        <span className="font-heading font-black text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent transition-all duration-300 group-hover:text-foreground">
          Safe<span className="text-primary">Escrow</span>
        </span>
      )}
    </div>
  );
}
