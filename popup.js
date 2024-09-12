document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const answerElement = document.getElementById('answer');
    const loadingElement = document.getElementById('loading');
    const scrapeBtn = document.getElementById('scrapeBtn');

    // Function to update status and answer
    const updatePopup = (status, answer) => {
        statusElement.textContent = status;
        if (answer) {
            answerElement.textContent = `Answer: ${answer}`;
            loadingElement.style.display = 'none';
        } else {
            answerElement.textContent = '';
        }
    };

    // Function to start scraping
    const startScraping = () => {
        loadingElement.style.display = 'block';
        statusElement.textContent = 'Scraping...';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeAnswer' }, (response) => {
                if (response) {
                    updatePopup('Data fetched successfully.', response.answer);
                } else {
                    updatePopup('Error retrieving data.', '');
                }
            });
        });
    };

    // Set up button click handler
    scrapeBtn.addEventListener('click', startScraping);
});
