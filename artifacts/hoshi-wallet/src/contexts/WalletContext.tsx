import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ethers } from "ethers";
import { encryptData, decryptData } from "@/lib/wallet-crypto";
import { generateWalletFromMnemonic, generateNewMnemonic, isValidMnemonic, getSolanaKeypairFromMnemonic } from "@/lib/wallet-gen";

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
  isSyncing: boolean;
  createWallet: (name: string, password: string) => Promise<{ mnemonic: string; evmAddress: string; solAddress: string }>;
  importWallet: (name: string, phrase: string, password: string) => Promise<void>;
  connectWallet: (name: string, password: string) => Promise<void>;
  lockWallet: () => void;
  setActiveWalletId: (id: string) => void;
  deleteWallet: (id: string) => void;
  getEvmSigner: (rpcUrl?: string) => ethers.Wallet | null;
  getSolKeypair: () => Promise<{ privKey: Uint8Array; pubKey: Uint8Array } | null>;
  addWalletFromDashboard: () => void;
  deviceId: string;
}

const WalletContext = createContext<WalletContextType | null>(null);

const STORAGE_KEY = "hoshi_wallets_v2";
const ACTIVE_KEY = "hoshi_active_v2";
const DEVICE_KEY = "hoshi_device_id";

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function loadLocalWallets(): WalletEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWallets(wallets: WalletEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

async function fetchDbWallets(deviceId: string): Promise<WalletEntry[]> {
  try {
    const res = await fetch(`/api/hoshi-wallets?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((w: Record<string, unknown>) => ({
      id: w.walletId,
      name: w.name,
      evmAddress: w.evmAddress,
      solAddress: w.solAddress,
      encrypted: w.encrypted,
      createdAt: new Date(w.createdAt as string).getTime(),
    }));
  } catch {
    return [];
  }
}

async function saveWalletToDb(deviceId: string, entry: WalletEntry): Promise<void> {
  try {
    await fetch("/api/hoshi-wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        walletId: entry.id,
        name: entry.name,
        evmAddress: entry.evmAddress,
        solAddress: entry.solAddress,
        encrypted: entry.encrypted,
      }),
    });
  } catch {
  }
}

async function deleteWalletFromDb(deviceId: string, walletId: string): Promise<void> {
  try {
    await fetch(`/api/hoshi-wallets/${walletId}?deviceId=${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
    });
  } catch {
  }
}

let _addWalletCallback: (() => void) | null = null;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [unlockedMnemonic, setUnlockedMnemonic] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [deviceId] = useState(getOrCreateDeviceId);

  useEffect(() => {
    async function init() {
      setIsSyncing(true);
      const local = loadLocalWallets();
      const remote = await fetchDbWallets(deviceId);

      const merged = new Map<string, WalletEntry>();
      for (const w of local) merged.set(w.id, w);
      for (const w of remote) {
        if (!merged.has(w.id)) merged.set(w.id, w);
      }
      const all = Array.from(merged.values()).sort((a, b) => a.createdAt - b.createdAt);

      saveLocalWallets(all);
      setWallets(all);

      const savedActive = localStorage.getItem(ACTIVE_KEY);
      if (savedActive && all.find(w => w.id === savedActive)) {
        setActiveId(savedActive);
      } else if (all.length > 0) {
        setActiveId(all[0].id);
      }
      setIsSyncing(false);
    }
    init();
  }, [deviceId]);

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
    saveLocalWallets(updated);
    setWallets(updated);
    setActiveId(entry.id);
    localStorage.setItem(ACTIVE_KEY, entry.id);
    setUnlockedMnemonic(phrase);
    await saveWalletToDb(deviceId, entry);
    return { mnemonic: phrase, evmAddress, solAddress };
  }, [wallets, deviceId]);

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
    saveLocalWallets(updated);
    setWallets(updated);
    setActiveId(entry.id);
    localStorage.setItem(ACTIVE_KEY, entry.id);
    setUnlockedMnemonic(phrase);
    await saveWalletToDb(deviceId, entry);
  }, [wallets, deviceId]);

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
    saveLocalWallets(updated);
    setWallets(updated);
    deleteWalletFromDb(deviceId, id);
    if (activeId === id) {
      const next = updated[0] ?? null;
      setActiveId(next?.id ?? null);
      if (next) localStorage.setItem(ACTIVE_KEY, next.id);
      setUnlockedMnemonic(null);
    }
  }, [wallets, activeId, deviceId]);

  const getEvmSigner = useCallback((rpcUrl = "https://eth.llamarpc.com") => {
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

  const getSolKeypair = useCallback(async (): Promise<{ privKey: Uint8Array; pubKey: Uint8Array } | null> => {
    if (!unlockedMnemonic) return null;
    try {
      return await getSolanaKeypairFromMnemonic(unlockedMnemonic);
    } catch {
      return null;
    }
  }, [unlockedMnemonic]);

  const addWalletFromDashboard = useCallback(() => {
    if (_addWalletCallback) _addWalletCallback();
  }, []);

  return (
    <WalletContext.Provider value={{
      wallets, activeWallet, unlockedMnemonic, isLocked, isSyncing, deviceId,
      createWallet, importWallet, connectWallet, lockWallet,
      setActiveWalletId, deleteWallet, getEvmSigner, getSolKeypair, addWalletFromDashboard,
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
