const path = require('path');

module.exports = {
    name: 'menu',
    execute: async (sock, msg, jid) => {
        const menuText = `🤖 *TUNZY BOT MENU*\n\n` +
                        `💀 *T iOS* - Ping Command\n` +
                        `💀 *T DROID* - Bot Statistics\n` +
                        `💀 *T BLANK* - Bot Uptime\n` +
                        `💀 *T FREEZE* - Tag All Members\n` +
                        `💀 *T INVIS* - Hidden Tag\n\n` +
                        `📌 *Prefix:* . or / or #\n` +
                        `📱 *Bot by:* TUNZY`;
        
        const imagePath = path.join(__dirname, '../assets/tunzy.jpg');
        
        if (require('fs').existsSync(imagePath)) {
            await sock.sendMessage(jid, {
                image: { url: imagePath },
                caption: menuText
            });
        } else {
            await sock.sendMessage(jid, { text: menuText });
        }
    }
};
