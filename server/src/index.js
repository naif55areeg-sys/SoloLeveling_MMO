import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import playerRoutes from "./routes/player.js";
import adminRoutes from './routes/admin.js';
import broadcastRouter from "./routes/broadcast.js";

dotenv.config(); // يجب أن تكون في البداية

const app = express();

// إعداد CORS الشامل
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://solo-leveling-mmo.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'] // أضفنا x-admin-key
}));

app.options('*', cors());
app.use(express.json());

// ربط جميع المسارات (Routes)
app.use("/auth", authRoutes);
app.use("/api", playerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/broadcast", broadcastRouter);

// المسارات الأساسية
app.get("/", (req, res) => res.send("Solo Leveling MMO Server ✅ Running"));
app.get("/health", (req, res) => res.json({ status: "ok", time: Date.now() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على بورت ${PORT}`);
});