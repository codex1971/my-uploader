const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ আপনার টেলিগ্রাম তথ্য ============
const TELEGRAM_BOT_TOKEN = '8725243106:AAFNB3TMkOk-q4KO_z7QL_tvU1FxhoF7Dbk';
const TELEGRAM_CHAT_ID = '6274855215';

console.log('🤖 Telegram Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 20) + '...');
console.log('💬 Telegram Chat ID:', TELEGRAM_CHAT_ID);

// টেলিগ্রামে মেসেজ পাঠানোর ফাংশন
async function sendToTelegram(message, fileBuffer = null, filename = null, mimeType = null) {
    try {
        if (fileBuffer && filename) {
            // ফাইল সহ পাঠানো
            const formData = new FormData();
            formData.append('chat_id', TELEGRAM_CHAT_ID);
            formData.append('caption', message);
            formData.append('document', fileBuffer, {
                filename: filename,
                contentType: mimeType || 'application/octet-stream'
            });

            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders()
            });
            
            const result = await response.json();
            if (!result.ok) {
                console.error('Telegram API Error:', result);
                throw new Error(result.description || 'Failed to send file to Telegram');
            }
            console.log('✅ File sent to Telegram:', filename);
            return result;
        } else {
            // শুধু মেসেজ পাঠানো
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            
            const result = await response.json();
            if (!result.ok) {
                console.error('Telegram API Error:', result);
                throw new Error(result.description || 'Failed to send message to Telegram');
            }
            console.log('✅ Message sent to Telegram');
            return result;
        }
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        throw error;
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// আপলোড ফোল্ডার
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer কনফিগারেশন
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

// ট্রান্সমিশন হিস্টোরি
let transmissions = [];

// ============ API রাউট ============

// হেলথ চেক
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        telegram: true,
        timestamp: new Date().toISOString()
    });
});

// সব ট্রান্সমিশন দেখা
app.get('/api/transmissions', (req, res) => {
    res.json(transmissions);
});

// মেসেজ ও ফাইল সেন্ড করার মেইন এন্ডপয়েন্ট
app.post('/api/send', upload.single('file'), async (req, res) => {
    try {
        const { message } = req.body;
        const file = req.file;
        
        let telegramMessage = '';
        let fileBuffer = null;
        let filename = null;
        let mimeType = null;
        
        const timestamp = new Date();
        const timestampStr = timestamp.toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });
        
        telegramMessage += `🔷 <b>CODEXBD TRANSMISSION</b> 🔷\n`;
        telegramMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
        telegramMessage += `📡 <b>Status:</b> Received\n`;
        telegramMessage += `⏰ <b>Time:</b> ${timestampStr}\n`;
        telegramMessage += `🆔 <b>ID:</b> <code>${Date.now()}</code>\n`;
        telegramMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
        
        const transmission = {
            id: Date.now(),
            timestamp: timestamp.toISOString(),
            message: message || '',
            file: file ? {
                originalName: file.originalname,
                size: file.size,
                mimeType: file.mimetype
            } : null
        };
        
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('File size exceeds Telegram limit (50MB)');
            }
            
            let messageText = message ? message : '📎 File attachment';
            
            telegramMessage += `\n📎 <b>ATTACHMENT:</b>\n`;
            telegramMessage += `├ <b>Name:</b> ${escapeTelegram(file.originalname)}\n`;
            telegramMessage += `├ <b>Size:</b> ${(file.size / 1024).toFixed(2)} KB\n`;
            telegramMessage += `└ <b>Type:</b> ${file.mimetype || 'Unknown'}\n`;
            
            if (message) {
                telegramMessage += `\n💬 <b>MESSAGE:</b>\n`;
                telegramMessage += `<code>${escapeTelegram(message)}</code>\n`;
            }
            
            fileBuffer = file.buffer;
            filename = file.originalname;
            mimeType = file.mimetype;
            
            await sendToTelegram(telegramMessage, fileBuffer, filename, mimeType);
        } else {
            telegramMessage += `\n💬 <b>MESSAGE:</b>\n`;
            telegramMessage += `<code>${escapeTelegram(message)}</code>\n`;
            await sendToTelegram(telegramMessage);
        }
        
        transmissions.unshift(transmission);
        if (transmissions.length > 100) {
            transmissions = transmissions.slice(0, 100);
        }
        
        res.json({ 
            success: true, 
            transmission: transmission,
            message: 'Transmission sent to Telegram successfully'
        });
        
    } catch (error) {
        console.error('Error in /api/send:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to send transmission'
        });
    }
});

// টেস্ট এন্ডপয়েন্ট
app.get('/api/test-telegram', async (req, res) => {
    try {
        const testMessage = `🔷 <b>TEST TRANSMISSION</b> 🔷\n━━━━━━━━━━━━━━━━\n✅ Bot is working properly!\n⏰ Time: ${new Date().toLocaleString('bn-BD')}`;
        await sendToTelegram(testMessage);
        res.json({ success: true, message: 'Test message sent to Telegram' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// মূল পেজ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// হেল্পার ফাংশন
function escapeTelegram(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// সার্ভার স্টার্ট
app.listen(PORT, () => {
    console.log(`\n🚀 CODEXBD Server running on http://localhost:${PORT}`);
    console.log(`🤖 Telegram Bot: Active`);
    console.log(`💬 Chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log(`📁 Upload directory: ${path.resolve(uploadDir)}\n`);
});
