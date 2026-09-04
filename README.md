# Gigly
**Decentralized Escrow, Zero-Knowledge Compliance, and Verifiable Reputation for the Web3 Gig Economy.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Thirdweb](https://img.shields.io/badge/Thirdweb-v5-blue)](https://thirdweb.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-darkgray)](https://soliditylang.org/)
[![ZK-Ready](https://img.shields.io/badge/Privacy-ZK--SNARKs-brightgreen)](#)

---

## ⚠️ The Problem Statement:

The traditional freelance gig economy is broken for both freelancers and clients due to three systemic failures:

* **Escrow & Extortionate Fees:** Centralized platforms take cuts of 20% or more from freelancer earnings and reserve the right to freeze funds arbitrarily without transparent dispute resolution. There is zero visibility into how disputes are adjudicated behind closed doors.
* **KYC & Privacy Leaks:** Users are forced to upload raw passport and government ID photos to centralized databases, creating honeypots for identity theft and violating **GDPR** and localized data protection laws like **RBI KYC norms**. Users have zero control over how their identity data is shared, sold, or leaked.
* **Reputation Fraud:** 5-star reviews and portfolio ratings are easily bought, faked, or manipulated through Sybil accounts, making it difficult for clients to trust the profiles they hire. There is no cryptographic link between a review and an actual completed transaction.

---

## 🌟 Core Features

- **Zero-Knowledge Compliance (ZK-KYC)**: Identity validation using ZK-SNARKs without storing PII on-chain or off-chain.
- **Soulbound Token (SBT) Reputation System**: Verifiable on-chain reputation linked to successful escrow settlements.
- **Escrow-Gated Deliverable Sandbox**: Source code and deliverables remain locked and watermarked until escrow is settled.
- **Optimistic Smart Escrow**: Dynamically configurable time-locked auto-claims for seamless, dispute-free project resolution.
- **Decentralized Community Dispute Resolution**: Collision dispute handling through on-chain community voting, replacing centralized arbiters.
- **Dynamic Protocol Admin Panel**: Live management of escrow parameters (review window, fees, treasury) via an interactive UI without requiring contract upgrades.

---

## 🛡️ The Gigly Solution

Gigly leverages zero-knowledge cryptography and decentralized infrastructure to rebuild the gig economy on trustless architecture:

### ⛓️ Smart Contract Escrow (`OptimisticEscrow.sol` & `VotingDispute.sol`)

Immutable payment routing ensures funds are locked securely before work begins. The protocol extracts a minimal platform fee, bypassing the 20% Web2 standard. Escrow parameters are dynamically managed via the **Admin Panel**, and disputes are resolved either by an Arbiter or through **Decentralized Community Voting (Collision Dispute System)**.

| Phase | Description |
|-------|-------------|
| **Fund** | Client locks USDC into the escrow contract with a task description and freelancer address. |
| **Submit** | Freelancer submits a proof-of-work link, triggering a **dynamic review window** (e.g., 3 minutes or 24 hours). |
| **Optimistic Release** | If the client does not dispute within the window, **anyone** can trigger the release — silence equals approval. |
| **Dispute → Voting** | If disputed, it enters the **VotingDispute** system where community members vote on the outcome, earning contributor SBTs for fair participation. |

- **Dynamic Protocol Configuration**: Platform fee, treasury wallet, and review windows are fully configurable in real-time by admins.
- **No fund freezes**: The contract is governed by immutable code, not a corporate policy team.
- **Security**: Built with OpenZeppelin's `ReentrancyGuard`, `Ownable`, and `SafeERC20`.

### 🔐 Zero-Knowledge KYC Gates

Integrating **`@anon-aadhaar/react`** (India) and **`@zkpassport/sdk`** (Global/EU) to verify freelancer identities entirely off-chain. Cryptographic **ZK-SNARK** proofs are generated client-side, ensuring **zero Personally Identifiable Information (PII)** is ever recorded on the blockchain.

| Jurisdiction | Protocol | How It Works |
|---|---|---|
| 🇮🇳 **India** (RBI Compliant) | **[Anon Aadhaar](https://github.com/privacy-scaling-explorations/anon-aadhaar)** by PSE (Ethereum Foundation) | User uploads their Aadhaar QR code. A **Groth16 ZK-SNARK** proof is generated **entirely in the browser** via WebAssembly. The proof attests "this person holds a valid Aadhaar" without revealing name, number, or photo. |
| 🌍 **Global / EU** (GDPR Compliant) | **[ZKPassport](https://zkpassport.id/)** | User taps their **NFC-enabled e-Passport** against their phone. The ZKPassport app reads the ICAO 9303 chip, verifying the government digital signature, and generates a ZK proof — all **client-side**. No PII is transmitted. |

> **🔒 Zero-Knowledge Guarantee:** Gigly is compliant with **GDPR Article 25** (Data Protection by Design), **FATF Travel Rule**, **eIDAS**, and **RBI KYC norms** — because zero data stored means zero data to breach.

### 🏅 Soulbound NFTs (SBTs) & Verifiable Credentials

Reputation on Gigly is mathematically verifiable and backed by **Soulbound Tokens (SBTs)** — non-transferable NFTs acting as permanent Proof-of-Work. 

Additionally, community members who participate in resolving collision disputes are rewarded with **+Contributor SBTs**.

#### How It Works Under the Hood:

1. **`GiglyCredential.sol` Smart Contract**: We deployed a custom ERC-721 contract specifically for reputation. It is heavily modified to be completely non-transferable (a Soulbound Token), ensuring that freelancers cannot sell, transfer, or trade their earned reputation.
2. **Metadata via IPFS**: When a job is completed and escrow is settled, a credential is minted to the freelancer's wallet. The token URI points to decentralized storage (IPFS), containing metadata about the completed gig (e.g., job title, skills used, client address, and timestamp).
3. **Frontend Integration (`Credentials.tsx`)**:
   - The UI utilizes Thirdweb's `useReadContract` to directly query the SBT contract and retrieve an array of `tokenId`s owned by the connected freelancer via the `getTokensByFreelancer(address)` function.
   - For each token, the `tokenURI(uint256)` is fetched and resolved via an HTTP IPFS gateway (`https://ipfs.io/ipfs/...`).
   - The UI then visually renders these NFTs as glowing, interactive "Credential Cards," parsing the JSON metadata to dynamically display the gig attributes and descriptions.
4. **W3C Decentralized Identifiers (DIDs)**: Each connected wallet is assigned a `did:ethr` identifier anchored to the Sepolia Testnet (`did:ethr:sepolia:{wallet_address}`).
5. **Sybil Resistance**: Since the SBT is only minted in tandem with a successful `FundsReleased` event via the `OptimisticEscrow` contract, **fake reviews are structurally and mathematically impossible**. You cannot fabricate a reputation NFT without actual USDC changing hands on-chain.

---

## 🏗️ System Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Gigly — User Journey                          │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌───────────────────┐     ┌───────────────────────┐
  │  1. CONNECT  │     │  2. ZK-KYC GATE   │     │  3. LOCK ESCROW      │
  │              │────▶│                   │────▶│                       │
  │  Wallet      │     │  Anon Aadhaar 🇮🇳  │     │  Client sends USDC   │
  │  (Thirdweb)  │     │  ZKPassport   🌍  │     │  to OptimisticEscrow  │
  │              │     │                   │     │  on Sepolia Testnet   │
  │  • MetaMask  │     │  ZK-SNARK proof   │     │                       │
  │  • Coinbase  │     │  generated in     │     │  Funds locked in      │
  │  • Google    │     │  browser/device   │     │  smart contract       │
  │  • Email OTP │     │  (Zero PII)       │     │                       │
  └──────────────┘     └───────────────────┘     └───────────┬───────────┘
                                                             │
                                                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  4. GIG LIFECYCLE                                                    │
  │                                                                      │
  │  Funded ──▶ Freelancer Submits Work ──▶ Dynamic Review Window Starts │
  │                                              │                       │
  │                              ┌───────────────┴───────────────┐       │
  │                              ▼                               ▼       │
  │                     No Dispute?                      Disputed?       │
  │                     ──────────                       ─────────       │
  │                     Optimistic Release         Community Voting      │
  │                     (anyone can trigger)     (VotingDispute System)  │
  │                              │                               │       │
  │                              └───────────────┬───────────────┘       │
  │                                              ▼                       │
  │                                    FundsReleased Event               │
  └──────────────────────────────────────────────┬───────────────────────┘
                                                 │
                                                 ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  5. VC MINTING & REPUTATION                                          │
  │                                                                      │
  │  • FundsReleased tx hash ──▶ Latest VC Proof Hash                    │
  │  • On-chain job stats    ──▶ Trust Score (verified / total × 100)    │
  │  • Honest Voters         ──▶ +Contributor SBT Minted                 │
  │                                                                      │
  │  Reputation is ONLY derived from successful escrow settlements.      │
  │  No escrow release = no credential = no fake reviews. Period.        │
  └──────────────────────────────────────────────────────────────────────┘
```

### 🔄 Oracle Price Feed Integration

Gigly uses **Chainlink-compatible price feeds** for real-time fiat-to-crypto conversion within the escrow UI:

| Feed | Address (Sepolia) | Purpose |
|------|-------------------|---------|
| EUR/USD | `0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910` | Euro conversion for EU freelancers |
| INR/USD | `0x89f3a73ac523f236804867B8Eca75Da2d5324C86` | INR conversion for Indian freelancers (custom MockINRFeed) |

---

## ⚙️ Environment Configuration & Infrastructure

Gigly relies on a split environment architecture between the Next.js frontend client and the Solidity smart contract backend.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | ✅ | Connects the Next.js application to Thirdweb's infrastructure. This client ID powers the Thirdweb React SDK, handling user wallet connections, RPC routing, transaction execution, and smart contract data fetching without requiring users to configure manual node connections. |

### Smart Contracts (`contracts/.env`)

The blockchain architecture uses public Remote Procedure Call (RPC) nodes to interact with multiple testnets without relying on premium external API services like Alchemy or Infura.

| Variable | Description |
|----------|-------------|
| `AMOY_RPC_URL` | Connects to the Polygon Amoy testnet via the Publicnode API (`https://polygon-amoy-bor-rpc.publicnode.com`). |
| `SEPOLIA_RPC_URL` | Connects to the Ethereum Sepolia testnet via the Publicnode API (`https://ethereum-sepolia-rpc.publicnode.com`). |
| `BASE_SEPOLIA_RPC_URL` | Connects to the Base Sepolia testnet via the official Base endpoint (`https://sepolia.base.org`). |
| `DEPLOYER_PRIVATE_KEY` | The private key of the test wallet responsible for paying gas fees and deploying the `OptimisticEscrow.sol` smart contract. **⚠️ Must be a testnet-only wallet. Never use a wallet containing real funds.** |
| `ARBITER_ADDRESS` | The designated wallet address acting as the third-party judge to resolve gig disputes between clients and freelancers. |

---

## 🏛️ Technical Architecture

- **Frontend**: Next.js 14
- **Web3 Integrations**: Thirdweb v5
- **Smart Contracts**: Solidity
- **Framework & Security**: OpenZeppelin v5 (specifically `OptimisticEscrow.sol`, `GiglyCredential.sol`, and `VotingDispute.sol`)

---

## 💻 Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS | Server components + client interactivity. Inter font via Google Fonts. |
| **Web3 / Auth** | **Thirdweb v5 SDK** | Wallet connection (MetaMask, Coinbase, Google, Email OTP), ERC-4337 Smart Accounts with **gasless (sponsored) transactions**. |
| **Privacy / KYC** | `@anon-aadhaar/react` v2.4 (PSE), `@zkpassport/sdk` v0.16 | Client-side ZK-SNARK proof generation. No backend KYC server. |
| **Smart Contracts** | Solidity 0.8.24, Hardhat 3, OpenZeppelin 5.x | `OptimisticEscrow.sol` deployed on **Ethereum Sepolia Testnet**. Uses `SafeERC20`, `ReentrancyGuard`, `Ownable`. |
| **Payment Token** | Circle Testnet USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` — [Circle Faucet](https://faucet.circle.com/) |
| **Oracles** | Chainlink Price Feeds (+ custom `MockINRFeed`) | Real-time USD/EUR/INR conversion for multi-currency escrow display. |
| **DID Standard** | `did:ethr` (W3C DID Specification) | Decentralized Identifiers anchored to Ethereum addresses. |
| **Networks** | Ethereum Sepolia, Base Sepolia, Polygon Amoy | Multi-chain testnet infrastructure. |

### 📦 Key Dependencies

```
Frontend:  next@14 · thirdweb@5 · @anon-aadhaar/react · @zkpassport/sdk · lucide-react · react-qr-code · tailwind-merge
Contracts: hardhat@3 · @openzeppelin/contracts@5 · @chainlink/contracts · ethers@6
```

---

## 🚀 Local Setup & Installation

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A Thirdweb Client ID ([get one free](https://thirdweb.com/dashboard))

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/gigly.git
cd gigly
```

### 2️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

> **⚠️ Why `--legacy-peer-deps`?**
> The Anon Aadhaar ZK circuit packages (`@anon-aadhaar/core`, `@anon-aadhaar/react`) have peer dependency conflicts with React 18's strict resolution. The `--legacy-peer-deps` flag is **required** to install these packages correctly. The ZK circuits function normally at runtime.

### 3️⃣ Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Gigly Frontend — Environment Variables
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
```

### 4️⃣ Next.js Configuration Note

> **⚙️ `reactStrictMode: false` is required.**
> The ZK-SNARK proof generation in Anon Aadhaar relies on **Web Workers** and **WebAssembly** modules that are incompatible with React Strict Mode's double-invocation behavior. `next.config.mjs` is pre-configured with `reactStrictMode: false` and a custom **Content-Security-Policy** header that allows `blob:` and `unsafe-eval` for Web Worker execution. Do not modify these settings.

### 5️⃣ Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access Gigly.

### 6️⃣ Smart Contracts (Optional)

If you need to redeploy or modify the escrow contracts:

```bash
cd contracts
npm install
```

Create a `.env` file in the `contracts/` directory:

```env
AMOY_RPC_URL=https://polygon-amoy-bor-rpc.publicnode.com
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
ARBITER_ADDRESS=0xYourArbiterAddress
```

> **⚠️ Security:** Never commit `.env` files. The `DEPLOYER_PRIVATE_KEY` should be a **testnet-only wallet** with Sepolia ETH for gas. Never use a wallet containing real funds.

---

## 📁 Project Structure

```
gigly/
├── frontend/                       # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                # Next.js API Routes (ZKPassport integration)
│   │   │   ├── client/             # Client dashboard (create jobs, fund escrow)
│   │   │   ├── freelancer/         # Freelancer dashboard (browse, submit, earn)
│   │   │   ├── admin/              # Dynamic Protocol Admin Panel
│   │   │   └── layout.tsx          # Root layout (ThirdwebProvider + AnonAadhaarWrapper)
│   │   ├── components/
│   │   │   ├── landing/            # 🎨 New immersive landing page (HeroSection, InteractiveProcess, etc.)
│   │   │   ├── ui/                 # 🧩 Reusable design system elements (PixelCard, Buttons, Modals, Tabs)
│   │   │   ├── KYCModal.tsx        # 🔐 ZK-KYC Gate (Anon Aadhaar + ZKPassport)
│   │   │   ├── DIDTrustCard.tsx    # 🆔 W3C DID & Verifiable Credentials display
│   │   │   ├── Credentials.tsx     # 🏅 Soulbound NFT Credentials Display
│   │   │   ├── CreateJobModal.tsx  # 💼 Escrow creation with currency conversion
│   │   │   ├── ActiveJobs.tsx      # 📋 Job lifecycle tracking
│   │   │   ├── IncomingJobs.tsx    # 📥 Freelancer job queue
│   │   │   ├── Earnings.tsx        # 💰 Earnings dashboard with oracle feeds
│   │   │   └── VotingDisputeUi.tsx # 🗳️ Community Collision Dispute System UI
│   │   └── lib/
│   │       ├── config.ts           # Chain, contract, wallet & oracle configuration
│   │       └── constants.ts        # App-wide constants
│   └── .env.local                  # Environment variables (not committed)
│
├── contracts/                      # Hardhat 3 Smart Contracts
│   ├── contracts/
│   │   ├── OptimisticEscrow.sol    # ⛓️ Core escrow contract
│   │   ├── VotingDispute.sol       # 🗳️ Community collision dispute contract
│   │   ├── GiglyCredential.sol     # 🏅 SBT credential contract
│   │   ├── MockUSDC.sol            # 🪙 ERC-20 mock for local testing
│   │   └── MockINRFeed.sol         # 📊 Chainlink-style INR/USD price feed
│   ├── scripts/                    # Deployment & migration scripts
│   ├── hardhat.config.ts           # Network config (Sepolia, Amoy, Base Sepolia)
│   └── .env                        # RPC URLs & deployer key (not committed)
│
└── README.md
```

---

## 🧑‍⚖️ Hackathon Rubric Alignment

> **For the Judges:** Here's how Gigly maps to the core hackathon evaluation criteria.

### ⛓️ Web3 Architecture — Fully On-Chain

| Criterion | Gigly Implementation |
|-----------|----------------------|
| On-chain logic | `OptimisticEscrow.sol` & `VotingDispute.sol` — all escrow state, dispute voting, and parameters are **100% on-chain**. No off-chain relayers or centralized backends. |
| Decentralized frontend | Next.js app reads directly from the blockchain via Thirdweb SDK. No proprietary API layer. |
| Gasless UX | ERC-4337 Smart Accounts with **sponsored gas** via Thirdweb — users never need to hold ETH. |
| Token standard | Uses **Circle's official USDC** on Sepolia — not a custom token. |

### 🔐 Privacy & Compliance — FATF / RBI / GDPR

| Regulation | How Gigly Complies |
|------------|---------------------|
| **GDPR Article 25** — Data Protection by Design | ZK-SNARKs ensure **zero PII** is stored on-chain or on any server. Proof generation happens entirely in the user's browser (Anon Aadhaar) or on-device (ZKPassport). |
| **FATF Travel Rule** | Identity is **verified** (proof of valid government ID) without **transmitting** identity data between counterparties. |
| **RBI KYC Norms** (India) | Anon Aadhaar verifies Aadhaar credentials via the official UIDAI digital signature — same cryptographic root of trust as DigiLocker. |
| **eIDAS** (EU) | ZKPassport reads the ICAO 9303 NFC chip in EU e-Passports, verifying the government digital signature without extracting personal fields. |

### 🛡️ Fraud Reduction — Sybil-Resistant Reputation

| Attack Vector | Gigly Defense |
|----------------|----------------|
| **Fake reviews** | Impossible. Verifiable Credentials are only derived from `FundsReleased` events — requires actual USDC to change hands on-chain. |
| **Sybil accounts** | ZK-KYC gates ensure one real identity = one verified wallet. Creating 100 wallets doesn't create 100 verified identities. |
| **Rating manipulation** | Trust Score = `(released gigs / total completed gigs) × 100`. Computed deterministically from immutable on-chain state. No human moderation. |
| **Proof hash forgery** | Each VC proof hash is a real Ethereum `transactionHash` — verifiable by anyone on Etherscan. |

---

## 🔐 Security & Trust Assumptions

- **Deliverable Protection**: The UI strictly hides raw final deliverables and source code links behind an escrow gate until final settlement is completed.
- **Anti-Spoofing Auto-Claims**: In the event of an expired review window, a fallback URI is utilized to ensure seamless auto-claims, preventing malicious clients from indefinitely stalling releases.
- **Democratic Collision Resolution**: Collisions are handled via the VotingDispute module, ensuring no single entity (not even the protocol admins) can unilaterally freeze or extract funds.

---

## 🧪 Testing & Demo Guide

This section outlines the standard end-to-end testing flow for Gigly, utilizing Account Abstraction (ERC-4337) and Thirdweb In-App Wallets.

Because the platform relies on smart accounts that map 1:1 to email addresses, it's recommended to use different incognito windows or different browsers when testing multiple roles simultaneously.

### Test Accounts

* **Client:** `giglytest1@yopmail.com`
* **Freelancer:** `giglytest2@yopmail.com`
* **Admin / Voter:** `giglytest3@yopmail.com`

> **Note:** OTPs for these accounts can be checked at [yopmail.com](https://yopmail.com).

### Testing the Happy Path (Create, Submit, Approve)

#### 1. Client: Create a Job
1. Navigate to `http://localhost:3000`
2. Click **Sign In to Gigly** and enter `giglytest1@yopmail.com`. Enter the OTP sent to Yopmail.
3. If prompted, select **"I'm hiring"** (Client Role).
4. On the Client Dashboard, go to the **Browse Freelancers** tab.
5. Click on **Giglytest Freelancer** (This profile is hardcoded to route funds to the `giglytest2` smart account).
6. Enter a Task Title (e.g., "Build Landing Page") and an Amount (e.g., "50").
7. Click **Create Job**.
8. Once successful, the job will appear in the **Active Jobs** tab.

#### 2. Freelancer: Submit Work
1. Open a new Incognito Window and navigate to `http://localhost:3000`.
2. Sign in with `giglytest2@yopmail.com` and select **"I'm working"** (Freelancer Role).
3. On the Freelancer Dashboard, go to **Incoming Tasks**.
4. You should see the job created by the client. Click **Submit Work**.
5. Enter a mock URL (e.g., `https://github.com/...`) and confirm.
6. The job status will update to "Submitted".

#### 3. Client: Approve & Release
1. Return to the Client window (`giglytest1@yopmail.com`).
2. Navigate to **Active Jobs**.
3. You will see the Freelancer's submitted link.
4. Click **Approve & Release**.
5. The smart contract will immediately release the USDC to the freelancer's smart account.

### Testing the Collision Dispute (Community Voting) Flow

#### 1. Client: Raise a Dispute
1. Repeat steps 1 & 2 from the Happy Path to create and submit a new job.
2. As the Client (`giglytest1@yopmail.com`), go to **Active Jobs**.
3. Instead of approving, click **Raise Dispute**.
4. Enter a reason (e.g., "The design does not match the Figma file") and submit.
5. The job enters the **VotingDispute** system.

#### 2. Community: Vote on Dispute
1. Open a new window and sign in as a community voter (e.g. `giglytest3@yopmail.com`).
2. Navigate to the **Active Disputes / Community Resolution** area.
3. Review the Freelancer's submission and the Client's dispute reason.
4. Cast your vote (e.g., "Favor Client" or "Favor Freelancer").
5. Upon conclusion, the smart contract enacts the community consensus. Honest voters are rewarded with a `+Contributor` SBT credential for participating.

### Testing the Dynamic Admin Panel

#### 1. Admin: Configure Escrow Parameters
1. Open a new window and navigate directly to `http://localhost:3000/admin`.
2. Ensure you are signed in with the contract owner/deployer wallet.
3. You will see the **Protocol Configuration Dashboard**.
4. Change the **Review Window** (e.g., from 24 Hours to 3 Minutes) to accelerate testing of Optimistic Auto-Claims.
5. Modify the **Platform Fee** percentage dynamically.
6. These updates are immediately broadcast on-chain and reflect across all dashboards.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with 🔐 by the Gigly Team**

*Trustless escrows. Zero-knowledge compliance. Verifiable reputation.*
*The future of work is decentralized.*

</div>

---

## 👥 Team FinNova (Smart Horizon 2026 Hackathon)

- Aditya Joshi (Team Lead)
- Daiwik Roy
- Saswat Dutta
- Puvaladas Sai Vaibhav
- Shaik Fariza
