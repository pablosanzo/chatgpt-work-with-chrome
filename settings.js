document.addEventListener('DOMContentLoaded', async () => {
    const apiKeyInput = document.getElementById('apiKey');
    const fullPageScreenshotCheckbox = document.getElementById('fullPageScreenshot');
    const saveButton = document.getElementById('saveSettingsButton');
    const statusDiv = document.getElementById('status');

    // Load saved settings
    const settings = await chrome.storage.local.get(['openaiApiKey', 'fullPageScreenshot']);
    if (settings.openaiApiKey) {
        apiKeyInput.value = settings.openaiApiKey;
    }
    if (settings.fullPageScreenshot !== undefined) {
        fullPageScreenshotCheckbox.checked = settings.fullPageScreenshot;
    } else {
        // Default to full page screenshots
        fullPageScreenshotCheckbox.checked = true;
    }

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'error' : 'success';
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    saveButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const fullPageScreenshot = fullPageScreenshotCheckbox.checked;

        if (!apiKey) {
            showStatus('Please enter an API key', true);
            return;
        }

        try {
            await chrome.storage.local.set({
                openaiApiKey: apiKey,
                fullPageScreenshot: fullPageScreenshot
            });
            showStatus('Settings saved successfully!');
        } catch (error) {
            showStatus('Error saving settings: ' + error.message, true);
        }
    });
});
