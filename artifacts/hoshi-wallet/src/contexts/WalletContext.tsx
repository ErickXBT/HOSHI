import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ethers } from "ethers";
import { encryptData, decryptData } from "@/lib/wallet-crypto";
import { generateWalletFromMnemonic, generateNewMnemonic, isValidMnemonic } from "@/lib/wallet-gen";

export interface WalletEntry {
  id: string;
  name: string;
  evmAddress: string;
  solAddress: string;
  encrypted: string;
  createdAt: number;
}

interface WalletContextType {
  wallets: WalletEntry[];
  activeWallet: WalletEntry | null;
  unlockedMnemonic: string | null;
  isLocked: boolean;
  createWallet: (name: string, password: string) => Promise<{ mnemonic: string; evmAddress: string; solAddress: string }>;
  importWallet: (name: string, phrase: string, password: string) => Promise<void>;
  connectWallet: (name: string, password: string) => Promise<void>;
  lockWallet: () => void;
  setActiveWalletId: (id: string) => void;
  deleteWallet: (id: string) => void;
  getEvmSigner: (rpcUrl?: string) => ethers.Wallet | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

const STORAGE_KEY = "hoshi_wallets_v2";
const ACTIVE_KEY = "hoshi_active_v2";

function loadWallets(): WalletEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWallets(wallets: WalletEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [unlockedMnemonic, setUnlockedMnemonic] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadWallets();
    setWallets(stored);
    const savedActive = localStorage.getItem(ACTIVE_KEY);
    if (savedActive && stored.find(w => w.id === savedActive)) {
      setActiveId(savedActive);
    } else if (stored.length > 0) {
      setActiveId(stored[0].id);
    }
  }, []);

  const activeWallet = wallets.find(w => w.id === activeId) ?? null;
  const isLocked = unlockedMnemonic === null;

  const createWallet = useCallback(async (name: string, password: string) => {
    const phrase = generateNewMnemonic();
    const { evmAddress, solAddress } = await generateWalletFromMnemonic(phrase);
    const encrypted = await encryptData(phrase, password);
    const entry: WalletEntry = {
      id: crypto.randomUUID(),
      name: name.trim() || "My Wallet",
      evmAddress,
      solAddress,
      encrypted,
      createdAt: Date.now(),
    };
    const updated = [...wallets, entry];
    saveWallets(updated);
    setWallets(updated);
    setActiveId(entry.id);
    localStorage.setItem(ACTIVE_KEY, entry.id);
    setUnlockedMnemonic(phrase);
    return { mnemonic: phrase, evmAddress, solAddress };
  }, [wallets]);

  const importWallet = useCallback(async (name: string, phrase: string, password: string) => {
    if (!isValidMnemonic(phrase)) throw new Error("Invalid seed phrase");
    const { evmAddress, solAddress } = await generateWalletFromMnemonic(phrase);
    const encrypted = await encryptData(phrase, password);
    const entry: WalletEntry = {
      id: crypto.randomUUID(),
      name: name.trim() || "Imported Wallet",
      evmAddress,
      solAddress,
      encrypted,
      createdAt: Date.now(),
    };
    const updated = [...wallets, entry];
    saveWallets(updated);
    setWallets(updated);
    setActiveId(entry.id);
    localStorage.setItem(ACTIVE_KEY, entry.id);
    setUnlockedMnemonic(phrase);
  }, [wallets]);

  const connectWallet = useCallback(async (name: string, password: string) => {
    const wallet = wallets.find(w => w.name.toLowerCase() === name.toLowerCase().trim());
    if (!wallet) throw new Error("Wallet not found");
    const phrase = await decryptData(wallet.encrypted, password);
    setActiveId(wallet.id);
    localStorage.setItem(ACTIVE_KEY, wallet.id);
    setUnlockedMnemonic(phrase);
  }, [wallets]);

  const lockWallet = useCallback(() => {
    setUnlockedMnemonic(null);
  }, []);

  const setActiveWalletId = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const deleteWallet = useCallback((id: string) => {
    const updated = wallets.filter(w => w.id !== id);
    saveWallets(updated);
    setWallets(updated);
    if (activeId === id) {
      const next = updated[0] ?? null;
      setActiveId(next?.id ?? null);
      if (next) localStorage.setItem(ACTIVE_KEY, next.id);
      setUnlockedMnemonic(null);
    }
  }, [wallets, activeId]);

  const getEvmSigner = useCallback((rpcUrl = "https://cloudflare-eth.com") => {
    if (!unlockedMnemonic) return null;
    try {
      const mnemonic = ethers.Mnemonic.fromPhrase(unlockedMnemonic);
      const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      return wallet.connect(provider) as ethers.Wallet;
    } catch {
      return null;
    }
  }, [unlockedMnemonic]);

  return (
    <WalletContext.Provider value={{
      wallets, activeWallet, unlockedMnemonic, isLocked,
      createWallet, importWallet, connectWallet, lockWallet,
      setActiveWalletId, deleteWallet, getEvmSigner,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
