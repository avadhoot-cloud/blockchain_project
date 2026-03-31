import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import WaveBackground from "@/components/WaveBackground";
import { mockCatches, type CatchRecord } from "@/data/mockData";
import { Search, CheckCircle, XCircle, MapPin, Weight, Clock, User } from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "all" | "approved" | "pending" | "rejected";

const Regulator = () => {
  const [catches, setCatches] = useState<CatchRecord[]>(mockCatches);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatchRecord | null>(null);

  const filtered = catches.filter((c) => {
    const matchesFilter = filter === "all" || c.status === filter;
    const matchesSearch =
      !search ||
      c.species.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.fisherman.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAction = (id: string, action: "approved" | "rejected") => {
    setCatches((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: action, blockNumber: 18234600 } : c))
    );
    setSelected(null);
    toast.success(`Catch ${id} ${action}`, {
      description: `Transaction confirmed on block #18234600`,
    });
  };

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Regulatory Dashboard
          </h1>
          <p className="text-muted-foreground">
            Review and manage all submitted catch records. Approve or reject with on-chain finality.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Records", val: catches.length, color: "text-foreground" },
            { label: "Pending", val: catches.filter((c) => c.status === "pending").length, color: "text-status-pending" },
            { label: "Approved", val: catches.filter((c) => c.status === "approved").length, color: "text-status-approved" },
            { label: "Rejected", val: catches.filter((c) => c.status === "rejected").length, color: "text-status-rejected" },
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
                    <td className="px-4 py-3 font-mono text-xs text-primary">{c.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.fisherman}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{c.species}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.weight} kg</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      {c.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="approve"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleAction(c.id, "approved"); }}
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </Button>
                          <Button
                            variant="reject"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleAction(c.id, "rejected"); }}
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No records found.</div>
          )}
        </div>

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
                  <span className="text-xs font-mono text-muted-foreground">{selected.id}</span>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { icon: User, label: "Fisherman", value: selected.fisherman },
                  { icon: Weight, label: "Weight", value: `${selected.weight} kg` },
                  { icon: MapPin, label: "GPS", value: `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}` },
                  { icon: Clock, label: "Timestamp", value: new Date(selected.timestamp).toLocaleString() },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 text-sm">
                    <row.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground w-24">{row.label}</span>
                    <span className="text-foreground font-medium">{row.value}</span>
                  </div>
                ))}
                {selected.blockNumber && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-4 h-4 text-primary text-center text-xs font-bold">#</span>
                    <span className="text-muted-foreground w-24">Block</span>
                    <span className="text-foreground font-mono">{selected.blockNumber}</span>
                  </div>
                )}
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    variant="approve"
                    size="lg"
                    className="flex-1 h-12"
                    onClick={() => handleAction(selected.id, "approved")}
                  >
                    <CheckCircle className="w-5 h-5" /> Approve
                  </Button>
                  <Button
                    variant="reject"
                    size="lg"
                    className="flex-1 h-12"
                    onClick={() => handleAction(selected.id, "rejected")}
                  >
                    <XCircle className="w-5 h-5" /> Reject
                  </Button>
                </div>
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
