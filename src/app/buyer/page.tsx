"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletConnect } from "@/components/WalletConnect";
import { Logo } from "@/components/Logo";
import { HistoryTable } from "@/components/HistoryTable";
import { useAuth } from "@/hooks/useAuth";
import contractData from "@/lib/contractData.json";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, ToggleLeft, ToggleRight, LogOut, Loader2, Sparkles } from "lucide-react";
import { BalanceBadge } from "@/components/BalanceBadge";


interface RegisteredSeller {
  id: number;
  username: string;
  walletAddress: string;
}

export default function BuyerDashboard() {
  const { isConnected, address } = useAccount();
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  
  // Seller Selection State
  const [sellers, setSellers] = useState<RegisteredSeller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [customSellerAddress, setCustomSellerAddress] = useState("");
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // 1. Redirect to Auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // 2. Fetch registered sellers from DB
  useEffect(() => {
    if (user) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSellers(data);
          }
        })
        .catch((err) => console.error("Failed to load registered sellers:", err));
    }
  }, [user]);

  // 3. Handle transaction feedback
  useEffect(() => {
    if (isPending) {
      toast.loading("Awaiting wallet signature confirmation...", { id: "tx-status" });
    }
  }, [isPending]);

  useEffect(() => {
    if (hash) {
      toast.loading("Transaction submitted! Mining block on local node...", { id: "tx-status" });
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Project created & Escrow funds locked successfully!", { id: "tx-status", duration: 5000 });
      
      // Update status to ACTIVE and save transaction hash in the DB
      if (createdProjectId) {
        fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: createdProjectId, status: "ACTIVE" })
        }).then(() => {
          setCreatedProjectId(null);
          // Reload page or force history update
          window.location.reload();
        }).catch((err) => console.error("Failed to activate project status in DB:", err));
      }

      setTitle("");
      setDescription("");
      setBudget("");
      setSelectedSeller("");
      setCustomSellerAddress("");
    }
  }, [isConfirmed, createdProjectId]);

  useEffect(() => {
    const err = writeError || confirmError;
    if (err) {
      console.error(err);
      toast.error(err.message || "Transaction failed or was rejected", { id: "tx-status", duration: 5000 });

      // Clean up the pre-allocated DB project since the blockchain transaction failed or was rejected
      if (createdProjectId) {
        fetch(`/api/projects?id=${createdProjectId}`, {
          method: "DELETE"
        }).then(() => {
          setCreatedProjectId(null);
        }).catch((err) => console.error("Failed to clean up pending project:", err));
      }
    }
  }, [writeError, confirmError, createdProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Choose active seller address
    const activeSeller = useManualAddress ? customSellerAddress : selectedSeller;

    if (!title || !description || !budget || !activeSeller) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const trimmedSeller = activeSeller.trim();
    const cleanSeller = trimmedSeller.startsWith("0x") ? trimmedSeller : `0x${trimmedSeller}`;

    // Validate standard Ethereum address format
    if (!isAddress(cleanSeller)) {
      toast.error(
        "Invalid Seller Address format. Please paste a valid 20-byte public address starting with '0x'!",
        { id: "tx-status", duration: 5000 }
      );
      return;
    }

    // Prevent assigning oneself as the seller
    if (address && cleanSeller.toLowerCase() === address.toLowerCase()) {
      toast.error("You cannot assign yourself (the Buyer) as the Seller!", { id: "tx-status" });
      return;
    }

    // Validate budget
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
          budget: budgetVal, 
          buyerAddress: address, 
          sellerAddress: cleanSeller
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save project parameters database side.");
      }

      const dbProject = await res.json();
      toast.loading("Project indexed! Please sign the smart contract in your wallet...", { id: "tx-status" });
      
      // Set the project ID state before prompt signature
      setCreatedProjectId(dbProject.id);

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

  const filteredSellers = sellers.filter((s) =>
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Premium Branded Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo showText={true} />
          
          <div className="flex items-center gap-4">
            {/* User Session Info */}
            <div className="flex items-center gap-2 border bg-surface-2 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Buyer:</span>
              <span className="text-muted-foreground font-bold">{user.username}</span>
            </div>
            
            <BalanceBadge />
            
            <WalletConnect />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-status-rejected hover:text-status-rejected/80 hover:bg-status-rejected/10 gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="container mx-auto p-6 md:p-8 max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Create Project Panel (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCreateProject} className="space-y-6 border p-6 rounded-2xl bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10" />
            
            <div className="space-y-1">
              <h2 className="text-xl font-black flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                Initialize Escrow
              </h2>
              <p className="text-xs text-muted-foreground">
                Set up off-chain parameters and lock escrow funds in the smart contract.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Title</label>
              <Input
                placeholder="e.g. Next.js Website Development"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="bg-background focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea 
                className="w-full p-3 rounded-md border bg-background text-sm focus-visible:ring-primary border-input focus:outline-none focus:ring-1 focus:ring-primary" 
                placeholder="Explain deliverables, timeline, and expectations..."
                rows={4}
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget (ETH)</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.05"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  required
                  className="bg-background focus-visible:ring-primary font-mono"
                />
              </div>

              {/* Toggle Manual / Dropdown Seller input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seller Assignee</label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualAddress(!useManualAddress);
                      setSelectedSeller("");
                      setCustomSellerAddress("");
                    }}
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    {useManualAddress ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {useManualAddress ? "Select Registered" : "Enter Manual ID"}
                  </button>
                </div>

                {useManualAddress ? (
                  <Input
                    placeholder="0x7099... (Public Address)"
                    value={customSellerAddress}
                    onChange={(e) => setCustomSellerAddress(e.target.value)}
                    required
                    className="bg-background focus-visible:ring-primary font-mono text-xs"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={selectedSeller}
                      onChange={(e) => setSelectedSeller(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary border-input"
                    >
                      <option value="">-- Choose Registered Seller --</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.walletAddress}>
                          {s.username} ({s.walletAddress.slice(0, 6)}...{s.walletAddress.slice(-4)})
                        </option>
                      ))}
                    </select>
                    {sellers.length === 0 && (
                      <p className="text-[10px] text-status-pending mt-1 italic font-medium">
                        No registered sellers found. Use "Enter Manual ID" instead.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90 text-primary-fg"
              disabled={isPending || isConfirming || !isConnected}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming in Wallet...</span>
                </div>
              ) : isConfirming ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mining Block On-Chain...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Lock Funds & Lock Contract</span>
                </div>
              )}
            </Button>

            {!isConnected && (
              <p className="text-[10px] text-center text-status-rejected font-medium italic leading-relaxed mt-2">
                * Please connect your MetaMask Web3 wallet to execute on-chain escrow locks.
              </p>
            )}
          </form>
        </div>

        {/* Real-time Reconciled History Panel (Right) */}
        <div className="lg:col-span-7 space-y-6">
          <HistoryTable />
        </div>
      </main>
    </div>
  );
}
