const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

const app = express();
// ফাইলগুলো সাময়িকভাবে 'uploads' ফোল্ডারে জমা হবে
const upload = multer({ dest: 'uploads/' });

// আপনার টেলিগ্রাম বট টোকেন (রেন্ডারের এনভায়রনমেন্ট ভ্যারিয়েবল থেকে আসবে)
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// পাবলিক ফোল্ডার সার্ভ করা
app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("কোনো ফাইল পাওয়া যায়নি।");

        // টেলিগ্রামে ফাইল পাঠানোর অপশনস
        // filename প্রপার্টিটি ফাইলের আসল ফরম্যাট বজায় রাখে
        const options = {
            caption: `নতুন ফাইল এসেছে: ${req.file.originalname}`,
            filename: req.file.originalname
        };

        // ফাইলটি টেলিগ্রামে পাঠানো
        await bot.sendDocument(process.env.CHAT_ID, req.file.path, {}, options);

        // পাঠানোর পর সার্ভারের স্টোরেজ থেকে ফাইলটি মুছে ফেলা
        fs.unlinkSync(req.file.path);
        
        res.send("ফাইল সফলভাবে আপলোড হয়েছে!");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`সার্ভার পোর্ট ${PORT}-এ চলছে...`);
});
