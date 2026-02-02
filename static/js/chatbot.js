document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatbotMessages = document.getElementById('chatbotMessages');

    // Initialize global detected breed variable if not already set
    window.detectedBreed = window.detectedBreed || "";

    // FAQ suggestions
    const faqSuggestions = [
        "What vaccinations does my pet need?",
        "How often should I take my pet to the vet?",
        "What should I feed my pet?",
        "How much exercise does my pet need?",
        "What are signs of illness in pets?",
        "How to groom my pet?",
        "Tips for training my pet"
    ];

    // --- Event Listeners ---

    // Toggle chatbot visibility
    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.add('active');
        chatbotContainer.style.display = 'flex'; // Ensure flex is set
        chatInput.focus();
    });

    closeChatBtn.addEventListener('click', () => {
        chatbotContainer.classList.remove('active');
        setTimeout(() => {
            chatbotContainer.style.display = 'none';
        }, 300); // Wait for transition
    });

    // Send message on click
    sendChatBtn.addEventListener('click', () => {
        sendMessage();
    });

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // --- Core Functions ---

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // 1. Add user message to UI
        addMessage(message, 'user');
        chatInput.value = '';
        
        // 2. Show typing indicator
        const typingIndicator = addTypingIndicator();
        
        try {
            // 3. Call Backend API
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    // vital: send the breed detected by main.js
                    detected_breed: window.detectedBreed || "" 
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            typingIndicator.remove();
            
            if (data.success) {
                addMessage(data.response, 'bot');
            } else {
                addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        } catch (error) {
            typingIndicator.remove();
            console.error("Chat Error:", error);
            addMessage('Sorry, I could not connect to the server. Please check your internet connection.', 'bot');
        }
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'bot' ? 'bot-message' : 'user-message';
        
        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <i class="fas fa-robot"></i>
                <div class="message-content">
                    <p>${text}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${text}</p>
                </div>
            `;
        }
        
        chatbotMessages.appendChild(messageDiv);
        scrollToBottom();
        
        return messageDiv;
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'bot-message typing-indicator';
        typingDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <div class="message-content">
                <p>Typing<span class="dots">...</span></p>
            </div>
        `;
        chatbotMessages.appendChild(typingDiv);
        scrollToBottom();
        
        // Simple dot animation logic
        let dotCount = 0;
        const dotsSpan = typingDiv.querySelector('.dots');
        const interval = setInterval(() => {
            if(!document.body.contains(typingDiv)) {
                clearInterval(interval);
                return;
            }
            dotCount = (dotCount + 1) % 4;
            dotsSpan.textContent = '.'.repeat(dotCount);
        }, 300);
        
        return typingDiv;
    }

    function scrollToBottom() {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // --- Init ---

    // Add FAQ quick replies after a short delay
    setTimeout(() => {
        // Only add FAQs if the chat is empty (except for the greeting)
        if (chatbotMessages.children.length <= 1) {
            const faqDiv = document.createElement('div');
            faqDiv.className = 'bot-message';
            
            let faqHTML = `
                <i class="fas fa-robot"></i>
                <div class="message-content">
                    <p>Here are some common questions I can help with:</p>
                    <div class="faq-buttons" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
            `;

            faqSuggestions.slice(0, 3).forEach(faq => {
                faqHTML += `<button class="faq-btn" style="background: var(--primary); color: white; border: none; padding: 0.5rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; text-align: left;">${faq}</button>`;
            });

            faqHTML += `</div></div>`;
            faqDiv.innerHTML = faqHTML;
            
            chatbotMessages.appendChild(faqDiv);
            scrollToBottom();
            
            // Add click handlers to new FAQ buttons
            faqDiv.querySelectorAll('.faq-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    chatInput.value = btn.textContent;
                    sendMessage();
                });
            });
        }
    }, 1000);

    // Add CSS for typing indicator animation if not exists
    if (!document.getElementById('chat-dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'chat-dynamic-styles';
        style.textContent = `
            .typing-indicator .dots { display: inline-block; width: 20px; }
            .faq-btn:hover { opacity: 0.9; transform: scale(1.02); transition: all 0.2s; }
        `;
        document.head.appendChild(style);
    }
});