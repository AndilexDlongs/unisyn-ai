// index.js — serves frontend + Paddle webhook + DynamoDB integration

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config'; // 🔽 Added
import { createDbAdapter, createPaddleRouter } from './server/paddle.js'; // 🔽 Added

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'src/frontend')));

// ✅ Serve the landing page at root "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/frontend/views', 'landing.html'));
});

// ✅ Serve the chat page at "/chat"
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/frontend/views', 'chat.html'));
});

// ✅ Serve the pricing page at "/pricing"  🔽 Added
app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/frontend/views', 'pricing.html'));
});

// Proxy route for backend AI chat (kept exactly as-is)
app.post('/api/chat', async (req, res) => {
  try {
    const llmApiUrl =
      process.env.LLM_API_BASE_URL || 'http://localhost:8000/api';
    const response = await fetch(`${llmApiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔽 Added — Paddle Webhook + DynamoDB Integration
import { fileURLToPath as furl } from 'node:url'; // redundant safeguard
import expressRaw from 'express'; // for clarity only
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const {
  PORT = 8787,
  AWS_REGION = 'us-east-1',
  DYNAMO_TABLE_NAME = 'UnisynUsers',
  PADDLE_WEBHOOK_SECRET,
} = process.env;

// Create DynamoDB Adapter
const dbAdapter = createDbAdapter({
  tableName: DYNAMO_TABLE_NAME,
  region: AWS_REGION,
});

// Create Paddle Webhook Handler
const paddleHandler = createPaddleRouter({
  dbAdapter,
  webhookSecret: PADDLE_WEBHOOK_SECRET,
});

// Must use raw body for HMAC verification
app.post('/webhooks/paddle', express.raw({ type: '*/*' }), paddleHandler);

// Health route for testing
app.get('/health', (_, res) => res.json({ ok: true }));

// 🔼 End Paddle Section

const PORT_FINAL = PORT || 8787;
app.listen(PORT_FINAL, (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
  console.log(`✅ Frontend running at http://localhost:${PORT_FINAL}`);
  console.log(`🌐 Landing Page → http://localhost:${PORT_FINAL}/`);
  console.log(`💬 Chat Page → http://localhost:${PORT_FINAL}/chat`);
  console.log(`💳 Pricing Page → http://localhost:${PORT_FINAL}/pricing`);
  console.log(
    `📦 Webhook Endpoint → http://localhost:${PORT_FINAL}/webhooks/paddle`
  );
});
