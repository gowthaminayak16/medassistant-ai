/* ==========================================================================
   MedAssistant AI - Core Application Logic (Vanilla JS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// App State
let activeTab = 'dashboard';
let medications = [];
let selectedSymptoms = new Set();
let currentWizardStep = 1;
let chatHistory = [];

// Clinical Chat Sim Responses
const AI_RESPONSES = {
    "hello": "Hello John! I'm your MedAssistant AI. How are you feeling today? You can ask me about symptoms, medication side effects, or wellness tips.",
    "hi": "Hello John! I'm your MedAssistant AI. How can I assist you with your health today?",
    "headache": "A headache for two days deserves careful monitoring. For general tension headaches, ensure you are fully hydrated, rest in a quiet, dark room, and limit screen time. Over-the-counter options like acetaminophen (Paracetamol) or ibuprofen can help, but adhere strictly to package dosing. **Red flags**: If you experience a sudden 'thunderclap' headache, stiff neck, high fever, or vision issues, seek immediate medical attention.",
    "metformin": "Metformin is commonly prescribed for Type 2 Diabetes to improve insulin sensitivity. **Common side effects** include nausea, diarrhea, abdominal discomfort, and a metallic taste. These often resolve within a few weeks as your body adjusts. Taking it with meals can significantly reduce gastrointestinal symptoms. **Rare but Serious**: Lactic acidosis is a rare but life-threatening complication. Seek emergency care if you experience extreme fatigue, muscle pain, difficulty breathing, or sudden stomach discomfort.",
    "blood sugar": "Symptoms of high blood sugar (hyperglycemia) include increased thirst (polydipsia), frequent urination (polyuria), fatigue, headaches, and blurred vision. If blood sugar remains elevated, it can lead to diabetic ketoacidosis (DKA), which is a medical emergency characterized by fruit-scented breath, confusion, and abdominal pain. Monitor your blood glucose levels closely and contact your physician if they consistently exceed target levels.",
    "back pain": "Lower back pain is very common and often muscular in nature. **Recommended exercises** include gentle stretching, knee-to-chest stretches, the 'Cat-Cow' yoga stretch, and core-strengthening exercises once pain subsides. **Self-care**: Apply ice for the first 48 hours to reduce inflammation, then transition to heat. Avoid bed rest; light walking is highly encouraged. **Red flags**: Seek urgent care if back pain is accompanied by loss of bowel/bladder control, numbness in the groin area (saddle anesthesia), or fever.",
    "default": "I understand your concern. Based on clinical guidelines, I recommend tracking symptoms like severity, triggers, and duration. For a more personalized triage, please run a report in our **Symptom Checker** tab, or consult with your primary doctor. If you are experiencing chest pain, difficulty breathing, or severe sudden pain, please call emergency services."
};

// Initializer
function initApp() {
    // Nav Routing
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Date Display
    updateDateDisplay();

    // Vitals Simulation
    startVitalsSimulation();

    // Medications Store
    loadMedications();

    // Modal Events
    const openModalBtn = document.getElementById('btn-add-med-modal');
    const closeModalBtn = document.getElementById('close-med-modal');
    const cancelModalBtn = document.getElementById('btn-cancel-med');
    const modal = document.getElementById('add-med-modal');

    openModalBtn.onclick = () => modal.classList.add('active');
    
    const closeModal = () => modal.classList.remove('active');
    closeModalBtn.onclick = closeModal;
    cancelModalBtn.onclick = closeModal;
    
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };

    // Chat Events
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-message');
    
    sendBtn.onclick = () => handleUserMessage();
    chatInput.onkeypress = (e) => {
        if (e.key === 'Enter') handleUserMessage();
    };

    // Symptom Checker Search
    const searchInput = document.getElementById('symptom-search-input');
    searchInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            addCustomSymptom();
        }
    };
}

// 1. Tab Router Logic
function switchTab(tabId) {
    activeTab = tabId;
    
    // Toggle active section
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Toggle active nav button
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update Headers
    const title = document.getElementById('current-section-title');
    const subtitle = document.getElementById('current-section-subtitle');

    switch(tabId) {
        case 'dashboard':
            title.innerText = 'Dashboard';
            subtitle.innerText = 'Welcome back, John. Here is your health overview.';
            break;
        case 'chat':
            title.innerText = 'AI Consultation';
            subtitle.innerText = 'Discuss symptoms, ask about prescriptions, or get wellness tips.';
            // Remove pulse indicator if user opens chat
            const pulse = document.querySelector('.pulse-indicator');
            if (pulse) pulse.remove();
            break;
        case 'symptom':
            title.innerText = 'Symptom Triage Wizard';
            subtitle.innerText = 'Perform an automated medical assessment for diagnostic reports.';
            break;
        case 'profile':
            title.innerText = 'Health Profile';
            subtitle.innerText = 'Manage physical attributes, clinical histories, and telemetry integrations.';
            break;
    }
}

// Global hook for inline HTML clicks
window.switchTab = switchTab;

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date-display').innerText = new Date().toLocaleDateString('en-US', options);
}

// 2. Vitals Telemetry Simulator
function startVitalsSimulation() {
    setInterval(() => {
        // Heart rate fluctuations (68 - 76)
        const currentHr = parseInt(document.getElementById('vital-heart').innerText);
        const hrDelta = Math.random() > 0.5 ? 1 : -1;
        const nextHr = Math.max(65, Math.min(80, currentHr + hrDelta));
        document.getElementById('vital-heart').innerText = nextHr;

        // Steps increments
        const stepsStr = document.getElementById('vital-steps').innerText.replace(',', '');
        const currentSteps = parseInt(stepsStr);
        const stepsAdd = Math.floor(Math.random() * 5); // 0 to 4 steps
        if (stepsAdd > 0) {
            const nextSteps = currentSteps + stepsAdd;
            document.getElementById('vital-steps').innerText = nextSteps.toLocaleString();
            
            // Update step percentage fill
            const percent = Math.min(100, (nextSteps / 8000) * 100);
            document.querySelector('.steps-fill').style.width = `${percent}%`;
            document.querySelector('.activity-tracker .card-value').nextElementSibling.nextElementSibling.innerHTML = 
                `<span class="status-dot"></span> Active (${Math.round(percent)}% goal)`;
        }
    }, 4000);
}

// 3. Medication List Management
const DEFAULT_MEDS = [
    { id: 1, name: "Lisinopril", dose: "10mg", frequency: "1 capsule Daily (Morning)", time: "08:00 AM", taken: true },
    { id: 2, name: "Omega-3 Fish Oil", dose: "1000mg", frequency: "2 softgels Daily (With meal)", time: "01:00 PM", taken: false }
];

function loadMedications() {
    const stored = localStorage.getItem('medassistant_meds');
    if (stored) {
        medications = JSON.parse(stored);
    } else {
        medications = [...DEFAULT_MEDS];
        saveMedicationsToStorage();
    }
    renderMedications();
}

function saveMedicationsToStorage() {
    localStorage.setItem('medassistant_meds', JSON.stringify(medications));
}

function renderMedications() {
    const container = document.getElementById('medication-list');
    container.innerHTML = '';

    if (medications.length === 0) {
        container.innerHTML = `<div class="no-symptoms-placeholder">No medications scheduled.</div>`;
        return;
    }

    medications.forEach(med => {
        const item = document.createElement('div');
        item.className = 'med-item';
        
        let actionMarkup = '';
        if (med.taken) {
            actionMarkup = `<span class="status-tag taken">Taken</span>`;
        } else {
            actionMarkup = `<button class="btn btn-action" onclick="markAsTaken(${med.id})">Mark Taken</button>`;
        }

        item.innerHTML = `
            <div class="med-info">
                <h4>${med.name}</h4>
                <p>${med.dose} • ${med.frequency}</p>
            </div>
            <div class="med-time">${med.time}</div>
            <div class="med-actions">
                ${actionMarkup}
            </div>
        `;
        container.appendChild(item);
    });
}

function markAsTaken(id) {
    const medIndex = medications.findIndex(m => m.id === id);
    if (medIndex !== -1) {
        medications[medIndex].taken = true;
        saveMedicationsToStorage();
        renderMedications();
    }
}
window.markAsTaken = markAsTaken;

function formatTimeToAMPM(time24) {
    if (!time24) return "";
    let [hours, minutes] = time24.split(":");
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function handleNewMedication(event) {
    event.preventDefault();
    const name = document.getElementById('new-med-name').value;
    const dosage = document.getElementById('new-med-dosage').value;
    const freq = document.getElementById('new-med-frequency').value;
    const rawTime = document.getElementById('new-med-time').value;

    const formattedTime = formatTimeToAMPM(rawTime);

    const newMed = {
        id: Date.now(),
        name: name,
        dose: dosage,
        frequency: freq,
        time: formattedTime,
        taken: false
    };

    medications.push(newMed);
    saveMedicationsToStorage();
    renderMedications();
    
    // Close modal
    document.getElementById('add-med-modal').classList.remove('active');
    // Reset form
    document.getElementById('add-med-form').reset();
}
window.handleNewMedication = handleNewMedication;

// 4. Clinical Chatbot Simulation
function appendChatMessage(sender, text) {
    const chatContainer = document.getElementById('chat-messages-container');
    const msgElement = document.createElement('div');
    msgElement.className = `message ${sender}`;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format bold text markdown simple helper
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    msgElement.innerHTML = `
        <div class="msg-bubble">
            ${formattedText}
        </div>
        <span class="msg-time">${timestamp}</span>
    `;

    chatContainer.appendChild(msgElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleUserMessage() {
    const input = document.getElementById('chat-input');
    const query = input.value.trim();
    if (!query) return;

    // Append User Message
    appendChatMessage('user', query);
    input.value = '';

    // Show Typing Indicator
    const typingIndicator = document.getElementById('chat-typing');
    typingIndicator.style.display = 'flex';

    // Simulate AI Response streaming delay
    setTimeout(() => {
        typingIndicator.style.display = 'none';
        
        // Find matching keywords
        let lowercaseQuery = query.toLowerCase();
        let matchedResponse = AI_RESPONSES["default"];

        for (const [key, value] of Object.entries(AI_RESPONSES)) {
            if (lowercaseQuery.includes(key)) {
                matchedResponse = value;
                break;
            }
        }

        appendChatMessage('assistant', matchedResponse);
    }, 1500);
}

function sendSuggestedMessage(text) {
    document.getElementById('chat-input').value = text;
    handleUserMessage();
}
window.sendSuggestedMessage = sendSuggestedMessage;

// 5. Symptom Triage Wizard Logic
function nextWizardStep(stepNum) {
    if (stepNum === 2) {
        // Validate basic criteria if needed, proceed
    }
    if (stepNum === 3 && selectedSymptoms.size === 0) {
        alert("Please select or add at least one symptom before continuing.");
        return;
    }

    currentWizardStep = stepNum;
    
    // Toggle active content divs
    document.querySelectorAll('.wizard-step-content').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(`wizard-step-${stepNum}`).classList.add('active');

    // Update Indicator Styles
    updateWizardIndicators();
}
window.nextWizardStep = nextWizardStep;

function prevWizardStep(stepNum) {
    currentWizardStep = stepNum;
    document.querySelectorAll('.wizard-step-content').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(`wizard-step-${stepNum}`).classList.add('active');
    updateWizardIndicators();
}
window.prevWizardStep = prevWizardStep;

function updateWizardIndicators() {
    for (let i = 1; i <= 4; i++) {
        const ind = document.getElementById(`step-${i}-indicator`);
        if (i === currentWizardStep) {
            ind.className = 'step active';
        } else if (i < currentWizardStep) {
            ind.className = 'step completed';
        } else {
            ind.className = 'step';
        }
    }
}

// Symptom Tags selection pool
function toggleSymptomTag(button, symptomName) {
    button.classList.toggle('selected');
    if (button.classList.contains('selected')) {
        selectedSymptoms.add(symptomName);
    } else {
        selectedSymptoms.delete(symptomName);
    }
    renderSelectedSymptoms();
}
window.toggleSymptomTag = toggleSymptomTag;

function addCustomSymptom() {
    const input = document.getElementById('symptom-search-input');
    const sym = input.value.trim();
    if (!sym) return;

    // Check if already selected
    if (selectedSymptoms.has(sym)) {
        input.value = '';
        return;
    }

    selectedSymptoms.add(sym);
    renderSelectedSymptoms();
    input.value = '';

    // Check if it's already in the pool to highlight it
    document.querySelectorAll('.symptom-tag').forEach(btn => {
        if (btn.innerText.includes(sym)) {
            btn.classList.add('selected');
        }
    });
}
window.addCustomSymptom = addCustomSymptom;

function removeSelectedSymptom(symptomName) {
    selectedSymptoms.delete(symptomName);
    renderSelectedSymptoms();

    // Un-highlight in the pool
    document.querySelectorAll('.symptom-tag').forEach(btn => {
        if (btn.innerText.includes(symptomName)) {
            btn.classList.remove('selected');
        }
    });
}

function renderSelectedSymptoms() {
    const container = document.getElementById('selected-symptoms-container');
    container.innerHTML = '';

    if (selectedSymptoms.size === 0) {
        container.innerHTML = `<span class="no-symptoms-placeholder">No symptoms selected yet.</span>`;
        return;
    }

    selectedSymptoms.forEach(sym => {
        const chip = document.createElement('span');
        chip.className = 'selected-chip';
        chip.innerHTML = `
            ${sym} <span class="close-chip" onclick="removeSelectedSymptom('${sym}')">&times;</span>
        `;
        container.appendChild(chip);
    });
}
window.removeSelectedSymptom = removeSelectedSymptom;

// Diagnostic Report Generator (Simulated AI)
function runSymptomAnalysis() {
    nextWizardStep(4); // Switch view to step 4 (which displays spinner)
    
    const spinner = document.getElementById('analysis-spinner');
    const results = document.getElementById('analysis-results');
    
    spinner.classList.remove('hidden');
    results.classList.add('hidden');

    setTimeout(() => {
        spinner.classList.add('hidden');
        results.classList.remove('hidden');

        generateReportData();
    }, 2500);
}
window.runSymptomAnalysis = runSymptomAnalysis;

function generateReportData() {
    const age = document.getElementById('symp-age').value;
    const sex = document.getElementById('symp-gender').value;
    const severity = document.getElementById('symptom-severity-slider').value;
    const duration = document.getElementById('symptom-duration').value;
    
    // Triage evaluation based on indicators
    let risk = "Low Risk";
    let riskClass = "low";
    let considerations = "";
    let actionItems = [];
    let redFlags = "Seek immediate clinical attention if you experience: sudden severe worsening, high fever, or loss of balance.";

    const symptomsList = Array.from(selectedSymptoms);
    const hasHighRiskSymptom = symptomsList.some(s => 
        ['Chest Pain', 'Shortness of Breath', 'Dizziness'].includes(s)
    );
    const hasMediumRiskSymptom = symptomsList.some(s => 
        ['Fever', 'Nausea', 'Headache'].includes(s)
    );

    // Risk classification mapping
    if (hasHighRiskSymptom || severity >= 8) {
        risk = "High Risk Triage Required";
        riskClass = "high";
        considerations = `The reporting of symptoms including ${symptomsList.join(', ')} coupled with high discomfort levels (${severity}/10) warrants a formal clinical evaluation. High risks include potential respiratory distress or cardiovascular strain.`;
        actionItems = [
            "Contact your primary care physician or local triage nurse line within 4 hours.",
            "Avoid strenuous physical strain, monitor heart rate and oxygenation.",
            "Keep a log of vital signs to present to the clinical team."
        ];
        redFlags = "Call emergency services (911) immediately if chest tightness radiates to the arm/jaw, or if breathing becomes highly labored.";
    } else if (hasMediumRiskSymptom || severity >= 5) {
        risk = "Moderate Risk Triage";
        riskClass = "medium";
        considerations = `Based on the reported presence of ${symptomsList.join(', ')} for ${duration}, physiological patterns suggest moderate acute conditions such as viral infection (like influenza), sinusitis, or stomach influenza.`;
        actionItems = [
            "Rest extensively and secure hydration of at least 2.5 Litres of water daily.",
            "Monitor body temperature twice daily. Take over-the-counter antipyretics (e.g. Paracetamol) if fever exceeds 38°C.",
            "If symptoms persist or worsen beyond 5 days, consult your primary care clinician."
        ];
    } else {
        risk = "Low Risk Triage";
        riskClass = "low";
        considerations = `Your report of mild ${symptomsList.join(', ')} indicates a localized tension, fatigue, or low-grade viral response. Your vitals dashboard shows stable rest indicators.`;
        actionItems = [
            "Increase recovery sleep and optimize nutrition intake.",
            "Perform light stretches to ease localized discomfort.",
            "Continue tracing daily vitals and medication schedules."
        ];
    }

    // Populate DOM Elements
    const badge = document.getElementById('report-risk-badge');
    badge.innerText = risk;
    badge.className = `report-badge ${riskClass}`;

    document.getElementById('report-time').innerText = new Date().toLocaleString();
    document.getElementById('report-consideration').innerText = considerations;
    document.getElementById('report-red-flags').innerText = redFlags;

    const actionsContainer = document.getElementById('report-actions');
    actionsContainer.innerHTML = '';
    actionItems.forEach(act => {
        const li = document.createElement('li');
        li.innerText = act;
        actionsContainer.appendChild(li);
    });
}

function restartSymptomWizard() {
    selectedSymptoms.clear();
    document.querySelectorAll('.symptom-tag').forEach(btn => btn.classList.remove('selected'));
    renderSelectedSymptoms();
    
    document.getElementById('wizard-step-1').classList.add('active');
    document.getElementById('wizard-step-4').classList.remove('active');
    
    currentWizardStep = 1;
    updateWizardIndicators();
}
window.restartSymptomWizard = restartSymptomWizard;

function consultReportInChat() {
    // Switch to Chat Tab
    switchTab('chat');

    // Send context message into chat
    const symptomsList = Array.from(selectedSymptoms).join(', ');
    const severity = document.getElementById('symptom-severity-slider').value;
    const duration = document.getElementById('symptom-duration').value;

    appendChatMessage('user', `I just generated a Symptom Analysis. Selected: [${symptomsList}] with severity ${severity}/10 for ${duration}. Can we discuss this?`);

    const typingIndicator = document.getElementById('chat-typing');
    typingIndicator.style.display = 'flex';

    setTimeout(() => {
        typingIndicator.style.display = 'none';
        const msg = `I see your triage report for **${symptomsList}** (Severity: ${severity}/10, Duration: ${duration}). I recommend monitoring your symptoms closely. If there's any difficulty breathing, sudden weakness, or intense pressure, seek immediate emergency help. Otherwise, focus on hydration, resting, and checking your vitals dashboard. Let me know if you want info on specific symptom care guidelines!`;
        appendChatMessage('assistant', msg);
    }, 1500);
}
window.consultReportInChat = consultReportInChat;
