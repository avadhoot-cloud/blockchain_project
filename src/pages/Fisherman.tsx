import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import WaveBackground from "@/components/WaveBackground";
import { SPECIES_LIST } from "@/data/mockData";
import { useWallet } from "@/hooks/useWallet";
import { logCatch, fetchAllCatches, type CatchRecord } from "@/lib/contract";
import { MapPin, Weight, Fish, Send, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

const Fisherman = () => {
  const { address, contract, isConnected, connecting, connect } = useWallet();
  const [species, setSpecies] = useState("");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract && address) {
      loadCatches();
    }
  }, [contract, address]);

  const loadCatches = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const all = await fetchAllCatches(contract);
      // Filter to only show catches from the connected wallet
      setCatches(all.filter((c) => c.fisherman.toLowerCase() === address.toLowerCase()));
    } catch (err) {
      console.error("Failed to load catches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    if (!species || !weight || !location) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const receipt = await logCatch(contract, species, parseInt(weight), location);
      toast.success("Catch logged on-chain!", {
        description: `Transaction confirmed in block #${receipt.blockNumber}`,
      });
      setSpecies("");
      setWeight("");
      setLocation("");
      await loadCatches();
    } catch (err: any) {
      console.error("Transaction failed:", err);
      toast.error("Failed to log catch", {
        description: "Ensure you have sufficient Sepolia ETH for gas.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <WaveBackground />
        <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 flex items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-3">
              Connect Your Wallet
            </h1>
            <p className="text-muted-foreground mb-6">
              Connect MetaMask to log catches on the Sepolia blockchain.
            </p>
            <Button variant="wallet" size="lg" onClick={connect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
                </>
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
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Log a Catch</h1>
          <p className="text-muted-foreground">
            Record your catch data on-chain. All entries are immutable and timestamped.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-5 p-6 rounded-xl bg-card border border-border"
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Fish className="w-4 h-4 text-primary" /> Species
              </Label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full h-12 px-3 rounded-lg bg-surface-2 border border-border text-foreground text-base focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">Select species...</option>
                {SPECIES_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Weight className="w-4 h-4 text-primary" /> Weight (kg)
              </Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                min="1"
                className="h-12 text-base bg-surface-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Location Coordinates
              </Label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="42.3601, -71.0589"
                className="h-12 text-base bg-surface-2"
              />
            </div>

            <Button
              type="submit"
              variant="wallet"
              size="lg"
              className="w-full h-14 text-base mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting to Chain...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Submit Catch
                </>
              )}
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-4"
          >
            <h2 className="font-heading text-xl font-semibold text-foreground">Your Catches</h2>
            {loading ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading catches from blockchain...
              </div>
            ) : catches.length === 0 ? (
              <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
                No catches logged yet. Submit your first catch!
              </div>
            ) : (
              <div className="space-y-3">
                {catches.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-heading font-semibold text-foreground">{c.species}</span>
                        <span className="text-xs text-muted-foreground ml-2 font-mono">#{c.id}</span>
                      </div>
                      <StatusBadge status={c.isApproved ? "approved" : "pending"} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5" /> {c.weight} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {c.location}
                      </span>
                      <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Fisherman;
