const express = require('express');
const multer = require('multer');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// আপনার দেওয়া টোকেন ও চ্যাট আইডি
const BOT_TOKEN = '8725243106:AAFNB3TMkOk-q4KO_z7QL_tvU1FxhoF7Dbk';
const CHAT_ID = '6274855215';

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// uploads ফোল্ডার নিশ্চিত করা
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// ফাইল এবং টেক্সট হ্যান্ডেল করার রুট
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const userMessage = req.body.message || "কোনো টেক্সট নেই";
        const caption = `CODEXBD_SIGNAL:\n${userMessage}`;

        if (req.file) {
            // ফাইল থাকলে ফাইল পাঠানো
            await bot.sendDocument(CHAT_ID, req.file.path, {
                caption: caption
            }, {
                filename: req.file.originalname
            });
            // ফাইল মুছে ফেলা
            fs.unlinkSync(req.file.path);
            res.send("ফাইল এবং মেসেজ পাঠানো হয়েছে!");
        } else {
            // ফাইল না থাকলে শুধু মেসেজ পাঠানো
            await bot.sendMessage(CHAT_ID, caption);
            res.send("মেসেজ পাঠানো হয়েছে!");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("এরর হয়েছে: " + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
