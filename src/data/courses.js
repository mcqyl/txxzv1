import { DATA_COURSE_LEVEL, GATE_LEVEL } from './progression.js';

export const SQL_TABLES = {
  students: {
    label: 'students · 学生花名册',
    columns: ['id', 'name', 'city', 'score'],
    rows: [
      [1, '小禾', '苔溪', 92],
      [2, '阿杉', '苔溪', 85],
      [3, '小满', '星港', 78],
      [4, '阿澄', '星港', 96],
      [5, '灯灯', '苔溪', 61]
    ]
  }
};

const PYTHON_INTRO = `
  <p>蟒蛇学堂藏在镇子西边的老榕树下。老师是一条名叫<strong>阿蟒</strong>的绿蟒，它说话很慢，却从不催你。</p>
  <p>在 Python 里，你写下的每一行字，都会变成可以让小镇运转起来的小小指令。先从一句问候开始吧。</p>
`;

const WEB_INTRO = `
  <p>起源工坊是一栋由三块彩色屋顶拼起来的小楼。木匠说，网页也是这样搭起来的：结构、样式、行为，各占一角。</p>
  <p>这里的练习会直接渲染成一个小网页。写得越认真，窗口里的世界就越完整。</p>
`;

const SQL_INTRO = `
  <p>水晶档案馆里没有纸质档案，只有一排排安静发光的石柱。每根石柱里都存着小镇的一小段记忆。</p>
  <p>SQL 是向这些石柱提问的方式。你不需要翻遍每一页，只要问对问题。</p>
`;

const DATA_INTRO = `
  <p>北岭的观星台能看见整片夜空。守塔人把星星的坐标抄进列表，再用数字去理解风、潮汐和小镇的花期。</p>
  <p>这门课不会教你复杂的公式，只会让你习惯一件事：把数据放进列表，然后向它提出好问题。</p>
`;

export const COURSES = [
  {
    id: 'python',
    type: 'python',
    name: '蟒蛇传奇',
    en: 'PYTHON TRAILS',
    tagline: 'BEGINNER · PYTHON',
    color: '#8fe3b0',
    building: 'python-hall',
    short: '从一句 print 开始，学会让小镇听见你的想法。',
    desc: '使用世界上最流行、也最适合初学者的 Python，学习变量、控制流、循环与列表。',
    intro: PYTHON_INTRO,
    teacher: '守林人 阿蟒',
    lessons: [
      {
        id: 'py-hello',
        title: '你好，世界！',
        minutes: 5,
        xp: 30,
        coins: 40,
        rewardItem: 'chair-oak',
        intro: `
          <p>所有旅程的第一站，都是同一句话。阿蟒把尾巴盘成圈，示意你坐到它旁边。</p>
          <p>在 Python 中，<span class="inline-code">print()</span> 会把括号里的内容显示到终端里。字符串需要放进引号中。</p>
        `,
        hint: '在编辑器里写下：<span class="inline-code">print("你好，世界！")</span>，注意是英文括号与引号。',
        starter: '# 让小镇听见你的第一声问候\n# 提示：print("这里写想说的话")\n',
        solution: 'print("你好，世界！")',
        expected: '你好，世界！'
      },
      {
        id: 'py-vars',
        title: '把名字装进变量',
        minutes: 7,
        xp: 35,
        coins: 45,
        rewardItem: 'lamp-floor',
        intro: `
          <p>变量像一个贴了标签的木盒，可以把名字、数字、句子放进去。之后用标签就能取出来。</p>
          <p>在字符串前加一个 <span class="inline-code">f</span>，就可以用花括号把变量嵌进句子里，这叫 f-string。</p>
        `,
        hint: '试试：<span class="inline-code">print(f"{name}带着 {coins} 枚金币回到了小镇。")</span>',
        starter: '# 变量已经准备好了，试着用 f-string 打印一句完整的话\nname = "小苔"\ncoins = 12\n',
        solution: 'name = "小苔"\ncoins = 12\nprint(f"{name}带着 {coins} 枚金币回到了小镇。")',
        expected: '小苔带着 12 枚金币回到了小镇。'
      },
      {
        id: 'py-math',
        title: '分苹果的算术',
        minutes: 8,
        xp: 40,
        coins: 50,
        rewardItem: 'shelf-pine',
        intro: `
          <p>小镇的果篮里有 7 个苹果，要平均分给 3 位旅人。Python 可以用两个符号回答这个问题：</p>
          <ul>
            <li><span class="inline-code">//</span> 整除，得到每人分到几个；</li>
            <li><span class="inline-code">%</span> 取余，得到分完后剩下几个。</li>
          </ul>
        `,
        hint: '用两个 f-string 分别打印两行结果，例如 <span class="inline-code">f"每人 {apples // friends} 个苹果"</span>。',
        starter: 'apples = 7\nfriends = 3\n\n# 打印第一行：每人几个\n\n# 打印第二行：剩下几个\n',
        solution: 'apples = 7\nfriends = 3\nprint(f"每人 {apples // friends} 个苹果")\nprint(f"剩下 {apples % friends} 个苹果")',
        expected: '每人 2 个苹果\n剩下 1 个苹果'
      },
      {
        id: 'py-if',
        title: '岔路口的判断',
        minutes: 8,
        xp: 45,
        coins: 55,
        rewardItem: 'cat-bed',
        intro: `
          <p>小镇的训练场里，分数达到 60 分就算通过。程序也需要在岔路口做选择：</p>
          <p><span class="inline-code">if</span> 后面跟条件，条件成立时执行缩进的语句；否则执行 <span class="inline-code">else</span> 里的语句。</p>
        `,
        hint: '缩进是 Python 语法的一部分。冒号后的下一行要记得缩进 4 个空格。',
        starter: 'score = 82\n\n# 如果 score >= 60，打印「通过」\n# 否则打印「再试一次」\n',
        solution: 'score = 82\nif score >= 60:\n    print("通过")\nelse:\n    print("再试一次")',
        expected: '通过'
      },
      {
        id: 'py-loop',
        title: '用循环种一排星星',
        minutes: 9,
        xp: 50,
        coins: 60,
        rewardItem: 'aquarium',
        intro: `
          <p>阿蟒在泥地上画了三颗小星星。与其写三次 print，不如让 Python 自己数数。</p>
          <p><span class="inline-code">for i in range(1, 4)</span> 会让 i 依次变成 1、2、3。字符串乘数字可以重复它自己。</p>
        `,
        hint: '<span class="inline-code">print("*" * i)</span> 会打印 i 个星号。',
        starter: '# 用 for 循环打印 1 到 3 个星号\n# 第一行 1 个，最后一行 3 个\n',
        solution: 'for i in range(1, 4):\n    print("*" * i)',
        expected: '*\n**\n***'
      },
      {
        id: 'py-list',
        title: '行囊里的清单',
        minutes: 8,
        xp: 60,
        coins: 80,
        rewardItem: 'desk-code',
        intro: `
          <p>列表可以把很多东西按顺序装在一起。用方括号创建列表，<span class="inline-code">len()</span> 可以数出里面有几样东西。</p>
          <p><span class="inline-code">sum()</span> 则会把一组数字加起来。以后我们会常常用到这两个小工具。</p>
        `,
        hint: '先打印 <span class="inline-code">len(tools)</span>，再打印 <span class="inline-code">sum([3, 5, 7])</span>。',
        starter: 'tools = ["锄头", "水壶", "火把"]\n\n# 打印行囊里有几件工具\n\n# 打印 3、5、7 的和\n',
        solution: 'tools = ["锄头", "水壶", "火把"]\nprint(len(tools))\nprint(sum([3, 5, 7]))',
        expected: '3\n15'
      }
    ]
  },
  {
    id: 'web',
    type: 'web',
    name: '起源三部曲',
    en: 'ORIGIN TRILOGY',
    tagline: 'BEGINNER · WEB',
    color: '#8ecae6',
    building: 'web-hall',
    short: '用结构、样式与行为，亲手搭一间网页小屋。',
    desc: '想创建自己的网站吗？从 HTML、CSS 到一点点 JavaScript，了解构成网络的三种核心技术。',
    intro: WEB_INTRO,
    teacher: '木匠 桃木',
    lessons: [
      {
        id: 'web-html',
        title: '第一块门牌',
        minutes: 6,
        xp: 30,
        coins: 40,
        rewardItem: 'rug-woven',
        intro: `
          <p>HTML 用一对对标签描述内容。<span class="inline-code">&lt;h1&gt;</span> 是最大的标题，<span class="inline-code">&lt;p&gt;</span> 是一段文字。标签大多要成对出现。</p>
          <p>这一课的目标：做一块写着「欢迎来到我的小镇」的门牌，再加一句介绍。</p>
        `,
        hint: '在 &lt;h1&gt; 和 &lt;/h1&gt; 之间写标题文字；在 &lt;p&gt; 和 &lt;/p&gt; 之间写一句包含「小屋」的话。',
        starter: '<h1>这里写标题</h1>\n<p>这里写一句介绍</p>\n',
        solution: '<h1>欢迎来到我的小镇</h1>\n<p>这是我在苔溪的第一间小屋。</p>',
        checks: [
          { selector: 'h1', textIncludes: '欢迎来到我的小镇', label: '有一个 h1 标题，文字为「欢迎来到我的小镇」' },
          { selector: 'p', textIncludes: '小屋', label: '有一段包含「小屋」的介绍文字' }
        ],
        goalList: ['包含一个 h1 标题：「欢迎来到我的小镇」', '包含一段文字，文字里有「小屋」']
      },
      {
        id: 'web-css',
        title: '给小屋刷上颜色',
        minutes: 8,
        xp: 40,
        coins: 50,
        rewardItem: 'plant-sprout',
        intro: `
          <p>CSS 决定网页长什么样。把样式写进 <span class="inline-code">&lt;style&gt;</span> 标签，再用选择器找到元素。</p>
          <p>本课目标：页面背景变成暖奶油色，标题变成苔绿色。颜色可以用十六进制表示。</p>
        `,
        hint: '写一个 <span class="inline-code">body { background: #f4e8ce; }</span>，再写 <span class="inline-code">h1 { color: #2f6d56; }</span>。',
        starter: '<style>\n  /* 在这里写样式 */\n</style>\n\n<h1>苔溪 · 我的小屋</h1>\n<p>傍晚的风吹过屋檐。</p>\n',
        solution: '<style>\n  body { background: #f4e8ce; }\n  h1 { color: #2f6d56; }\n</style>\n\n<h1>苔溪 · 我的小屋</h1>\n<p>傍晚的风吹过屋檐。</p>\n',
        checks: [
          { selector: 'h1', textIncludes: '苔溪', label: '页面里保留了 h1 标题' }
        ],
        cssChecks: [
          { pattern: 'body\\s*\\{[^}]*background\\s*:', label: '为 body 设置了 background 背景' },
          { pattern: 'h1\\s*\\{[^}]*color\\s*:', label: '为 h1 设置了 color 文字颜色' }
        ],
        goalList: ['为 body 设置背景色', '为 h1 设置文字颜色', '页面里保留标题文字']
      },
      {
        id: 'web-list',
        title: '一张待办清单',
        minutes: 7,
        xp: 45,
        coins: 55,
        rewardItem: 'rug-star',
        intro: `
          <p>列表很适合记录小镇生活。&lt;ul&gt; 是无序列表，里面每个 &lt;li&gt; 都是一项。</p>
          <p>这一课请列下三件到小镇后想做的事。至少有一件要和「散步」有关。</p>
        `,
        hint: '在 &lt;ul&gt; 内放三个 &lt;li&gt;。文字可以自由发挥。',
        starter: '<h2>我的小镇清单</h2>\n<ul>\n  <li>第一件事</li>\n</ul>\n',
        solution: '<h2>我的小镇清单</h2>\n<ul>\n  <li>去湖边散步</li>\n  <li>学会写 Python</li>\n  <li>把家装满家具</li>\n</ul>\n',
        checks: [
          { selector: 'ul', minCount: 1, label: '有一个 ul 列表' },
          { selector: 'ul li', minCount: 3, label: '列表里至少有 3 个 li 项目' },
          { selector: 'body', textIncludes: '散步', label: '清单里提到了「散步」' }
        ],
        goalList: ['有一个 ul 列表', '列表内至少有 3 个 li', '文字里提到「散步」']
      },
      {
        id: 'web-button',
        title: '让门灯亮起来',
        minutes: 10,
        xp: 55,
        coins: 70,
        rewardItem: 'guitar',
        intro: `
          <p>JavaScript 让网页动起来。给按钮加一个 id，再用 <span class="inline-code">addEventListener</span> 监听点击。</p>
          <p>本课目标：点击「点亮门灯」后，把门灯的状态文字变成「门灯亮了！」。</p>
        `,
        hint: '获取按钮与文字元素，监听 click，然后修改 <span class="inline-code">textContent</span>。预览里可以实际点一下。',
        starter: `<h2>小屋门灯</h2>
<p id="lamp">门灯还暗着。</p>
<button id="greet">点亮门灯</button>

<script>
  // 在这里写 JavaScript
</script>
`,
        solution: `<h2>小屋门灯</h2>
<p id="lamp">门灯还暗着。</p>
<button id="greet">点亮门灯</button>

<script>
  const button = document.getElementById('greet');
  button.addEventListener('click', () => {
    document.getElementById('lamp').textContent = '门灯亮了！';
  });
</script>
`,
        checks: [
          { selector: '#greet', textIncludes: '点亮门灯', label: '有一个文字为「点亮门灯」的按钮' },
          { selector: '#lamp', textIncludes: '门灯', label: '有一个 id 为 lamp 的门灯状态文字' }
        ],
        scriptChecks: [
          { pattern: "addEventListener\\s*\\(\\s*['\"]click", label: '用 addEventListener 监听了 click 事件' },
          { pattern: '门灯亮了', label: '点击逻辑里把文字改成了「门灯亮了！」' }
        ],
        goalList: ['按钮 #greet 的文字为「点亮门灯」', '存在 #lamp 状态文字', '用 addEventListener 监听 click', '点击后把状态改为「门灯亮了！」']
      }
    ]
  },
  {
    id: 'sql',
    type: 'sql',
    name: 'SQL 秘境',
    en: 'THE QUARTZ ARCHIVE',
    tagline: 'BEGINNER · DATABASE',
    color: '#c9a7ff',
    building: 'sql-hall',
    short: '向水晶档案提问，从一屋子的记录里捞出答案。',
    desc: '学习数据库基础知识、查询与计算，开始像专业人士一样管理和分析数据。',
    intro: SQL_INTRO,
    teacher: '档案员 灯芯',
    lessons: [
      {
        id: 'sql-select',
        title: '第一次提问',
        minutes: 6,
        xp: 40,
        coins: 50,
        rewardItem: 'lamp-crystal',
        intro: `
          <p>水晶档案里只有一张 <span class="inline-code">students</span> 表，记录着来小镇学习的旅人。表有四列：id、name、city、score。</p>
          <p>用 <span class="inline-code">SELECT 列名 FROM 表名</span> 取回想要的数据。这一课，请取出每人的姓名和分数。</p>
        `,
        hint: '列和列之间用逗号隔开：<span class="inline-code">SELECT name, score FROM students;</span>',
        starter: '-- 从 students 表里选出 name 和 score\nSELECT ',
        solution: 'SELECT name, score FROM students;',
        expect: {
          columns: ['name', 'score'],
          rows: [['小禾', 92], ['阿杉', 85], ['小满', 78], ['阿澄', 96], ['灯灯', 61]]
        }
      },
      {
        id: 'sql-where',
        title: '找到星港来的旅人',
        minutes: 7,
        xp: 45,
        coins: 55,
        rewardItem: 'cabinet-clay',
        intro: `
          <p>不想看全部记录时，可以用 <span class="inline-code">WHERE</span> 加一个条件。文本要放在单引号里。</p>
          <p>请查出所有来自「星港」的学生，显示姓名和分数。</p>
        `,
        hint: '<span class="inline-code">WHERE city = \'星港\'</span>',
        starter: '-- 显示星港学生的 name 和 score\nSELECT name, score FROM students\nWHERE ',
        solution: "SELECT name, score FROM students WHERE city = '星港';",
        expect: {
          columns: ['name', 'score'],
          rows: [['小满', 78], ['阿澄', 96]]
        }
      },
      {
        id: 'sql-order',
        title: '分数最高的三位',
        minutes: 8,
        xp: 50,
        coins: 60,
        rewardItem: 'stool-mushroom',
        intro: `
          <p>排行榜需要排序和截断：</p>
          <ul>
            <li><span class="inline-code">ORDER BY score DESC</span> 按分数从高到低排序；</li>
            <li><span class="inline-code">LIMIT 3</span> 只保留前三行。</li>
          </ul>
        `,
        hint: '把 ORDER BY 写在 WHERE（如果有）之后，LIMIT 写在最后。',
        starter: '-- 取出分数最高的 3 位学生的 name 和 score\nSELECT name, score FROM students\n',
        solution: 'SELECT name, score FROM students ORDER BY score DESC LIMIT 3;',
        expect: {
          columns: ['name', 'score'],
          rows: [['阿澄', 96], ['小禾', 92], ['阿杉', 85]]
        }
      },
      {
        id: 'sql-avg',
        title: '一串数字的平均值',
        minutes: 9,
        xp: 60,
        coins: 80,
        rewardItem: 'wardrobe',
        intro: `
          <p>SQL 也能做计算。<span class="inline-code">AVG(score)</span> 求平均分，<span class="inline-code">MAX</span>、<span class="inline-code">MIN</span>、<span class="inline-code">COUNT</span> 也很有用。</p>
          <p>用 <span class="inline-code">AS</span> 给计算结果起个名字。本课请算出全体学生的平均分，并命名为 average。</p>
        `,
        hint: '<span class="inline-code">SELECT AVG(score) AS average FROM students;</span>',
        starter: '-- 计算全体学生的平均分，列名命名为 average\nSELECT ',
        solution: 'SELECT AVG(score) AS average FROM students;',
        expect: {
          columns: ['average'],
          rows: [[82.4]]
        }
      }
    ]
  },
  {
    id: 'data',
    type: 'python',
    name: '数字花园',
    en: 'THE NUMBER GARDEN',
    tagline: 'ADVANCED · NUMBERS',
    color: '#ffd166',
    building: 'data-hall',
    requiresLevel: DATA_COURSE_LEVEL,
    lockText: `看星台还在等一场好天气。达到 Lv.${DATA_COURSE_LEVEL} 后开放。`,
    short: '用列表和统计函数，照看小镇的数字花园。',
    desc: '把一串串数字放进列表，用 max、sum、循环与判断，让数据自己讲出小镇的故事。',
    intro: DATA_INTRO,
    teacher: '守塔人 岚',
    lessons: [
      {
        id: 'data-max',
        title: '花圃里的两个极端',
        minutes: 8,
        xp: 50,
        coins: 60,
        rewardItem: 'candle',
        intro: `
          <p>观星台记录了四株夜光花的开放时间：12、5、8、20 秒。列表里的数字可以用 max 和 min 找出最大与最小。</p>
          <p>请分别打印这组数字中的最大值和最小值。</p>
        `,
        hint: '<span class="inline-code">print(max(numbers))</span>',
        starter: 'numbers = [12, 5, 8, 20]\n\n# 打印最大值\n\n# 打印最小值\n',
        solution: 'numbers = [12, 5, 8, 20]\nprint(max(numbers))\nprint(min(numbers))',
        expected: '20\n5'
      },
      {
        id: 'data-avg',
        title: '一周的果酱价格',
        minutes: 9,
        xp: 60,
        coins: 70,
        rewardItem: 'plant-tall',
        intro: `
          <p>集市这周的果酱价格是 9、12、15、14 枚铜币。平均值 = 总和 ÷ 个数。</p>
          <p>请算出平均值，并使用 <span class="inline-code">round(数字, 1)</span> 保留一位小数后打印。</p>
        `,
        hint: '先用 sum(prices) / len(prices) 求平均，再交给 round 处理。',
        starter: 'prices = [9, 12, 15, 14]\n\n# 求平均值并保留一位小数\n',
        solution: 'prices = [9, 12, 15, 14]\naverage = sum(prices) / len(prices)\nprint(round(average, 1))',
        expected: '12.5'
      },
      {
        id: 'data-loop',
        title: '数一数夜灯',
        minutes: 11,
        xp: 70,
        coins: 90,
        rewardItem: 'table-oak',
        intro: `
          <p>观星台挂着一串夜灯，编号是 4、7、10、13、22。守塔人只想知道：其中有多少盏编号是偶数？</p>
          <p>提示：用循环逐个检查，用 <span class="inline-code">n % 2 == 0</span> 判断偶数，再用一个计数器累加。</p>
        `,
        hint: '计数器 count 初始为 0；每遇到一个偶数，就执行 count = count + 1。',
        starter: 'numbers = [4, 7, 10, 13, 22]\ncount = 0\n\n# 用 for 循环和 if 判断数一数偶数\n',
        solution: 'numbers = [4, 7, 10, 13, 22]\ncount = 0\nfor n in numbers:\n    if n % 2 == 0:\n        count = count + 1\nprint(count)',
        expected: '2'
      }
    ]
  }
];

export const COURSE_MAP = Object.fromEntries(COURSES.map((c) => [c.id, c]));

export const FUTURE_COURSES = [
  {
    id: 'c',
    name: '指针磨坊',
    tagline: 'COMING SOON · C',
    desc: '磨坊的水轮一格一格转，指针沿着石槽搬家。等磨坊主回来，就教你直接和内存说话。',
    color: '#c9a7ff'
  },
  {
    id: 'java',
    name: '咖啡庄园',
    tagline: 'COMING SOON · JAVA',
    desc: '南坡的咖啡树刚开花。庄园主说，先把类与对象磨成一杯顺口的咖啡，再开门迎客。',
    color: '#f2a65a'
  },
  {
    id: 'lua',
    name: '卢亚的帐篷',
    tagline: 'COMING SOON · LUA',
    desc: '在 ROBLOX 工作室里搭一座自己的小岛。篝火已经点好，只等老师醒来。',
    color: '#ff8a7a'
  },
  {
    id: 'ml',
    name: '机器学习温室',
    tagline: 'COMING SOON · AI',
    desc: '让一盏小灯学会辨认天气。温室的门锁着，玻璃上贴着一张「未来再来看」的便签。',
    color: '#8ecae6'
  }
];

export const TOWN_UNLOCKS = {
  gateLevel: GATE_LEVEL,
  dataLevel: DATA_COURSE_LEVEL,
  gateLabel: '北岭 · 观星台方向'
};

export function getCourse(id) {
  return COURSE_MAP[id] || null;
}

export function getLesson(course, lessonId) {
  return course?.lessons.find((l) => l.id === lessonId) || null;
}

export function lessonFilename(course) {
  if (course.type === 'python') return 'script.py';
  if (course.type === 'sql') return 'query.sql';
  return 'index.html';
}

export function lessonLanguage(course) {
  if (course.type === 'python') return 'PYTHON';
  if (course.type === 'sql') return 'SQL · 查询';
  return 'HTML / CSS / JS';
}
