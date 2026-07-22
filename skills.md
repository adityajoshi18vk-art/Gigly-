# Gigly - Implementation Details & Technical Schema

## Tech Stack
- **Blockchain**: Polygon Amoy Testnet (MVP) -> Polygon Mainnet.
- **Smart Contracts**: Solidity 0.8.24, Hardhat, OpenZeppelin.
- **Oracles**: Chainlink AggregatorV3Interface (EUR/USD), open.er-api.com (INR fallback).
- **Auth/Wallets**: Thirdweb in-app wallet, ERC-4337 Account Abstraction.
- **Frontend**: Next.js, React SDK v5 (Thirdweb).
- **Backend/Off-chain**: Lightweight store (Firestore or flat JSON).

## On-chain Schema (Source of Truth)
- `Job`: client address, freelancer address, amount (locked USDC), releasedAmount, submittedAt, status (None, Funded, Submitted, Disputed, Released, Refunded).

## Off-chain Schema (Display Metadata)
- `users`: wallet_address (PK), role (Client/Freelancer), display_name, skill_tags, created_at.
- `tasks`: job_id (FK), title, description, created_at.
- `disputes`: job_id (FK), raised_by, resolution_amount, resolved_at, arbiter_address.

## Build Phases
- **Phase 0**: Setup (Next.js, Hardhat, Thirdweb config).
- **Phase 1**: Smart Contracts (MockUSDC.sol, OptimisticEscrow.sol, tests, deployment).
- **Phase 2**: Auth & Wallet (Thirdweb ConnectButton, Gasless config, Role Picker).
- **Phase 3**: Client Dashboard (Browse directory, Fund a job flow).
- **Phase 4**: Freelancer Dashboard (Incoming tasks, Submit work, Fiat/USDC currency dashboard).
- **Phase 5**: Review & Dispute Flow (Approve/Dispute actions, 24h Claim action, Arbiter admin view).
- **Phase 6**: Demo Readiness (Seed scripts, UI cleanup, fallback video).
- **Phase 7**: Post-hackathon / Production (Not required for demo).
