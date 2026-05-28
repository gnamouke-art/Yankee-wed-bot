// server.js - API Server pour Katabump
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createUserSession, getUserSession, deleteUserSession, listSessions } = require('./sessionManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ API ENDPOINTS ============

// 1. Créer une nouvelle session utilisateur
app.post('/api/session/create', async (req, res) => {
    const { userId, phoneNumber } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId requis' });
    }
    
    try {
        // Vérifier si une session existe déjà
        const existing = getUserSession(userId);
        if (existing) {
            return res.json({ 
                success: true, 
                message: 'Session déjà existante',
                status: existing.status 
            });
        }
        
        await createUserSession(userId, phoneNumber);
        
        res.json({ 
            success: true, 
            message: 'Session créée',
            userId: userId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Obtenir le statut d'une session
app.get('/api/session/status/:userId', (req, res) => {
    const { userId } = req.params;
    const session = getUserSession(userId);
    
    if (!session) {
        return res.json({ status: 'not_found' });
    }
    
    res.json({
        status: session.status,
        qrCode: session.qrCode,
        pairingCode: session.pairingCode,
        phoneNumber: session.phoneNumber,
        connectedAt: session.connectedAt
    });
});

// 3. Supprimer une session
app.delete('/api/session/delete/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        await deleteUserSession(userId);
        res.json({ success: true, message: 'Session supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Lister toutes les sessions (admin)
app.get('/api/sessions/list', (req, res) => {
    const sessions = listSessions();
    res.json({ sessions, count: sessions.length });
});

// 5. Envoyer un message via une session
app.post('/api/session/send', async (req, res) => {
    const { userId, jid, message } = req.body;
    
    const session = getUserSession(userId);
    if (!session || session.status !== 'connected') {
        return res.status(400).json({ error: 'Session non connectée' });
    }
    
    try {
        await session.sock.sendMessage(jid, { text: message });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. WebSocket pour les mises à jour en temps réel
const server = app.listen(PORT, () => {
    console.log(`🚀 YANKEE HELLS API running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} to connect`);
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
global.wss = wss;

wss.on('connection', (ws, req) => {
    const userId = req.url.split('?userId=')[1];
    if (userId) ws.userId = userId;
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'register') {
            ws.userId = data.userId;
        }
    });
});
