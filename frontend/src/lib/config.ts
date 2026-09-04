import { sepolia } from "thirdweb/chains";
import { createThirdwebClient, getContract } from "thirdweb";
import { createWallet, inAppWallet } from "thirdweb/wallets";

export const CHAIN = sepolia;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "PLACEHOLDER_CLIENT_ID";
export const client = createThirdwebClient({ clientId });

/** Smart account (AA) configuration — shared between wallet definition & ConnectButton */
export const accountAbstraction = {
  chain: CHAIN,
  sponsorGas: true,
  // No factoryAddress override — uses Thirdweb's canonical ERC-4337 factory on Sepolia
};

export const wallets = [
  // In-app wallet: Gmail + Email OTP, with built-in ERC-4337 smart account
  inAppWallet({
    auth: {
      options: ["google", "email"],
    },
    executionMode: {
      mode: "EIP4337" as const,
      smartAccount: accountAbstraction,
    },
  }),
  // External Web3 wallets — gasless AA applied via accountAbstraction prop on ConnectButton
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
];

export const CHAINLINK_FEEDS = {
  // Chainlink EUR/USD price feed on Sepolia
  EUR_USD: "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910",
  // MockINRFeed — custom Chainlink-style aggregator for INR/USD on Sepolia
  INR_USD: "0x89f3a73ac523f236804867B8Eca75Da2d5324C86",
};

export const CONTRACTS = {
  // Official Circle Testnet USDC on Ethereum Sepolia
  // Faucet: https://faucet.circle.com/
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  // Deployed 2026-08-11 — points to Circle Testnet USDC
  OptimisticEscrow: "0x4B60d9531fCF480edc6cE7FAfF27A171e61bA672",
  // Legacy Soulbound Token (PoW NFTs) — deployed 2026-09-03, used by OptimisticEscrow
  GiglyCredentialLegacy: "0xFB43c1182F51583d33E2e191DB32025DE115ea75",
  // New GiglyCredential (dual-minter: escrow + VotingDispute) — deployed 2026-09-04
  GiglyCredential: "0x7CbC2961526453E48154Bc5A045bc254Eb61B46C",
  // Community Voting Dispute — deployed 2026-09-04
  VotingDispute: "0xbaE78ef2777959fE419De8a28Ed1D974216279D2",
};

export const DEPLOYMENT_BLOCK = BigInt(11425792);

export const usdcContract = getContract({
  client,
  chain: CHAIN,
  address: CONTRACTS.USDC,
});

// Keep legacy export name so existing imports don't break during migration
export const mockUsdcContract = usdcContract;

export const escrowContract = getContract({
  client,
  chain: CHAIN,
  address: CONTRACTS.OptimisticEscrow,
});

// New credential contract (dual-minter: escrow PoW + VotingDispute contributor NFTs)
export const credentialContract = getContract({
  client,
  chain: CHAIN,
  address: CONTRACTS.GiglyCredential,
});

// Legacy credential contract — holds existing PoW NFTs minted before 2026-09-04
export const legacyCredentialContract = getContract({
  client,
  chain: CHAIN,
  address: CONTRACTS.GiglyCredentialLegacy,
});

export const votingDisputeContract = getContract({
  client,
  chain: CHAIN,
  address: CONTRACTS.VotingDispute,
});
