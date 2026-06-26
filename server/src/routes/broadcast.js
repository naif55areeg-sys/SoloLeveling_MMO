import express from "express";
const router = express.Router();

// جلب آخر إعلان
router.get("/", (req, res) => {
    // هنا ضع منطقك، مثلاً:
    const lastBroadcast = { message: "مرحباً بكم في سيرفر Solo Leveling!", type: "info" };
    res.json(lastBroadcast);
});

export default router;