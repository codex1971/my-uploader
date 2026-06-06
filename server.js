const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// এনভায়রনমেন্ট ভ্যারিয়েবল চেক করা (এরর এড়ানোর জন্য)
if (!process.env.BOT_TOKEN || !process.env.CHAT_ID) {
    console.error("Error: BOT_TOKEN or CHAT_ID is missing!");
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// সার্ভার স্টার্ট হওয়ার সময় uploads ফোল্ডার আছে কি না নিশ্চিত করা
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(express.static(__dirname));

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const userMessage = req.body.message || "কোনো ক্যাপশন নেই";
        
        if (!req.file) {
            await bot.sendMessage(process.env.CHAT_ID, `CODEXBD_SIGNAL:\n${userMessage}`);
            return res.send("মেসেজ সফলভাবে পাঠানো হয়েছে!");
        }

        // ফাইল পাঠানো
        await bot.sendDocument(process.env.CHAT_ID, req.file.path, {
            caption: `CODEXBD_SIGNAL:\n${userMessage}`,
        }, {
            filename: req.file.originalname
        });

        // ফাইল পাঠানোর পর মুছে ফেলা
        fs.unlinkSync(req.file.path);
        
        res.send("ফাইল এবং মেসেজ সফলভাবে পাঠানো হয়েছে!");
    } catch (error) {
        console.error("Error sending to Telegram:", error);
        res.status(500).send("সার্ভার এরর: " + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
