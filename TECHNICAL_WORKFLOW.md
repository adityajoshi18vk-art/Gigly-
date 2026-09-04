# Gigly — Technical Workflow Overview

> **Compact, single-slide workflow for presentation slides (Landscape).**

```mermaid
flowchart LR
    %% Slide Styling
    classDef step fill:#1E293B,stroke:#38BDF8,stroke-width:2px,color:#F8FAFC;
    classDef branch fill:#0F172A,stroke:#94A3B8,stroke-dasharray: 4 4,color:#E2E8F0;
    classDef success fill:#064E3B,stroke:#10B981,stroke-width:2px,color:#ECFDF5;
    classDef dispute fill:#7F1D1D,stroke:#F43F5E,stroke-width:2px,color:#FFF1F2;

    %% Workflow Steps
    A["<b>1. Auth & ZK-KYC</b><br/>• Social/Web3 Wallet (ERC-4337)<br/>• Anon Aadhaar / ZKPassport<br/>• Zero government PII Stored"]:::step
    --> B["<b>2. Lock Escrow</b><br/>• Client funds USDC<br/>• OptimisticEscrow Vault<br/>• Direct Hire / Open Bounty"]:::step
    --> C["<b>3. Work & Submission</b><br/>• Freelancer accepts gig<br/>• Submits PoW deliverable<br/>• Review window starts"]:::step
    --> D{"<b>Client Review</b><br/>(e.g., 24 hrs)"}:::branch

    %% Happy / Optimistic Path
    D -->|"Approve OR Timeout"| E["<b>4. Release & Reputation</b><br/>• USDC released to Freelancer<br/>• 1% Protocol fee to Treasury<br/>• Mint Soulbound NFT (PoW SBT)"]:::success

    %% Dispute Path
    D -->|"Disputed"| F["<b>5. Jury Resolution</b><br/>• VotingDispute Contract<br/>• Community Jurors Vote<br/>• Fair Fund Split & Contributor SBT"]:::dispute
```

---

### Slide Bullet Points (Quick Speaker Notes)

1. **Auth & Zero-Knowledge KYC**: 
   - Instant onboarding via Google/Email (ERC-4337) or Web3 wallets.
   - Identities validated entirely on-device via **Anon Aadhaar** (India) & **ZKPassport** (Global) using ZK-SNARKs — zero personal data stored.

2. **Smart Escrow Lock**: 
   - Client locks Circle USDC directly into the `OptimisticEscrow` smart contract on Ethereum Sepolia.

3. **Deliverable & Dynamic Review Window**: 
   - Freelancer completes task and submits a verifiable proof-of-work link. Triggers a dynamic countdown timer.

4. **Optimistic Release & Soulbound Reputation**: 
   - Silence equals approval: if no dispute is raised, funds auto-release.
   - Mints a permanent, non-transferable **ERC-721 Soulbound Token (SBT)** as mathematical proof of successful delivery.

5. **Community Dispute Resolution**: 
   - If contested, routed to the `VotingDispute` contract where registered community jurors vote on-chain to decide payouts.
