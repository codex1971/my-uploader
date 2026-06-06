const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// ১. মেইন ফোল্ডার থেকে index.html লোড করার নির্দেশ
app.use(express.static(__dirname)); 

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const userMessage = req.body.message || "কোনো ক্যাপশন নেই";
        
        if (!req.file) {
            await bot.sendMessage(process.env.CHAT_ID, `CODEXBD_SIGNAL:\n${userMessage}`);
            return res.send("মেসেজ পাঠানো হয়েছে!");
        }

        await bot.sendDocument(process.env.CHAT_ID, req.file.path, {
            caption: `CODEXBD_SIGNAL:\n${userMessage}`,
        }, {
            filename: req.file.originalname
        });

        fs.unlinkSync(req.file.path);
        res.send("ফাইল সফলভাবে পাঠানো হয়েছে!");
    } catch (error) {
        console.error(error);
        res.status(500).send("সার্ভার এরর!");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running`));
