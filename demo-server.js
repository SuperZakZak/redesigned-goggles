const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Mock API endpoints for demo
app.post('/api/v1/customers', (req, res) => {
  console.log('Creating customer:', req.body);
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        id: 'demo-' + Date.now(),
        name: req.body.name,
        phone: req.body.phone,
        createdAt: new Date().toISOString(),
      }
    });
  }, 1000);
});

app.post('/api/v1/apple-wallet/passes', (req, res) => {
  console.log('Generating Apple Wallet pass for:', req.body.customerId);
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        id: 'pass-' + Date.now(),
        customerId: req.body.customerId,
        downloadUrl: '/demo/loyalty-card.pkpass',
      }
    });
  }, 1500);
});

app.get('/api/v1/google-wallet/passes/:customerId/link', (req, res) => {
  console.log('Generating Google Wallet link for:', req.params.customerId);
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        link: `https://pay.google.com/gp/v/save/demo-${req.params.customerId}`,
      }
    });
  }, 1200);
});

app.get('/api/v1/wallet/qr/:customerId', (req, res) => {
  console.log('Generating QR code for:', req.params.customerId);
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }
    });
  }, 800);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Loy Demo Server'
  });
});

// React Router fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🟢 Loy Demo Server running on http://localhost:${PORT}`);
  console.log(`📱 React App: http://localhost:${PORT}`);
  console.log(`🔧 API Health: http://localhost:${PORT}/health`);
});
