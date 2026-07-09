require("dotenv").config();

const fs      = require("fs");
const express = require("express");
const http    = require("http");
const cors    = require("cors");
const { Server } = require("socket.io");
const { startBaileys } = require("./services/baileysService");
const chatRoutes = require("./routes/chatRoutes");
const contactRoutes = require("./routes/contactRoutes");
const ruleRoutes = require("./routes/ruleRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const allowedContactsRoutes = require("./routes/allowedContactsRoutes");
const aiRoutes = require("./routes/aiRoutes");

// ── Constants ────────────────────────────────────────────────────────────────
const AUTH_DIR   = process.env.AUTH_DIR   || "./wa-auth";

// ── State (Wrapped in an object to pass by reference or export) ────────────────
const whatsappState = {
  status: "starting",
  latestQR: null
};

// ── Process-level error guards ───────────────────────────────────────────────
process.on("unhandledRejection", (err) => {
  if (err && /detached Frame/i.test(err.message || "")) {
    console.warn("IGNORED (benign detached-frame race during teardown):", err.message);
    return;
  }
  console.error("UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// ── Auth directory ───────────────────────────────────────────────────────────
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ── Express app ──────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

global.io = io;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/analytics", analyticsRoutes);
app.use("/contacts", contactRoutes);
app.use("/rules", ruleRoutes);
app.use("/settings", settingsRoutes);
app.use("/allowed-contacts", allowedContactsRoutes);
app.use("/chats", chatRoutes);
app.use("/ai", aiRoutes);

// ── Status route ──────────────────────────────────────────────────────────────
app.get("/status", (_req, res) => {
  res.json({ 
    whatsappStatus: whatsappState.status, 
    hasQR: !!whatsappState.latestQR,
    qr: whatsappState.latestQR // Useful if your frontend needs to draw the QR
  });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
(async () => {
  await startBaileys();
})();

server.listen(5000, () => {
  console.log("Server running on port 5000");
});

// ── Architecture Exports ──────────────────────────────────────────────────────
// This lets baileysService update the server state without global variable pollution
module.exports = {
  updateWhatsappStatus: (status) => { whatsappState.status = status; },
  updateLatestQR: (qr) => { whatsappState.latestQR = qr; }
};