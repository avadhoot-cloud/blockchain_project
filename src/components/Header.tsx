import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Waves, Menu, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";

const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address, isConnected, connecting, connect } = useWallet();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/fisherman", label: "Fisherman" },
    { to: "/regulator", label: "Regulator" },
    { to: "/trace", label: "Trace" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Waves className="w-5 h-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground tracking-tight">
            FishChain
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border">
              <div className="w-2 h-2 rounded-full bg-status-approved animate-pulse-glow" />
              <span className="text-sm font-mono text-muted-foreground">{truncatedAddress}</span>
            </div>
          ) : (
            <Button variant="wallet" size="sm" onClick={connect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(link.to)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2">
                {isConnected ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2">
                    <div className="w-2 h-2 rounded-full bg-status-approved" />
                    <span className="text-sm font-mono text-muted-foreground">{truncatedAddress}</span>
                  </div>
                ) : (
                  <Button variant="wallet" className="w-full" onClick={connect} disabled={connecting}>
                    {connecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
