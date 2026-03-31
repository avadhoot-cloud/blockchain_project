export type CatchRecord = {
  id: string;
  fisherman: string;
  species: string;
  weight: number;
  lat: number;
  lng: number;
  timestamp: string;
  status: "approved" | "pending" | "rejected";
  blockNumber?: number;
};

export const SPECIES_LIST = [
  "Atlantic Cod", "Bluefin Tuna", "Yellowfin Tuna", "Pacific Salmon",
  "Swordfish", "Red Snapper", "Mahi-Mahi", "Halibut",
  "Striped Bass", "Grouper", "Mackerel", "Sardine",
];

export const mockCatches: CatchRecord[] = [
  {
    id: "CATCH-0x7a3B",
    fisherman: "0x7a3B...f29E",
    species: "Atlantic Cod",
    weight: 145,
    lat: 42.3601,
    lng: -71.0589,
    timestamp: "2026-03-30T14:22:00Z",
    status: "approved",
    blockNumber: 18234567,
  },
  {
    id: "CATCH-0x9f1C",
    fisherman: "0x9f1C...d82A",
    species: "Bluefin Tuna",
    weight: 320,
    lat: 36.7783,
    lng: -119.4179,
    timestamp: "2026-03-30T09:15:00Z",
    status: "pending",
  },
  {
    id: "CATCH-0x2eD4",
    fisherman: "0x2eD4...a11F",
    species: "Pacific Salmon",
    weight: 28,
    lat: 47.6062,
    lng: -122.3321,
    timestamp: "2026-03-29T18:45:00Z",
    status: "pending",
  },
  {
    id: "CATCH-0x5bA8",
    fisherman: "0x5bA8...c73B",
    species: "Swordfish",
    weight: 210,
    lat: 25.7617,
    lng: -80.1918,
    timestamp: "2026-03-29T06:30:00Z",
    status: "rejected",
    blockNumber: 18234501,
  },
  {
    id: "CATCH-0x8cF2",
    fisherman: "0x7a3B...f29E",
    species: "Red Snapper",
    weight: 15,
    lat: 29.7604,
    lng: -95.3698,
    timestamp: "2026-03-28T12:00:00Z",
    status: "approved",
    blockNumber: 18234489,
  },
];
