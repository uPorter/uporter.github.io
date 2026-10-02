import { directionForPoint, stepToward } from './avatar-math.js';

const IDLE_LOOKS = [
  [0, 1400], [2, 1000], [5, 1100], [8, 1200], [10, 900],
  [12, 1100], [15, 900], [0, 1400], [13, 1000], [10, 1100],
  [8, 1000], [6, 900], [3, 1100],
];

/** Uses the original Porty frames: neutral, sad, then 16 clockwise directions. */
export function attachPorty(button) {
  const sprite = button.querySelector('.porty-head__sprite');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const { signal } = controller;
  let bounds = button.getBoundingClientRect();
  let direction = 0;
  let request = 0;
  let lastFrame = -1;
  let lastTurn = 0;
  let lastMovement = -Infinity;
  let pointer = null;
  let idleIndex = 0;
  let idleStarted = performance.now();
  let following = false;
  let sad = false;
  let reactionTimer = 0;
  let bounce = null;
  let visible = true;
  let disposed = false;

  function show(frame) {
    if (frame === lastFrame) return;
    sprite.style.backgroundPosition = `${(frame % 6) * 20}% ${Math.floor(frame / 6) * 50}%`;
    button.dataset.frame = String(frame);
    lastFrame = frame;
  }

  function resetPointer() {
    if (following) { idleIndex = 0; idleStarted = performance.now(); }
    following = false;
    pointer = null;
    lastMovement = -Infinity;
  }

  function lookToward(target, now, delay) {
    if (direction === null || now - lastTurn >= delay) {
      direction = stepToward(direction, target);
      lastTurn = now;
    }
    show(direction + 2);
  }

  function animate(now) {
    if (disposed || document.hidden || !visible || motion.matches) return;
    if (sad) {
      button.dataset.expression = 'sad';
      show(1);
    } else if (pointer && now - lastMovement < 1600) {
      following = true;
      button.dataset.expression = 'following-cursor';
      const target = directionForPoint(pointer.x, pointer.y, bounds);
      if (target === null) { direction = null; show(0); }
      else lookToward(target, now, 45);
    } else {
      if (following) resetPointer();
      if (now - idleStarted >= IDLE_LOOKS[idleIndex][1]) {
        idleIndex = (idleIndex + 1) % IDLE_LOOKS.length;
        idleStarted = now;
      }
      button.dataset.expression = 'looking-around';
      lookToward(IDLE_LOOKS[idleIndex][0], now, 110);
    }
    request = requestAnimationFrame(animate);
  }

  function restart() {
    cancelAnimationFrame(request);
    clearTimeout(reactionTimer);
    sad = false;
    bounce?.cancel();
    bounce = null;
    resetPointer();
    idleIndex = 0;
    idleStarted = performance.now();
    lastTurn = 0;
    direction = 0;
    show(0);
    button.dataset.expression = 'still';
    if (!motion.matches && !document.hidden && visible && !disposed) request = requestAnimationFrame(animate);
  }

  function react() {
    clearTimeout(reactionTimer);
    sad = true;
    button.dataset.expression = 'sad';
    show(1);
    if (!motion.matches) {
      const transform = getComputedStyle(sprite).transform;
      bounce?.cancel();
      bounce = sprite.animate([
        { transform },
        { transform: 'scale(.94)', offset: .32 },
        { transform: 'scale(1.01)', offset: .72 },
        { transform: 'scale(1)' },
      ], { duration: 240, easing: 'ease-in-out' });
    }
    reactionTimer = setTimeout(restart, 1400);
  }

  function updateBounds() { bounds = button.getBoundingClientRect(); }
  const resize = new ResizeObserver(updateBounds);
  resize.observe(button);
  const intersection = new IntersectionObserver(entries => {
    const nextVisible = entries[0].isIntersecting;
    if (nextVisible !== visible) { visible = nextVisible; restart(); }
  });
  intersection.observe(button);

  button.addEventListener('click', react, { signal });
  document.addEventListener('pointermove', event => {
    if (!visible || event.pointerType === 'touch' || motion.matches) return;
    pointer = { x: event.clientX, y: event.clientY };
    lastMovement = performance.now();
  }, { passive: true, signal });
  document.documentElement.addEventListener('pointerleave', resetPointer, { signal });
  window.addEventListener('blur', resetPointer, { signal });
  window.addEventListener('scroll', updateBounds, { passive: true, capture: true, signal });
  window.addEventListener('resize', updateBounds, { passive: true, signal });
  document.addEventListener('visibilitychange', restart, { signal });
  motion.addEventListener('change', restart, { signal });
  restart();

  return () => {
    disposed = true;
    controller.abort();
    cancelAnimationFrame(request);
    clearTimeout(reactionTimer);
    bounce?.cancel();
    resize.disconnect();
    intersection.disconnect();
  };
}
