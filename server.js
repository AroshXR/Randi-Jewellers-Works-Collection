const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Admin password (read from environment variables in production, fallback for development)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Proskit123@##";

// Ensure directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'public', 'img', 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'gallery.json');
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ images: [] }, null, 2));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'portfolio_super_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Secure cookies require HTTPS in production
        sameSite: 'lax'
    }
}));

// Serve admin.html with no-cache headers to prevent browser caching of the admin page
app.get('/admin.html', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// API Routes

// Cache-control middleware to prevent caching of API requests (specifically session check)
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// 1. Get all images
app.get('/api/images', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    res.json(data.images);
});

// 2. Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// 3. Check Session
app.get('/api/session', (req, res) => {
    res.json({ loggedIn: !!req.session.isAdmin });
});

// 4. Upload Image (Protected)
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { category, title, description, isFeatured } = req.body;
    const imageUrl = `/img/uploads/${req.file.filename}`;

    const newImage = {
        id: Date.now().toString(),
        url: imageUrl,
        category: category || 'gold', // gold, silver, large
        title: title || '',
        description: description || '',
        isFeatured: isFeatured === 'true',
        createdAt: new Date().toISOString()
    };

    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    data.images.push(newImage);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true, image: newImage });
});

// 5. Delete Image (Protected)
app.post('/api/delete', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Missing image ID' });
    }

    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    const index = data.images.findIndex(img => img.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const image = data.images[index];
    
    // Delete physical file from uploads folder if applicable
    if (image.url.startsWith('/img/uploads/')) {
        const filePath = path.join(__dirname, 'public', image.url);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error("Failed to delete physical file:", err);
            }
        }
    }

    // Remove from array
    data.images.splice(index, 1);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });
});

// 6. Logout (Invalidate Session via POST)
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear express-session cookie
        res.json({ success: true });
    });
});

// 7. GET Logout redirect (Robust logout for Back to Site link)
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout error:", err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
