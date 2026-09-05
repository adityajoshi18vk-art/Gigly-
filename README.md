# Gigly
**Decentralized Escrow, Zero-Knowledge Compliance, and Verifiable Reputation for the Web3 Gig Economy.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Thirdweb](https://img.shields.io/badge/Thirdweb-v5-blue)](https://thirdweb.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-darkgray)](https://soliditylang.org/)
[![ZK-Ready](https://img.shields.io/badge/Privacy-ZK--SNARKs-brightgreen)](#)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald)](#)

---

## ⚠️ The Problem Statement

The traditional freelance gig economy is broken for both freelancers and clients due to three systemic failures:

* **Escrow & Extortionate Fees:** Centralized platforms take cuts of 20% or more from freelancer earnings and reserve the right to freeze funds arbitrarily without transparent dispute resolution. There is zero visibility into how disputes are adjudicated behind closed doors.
* **KYC & Privacy Leaks:** Users are forced to upload raw passport and government ID photos to centralized databases, creating honeypots for identity theft and violating **GDPR** and localized data protection laws like **RBI KYC norms**. Users have zero control over how their identity data is shared, sold, or leaked.
* **Reputation Fraud:** 5-star reviews and portfolio ratings are easily bought, faked, or manipulated through Sybil accounts, making it difficult for clients to trust the profiles they hire. There is no cryptographic link between a review and an actual completed transaction.

---

## 🌟 Core Features

- **Zero-Knowledge Compliance (ZK-KYC)**: Identity validation using ZK-SNARKs (Anon Aadhaar & ZKPassport) without storing PII on-chain or off-chain.
- **Soulbound Token (SBT) Reputation System**: Verifiable on-chain reputation linked to successful escrow settlements via `GiglyCredential.sol`.
- **Dual-Portal Workflow (Client & Freelancer)**: Dedicated tabbed hubs with real-time lifecycle synchronization and historical audit views.
- **Optimistic Smart Escrow**: Dynamically configurable time-locked auto-claims for seamless, dispute-free project resolution.
- **Decentralized Community Dispute Resolution**: Collision dispute handling through on-chain community voting (`VotingDispute.sol`), replacing centralized arbiters, featuring a strict Binding Dispute Protocol (NDC form) for consent.
- **Dynamic Protocol Admin Panel**: Live management of escrow parameters (review window, fees, treasury) via a secured interactive UI restricted exclusively to authorized owner/arbiter wallets.
- **Hybrid High-Performance Discovery**: Supabase PostgreSQL persistence with local JSON fallback for instant talent exploration, coupled with zero-cache real-time blockchain sync.

---

## 🛡️ The Gigly Solution

Gigly leverages zero-knowledge cryptography and decentralized infrastructure to rebuild the gig economy on trustless architecture:

### ⛓️ Smart Contract Escrow (`OptimisticEscrow.sol` & `VotingDispute.sol`)

Immutable payment routing ensures funds are locked securely before work begins. The protocol extracts a minimal platform fee, bypassing the 20% Web2 standard. Escrow parameters are dynamically managed via the **Admin Panel**, and disputes are resolved either by an Arbiter or through **Decentralized Community Voting (Collision Dispute System)**.

| Phase | Description |
|-------|-------------|
| **Fund** | Client locks USDC into the escrow contract with a task description and freelancer address (or `0x0` for open public bounties). |
| **Accept** | For open bounties, any registered freelancer claims the job on-chain. |
| **Submit** | Freelancer submits a proof-of-work deliverable link, triggering a **dynamic review window** (e.g., 3 minutes or 24 hours). |
| **Optimistic Release** | If the client does not dispute within the window, **anyone** can trigger the release — silence equals approval. |
| **Dispute → Voting** | If disputed, it enters the **VotingDispute** system where community members vote on the outcome, earning contributor SBTs for fair participation. |

- **Binding Dispute Protocol**: Before a dispute can be reviewed by a Jury or Admin, both parties must cryptographically sign a consent form (DisputeConsentModal) acknowledging the binding nature of the resolution.
- **Dynamic Protocol Configuration**: Platform fee, treasury wallet, and review windows are fully configurable in real-time via the `/admin` dashboard.
- **Secured Admin Architecture**: The admin route is protected by a strict layout wrapper that verifies the active Thirdweb wallet address against a whitelist of authorized protocol administrators.
| Environment Variable | Required | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | ✅ | Connects the Next.js application to Thirdweb's infrastructure. This client ID powers the Thirdweb React SDK, handling user wallet connections, RPC routing, high-speed IPFS CDN resolution, transaction execution, and smart contract data fetching. |
| `NEXT_PUBLIC_ADMIN_WALLET_ADDRESS` | ✅ | A comma-separated list of authorized wallet addresses that are permitted to access the `/admin` dashboard. Prevents unauthorized users from modifying protocol parameters. |

- **No fund freezes**: Governed by immutable smart contracts, not corporate policy teams.
- **Security**: Built with OpenZeppelin's `ReentrancyGuard`, `Ownable`, and `SafeERC20`.

### 🔐 Zero-Knowledge KYC Gates

Integrating **`@anon-aadhaar/react`** (India) and **`@zkpassport/sdk`** (Global/EU) to verify freelancer identities entirely off-chain. Cryptographic **ZK-SNARK** proofs are generated client-side, ensuring **zero Personally Identifiable Information (PII)** is ever recorded on the blockchain.

| Jurisdiction | Protocol | How It Works |
|---|---|---|
| 🇮🇳 **India** (RBI Compliant) | **[Anon Aadhaar](https://github.com/privacy-scaling-explorations/anon-aadhaar)** by PSE (Ethereum Foundation) | User uploads their Aadhaar QR code. A **Groth16 ZK-SNARK** proof is generated **entirely in the browser** via WebAssembly. The proof attests "this person holds a valid Aadhaar" without revealing name, number, or photo. |
| 🌍 **Global / EU** (GDPR Compliant) | **[ZKPassport](https://zkpassport.id/)** | User taps their **NFC-enabled e-Passport** against their phone. The ZKPassport app reads the ICAO 9303 chip, verifying the government digital signature, and generates a ZK proof — all **client-side**. No PII is transmitted. |

> **🔒 Zero-Knowledge Guarantee:** Gigly is compliant with **GDPR Article 25** (Data Protection by Design), **FATF Travel Rule**, **eIDAS**, and **RBI KYC norms** — because zero data stored means zero data to breach.

### 🏅 Soulbound NFTs (SBTs) & Verifiable Credentials

Reputation on Gigly is mathematically verifiable and backed by **Soulbound Tokens (SBTs)** — non-transferable ERC-721 tokens acting as permanent Proof-of-Work certificates.

1. **`GiglyCredential.sol` Smart Contract**: Custom ERC-721 contract specifically modified to be completely non-transferable. Freelancers cannot sell, transfer, or trade their earned reputation. Dual-minter permissions enable both `OptimisticEscrow` and `VotingDispute` to mint credentials upon settlement.
2. **Metadata via IPFS**: When a job is settled, a credential is minted to the freelancer's wallet. The token URI points to decentralized storage (IPFS), containing metadata about the completed gig (job title, skills used, client address, and timestamp).
3. **Frontend Integration (`Credentials.tsx`)**:
   - Queries `GiglyCredential` to retrieve all `tokenId`s owned by the connected freelancer (`getTokensByFreelancer(address)`).
   - Resolves IPFS metadata via **Thirdweb's high-performance IPFS CDN** (`resolveScheme`). This completely bypasses the rate limits and timeouts associated with public gateways like `ipfs.io`.
   - Renders interactive Credential Cards complete with direct links to Ethereum Sepolia Etherscan.
4. **W3C Decentralized Identifiers (DIDs)**: Each connected wallet is assigned a `did:ethr` identifier anchored to Sepolia (`did:ethr:sepolia:{wallet_address}`).
5. **Sybil Resistance**: Since the SBT is only minted in tandem with a successful `FundsReleased` event, **fake reviews are mathematically impossible**.

---

## 🏗️ System Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           Gigly — Execution Flow                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌───────────────────┐     ┌───────────────────────┐
  │  1. CONNECT  │     │  2. ZK-KYC GATE   │     │    3. LOCK ESCROW     │
  │              │────▶│                   │────▶│                       │
  │  Wallet      │     │  Anon Aadhaar 🇮🇳  │     │  Client deposits USDC │
  │  (Thirdweb)  │     │  ZKPassport   🌍  │     │  to OptimisticEscrow  │
  │  • In-App    │     │                   │     │  on Sepolia Testnet   │
  │    Email/OTP │     │  ZK-SNARK proof   │     │                       │
  │  • External  │     │  generated on     │     │  (Direct Assign OR    │
  │    Web3      │     │  device (Zero PII)│     │   Open Public Bounty) │
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
  │  • FundsReleased tx hash ──▶ Verified on Etherscan                   │
  │  • GiglyCredential.mint  ──▶ Soulbound PoW NFT (IPFS metadata)       │
  │  • Honest Voters         ──▶ +Contributor SBT Minted                 │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Portal Structure & Tab Functionality

The platform is divided into two tailored dashboards with scoped role views:

### 💼 Client Hub (`/client`)
1. **Active Jobs**: Displays all jobs funded by the connected client that are in progress (`status: Funded (1)`, `Submitted (2)`, or `Disputed (3)`). Only the hiring client has action capabilities (Approve & Release, Raise Admin Dispute, Raise Jury Dispute).
2. **Past Jobs**: Completed historical archive for the client (`status: Released (4)` or `Refunded (5)`). Displays amount, deliverable link, counterparty freelancer name, and Etherscan transaction links.
3. **Browse Freelancers**: Talent marketplace powered by Supabase with live search and verified talent filters (Anon Aadhaar / ZKPassport flags). Allows instant hiring via `CreateJobModal`.
4. **Public Gigs**: Read-only transparency view of all open unassigned bounties (`freelancer: 0x0`, `status: Funded`) awaiting talent pickup.

### 🛠️ Freelancer Hub (`/freelancer`)
1. **Active Jobs**: Gigs assigned to the connected freelancer currently in progress or review (`status: 1, 2, or 3`). Includes deliverable link submission, milestone logging, and optimistic claim actions.
2. **Past Jobs**: Archive of settled or refunded gigs for the freelancer with release confirmation receipts.
3. **Browse Gigs**: Marketplace of open unassigned bounties. Freelancers can view budget, brief, and click **Accept Gig** to lock assignment.
4. **Earnings**: Real-time escrow volume, settled earnings, and pending disbursements with fiat currency conversions.
5. **Credentials**: Soulbound NFT credentials gallery loaded directly from `GiglyCredential.sol` and resolved via IPFS.

---

## ⚡ Real-Time Data Pipeline & Cache-Busting Architecture

To ensure instant UI updates across counterparties while eliminating stale blockchain reads, Gigly implements a multi-layer state synchronization architecture:

```
[ Sepolia Blockchain ] ──▶ [ /api/jobs (force-dynamic, revalidate: 0) ]
                                    │ Fresh client per request
                                    ▼
[ Browser sessionStorage ] ◀── [ useJobs Hook ] ──▶ [ Client & Freelancer Hubs ]
  (15s Timestamp TTL)              ▲
                                   │ On Tx / ↺ Click
                          clearJobsCache()
```

1. **`api/jobs/route.ts`**:
   - Enforces `export const dynamic = "force-dynamic"` and `export const revalidate = 0`.
   - Creates a **fresh Thirdweb client and contract instance per request** to circumvent internal RPC client-level memoization.
   - Sends explicit HTTP response headers: `Cache-Control: no-store, no-cache, must-revalidate`.
2. **`useJobs.ts` Client Hook**:
   - Cache-busting queries (`/api/jobs?t=${Date.now()}`) with `cache: "no-store"` guarantee fresh network requests.
   - Enforces a **15-second TTL** on local `sessionStorage` to ensure cross-user job updates reflect automatically without manual refreshes.
   - Exports `clearJobsCache()` called before every contract state transition across `ActiveJobs`, `IncomingJobs`, `BrowseGigs`, and `CreateJobModal`.
3. **Manual Refresh Trigger**:
   - Dedicated **Refresh (↺)** buttons located in both the Client and Freelancer headers allow users to immediately bypass local cache and pull real-time on-chain data.

---

## 📦 Smart Contracts & Addresses (Ethereum Sepolia)

| Contract | Address | Explorer | Description |
| :--- | :--- | :--- | :--- |
| **`OptimisticEscrow`** | `0xc14cAC4CbaE8954E3bd71A04399193f099c8b451` | [Etherscan](https://sepolia.etherscan.io/address/0xc14cAC4CbaE8954E3bd71A04399193f099c8b451) | Core escrow contract |
| **`GiglyCredential`** | `0x7CbC2961526453E48154Bc5A045bc254Eb61B46C` | [Etherscan](https://sepolia.etherscan.io/address/0x7CbC2961526453E48154Bc5A045bc254Eb61B46C) | Soulbound ERC-721 PoW NFTs |
| **`VotingDispute`** | `0xA963219334f02d23c6e041e1d4af1491a2eF89D0` | [Etherscan](https://sepolia.etherscan.io/address/0xA963219334f02d23c6e041e1d4af1491a2eF89D0) | Community jury voting dispute resolution |
| **`FreelancerRegistry`** *(Legacy)* | `0xd78CF42205dE581c06bFBc28928F20898B244eDA` | [Etherscan](https://sepolia.etherscan.io/address/0xd78CF42205dE581c06bFBc28928F20898B244eDA) | On-chain registry (migrated to Supabase) |
| **`USDC` (Circle)** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | [Etherscan](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238) | Official Circle Testnet USDC |
| **Chainlink EUR/USD** | `0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910` | [Etherscan](https://sepolia.etherscan.io/address/0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910) | Chainlink price aggregator |
| **Mock INR/USD Feed** | `0x89f3a73ac523f236804867B8Eca75Da2d5324C86` | [Etherscan](https://sepolia.etherscan.io/address/0x89f3a73ac523f236804867B8Eca75Da2d5324C86) | Custom INR/USD price aggregator |

---

## 💻 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript | Server and Client components with Tailwind CSS & Framer Motion |
| **Web3 SDK** | **Thirdweb v5 SDK** (`thirdweb@^5.121.1`) | In-app social wallets (Email OTP, Google), ERC-4337 Smart Accounts, and sponsored gas |
| **Zero-Knowledge KYC** | `@anon-aadhaar/react` v2.4, `@zkpassport/sdk` v0.16 | Client-side Groth16 ZK-SNARK proof generation with zero PII exposure |
| **Database & API** | **Supabase** (`@supabase/supabase-js ^2.115.0`) | PostgreSQL talent directory with local JSON fallback |
| **Smart Contracts** | Solidity 0.8.24, Hardhat 3, OpenZeppelin 5.x | `OptimisticEscrow`, `GiglyCredential`, `VotingDispute` on Ethereum Sepolia |
| **Settlement Currency** | Circle Testnet USDC | Official Circle ERC-20 (`0x1c7D...7238`) |
| **Oracles** | Chainlink Price Feeds | Live EUR/USD and INR/USD currency conversion |
| **Decentralized Storage** | IPFS | Proof-of-Work metadata pinning & token URI resolution |

---

## 🚀 Local Setup & Installation

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A Thirdweb Client ID ([get one free](https://thirdweb.com/dashboard))
- Supabase Project URL and Service Role Key ([Supabase Dashboard](https://supabase.com))

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/adityajoshi18vk-art/Gigly-.git
cd Gigly-
```

### 2️⃣ Install Frontend Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

> **⚠️ Why `--legacy-peer-deps`?**  
> Anon Aadhaar ZK circuit packages (`@anon-aadhaar/core`, `@anon-aadhaar/react`) require `--legacy-peer-deps` due to strict React 18 resolution. Circuits function with 100% stability at runtime.

### 3️⃣ Configure Environment Variables
Create `frontend/.env.local`:
```env
# Thirdweb Client ID
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Supabase (Talent Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4️⃣ Set Up Supabase Database (SQL)
Run the migration script located at `frontend/supabase/schema.sql` in your Supabase SQL Editor to create the `freelancers` table, indexes, and Row Level Security policies.

### 5️⃣ Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to launch Gigly.

---

## 🧪 Testing & Demo Guide

Testing uses Account Abstraction (ERC-4337) and Thirdweb In-App Wallets. Smart accounts map 1:1 to email addresses; use separate browser windows or incognito sessions when testing multiple roles simultaneously.

### Test Accounts
- **Client:** `giglytest1@yopmail.com`
- **Freelancer:** `giglytest2@yopmail.com`
- **Admin / Voter:** `giglytest3@yopmail.com`
*(Check OTPs at [yopmail.com](https://yopmail.com))*

### End-to-End Walkthrough

#### 1. Client: Post a Job
1. Sign in at `http://localhost:3000` with `giglytest1@yopmail.com` and select **"I'm hiring"**.
2. Click **Post Open Job** or pick a profile from **Browse Freelancers**.
3. Input task title, budget in USDC, approve USDC allowance, and confirm escrow creation.
4. Job immediately appears in the client's **Active Jobs** tab.

#### 2. Freelancer: Accept & Submit Deliverable
1. Sign in on a separate window with `giglytest2@yopmail.com` and select **"I'm working"**.
2. In **Active Jobs** (or **Browse Gigs** for public bounties), click **Submit Work**.
3. Provide the deliverable URL. The status updates to **Submitted**, starting the dynamic review window.

#### 3. Client: Approval & Payout
1. In the Client window, review the submitted deliverable under **Active Jobs**.
2. Click **Approve & Release**.
3. USDC is released to the freelancer's wallet, protocol fees are sent to the treasury, and an ERC-721 Soulbound PoW NFT is minted to the freelancer.
4. The job moves cleanly to both parties' **Past Jobs** tabs.

#### 4. Dispute Resolution (Optional)
1. If the deliverable is unsatisfactory, click **Raise Dispute**.
2. Confirm the Pre-Dispute Consent Modal and select Arbiter or Community Jury.
3. If routed to community jury, voters sign in to vote in `/disputes` (e.g. `giglytest3@yopmail.com`), triggering on-chain majority distribution and awarding `+Contributor` SBTs to participating jurors.

### Testing the Dynamic Admin Panel

#### 1. Admin: Configure Escrow Parameters
1. Open a new window and navigate directly to `http://localhost:3000/admin`.
2. Ensure you are signed in with an authorized admin wallet (e.g., `giglytest3@yopmail.com` which maps to the whitelisted Arbiter address, or the Deployer address).
3. If unauthorized, the app will instantly render a "🛑 Unauthorized: Admin Access Only" screen.
4. If authorized, you will see the **Protocol Configuration Dashboard**.
5. Change the **Review Window** (e.g., from 24 Hours to 3 Minutes) to accelerate testing of Optimistic Auto-Claims.
6. Modify the **Platform Fee** percentage dynamically.
7. These updates are immediately broadcast on-chain and reflect across all dashboards.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👥 Team FinNova (Smart Horizon 2026 Hackathon)

- **Aditya Joshi** (Team Lead)
- **Daiwik Roy**
- **Saswat Dutta**
- **Puvaladas Sai Vaibhav**
- **Shaik Fariza**
