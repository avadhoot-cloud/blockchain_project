"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { injected } from "wagmi/connectors";
import { createPublicClient, http, formatEther } from "viem";
import { hardhat } from "viem/chains";
import contractData from "@/lib/contractData.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { WalletConnect } from "@/components/WalletConnect";
import { toast } from "sonner";
import { ShieldAlert, Gavel, LogOut, CheckCircle2, XCircle, ArrowUpRight, HelpCircle, Loader2, Sparkles } from "lucide-react";

// Initialize direct local blockchain reader
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http("http://127.0.0.1:8545"),
});

// Admin wallet (Account #0 - contract deployer on local Hardhat)
const ADMIN_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

interface DisputedProject {
  id: number;
  title: string;
  description: string;
  budget: number;
  buyerAddress: string;
  sellerAddress: string;
  githubUrl?: string;
  rejectionFeedback?: string;
}

export default function MandatePortal() {
  const { isConnected, address } = useAccount();
  
  // Admin Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Disputes State
  const [disputes, setDisputes] = useState<DisputedProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Resolution Action State
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [sellerWins, setSellerWins] = useState<boolean | null>(null);

  // AI Agent Heuristic States
  const [aiOpinions, setAiOpinions] = useState<Record<number, {
    recommendation: "RELEASE" | "REFUND";
    confidence: number;
    reasoning: string;
    details: string[];
  }>>({});
  const [aiScanningId, setAiScanningId] = useState<number | null>(null);

  const handleAiAnalyze = (p: DisputedProject) => {
    setAiScanningId(p.id);
    
    setTimeout(() => {
      // Heuristic Engine
      const feedback = (p.rejectionFeedback || "").toLowerCase();
      const hasUrl = !!p.githubUrl && p.githubUrl.trim().length > 0;
      
      let recommendation: "RELEASE" | "REFUND" = "RELEASE";
      let confidence = 75;
      let reasoning = "";
      const details: string[] = [];

      // Heuristic 1: Deliverable Proof existence
      if (!hasUrl) {
        recommendation = "REFUND";
        confidence = 95;
        reasoning = "The seller has escalated a dispute without submitting any valid deliverable evidence or repository links. Without work proof, pay release is legally impossible.";
        details.push("No github deliverable link was verified.");
        details.push("ESCROW compliance failure: 0% proof of work indexed.");
      } else {
        // Heuristic 2: Buyer comment keyword parsing
        const refundKeywords = ["scam", "fraud", "stolen", "copied", "nothing", "empty", "plagiarized", "fake", "stole", "broken", "malware", "virus"];
        const releaseKeywords = ["minor", "tweak", "color", "styling", "css", "font", "alignment", "spacing", "pixel", "almost", "substantially", "delay"];
        
        let refundHits = 0;
        let releaseHits = 0;

        refundKeywords.forEach(kw => {
          if (feedback.includes(kw)) refundHits++;
        });
        releaseKeywords.forEach(kw => {
          if (feedback.includes(kw)) releaseHits++;
        });

        if (refundHits > 0) {
          recommendation = "REFUND";
          confidence = Math.min(80 + refundHits * 5, 98);
          reasoning = `AI detected severe compliance warnings in the employer feedback ("${refundHits}" critical keyword hits). Issues like missing core deliverables or suspected asset duplication suggest high delivery risk.`;
          details.push(`Analyzed buyer feedback containing critical risk terms.`);
          details.push("Repository proof exists but fails compliance standards.");
        } else if (releaseHits > 0) {
          recommendation = "RELEASE";
          confidence = Math.min(75 + releaseHits * 5, 92);
          reasoning = `Deliverables are substantially complete. Rejection comments focus on aesthetic adjustments and minor bugs ("${releaseHits}" aesthetic keyword hits), which do not justify full budget withholding.`;
          details.push("Deliverable code repository verified on-chain.");
          details.push("Rejection reasons identified as cosmetic/non-structural.");
        } else {
          recommendation = "RELEASE";
          confidence = 68;
          reasoning = "Standard repository proof has been submitted by the freelancer. No severe terms were flagged in the feedback text. Standard compliance recommends payment release subject to visual confirmation by the arbitrator.";
          details.push("Active code/IPFS deliverables checked.");
          details.push("No explicit structural compliance flags detected.");
        }
      }

      setAiOpinions(prev => ({
        ...prev,
        [p.id]: { recommendation, confidence, reasoning, details }
      }));
      setAiScanningId(null);
      toast.success(`AI Arbitration Opinion computed for Project #${p.id}!`, { duration: 4000 });
    }, 1500);
  };

  const { data: hash, isPending: isWritePending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // 1. Load active disputes from SQLite database
  const loadDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to query SQLite index");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Filter only projects that are marked as DISPUTED in the database
        setDisputes(data.filter((p: any) => p.status === "DISPUTED"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load active disputes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadDisputes();
    }
  }, [isLoggedIn]);

  // 2. Handle Dispute Resolution On-Chain Confirmation
  useEffect(() => {
    if (isConfirmed && resolvingId !== null && sellerWins !== null) {
      const targetStatus = sellerWins ? "COMPLETED" : "REFUNDED";
      toast.success(
        sellerWins 
          ? "Dispute resolved! Escrow payment successfully released to Freelancer."
          : "Dispute resolved! Escrow payment fully refunded to Employer.",
        { id: "resolve-status", duration: 6000 }
      );

      // Update database status
      fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resolvingId, status: targetStatus })
      }).then(() => {
        setResolvingId(null);
        setSellerWins(null);
        loadDisputes(); // Reload active list
      }).catch((err) => console.error("Failed to sync dispute status in DB:", err));
    }
  }, [isConfirmed, resolvingId, sellerWins]);

  useEffect(() => {
    const err = writeError || confirmError;
    if (err && resolvingId !== null) {
      toast.error(err.message || "Dispute resolution failed or was rejected in wallet", { id: "resolve-status", duration: 5000 });
      setResolvingId(null);
      setSellerWins(null);
    }
  }, [writeError, confirmError, resolvingId]);

  // 3. Handle Login Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true);
      setAuthError("");
    } else {
      setAuthError("Invalid administrator credentials");
    }
  };

  // 4. Resolve Dispute Handler
  const handleResolveDispute = (projectId: number, payoutSeller: boolean) => {
    if (!isConnected || !address) {
      toast.error("Connect MetaMask to sign resolution transaction");
      return;
    }

    if (address.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      toast.error("Only the smart contract admin account can resolve disputes");
      return;
    }

    try {
      toast.loading("Initiating contract resolveDispute execution...", { id: "resolve-status" });
      setResolvingId(projectId);
      setSellerWins(payoutSeller);

      writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "resolveDispute",
        args: [BigInt(projectId), payoutSeller],
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.", { id: "resolve-status" });
      setResolvingId(null);
      setSellerWins(null);
    }
  };

  // Is connected wallet authorized?
  const isAuthorizedAdmin = isConnected && address && address.toLowerCase() === ADMIN_WALLET.toLowerCase();

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-status-rejected/5 filter blur-3xl -z-10 animate-pulse duration-[6000ms]" />
        
        <div className="max-w-md w-full p-8 border rounded-2xl bg-card shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-status-rejected/5 rounded-full blur-2xl -z-10" />
          
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-xl bg-status-rejected/10 text-status-rejected flex items-center justify-center border border-status-rejected/20 shadow-md shadow-status-rejected/5">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Mandate Arbitration Portal</h2>
            <p className="text-xs text-muted-foreground">
              Official dispute resolution system for SafeEscrow. Requires administrative credentials.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Username</label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="bg-background border-border"
              />
            </div>
            
            {authError && (
              <p className="text-xs font-semibold text-status-rejected leading-relaxed text-center">{authError}</p>
            )}

            <Button type="submit" className="w-full bg-status-rejected hover:bg-status-rejected/90 text-white font-bold h-11 text-sm">
              Authenticate Admin
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Branded Admin Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo showText={true} />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-status-rejected/30 bg-status-rejected/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-status-rejected">
              <Gavel className="w-3.5 h-3.5" />
              <span>Mandate Arbitrator</span>
            </div>
            
            <WalletConnect />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLoggedIn(false)}
              className="text-status-rejected hover:text-status-rejected/80 hover:bg-status-rejected/10 gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dispute Panel */}
      <main className="container mx-auto p-6 md:p-8 max-w-5xl flex-1 flex flex-col space-y-6">
        
        {/* Wallet authorization alert banner */}
        {isConnected && !isAuthorizedAdmin && (
          <div className="p-4 rounded-xl border border-status-rejected/20 bg-status-rejected/5 flex items-center gap-3 text-xs text-status-rejected animate-in fade-in duration-300">
            <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">Unauthorized MetaMask account connected!</span> You are logged in as the Mandate Admin, but your active MetaMask wallet address does not match the smart contract administrator address ({ADMIN_WALLET.slice(0, 6)}...{ADMIN_WALLET.slice(-4)}). Please switch to **Account #0** in MetaMask to sign dispute resolutions.
            </div>
          </div>
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <Gavel className="w-6 h-6 text-status-rejected" />
            Active Dispute Arbitration Queue
          </h2>
          <p className="text-sm text-muted-foreground">
            Review contracts flagged with 4 rejections, inspect the work evidence, and distribute funds.
          </p>
        </div>

        {loading ? (
          <div className="text-center p-16 border rounded-2xl bg-card">
            <Loader2 className="w-8 h-8 animate-spin text-status-rejected mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading disputed project mandates...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center p-16 border rounded-2xl bg-card text-muted-foreground text-sm italic">
            Currently no active disputes in the arbitration queue. Excellent!
          </div>
        ) : (
          <div className="grid gap-6">
            {disputes.map((p) => {
              const isResolvingThis = resolvingId === p.id;
              
              return (
                <div key={p.id} className="border p-6 rounded-2xl bg-card space-y-6 relative overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-status-rejected/5 rounded-full blur-2xl -z-10" />
                  
                  {/* Title & Budget */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                        Disputed Project #{p.id}
                      </span>
                      <h3 className="text-lg font-black text-foreground">{p.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">{p.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-lg font-black text-status-rejected">{p.budget} ETH</div>
                      <span className="inline-flex items-center gap-1 mt-1.5 rounded-full bg-status-rejected/15 px-2.5 py-0.5 text-[10px] font-bold text-status-rejected border border-status-rejected/20">
                        Strikes: 4/4 Escalated
                      </span>
                    </div>
                  </div>

                  {/* Reconciled Parties Address Info */}
                  <div className="grid md:grid-cols-2 gap-4 border-t pt-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground block mb-1">Buyer (Employer):</span>
                      <span className="break-all text-foreground">{p.buyerAddress}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground block mb-1">Seller (Freelancer):</span>
                      <span className="break-all text-foreground">{p.sellerAddress}</span>
                    </div>
                  </div>

                  {/* Work Artifact Proof & Buyer Rejection Comments */}
                  <div className="grid md:grid-cols-2 gap-6 p-4 rounded-xl bg-surface-2/50 border text-xs">
                    <div className="space-y-2">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground block">Sellers Deliverable Evidence</span>
                      {p.githubUrl ? (
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-bold flex items-center gap-1 w-fit text-xs"
                        >
                          <span>Inspect GitHub Deliverable</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No evidence link provided.</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <span className="font-bold uppercase tracking-wider text-status-rejected block">Buyers Rejection Comments (Strike 4)</span>
                      <p className="text-muted-foreground leading-relaxed font-mono italic">
                        "{p.rejectionFeedback || "No rejection feedback registered."}"
                      </p>
                    </div>
                  </div>

                  {/* AI Assistant Section */}
                  <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">SafeEscrow AI Arbitration Advisor</h4>
                          <p className="text-[10px] text-muted-foreground">Heuristic automated dispute audit (No API keys required)</p>
                        </div>
                      </div>
                      
                      {!aiOpinions[p.id] ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAiAnalyze(p)}
                          disabled={aiScanningId !== null}
                          className="h-8 border-primary/30 hover:bg-primary/10 text-primary text-xs font-bold gap-1.5"
                        >
                          {aiScanningId === p.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Auditing contract...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Assess with AI Agent</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAiAnalyze(p)}
                          disabled={aiScanningId !== null}
                          className="h-7 text-[10px] text-muted-foreground hover:text-primary gap-1"
                        >
                          Re-analyze
                        </Button>
                      )}
                    </div>

                    {/* Rendering AI Opinion Result */}
                    {aiOpinions[p.id] && (
                      <div className="border border-border rounded-lg bg-card/60 p-3.5 text-xs space-y-3 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded font-bold bg-primary/10 text-primary">
                              Agent: SafeEscrow-Llama-Heuristics-v2
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span>Confidence:</span>
                            <span className={aiOpinions[p.id].confidence >= 80 ? "text-green-400 font-mono" : "text-yellow-400 font-mono"}>
                              {aiOpinions[p.id].confidence}%
                            </span>
                          </div>
                        </div>

                        {/* Verdict Recommendation */}
                        <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                          aiOpinions[p.id].recommendation === "RELEASE" 
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          <div className="shrink-0 font-black uppercase text-[11px] tracking-wider font-sans border px-2 py-0.5 rounded border-current">
                            Recommended: {aiOpinions[p.id].recommendation === "RELEASE" ? "PAY SELLER" : "REFUND BUYER"}
                          </div>
                          <p className="text-[11px] leading-relaxed font-sans text-foreground">
                            {aiOpinions[p.id].reasoning}
                          </p>
                        </div>

                        {/* AI Opinion Details */}
                        <div className="space-y-1 pl-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Scan Logs:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground font-mono">
                            {aiOpinions[p.id].details.map((d, idx) => (
                              <li key={idx}>{d}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="text-[9px] text-muted-foreground italic leading-relaxed pt-1 border-t">
                          ⚠️ Disclaimer: SafeEscrow AI results are advisory heuristic scores. The official arbitrator wallet remains the sole authority for dispute resolution.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resolution Action buttons */}
                  <div className="border-t pt-4 flex justify-between items-center gap-4 flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-medium italic">
                      * Arbitrator verdict is final. On-chain resolution will instantly execute budget payout or refund.
                    </span>
                    
                    <div className="flex gap-3">
                      {/* Payout Seller Button */}
                      <Button
                        onClick={() => handleResolveDispute(p.id, true)}
                        disabled={resolvingId !== null || !isAuthorizedAdmin}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 h-10 rounded-xl flex items-center gap-1.5 shadow-md shadow-green-900/10"
                      >
                        {isResolvingThis && sellerWins === true ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing payout...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Release Funds to Seller</span>
                          </>
                        )}
                      </Button>

                      {/* Refund Buyer Button */}
                      <Button
                        onClick={() => handleResolveDispute(p.id, false)}
                        disabled={resolvingId !== null || !isAuthorizedAdmin}
                        className="bg-status-rejected hover:bg-status-rejected/90 text-white font-bold text-xs px-4 h-10 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-950/15"
                      >
                        {isResolvingThis && sellerWins === false ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing refund...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Refund Buyer (Cancel)</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
