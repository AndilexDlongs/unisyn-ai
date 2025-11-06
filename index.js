// index.js — serves frontend only (no AI or API logic)

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "src/frontend")));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src/frontend/views", "chat.html"));
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, (err) => {
  if (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});

