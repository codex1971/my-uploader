const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

const app = express();
// ফাইল আপলোডের জন্য স্টোরেজ সেটআপ
const upload = multer({ dest: 'uploads/' });

// আপনার টেলিগ্রাম বট টোকেন
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("কোনো ফাইল পাওয়া যায়নি।");

        // টেলিগ্রামে পাঠানোর জন্য অপশনস (যা ফাইলের নাম ও ফরম্যাট ঠিক রাখবে)
        const options = {
            caption: `নতুন ফাইল এসেছে: ${req.file.originalname}`
        };

     // আপনার server.js ফাইলের এই অংশটি পরিবর্তন করুন:
await bot.sendDocument(process.env.CHAT_ID, req.file.path, {
    // এখানে caption এর বদলে সরাসরি filename ব্যবহার করতে হবে
}, {
    filename: req.file.originalname // এটিই ফাইলের আসল নাম ও ফরম্যাট ঠিক রাখবে
});

