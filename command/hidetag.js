module.exports = {
    name: 'hidetag',
    execute: async (sock, msg, jid) => {
        // Check if it's a group
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ This command can only be used in groups!' });
        }
        
        const messageText = msg.message.conversation || 
                           msg.message.extendedTextMessage?.text || '';
        
        // Extract the message after the command
        const hiddenMessage = messageText.replace(/^[\/\.#]t invis\s*/i, '').trim();
        
        if (!hiddenMessage) {
            return sock.sendMessage(jid, { text: '❌ Please provide a message to send!\nExample: /t invis Hello everyone' });
        }
        
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const mentions = participants.map(p => p.id);
        
        await sock.sendMessage(jid, {
            text: hiddenMessage,
            mentions: mentions
        });
    }
};
