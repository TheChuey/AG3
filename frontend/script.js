/**
 * AG3 SYSTEM CONFIGURATION - v3.0.0-GOLD
 * Centralized control for branding and logic.
 */
const AG3_CONFIG = {
    version: "v3.0.0-GOLD",
    statusText: "SYSTEM ONLINE",
    brandColor: "#00f2ff", 
    glowColor: "rgba(0, 242, 255, 0.4)",
    bannerBg: "linear-gradient(90deg, #1e1e24 0%, #0d0d12 100%)"
};

// --- GLOBAL ELEMENTS ---
const chatDisplay = document.getElementById('chatDisplay');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');
const savedItemsContainer = document.getElementById('savedItemsContainer');

// --- 1. DYNAMIC BRANDING ENGINE ---
function applyBranding() {
    const banner = document.getElementById('versionBanner');
    if (banner) {
        banner.innerHTML = `
            <div class="brand-title" style="font-weight: 800; letter-spacing: 2px;">
                RESEARCH AGENT <span style="color:${AG3_CONFIG.brandColor}">PROTOTYPE</span>
            </div>
            <div class="version-badge" style="
                background: ${AG3_CONFIG.brandColor}; color: #000; padding: 6px 16px; 
                border-radius: 4px; font-family: monospace; font-weight: 900; 
                font-size: 0.85rem; box-shadow: 0 0 15px ${AG3_CONFIG.brandColor};
                letter-spacing: 1px; text-transform: uppercase;">
                ${AG3_CONFIG.version} — ${AG3_CONFIG.statusText}
            </div>
        `;
        banner.style.background = AG3_CONFIG.bannerBg;
        banner.style.borderBottom = `3px solid ${AG3_CONFIG.brandColor}`;
    }
    document.documentElement.style.setProperty('--accent', AG3_CONFIG.brandColor);
}

// --- 2. COPY & CLIPBOARD LOGIC ---
async function executeCopy(btn, text) {
    try {
        await navigator.clipboard.writeText(text);
        const originalText = btn.innerText;
        btn.innerText = "COPIED!";
        btn.classList.add('copy-success');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('copy-success');
        }, 2000);
    } catch (err) {
        // Fallback for non-https/older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        btn.innerText = "DONE!";
        setTimeout(() => { btn.innerText = "Copy"; }, 2000);
    }
}

// --- 3. RENDERING ENGINE ---
function renderMessage(source, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-item ${source === 'User' ? 'user-message' : 'llm-message'}`;

    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let formattedText = text.replace(codeRegex, (match, lang, code) => {
        const language = lang || 'python';
        const cleanCode = code.trim();
        return `
            <div class="code-container">
                <div class="code-header">
                    <span>${language}</span>
                    <button class="copy-btn">Copy</button>
                </div>
                <pre class="language-${language}"><code class="language-${language}">${escapeHtml(cleanCode)}</code></pre>
                <textarea class="raw-code" style="display:none;">${cleanCode}</textarea>
            </div>`;
    });

    messageDiv.innerHTML = `
        <div class="message-source">${source}</div>
        <div class="message-text">${formattedText}</div>
    `;

    // Click to save to notes
    messageDiv.addEventListener('click', () => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'saved-item';
        noteDiv.innerText = text;
        savedItemsContainer.appendChild(noteDiv);
    });

    chatDisplay.appendChild(messageDiv);

    // Attach copy buttons
    messageDiv.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent saving note when copying
            const raw = btn.closest('.code-container').querySelector('.raw-code').value;
            executeCopy(btn, raw);
        });
    });

    if (window.Prism) Prism.highlightAllUnder(messageDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function escapeHtml(t) {
    return t.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m]));
}

// --- 4. CHAT SUBMISSION (The Fixed Connection) ---
async function handleSend() {
    const val = chatInput.value.trim();
    if (!val) return;

    console.log("Attempting to send:", val); // Debugging
    renderMessage('User', val);
    chatInput.value = '';

    try {
        const res = await fetch('/api/chat', { // RELATIVE URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: val, model: modelSelect.value })
        });

        if (!res.ok) throw new Error(`Server Error: ${res.status}`);

        const data = await res.json();
        renderMessage(data.source, data.reply);
    } catch (e) {
        console.error("Chat Error:", e);
        renderMessage('System', "CONNECTION ERROR: Check if server.py is running on the correct port.");
    }
}

// --- 5. INITIALIZATION ---
async function initSystem() {
    applyBranding();
    
    // Style the Model Selector to match the GOLD theme
    modelSelect.style.fontFamily = "monospace";
    modelSelect.style.fontWeight = "900";
    modelSelect.style.backgroundColor = AG3_CONFIG.brandColor;
    modelSelect.style.color = "#000";

    try {
        const response = await fetch('/api/models'); // RELATIVE URL
        const data = await response.json();
        if (data.models) {
            modelSelect.innerHTML = ''; 
            data.models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.textContent = `MODEL: ${m.toUpperCase()}`;
                if (m.includes('qwen')) opt.selected = true;
                modelSelect.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn("Could not load models. Check backend.");
    }
}

// --- 6. EVENT LISTENERS ---
sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSend(); 
    }
});

window.addEventListener('DOMContentLoaded', initSystem);