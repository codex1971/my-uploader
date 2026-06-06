const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// এনভায়রনমেন্ট ভ্যারিয়েবল থেকে টোকেন ও চ্যাট আইডি ব্যবহার করা
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// মেসেজ এবং ফাইল একসাথে হ্যান্ডেল করার জন্য পোস্ট রিকোয়েস্ট
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // ফ্রন্টএন্ড থেকে আসা মেসেজ (textInput থেকে আসা ডাটা)
        // নতুন ইন্টারফেসে যেহেতু 'messageInput' আইডি ব্যবহার করা হয়েছে
        const userMessage = req.body.message || "কোনো ক্যাপশন নেই";
        
        if (!req.file) {
            // যদি শুধু মেসেজ পাঠানো হয়
            await bot.sendMessage(process.env.CHAT_ID, `CODEXBD_SIGNAL:\n${userMessage}`);
            return res.send("মেসেজ সফলভাবে পাঠানো হয়েছে!");
        }

        // ফাইল এবং মেসেজ (ক্যাপশন হিসেবে) পাঠানো
        await bot.sendDocument(process.env.CHAT_ID, req.file.path, {
            caption: `CODEXBD_SIGNAL:\n${userMessage}`,
        }, {
            filename: req.file.originalname
        });

        // ফাইলটি সার্ভারের স্টোরেজ থেকে মুছে ফেলা
        fs.unlinkSync(req.file.path);
        
        res.send("ফাইল এবং মেসেজ সফলভাবে পাঠানো হয়েছে!");
    } catch (error) {
        console.error("Error sending to Telegram:", error);
        res.status(500).send("সার্ভার এরর!");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

