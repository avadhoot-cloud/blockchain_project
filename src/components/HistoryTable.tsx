"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { createPublicClient, http, formatEther } from "viem";
import { hardhat } from "viem/chains";
import contractData from "@/lib/contractData.json";
import { Button } from "@/components/ui/button";
import { Project } from "@prisma/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Layers, CheckCircle2, AlertTriangle, Play, FileSearch, HelpCircle, Loader2 } from "lucide-react";

// Initialize direct local blockchain reader
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http("http://127.0.0.1:8545"),
});

// Map contract state enum indexes to readable statuses
const STATE_MAP = [
  "CREATED",    // 0
  "BIDDING",    // 1
  "ACTIVE",     // 2
  "IN_REVIEW",  // 3
  "DISPUTED",   // 4
  "RESOLVED",   // 5
  "COMPLETED",  // 6
  "REFUNDED"    // 7
];

interface ProjectWithOnChain extends Project {
  onChainState?: string;
  onChainBudget?: string;
  onChainEvidence?: string;
  isDeployed?: boolean;
}

export function HistoryTable() {
  const { address } = useAccount();
  const [projects, setProjects] = useState<ProjectWithOnChain[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Toggles and Filters state
  const [viewRole, setViewRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  // Dynamic Approvals & Rejections state
  const [approvingProjectId, setApprovingProjectId] = useState<number | null>(null);
  const [showRejectId, setShowRejectId] = useState<number | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);
  const [disputingProjectId, setDisputingProjectId] = useState<number | null>(null);
  const [pendingDisputeFeedback, setPendingDisputeFeedback] = useState("");

  const { data: hash, isPending: isWritePending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Handle contract approvals & disputes confirmations
  useEffect(() => {
    if (isConfirmed) {
      if (approvingProjectId) {
        toast.success("Deliverables approved! Escrow payment successfully released to the freelancer.", { id: "approve-status", duration: 5000 });
        
        fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: approvingProjectId, status: "COMPLETED" })
        }).then(() => {
          setApprovingProjectId(null);
          loadAndReconcileProjects(); // Reload listings
        }).catch((err) => console.error("Failed to update status in DB:", err));
      }
      
      if (disputingProjectId) {
        toast.error("4th Rejection Strike reached! Project escalated to Mandate Dispute.", { id: "dispute-status", duration: 8000 });
        
        fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: disputingProjectId, 
            status: "DISPUTED", 
            rejectionCount: 4, 
            rejectionFeedback: pendingDisputeFeedback 
          })
        }).then(() => {
          setDisputingProjectId(null);
          setPendingDisputeFeedback("");
          setShowRejectId(null);
          setRejectFeedback("");
          loadAndReconcileProjects();
        }).catch((err) => console.error("Failed to escalate status in DB:", err));
      }
    }
  }, [isConfirmed, approvingProjectId, disputingProjectId, pendingDisputeFeedback]);

  useEffect(() => {
    const err = writeError || confirmError;
    if (err) {
      if (approvingProjectId) {
        toast.error(err.message || "Approval transaction failed or was rejected", { id: "approve-status", duration: 5000 });
        setApprovingProjectId(null);
      }
      if (disputingProjectId) {
        toast.error(err.message || "Dispute escalation failed or was rejected in wallet", { id: "dispute-status", duration: 5000 });
        setDisputingProjectId(null);
        setPendingDisputeFeedback("");
        setIsRejectSubmitting(false);
      }
    }
  }, [writeError, confirmError, approvingProjectId, disputingProjectId]);

  const handleApproveWork = (projectId: number) => {
    try {
      toast.loading("Initiating contract execution to release funds...", { id: "approve-status" });
      setApprovingProjectId(projectId);

      writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "approveWork",
        args: [BigInt(projectId)],
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.", { id: "approve-status" });
      setApprovingProjectId(null);
    }
  };

  const handleRejectWork = async (projectId: number, currentRejectionCount: number) => {
    const newCount = currentRejectionCount + 1;
    setIsRejectSubmitting(true);
    
    try {
      if (newCount < 4) {
        // Strike 1-3: Off-chain database update only, status resets to ACTIVE
        toast.loading(`Recording Rejection Strike ${newCount}/3...`, { id: "reject-status" });
        
        const res = await fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: projectId,
            rejectionCount: newCount,
            rejectionFeedback: rejectFeedback,
            status: "ACTIVE" // Reset status to active so freelancer can re-submit
          })
        });

        if (!res.ok) throw new Error("Failed to record rejection off-chain");

        toast.success(`Work rejected successfully. Strike ${newCount}/3 recorded.`, { id: "reject-status", duration: 5000 });
        setShowRejectId(null);
        setRejectFeedback("");
        loadAndReconcileProjects();
        setIsRejectSubmitting(false);
      } else {
        // Strike 4: Escalate to on-chain Dispute!
        toast.loading("Strike 4 reached! Initiating smart contract raiseDispute...", { id: "dispute-status" });
        setDisputingProjectId(projectId);
        setPendingDisputeFeedback(rejectFeedback);

        writeContract({
          address: contractData.address as `0x${string}`,
          abi: contractData.abi,
          functionName: "raiseDispute",
          args: [BigInt(projectId)],
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.", { id: "reject-status" });
      setIsRejectSubmitting(false);
    }
  };

  const loadAndReconcileProjects = async () => {
    if (!address) return;
    setLoading(true);
    
    try {
      // 1. Fetch off-chain parameters from local SQLite database index
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to query SQLite cache");
      
      const dbProjects: Project[] = await res.json();
      
      // 2. Resolve and reconcile each project's state against the local blockchain directly
      const reconciled = await Promise.all(
        dbProjects.map(async (project) => {
          try {
            // Read Project struct from contract using the database ID
            const onChainData = (await publicClient.readContract({
              address: contractData.address as `0x${string}`,
              abi: contractData.abi,
              functionName: "projects",
              args: [BigInt(project.id)],
            })) as any[];

            // Struct index lookup:
            // [0] id, [1] buyer, [2] seller, [3] budget, [4] state, [5] projectHash, [6] evidenceHash
            const onChainStateIndex = Number(onChainData[4]);
            const onChainState = STATE_MAP[onChainStateIndex] || "UNKNOWN";
            const onChainBudget = formatEther(onChainData[3]);
            const onChainEvidence = onChainData[6] as string;
            const buyerAddr = onChainData[1] as string;

            // If buyer address is the zero address, it was never successfully deployed on-chain
            const isDeployed = buyerAddr !== "0x0000000000000000000000000000000000000000";

            return {
              ...project,
              onChainState: isDeployed ? onChainState : "CANCELLED/FAILED",
              onChainBudget: isDeployed ? onChainBudget : project.budget.toString(),
              onChainEvidence: isDeployed ? onChainEvidence : "",
              isDeployed,
            };
          } catch (err) {
            // Fallback if contract read fails (e.g. project ID does not exist in contract yet)
            return {
              ...project,
              onChainState: "CANCELLED/FAILED",
              isDeployed: false,
            };
          }
        })
      );

      setProjects(reconciled);
    } catch (err) {
      console.error(err);
      toast.error("Failed to synchronize database and blockchain records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAndReconcileProjects();
  }, [address]);

  // Filter projects depending on Buyer/Seller role toggle and state filter tabs
  const filteredProjects = projects.filter((p) => {
    const matchesRole =
      viewRole === "BUYER"
        ? p.buyerAddress?.toLowerCase() === address?.toLowerCase()
        : p.sellerAddress?.toLowerCase() === address?.toLowerCase();

    if (!matchesRole) return false;

    // Filter statuses matching tags
    const state = p.onChainState || "CREATED";
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING" && (state === "CREATED" || state === "CANCELLED/FAILED")) return true;
    if (statusFilter === "ACTIVE" && state === "ACTIVE") return true;
    if (statusFilter === "IN_REVIEW" && state === "IN_REVIEW") return true;
    if (statusFilter === "COMPLETED" && (state === "COMPLETED" || state === "RESOLVED")) return true;

    return false;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500 border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
            <FileSearch className="w-3.5 h-3.5" />
            In Review
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500 border border-blue-500/20">
            <Play className="w-3.5 h-3.5 animate-pulse" />
            Active
          </span>
        );
      case "CANCELLED/FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500 border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Stale / Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-2.5 py-1 text-xs font-semibold text-muted-foreground border border-border">
            <HelpCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  if (!address) return null;

  return (
    <div className="space-y-6">
      {/* Dashboard Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-2xl bg-card">
        <div className="space-y-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Transaction & Escrow History
          </h3>
          <p className="text-xs text-muted-foreground">
            States are queried directly from the blockchain (source of truth) and indexed with local parameters.
          </p>
        </div>
        
        {/* Toggle Roles */}
        <div className="flex p-0.5 bg-surface-2 border rounded-xl w-fit">
          <button
            onClick={() => {
              setViewRole("BUYER");
              setExpandedProjectId(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewRole === "BUYER"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Payments Sent (Buyer)
          </button>
          <button
            onClick={() => {
              setViewRole("SELLER");
              setExpandedProjectId(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewRole === "SELLER"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Earnings Received (Seller)
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto pb-1.5 font-sans scrollbar-none">
        {["ALL", "ACTIVE", "IN_REVIEW", "COMPLETED", "PENDING"].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
              statusFilter === filter
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="text-center p-12 border rounded-2xl bg-card">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Synchronizing local data with local Hardhat network...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center p-12 border rounded-2xl bg-card text-muted-foreground">
          No records match this role or filter.
        </div>
      ) : (
        <div className="border rounded-2xl overflow-hidden bg-card divide-y">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface-2 border-b">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Project Title</div>
            <div className="col-span-3">Counterparty</div>
            <div className="col-span-2 text-right">Escrow Budget</div>
            <div className="col-span-2 text-center">Live Status</div>
          </div>

          {/* Table Rows */}
          {filteredProjects.map((p) => {
            const isExpanded = expandedProjectId === p.id;
            const counterpartyAddr = viewRole === "BUYER" ? p.sellerAddress : p.buyerAddress;
            const counterpartyDisplay = counterpartyAddr
              ? `${counterpartyAddr.slice(0, 6)}...${counterpartyAddr.slice(-4)}`
              : "Unassigned";

            return (
              <div key={p.id} className="transition-all hover:bg-surface-2/30">
                {/* Desktop View Row */}
                <div
                  onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}
                  className="grid grid-cols-1 md:grid-cols-12 items-center p-4 gap-2 md:gap-0 cursor-pointer select-none text-sm"
                >
                  <div className="col-span-1 font-mono text-xs font-semibold text-muted-foreground">
                    #{p.id}
                  </div>
                  <div className="col-span-1 md:col-span-4 pr-4">
                    <div className="font-bold truncate text-foreground">{p.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                  </div>
                  <div className="col-span-1 md:col-span-3 flex items-center gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">{counterpartyDisplay}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2 text-left md:text-right font-mono font-bold text-foreground">
                    {p.onChainBudget || p.budget} ETH
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center md:justify-center justify-between mt-2 md:mt-0">
                    <span className="md:hidden text-xs font-semibold uppercase text-muted-foreground">Status: </span>
                    {getStatusBadge(p.onChainState || "CREATED")}
                    <span className="hidden md:block ml-2 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Details Drawer */}
                {isExpanded && (
                  <div className="p-5 bg-surface-2/50 border-t space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</span>
                        <p className="text-muted-foreground leading-relaxed text-xs">{p.description}</p>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div>
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground block">
                            Buyer Address:
                          </span>
                          <span className="break-all">{p.buyerAddress}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground block">
                            Seller Address:
                          </span>
                          <span className="break-all">{p.sellerAddress || "Unassigned"}</span>
                        </div>
                        {p.isDeployed && (
                          <div>
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-foreground block">
                              Escrow Smart Contract Code:
                            </span>
                            <span className="text-primary break-all">{contractData.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evidence & Hash Info */}
                    {p.isDeployed && (
                      <div className="pt-3 border-t grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">On-Chain IPFS / Database Reference:</span>
                          <span className="font-mono text-muted-foreground break-all">{`ipfs://mock-hash-for-${p.id}`}</span>
                        </div>
                        <div>
                          <span className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Submitted Deliverable Evidence:</span>
                          {p.onChainEvidence ? (
                            <a
                              href={p.onChainEvidence}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline font-semibold flex items-center gap-1.5 w-fit"
                            >
                              <span>View Work Artifact ({p.onChainEvidence.slice(0, 30)}...)</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic">No work deliverables submitted yet.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Buyer-only Release & Reject Escrow Actions if work is In Review */}
                    {p.isDeployed && viewRole === "BUYER" && p.onChainState === "IN_REVIEW" && (
                      <div className="pt-4 border-t flex flex-col gap-3">
                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (showRejectId === p.id) {
                                setShowRejectId(null);
                                setRejectFeedback("");
                              } else {
                                setShowRejectId(p.id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-950/20"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Reject Deliverables</span>
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveWork(p.id);
                            }}
                            disabled={approvingProjectId === p.id && (isWritePending || isConfirming)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-green-950/20"
                          >
                            {approvingProjectId === p.id && (isWritePending || isConfirming) ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Releasing Funds...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve Deliverables & Release Funds</span>
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Rejection Feedback Dialog Overlay Inside Expanded Drawer */}
                        {showRejectId === p.id && (
                          <div className="p-4 border rounded-xl bg-background/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-left">
                              Enter Rejection Feedback (Strike {p.rejectionCount + 1}/3)
                            </span>
                            <textarea
                              value={rejectFeedback}
                              onChange={(e) => setRejectFeedback(e.target.value)}
                              placeholder="Describe what needs to be fixed. Note: On Strike 4, this automatically escalates to a Mandate Dispute."
                              rows={3}
                              className="w-full p-2.5 rounded-lg border bg-surface-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                              required
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRejectId(null);
                                  setRejectFeedback("");
                                }}
                                className="text-xs font-semibold"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                disabled={isRejectSubmitting || !rejectFeedback}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectWork(p.id, p.rejectionCount);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                              >
                                {isRejectSubmitting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <span>Submit Rejection & Strike</span>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
