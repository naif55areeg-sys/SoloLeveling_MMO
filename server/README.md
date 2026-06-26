# Solo Leveling MMO — Server

## خطوات التشغيل الكاملة

### 1. إنشاء تطبيق Discord
- افتح: https://discord.com/developers/applications
- اضغط "New Application" → أعطه اسم
- من القائمة الجانبية: **OAuth2**
- انسخ **Client ID** و **Client Secret**
- في "Redirects" أضف: `http://localhost:3001/auth/discord/callback`
- احفظ

### 2. إعداد ملف .env
```
cd server
cp .env.example .env
```
ثم افتح `.env` وضع القيم:
```
PORT=3001
DISCORD_CLIENT_ID=رقمك_هنا
DISCORD_CLIENT_SECRET=السر_هنا
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
JWT_SECRET=اي_نص_عشوائي_طويل_مثل_هذا_abc123xyz
```

### 3. تثبيت المكتبات وتشغيل السيرفر
```bash
cd server
npm install
npm run dev
```
السيرفر يعمل على: http://localhost:3001

### 4. تشغيل الواجهة (في تيرمنال ثانٍ)
```bash
cd ..   (رجع للمجلد الرئيسي)
npm install
npm run dev
```
الواجهة تعمل على: http://localhost:5173

---

## الـ APIs الجديدة

| الـ Endpoint | الطريقة | الوصف |
|---|---|---|
| `/api/leaderboard` | GET | أفضل 50 لاعب حسب القوة |
| `/api/sync` | POST | مزامنة تقدم اللاعب (يحتاج توكن) |
| `/api/me` | GET | بيانات اللاعب الحالي |
| `/api/boss` | GET | بيانات البوس النشط + ترتيب الضرر |
| `/api/boss/attack` | POST | هجوم على البوس |
| `/api/boss/spawn` | POST | إنشاء بوس جديد |
| `/api/pvp/challenge` | POST | تحدي لاعب آخر |
| `/api/pvp/history` | GET | سجل المباريات |

## ما تم إضافته في هذا الإصدار (V2 MMO)

✅ **Discord OAuth2** — تسجيل دخول حقيقي، avatar + username  
✅ **Leaderboard عالمي** — يتحدث كل 30 ثانية  
✅ **PvP Arena** — تحدي أي لاعب في الليدربورد  
✅ **World Boss** — بوس مشترك يهاجمه الجميع + ترتيب الضرر  
✅ **Season Points** — الفائز في PvP يكسب نقاط موسم  
✅ **مزامنة تلقائية** — عند كل level up ترسل بياناتك للسيرفر  
✅ **قاعدة بيانات محسّنة** — async/await صحيح، جداول boss + pvp
