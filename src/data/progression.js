export const LEVELS = [0, 80, 200, 380, 620, 920, 1300, 1750, 2300, 3000];
export const GATE_LEVEL = 2;
export const DATA_COURSE_LEVEL = 3;

export function levelInfo(xp = 0) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i]) level = i + 1;
  }
  const floor = LEVELS[level - 1];
  const nextAt = LEVELS[level] ?? null;
  const span = nextAt === null ? 0 : nextAt - floor;
  const into = Math.max(0, xp - floor);
  return {
    level,
    floor,
    nextAt,
    into,
    span,
    progress: nextAt === null ? 1 : Math.min(1, into / span),
    label: nextAt === null ? 'MAX' : `${into} / ${span} XP`
  };
}

export function courseCompletion(course, progress = {}) {
  const total = course.lessons.length;
  const done = course.lessons.filter((l) => progress[l.id]?.done).length;
  return { done, total, ratio: total ? done / total : 0, complete: total > 0 && done === total };
}

export function isCourseUnlocked(course, level) {
  return !course.requiresLevel || level >= course.requiresLevel;
}
