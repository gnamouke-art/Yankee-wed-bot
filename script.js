// Configuration
const API_URL = 'http://51.75.118.18:20040'; // À remplacer par l'URL de ton bot sur Katabump
let currentUserId = null;
let statusInterval = null;
let ws = null;

// DOM Elements
const userIdInput = document.getElementById('userId');
const generateIdBtn = document.getElementById('generateIdBtn');
const savedIdAlert = document.getElementById('savedIdAlert');
const mainCard = document.getElementById('mainCard');
const statusCard = document.getElementById('statusCard');
const phoneInput = document.getElementById('phoneNumber');
const pairBtn = document.getElementById('pairBtn');
const generateQrBtn = document.getElementById('generateQrBtn');
const pairingResult = document.getElementById('pairingResult');
const pairingCodeDisplay = document.getElementById('pairingCodeDisplay');
const pairingCodeValue = document.getElementById('pairingCodeValue');
const copyPairingCode = document.getElementById('copyPairingCode');
const qrCodeDisplay = document.getElementById('qrCodeDisplay');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const sessionUser = document.getElementById('sessionUser');
const sessionTime = document.getElementById('sessionTime');
const deleteSessionBtn = document.getElementById('deleteSessionBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Générer un ID unique
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
}

// Sauvegarder l'ID dans localStorage
function saveUserId(userId) {
    localStorage.setItem('yankee_hells_user_id', userId);
    savedIdAlert.style.display = 'flex';
    setTimeout(() => {
        savedIdAlert.style.display = 'none';
    }, 3000);
}

// Charger l'ID sauvegardé
function loadSavedUserId() {
    return localStorage.getItem('yankee_hells_user_id');
}

// Afficher/Masquer le chargement
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

// Afficher un résultat
function showResult(message, type = 'info') {
    pairingResult.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
    pairingResult.classList.remove('hidden', 'success', 'error');
    pairingResult.classList.add(type);
    
    setTimeout(() => {
        pairingResult.classList.add('hidden');
    }, 5000);
}

// Mettre à jour le statut UI
function updateStatus(status, data = null) {
    switch(status) {
        case 'connected':
            statusDot.style.color = '#2ecc71';
            statusText.textContent = 'Connecté ✅';
            break;
        case 'connecting':
            statusDot.style.color = '#f39c12';
            statusText.textContent = 'Connexion en cours...';
            break;
        case 'waiting_qr':
            statusDot.style.color = '#3498db';
            statusText.textContent = 'En attente QR code';
            break;
        case 'waiting_pairing':
            statusDot.style.color = '#9b59b6';
            statusText.textContent = 'Code d\'appariement généré';
            break;
        default:
            statusDot.style.color = '#e74c3c';
            statusText.textContent = 'Hors ligne';
    }
    
    if (data && data.phoneNumber) {
        sessionUser.textContent = data.phoneNumber;
    }
    
    if (data && data.connectedAt) {
        sessionTime.textContent = new Date(data.connectedAt).toLocaleString();
    }
}

// WebSocket connexion
function connectWebSocket(userId) {
    if (ws) ws.close();
    
    ws = new WebSocket(`wss://${API_URL.split('//')[1]}?userId=${userId}`);
    
    ws.onopen = () => {
        console.log('WebSocket connecté');
        ws.send(JSON.stringify({ type: 'register', userId }));
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.event === 'qr') {
            generateQRDisplay(data.data);
            updateStatus('waiting_qr');
        } else if (data.event === 'pairing_code') {
            displayPairingCode(data.data);
            updateStatus('waiting_pairing');
        } else if (data.event === 'connected') {
            updateStatus('connected', { phoneNumber: currentUserId });
            showResult('Bot connecté avec succès !', 'success');
        } else if (data.event === 'disconnected') {
            updateStatus('offline');
            showResult('Session déconnectée', 'error');
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Créer une session
async function createSession(phoneNumber = null) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mainCard.style.display = 'block';
            statusCard.style.display = 'block';
            connectWebSocket(currentUserId);
            startStatusPolling();
            showResult('Session créée ! Utilisez une méthode ci-dessus', 'success');
        } else {
            showResult(data.error || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Create session error:', error);
        showResult('Erreur de connexion au serveur', 'error');
    } finally {
        showLoading(false);
    }
}

// Vérifier le statut de la session
async function checkSessionStatus() {
    if (!currentUserId) return;
    
    try {
        const response = await fetch(`${API_URL}/api/session/status/${currentUserId}`);
        const data = await response.json();
        
        if (data.status === 'connected') {
            updateStatus('connected');
            mainCard.style.display = 'block';
            statusCard.style.display = 'block';
        } else if (data.status === 'waiting_qr') {
            updateStatus('waiting_qr');
            mainCard.style.display = 'block';
            statusCard.style.display = 'block';
        } else if (data.status === 'waiting_pairing') {
            updateStatus('waiting_pairing');
            mainCard.style.display = 'block';
            statusCard.style.display = 'block';
            if (data.pairingCode) {
                displayPairingCode(data.pairingCode);
            }
        } else if (data.status === 'not_found') {
            mainCard.style.display = 'none';
            statusCard.style.display = 'none';
        }
    } catch (error) {
        console.error('Status check error:', error);
    }
}

function startStatusPolling() {
    if (statusInterval) clearInterval(statusInterval);
    statusInterval = setInterval(checkSessionStatus, 3000);
}

// Afficher le QR code
function generateQRDisplay(qrString) {
    qrCodeDisplay.innerHTML = '';
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`;
    img.style.width = '200px';
    img.style.height = '200px';
    qrCodeDisplay.appendChild(img);
}

// Afficher le code d'appariement
function displayPairingCode(code) {
    pairingCodeValue.textContent = code;
    pairingCodeDisplay.classList.remove('hidden');
}

// Demander pairing code
async function requestPairing() {
    let phone = phoneInput.value.trim();
    if (!phone) {
        showResult('Veuillez entrer un numéro', 'error');
        return;
    }
    
    phone = phone.replace(/[^0-9]/g, '');
    if (!phone.startsWith('225')) {
        phone = '225' + phone;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, phoneNumber: phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('Code d\'appariement demandé...', 'success');
            // Le code sera reçu via WebSocket
        } else {
            showResult(data.error || 'Erreur', 'error');
        }
    } catch (error) {
        showResult('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

// Générer QR
async function requestQR() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult('QR Code demandé...', 'success');
        } else {
            showResult(data.error || 'Erreur', 'error');
        }
    } catch (error) {
        showResult('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

// Supprimer la session
async function deleteSession() {
    if (!confirm('⚠️ Supprimer cette session ? Toutes les données seront perdues.')) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/api/session/delete/${currentUserId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.removeItem('yankee_hells_user_id');
            currentUserId = null;
            mainCard.style.display = 'none';
            statusCard.style.display = 'none';
            userIdInput.value = '';
            showResult('Session supprimée', 'success');
            setTimeout(() => location.reload(), 2000);
        }
    } catch (error) {
        showResult('Erreur', 'error');
    } finally {
        showLoading(false);
    }
}

// Copier le code
copyPairingCode.addEventListener('click', () => {
    const code = pairingCodeValue.textContent;
    navigator.clipboard.writeText(code);
    showResult('Code copié !', 'success');
});

// Événements
generateIdBtn.addEventListener('click', () => {
    const newId = generateUserId();
    userIdInput.value = newId;
    saveUserId(newId);
    currentUserId = newId;
    createSession();
});

pairBtn.addEventListener('click', requestPairing);
generateQrBtn.addEventListener('click', requestQR);
deleteSessionBtn.addEventListener('click', deleteSession);

// Chargement initial
const savedId = loadSavedUserId();
if (savedId) {
    userIdInput.value = savedId;
    currentUserId = savedId;
    checkSessionStatus();
    startStatusPolling();
}

// Method switching
const methodBtns = document.querySelectorAll('.method-btn');
const methodContents = document.querySelectorAll('.method-content');

methodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const method = btn.dataset.method;
        methodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        methodContents.forEach(c => c.classList.remove('active'));
        document.getElementById(`${method}Method`).classList.add('active');
    });
});
