import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import WaveBackground from "@/components/WaveBackground";
import heroOcean from "@/assets/hero-ocean.jpg";
import { Anchor, Shield, Search, ArrowRight } from "lucide-react";

const roles = [
  {
    icon: Anchor,
    title: "Fisherman",
    desc: "Log catches on-chain with GPS, species, and weight — immutable and instant.",
    to: "/fisherman",
  },
  {
    icon: Shield,
    title: "Regulator",
    desc: "Review and approve catches. Full oversight dashboard with on-chain finality.",
    to: "/regulator",
  },
  {
    icon: Search,
    title: "Consumer",
    desc: "Trace any catch by ID. Verify origin, authority, and sustainability on-chain.",
    to: "/trace",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Index = () => (
  <div className="min-h-screen relative">
    <WaveBackground />
    <div className="absolute inset-0 z-0">
      <img src={heroOcean} alt="" className="w-full h-full object-cover opacity-20" width={1920} height={800} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
    </div>

    <div className="relative z-10 container mx-auto px-4 pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl mx-auto text-center mb-20"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-xs font-medium text-primary tracking-wide uppercase">
            Powered by Ethereum · Sepolia Testnet
          </span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Transparent Fishing,{" "}
          <span className="text-gradient-primary">Verified On-Chain</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          An immutable digital logbook for commercial fishing. Combat illegal fishing,
          ensure traceability, and build trust — from ocean to plate.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="hero" size="lg" asChild>
            <Link to="/fisherman">
              Start Logging <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/trace">Trace a Catch</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
      >
        {roles.map((role) => (
          <motion.div key={role.title} variants={item}>
            <Link
              to={role.to}
              className="group block p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:glow-primary"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <role.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                {role.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {role.desc}
              </p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </div>
);

export default Index;
