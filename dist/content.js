// Function to capture visible viewport
async function captureVisibleArea() {
    const dataUrl = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'captureTab' }, response => {
            resolve(response.dataUrl);
        });
    });
    return dataUrl;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'takeScreenshot') {
        try {
            // Request screenshot from background script
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'captureTab' }, resolve);
            });
            
            // Forward screenshot to background script
            chrome.runtime.sendMessage({
                action: 'screenshotTaken',
                dataUrl: response.dataUrl
            });
        } catch (error) {
            console.error('Screenshot error:', error);
        }
    }

    if (request.action === 'broadcastToSidePanel') {
        // Broadcast message to sidepanel via postMessage
        window.postMessage({
            source: 'content-script',
            ...request.message
        }, '*');
    }
});
