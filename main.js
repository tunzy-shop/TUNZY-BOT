const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const { setupWhatsAppHandlers } = require('./handlers/messageHandler');
const { initializeTelegramBot } = require('./plugins/telegramBot');

// Create sessions directory if it doesn't exist
if (!fs.existsSync(config.SESSION_PATH)) {
    fs.mkdirSync(config.SESSION_PATH, { recursive: true });
}

// Track paired users and counts
global.pairedUsers = new Map();
global.totalPairs = 0;
global.userPairCounts = new Map();

// Load existing data if available
try {
    if (fs.existsSync('./data.json')) {
        const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
        global.totalPairs = data.totalPairs || 0;
        global.userPairCounts = new Map(Object.entries(data.userPairCounts || {}));
    }
} catch (err) {
    console.log('No existing data found, starting fresh');
}

// Save data function
global.saveData = () => {
    const data = {
        totalPairs: global.totalPairs,
        userPairCounts: Object.fromEntries(global.userPairCounts)
    };
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
};

// Initialize Telegram Bot
const bot = new TelegramBot(config.TELEGRAM_TOKEN, { polling: true });

// Setup handlers
setupWhatsAppHandlers();
initializeTelegramBot(bot);

console.log('🤖 TUNZY Bot Started Successfully!');
console.log('📱 Telegram Bot is running...');
console.log('💬 WhatsApp Bot is ready for pairing...');

// Keep the process running
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
