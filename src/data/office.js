export const OFFICE_COURSES = {
  python: {
    id: 'python',
    company: '蟒蛇云科',
    tower: '蟒蛇云端大厦',
    floor: '27F · 后端研发层',
    color: '#8fe3b0',
    accent: '#2f8f63',
    boss: '阿蟒',
    bossTitle: '技术总监',
    bossLine: '写代码和散步一样，先把路走通，再想怎么走得漂亮。',
    npcNames: ['小满', '阿杉', '灯灯', '小禾'],
    tagline: 'PYTHON · 后端研发部',
    intro: '电梯门打开，是一层被绿植包围的研发办公室。落地窗外的高楼一直排到天际线，键盘声像细密的雨。'
  },
  web: {
    id: 'web',
    company: '起源网络',
    tower: '起源网络中心',
    floor: '18F · 产品体验层',
    color: '#8ecae6',
    accent: '#2b6f8f',
    boss: '木匠',
    bossTitle: '产品总监',
    bossLine: '网页是给人用的。先想清楚谁站在页面前面，再写标签。',
    npcNames: ['阿澄', '星禾', '栗子', '小舟'],
    tagline: 'WEB · 产品体验部',
    intro: '这一层到处是便签墙和半透明的会议室。窗外霓虹在玻璃上映出两遍，像一份还没定稿的页面。'
  },
  data: {
    id: 'data',
    company: '北岭数据',
    tower: '北岭数据塔',
    floor: '31F · 数据分析层',
    color: '#c9b6ff',
    accent: '#6b57a8',
    boss: '守塔人',
    bossTitle: '数据主管',
    bossLine: '数字不会自己说话。你要先问对问题，它才肯把故事讲出来。',
    npcNames: ['青禾', '阿岚', '十七', '塔塔'],
    tagline: 'DATA · 数据分析部',
    colorSoft: '#a7c7e7',
    intro: '整层楼安静得能听见服务器风扇。落地窗外是城市的天际线，屏幕上是另一片同样密的星河。'
  }
};

export const TOWER_ORDER = ['python', 'web', 'data'];

export const OFFICE_RANKS = [
  {
    title: '实习生',
    en: 'INTERN',
    salary: 4200,
    desk: '公共工位',
    threshold: 0,
    color: '#9fb3c8',
    perk: '有工位、有导师，任务从基础开始。'
  },
  {
    title: '转正员工',
    en: 'FULL-TIME',
    salary: 7200,
    desk: '靠窗工位',
    threshold: 3,
    color: '#8fd2a8',
    perk: '搬到靠窗工位，能看见外面的高楼，任务难度 +1。'
  },
  {
    title: '项目组长',
    en: 'TEAM LEAD',
    salary: 10800,
    desk: '组长隔间',
    threshold: 7,
    color: '#f0c987',
    perk: '有独立隔间，可以主持会议室的小分享。'
  },
  {
    title: '部门领导',
    en: 'DIRECTOR',
    salary: 16800,
    desk: '独立办公室',
    threshold: 12,
    color: '#f0a6c8',
    perk: '拥有自己的办公室，落地窗和整层工位都归你管。'
  }
];

export const QUESTION_BANK = {
  python: {
    1: [
      { id: 'py-1a', question: 'print("你好") 会把哪一段文字显示到终端里？' },
      { id: 'py-1b', question: '在 Python 里，变量像什么？请用一个生活里的比喻说明。' }
    ],
    2: [
      { id: 'py-2a', question: 'if 后面的条件成立时，程序会执行哪一块代码？' },
      { id: 'py-2b', question: 'for i in range(3) 里面的 i 会依次取到哪些值？' }
    ],
    3: [
      { id: 'py-3a', question: '列表 nums = [3, 8, 1]，怎样取出最后一个元素？' },
      { id: 'py-3b', question: '写一个函数时，参数和返回值分别解决什么问题？' }
    ],
    4: [
      { id: 'py-4a', question: '字典里用键取值和用列表下标取值，最大的区别是什么？' },
      { id: 'py-4b', question: '字符串 "3" 和整数 3 相加会发生什么？你会怎么处理？' }
    ],
    5: [
      { id: 'py-5a', question: '递归函数一定要有什么，否则会发生什么？' },
      { id: 'py-5b', question: '如果一段代码要处理一万条数据，你会怎样避免重复计算？' }
    ]
  },
  web: {
    1: [
      { id: 'web-1a', question: '网页上的大标题、正文和按钮，通常分别用来做什么？' },
      { id: 'web-1b', question: '网页上的文字挤在一起时，你会先调整什么，让它看起来舒服一些？' }
    ],
    2: [
      { id: 'web-2a', question: '网页上的文字想变成红色，最应该去改什么？' },
      { id: 'web-2b', question: '文字看起来太小，你会在样式里调整什么？' }
    ],
    3: [
      { id: 'web-3a', question: '用 flex 让三个盒子水平排列，需要写哪几条关键样式？' },
      { id: 'web-3b', question: '页面在手机上变窄时，你希望布局怎么变化？' }
    ],
    4: [
      { id: 'web-4a', question: '按钮点击后要执行一段代码，通常监听哪个事件？' },
      { id: 'web-4b', question: 'querySelector 和 querySelectorAll 的返回值有什么不同？' }
    ],
    5: [
      { id: 'web-5a', question: '如果页面上的数据变了，但界面没变，你会先检查什么？' },
      { id: 'web-5b', question: '怎样让一个交互在用户快速连点时仍然保持稳定？' }
    ]
  },
  data: {
    1: [
      { id: 'data-1a', question: '一列数字放进列表后，怎样知道里面一共有多少个数？' },
      { id: 'data-1b', question: '如果数据是空的，求平均值时为什么要特别小心？' }
    ],
    2: [
      { id: 'data-2a', question: '用一个循环累加列表里的数，累加变量应该从哪里开始？' },
      { id: 'data-2b', question: '怎样在一组数里找出最大值？说说你的步骤。' }
    ],
    3: [
      { id: 'data-3a', question: '平均值和最大值分别能告诉你数据里的什么信息？' },
      { id: 'data-3b', question: '如果列表里混进了一个字符串，你会怎样先清理数据？' }
    ],
    4: [
      { id: 'data-4a', question: '怎样只保留列表里大于 60 的数？' },
      { id: 'data-4b', question: '如果每条数据是一个字典，你会按键取出哪些字段？' }
    ],
    5: [
      { id: 'data-5a', question: '两组数据平均值相同，但一组波动很大，你会再算什么？' },
      { id: 'data-5b', question: '怎样把一份原始数据整理成可以直接回答老板问题的结果？' }
    ]
  }
};

const PY_FALLBACK = [
  {
    title: '把工位号码报给前台',
    brief: '前台需要今天新人的工位号。请用 print 输出 27，让前台系统能读到。',
    starter: '# 输出你的工位号\n',
    expected: '27',
    hint: 'print(27) 会把数字 27 显示出来。'
  },
  {
    title: '统计上午的代码提交',
    brief: '上午团队一共提交了三个数字：4、7、5。请把它们加在一起，并输出结果。',
    starter: '# 把三个数字相加后输出\n',
    expected: '16',
    hint: '可以直接写 print(4 + 7 + 5)。'
  },
  {
    title: '判断需求是否加急',
    brief: '变量 urgent = True 表示需求加急。请用 if 判断，如果加急就输出“加急”，否则输出“常规”。',
    starter: 'urgent = True\n# 用 if 判断 urgent\n',
    expected: '加急',
    hint: 'if urgent:\n    print("加急")\nelse:\n    print("常规")'
  },
  {
    title: '把会议人数装进列表',
    brief: '本周三场会议的人数是 [12, 8, 15]。请输出会议总人数。',
    starter: 'people = [12, 8, 15]\n# 输出总人数\n',
    expected: '35',
    hint: '用 sum(people) 求列表总和，再用 print 输出。'
  },
  {
    title: '生成一段发布说明',
    brief: '版本号 version = "v2.4" 已经准备好。请用 f-string 输出：发布 v2.4。',
    starter: 'version = "v2.4"\n# 用 f-string 输出：发布 v2.4\n',
    expected: '发布 v2.4',
    hint: 'print(f"发布 {version}")'
  }
];

const WEB_FALLBACK = [
  {
    title: '给新同事做一张欢迎卡',
    brief: '用 h1 写“欢迎加入”，用 p 写一句“今天先熟悉工位”。最后放一个 button，文字是“开始”。',
    starter: '<h1>欢迎加入</h1>\n<p>今天先熟悉工位</p>\n<button>开始</button>',
    checks: [
      { selector: 'h1', textIncludes: '欢迎加入', label: 'h1 里有欢迎语' },
      { selector: 'p', textIncludes: '今天先熟悉工位', label: 'p 里有一句提示' },
      { selector: 'button', textIncludes: '开始', label: '按钮文字是“开始”' }
    ],
    hint: '标签成对出现，文字写在标签中间。'
  },
  {
    title: '把任务卡片排整齐',
    brief: '创建一个卡片 div.card，里面放 h2“今日任务”和 p“完成接口联调”。再写一条 CSS：.card 的内边距为 16px。',
    starter: '<div class="card">\n  <h2>今日任务</h2>\n  <p>完成接口联调</p>\n</div>\n<style>\n  /* 在这里写 .card 的内边距 */\n</style>',
    checks: [
      { selector: '.card h2', textIncludes: '今日任务', label: '卡片里有标题' },
      { selector: '.card p', textIncludes: '完成接口联调', label: '卡片里有任务描述' }
    ],
    cssChecks: [{ pattern: '\\.card\\s*\\{[^}]*padding\\s*:\\s*16px', label: '.card 使用 16px 内边距' }],
    hint: '.card { padding: 16px; }'
  },
  {
    title: '给按钮加上状态提示',
    brief: '页面里有一个 id 为 go 的按钮。请写一段脚本，点击后把按钮文字改成“已提交”。',
    starter: '<button id="go">提交</button>\n<script>\n  // 点击按钮后修改文字\n</script>',
    checks: [{ selector: '#go', textIncludes: '提交', label: '按钮初始文字是“提交”' }],
    scriptChecks: [
      { pattern: "getElementById\\(['\"]go['\"]\\)|querySelector\\(['\"]#go['\"]\\)", label: '选中了按钮' },
      { pattern: 'addEventListener\\(\\s*[\'"]click', label: '监听了 click 事件' },
      { pattern: 'textContent|innerText', label: '修改了按钮文字' },
      { pattern: '已提交', label: '文字改为“已提交”' }
    ],
    hint: "const btn = document.querySelector('#go'); btn.addEventListener('click', () => { btn.textContent = '已提交'; });"
  },
  {
    title: '让两栏在窄屏堆叠',
    brief: '使用 flex 让 .row 里的两个 .col 水平排列；当屏幕宽度小于 600px 时，改成竖向堆叠。',
    starter: '<div class="row">\n  <div class="col">左栏</div>\n  <div class="col">右栏</div>\n</div>\n<style>\n  /* 写 display:flex 和媒体查询 */\n</style>',
    checks: [{ selector: '.row .col', minCount: 2, label: '有两个 .col 子元素' }],
    cssChecks: [
      { pattern: '\\.row\\s*\\{[^}]*display\\s*:\\s*flex', label: '.row 使用 flex' },
      { pattern: '@media[^{]*max-width\\s*:\\s*600px', label: '写了 600px 媒体查询' }
    ],
    hint: '.row { display: flex; } @media (max-width: 600px) { .row { flex-direction: column; } }'
  },
  {
    title: '做一张数据小卡片',
    brief: '做一个 .stat 卡片，包含 h3“本周完成”和 p“12 个任务”；再用 CSS 让 .stat 背景为 #f4f8ff。',
    starter: '<div class="stat">\n  <h3>本周完成</h3>\n  <p>12 个任务</p>\n</div>\n<style>\n  /* 设置背景色 */\n</style>',
    checks: [
      { selector: '.stat h3', textIncludes: '本周完成', label: '标题正确' },
      { selector: '.stat p', textIncludes: '12 个任务', label: '数字正确' }
    ],
    cssChecks: [{ pattern: '\\.stat\\s*\\{[^}]*background\\s*:\\s*#f4f8ff', label: '.stat 背景色正确' }],
    hint: '.stat { background: #f4f8ff; }'
  }
];

export function fallbackTask(courseId, difficulty = 1) {
  const level = Math.max(1, Math.min(5, Number(difficulty) || 1));
  if (courseId === 'web') {
    const task = WEB_FALLBACK[(level - 1) % WEB_FALLBACK.length];
    return {
      ...task,
      difficulty: level,
      type: 'web',
      xp: 25 + level * 8,
      coins: 30 + level * 10,
      minutes: 6 + level
    };
  }
  const task = PY_FALLBACK[(level - 1) % PY_FALLBACK.length];
  return {
    ...task,
    difficulty: level,
    type: 'python',
    xp: 25 + level * 8,
    coins: 30 + level * 10,
    minutes: 6 + level
  };
}

export const CHATTER_FALLBACK = {
  street: [
    {
      title: '午休的街角',
      lines: [
        { speaker: '路人 A', text: '听说云端大厦今天又在招实习生？', mood: '好奇' },
        { speaker: '路人 B', text: '是啊，面试官会现场出题，答得好直接上岗。', mood: '认真' },
        { speaker: '路人 A', text: '那我也去试试。反正下班前还能回来喝杯咖啡。', mood: '轻松' }
      ]
    },
    {
      title: '红绿灯前',
      lines: [
        { speaker: '外卖员', text: '这几栋楼里，就属数据塔晚上灯最多。', mood: '感叹' },
        { speaker: '上班族', text: '他们在追一个很难的指标吧。', mood: '平静' },
        { speaker: '外卖员', text: '那也得先吃饭。身体才是 KPI。', mood: '俏皮' }
      ]
    }
  ],
  office: [
    {
      title: '靠窗的讨论',
      lines: [
        { speaker: '小满', text: '这个循环我总写成死循环，老板刚刚盯了我三秒。', mood: '无奈' },
        { speaker: '小语', text: '先把退出条件写在纸上，再翻译成代码。三秒定律很有用。', mood: '鼓励' },
        { speaker: '小满', text: '好，我试试。等下请你喝咖啡。', mood: '开心' }
      ]
    },
    {
      title: '茶水间偶遇',
      lines: [
        { speaker: '阿杉', text: '你看到新同事的工位了吗？搬到窗边了。', mood: '好奇' },
        { speaker: '灯灯', text: '听说连续完成老板任务就能升级工位。', mood: '羡慕' },
        { speaker: '小语', text: '别只看工位，任务难度也会跟着涨。', mood: '认真' }
      ]
    }
  ],
  meeting: [
    {
      title: '十分钟站会',
      lines: [
        { speaker: '老板', text: '今天只问三个问题：做了什么，卡在哪，下一步是什么。', mood: '严肃' },
        { speaker: '阿杉', text: '接口写完了，卡在格式符，下一步补测试。', mood: '认真' },
        { speaker: '小满', text: '我这边页面还差一个按钮事件，下午能交。', mood: '紧张' },
        { speaker: '老板', text: '很好，散会。问题留在白板上，别留在心里。', mood: '平和' }
      ]
    }
  ]
};

export function courseOffice(courseId) {
  return OFFICE_COURSES[courseId] || OFFICE_COURSES.python;
}

export function getOfficeState(save, courseId) {
  if (!save.office || typeof save.office !== 'object') save.office = {};
  let state = save.office[courseId];
  if (!state) {
    state = {
      hired: false,
      stage: 0,
      tasksDone: 0,
      merit: 0,
      difficulty: 1,
      hiredAt: '',
      lastTaskAt: ''
    };
    save.office[courseId] = state;
  }
  state.stage = Math.max(0, Math.min(OFFICE_RANKS.length - 1, Number(state.stage) || 0));
  state.tasksDone = Math.max(0, Number(state.tasksDone) || 0);
  state.merit = Math.max(0, Number(state.merit) || 0);
  state.difficulty = Math.max(1, Math.min(5, Number(state.difficulty) || 1));
  return state;
}

export function officeRank(state) {
  return OFFICE_RANKS[Math.max(0, Math.min(OFFICE_RANKS.length - 1, state?.stage || 0))];
}

export function nextOfficeRank(state) {
  return OFFICE_RANKS[(state?.stage || 0) + 1] || null;
}

export function promotionReady(state) {
  const next = nextOfficeRank(state);
  if (!next) return false;
  return (state?.tasksDone || 0) >= next.threshold;
}

export function promotionProgress(state) {
  const next = nextOfficeRank(state);
  if (!next) return { text: '已经是部门领导', ratio: 1, left: 0 };
  const done = Math.max(0, Number(state?.tasksDone) || 0);
  const left = Math.max(0, next.threshold - done);
  return {
    text: left
      ? `再完成 ${left} 个任务可晋升 ${next.title}`
      : `绩效达标，去老板办公室申请晋升 ${next.title}`,
    ratio: Math.min(1, done / Math.max(1, next.threshold)),
    left
  };
}

export function salaryOf(state) {
  const rank = officeRank(state);
  const bonus = Math.min(2400, Math.floor((state?.merit || 0) / 12) * 100);
  return rank.salary + bonus;
}

export function pickQuestion(courseId, difficulty, asked = []) {
  const bank = QUESTION_BANK[courseId] || QUESTION_BANK.python;
  const level = Math.max(1, Math.min(5, Number(difficulty) || 1));
  const askedSet = new Set(asked || []);
  for (let distance = 0; distance < 5; distance++) {
    for (const step of [level - distance, level + distance]) {
      if (step < 1 || step > 5) continue;
      const list = bank[step] || [];
      const found = list.find((item) => !askedSet.has(item.id));
      if (found) return { ...found, difficulty: step };
    }
  }
  const all = Object.values(bank).flat();
  return all[Math.floor(Math.random() * all.length)] || {
    id: 'generic',
    question: '说说你最近解决过的一个问题，以及你是怎样一步步找到答案的。',
    difficulty: level
  };
}

export function officeTitle(save, courseId) {
  const state = getOfficeState(save, courseId);
  return officeRank(state).title;
}

export function deskSpotFor(stage) {
  if (stage >= 3) return { x: 120, y: 236, dir: 'up' };
  if (stage === 2) return { x: 352, y: 322, dir: 'up' };
  return { x: 205, y: 388, dir: 'up' };
}

export function fallbackChatter(kind = 'office') {
  const list = CHATTER_FALLBACK[kind] || CHATTER_FALLBACK.office;
  return list[Math.floor(Math.random() * list.length)];
}
