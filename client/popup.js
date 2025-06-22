document.addEventListener('DOMContentLoaded', () => {
    
    const CONTRACT_ADDRESS = "0x8fdc05f62b24f7e21c7f3e64666f4012813edeafffce50757775d837e11b6d47";
    const MODULE_NAME = "piggy_bank";

    
    
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

    const setStatus = (message, isError = false) => {
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#dc3545' : '#28a745';
        if (message) {
            setTimeout(() => setStatus(""), 5000);
        }
    };
    
    const switchView = (view) => {
        walletDisconnectedView.classList.add('hidden');
        createPiggyView.classList.add('hidden');
        dashboardView.classList.add('hidden');
        view.classList.remove('hidden');
    };

    
    const sendMessage = (message) => {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    
                    
                    reject(new Error("Gullak bridge not ready. Please refresh the web page and try again."));
                } else if (response && response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response?.error || "An unknown error occurred."));
                }
            });
        });
    };
    
    
    const updateDashboard = async () => {
        if (!userAccount) return;
        try {
            const payload = {
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_piggy_bank_info`,
                type_arguments: [],
                arguments: [userAccount.address],
            };
            const viewResult = await sendMessage({ type: 'VIEW', payload });
            const [balance, goal, createdAt, lastDeposit, isLocked, unlockTime, depositCount] = viewResult.response;
            
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
        } catch (error) {
            console.error("Failed to update dashboard:", error);
            if (error.message.includes('E_PIGGY_BANK_NOT_EXISTS')) {
                renderApp();
            } else {
                 setStatus(error.message, true);
            }
        }
    };

    const renderApp = async () => {
        if (!userAccount) {
            switchView(walletDisconnectedView);
            return;
        }
        
        walletAddressEl.textContent = `Connected: ${userAccount.address.slice(0, 6)}...${userAccount.address.slice(-4)}`;
        walletAddressEl.classList.remove('hidden');
        
        try {
            const existsPayload = {
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::piggy_bank_exists`,
                type_arguments: [],
                arguments: [userAccount.address],
            };
            const viewResult = await sendMessage({ type: 'VIEW', payload: existsPayload });
            const [exists] = viewResult.response;

            if (exists) {
                switchView(dashboardView);
                updateDashboard();
            } else {
                switchView(createPiggyView);
            }
        } catch (error) {
            console.error("Render error:", error);
            setStatus(error.message, true);
        }
    };

    const handleTransaction = async (payload, successMessage) => {
        setStatus("Please approve in your wallet...");
        try {
            const txResponse = await sendMessage({ type: 'SIGN_AND_SUBMIT', payload });
            // The popup can't wait for the transaction, but we can assume success on submission
            
            setStatus(successMessage);
            
            setTimeout(() => {
                if (successMessage.includes("broken")) {
                    renderApp(); // Full re-render if account is closed
                } else {
                    updateDashboard(); // Just update data
                }
            }, 2000); 
            return true;
        } catch (error) {
            console.error("Transaction failed:", error);
            setStatus(error.message, true);
            return false;
        }
    };
    
    
    connectBtn.addEventListener('click', async () => {
        try {
            const connectResponse = await sendMessage({ type: 'CONNECT' });
            userAccount = connectResponse.response;
            await renderApp();
        } catch (error) {
            setStatus(error.message, true);
        }
    });

    createBtn.addEventListener('click', async () => {
        const goal = parseFloat(goalAmountInput.value);
        const days = parseInt(lockDurationInput.value) || 0;

        if (isNaN(goal) || goal <= 0) {
            return setStatus("Please enter a valid goal amount.", true);
        }
        const payload = {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_piggy_bank`,
            type_arguments: [],
            arguments: [ toOctas(goal).toString(), (days * 24 * 60 * 60).toString() ],
        };
        await handleTransaction(payload, "Piggy bank created! 🎉");
    });
    
    depositBtn.addEventListener('click', async () => {
        const amount = parseFloat(depositAmountInput.value);
        if (isNaN(amount) || amount <= 0) { return setStatus("Invalid deposit amount.", true); }
        const payload = {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::deposit`,
            type_arguments: [],
            arguments: [toOctas(amount).toString()],
        };
        if (await handleTransaction(payload, "Deposit successful!")) {
            depositAmountInput.value = "";
        }
    });
    
    withdrawBtn.addEventListener('click', async () => {
        const amount = parseFloat(withdrawAmountInput.value);
        if (isNaN(amount) || amount <= 0) { return setStatus("Invalid withdrawal amount.", true); }
        const payload = {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::withdraw`,
            type_arguments: [],
            arguments: [toOctas(amount).toString()],
        };
        if (await handleTransaction(payload, "Withdrawal successful!")) {
            withdrawAmountInput.value = "";
        }
    });
    
    breakBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure? This will withdraw all funds and close your piggy bank permanently.")) return;
        const payload = {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::break_piggy_bank`,
            type_arguments: [],
            arguments: [],
        };
        await handleTransaction(payload, "Piggy bank broken! All funds returned.");
    });
    
    emergencyBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure? This will withdraw all funds immediately, ignoring any time-lock.")) return;
        const payload = {
            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::emergency_withdraw_all`,
            type_arguments: [],
            arguments: [],
        };
        await handleTransaction(payload, "Emergency withdrawal successful!");
    });

    
    const init = async () => {
        try {
            const isConnectedResponse = await sendMessage({ type: 'IS_CONNECTED' });
            if (isConnectedResponse.connected) {
                const accountResponse = await sendMessage({ type: 'GET_ACCOUNT' });
                userAccount = accountResponse.account;
                await renderApp();
            } else {
                switchView(walletDisconnectedView);
            }
        } catch (error) {
            
            console.warn(error.message);
            switchView(walletDisconnectedView);
        }
    };

    init();
});