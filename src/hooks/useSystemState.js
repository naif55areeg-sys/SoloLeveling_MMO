import { useState, useEffect, useRef, useCallback } from "react";
import { defaultState, applyResets, maxStaminaForLevel } from "../constants/gameLogic";

const STORAGE_KEY = "sl-system-state-v1";

// ⚙️ إعدادات شحن الستامينا المحدثة:
const STAMINA_REGEN_INTERVAL = 5 * 60 * 1000; // 5 دقائق
const STAMINA_REGEN_AMOUNT = 15;              // 15 نقطة في كل جولة
// تم حذف MAX_STAMINA الثابت — الآن يتحدد ديناميكياً من اللفل عبر maxStaminaForLevel()

export function useSystemState() {
  const [state, setState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  // دالة حساب الشحن التلقائي
  const regenStaminaIfNeeded = useCallback((currentState) => {
    const maxStamina = maxStaminaForLevel(currentState.level || 1);
    if (!currentState || currentState.stamina >= maxStamina) {
      return { ...currentState, maxStamina, lastRest: Date.now() };
    }

    const now = Date.now();
    const lastRest = currentState.lastRest || now;
    const timePassed = now - lastRest;

    const intervalsPassed = Math.floor(timePassed / STAMINA_REGEN_INTERVAL);

    if (intervalsPassed > 0) {
      const staminaGained = intervalsPassed * STAMINA_REGEN_AMOUNT;
      const nextStamina = Math.min(maxStamina, currentState.stamina + staminaGained);

      const leftoverTime = timePassed % STAMINA_REGEN_INTERVAL;
      const nextLastRest = now - leftoverTime;

      return {
        ...currentState,
        stamina: nextStamina,
        maxStamina,
        lastRest: nextLastRest
      };
    }

    return { ...currentState, maxStamina };
  }, []);

  // 1. التحميل الأولي مع تحديث القيم إذا كانت قديمة
  useEffect(() => {
    let s = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) s = JSON.parse(raw);
    } catch (e) {
      s = null;
    }

    // إذا لم توجد بيانات، نستخدم الحالة الافتراضية
    if (!s) s = defaultState();

    // تحديث maxStamina بناءً على اللفل الحالي
    s = {
      ...s,
      maxStamina: maxStaminaForLevel(s.level || 1),
    };

    s = applyResets(s);
    s = regenStaminaIfNeeded(s);

    setState(s);
    setLoaded(true);
  }, [regenStaminaIfNeeded]);

  // 2. مؤقت التحديث الدوري
  useEffect(() => {
    if (!loaded || !state) return;

    const timer = setInterval(() => {
      setState((prev) => {
        const next = regenStaminaIfNeeded(prev);
        if (next.stamina !== prev.stamina) {
          persist(next);
        }
        return next;
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [loaded, state, regenStaminaIfNeeded]);

  const persist = useCallback((next) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save state", e);
      }
    }, 250);
  }, []);

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn({ ...prev, lastRest: prev.lastRest || Date.now() });
      persist(next);
      return next;
    });
  }, [persist]);

  return { state, loaded, update };
}