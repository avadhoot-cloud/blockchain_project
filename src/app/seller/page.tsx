"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletConnect } from "@/components/WalletConnect";
import contractData from "@/lib/contractData.json";
import { Project } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SellerDashboard() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Load projects from database
  const loadProjects = () => {
    if (address) {
      fetch("/api/projects")
        .then(res => res.json())
        .then((data: Project[]) => {
          setProjects(data.filter(p => p.sellerAddress?.toLowerCase() === address.toLowerCase()));
        })
        .catch((err) => {
          console.error("Failed to load projects:", err);
        });
    }
  };

  useEffect(() => {
    loadProjects();
  }, [address]);

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
      toast.success("Work evidence successfully recorded on the blockchain!", { id: "tx-status", duration: 5000 });
      setEvidenceUrl("");
      setSelectedProjectId(null);
      loadProjects(); // Reload projects list

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

  const handleSubmitWork = (projectId: number) => {
    if (!evidenceUrl) {
      toast.error("Please enter a valid work evidence URL or IPFS hash.");
      return;
    }
    
    try {
      toast.loading("Initiating contract execution...", { id: "tx-status" });
      setSelectedProjectId(projectId);

      writeContract({
        address: contractData.address as `0x${string}`,
        abi: contractData.abi,
        functionName: "submitWork",
        args: [projectId, evidenceUrl],
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.", { id: "tx-status" });
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <WalletConnect />
      </div>

      {!isConnected ? (
        <div className="text-center p-12 border rounded-xl bg-surface-2 text-muted-foreground">
          Please connect your wallet to view assigned projects.
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Assigned Projects</h2>
          
          {projects.length === 0 ? (
            <div className="p-8 border rounded-xl text-center text-muted-foreground">
              No projects assigned to your wallet address.
            </div>
          ) : (
            <div className="grid gap-6">
              {projects.map(p => (
                <div key={p.id} className="border p-6 rounded-xl bg-card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">{p.budget} ETH</div>
                      <div className="text-xs text-muted-foreground mt-1">Status: {p.status}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <label className="text-sm font-medium block mb-2">Submit Work Evidence (URL or IPFS Hash)</label>
                    <div className="flex gap-4">
                      <Input 
                        placeholder="https://github.com/..." 
                        value={selectedProjectId === p.id ? evidenceUrl : ""} 
                        onChange={e => {
                          setSelectedProjectId(p.id);
                          setEvidenceUrl(e.target.value);
                        }} 
                      />
                      <Button 
                        disabled={selectedProjectId !== p.id || isPending || isConfirming || !evidenceUrl}
                        onClick={() => handleSubmitWork(p.id)}
                      >
                        {selectedProjectId === p.id && isPending ? "Confirming..." : "Submit to Blockchain"}
                      </Button>
                    </div>
                  </div>
                  
                  {selectedProjectId === p.id && isConfirmed && (
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-md text-sm mt-4">
                      Work submitted on-chain! Tx: {hash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
