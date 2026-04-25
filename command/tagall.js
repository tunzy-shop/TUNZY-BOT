module.exports = {
    name: 'tagall',
    execute: async (sock, msg, jid) => {
        // Check if it's a group
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ This command can only be used in groups!' });
        }
        
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        
        let mentionText = '📢 *ATTENTION EVERYONE!*\n\n';
        const mentions = [];
        
        for (let participant of participants) {
            const number = participant.id.split('@')[0];
            mentionText += `@${number} `;
            mentions.push(participant.id);
        }
        
        await sock.sendMessage(jid, {
            text: mentionText,
            mentions: mentions
        });
    }
};
