chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    (async () => {
        try {
            if (request.type === 'IS_CONNECTED') {
                const connected = await window.aptos.isConnected();
                sendResponse({ success: true, connected });
            } else if (request.type === 'GET_ACCOUNT') {
                const account = await window.aptos.account();
                sendResponse({ success: true, account });
            } else if (request.type === 'CONNECT') {
                const response = await window.aptos.connect();
                sendResponse({ success: true, response });
            } else if (request.type === 'VIEW') {
                const response = await window.aptos.view(request.payload);
                sendResponse({ success: true, response });
            } else if (request.type === 'SIGN_AND_SUBMIT') {
                const response = await window.aptos.signAndSubmitTransaction(request.payload);

                sendResponse({ success: true, response });
            }
        } catch (error) {
            
            sendResponse({ success: false, error: error.message });
        }
    })();

    
    return true;
});