"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletConnect } from "@/components/WalletConnect";
import contractData from "@/lib/contractData.json";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function BuyerDashboard() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [seller, setSeller] = useState("");

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Handle transaction feedback and notifications
  useEffect(() => {
    if (isPending) {
      toast.loading("Awaiting wallet confirmation...", { id: "tx-status" });
    }
  }, [isPending]);

  useEffect(() => {
    if (hash) {
      toast.loading("Transaction submitted! Mining block...", { id: "tx-status" });
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Project created & Escrow locked successfully!", { id: "tx-status", duration: 5000 });
      setTitle("");
      setDescription("");
      setBudget("");
      setSeller("");
      
      // Delay redirection so the user can see the success message
      const timer = setTimeout(() => {
        router.push("/");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, router]);

  useEffect(() => {
    const err = writeError || confirmError;
    if (err) {
      console.error(err);
      toast.error(err.message || "Transaction failed or was rejected", { id: "tx-status", duration: 5000 });
    }
  }, [writeError, confirmError]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget || !seller) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const trimmedSeller = seller.trim();
    const cleanSeller = trimmedSeller.startsWith("0x") ? trimmedSeller : `0x${trimmedSeller}`;

    // 1. Detect if the user pasted a private key by checking the hexadecimal length
    // A 32-byte private key is 64 hex characters (66 with '0x')
    if (trimmedSeller.length === 64 || trimmedSeller.length === 66) {
      if (/^(0x)?[0-9a-fA-F]{64}$/.test(trimmedSeller)) {
        toast.error(
          "Private Key Detected! Please use the Seller's PUBLIC Ethereum address (e.g. 0x7099... from Hardhat Account #1) instead of their private key.",
          { id: "tx-status", duration: 6000 }
        );
        return;
      }
    }

    // 2. Validate standard Ethereum address format
    if (!isAddress(cleanSeller)) {
      toast.error(
        "Invalid Seller Address format. Please paste a valid 20-byte public address starting with '0x'!",
        { id: "tx-status", duration: 5000 }
      );
      return;
    }

    // 3. Prevent assigning oneself as the seller
    if (address && cleanSeller.toLowerCase() === address.toLowerCase()) {
      toast.error("You cannot assign yourself (the Buyer) as the Seller!", { id: "tx-status" });
      return;
    }

    // 4. Validate budget
    const budgetVal = parseFloat(budget);
    if (isNaN(budgetVal) || budgetVal <= 0) {
      toast.error("Please enter a valid positive number for the budget in ETH.", { id: "tx-status" });
      return;
    }

    try {
      toast.loading("Saving project parameters off-chain...", { id: "tx-status" });
      
      // Save off-chain to DB
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, 
          description, 
          budget, 
          buyerAddress: address, 
          sellerAddress: cleanSeller
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save project parameters database side.");
      }

      const dbProject = await res.json();
      toast.loading("Project indexed! Please sign the smart contract in your wallet...", { id: "tx-status" });
      
      // Lock funds on-chain
      writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "createProject",
        args: [`ipfs://mock-hash-for-${dbProject.id}`, cleanSeller as `0x${string}`],
        value: parseEther(budget)
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.", { id: "tx-status" });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
        <WalletConnect />
      </div>

      {!isConnected ? (
        <div className="text-center p-12 border rounded-xl bg-surface-2 text-muted-foreground">
          Please connect your wallet to create a project.
        </div>
      ) : (
        <form onSubmit={handleCreateProject} className="space-y-6 border p-6 rounded-xl bg-card">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Create New Project & Lock Escrow</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
              Contract: {contractData.address.slice(0, 6)}...{contractData.address.slice(-4)}
            </span>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              className="w-full p-3 rounded-md border bg-background" 
              rows={4}
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget (ETH)</label>
              <Input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Seller (Address)</label>
              <Input value={seller} onChange={e => setSeller(e.target.value)} placeholder="0x..." required />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending || isConfirming}>
            {isPending ? "Confirming in Wallet..." : isConfirming ? "Mining Transaction..." : "Lock Funds On-Chain"}
          </Button>

          {isConfirmed && (
            <div className="p-4 bg-green-500/10 text-green-500 rounded-md text-sm mt-4">
              Project created and funds locked successfully! <br/>
              Tx Hash: {hash}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
