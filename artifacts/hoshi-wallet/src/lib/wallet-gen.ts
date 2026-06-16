import { ethers } from "ethers";
import { ed25519 } from "@noble/curves/ed25519.js";
export { ed25519 };

function base58encode(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const byte of bytes) n = n * 256n + BigInt(byte);
  let result = "";
  while (n > 0n) {
    result = ALPHABET[Number(n % 58n)] + result;
    n = n / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) result = "1" + result;
  return result;
}

async function hardenedChild(
  privKey: Uint8Array,
  chainCode: Uint8Array,
  index: number
): Promise<{ privKey: Uint8Array; chainCode: Uint8Array }> {
  const indexBuf = new Uint8Array(4);
  new DataView(indexBuf.buffer).setUint32(0, index >>> 0, false);
  const data = new Uint8Array([0x00, ...privKey, ...indexBuf]);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    chainCode,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, data));
  return { privKey: result.slice(0, 32), chainCode: result.slice(32) };
}

export async function getSolanaKeypairFromMnemonic(phrase: string): Promise<{
  privKey: Uint8Array;
  pubKey: Uint8Array;
}> {
  const mnemonic = ethers.Mnemonic.fromPhrase(phrase.trim());
  const seedHex = mnemonic.computeSeed();
  const seedBytes = ethers.getBytes(seedHex);

  const masterKeyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("ed25519 seed"),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const masterRaw = new Uint8Array(await crypto.subtle.sign("HMAC", masterKeyMaterial, seedBytes));
  let privPart = masterRaw.slice(0, 32);
  let chainPart = masterRaw.slice(32);

  const solPath = [44 | 0x80000000, 501 | 0x80000000, 0 | 0x80000000, 0 | 0x80000000];
  for (const idx of solPath) {
    const child = await hardenedChild(privPart, chainPart, idx);
    privPart = child.privKey;
    chainPart = child.chainCode;
  }

  const pubKey = ed25519.getPublicKey(privPart);
  return { privKey: privPart, pubKey };
}

export async function generateWalletFromMnemonic(phrase: string): Promise<{
  evmAddress: string;
  evmPrivateKey: string;
  solAddress: string;
  solPrivateKey: string;
}> {
  const mnemonic = ethers.Mnemonic.fromPhrase(phrase.trim());

  const evmWallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");

  const seedHex = mnemonic.computeSeed();
  const seedBytes = ethers.getBytes(seedHex);

  const masterKeyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("ed25519 seed"),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const masterRaw = new Uint8Array(await crypto.subtle.sign("HMAC", masterKeyMaterial, seedBytes));
  let { 0: privPart, 1: chainPart } = [masterRaw.slice(0, 32), masterRaw.slice(32)];

  const solPath = [44 | 0x80000000, 501 | 0x80000000, 0 | 0x80000000, 0 | 0x80000000];
  for (const idx of solPath) {
    const child = await hardenedChild(privPart, chainPart, idx);
    privPart = child.privKey;
    chainPart = child.chainCode;
  }

  const solPublicKey = ed25519.getPublicKey(privPart);

  return {
    evmAddress: evmWallet.address,
    evmPrivateKey: evmWallet.privateKey,
    solAddress: base58encode(solPublicKey),
    solPrivateKey: base58encode(privPart),
  };
}

export function generateNewMnemonic(): string {
  return ethers.Mnemonic.fromEntropy(ethers.randomBytes(16)).phrase;
}

export function isValidMnemonic(phrase: string): boolean {
  try {
    ethers.Mnemonic.fromPhrase(phrase.trim());
    return true;
  } catch {
    return false;
  }
}

export function isValidEvmAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function isValidSolAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export async function getEvmBalance(address: string, rpc: string = "https://eth.llamarpc.com"): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch {
    return "0";
  }
}

export async function estimateGasFee(
  from: string,
  to: string,
  amount: string,
  rpc: string = "https://eth.llamarpc.com"
): Promise<{ gasLimit: string; gasPriceGwei: string; feeEth: string }> {
  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const [gasLimit, feeData] = await Promise.all([
      provider.estimateGas({ from, to, value: ethers.parseEther(amount) }),
      provider.getFeeData(),
    ]);
    const gasPrice = feeData.gasPrice ?? ethers.parseUnits("20", "gwei");
    const fee = gasLimit * gasPrice;
    return {
      gasLimit: gasLimit.toString(),
      gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
      feeEth: ethers.formatEther(fee),
    };
  } catch {
    return { gasLimit: "21000", gasPriceGwei: "20", feeEth: "0.00042" };
  }
}
