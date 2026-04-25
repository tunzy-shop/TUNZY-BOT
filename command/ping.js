module.exports = {
    name: 'ping',
    execute: async (sock, msg, jid) => {
        const start = Date.now();
        const sent = await sock.sendMessage(jid, { text: '📊 *Calculating ping...*' });
        const end = Date.now();
        
        const ping = end - start;
        
        await sock.sendMessage(jid, { 
            text: `🏓 *Pong!*\n\n📡 *Response Time:* ${ping}ms`,
            edit: sent.key
        });
    }
};
