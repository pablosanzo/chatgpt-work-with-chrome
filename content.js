// Function to get full page height
function getFullHeight() {
    return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
}

// Function to capture visible viewport
async function captureVisibleArea() {
    const dataUrl = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'captureTab' }, response => {
            resolve(response.dataUrl);
        });
    });
    return dataUrl;
}

// Function to capture full page screenshot
async function captureFullPage() {
    const originalScrollPos = window.scrollY;
    const fullHeight = getFullHeight();
    const viewportHeight = window.innerHeight;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to full page size
    canvas.width = window.innerWidth;
    canvas.height = fullHeight;
    
    // Scroll through the page and capture each viewport
    for (let currentPos = 0; currentPos < fullHeight; currentPos += viewportHeight) {
        window.scrollTo(0, currentPos);
        
        // Wait for any lazy-loaded content to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture current viewport
        const dataUrl = await new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'captureTab' }, response => {
                resolve(response.dataUrl);
            });
        });
        
        // Draw captured image onto canvas
        const img = await new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.src = dataUrl;
        });
        
        context.drawImage(img, 0, currentPos, window.innerWidth, viewportHeight);
    }
    
    // Restore original scroll position
    window.scrollTo(0, originalScrollPos);
    
    return canvas.toDataURL('image/jpeg', 0.8);
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
