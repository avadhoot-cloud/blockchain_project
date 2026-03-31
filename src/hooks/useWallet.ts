import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { connectWallet as connectWalletFn } from "@/lib/contract";

export function useWallet() {
  const [address, setAddress] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>("");

  const connect = useCallback(async () => {
    setConnecting(true);
    setError("");
    try {
      const result = await connectWalletFn();
      setAddress(result.address);
      setContract(result.contract);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress("");
    setContract(null);
  }, []);

  return {
    address,
    contract,
    connecting,
    error,
    isConnected: !!address,
    connect,
    disconnect,
  };
}
