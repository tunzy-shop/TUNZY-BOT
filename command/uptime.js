module.exports = {
    name: 'uptime',
    execute: async (sock, msg, jid) => {
        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);
        
        let uptimeStr = '⏰ *BOT UPTIME*\n\n';
        
        if (days > 0) uptimeStr += `📅 ${days} Days, `;
        if (hours > 0) uptimeStr += `🕐 ${hours} Hours, `;
        uptimeStr += `⏱ ${minutes} Minutes, `;
        uptimeStr += `⏲ ${seconds} Seconds`;
        
        await sock.sendMessage(jid, { text: uptimeStr });
    }
};
