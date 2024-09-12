const updatePopup = (message) => {
    console.log('Sending message to popup:', message);
    chrome.runtime.sendMessage({ action: 'update_popup', answer: message });
};

const getGPTResponse = async (question, promptType = 'multiple_choice') => {
    const apiKey = 'GROQKEY';  // Replace with your actual API key
    let prompt;

    if (promptType === 'multiple_choice') {
        prompt = `Here is a computer science question: ${question}. Please respond with just the correct number corresponding to the answer.`;
    } else {
        prompt = `Here is a computer science question: ${question}. Please respond with the correct answer.`;
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error fetching GPT response:', error);
        return null;
    }
};

const answerQuestion = async () => {
    updatePopup('Started scraping...');
    await new Promise(res => setTimeout(res, 2000));  // Simulate delay

    const questionElements = document.querySelectorAll('.sr-whitespace-prewrap');

    // Determine if it is a multiple-choice question
    const answerButtons = [...document.querySelectorAll('.js_answerButton')];

    if (answerButtons.length === 0) {
        // Non-multiple-choice question
        const questionText = document.querySelector('.row.align-items-end.mb-2 .col .sr-whitespace-prewrap')?.innerText;

        if (!questionText) {
            updatePopup('Error: Could not find the question element for non-multiple-choice');
            return;
        }

        const query = `${questionText}`;
        updatePopup('Sending question to GROQ...');
        const gptResponse = await getGPTResponse(query, 'free_text');
        if (!gptResponse) {
            updatePopup('Error: Failed to get a response from GPT');
            return;
        }

        const answerBox = document.querySelector('#TermsQuestionData_ProvidedAnswer');
        if (answerBox) {
            answerBox.value = gptResponse;
        }
        updatePopup(gptResponse);

    } else {
        // Multiple-choice question (this remains unchanged as per your original logic)
        const questionText = questionElements.length > 1 ? questionElements[1].innerText : null;

        if (!questionText) {
            updatePopup('Error: Could not find the second question element');
            return;
        }

        let query = `${questionText}\n`;
        query += answerButtons.map((el, i) => `${i + 1}: ${el.innerText}`).join('\n');

        updatePopup('Sending question to GROQ...');
        const gptResponse = await getGPTResponse(query, 'multiple_choice');
        if (!gptResponse) {
            updatePopup('Error: Failed to get a response from GPT');
            return;
        }

        const matches = gptResponse.match(/\d+/);
        if (!matches) {
            updatePopup('Error: No number in GPT response');
            return;
        }

        const answerIndex = parseInt(matches[0]) - 1;
        const selectedAnswer = answerButtons[answerIndex];
        const resultText = `The suggested answer is: ${answerIndex + 1}: ${selectedAnswer.innerText}`;
        updatePopup(resultText);
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrape_and_answer') {
        answerQuestion();
        sendResponse({ status: 'Scraping started' });
    }
});
