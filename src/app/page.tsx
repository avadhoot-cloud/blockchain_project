"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, FileCheck, Search, Sparkles, User, LogOut } from "lucide-react";
import { BalanceBadge } from "@/components/BalanceBadge";

export default function Home() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Decorative blurred background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 filter blur-3xl -z-10 animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-status-approved/5 filter blur-3xl -z-10 animate-pulse duration-[8000ms]" />

      {/* Header bar on home screen */}
      <header className="border-b bg-card/30 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Logo showText={true} />
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 rounded-lg bg-surface-2 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border bg-surface-2 px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Hello,</span>
                  <span className="text-primary font-bold">{user.username}</span>
                </div>
                
                <BalanceBadge />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-status-rejected hover:text-status-rejected/80 hover:bg-status-rejected/10 gap-1.5 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button size="sm" className="font-bold bg-primary hover:bg-primary/90 text-primary-fg">
                  Connect & Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          Secure Decoupled Web3 Escrow v2.0
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl">
          Trustless Freelance Escrow Contracts
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Secure, transparent, and completely decentralized escrow. Funds are locked in smart contracts, ensuring employers get the deliverables and freelancers get paid instantly.
        </p>

        {/* Dashboard Shortcuts */}
        <div className="grid md:grid-cols-2 gap-6 mt-12 text-left max-w-3xl w-full">
          <Link
            href={user ? (user.role === "SELLER" ? "/seller" : "/buyer") : "/auth"}
            className="group block p-6 border rounded-2xl bg-card hover:border-primary/50 hover:shadow-[0_0_24px_rgba(var(--primary),0.05)] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -z-10 group-hover:scale-125 transition-transform duration-500" />
            <ShieldCheck className="w-9 h-9 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Employer Dashboard</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Initialize active projects, escrow ETH budgets safely, review deliverable proof, and release payments securely to freelancers.
            </p>
            <div className="flex items-center text-primary text-sm font-bold group-hover:translate-x-1 transition-transform">
              <span>Enter as Buyer</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link
            href={user ? (user.role === "BUYER" ? "/buyer" : "/seller") : "/auth"}
            className="group block p-6 border rounded-2xl bg-card hover:border-primary/50 hover:shadow-[0_0_24px_rgba(var(--primary),0.05)] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl -z-10 group-hover:scale-125 transition-transform duration-500" />
            <FileCheck className="w-9 h-9 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Freelancer Dashboard</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Access assigned active projects, submit deliverable proof links, and claim your locked cryptocurrency payments on-chain.
            </p>
            <div className="flex items-center text-primary text-sm font-bold group-hover:translate-x-1 transition-transform">
              <span>Enter as Seller</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>

        {/* Feature Banner */}
        <div className="mt-16 p-6 border rounded-2xl bg-surface-2/40 max-w-3xl w-full text-left flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">On-Chain Single Source of Truth</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All active states, budget distributions, and settlement codes are managed directly on the local Hardhat smart contracts. SQLite acts as a secure high-speed indexing layer, giving you lightning-fast load times with mathematical blockchain guarantees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
