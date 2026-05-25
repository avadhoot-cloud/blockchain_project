import Link from "next/link";
import { ArrowRight, ShieldCheck, FileCheck, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pt-24 px-4">
      <div className="max-w-4xl text-center space-y-6">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
          Phase 1 MVP Release
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight">
          Blockchain-Powered Freelance Escrow
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Secure, transparent, and trustless freelance contracts. Funds are locked in smart contracts, ensuring buyers get the work and sellers get paid.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-12 text-left max-w-3xl mx-auto">
          <Link href="/buyer" className="group block p-6 border rounded-xl bg-card hover:border-primary transition-colors">
            <ShieldCheck className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Buyer Dashboard</h2>
            <p className="text-muted-foreground mb-4">Create projects, deposit ETH into escrow, review work, and release funds to sellers.</p>
            <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
              Enter as Buyer <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>

          <Link href="/seller" className="group block p-6 border rounded-xl bg-card hover:border-primary transition-colors">
            <FileCheck className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Seller Dashboard</h2>
            <p className="text-muted-foreground mb-4">View assigned projects, submit GitHub/IPFS evidence, and claim your escrow payments.</p>
            <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
              Enter as Seller <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>

        <div className="mt-16 p-6 border rounded-xl bg-surface-2 max-w-3xl mx-auto text-left">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">On-Chain Transparency</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            All project states and financial locks are secured on the local Hardhat blockchain.
            No funds are ever custodied by a central server.
          </p>
        </div>
      </div>
    </div>
  );
}
