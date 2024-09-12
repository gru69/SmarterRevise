document.addEventListener('DOMContentLoaded', function () {
    const answerBox = document.getElementById('answer');
    const copyButton = document.getElementById('copyButton');
    const scrapeButton = document.getElementById('scrapeButton');
    const statusBox = document.getElementById('status');
    const errorBox = document.getElementById('error');

    function updatePopup(data) {
        if (data.answer) {
            answerBox.value = data.answer;
            statusBox.textContent = 'Answer received.';
            errorBox.textContent = '';  // Clear any previous error messages
        } else if (data.error) {
            errorBox.textContent = `Error: ${data.error}`;
            statusBox.textContent = 'Error occurred.';
        } else {
            statusBox.textContent = 'Press "Scrape and Answer" to get started.';
        }
    }

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'update_popup') {
            updatePopup(request);
        }
    });

    scrapeButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'scrape_and_answer' });
    });

    copyButton.addEventListener('click', function () {
        answerBox.select();
        document.execCommand('copy');
        statusBox.textContent = 'Answer copied to clipboard!';
    });
});
