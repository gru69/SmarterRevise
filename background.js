chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrape_and_answer') {
        // Send a message to the content script to start the scraping process
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'scrape_and_answer' }, (response) => {
                if (response) {
                    sendResponse(response);
                } else {
                    sendResponse({ error: 'Failed to get a response from the content script.' });
                }
            });
        });

        // Keep the message channel open until the response is received
        return true;
    }
});
