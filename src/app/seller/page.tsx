"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletConnect } from "@/components/WalletConnect";
import { Logo } from "@/components/Logo";
import { HistoryTable } from "@/components/HistoryTable";
import { useAuth } from "@/hooks/useAuth";
import contractData from "@/lib/contractData.json";
import { Project } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileCheck, Sparkles, Loader2, LogOut, AlertTriangle } from "lucide-react";
import { BalanceBadge } from "@/components/BalanceBadge";


export default function SellerDashboard() {
  const { isConnected, address } = useAccount();
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // 1. Guard route - redirect to /auth if session missing
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // 2. Fetch projects assigned to seller
  const loadProjects = () => {
    if (address) {
      fetch("/api/projects")
        .then(res => res.json())
        .then((data: Project[]) => {
          // Only show active on-chain projects assigned to this seller
          setProjects(data.filter(p => p.sellerAddress?.toLowerCase() === address.toLowerCase() && p.status !== "CREATED"));
        })
        .catch((err) => {
          console.error("Failed to load projects:", err);
        });
    }
  };

  useEffect(() => {
    if (user && address) {
      loadProjects();
    }
  }, [user, address]);

  // 3. Handle transaction notifications
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
      toast.success("Work evidence successfully recorded on the blockchain!", { id: "tx-status", duration: 5000 });
      
      // Update status to IN_REVIEW in the DB
      if (selectedProjectId) {
        fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: selectedProjectId, 
            status: "IN_REVIEW",
            githubUrl: evidenceUrl
          })
        }).then(() => {
          setEvidenceUrl("");
          setSelectedProjectId(null);
          loadProjects(); // Reload projects list
          // Force a soft page refresh to update history table
          window.location.reload();
        }).catch((err) => console.error("Failed to update project status in DB:", err));
      } else {
        setEvidenceUrl("");
        setSelectedProjectId(null);
        loadProjects(); // Reload projects list
      }
    }
  }, [isConfirmed, selectedProjectId]);

  useEffect(() => {
    const err = writeError || confirmError;
    if (err) {
      console.error(err);
      toast.error(err.message || "Transaction failed or was rejected", { id: "tx-status", duration: 5000 });
    }
  }, [writeError, confirmError]);

  const handleSubmitWork = (projectId: number) => {
    if (!evidenceUrl) {
      toast.error("Please enter a valid work evidence URL or IPFS hash.");
      return;
    }
    
    try {
      toast.loading("Initiating contract evidence submission...", { id: "tx-status" });
      setSelectedProjectId(projectId);

      writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "submitWork",
        args: [BigInt(projectId), evidenceUrl],
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.", { id: "tx-status" });
    }
  };

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
              <span>Seller:</span>
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
        {/* Active Deliverables (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border p-6 rounded-2xl bg-card relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10" />
            
            <div className="space-y-1">
              <h2 className="text-xl font-black flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Submit Deliverables
              </h2>
              <p className="text-xs text-muted-foreground">
                Provide proof of completed work to buyer. Deliverables will be permanently anchored to the escrow smart contract.
              </p>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 border rounded-xl text-center text-muted-foreground text-xs italic bg-surface-2/30">
                No active escrow projects currently assigned to your connected wallet.
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map(p => (
                  <div key={p.id} className="border p-4 rounded-xl bg-surface-2/40 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-primary">{p.budget} ETH</div>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider mt-1">{p.status}</div>
                      </div>
                    </div>

                    {/* Render Rejection Feedback and Strikes */}
                    {(p as any).rejectionCount > 0 && (
                      <div className="p-3 rounded-lg border border-status-rejected/20 bg-status-rejected/5 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-status-rejected font-semibold">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Work Rejected (Strike {(p as any).rejectionCount}/3)</span>
                          </span>
                          {(p as any).rejectionCount >= 4 && (
                            <span className="bg-red-500 text-white font-sans text-[10px] font-bold px-1.5 py-0.5 rounded uppercase animate-pulse">
                              Disputed
                            </span>
                          )}
                        </div>
                        {(p as any).rejectionFeedback && (
                          <div className="text-muted-foreground font-mono text-[11px] leading-relaxed">
                            <span className="font-bold text-foreground">Buyer Feedback:</span> "{(p as any).rejectionFeedback}"
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Work Evidence (GitHub Repo or IPFS Hash)
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://github.com/username/project" 
                          value={selectedProjectId === p.id ? evidenceUrl : ""} 
                          onChange={e => {
                            setSelectedProjectId(p.id);
                            setEvidenceUrl(e.target.value);
                          }} 
                          className="bg-background border-border text-xs focus-visible:ring-primary"
                        />
                        <Button 
                          disabled={selectedProjectId !== p.id || isPending || isConfirming || !evidenceUrl}
                          onClick={() => handleSubmitWork(p.id)}
                          size="sm"
                          className="text-xs font-bold shrink-0"
                        >
                          {selectedProjectId === p.id && isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                          )}
                          Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Reconciled History Panel (Right) */}
        <div className="lg:col-span-7 space-y-6">
          <HistoryTable />
        </div>
      </main>
    </div>
  );
}
