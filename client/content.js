// This script runs in the context of the web page, so it can access window.aptos

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // This is an async listener, so we must return true
    // to indicate that we will send a response asynchronously.
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
                // We don't need to wait for it here, the popup can do that
                sendResponse({ success: true, response });
            }
        } catch (error) {
            // Send back error information
            sendResponse({ success: false, error: error.message });
        }
    })();

    // MUST return true to indicate an async response.
    return true;
});