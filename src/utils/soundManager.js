// ─── SOUND MANAGER ──────────────────────────────────────────────────────────
// نظام مركزي لإدارة وتشغيل المؤثرات الصوتية الحقيقية (mp3/wav) في كل اللعبة.
//
// المزايا:
// • Preload: كل الأصوات تتحمّل مرة واحدة عند بداية اللعبة (preload()) — صفر تأخير عند التشغيل.
// • Audio Pool: كل صوت عنده عدة نسخ (Audio elements) تدور بالتناوب، فلو ضربت بسرعة
//   (هجوم + كريت + صراخ بوس بنفس اللحظة) كل صوت يشتغل بشكل منفصل وكامل بدون
//   ما يقطع نفسه أو يقطع غيره.
// • Volume مستقل لكل صوت + Volume عام (master) يتحكم بالكل دفعة واحدة.
// • سهل تضيف عليه صوت جديد: سطر واحد بـ SOUND_LIBRARY أو نادي register() بأي وقت.
//
// 📁 ضع ملفات الصوت هنا: public/assets/sounds/<file>.mp3
// ─────────────────────────────────────────────────────────────────────────────

const BASE_PATH = "/assets/sounds/";
const POOL_SIZE = 4; // عدد النسخ المتوازية لكل صوت — يكفي لأسرع تتابع ضربات بالقتال

// 📋 سجل كل المؤثرات الصوتية — المكان الوحيد اللي تحتاجه لإضافة صوت جديد بسهولة
const SOUND_LIBRARY = {
  sword: { file: "https://res.cloudinary.com/dmzg48rcc/video/upload/v1782567609/copy_B863B1EE-953B-4EBA-92CA-94D5907A0D11_hpd5pt.mp3", volume: 0.60 },
  hit: { file: "https://res.cloudinary.com/dmzg48rcc/video/upload/v1782570338/829361__hotpin7__magic-sword-whoosh_ohtim7.wav", volume: 0.55 },
  bossRoar: { file: "https://res.cloudinary.com/dmzg48rcc/video/upload/v1782571987/753852__evanboyerman__monster-growl-3_uc9iil.wav", volume: 0.70 },
  crit: { file: "https://res.cloudinary.com/dmzg48rcc/video/upload/v1782567609/copy_B863B1EE-953B-4EBA-92CA-94D5907A0D11_hpd5pt.mp3", volume: 0.65 },
  skill: { file: "", volume: 0.60 },
  heal: { file: "", volume: 0.50 },
  dodge: { file: "https://res.cloudinary.com/dmzg48rcc/video/upload/v1782574250/copy_D4460985-84C2-488F-BB10-050BDDDECC71_vcxgmc.mov", volume: 0.45 },
  victory: { file: "https://res.cloudinary.com/dmzg48rcc/video/upload/v1782575504/1782575595250998_pewgyy.mov", volume: 0.55 },
  defeat: { file: "https://res.cloudinary.com/dmzg48rcc/video/upload/v1782573946/DLVideo_7_fn3iml.mov", volume: 0.55 },
};

class SoundManagerClass {
  constructor() {
    this.pools = {};       // name -> [HTMLAudioElement, ...]
    this.cursors = {};     // name -> index الحالي بالـ pool (للتدوير)
    this.muted = false;
    this.masterVolume = 1;
    this.ready = false;
  }

  // 🔄 يحمّل كل أصوات SOUND_LIBRARY مسبقاً. نادها مرة واحدة عند بداية اللعبة
  // (مثلاً بأول useEffect بصفحة البوابات) — الاستدعاءات اللاحقة تتجاهل تلقائيًا.
  preload() {
    if (this.ready) return;
    Object.entries(SOUND_LIBRARY).forEach(([name, cfg]) => this._buildPool(name, cfg.file, cfg.volume));
    this.ready = true;
  }

  // ➕ تسجيل/تحميل صوت جديد بأي وقت (مثلاً مؤثر جديد تضيفه بعدين بدون ما تلمس preload)
  register(name, file, volume = 0.6) {
    if (this.pools[name]) return; // مسجل أصلاً
    SOUND_LIBRARY[name] = { file, volume };
    this._buildPool(name, file, volume);
  }

  _buildPool(name, file, volume) {
    // لو الملف رابط كامل (http/https) نستخدمه كما هو، وإلا نعتبره اسم ملف محلي بمجلد public
    const url = /^https?:\/\//i.test(file) ? file : BASE_PATH + file;
    this.pools[name] = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.crossOrigin = "anonymous"; // عشان الروابط من دومين خارجي (Cloudinary) ما تتعطل
      audio.volume = volume * this.masterVolume;
      try { audio.load(); } catch { /* بعض المتصفحات تمنع التحميل قبل أي تفاعل — تجاهل بصمت */ }
      return audio;
    });
    this.cursors[name] = 0;
  }

  // 🔊 تشغيل صوت — يدور على نسخ الـ Pool عشان يدعم التشغيل المتزامن لنفس الصوت
  // بدون تقطيع الصوت السابق (مهم وقت الضرب السريع/المتتالي).
  play(name, { volume, rate = 1 } = {}) {
    if (this.muted) return;
    let pool = this.pools[name];
    // لو ما تحمّل مسبقاً لأي سبب (مثلاً preload لم يُستدعَ)، نبنيه على الفور
    if (!pool) {
      const cfg = SOUND_LIBRARY[name];
      if (!cfg) { console.warn(`[SoundManager] صوت غير معروف: "${name}"`); return; }
      this._buildPool(name, cfg.file, cfg.volume);
      pool = this.pools[name];
    }

    const idx = this.cursors[name];
    const audio = pool[idx];
    this.cursors[name] = (idx + 1) % pool.length;

    try {
      audio.currentTime = 0;
      audio.playbackRate = rate;
      audio.volume = (volume !== undefined ? volume : (SOUND_LIBRARY[name]?.volume ?? 0.6)) * this.masterVolume;
      const p = audio.play();
      if (p && p.catch) p.catch(() => { /* المتصفح منع autoplay قبل أول تفاعل — تجاهل بصمت */ });
    } catch { /* تجاهل بصمت */ }
  }

  // 🔈 تغيير حجم صوت معيّن بشكل مستقل (يطبّق على كل نسخه بالـ Pool)
  setVolume(name, volume) {
    if (SOUND_LIBRARY[name]) SOUND_LIBRARY[name].volume = volume;
    (this.pools[name] || []).forEach((a) => { a.volume = volume * this.masterVolume; });
  }

  // 🔈 الفولوم العام لكل الأصوات دفعة واحدة (مفيد لزر صوت رئيسي بإعدادات اللعبة)
  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    Object.entries(this.pools).forEach(([name, pool]) => {
      const base = SOUND_LIBRARY[name]?.volume ?? 0.6;
      pool.forEach((a) => { a.volume = base * this.masterVolume; });
    });
  }

  setMuted(m) { this.muted = m; }
  isMuted() { return this.muted; }
}

// نسخة واحدة مشتركة بكل اللعبة (singleton) — لا تستخدم `new Audio()` متفرقة بكل دالة
export const SoundManager = new SoundManagerClass();
