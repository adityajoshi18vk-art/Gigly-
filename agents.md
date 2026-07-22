# Gigly - Project Overview and Context

## Concept
Gigly is a blockchain-powered gig-economy escrow platform built on Polygon. It allows clients and freelancers to transact securely using USDC without the typical complexities of Web3 (no seed phrases, no gas fees, no wallet apps).

## Core Value Proposition
- **Clients**: Guaranteed payment security and ability to review work before releasing funds.
- **Freelancers**: Guaranteed payouts, zero gas fees, fast settlement, and real-time visibility of their USDC balance in local currencies (INR, EUR).

## Key Features (MVP)
- **Frictionless Auth**: Gmail OAuth + Email OTP via Thirdweb in-app wallets.
- **Gasless Transactions**: ERC-4337 Account Abstraction with Thirdweb Paymaster.
- **Optimistic Escrow**: 24-hour review window for clients. Auto-release if no action.
- **Dispute Resolution**: Platform arbiter (internal admin) resolves disagreements.
- **Fiat-pegged Dashboard**: Real-time conversion of USDC to INR and EUR using Chainlink and fallback APIs.

## Target Audience
- Individuals/Small businesses hiring across borders.
- Gig workers (especially in emerging markets like India) seeking low-fee, stable payouts.
