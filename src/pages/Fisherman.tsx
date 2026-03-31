import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import WaveBackground from "@/components/WaveBackground";
import { SPECIES_LIST, mockCatches, type CatchRecord } from "@/data/mockData";
import { MapPin, Weight, Fish, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Fisherman = () => {
  const [species, setSpecies] = useState("");
  const [weight, setWeight] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [catches, setCatches] = useState<CatchRecord[]>(
    mockCatches.filter((c) => c.fisherman === "0x7a3B...f29E")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!species || !weight || !lat || !lng) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));

    const newCatch: CatchRecord = {
      id: `CATCH-0x${Math.random().toString(16).slice(2, 6)}`,
      fisherman: "0x7a3B...f29E",
      species,
      weight: parseInt(weight),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: new Date().toISOString(),
      status: "pending",
    };
    setCatches([newCatch, ...catches]);
    setSpecies("");
    setWeight("");
    setLat("");
    setLng("");
    setSubmitting(false);
    toast.success("Catch submitted to blockchain!", {
      description: `${newCatch.id} is now pending review.`,
    });
  };

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Log a Catch
          </h1>
          <p className="text-muted-foreground">
            Record your catch data on-chain. All entries are immutable and timestamped.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Latitude
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="42.3601"
                  className="h-12 text-base bg-surface-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-71.0589"
                  className="h-12 text-base bg-surface-2"
                />
              </div>
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
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting to Chain...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Catch
                </>
              )}
            </Button>
          </motion.form>

          {/* Catch History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-4"
          >
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Your Catches
            </h2>
            {catches.length === 0 ? (
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
                        <span className="text-xs text-muted-foreground ml-2 font-mono">{c.id}</span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5" /> {c.weight} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
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
