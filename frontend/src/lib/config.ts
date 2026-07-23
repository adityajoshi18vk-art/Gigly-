import { sepolia } from "thirdweb/chains";
import { createThirdwebClient, getContract } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";

export const CHAIN = sepolia;
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "PLACEHOLDER_CLIENT_ID";
export const client = createThirdwebClient({ clientId });

/** Smart account (AA) configuration — shared between wallet definition & ConnectButton */
export const accountAbstraction = {
  chain: CHAIN,
  sponsorGas: true,
  factoryAddress: "0x85e23b94e7F5E9cC1fF78BCe78cfb15B81f0DF00", // Forces ERC-4337 over EIP-7702
};

export const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email"],
    },
    executionMode: {
      mode: "EIP4337" as const,
      smartAccount: accountAbstraction,
    },
  }),
];

export const CHAINLINK_FEEDS = {
  EUR_USD: "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910",
};

export const CONTRACTS = {
  MockUSDC: "0x630338eDfAfD22c0FF2971Db5696EA2d422b673D",
  OptimisticEscrow: "0xc87EcE5cB40baFC7Eb542Bd805eC053E9b625DFE",
};

export const DEPLOYMENT_BLOCK = BigInt(11333200); // Updated to actual deployment block range

export const mockUsdcContract = getContract({
  client,
  chain: CHAIN,
  address: CONTRACTS.MockUSDC,
});

export const escrowContract = getContract({
  client,
  chain: CHAIN,
  address: CONTRACTS.OptimisticEscrow,
});
