import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import WaveBackground from "@/components/WaveBackground";
import { mockCatches, type CatchRecord } from "@/data/mockData";
import { Search, Fish, MapPin, Weight, Clock, User, Shield, ArrowDown } from "lucide-react";

const Trace = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CatchRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));

    const found = mockCatches.find(
      (c) => c.id.toLowerCase() === query.trim().toLowerCase()
    );
    if (found) {
      setResult(found);
    } else {
      setNotFound(true);
    }
    setSearching(false);
  };

  const journey = result
    ? [
        {
          icon: Fish,
          title: "Catch Logged",
          desc: `${result.species}, ${result.weight} kg caught at ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`,
          time: new Date(result.timestamp).toLocaleString(),
        },
        {
          icon: User,
          title: "Fisherman",
          desc: `Wallet: ${result.fisherman}`,
          time: "On-chain identity verified",
        },
        {
          icon: Shield,
          title: "Regulatory Review",
          desc:
            result.status === "approved"
              ? "Approved by regulatory authority"
              : result.status === "rejected"
              ? "Rejected by regulatory authority"
              : "Awaiting regulatory review",
          time: result.blockNumber ? `Block #${result.blockNumber}` : "Pending confirmation",
        },
      ]
    : [];

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center mb-12"
        >
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Trace a Catch
          </h1>
          <p className="text-muted-foreground">
            Enter a Catch ID to view its full verified journey — from ocean to approval.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="max-w-lg mx-auto flex gap-3 mb-12"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. CATCH-0x7a3B"
              className="pl-10 h-12 text-base bg-surface-2"
            />
          </div>
          <Button variant="wallet" size="lg" type="submit" disabled={searching}>
            {searching ? "Searching..." : "Trace"}
          </Button>
        </motion.form>

        <AnimatePresence mode="wait">
          {notFound && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto p-6 rounded-xl bg-card border border-border text-center"
            >
              <p className="text-muted-foreground">
                No catch found with ID <span className="font-mono text-foreground">"{query}"</span>.
                Please verify the ID and try again.
              </p>
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto"
            >
              <div className="p-6 rounded-xl bg-card border border-border mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">{result.species}</h2>
                    <span className="text-xs font-mono text-muted-foreground">{result.id}</span>
                  </div>
                  <StatusBadge status={result.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="text-foreground font-medium">{result.weight} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">GPS:</span>
                    <span className="text-foreground font-medium">
                      {result.lat.toFixed(2)}, {result.lng.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground font-medium">
                      {new Date(result.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Fisher:</span>
                    <span className="text-foreground font-mono text-xs">{result.fisherman}</span>
                  </div>
                </div>
              </div>

              {/* Journey timeline */}
              <h3 className="font-heading font-semibold text-foreground mb-4">Verified Journey</h3>
              <div className="space-y-0">
                {journey.map((step, i) => (
                  <div key={i} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-primary" />
                      </div>
                      {i < journey.length - 1 && (
                        <div className="w-px h-8 bg-border flex items-center justify-center">
                          <ArrowDown className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="pb-8">
                      <h4 className="font-heading font-semibold text-foreground text-sm">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !notFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-lg mx-auto text-center text-muted-foreground text-sm mt-8"
          >
            <p>Try searching: <button onClick={() => setQuery("CATCH-0x7a3B")} className="font-mono text-primary hover:underline">CATCH-0x7a3B</button></p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Trace;
