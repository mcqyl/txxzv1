export const TASK_POOL = [
  {
    id: 'lesson-one',
    title: '翻开新的一页',
    desc: '完成 1 次新的课程练习。',
    event: 'lessonComplete',
    target: 1,
    rewards: { coins: 50, xp: 20, furniture: 'candle' }
  },
  {
    id: 'decorate-two',
    title: '布置小窝',
    desc: '在房间里摆放 2 件家具。',
    event: 'furniturePlaced',
    target: 2,
    rewards: { coins: 60, xp: 20, furniture: 'plant-sprout' }
  },
  {
    id: 'town-three',
    title: '和镇子打个招呼',
    desc: '与小镇的物件互动 3 次（路灯、喷泉、长椅都算）。',
    event: 'townInteract',
    target: 3,
    rewards: { coins: 40, xp: 15 }
  },
  {
    id: 'lesson-three',
    title: '连续的小进步',
    desc: '完成 3 次新的课程练习。',
    event: 'lessonComplete',
    target: 3,
    rewards: { coins: 90, xp: 30, furniture: 'stool-mushroom' }
  }
];

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDailyTasks(dateKey, saved) {
  const day = Number(dateKey.replaceAll('-', ''));
  const start = day % TASK_POOL.length;
  const picked = [0, 1, 2].map((i) => TASK_POOL[(start + i) % TASK_POOL.length]);
  const items = {};
  picked.forEach((task) => {
    const previous = saved?.[task.id];
    items[task.id] = {
      progress: previous?.progress || 0,
      claimed: Boolean(previous?.claimed)
    };
  });
  return { date: dateKey, items };
}

export function getTaskDef(id) {
  return TASK_POOL.find((t) => t.id === id) || null;
}

export const MAINLINE_TASKS = [
  {
    id: 'main-python',
    courseId: 'python',
    title: '让小镇听见你',
    desc: '走完蟒蛇学堂的全部课程，从一句问候写到自己的循环。',
    rewards: { coins: 180, xp: 100, skipCards: 1 }
  },
  {
    id: 'main-web',
    courseId: 'web',
    title: '点亮起源工坊',
    desc: '用结构、样式与行为，搭出一间真正能亮灯的小屋。',
    rewards: { coins: 260, xp: 140, skipCards: 1 }
  },
  {
    id: 'main-sql',
    courseId: 'sql',
    title: '读懂水晶档案',
    desc: '学会向档案馆提问：筛选、排序、聚合，一次比一次准。',
    rewards: { coins: 360, xp: 190, skipCards: 1 }
  },
  {
    id: 'main-data',
    courseId: 'data',
    title: '照看数字花园',
    desc: '把北岭的观测数字收进列表，让它们自己讲出故事。',
    rewards: { coins: 480, xp: 260, skipCards: 2 }
  }
];

export function getMainlineTask(id) {
  return MAINLINE_TASKS.find((task) => task.id === id) || null;
}

export const CHECKIN_GIFTS = ['candle', 'plant-sprout', 'guitar', 'aquarium'];

export function checkinRewards(streak) {
  const capped = Math.min(Math.max(1, streak), 7);
  return {
    coins: 20 + capped * 5,
    xp: 10 + capped * 3,
    skipCards: 1,
    furniture: streak > 0 && streak % 7 === 0
      ? CHECKIN_GIFTS[(Math.floor(streak / 7) - 1) % CHECKIN_GIFTS.length]
      : null
  };
}
