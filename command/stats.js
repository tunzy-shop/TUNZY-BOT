const os = require('os');

module.exports = {
    name: 'stats',
    execute: async (sock, msg, jid) => {
        const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const totalMemory = os.totalmem() / 1024 / 1024;
        const freeMemory = os.freemem() / 1024 / 1024;
        const cpuUsage = os.loadavg()[0];
        
        const stats = `📊 *BOT STATISTICS*\n\n` +
                     `💻 *Platform:* ${os.platform()}\n` +
                     `🖥 *CPU Cores:* ${os.cpus().length}\n` +
                     `📈 *CPU Load:* ${cpuUsage.toFixed(2)}%\n` +
                     `💾 *RAM Used:* ${usedMemory.toFixed(2)} MB\n` +
                     `💾 *Total RAM:* ${totalMemory.toFixed(2)} MB\n` +
                     `💾 *Free RAM:* ${freeMemory.toFixed(2)} MB\n` +
                     `⏰ *Uptime:* ${Math.floor(process.uptime() / 60)} minutes`;
        
        await sock.sendMessage(jid, { text: stats });
    }
};
