# 🛡️ SafeEscrow - Developer & Architecture Documentation

SafeEscrow is a next-generation, decoupled, trustless Web3 Freelance Escrow platform designed to guarantee pay-on-delivery between employers (Buyers) and freelancers (Sellers). It features a 4-strike rejection system, active SQLite caching, and an automated Heuristic AI Arbitration Advisor in the Mandate portal.

---

## 🏗️ Core System Architecture

SafeEscrow uses a hybrid architecture designed for speed and decentralized trust:
1. **Smart Contracts (On-Chain Truth)**: Implemented on a local Hardhat node. All active escrowed funds, agreement rules, and payout states are managed on-chain by the `Escrow` smart contract.
2. **SQLite Database (Off-Chain Cache)**: Structured metadata like usernames, hashed passwords, session logs, and rejection commentaries are stored in SQLite using Prisma. SQLite speeds up queries while maintaining 100% database-to-blockchain parity.

```
       +------------------+           +------------------+
       |   Employer /     |           |   Freelancer /   |
       |  Buyer Dashboard |           | Seller Dashboard |
       +--------+---------+           +--------+---------+
                |                              |
                +--------------+---------------+
                               |
                               v
                     +---------+---------+
                     | Next.js API Layer |
                     +----+-----------+--+
                          |           |
                          v           v
            +-------------+---+   +---+-------------+
            |  SQLite Database |   | Hardhat Network |
            | (Prisma Indexer) |   | (Smart Contract)|
            +------------------+   +-----------------+
```

---

## 🔒 Security & Wallet Session Flow

- **Password Storage**: Hashed using `bcryptjs` with 10 salt rounds.
- **JWT Cookies**: Authentication sessions are managed using secure, client-side signed `jose` JSON Web Tokens stored in `HttpOnly`, `SameSite=Strict` cookies.
- **Edge Guards**: `src/middleware.ts` runs at the Next.js routing layer, protecting dashboard routes (/buyer, /seller) by parsing and verifying the JWT token.
- **Wallet Mismatch Protection**: Client-side auth checks if the user's logged-in account in MetaMask matches their registered address. If there is a mismatch, the UI renders a modal overlay, blocking access until the user switches to the correct wallet address.

---

## 💸 Live Balance Badges

To keep track of gas fees and payment capability:
- The top header renders a premium, neon-styled **Live ETH Balance Badge** (`BalanceBadge.tsx`) in `/`, `/buyer`, and `/seller`.
- The badge is reactively updated using Wagmi's `useBalance` hook.
- **SSR Hydration Safe**: Prevents Next.js server-side mismatch by lazily mounting client-only MetaMask connections after the component mounts.
- *Note*: Per administrative requirements, the Mandate Arbitrator header does **not** render the balance badge, as the arbitrator does not earn or pay out from their active wallet.

---

## 🚫 4-Strike Rejection & Dispute Flow

Buyers can inspect submitted work deliverables from the history tab. If deliverables are unsatisfactory, a 4-strike cycle controls escalation:
1. **Strikes 1 to 3**:
   - Buyer inputs rejection comments in the UI.
   - Status remains `IN_REVIEW`.
   - SQLite increments `rejectionCount` and stores the feedback text.
   - Seller sees comments and strike progress, and can submit revised code.
2. **Strike 4 (Escalation)**:
   - On the 4th rejection, the Buyer's action triggers an automatic on-chain smart contract call: `raiseDispute(projectId)`.
   - The contract locks funds, and the database status updates to `DISPUTED`.
   - The project is escalated to the **Mandate Arbitration Portal** (`/mandate`).

---

## ⚖️ Mandate Arbitration & AI Advisor Agent

Administrative disputes are arbitrated inside the `/mandate` portal:
1. **Secure Admin Portal**: Restricted to `admin` / `admin123` credentials, and checks that the connected MetaMask account is **Account #0** (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` - contract deployer).
2. **Heuristic AI Arbitration Assistant**: 
   - A deterministic, basic client-side AI analysis agent (`SafeEscrow-Llama-Heuristics-v2`) processes the conflict metadata without requiring costly or unverified external API keys.
   - **Scanning Phase**: Renders a premium spinner while inspecting proof repositories, buyer remarks, and budget details.
   - **Verdict Calculations**:
     - **No Deliverable Proof**: Suggests `REFUND BUYER` (Confidence: 95%).
     - **Severe Keyword Hits** (e.g. *"scam"*, *"fraud"*, *"stolen"*, *"empty"*): Suggests `REFUND BUYER` (Confidence: 80% to 98%).
     - **Minor Refinement Hits** (e.g. *"color"*, *"minor"*, *"styling"*, *"bug"*): Suggests `PAY SELLER` (Confidence: 75% to 92%).
     - **Generic Deliverables**: Recommends `PAY SELLER` (Confidence: 68%).
   - *Final Authority*: The AI advice is advisory. The final final verdict is executed on-chain via `resolveDispute(true/false)` by the Arbitrator.

---

## 🛠️ Step-by-Step Local Deployment & Runbook

### Prerequisites
- Node.js (v18+)
- MetaMask browser extension installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Hardhat Blockchain Node
In a dedicated terminal, run:
```bash
npx hardhat node
```
*Note*: This starts a local network with 10 pre-funded accounts (10,000 ETH each). Keep this running!

### 3. Deploy Smart Contracts
In another terminal, run:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
This deploys the Escrow contract and generates `src/lib/contractData.json` containing the live address and ABI.

### 4. Setup SQLite Database
Initialize migrations and seed the Prisma schema:
```bash
npx prisma db push
```

### 5. Run Web Server
Start the Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` to access the application.

---

## 🧪 Manual Testing Protocol

1. **Verify Balance**: Connect Account #1 or Account #2. Observe the premium live ETH balance dynamically updated at the top right header beside your name badge.
2. **Review Strikes**:
   - Register a Buyer and a Seller. Log in as the Buyer, and assign a project to the Seller's address.
   - Switch to the Seller, submit a deliverable URL (e.g., `https://github.com/freelancer/work`).
   - Log back in as the Buyer, click "Reject Deliverables", and input comments. Observe the strike count and remarks sync immediately.
   - Repeat until Strike 4 triggers MetaMask to execute a dispute.
3. **Run AI Advisor**:
   - Log in to `/mandate` (Credentials: `admin` / `admin123`).
   - Switch MetaMask to **Account #0** (Admin).
   - Locate the disputed project in the queue and click **Assess with AI Agent**.
   - Review the detailed AI analysis logs, recommendation, and confidence score.
   - Click **Release Funds to Seller** or **Refund Buyer** to execute the on-chain payout.
