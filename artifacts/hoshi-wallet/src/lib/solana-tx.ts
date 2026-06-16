import { ed25519 } from "@noble/curves/ed25519.js";

const SOL_RPC = "https://api.mainnet-beta.solana.com";
const SOL_RPC_BACKUP = "https://solana-mainnet.g.alchemy.com/v2/demo";

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Decode(str: string): Uint8Array {
  let n = 0n;
  for (const c of str) {
    const idx = B58_ALPHABET.indexOf(c);
    if (idx < 0) throw new Error(`Invalid base58 char: ${c}`);
    n = n * 58n + BigInt(idx);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n % 256n));
    n /= 256n;
  }
  let leadingZeros = 0;
  for (const c of str) {
    if (c !== "1") break;
    leadingZeros++;
  }
  return new Uint8Array([...Array(leadingZeros).fill(0), ...bytes]);
}

export function base58Encode(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = n * 256n + BigInt(b);
  let result = "";
  while (n > 0n) {
    result = B58_ALPHABET[Number(n % 58n)] + result;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    result = "1" + result;
  }
  return result;
}

function base64DecodeToBytes(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64EncodeFromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function rpcCall(method: string, params: unknown[], rpc = SOL_RPC): Promise<unknown> {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP error ${res.status}`);
  const data = await res.json() as { error?: { message: string }; result: unknown };
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function getLatestBlockhash(): Promise<string> {
  try {
    const result = await rpcCall("getLatestBlockhash", [{ commitment: "finalized" }]) as { value: { blockhash: string } };
    return result.value.blockhash;
  } catch {
    const result = await rpcCall("getLatestBlockhash", [{ commitment: "finalized" }], SOL_RPC_BACKUP) as { value: { blockhash: string } };
    return result.value.blockhash;
  }
}

function buildSolTransferMessage(
  from: Uint8Array,
  to: Uint8Array,
  lamports: bigint,
  blockhashBytes: Uint8Array,
): Uint8Array {
  const systemProgram = new Uint8Array(32);

  const data = new Uint8Array(12);
  data[0] = 2; data[1] = 0; data[2] = 0; data[3] = 0;
  const view = new DataView(data.buffer);
  view.setBigUint64(4, lamports, true);

  return new Uint8Array([
    1, 0, 1,
    3,
    ...from,
    ...to,
    ...systemProgram,
    ...blockhashBytes,
    1,
    2,
    2, 0, 1,
    12,
    ...data,
  ]);
}

export async function sendSol(
  fromPubkey: Uint8Array,
  toPubkeyBase58: string,
  lamports: bigint,
  privateKey: Uint8Array,
): Promise<string> {
  const toPubkey = base58Decode(toPubkeyBase58);
  if (toPubkey.length !== 32) throw new Error("Invalid Solana recipient address");

  const blockhash = await getLatestBlockhash();
  const blockhashBytes = base58Decode(blockhash);

  const message = buildSolTransferMessage(fromPubkey, toPubkey, lamports, blockhashBytes);
  const signature = ed25519.sign(message, privateKey);

  const tx = new Uint8Array([0x01, ...signature, ...message]);
  const encoded = base64EncodeFromBytes(tx);

  try {
    const sig = await rpcCall("sendTransaction", [
      encoded,
      { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" },
    ]) as string;
    return sig;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("insufficient")) throw new Error("Insufficient SOL balance (need SOL for gas)");
    throw err;
  }
}

export async function getSolLamports(address: string): Promise<bigint> {
  try {
    const result = await rpcCall("getBalance", [address, { commitment: "confirmed" }]) as { value: number };
    return BigInt(result.value ?? 0);
  } catch {
    return 0n;
  }
}

export async function executeJupiterSwap(
  quoteResponse: unknown,
  userPublicKey: Uint8Array,
  privateKey: Uint8Array,
): Promise<string> {
  const userPublicKeyBase58 = base58Encode(userPublicKey);

  const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: userPublicKeyBase58,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!swapRes.ok) {
    const err = await swapRes.json() as { error?: string };
    throw new Error(err.error ?? `Jupiter returned ${swapRes.status}`);
  }

  const { swapTransaction } = await swapRes.json() as { swapTransaction: string };

  const txBytes = base64DecodeToBytes(swapTransaction);

  const signInput = txBytes.slice(65);
  const signature = ed25519.sign(signInput, privateKey);
  for (let i = 0; i < 64; i++) txBytes[i + 1] = signature[i];

  const encoded = base64EncodeFromBytes(txBytes);

  const result = await rpcCall("sendTransaction", [
    encoded,
    { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" },
  ]) as string;

  return result;
}
