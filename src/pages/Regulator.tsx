import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import WaveBackground from "@/components/WaveBackground";
import { useWallet } from "@/hooks/useWallet";
import { fetchAllCatches, approveCatch, type CatchRecord } from "@/lib/contract";
import { Search, CheckCircle, MapPin, Weight, Clock, User, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "all" | "approved" | "pending";

const Regulator = () => {
  const { contract, isConnected, connecting, connect } = useWallet();
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatchRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    if (contract) {
      loadCatches();
    }
  }, [contract]);

  const loadCatches = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const all = await fetchAllCatches(contract);
      setCatches(all);
    } catch (err) {
      console.error("Failed to load catches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (catchId: number) => {
    if (!contract) return;
    setApproving(catchId);
    try {
      const receipt = await approveCatch(contract, catchId);
      toast.success(`Catch #${catchId} approved on-chain`, {
        description: `Confirmed in block #${receipt.blockNumber}`,
      });
      setSelected(null);
      await loadCatches();
    } catch (err: any) {
      console.error("Approval failed:", err);
      toast.error("Failed to approve catch", {
        description: "Ensure you are connected with the regulatory authority address.",
      });
    } finally {
      setApproving(null);
    }
  };

  const filtered = catches.filter((c) => {
    const status = c.isApproved ? "approved" : "pending";
    const matchesFilter = filter === "all" || filter === status;
    const matchesSearch =
      !search ||
      c.species.toLowerCase().includes(search.toLowerCase()) ||
      c.fisherman.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toString().includes(search);
    return matchesFilter && matchesSearch;
  });

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <WaveBackground />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 flex items-center justify-center min-h-[80vh]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-3">Regulatory Dashboard</h1>
            <p className="text-muted-foreground mb-6">
              Connect the regulatory authority wallet to review and approve catches.
            </p>
            <Button variant="wallet" size="lg" onClick={connect} disabled={connecting}>
              {connecting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
              ) : (
                "Connect MetaMask"
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Regulatory Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve submitted catch records with on-chain finality.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Records", val: catches.length, color: "text-foreground" },
            { label: "Pending", val: catches.filter((c) => !c.isApproved).length, color: "text-status-pending" },
            { label: "Approved", val: catches.filter((c) => c.isApproved).length, color: "text-status-approved" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border text-center">
              <div className={`font-heading text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by species, ID, or fisherman..."
              className="pl-10 h-11 bg-surface-2"
            />
          </div>
          <div className="flex gap-2">
            {filterButtons.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 rounded-xl bg-card border border-border text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading records from blockchain...
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fisherman</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Species</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Weight</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 hover:bg-surface-2/50 cursor-pointer transition-colors"
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-primary">#{c.id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.fisherman.slice(0, 6)}...{c.fisherman.slice(-4)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{c.species}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.weight} kg</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.isApproved ? "approved" : "pending"} />
                      </td>
                      <td className="px-4 py-3">
                        {!c.isApproved && (
                          <Button
                            variant="approve"
                            size="sm"
                            disabled={approving === c.id}
                            onClick={(e) => { e.stopPropagation(); handleApprove(c.id); }}
                          >
                            {approving === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                {catches.length === 0 ? "No records on-chain yet." : "No records match your filters."}
              </div>
            )}
          </div>
        )}

        {/* Detail modal */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg p-6 rounded-xl bg-card border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading text-xl font-bold text-foreground">{selected.species}</h3>
                  <span className="text-xs font-mono text-muted-foreground">Catch #{selected.id}</span>
                </div>
                <StatusBadge status={selected.isApproved ? "approved" : "pending"} />
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { icon: User, label: "Fisherman", value: selected.fisherman },
                  { icon: Weight, label: "Weight", value: `${selected.weight} kg` },
                  { icon: MapPin, label: "Location", value: selected.location },
                  { icon: Clock, label: "Timestamp", value: new Date(selected.timestamp).toLocaleString() },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 text-sm">
                    <row.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground w-24">{row.label}</span>
                    <span className="text-foreground font-medium break-all">{row.value}</span>
                  </div>
                ))}
              </div>

              {!selected.isApproved && (
                <Button
                  variant="approve"
                  size="lg"
                  className="w-full h-12"
                  disabled={approving === selected.id}
                  onClick={() => handleApprove(selected.id)}
                >
                  {approving === selected.id ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" /> Approve Catch</>
                  )}
                </Button>
              )}

              <button
                className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Regulator;
