require("dotenv").config();

const fs = require("fs");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { startBaileys } = require("./services/baileysService");

// Routes
const chatRoutes = require("./routes/chatRoutes");
const contactRoutes = require("./routes/contactRoutes");
const ruleRoutes = require("./routes/ruleRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const allowedContactsRoutes = require("./routes/allowedContactsRoutes");
const aiRoutes = require("./routes/aiRoutes");

// ── Constants & Configuration ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const AUTH_DIR = process.env.AUTH_DIR || "./wa-auth";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── State ────────────────────────────────────────────────────────────────────
const whatsappState = {
  status: "starting",
  latestQR: null
};

// ── Process-Level Error Guards ───────────────────────────────────────────────
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

// ── Ensure Auth Directory Exists ─────────────────────────────────────────────
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ── Express & HTTP Server Setup ──────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

// Expose socket server globally for routes/services to access safely
global.io = io;

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Core API Routes
app.use("/analytics", analyticsRoutes);
app.use("/contacts", contactRoutes);
app.use("/rules", ruleRoutes);
app.use("/settings", settingsRoutes);
app.use("/allowed-contacts", allowedContactsRoutes);
app.use("/chats", chatRoutes);
app.use("/ai", aiRoutes);

// ── Real-Time Status Endpoint ────────────────────────────────────────────────
app.get("/status", (_req, res) => {
  res.json({ 
    whatsappStatus: whatsappState.status, 
    hasQR: !!whatsappState.latestQR,
    qr: whatsappState.latestQR 
  });
});

// ── Bootstrap Execution ──────────────────────────────────────────────────────
(async () => {
  try {
    // Injecting state management callbacks directly into Baileys to avoid circular dependencies
    await startBaileys({
      onStatusUpdate: (status) => { 
        whatsappState.status = status;
        io.emit("whatsapp_status", status); // Automatically broadcast state updates to frontend clients
      },
      onQRUpdate: (qr) => { 
        whatsappState.latestQR = qr; 
        io.emit("whatsapp_qr", qr); // Automatically broadcast new QR codes to frontend clients
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running smoothly on port ${PORT}`);
    });
  } catch (error) {
    console.error("Critical error during system bootstrapping:", error);
    process.exit(1);
  }
})();