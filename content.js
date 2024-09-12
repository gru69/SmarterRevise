(async () => {
    const sleep = async (ms) => await new Promise(res => setTimeout(res, ms));

    const getGPTResponse = async (question) => {
        const apiKey = 'KEY HERE'; // Replace with your actual API key

        const prompt = `I want you to act as a smart assistant. Here is a computer science question: ${question}. Please respond with just the correct number corresponding to the answer.`;

        let numRetries = 0;
        const maxRetries = 5;
        const initialDelay = 1000; // 1 second

        while (numRetries < maxRetries) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 100
                    })
                });

                if (response.status === 429) {
                    numRetries++;
                    const delay = initialDelay * Math.pow(2, numRetries); // Exponential backoff
                    console.warn(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
                    await new Promise(res => setTimeout(res, delay));
                    continue; // Retry the request
                }

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                const data = await response.json();
                if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
                    throw new Error('Unexpected API response format');
                }

                return data.choices[0].message.content.trim();
            } catch (error) {
                console.error('Error fetching GPT response:', error);
                return null;
            }
        }

        throw new Error('Maximum retries exceeded');
    };

    const answerQuestion = async () => {
        await sleep(2000); // Wait for 2 seconds before starting
    
        // Scrape the second question element
        const questionElements = document.querySelectorAll('.sr-whitespace-prewrap');
        const questionText = questionElements.length > 1 ? questionElements[1].innerText : null;
    
        // Scrape the answer buttons
        const answerButtons = [...document.querySelectorAll('.js_answerButton')];
        if (!questionText || answerButtons.length === 0) {
            console.error('Could not find question or answers');
            return null; // Return null to indicate failure
        }
    
        // Build the question text with answers
        let query = `${questionText}\n`;
        query += answerButtons.map((el, i) => `${i + 1}: ${el.innerText}`).join('\n');
    
        console.log('Question and answers:', query);
    
        // Send question to GPT API
        const gptResponse = await getGPTResponse(query);
        if (!gptResponse) {
            console.error('Failed to get a response from GPT');
            return null; // Return null to indicate failure
        }
    
        console.info('GPT Response:', gptResponse);
    
        const matches = gptResponse.match(/\d+/);
        if (!matches) {
            console.error('No number in GPT response');
            return null; // Return null to indicate failure
        }
    
        // Extract answer index
        const answerIndex = parseInt(matches[0]) - 1;
        const selectedAnswer = answerButtons[answerIndex]?.innerText || 'Unknown';
    
        return selectedAnswer; // Return the answer to be sent to the popup
    };
    

    // Add listener for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'scrapeAnswer') {
            answerQuestion().then(answer => {
                sendResponse({ status: 'Data fetched successfully.', answer });
            }).catch(error => {
                sendResponse({ status: 'Error retrieving data.', answer: '' });
            });
            // Ensure the response is asynchronous
            return true;
        }
    });    
})();
