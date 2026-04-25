const config = require('../config');
const fs = require('fs');
const path = require('path');
const { startSock } = require('../handlers/messageHandler');
const axios = require('axios');

async function initializeTelegramBot(bot) {
    
    // Check and ensure image exists
    const imagePath = path.join(__dirname, '../assets/tunzy.jpg');
    
    // Create assets directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../assets'))) {
        fs.mkdirSync(path.join(__dirname, '../assets'), { recursive: true });
    }
    
    // If image doesn't exist, download a placeholder or create notification
    if (!fs.existsSync(imagePath)) {
        console.log('⚠️ tunzy.jpg not found in assets folder. Please add the image!');
        console.log('📁 Expected location:', imagePath);
    }
    
    // Send startup image with buttons
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const username = msg.from.username || msg.from.first_name;
        
        const welcomeCaption = `🤖 *Welcome to TUNZY Bot!*\n\n` +
                              `Hi ${username}! 👋\n\n` +
                              `This bot helps you pair WhatsApp numbers for awesome features.\n\n` +
                              `📌 *Please join our channel and group first to use the bot!*\n\n` +
                              `Use /pair to start pairing your WhatsApp number.\n` +
                              `Use /menu to see WhatsApp bot commands.`;
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📢 Join Channel', url: config.TELEGRAM_CHANNEL_LINK },
                    { text: '👥 Join Group', url: config.TELEGRAM_GROUP_LINK }
                ],
                [
                    { text: '✅ I\'ve Joined', callback_data: 'check_join' }
                ],
                [
                    { text: '📋 Available Commands', callback_data: 'show_commands' }
                ]
            ]
        };
        
        // Try to send with image, fallback to text only
        if (fs.existsSync(imagePath)) {
            try {
                await bot.sendPhoto(chatId, imagePath, {
                    caption: welcomeCaption,
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
            } catch (error) {
                console.error('Error sending photo:', error);
                await bot.sendMessage(chatId, welcomeCaption, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
            }
        } else {
            await bot.sendMessage(chatId, welcomeCaption, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    });
    
    // Check if user joined channel and group
    async function checkMembership(userId) {
        try {
            const channelMember = await bot.getChatMember(config.TELEGRAM_CHANNEL, userId);
            const groupMember = await bot.getChatMember(config.TELEGRAM_GROUP, userId);
            
            const isChannelMember = ['member', 'administrator', 'creator'].includes(channelMember.status);
            const isGroupMember = ['member', 'administrator', 'creator'].includes(groupMember.status);
            
            return isChannelMember && isGroupMember;
        } catch (error) {
            console.error('Error checking membership:', error);
            return false;
        }
    }
    
    // Handle callback queries
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        
        if (query.data === 'check_join') {
            const isJoined = await checkMembership(userId);
            
            if (isJoined) {
                await bot.answerCallbackQuery(query.id, {
                    text: '✅ Great! You\'ve joined both channel and group!',
                    show_alert: true
                });
                await bot.sendMessage(chatId, '🎉 *Verification Successful!*\n\nYou can now use the bot commands:\n• /pair - Pair a WhatsApp number\n• /delpair - Delete a paired number\n• /menu - Show WhatsApp commands', {
                    parse_mode: 'Markdown'
                });
            } else {
                await bot.answerCallbackQuery(query.id, {
                    text: '❌ Please join both channel and group first!',
                    show_alert: true
                });
            }
        } else if (query.data === 'show_commands') {
            await bot.answerCallbackQuery(query.id);
            await bot.sendMessage(chatId, '*📋 Available Commands:*\n\n/pair - Pair a WhatsApp number\n/delpair - Delete paired number\n/menu - Show WhatsApp bot menu\n\nMake sure you\'ve joined our channel and group!', {
                parse_mode: 'Markdown'
            });
        }
    });
    
    // /pair command
    bot.onText(/\/pair/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        // Check membership
        const isJoined = await checkMembership(userId);
        if (!isJoined) {
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '📢 Join Channel', url: config.TELEGRAM_CHANNEL_LINK },
                        { text: '👥 Join Group', url: config.TELEGRAM_GROUP_LINK }
                    ],
                    [{ text: '✅ I\'ve Joined', callback_data: 'check_join' }]
                ]
            };
            
            // Try to send with image
            if (fs.existsSync(imagePath)) {
                try {
                    await bot.sendPhoto(chatId, imagePath, {
                        caption: '❌ *Access Denied!*\n\nYou must join both our channel and group to use this bot.',
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                } catch {
                    await bot.sendMessage(chatId, '❌ *Access Denied!*\n\nYou must join both our channel and group to use this bot.', {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                }
            } else {
                return bot.sendMessage(chatId, '❌ *Access Denied!*\n\nYou must join both our channel and group to use this bot.', {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
            }
            return;
        }
        
        // Check pair limits
        const userPairs = global.userPairCounts.get(userId.toString()) || 0;
        if (userPairs >= config.MAX_PAIRS_PER_USER) {
            return bot.sendMessage(chatId, `❌ *Limit Reached!*\n\nYou can only pair ${config.MAX_PAIRS_PER_USER} numbers. Use /delpair to remove an existing pair.`, {
                parse_mode: 'Markdown'
            });
        }
        
        if (global.totalPairs >= config.MAX_TOTAL_PAIRS) {
            return bot.sendMessage(chatId, '❌ *Server Limit Reached!*\n\nMaximum total pairs (300) has been reached. Please try again later.', {
                parse_mode: 'Markdown'
            });
        }
        
        // Start pairing process
        await bot.sendMessage(chatId, '🔄 *Starting pairing process...*\n\nPlease send your WhatsApp number with country code.\nExample: +1234567890\n\nType /cancel to abort.', {
            parse_mode: 'Markdown'
        });
        
        // Wait for number
        const numberListener = async (response) => {
            if (response.chat.id === chatId && response.from.id === userId) {
                if (response.text === '/cancel') {
                    bot.removeListener('message', numberListener);
                    return bot.sendMessage(chatId, '❌ Pairing cancelled.');
                }
                
                const phoneNumber = response.text.trim();
                if (!/^\+\d{10,15}$/.test(phoneNumber)) {
                    return bot.sendMessage(chatId, '❌ Invalid number format. Please use international format: +1234567890');
                }
                
                bot.removeListener('message', numberListener);
                
                try {
                    const sessionId = `${userId}_${Date.now()}`;
                    const sock = await startSock(phoneNumber, sessionId);
                    
                    if (sock) {
                        global.pairedUsers.set(sessionId, {
                            userId: userId,
                            phoneNumber: phoneNumber,
                            sock: sock,
                            pairedAt: new Date()
                        });
                        
                        global.totalPairs++;
                        global.userPairCounts.set(userId.toString(), (global.userPairCounts.get(userId.toString()) || 0) + 1);
                        global.saveData();
                        
                        const successMessage = `✅ *WhatsApp Connected Successfully!*\n\n` +
                                             `📱 Number: ${phoneNumber}\n` +
                                             `📊 Total Pairs: ${global.totalPairs}/${config.MAX_TOTAL_PAIRS}\n` +
                                             `📊 Your Pairs: ${global.userPairCounts.get(userId.toString())}/${config.MAX_PAIRS_PER_USER}\n\n` +
                                             `💡 Use *.menu* in WhatsApp to see available commands.`;
                        
                        if (fs.existsSync(imagePath)) {
                            try {
                                await bot.sendPhoto(chatId, imagePath, {
                                    caption: successMessage,
                                    parse_mode: 'Markdown'
                                });
                            } catch {
                                await bot.sendMessage(chatId, successMessage, {
                                    parse_mode: 'Markdown'
                                });
                            }
                        } else {
                            await bot.sendMessage(chatId, successMessage, {
                                parse_mode: 'Markdown'
                            });
                        }
                    } else {
                        await bot.sendMessage(chatId, '❌ Failed to connect WhatsApp. Please try again.');
                    }
                } catch (error) {
                    console.error('Pairing error:', error);
                    await bot.sendMessage(chatId, '❌ Error during pairing. Please try again later.');
                }
            }
        };
        
        bot.on('message', numberListener);
        
        setTimeout(() => {
            bot.removeListener('message', numberListener);
            bot.sendMessage(chatId, '⏰ Pairing session expired. Use /pair to try again.');
        }, 300000);
    });
    
    // /delpair command
    bot.onText(/\/delpair/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        const userPairs = Array.from(global.pairedUsers.entries())
            .filter(([_, data]) => data.userId === userId);
        
        if (userPairs.length === 0) {
            return bot.sendMessage(chatId, '❌ You have no active pairs to delete.');
        }
        
        const pairList = userPairs.map(([id, data], index) => 
            `${index + 1}. 📱 ${data.phoneNumber} (Paired: ${data.pairedAt.toLocaleString()})`
        ).join('\n');
        
        await bot.sendMessage(chatId, `*Your Active Pairs:*\n\n${pairList}\n\nReply with the number to delete (e.g., 1) or /cancel to abort.`, {
            parse_mode: 'Markdown'
        });
        
        const deleteListener = async (response) => {
            if (response.chat.id === chatId && response.from.id === userId) {
                if (response.text === '/cancel') {
                    bot.removeListener('message', deleteListener);
                    return bot.sendMessage(chatId, '❌ Deletion cancelled.');
                }
                
                const index = parseInt(response.text) - 1;
                if (isNaN(index) || index < 0 || index >= userPairs.length) {
                    return bot.sendMessage(chatId, '❌ Invalid selection. Please reply with a valid number.');
                }
                
                bot.removeListener('message', deleteListener);
                
                const [sessionId, pairData] = userPairs[index];
                
                try {
                    await pairData.sock.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                }
                
                global.pairedUsers.delete(sessionId);
                global.totalPairs--;
                global.userPairCounts.set(userId.toString(), (global.userPairCounts.get(userId.toString()) || 1) - 1);
                global.saveData();
                
                await bot.sendMessage(chatId, `✅ *Pair Deleted Successfully!*\n\n📱 Number: ${pairData.phoneNumber}\n📊 Remaining Pairs: ${global.userPairCounts.get(userId.toString())}/${config.MAX_PAIRS_PER_USER}`, {
                    parse_mode: 'Markdown'
                });
            }
        };
        
        bot.on('message', deleteListener);
        
        setTimeout(() => {
            bot.removeListener('message', deleteListener);
        }, 300000);
    });
    
    // /menu command
    bot.onText(/\/menu/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        const isJoined = await checkMembership(userId);
        if (!isJoined) {
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '📢 Join Channel', url: config.TELEGRAM_CHANNEL_LINK },
                        { text: '👥 Join Group', url: config.TELEGRAM_GROUP_LINK }
                    ]
                ]
            };
            return bot.sendMessage(chatId, '❌ Please join our channel and group first!', {
                reply_markup: keyboard
            });
        }
        
        const menuText = `*🤖 TUNZY WhatsApp Menu*\n\n` +
                        `\`\`\`\n/Menu\n\`\`\`\n` +
                        `💀 \`T iOS\` - Ping Command\n` +
                        `💀 \`T DROID\` - Bot Statistics\n` +
                        `💀 \`T BLANK\` - Bot Uptime\n` +
                        `💀 \`T FREEZE\` - Tag All Members\n` +
                        `💀 \`T INVIS\` - Hidden Tag\n\n` +
                        `📱 *Powered by TUNZY*`;
        
        // Send menu with image
        if (fs.existsSync(imagePath)) {
            try {
                await bot.sendPhoto(chatId, imagePath, {
                    caption: menuText,
                    parse_mode: 'Markdown'
                });
            } catch (error) {
                console.error('Error sending menu image:', error);
                await bot.sendMessage(chatId, menuText, {
                    parse_mode: 'Markdown'
                });
            }
        } else {
            await bot.sendMessage(chatId, menuText, {
                parse_mode: 'Markdown'
            });
        }
    });
}

module.exports = { initializeTelegramBot };
