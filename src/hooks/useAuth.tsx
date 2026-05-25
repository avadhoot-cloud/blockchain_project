"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  id: number;
  username: string;
  walletAddress: string;
  role: "BUYER" | "SELLER" | "BOTH";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  walletMismatch: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, walletAddress: string, role: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletMismatch, setWalletMismatch] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Check Session on Mount
  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session check error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // 2. Wallet Mismatch Detection
  useEffect(() => {
    if (user && isConnected && address) {
      const registered = user.walletAddress.toLowerCase();
      const active = address.toLowerCase();
      
      if (registered !== active) {
        setWalletMismatch(true);
        toast.warning(
          `Wallet address mismatch! Please switch MetaMask to account: ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
          { id: "wallet-warning", duration: 8000 }
        );
      } else {
        setWalletMismatch(false);
      }
    } else {
      setWalletMismatch(false);
    }
  }, [user, address, isConnected]);

  // 3. Listen for window.ethereum events
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleChainChanged = () => {
        toast.info("Network changed. Reloading page...");
        window.location.reload();
      };
      
      (window as any).ethereum.on("chainChanged", handleChainChanged);
      return () => {
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // 4. Client Register
  const register = async (username: string, password: string, walletAddress: string, role: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, walletAddress, role }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return false;
      }
      
      toast.success("Account registered successfully! Please log in.");
      return true;
    } catch (err) {
      toast.error("An error occurred during registration.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 5. Client Login
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return false;
      }
      
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.username}!`);
      
      // Redirect based on role
      if (data.user.role === "BUYER") {
        router.push("/buyer");
      } else {
        router.push("/seller");
      }
      return true;
    } catch (err) {
      toast.error("An error occurred during login.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 6. Client Logout
  const logout = async () => {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      disconnect(); // Disconnect wallet on logout
      toast.success("Logged out successfully.");
      router.push("/auth");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        walletMismatch,
        login,
        register,
        logout,
        checkSession,
      }}
    >
      {children}
      
      {/* Wallet Mismatch Overlay Portal */}
      {walletMismatch && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="max-w-md w-full p-8 rounded-2xl border bg-card shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-status-rejected/10 text-status-rejected flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Wallet Mismatch Detected</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your currently active MetaMask wallet address does not match your registered SafeEscrow account address.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-surface-2 border space-y-2 text-left font-mono text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-sans font-bold">Registered Wallet:</span>
                <span className="text-primary break-all">{user?.walletAddress}</span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground block text-[10px] uppercase font-sans font-bold">Connected Wallet:</span>
                <span className="text-status-rejected break-all">{address}</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground italic">
              Please switch accounts in MetaMask or connect the correct wallet to restore your dashboard access.
            </p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
