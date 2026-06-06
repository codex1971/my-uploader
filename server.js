const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// এনভায়রনমেন্ট ভ্যারিয়েবল থেকে টোকেন এবং আইডি নেওয়া
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

app.use(express.static(path.join(__dirname, 'public')));

// এই সেই অ্যাপ.পোস্ট অংশটি, যা আপনি কপি করবেন:
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("কোনো ফাইল পাওয়া যায়নি।");

        // টেলিগ্রামে পাঠানোর জন্য অপশনস
        const options = {
            caption: `নতুন ফাইল এসেছে: ${req.file.originalname}`
        };

        // ফাইল পাঠানো
        await bot.sendDocument(process.env.CHAT_ID, req.file.path, {}, options);

        // পাঠানোর পর সার্ভার থেকে ফাইল মুছে ফেলা
        fs.unlinkSync(req.file.path);
        
        res.send("ফাইল সফলভাবে আপলোড হয়েছে!");
    } catch (error) {
        console.error(error);
        res.status(500).send("সার্ভার এরর!");
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("সার্ভার চলছে...");
});
