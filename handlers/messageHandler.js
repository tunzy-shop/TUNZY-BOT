const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const config = require('../config');
const path = require('path');
const fs = require('fs');

let sock;

async function startSock(phoneNumber, sessionId) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(
            path.join(config.SESSION_PATH, sessionId)
        );
        
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['TUNZY Bot', 'Safari', '1.0.0']
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('QR Code received for pairing:', qr);
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    await startSock(phoneNumber, sessionId);
                }
            } else if (connection === 'open') {
                console.log('WhatsApp Connected:', phoneNumber);
                
                // Auto join WhatsApp channel
                try {
                    await sock.groupAcceptInvite(config.WHATSAPP_CHANNEL_JID.split('@')[0]);
                } catch (error) {
                    console.log('Auto join channel error (might already be member):', error.message);
                }
            }
        });
        
        // Message handler
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const messageContent = msg.message.conversation || 
                                 msg.message.extendedTextMessage?.text || '';
            
            // Check if message is a command
            if (messageContent.startsWith('/') || messageContent.startsWith('.') || messageContent.startsWith('#')) {
                await handleCommand(sock, msg, messageContent);
            }
        });
        
        return sock;
    } catch (error) {
        console.error('Error starting WhatsApp session:', error);
        return null;
    }
}

async function handleCommand(sock, msg, command) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    
    // Extract command without prefix
    const cmd = command.toLowerCase().replace(/^[\/\.#]/, '');
    
    switch (cmd) {
        case 'menu':
            const menuCmd = require('../commands/menu');
            await menuCmd.execute(sock, msg, jid);
            break;
            
        case 't ios':
            const pingCmd = require('../commands/ping');
            await pingCmd.execute(sock, msg, jid);
            break;
            
        case 't droid':
            const statsCmd = require('../commands/stats');
            await statsCmd.execute(sock, msg, jid);
            break;
            
        case 't blank':
            const uptimeCmd = require('../commands/uptime');
            await uptimeCmd.execute(sock, msg, jid);
            break;
            
        case 't freeze':
            const tagallCmd = require('../commands/tagall');
            await tagallCmd.execute(sock, msg, jid);
            break;
            
        case 't invis':
            const hidetagCmd = require('../commands/hidetag');
            await hidetagCmd.execute(sock, msg, jid);
            break;
            
        default:
            await sock.sendMessage(jid, { text: '❌ Unknown command. Type /menu to see available commands.' });
    }
}

function setupWhatsAppHandlers() {
    // This function is called from main.js to set up initial handlers
    console.log('WhatsApp handlers initialized');
}

module.exports = { startSock, setupWhatsAppHandlers };
