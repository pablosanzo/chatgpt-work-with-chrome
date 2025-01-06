// Global ports collection
const sidePanelPorts = new Set();

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // No context menus needed
});

// Handle connections from sidepanel
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    sidePanelPorts.add(port);
    port.onDisconnect.addListener(() => {
      sidePanelPorts.delete(port);
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Always try to send clear message
  sidePanelPorts.forEach(port => {
    try {
      port.postMessage({ action: 'clearConversation' });
    } catch (error) {
      console.error('Error sending message to port:', error);
    }
  });
  
  // Then toggle the panel
  try {
    const { enabled } = await chrome.sidePanel.getOptions({ windowId: tab.windowId });
    if (enabled) {
      await chrome.sidePanel.close({ windowId: tab.windowId });
    } else {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (error) {
    console.error('Error toggling panel:', error);
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Handle keyboard command
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'take-screenshot') {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab) {
                console.error('No active tab found');
                return;
            }
            
            // Take the screenshot
            chrome.tabs.sendMessage(activeTab.id, { action: 'takeScreenshot' });

            // Send message to all tabs to broadcast to sidepanel
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { 
                        action: 'broadcastToSidePanel', 
                        message: { type: 'focusInput' }
                    }).catch(() => {
                        // Ignore errors from tabs that don't have a listener
                    });
                });
            });
        } catch (error) {
            console.error('Screenshot error:', error);
        }
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 80 }, dataUrl => {
      sendResponse({ dataUrl });
    });
    return true;
  }
  
  if (request.action === 'screenshotTaken') {
    // Forward the screenshot to the sidepanel
    chrome.runtime.sendMessage({
      action: 'addScreenshotContext',
      dataUrl: request.dataUrl
    });

    // Also broadcast to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'broadcastToSidePanel', 
          message: { type: 'focusInput' }
        }).catch(() => {
          // Ignore errors from tabs that don't have a listener
        });
      });
    });
  }
});
