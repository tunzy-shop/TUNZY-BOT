require('dotenv').config();

module.exports = {
    // Telegram Configuration
    TELEGRAM_TOKEN: '8622525836:AAHmK3kXXKh-EIDi62g7mqop6rlb179AuJo',
    TELEGRAM_CHANNEL: '@tunzy_md',
    TELEGRAM_GROUP: '@tunzymd_tech',
    TELEGRAM_CHANNEL_LINK: 'https://t.me/tunzy_md',
    TELEGRAM_GROUP_LINK: 'https://t.me/tunzymd_tech',
    
    // WhatsApp Configuration
    WHATSAPP_CHANNEL_JID: '120363422591784062@g.us',
    
    // Bot Settings
    BOT_NAME: 'TUNZY',
    MAX_PAIRS_PER_USER: 2,
    MAX_TOTAL_PAIRS: 300,
    SESSION_PATH: './sessions',
    
    // Deployment
    PLATFORM: 'termux'
};
