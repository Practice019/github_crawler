const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const apiRoutes = require('./src/routes/api');
const scheduler = require('./src/services/scheduler');

// 手动加载 .env 文件
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  console.log('✅ Loaded .env file');
  console.log(`📊 GitHub Token: ${process.env.GITHUB_TOKEN ? 'Configured (5000 req/hour)' : 'Not configured (60 req/hour)'}`);
} else {
  console.log('⚠️  No .env file found. Using default settings (60 req/hour)');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test route works' });
});

app.use('/api', apiRoutes);

// Fallback route for SPA - handle all other routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  scheduler.start();
});

module.exports = app;
