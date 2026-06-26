import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import playerRoutes from "./routes/player.js";
import adminRoutes from './routes/admin.js'; // أضف هذا السطر
dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://solo-leveling-mmo.vercel.app',
    // أي رابط Vercel preview ثاني
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // preflight
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api", playerRoutes);

app.get("/", (req, res) => res.send("Solo Leveling MMO Server ✅ Running"));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", time: Date.now() }));
app.use('/api/admin', adminRoutes); // أضف هذا السطر ليعمل راوت الأدمن
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
  console.log(`📡 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
});
