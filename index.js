// index.js — serves frontend only (no AI or API logic)

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Proxy route for backend AI chat
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

const PORT = process.env.PORT || 8787;
app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
  console.log(`🌐 Landing Page → http://localhost:${PORT}/`);
  console.log(`💬 Chat Page → http://localhost:${PORT}/chat`);
});
