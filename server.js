const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// এনভায়রনমেন্ট ভ্যারিয়েবল থেকে টোকেন এবং আইডি নেওয়া
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// পাবলিক ফোল্ডার সেটআপ
app.use(express.static(path.join(__dirname, 'public')));

// রুট ইউআরএল-এ index.html পাঠানো
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ফাইল আপলোড হ্যান্ডেল করা
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("ফাইল পাওয়া যায়নি");

        // টেলিগ্রামে ফাইল পাঠানো
        await bot.sendDocument(process.env.CHAT_ID, req.file.path);

        // পাঠানোর পর সার্ভারের স্টোরেজ থেকে ফাইল মুছে ফেলা
        fs.unlinkSync(req.file.path);
        
        res.send("ফাইল সফলভাবে আপলোড হয়েছে!");
    } catch (error) {
        console.error(error);
        res.status(500).send("সার্ভারে সমস্যা হয়েছে");
    }
});

// রেন্ডারের পোর্টে সার্ভার চালু করা
app.listen(process.env.PORT || 3000, () => {
    console.log("সার্ভার চলছে পোর্ট ৩০০০ এ...");
});

