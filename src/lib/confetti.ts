import confetti from 'canvas-confetti';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success';

const supportsVibrate = () =>
  typeof navigator !== 'undefined' &&
  'vibrate' in navigator &&
  // iOS Safari exposes navigator.vibrate but it's a no-op
  !/iPad|iPhone|iPod/.test(navigator.userAgent);

const visualPulse = (style: HapticStyle) => {
  if (typeof document === 'undefined') return;
  const intensity: Record<HapticStyle, { scale: number; duration: number; color: string }> = {
    light:   { scale: 1.005, duration: 120, color: 'hsl(var(--primary) / 0.08)' },
    medium:  { scale: 1.01,  duration: 160, color: 'hsl(var(--primary) / 0.12)' },
    heavy:   { scale: 1.015, duration: 220, color: 'hsl(var(--primary) / 0.18)' },
    success: { scale: 1.01,  duration: 200, color: 'hsl(var(--success, var(--primary)) / 0.15)' },
  };
  const cfg = intensity[style];
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;pointer-events:none;z-index:9998;
    background:${cfg.color};opacity:0;
    transition:opacity ${cfg.duration}ms ease-out;
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
    });
  });
  setTimeout(() => overlay.remove(), cfg.duration + 50);

  const root = document.getElementById('root') ?? document.body;
  const prev = root.style.transition;
  root.style.transition = `transform ${cfg.duration / 2}ms ease-out`;
  root.style.transform = `scale(${cfg.scale})`;
  setTimeout(() => {
    root.style.transform = '';
    setTimeout(() => { root.style.transition = prev; }, cfg.duration / 2);
  }, cfg.duration / 2);
};

export const haptic = (style: HapticStyle = 'medium') => {
  if (supportsVibrate()) {
    const patterns: Record<HapticStyle, number | number[]> = {
      light: [25],
      medium: [40],
      heavy: [60, 40, 60, 40, 80],
      success: [30, 60, 30],
    };
    (navigator as Navigator).vibrate(patterns[style]);
    return;
  }
  // Visual fallback for iOS (and other platforms without vibration)
  visualPulse(style);
};

export const celebrateTask = () => {
  haptic('success');
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#2eb8a6', '#f97853', '#e6c229', '#9b59b6', '#3498db'],
  });
};

export const celebrateAssignment = () => {
  haptic('heavy');
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999,
    colors: ['#2eb8a6', '#f97853', '#e6c229', '#9b59b6', '#3498db', '#ff6b9d'],
  };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

export const celebrateStars = () => {
  haptic('medium');
  const defaults = {
    ticks: 80,
    gravity: 0.4,
    decay: 0.94,
    startVelocity: 20,
    zIndex: 9999,
    shapes: ['star' as const],
    colors: ['#e6c229', '#f5d547', '#ffec6e', '#ffd700', '#fff3a0'],
  };

  const shoot = () => {
    confetti({ ...defaults, particleCount: 20, origin: { x: 0.2, y: 0.3 }, scalar: 1.2 });
    confetti({ ...defaults, particleCount: 20, origin: { x: 0.8, y: 0.3 }, scalar: 1.2 });
    confetti({ ...defaults, particleCount: 15, origin: { x: 0.5, y: 0.1 }, scalar: 0.9 });
  };

  shoot();
  setTimeout(shoot, 200);
  setTimeout(shoot, 400);
};
