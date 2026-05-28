// sessionManager.js - Gestion multi-utilisateurs
const fs = require('fs');
const path = require('path');
const { useMultiFileAuthState, makeWASocket, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// Stockage des sessions actives
const activeSessions = new Map();

// Créer une session pour un utilisateur
async function createUserSession(userId, phoneNumber) {
    const sessionPath = path.join(SESSIONS_DIR, userId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["YANKEE HELLS", "Chrome", "20.0.04"],
        auth: state,
        markOnlineOnConnect: true,
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    // Stocker la session
    activeSessions.set(userId, {
        sock,
        userId,
        phoneNumber,
        status: 'connecting',
        createdAt: Date.now()
    });
    
    // Gérer la connexion
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            activeSessions.set(userId, {
                ...activeSessions.get(userId),
                qrCode: qr,
                status: 'waiting_qr'
            });
            // Notifier via WebSocket ou API
            notifyUserStatus(userId, 'qr', qr);
        }
        
        if (connection === 'open') {
            activeSessions.set(userId, {
                ...activeSessions.get(userId),
                status: 'connected',
                connectedAt: Date.now()
            });
            notifyUserStatus(userId, 'connected', sock.user);
        }
        
        if (connection === 'close') {
            activeSessions.delete(userId);
            notifyUserStatus(userId, 'disconnected');
        }
    });
    
    // Demander le pairing code si numéro fourni
    if (phoneNumber) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                activeSessions.set(userId, {
                    ...activeSessions.get(userId),
                    pairingCode: code,
                    status: 'waiting_pairing'
                });
                notifyUserStatus(userId, 'pairing_code', code);
            } catch (error) {
                console.error('Pairing error:', error);
            }
        }, 3000);
    }
    
    return sock;
}

// Notifier les utilisateurs via WebSocket (à implémenter)
function notifyUserStatus(userId, event, data) {
    // Envoi via WebSocket à l'interface web
    if (global.wss) {
        global.wss.clients.forEach(client => {
            if (client.userId === userId) {
                client.send(JSON.stringify({ event, data }));
            }
        });
    }
}

// Obtenir le statut d'une session
function getUserSession(userId) {
    return activeSessions.get(userId);
}

// Supprimer une session
async function deleteUserSession(userId) {
    const session = activeSessions.get(userId);
    if (session && session.sock) {
        await session.sock.logout();
    }
    activeSessions.delete(userId);
    
    // Supprimer le dossier de session
    const sessionPath = path.join(SESSIONS_DIR, userId);
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
}

// Lister toutes les sessions
function listSessions() {
    return Array.from(activeSessions.values()).map(s => ({
        userId: s.userId,
        phoneNumber: s.phoneNumber,
        status: s.status,
        createdAt: s.createdAt,
        connectedAt: s.connectedAt
    }));
}

module.exports = {
    createUserSession,
    getUserSession,
    deleteUserSession,
    listSessions,
    activeSessions
};
