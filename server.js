const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// নিশ্চিত করুন যে আপলোড ফোল্ডারটি বিদ্যমান
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Store messages in memory (in production, use a database)
let transmissions = [];

// API Routes

// Get all transmissions
app.get('/api/transmissions', (req, res) => {
    res.json(transmissions);
});

// Send message with optional file
app.post('/api/send', upload.single('file'), (req, res) => {
    try {
        const { message } = req.body;
        const file = req.file;
        
        const transmission = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            message: message || '',
            file: file ? {
                originalName: file.originalname,
                filename: file.filename,
                size: file.size,
                mimeType: file.mimetype,
                path: file.path
            } : null
        };
        
        transmissions.unshift(transmission); // নতুনটি শুরুতে যোগ করুন
        
        // Keep only last 100 transmissions
        if (transmissions.length > 100) {
            transmissions = transmissions.slice(0, 100);
        }
        
        res.json({ 
            success: true, 
            transmission: transmission,
            message: 'Transmission sent successfully'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send transmission' 
        });
    }
});

// Download a file
app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Get single transmission by ID
app.get('/api/transmission/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const transmission = transmissions.find(t => t.id === id);
    
    if (transmission) {
        res.json(transmission);
    } else {
        res.status(404).json({ error: 'Transmission not found' });
    }
});

// Delete a transmission (optional)
app.delete('/api/transmission/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = transmissions.findIndex(t => t.id === id);
    
    if (index !== -1) {
        const deleted = transmissions.splice(index, 1)[0];
        
        // Delete associated file if exists
        if (deleted.file && deleted.file.filename) {
            const filepath = path.join(uploadDir, deleted.file.filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }
        
        res.json({ success: true, message: 'Transmission deleted' });
    } else {
        res.status(404).json({ error: 'Transmission not found' });
    }
});

// Clear all transmissions (admin only - you can add auth later)
app.delete('/api/clear-all', (req, res) => {
    // Delete all files
    transmissions.forEach(t => {
        if (t.file && t.file.filename) {
            const filepath = path.join(uploadDir, t.file.filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }
    });
    
    transmissions = [];
    res.json({ success: true, message: 'All transmissions cleared' });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CODEXBD Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${path.resolve(uploadDir)}`);
});
