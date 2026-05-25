"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, KeyRound, UserPlus, Wallet, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("SELLER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isConnected, address } = useAccount();
  const { connect, isPending: isConnectingWallet } = useConnect();
  const { disconnect } = useDisconnect();
  const { login, register, user } = useAuth();

  // Reset inputs when switching tabs
  useEffect(() => {
    setUsername("");
    setPassword("");
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === "login") {
        await login(username, password);
      } else {
        if (!isConnected || !address) {
          toast.error("You must connect your Ethereum wallet to register!");
          setIsSubmitting(false);
          return;
        }
        const success = await register(username, password, address, role);
        if (success) {
          setActiveTab("login");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Something went wrong. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Absolute Decorative Blurred Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 filter blur-3xl -z-10 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-status-approved/5 filter blur-3xl -z-10 animate-pulse duration-[8000ms]" />

      <div className="max-w-md w-full space-y-8 glass p-8 rounded-2xl border shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Logo showText={true} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {activeTab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeTab === "login"
              ? "Access your secure freelance escrow dashboards"
              : "Bind your identity securely to your Web3 wallet"}
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="grid grid-cols-2 p-1 bg-surface-2 border rounded-xl">
          <button
            onClick={() => setActiveTab("login")}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "login"
                ? "bg-card text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "register"
                ? "bg-card text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Register
          </button>
        </div>

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </label>
              <Input
                placeholder="e.g. alice_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-background border-border focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-background border-border focus-visible:ring-primary"
              />
            </div>

            {/* Role & Wallet Connections only for Registration */}
            {activeTab === "register" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Choose Your Primary Role
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("SELLER")}
                      className={`p-3 border rounded-xl text-center transition-all ${
                        role === "SELLER"
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Freelancer (Seller)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("BUYER")}
                      className={`p-3 border rounded-xl text-center transition-all ${
                        role === "BUYER"
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Employer (Buyer)
                    </button>
                  </div>
                </div>

                {/* Secure Wallet Bind Guard */}
                <div className="p-4 border rounded-xl bg-surface-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider">Web3 Account Connection</span>
                    </div>
                    {isConnected && (
                      <span className="inline-flex items-center rounded-full bg-status-approved/10 px-2 py-0.5 text-[10px] font-bold text-status-approved border border-status-approved/20">
                        Linked
                      </span>
                    )}
                  </div>
                  
                  {isConnected && address ? (
                    <div className="flex justify-between items-center">
                      <div className="font-mono text-xs text-muted-foreground select-all break-all pr-2">
                        {address}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnect()}
                        className="text-status-rejected hover:text-status-rejected/80 hover:bg-status-rejected/10 text-xs shrink-0"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-sm"
                      onClick={() => connect({ connector: injected() })}
                      disabled={isConnectingWallet}
                    >
                      {isConnectingWallet ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>Connecting Wallet...</span>
                        </>
                      ) : (
                        <>
                          <span>Connect MetaMask Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-bold bg-primary hover:bg-primary/90 text-primary-fg"
            disabled={isSubmitting || (activeTab === "register" && !isConnected)}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : activeTab === "login" ? (
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                <span>Sign In Securely</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Register & Link Wallet</span>
              </div>
            )}
          </Button>
          
          {activeTab === "register" && !isConnected && (
            <p className="text-[10px] text-center text-status-rejected font-medium leading-relaxed">
              * Connecting a wallet is mandatory during registration to cryptographically bind your profile identity to your on-chain escrow operations.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
