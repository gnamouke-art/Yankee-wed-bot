// Configuration
const API_URL = 'http://51.75.118.18:20040';
let currentUserId = null;
let statusInterval = null;

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

// Sauvegarder l'ID
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
    pairingResult.classList.remove('hidden');
    pairingResult.classList.add(type);
    
    setTimeout(() => {
        pairingResult.classList.add('hidden');
    }, 5000);
}

// Afficher le formulaire après génération d'ID
function showConnectionForm() {
    mainCard.style.display = 'block';
    statusCard.style.display = 'block';
}

// Créer une session (affiche juste le formulaire)
async function createSession() {
    showLoading(true);
    
    // Simuler une petite attente pour l'effet
    setTimeout(() => {
        showLoading(false);
        showConnectionForm();
        showResult('ID généré ! Connectez votre bot ci-dessous', 'success');
    }, 500);
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
    
    // Simuler une demande de code (à remplacer par ton API plus tard)
    setTimeout(() => {
        showLoading(false);
        const fakeCode = Math.floor(100000 + Math.random() * 900000);
        displayPairingCode(fakeCode);
        showResult('Code d\'appariement généré !', 'success');
    }, 1000);
}

// Afficher le code d'appariement
function displayPairingCode(code) {
    pairingCodeValue.textContent = code;
    pairingCodeDisplay.classList.remove('hidden');
}

// Générer QR
async function requestQR() {
    showLoading(true);
    
    setTimeout(() => {
        showLoading(false);
        generateQRDisplay('https://wa.me/qr/FakeQRCode');
        showResult('QR Code généré !', 'success');
    }, 1000);
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

// Supprimer la session
async function deleteSession() {
    if (!confirm('⚠️ Supprimer cette session ? Toutes les données seront perdues.')) return;
    
    localStorage.removeItem('yankee_hells_user_id');
    currentUserId = null;
    mainCard.style.display = 'none';
    statusCard.style.display = 'none';
    userIdInput.value = '';
    pairingCodeDisplay.classList.add('hidden');
    qrCodeDisplay.innerHTML = '<i class="fas fa-qrcode"></i><p>Cliquez pour générer</p>';
    showResult('Session supprimée', 'success');
}

// Copier le code
if (copyPairingCode) {
    copyPairingCode.addEventListener('click', () => {
        const code = pairingCodeValue.textContent;
        navigator.clipboard.writeText(code);
        showResult('Code copié !', 'success');
    });
}

// Événements
if (generateIdBtn) {
    generateIdBtn.addEventListener('click', () => {
        const newId = generateUserId();
        userIdInput.value = newId;
        saveUserId(newId);
        currentUserId = newId;
        createSession();
    });
}

if (pairBtn) {
    pairBtn.addEventListener('click', requestPairing);
}

if (generateQrBtn) {
    generateQrBtn.addEventListener('click', requestQR);
}

if (deleteSessionBtn) {
    deleteSessionBtn.addEventListener('click', deleteSession);
}

// Chargement initial
const savedId = loadSavedUserId();
if (savedId) {
    userIdInput.value = savedId;
    currentUserId = savedId;
    // Afficher directement le formulaire si un ID est déjà sauvegardé
    showConnectionForm();
}

// Method switching
const methodBtns = document.querySelectorAll('.method-btn');
const methodContents = document.querySelectorAll('.method-content');

if (methodBtns.length > 0) {
    methodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.dataset.method;
            methodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            methodContents.forEach(c => c.classList.remove('active'));
            const targetMethod = document.getElementById(`${method}Method`);
            if (targetMethod) targetMethod.classList.add('active');
        });
    });
}

console.log('Script chargé avec succès !');e');
    });
});
