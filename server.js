require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/auth'));

app.use('/', require('./routes/dashboard'));

app.use('/api/internships', require('./routes/internships'));

app.use('/api/applications', require('./routes/applications'));

app.use('/api/student', require('./routes/student'));

app.use('/api/settings', require('./routes/settings'));

app.use('/api/analytics', require('./routes/analytics'));

app.use('/api/blogs', require('./routes/blogRoutes'));

app.use('/api/news', require('./routes/newsRoutes'));

app.get('/blogs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'blogs.html')));
app.get('/news',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'news.html')));

app.get('/', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/dashboard');
        } catch {
            return res.redirect('/login');
        }
    }
    res.redirect('/login');
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});


app.use((req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.status(404).json({ error: 'Route not found' });
        } catch {
            return res.redirect('/login');
        }
    }
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

