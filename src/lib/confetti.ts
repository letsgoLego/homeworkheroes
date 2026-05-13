import confetti from 'canvas-confetti';

export const haptic = (style: 'light' | 'medium' | 'heavy' | 'success' = 'medium') => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  const patterns: Record<string, number | number[]> = {
    light: [25],
    medium: [40],
    heavy: [60, 40, 60, 40, 80],
    success: [30, 60, 30],
  };
  navigator.vibrate(patterns[style]);
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
