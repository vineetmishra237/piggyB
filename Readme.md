# PiggyB: Advanced Aptos Piggy Bank

PiggyB is a decentralized savings dApp built on the Aptos blockchain. It allows users to create personal piggy banks, set savings goals, time-lock their funds, and manage deposits and withdrawals securely using Move smart contracts.

## Features

- **Create a Piggy Bank:** Set a savings goal and optional lock duration for your funds.
- **Deposit & Withdraw:** Add or withdraw Aptos coins (APT) from your piggy bank, with lock enforcement.
- **Break Piggy Bank:** Withdraw all funds and close your piggy bank at any time (if unlocked).
- **Emergency Withdraw:** Instantly withdraw all funds in emergencies.
- **Progress Tracking:** View your balance, goal, progress, and lock status in a modern dashboard.
- **Web & Extension Frontends:** Use PiggyB as a Chrome extension or standalone web app.

## Smart Contract

- Written in Move (`sources/gullak.move`)
- Deployed on Aptos blockchain
- Supports all piggy bank operations and view functions

## Frontends

### Chrome Extension

- Located in `client/`
- Popup UI for wallet connection, piggy bank management, and contract interaction
- Works with Aptos-compatible browser wallets (e.g., Petra, Martian)

### Web App

- Located in `client-web/`
- Modern responsive web interface
- Connects to Aptos wallets via `window.aptos` API

## Project Structure

```
/Move.toml                # Move project config
/sources/                 # Move smart contract source code
/client/                  # Chrome extension frontend
/client-web/              # Web app frontend
/build/                   # Compiled contract artifacts
/tests/                   # (Optional) Test scripts
```

## Requirements

- Aptos wallet browser extension (e.g., Petra, Martian)
- Node.js (for contract deployment, if needed)
- Aptos CLI (for contract deployment)

## Getting Started

### 1. Deploy the Smart Contract

- Edit and deploy `sources/gullak.move` to Aptos using the Aptos CLI or your preferred tool.
- Update the contract address in frontend files (`client/popup.js` and `client-web/app.js`).

### 2. Use the Chrome Extension

- Load the `client/` folder as an unpacked extension in Chrome.
- Open the popup and connect your Aptos wallet.
- Create, deposit, withdraw, and manage your piggy bank.

### 3. Use the Web App

- Open `client-web/index.html` in your browser (with an Aptos wallet extension installed).
- Connect your wallet and interact with your piggy bank.

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/vineetmishra237/piggyB.git
   cd piggyB
   ```
2. Install dependencies for contract development (if needed):
   ```bash
   # For Move CLI
   aptos move compile
   # For frontend (optional, if you want to use npm tooling)
   cd client-web
   npm install # if you add npm-based tooling
   ```
3. Deploy the Move contract to Aptos testnet/mainnet:
   ```bash
   aptos move publish --profile default
   ```
4. Update the contract address in `client/popup.js` and `client-web/app.js`.

## Interacting with the Contract

- Use the Chrome extension (`client/`) or web app (`client-web/`) to interact with your PiggiB.
- Supported actions:
  - Create your PiggiB (one per user)
  - Deposit APT
  - Withdraw APT (if unlocked)
  - Break PiggiB (withdraw all and close)
  - Emergency withdraw all
  - View your goal, balance, and progress

## Example Workflow

Below is an example workflow for using the PiggiB Move contract. Replace `<deployed_address>` with your actual contract address and provide the required arguments as needed.

1. **Create Your PiggiB (Piggy Bank)** (run once per user):
   ```bash
   aptos move run --function-id '<deployed_address>::piggy_bank::create_piggy_bank' --args <goal_amount_in_octas> <lock_duration_seconds>
   ```
   - `<goal_amount_in_octas>`: Your savings goal in Octas (1 APT = 100,000,000 Octas)
   - `<lock_duration_seconds>`: Lock duration in seconds (0 for no lock)

2. **Deposit Funds:**
   ```bash
   aptos move run --function-id '<deployed_address>::piggy_bank::deposit' --args <amount_in_octas>
   ```
   - `<amount_in_octas>`: Amount to deposit in Octas

3. **Withdraw Funds:**
   ```bash
   aptos move run --function-id '<deployed_address>::piggy_bank::withdraw' --args <amount_in_octas>
   ```
   - `<amount_in_octas>`: Amount to withdraw in Octas (must be unlocked and have sufficient balance)

4. **Break PiggiB (Withdraw All & Close):**
   ```bash
   aptos move run --function-id '<deployed_address>::piggy_bank::break_piggy_bank'
   ```

5. **Emergency Withdraw All:**
   ```bash
   aptos move run --function-id '<deployed_address>::piggy_bank::emergency_withdraw_all'
   ```

6. **View PiggiB Info:**
   ```bash
   aptos move view --function-id '<deployed_address>::piggy_bank::get_piggy_bank_info' --args <user_address>
   ```
   - Returns: (balance, goal_amount, created_at, last_deposit_at, is_locked, unlock_time, deposit_count)

7. **Check if PiggiB Exists:**
   ```bash
   aptos move view --function-id '<deployed_address>::piggy_bank::piggy_bank_exists' --args <user_address>
   ```
   - Returns: true/false

## License

MIT

---

Testnet Account

```
0x8fdc05f62b24f7e21c7f3e64666f4012813edeafffce50757775d837e11b6d47
```

Transaction submitted: [View on Aptos Explorer](https://explorer.aptoslabs.com/txn/0xac83b777717e32e20528a2c092840cc0d7556ee9ecbe4effe65469fc6aef67dc?network=testnet)

```json
{
  "Result": {
    "transaction_hash": "0xac83b777717e32e20528a2c092840cc0d7556ee9ecbe4effe65469fc6aef67dc",
    "gas_used": 3613,
    "gas_unit_price": 100,
    "sender": "8fdc05f62b24f7e21c7f3e64666f4012813edeafffce50757775d837e11b6d47",
    "sequence_number": 0,
    "success": true,
    "timestamp_us": 1750534247438934,
    "version": 6791030047,
    "vm_status": "Executed successfully"
  }
}
```
