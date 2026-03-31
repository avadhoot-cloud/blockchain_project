import { ethers } from "ethers";

// Set your deployed Sepolia contract address here
const CONTRACT_ADDRESS = "";

const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "uint256", name: "_catchId", type: "uint256" }],
    name: "approveCatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "catchCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "catches",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "fisherman", type: "address" },
      { internalType: "string", name: "species", type: "string" },
      { internalType: "uint256", name: "weightInKg", type: "uint256" },
      { internalType: "string", name: "locationCoordinates", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "isApproved", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_catchId", type: "uint256" }],
    name: "getCatchDetails",
    outputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_species", type: "string" },
      { internalType: "uint256", name: "_weightInKg", type: "uint256" },
      { internalType: "string", name: "_locationCoordinates", type: "string" },
    ],
    name: "logCatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "regulatoryAuthority",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

export type CatchRecord = {
  id: number;
  fisherman: string;
  species: string;
  weight: number;
  location: string;
  timestamp: string;
  isApproved: boolean;
};

export function getContractAddress() {
  return CONTRACT_ADDRESS;
}

export async function connectWallet(): Promise<{
  signer: ethers.Signer;
  address: string;
  contract: ethers.Contract;
}> {
  const win = window as any;
  if (typeof win.ethereum === "undefined") {
    throw new Error("MetaMask is not installed. Please install the MetaMask extension.");
  }

  await win.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(win.ethereum, "any");
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return { signer, address, contract };
}

export async function getReadOnlyContract(): Promise<ethers.Contract> {
  const win = window as any;
  if (typeof win.ethereum === "undefined") {
    throw new Error("MetaMask is not installed.");
  }
  const provider = new ethers.BrowserProvider(win.ethereum, "any");
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function fetchCatchCount(contract: ethers.Contract): Promise<number> {
  const count = await contract.catchCount();
  return Number(count);
}

export async function fetchCatchDetails(
  contract: ethers.Contract,
  catchId: number
): Promise<CatchRecord> {
  const details = await contract.getCatchDetails(catchId);
  return {
    id: catchId,
    fisherman: details[0],
    species: details[1],
    weight: Number(details[2]),
    location: details[3],
    timestamp: new Date(Number(details[4]) * 1000).toISOString(),
    isApproved: details[5],
  };
}

export async function fetchAllCatches(contract: ethers.Contract): Promise<CatchRecord[]> {
  const count = await fetchCatchCount(contract);
  const catches: CatchRecord[] = [];
  for (let i = 1; i <= count; i++) {
    try {
      const record = await fetchCatchDetails(contract, i);
      catches.push(record);
    } catch {
      // skip any failed reads
    }
  }
  return catches;
}

export async function logCatch(
  contract: ethers.Contract,
  species: string,
  weightInKg: number,
  locationCoordinates: string
): Promise<ethers.TransactionReceipt> {
  const tx = await contract.logCatch(species, weightInKg, locationCoordinates);
  return await tx.wait();
}

export async function approveCatch(
  contract: ethers.Contract,
  catchId: number
): Promise<ethers.TransactionReceipt> {
  const tx = await contract.approveCatch(catchId);
  return await tx.wait();
}
