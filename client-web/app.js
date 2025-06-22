// Gullak Pro Web Frontend
// Assumes Aptos wallet extension injects window.aptos

const CONTRACT_ADDRESS = "0x8fdc05f62b24f7e21c7f3e64666f4012813edeafffce50757775d837e11b6d47"; // Update if needed
const MODULE_NAME = "piggy_bank";

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const walletAddressEl = document.getElementById('wallet-address');
const statusEl = document.getElementById('status');
const walletDisconnectedView = document.getElementById('wallet-disconnected');
const createPiggyView = document.getElementById('create-piggy-view');
const dashboardView = document.getElementById('dashboard-view');
const createBtn = document.getElementById('createBtn');
const goalAmountInput = document.getElementById('goalAmount');
const lockDurationInput = document.getElementById('lockDuration');
const balanceEl = document.getElementById('balance');
const goalTextEl = document.getElementById('goal-text');
const progressBarEl = document.getElementById('progressBar');
const lockStatusEl = document.getElementById('lock-status');
const depositAmountInput = document.getElementById('depositAmount');
const withdrawAmountInput = document.getElementById('withdrawAmount');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const breakBtn = document.getElementById('breakBtn');
const emergencyBtn = document.getElementById('emergencyBtn');

let userAccount = null;

const toApt = (octas) => Number(BigInt(octas)) / 10 ** 8;
const toOctas = (apt) => Math.floor(Number(apt) * 10 ** 8);

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#dc3545' : '#28a745';
  if (message) setTimeout(() => setStatus(""), 5000);
}

function switchView(view) {
  walletDisconnectedView.classList.add('hidden');
  createPiggyView.classList.add('hidden');
  dashboardView.classList.add('hidden');
  view.classList.remove('hidden');
}

async function checkPiggyBank() {
  try {
    const payload = {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::piggy_bank_exists`,
      type_arguments: [],
      arguments: [userAccount.address],
    };
    const result = await window.aptos.view(payload);
    return result[0];
  } catch {
    return false;
  }
}

async function updateDashboard() {
  if (!userAccount) return;
  try {
    const payload = {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_piggy_bank_info`,
      type_arguments: [],
      arguments: [userAccount.address],
    };
    const viewResult = await window.aptos.view(payload);
    const [balance, goal, createdAt, lastDeposit, isLocked, unlockTime, depositCount] = viewResult;
    const balanceApt = toApt(balance);
    const goalApt = toApt(goal);
    balanceEl.textContent = `${balanceApt.toFixed(4)} APT`;
    goalTextEl.textContent = `Goal: ${balanceApt.toFixed(2)} of ${goalApt.toFixed(2)} APT`;
    const progress = goalApt > 0 ? Math.min((balanceApt / goalApt) * 100, 100) : 0;
    progressBarEl.style.width = `${progress}%`;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, Number(unlockTime) - currentTime);
    if (isLocked && timeRemaining > 0) {
      const daysRemaining = (timeRemaining / (60 * 60 * 24)).toFixed(1);
      lockStatusEl.textContent = `🔒 Locked for ${daysRemaining} more days`;
      lockStatusEl.classList.remove('hidden');
      withdrawBtn.disabled = true;
      breakBtn.disabled = true;
    } else {
      lockStatusEl.classList.add('hidden');
      withdrawBtn.disabled = false;
      breakBtn.disabled = false;
    }
  } catch (e) {
    setStatus("Failed to fetch dashboard.", true);
  }
}

connectBtn.onclick = async () => {
  try {
    const response = await window.aptos.connect();
    userAccount = response;
    walletAddressEl.textContent = userAccount.address;
    walletAddressEl.classList.remove('hidden');
    if (await checkPiggyBank()) {
      switchView(dashboardView);
      updateDashboard();
    } else {
      switchView(createPiggyView);
    }
  } catch (e) {
    setStatus("Wallet connection failed.", true);
  }
};

createBtn.onclick = async () => {
  const goal = Number(goalAmountInput.value);
  const lockDays = Number(lockDurationInput.value);
  if (!goal || goal <= 0) return setStatus("Enter a valid goal.", true);
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_piggy_bank`,
      type_arguments: [],
      arguments: [goal * 1e8, lockDays * 24 * 60 * 60],
    };
    await window.aptos.signAndSubmitTransaction(payload);
    setStatus("Piggy bank created!");
    switchView(dashboardView);
    updateDashboard();
  } catch (e) {
    setStatus("Failed to create piggy bank.", true);
  }
};

depositBtn.onclick = async () => {
  const amount = Number(depositAmountInput.value);
  if (!amount || amount <= 0) return setStatus("Enter a valid amount.", true);
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::deposit`,
      type_arguments: [],
      arguments: [toOctas(amount)],
    };
    await window.aptos.signAndSubmitTransaction(payload);
    setStatus("Deposit successful!");
    updateDashboard();
  } catch (e) {
    setStatus("Deposit failed.", true);
  }
};

withdrawBtn.onclick = async () => {
  const amount = Number(withdrawAmountInput.value);
  if (!amount || amount <= 0) return setStatus("Enter a valid amount.", true);
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::withdraw`,
      type_arguments: [],
      arguments: [toOctas(amount)],
    };
    await window.aptos.signAndSubmitTransaction(payload);
    setStatus("Withdraw successful!");
    updateDashboard();
  } catch (e) {
    setStatus("Withdraw failed.", true);
  }
};

breakBtn.onclick = async () => {
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::break_piggy_bank`,
      type_arguments: [],
      arguments: [],
    };
    await window.aptos.signAndSubmitTransaction(payload);
    setStatus("Piggy bank broken. Withdrawn all funds.");
    switchView(createPiggyView);
  } catch (e) {
    setStatus("Failed to break piggy bank.", true);
  }
};

emergencyBtn.onclick = async () => {
  try {
    const payload = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::emergency_withdraw_all`,
      type_arguments: [],
      arguments: [],
    };
    await window.aptos.signAndSubmitTransaction(payload);
    setStatus("Emergency withdraw complete.");
    updateDashboard();
  } catch (e) {
    setStatus("Emergency withdraw failed.", true);
  }
};

window.onload = async () => {
  if (window.aptos) {
    try {
      const isConnected = await window.aptos.isConnected();
      if (isConnected) {
        userAccount = await window.aptos.account();
        walletAddressEl.textContent = userAccount.address;
        walletAddressEl.classList.remove('hidden');
        if (await checkPiggyBank()) {
          switchView(dashboardView);
          updateDashboard();
        } else {
          switchView(createPiggyView);
        }
      }
    } catch {}
  }
};
