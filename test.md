# Gigly Testing Guide

This document outlines the standard end-to-end testing flow for the Gigly platform, utilizing Account Abstraction (ERC-4337) and Thirdweb In-App Wallets. 

Because the platform relies on smart accounts that map 1:1 to email addresses, it's recommended to use different incognito windows or different browsers when testing multiple roles simultaneously.

## Test Accounts

* **Client:** `giglytest1@yopmail.com`
* **Freelancer:** `giglytest2@yopmail.com` 
* **Admin (Arbiter):** `giglytest3@yopmail.com`

> **Note:** OTPs for these accounts can be checked at [yopmail.com](https://yopmail.com).

---

## Testing the Happy Path (Create, Submit, Approve)

### 1. Client: Create a Job
1. Navigate to `http://localhost:3000`
2. Click **Sign In to Gigly** and enter `giglytest1@yopmail.com`. Enter the OTP sent to Yopmail.
3. If prompted, select **"I'm hiring"** (Client Role).
4. On the Client Dashboard, go to the **Browse Freelancers** tab.
5. Click on **Giglytest Freelancer** (This profile is hardcoded to route funds to the `giglytest2` smart account).
6. Enter a Task Title (e.g., "Build Landing Page") and an Amount (e.g., "50").
7. Click **Create Job**. 
   * *If this is your first time, you may need to approve the USDC spend first.*
8. Once successful, the job will appear in the **Active Jobs** tab.

### 2. Freelancer: Submit Work
1. Open a new Incognito Window and navigate to `http://localhost:3000`.
2. Sign in with `giglytest2@yopmail.com` and select **"I'm working"** (Freelancer Role).
3. On the Freelancer Dashboard, go to **Incoming Tasks**.
4. You should see the job created by the client. Click **Submit Work**.
5. Enter a mock URL (e.g., `https://github.com/...`) and confirm.
6. The job status will update to "Submitted".
7. *Optional:* Check the **Earnings** tab to see real-time, gasless dashboard stats, including the Chainlink Oracle conversion to EUR.

### 3. Client: Approve & Release
1. Return to the Client window (`giglytest1@yopmail.com`).
2. Navigate to **Active Jobs**.
3. You will see the Freelancer's submitted link.
4. Click **Approve & Release**.
5. The smart contract will immediately release the USDC to the freelancer's smart account.

---

## Testing the Dispute Flow

### 1. Client: Raise a Dispute
1. Repeat steps 1 & 2 from the Happy Path to create and submit a new job.
2. As the Client (`giglytest1@yopmail.com`), go to **Active Jobs**.
3. Instead of approving, click **Raise Dispute**.
4. Enter a reason (e.g., "The design does not match the Figma file") and submit.
5. The job status will change to "Disputed".

### 2. Admin: Resolve the Dispute
1. Open a new window and navigate directly to `http://localhost:3000/admin`.
2. Instead of the standard login, click the dedicated **Sign in as gigilytest3@yopmail.com** button. (This account is authorized on-chain as the Arbiter).
3. You will see a list of all Disputed Jobs.
4. Review the Freelancer's submission link alongside the Client's dispute reason.
5. Enter the **Amount to Freelancer (USDC)**. 
   * *Example: If the job was 50 USDC, you can enter 25 to split the funds 50/50.*
6. Click **Resolve**.
7. The contract will distribute the specified amount to the freelancer and refund the remainder to the client.
