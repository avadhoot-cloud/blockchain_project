"use client";

import { useBlockNumber } from "wagmi";

export function TransparencyPanel() {
  const { data: blockNumber } = useBlockNumber({ watch: true });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card/90 backdrop-blur border shadow-lg rounded-xl p-4 w-72 text-sm space-y-2">
        <div className="flex items-center justify-between font-semibold">
          <span className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Hardhat Local
          </span>
          <span className="font-mono text-xs">Block: {blockNumber?.toString() || "..."}</span>
        </div>
        <p className="text-muted-foreground text-xs leading-tight">
          All financial state and role-based approvals are locked in the smart contract.
        </p>
      </div>
    </div>
  );
}
