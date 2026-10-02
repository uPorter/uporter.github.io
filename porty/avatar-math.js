const DIRECTIONS = 16;

export function directionForPoint(x, y, bounds) {
  const dx = x - (bounds.left + bounds.width / 2);
  const dy = y - (bounds.top + bounds.height / 2);
  if (Math.hypot(dx, dy) < bounds.width * 20 / 96) return null;
  const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
  return Math.round(angle / (Math.PI / 8)) % DIRECTIONS;
}

export function stepToward(current, target) {
  if (current === null) return target;
  const difference = (target - current + 24) % DIRECTIONS - 8;
  return (current + Math.sign(difference) + DIRECTIONS) % DIRECTIONS;
}
