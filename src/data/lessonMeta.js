export const COURSE_STORIES = {
  python: {
    art: 'python',
    title: '一条蛇与一句问候',
    subtitle: 'PYTHON · 从 1989 到今天',
    slides: [
      {
        year: '1989',
        title: '圣诞假期里的小项目',
        text: '荷兰的程序员 Guido van Rossum 想找一件假期里能一直做下去的事。他喜欢一种叫 ABC 的教学语言，却嫌它不够灵活，于是决定自己写一门更好用的语言。名字来自他喜欢的喜剧团 Monty Python，而不是蛇——不过苔溪的老师们还是把学堂画成了一条绿蟒。'
      },
      {
        year: '1991',
        title: '第一行 print 被点亮',
        text: 'Python 0.9.0 第一次公开出现。它最打动人的地方不是复杂的功能，而是“读起来像英文”：用缩进代替大括号，用简单的句子让电脑做事。很多人写下的第一行代码，就是让屏幕说一句 Hello。'
      },
      {
        year: '2000s',
        title: '从脚本长成一片森林',
        text: '之后二十多年，Python 慢慢长进了网站后台、科学计算、自动脚本和人工智能。它不追求跑得最快，而是让想法最快变成能运行的程序。社区把常用工具收进一个个“库”，你只要学会召唤它们。'
      },
      {
        year: '今天',
        title: '轮到你对小镇说话',
        text: '在苔溪，Python 藏在西边老榕树下的蟒蛇学堂里。你不需要先背完整本语法书，只要从一句问候开始：让屏幕听见你，再让变量、判断和循环替你跑腿。'
      }
    ]
  },
  web: {
    art: 'web',
    title: '三块屋顶搭起一张网',
    subtitle: 'HTML · CSS · JAVASCRIPT · 1989 → 今天',
    slides: [
      {
        year: '1989',
        title: 'CERN 走廊里的一页纸',
        text: '在欧洲核子研究中心的走廊里，Tim Berners-Lee 看着来自不同实验室的文件发愁：它们格式各异，很难互相引用。他写下一份提案，想让所有文档用“超链接”连在一起，像一张可以跳来跳去的网。'
      },
      {
        year: '1991',
        title: '第一张网页只是结构',
        text: '第一张公开网页没有漂亮的颜色，只有标题、段落和链接。HTML 用一对对标签告诉浏览器：这是标题，这是正文，这里可以点。结构先站稳，页面才有地方长大。'
      },
      {
        year: '1995',
        title: '样式与行为加入进来',
        text: '1995 年，Brendan Eich 用很短的时间写出了 JavaScript 的雏形；1996 年，CSS 让网页有了颜色和排版。从此一张网页有了三层：HTML 是骨架，CSS 是衣服，JavaScript 是让它动起来的小动作。'
      },
      {
        year: '今天',
        title: '给你的小屋挂一块门牌',
        text: '今天的网站比从前复杂得多，但起点仍然是那三样东西。起源工坊的木匠会把锤子递给你：先写一块门牌，再刷上颜色，最后让门灯在你点击时亮起来。'
      }
    ]
  },
  sql: {
    art: 'sql',
    title: '向档案提问的咒语',
    subtitle: 'SQL · 1970 → 今天',
    slides: [
      {
        year: '1970',
        title: '把世界折成一张表',
        text: 'IBM 的 Edgar F. Codd 提出了一种想法：数据不必藏在复杂的文件结构里，可以像表格一样，一行是一条记录，一列是一种属性。这个“关系模型”后来成了几乎所有数据库的地基。'
      },
      {
        year: '1974',
        title: 'SEQUEL 的第一句询问',
        text: '在 IBM 的 System R 项目里，研究员们做出了 SEQUEL，后来缩写为 SQL。它允许人用接近英语的句子提问：从哪张表里，取哪些列，只要满足什么条件。数据库负责找出答案。'
      },
      {
        year: '1987',
        title: '一句提问，走遍世界',
        text: 'SQL 在 1986 年成为美国标准，次年成为国际标准。银行、图书馆、游戏背包、学校花名册，都开始把记录放进表里。你不需要翻遍每一页，只要把问题问对。'
      },
      {
        year: '今天',
        title: '水晶档案馆的第一束光',
        text: '苔溪的水晶档案馆里，每一根发光石柱都存着一小段记忆。你走进门，石柱慢慢醒来。今天要学的不是背诵咒语，而是学会提出一个清楚的问题。'
      }
    ]
  },
  data: {
    art: 'data',
    title: '把星星收进列表',
    subtitle: 'DATA · 从观测到理解',
    slides: [
      {
        year: '很久以前',
        title: '先记录，再理解',
        text: '人类最早的数据工作，可能只是抬头数星星：哪天升起，哪天下雨，花期持续几天。把看到的事情记成数字，是理解世界的第一步。'
      },
      {
        year: '一张列表',
        title: '一个数字是事实，一串数字是故事',
        text: '单独一个数字只能说明一件事；把很多数字按顺序放进列表，就能看出高低、平均和变化。数学家和统计学家发明了最大值、平均值、计数这些工具，让故事浮出水面。'
      },
      {
        year: '2000s',
        title: '计算让提问变快',
        text: '电脑和 Python 让分析不再依赖手算。科学、商业和游戏都开始用程序处理成串的数据。重要的不再是记住公式，而是知道该向数据提出什么问题。'
      },
      {
        year: '今天',
        title: '北岭的数字花园',
        text: '观星台的守塔人把风速、潮汐和花期都写进列表。你会在数字花园里学会：先看清数据，再让 max、sum、循环和判断替你回答。'
      }
    ]
  }
};

export const LESSON_META = {
  'py-hello': {
    level: 1,
    concept: '输出 · 字符串',
    focus: 'print() 负责让屏幕说话，引号负责把文字完整地装起来。',
    syntax: 'print("你好，世界！")',
    steps: [
      '读懂 print 与字符串：括号里放要显示的内容。',
      '照着示例写出第一行，注意英文括号与成对引号。',
      '把文字换成你想对小镇说的第一句话，运行并提交。'
    ],
    demo: 'hello',
    tutor: [
      '先只保留一行：print("你好，世界！")。括号、引号都必须是英文半角。',
      '如果报错“这里需要一个右括号”，检查结尾有没有 )；如果报错字符串没有闭合，检查引号是否成对。',
      '把这一行完整放进编辑器：print("你好，世界！")，不要加多余的空格或中文标点。'
    ]
  },
  'py-vars': {
    level: 1,
    concept: '变量 · f-string',
    focus: '变量是贴着标签的木盒；f-string 可以把盒子里的东西嵌进一句话。',
    syntax: 'name = "小苔"\nprint(f"{name}带着 12 枚金币回到了小镇。")',
    steps: [
      '读懂变量赋值：等号右边放进盒子，左边是标签。',
      '在字符串前加 f，再用花括号取出变量。',
      '让输出与期望句完全一致，注意中文标点。'
    ],
    demo: 'vars',
    tutor: [
      '先确认 name 和 coins 已经赋值，再用 f-string 打印。',
      '字符串前要有 f，变量名要放在花括号里：{name}、{coins}，花括号不能写成中文括号。',
      '完整写法：print(f"{name}带着 {coins} 枚金币回到了小镇。")，注意结尾的句号。'
    ]
  },
  'py-math': {
    level: 2,
    concept: '整除 · 取余',
    focus: '// 回答“每人能分几个”，% 回答“还剩几个”。',
    syntax: 'print(f"每人 {apples // friends} 个苹果")\nprint(f"剩下 {apples % friends} 个苹果")',
    steps: [
      '理解 7 个苹果分给 3 人：整除得 2，余数是 1。',
      '把 apples // friends 与 apples % friends 分别放进 f-string。',
      '分两行打印，逐字对照期望输出。'
    ],
    demo: 'math',
    tutor: [
      '这一课需要打印两行：第一行用整除 //，第二行用取余 %。',
      '注意不要用普通除号 /，7 / 3 会得到小数；本题要的是 // 和 %。',
      '参考两行：print(f"每人 {apples // friends} 个苹果") 与 print(f"剩下 {apples % friends} 个苹果")。'
    ]
  },
  'py-if': {
    level: 3,
    concept: '条件 · 缩进',
    focus: 'if 后面的条件成立时，才执行冒号下面缩进的那一行。',
    syntax: 'if score >= 60:\n    print("通过")\nelse:\n    print("再试一次")',
    steps: [
      '先读条件：82 >= 60 成立，所以应该走 if 分支。',
      '写出 if 行、冒号和缩进 4 个空格的 print。',
      '补上 else 分支，运行确认只输出「通过」。'
    ],
    demo: 'branch',
    tutor: [
      '检查 if 行末尾有没有英文冒号，以及下面一行有没有缩进 4 个空格。',
      '本题 score 是 82，条件应该写 score >= 60，输出「通过」。',
      '完整结构：if score >= 60: 换行后缩进 print("通过")；下一行 else:，再换行缩进 print("再试一次")。'
    ]
  },
  'py-loop': {
    level: 3,
    concept: 'for 循环 · 字符串乘法',
    focus: '循环让同一行代码重复执行；"*" * i 可以重复出 i 个星号。',
    syntax: 'for i in range(1, 4):\n    print("*" * i)',
    steps: [
      '读懂 range(1, 4) 会依次给出 1、2、3（不包含 4）。',
      '写出 for 行和缩进的 print("*" * i)。',
      '运行确认得到 1、2、3 个星号的三行输出。'
    ],
    demo: 'loop',
    tutor: [
      '本题只需要一个 for 循环，循环变量可以叫 i。',
      'range 的右端点不包含在结果里，所以 range(1, 4) 正好是 1、2、3。',
      '完整写法：for i in range(1, 4): 下一行缩进 print("*" * i)。注意星号要加引号。'
    ]
  },
  'py-list': {
    level: 4,
    concept: '列表 · len / sum',
    focus: '列表按顺序装东西；len 数个数，sum 把一组数字加起来。',
    syntax: 'tools = ["锄头", "水壶", "火把"]\nprint(len(tools))\nprint(sum([3, 5, 7]))',
    steps: [
      '读懂列表用方括号，元素之间用英文逗号。',
      '用 len(tools) 数出行囊里有几件工具。',
      '用 sum([3, 5, 7]) 求第二行，检查输出是 3 和 15。'
    ],
    demo: 'list',
    tutor: [
      '需要两行 print：第一行数工具，第二行求数字和。',
      'len() 接收列表本身：len(tools)；sum() 接收一组数字：sum([3, 5, 7])。',
      '参考：print(len(tools)) 与 print(sum([3, 5, 7]))，顺序不能反。'
    ]
  },
  'web-html': {
    level: 1,
    concept: 'HTML · 标签结构',
    focus: '标签是给内容贴的说明纸：h1 是标题，p 是一段话。',
    syntax: '<h1>欢迎来到我的小镇</h1>\n<p>这是我在苔溪的第一间小屋。</p>',
    steps: [
      '读懂开始标签与结束标签要成对出现。',
      '把 h1 的文字改成「欢迎来到我的小镇」。',
      '让 p 的介绍里包含「小屋」，再提交自检。'
    ],
    demo: 'html',
    tutor: [
      '检查 h1 与 p 是否都有对应的结束标签：</h1>、</p>。',
      'h1 里的文字必须是「欢迎来到我的小镇」，p 里要出现「小屋」。',
      '参考：<h1>欢迎来到我的小镇</h1> 换行 <p>这是我在苔溪的第一间小屋。</p>。'
    ]
  },
  'web-css': {
    level: 2,
    concept: 'CSS · 选择器',
    focus: '选择器先找到元素，花括号里再决定它长什么样。',
    syntax: 'body { background: #f4e8ce; }\nh1 { color: #2f6d56; }',
    steps: [
      '读懂选择器、属性名与值之间的冒号和分号。',
      '为 body 设置 background 背景色。',
      '为 h1 设置 color 文字颜色，保留标题文字。'
    ],
    demo: 'css',
    tutor: [
      '样式要写在 <style> 与 </style> 之间。',
      '需要两条规则：body { background: ... } 和 h1 { color: ... }，每条末尾有分号。',
      '参考：body { background: #f4e8ce; } 与 h1 { color: #2f6d56; }。'
    ]
  },
  'web-list': {
    level: 2,
    concept: '列表结构 · ul / li',
    focus: 'ul 是清单本身，每一个 li 是清单里的一项。',
    syntax: '<ul>\n  <li>去湖边散步</li>\n  <li>学会写 Python</li>\n  <li>把家装满家具</li>\n</ul>',
    steps: [
      '读懂 ul 包裹 li 的层级关系。',
      '在 ul 里补到至少 3 个 li。',
      '让清单里出现「散步」，完成三项自检。'
    ],
    demo: 'list-html',
    tutor: [
      '检查所有 li 是否都写在 ul 的里面，并且每个 li 都闭合。',
      '需要至少 3 个 li，其中一项文字要包含「散步」。',
      '参考：<ul><li>去湖边散步</li><li>学会写 Python</li><li>把家装满家具</li></ul>。'
    ]
  },
  'web-button': {
    level: 4,
    concept: 'DOM · 事件监听',
    focus: '先找到按钮和文字元素，再监听 click，最后修改 textContent。',
    syntax: "const button = document.getElementById('greet');\nbutton.addEventListener('click', () => {\n  document.getElementById('lamp').textContent = '门灯亮了！';\n});",
    steps: [
      '读懂 getElementById 用 id 找到页面元素。',
      '给 #greet 按钮监听 click 事件。',
      '点击后把 #lamp 的文字改成「门灯亮了！」。'
    ],
    demo: 'click',
    tutor: [
      'JavaScript 要写在 <script> 标签里，并确认按钮 id 是 greet、状态文字 id 是 lamp。',
      '事件监听写成 addEventListener(\'click\', ...)，回调里修改 #lamp 的 textContent。',
      '参考：const button = document.getElementById(\'greet\'); button.addEventListener(\'click\', () => { document.getElementById(\'lamp\').textContent = \'门灯亮了！\'; });'
    ]
  },
  'sql-select': {
    level: 1,
    concept: 'SELECT · 取列',
    focus: 'SELECT 后面写要看的列，FROM 后面写表名。',
    syntax: 'SELECT name, score FROM students;',
    steps: [
      '先看表：students 有 id、name、city、score 四列。',
      '在 SELECT 后写 name, score，再用 FROM students。',
      '运行，确认两列五行与期望结果一致。'
    ],
    demo: 'select',
    tutor: [
      '本题只需要取 name 和 score 两列，不需要 *。',
      '列之间用英文逗号，表名是 students，语句末尾可以加分号。',
      '完整语句：SELECT name, score FROM students;'
    ]
  },
  'sql-where': {
    level: 2,
    concept: 'WHERE · 过滤',
    focus: 'WHERE 像一个筛子，只留下条件成立的记录。',
    syntax: "SELECT name, score FROM students WHERE city = '星港';",
    steps: [
      '读懂文本条件要用单引号包住。',
      '在 FROM students 后写 WHERE city = \'星港\'。',
      '运行，确认只剩小满和阿澄两行。'
    ],
    demo: 'where',
    tutor: [
      'WHERE 要写在 FROM students 的后面，条件里的文字用单引号。',
      '条件列名是 city，值是「星港」，比较符号是等号。',
      '完整语句：SELECT name, score FROM students WHERE city = \'星港\';'
    ]
  },
  'sql-order': {
    level: 3,
    concept: 'ORDER BY · LIMIT',
    focus: '先按分数从高到低排序，再只留下前三行。',
    syntax: 'SELECT name, score FROM students ORDER BY score DESC LIMIT 3;',
    steps: [
      '读懂 DESC 表示从高到低。',
      '在 FROM students 后加 ORDER BY score DESC。',
      '最后加 LIMIT 3，运行核对前三名。'
    ],
    demo: 'order',
    tutor: [
      'ORDER BY 要写在 FROM 之后，LIMIT 写在最后。',
      '降序关键字是 DESC，不是 DESCEND；本题只取 3 行。',
      '完整语句：SELECT name, score FROM students ORDER BY score DESC LIMIT 3;'
    ]
  },
  'sql-avg': {
    level: 4,
    concept: '聚合函数 · AS 别名',
    focus: 'AVG 把一整列压成一个平均值，AS 给结果起名字。',
    syntax: 'SELECT AVG(score) AS average FROM students;',
    steps: [
      '读懂 AVG(score) 计算整列平均分。',
      '用 AS average 给结果列命名。',
      '运行，确认列名为 average、值为 82.4。'
    ],
    demo: 'aggregate',
    tutor: [
      'SELECT 后面只写一个聚合表达式 AVG(score)，不要加普通列。',
      '别名的关键字是 AS，名字必须是 average。',
      '完整语句：SELECT AVG(score) AS average FROM students;'
    ]
  },
  'data-max': {
    level: 3,
    concept: 'max / min',
    focus: 'max 找最大，min 找最小，直接把列表交给它们。',
    syntax: 'print(max(numbers))\nprint(min(numbers))',
    steps: [
      '读懂 numbers 列表里的四个数字。',
      '用 max(numbers) 打印最大值。',
      '用 min(numbers) 打印最小值，得到 20 和 5。'
    ],
    demo: 'max',
    tutor: [
      '需要两行 print，一行 max，一行 min。',
      '函数括号里放列表名 numbers，不要写成 max 或 max[]。',
      '参考：print(max(numbers)) 与 print(min(numbers))。'
    ]
  },
  'data-avg': {
    level: 3,
    concept: '平均值 · round',
    focus: '平均值 = 总和 ÷ 个数；round 可以保留小数位。',
    syntax: 'average = sum(prices) / len(prices)\nprint(round(average, 1))',
    steps: [
      '用 sum(prices) / len(prices) 求平均。',
      '把结果交给 round(平均值, 1) 保留一位小数。',
      '运行，输出应为 12.5。'
    ],
    demo: 'avg',
    tutor: [
      '先算 sum(prices) / len(prices)，再用 round(..., 1) 包起来。',
      'round 的第二个参数是保留几位小数，本题是 1。',
      '参考：average = sum(prices) / len(prices) 换行 print(round(average, 1))。'
    ]
  },
  'data-loop': {
    level: 5,
    concept: '循环 · 条件 · 计数器',
    focus: '循环逐个看，条件负责筛选，计数器负责记住数量。',
    syntax: 'for n in numbers:\n    if n % 2 == 0:\n        count = count + 1\nprint(count)',
    steps: [
      '理解偶数条件：n % 2 == 0。',
      '在循环里用 if 判断，每遇到偶数就让 count 加 1。',
      '循环结束后打印 count，答案应为 2。'
    ],
    demo: 'count',
    tutor: [
      '需要两层缩进：for 里面写 if，if 里面写计数。',
      '偶数条件是 n % 2 == 0，计数写成 count = count + 1。',
      '参考：for n in numbers: 换行缩进 if n % 2 == 0: 再换行缩进 count = count + 1，最后在循环外 print(count)。'
    ]
  }
};

const FALLBACK = {
  level: 2,
  concept: '练习',
  focus: '先读懂左侧的理论和示例，再动手写。',
  syntax: '',
  steps: ['读一遍概念与示例。', '把示例改写成题目要求。', '运行并对照期望结果。'],
  demo: 'default',
  tutor: [
    '先把代码缩小到最小的一步，运行看看输出。',
    '逐行对照期望输出，找第一个不一样的地方。',
    '把题目里的示例代码照抄一遍，再一点点改成自己的答案。'
  ]
};

export function getLessonMeta(lessonId) {
  return LESSON_META[lessonId] || FALLBACK;
}

export function getCourseStory(courseId) {
  return COURSE_STORIES[courseId] || null;
}
