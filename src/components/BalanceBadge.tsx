"use client";

import { useAccount, useBalance } from "wagmi";
import { useEffect, useState } from "react";
import { Coins, Loader2 } from "lucide-react";
import { formatUnits } from "viem";

export function BalanceBadge() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: balanceData, isLoading, isError } = useBalance({
    address,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected || !address) {
    return null;
  }

  let balanceDisplay = "";
  if (isLoading) {
    balanceDisplay = "Loading...";
  } else if (isError) {
    balanceDisplay = "Error";
  } else if (balanceData) {
    const formatted = formatUnits(balanceData.value, balanceData.decimals);
    const parsed = parseFloat(formatted);
    balanceDisplay = `${parsed.toFixed(4)} ${balanceData.symbol}`;
  }

  return (
    <div className="flex items-center gap-2 border bg-surface-2 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono text-primary animate-in fade-in duration-300">
      <Coins className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
      <span className="text-muted-foreground font-sans font-medium">Balance:</span>
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin text-primary" />
      ) : (
        <span className="text-foreground font-bold">{balanceDisplay}</span>
      )}
    </div>
  );
}
