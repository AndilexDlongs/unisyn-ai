import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTransaction, handleWebhook } from './backend/paddle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 8787;

// --- Serve static frontend files ---
app.use(express.static(path.join(__dirname, 'src', 'frontend', 'views')));
app.use('/js', express.static(path.join(__dirname, 'src', 'frontend', 'js')));
app.use(
  '/assets',
  express.static(path.join(__dirname, 'src', 'frontend', 'assets'))
);

// --- Frontend page routes ---
app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'src', 'frontend', 'views', 'landing.html')
  );
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'frontend', 'views', 'chat.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'src', 'frontend', 'views', 'pricing.html')
  );
});

// ✅ NEW: Checkout page (for Paddle overlay)
app.get('/checkout', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'src', 'frontend', 'views', 'checkout.html')
  );
});

// --- Paddle endpoints ---
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { priceId, userId, email } = req.body;
    const url = await createTransaction(priceId, userId, email);
    res.json({ url });
  } catch (err) {
    console.error('❌ Error creating checkout:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Paddle webhook (for payment success events)
app.post('/api/webhook', handleWebhook);

// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
  console.log(`🌐 Landing Page → http://localhost:${PORT}/`);
  console.log(`💬 Chat Page → http://localhost:${PORT}/chat`);
  console.log(`💵 Pricing Page → http://localhost:${PORT}/pricing`);
  console.log(`🧾 Checkout Page → http://localhost:${PORT}/checkout`);
});
