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

## Requirements

- Aptos wallet browser extension (e.g., Petra, Martian)
- Node.js (for contract deployment, if needed)
- Aptos CLI (for contract deployment)

## File Structure

```
/Move.toml
/sources/           # Move smart contract
/client/            # Chrome extension frontend
/client-web/        # Web app frontend
/build/             # Compiled contract artifacts
/tests/             # (Optional) Test scripts
```

## Security & Disclaimer

- Always test on Aptos testnet before using on mainnet.
- Review and audit the smart contract before depositing significant funds.

## License

MIT

---

Testnet Account
0x8fdc05f62b24f7e21c7f3e64666f4012813edeafffce50757775d837e11b6d47

Transaction submitted: https://explorer.aptoslabs.com/txn/0xac83b777717e32e20528a2c092840cc0d7556ee9ecbe4effe65469fc6aef67dc?network=testnet
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
