let apiKey = '';

function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
}

function saveSettings() {
    apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        alert('Please enter a valid API key!');
        return;
    }
    alert('API Key saved!');
    toggleSettings();
}

async function getAIResponse(message) {
    if (!apiKey) return 'Error: Please set your OpenRouter API key in the settings.';
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,    // No need to do any thing here 
                'HTTP-Referer': 'http://localhost:8080',
                'X-Title': 'AI NEPAL',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'model': 'qwen/qwq-32b:free',    // Chnage the model here (model selection gararwa yesma rakhnu hola) 
                'messages': [{ 'role': 'user', 'content': message }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API Error:', error);
        return `Error: Failed to fetch response. ${error.message}`;
    }
}

function formatResponse(response) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;
    const fragments = [];

    while ((match = codeBlockRegex.exec(response)) !== null) {
        if (match.index > lastIndex) {
            fragments.push({ type: 'text', content: response.slice(lastIndex, match.index) });
        }
        const language = match[1] || 'text';
        const code = match[2].trim();
        fragments.push({ type: 'code', content: code, language });
        lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < response.length) {
        fragments.push({ type: 'text', content: response.slice(lastIndex) });
    }

    if (fragments.length === 0) {
        if (response.trim().startsWith('<') && response.includes('>')) {
            fragments.push({ type: 'code', content: response, language: 'html' });
        } else {
            fragments.push({ type: 'text', content: response });
        }
    }

    return fragments;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, match => map[match]);
}

async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const chatBody = document.getElementById('chatBody');
    const message = userInput.value.trim();

    if (!message) return;

    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user-message');
    userMessage.innerHTML = `<span class="prompt">User@Nepal:~$</span> ${escapeHtml(message)}`;
    chatBody.appendChild(userMessage);

    userInput.value = '';

    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('message', 'ai-message');
    loadingMessage.innerHTML = '<span class="prompt">AI@Nepal:~$</span> Thinking...';
    chatBody.appendChild(loadingMessage);
    chatBody.scrollTop = chatBody.scrollHeight;

    const aiResponse = await getAIResponse(message);
    chatBody.removeChild(loadingMessage);

    const aiMessage = document.createElement('div');
    aiMessage.classList.add('message', 'ai-message');

    if (message.toLowerCase().includes('deserves to die')) {
        aiMessage.innerHTML = '<span class="prompt">AI@Nepal:~$</span> As an AI, I’m not allowed to make that choice.';
    } else if (message.toLowerCase().includes('generate image')) {
        aiMessage.innerHTML = '<span class="prompt">AI@Nepal:~$</span> Do you want me to generate an image? Please confirm.';
    } else {
        const fragments = formatResponse(aiResponse);
        let content = '<span class="prompt">AI@Nepal:~$</span> ';
        fragments.forEach(fragment => {
            if (fragment.type === 'text') {
                content += escapeHtml(fragment.content).replace(/\n/g, '<br>');
            } else if (fragment.type === 'code') {
                content += `<pre><code class="language-${fragment.language}">${escapeHtml(fragment.content)}</code><button class="copy-btn" onclick="copyCode(this)">Copy</button></pre>`;
            }
        });
        aiMessage.innerHTML = content;
    }

    chatBody.appendChild(aiMessage);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function copyCode(button) {
    const code = button.previousElementSibling.textContent;
    navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => button.textContent = 'Copy', 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        button.textContent = 'Error';
    });
}

document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});