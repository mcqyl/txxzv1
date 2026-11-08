# 苔溪小镇 · 代码奇旅（Mossbrook Code Town）

一个跑在浏览器里的**像素风编程学习小镇**。玩家创建自己的角色，在小镇里散步、上课、打代码、去写字楼"上班"、布置自己的小屋，还能和同一个小镇服务上的其他旅行者联机聊天、互相串门。

项目为纯前端渲染（Canvas + 原生 ES Module），后端只有一个零依赖的 Node.js 服务：负责静态文件、AI 助手/办公 AI 的代理调用，以及基于 SSE 的联机同步。

- 版本：1.1.0
- 运行环境：Node.js 18+（推荐 20 / 22），现代浏览器（Chrome / Edge / Safari / Firefox 最新版）
- 依赖：**无**。不需要 `npm install`，没有构建步骤

---

## 功能特性

| 模块 | 说明 |
| --- | --- |
| 像素小镇 | Canvas 手绘小镇，含城市马路、写字楼、公园、河流、北岭观星台，支持昼夜循环 |
| 编程课程 | 分 Python / Web / 数据三条线，关卡内先播剧情动画，再进入"左侧教学 + 右侧操作"的分栏练习 |
| 内置代码引擎 | `src/engine/pylite.js` 在浏览器里解释执行 Python 子集；`src/engine/minisql.js` 提供迷你 SQL 查询练习 |
| 写字楼玩法 | 走进大楼 → 接受 AI 老板面试 → 成为实习生 → 在工位接 AI 生成的编程任务 → 攒绩效晋升 |
| AI 助手「芋丸」 | 右上角像素精灵，主动给提示、答疑，可语音朗读（LLM + TTS） |
| 办公室小剧情 | 同事 NPC 之间会自动冒出 AI 生成的小对话，会议室、打印机、饮水机都有互动 |
| 小屋与家具 | 课程首通和每日任务产出家具，按 `F` 在自己的小屋里布置、换墙纸、开关灯 |
| 每日任务 / 签到 | 任务板与 `G` 面板，签到可得铜币、经验和一张跳关卡 |
| 联机 | 大厅可见其他旅行者，`T` 聊天、`O` 在线列表；小屋主人可邀请朋友来串门，支持传送、踢人、封禁 |
| 本地存档 | 账号与进度存在浏览器 IndexedDB（`mossbrook_town`），不可用时自动降级到 localStorage |

### 操作

`WASD` 移动 · `Shift` 奔跑 · `E` 交互 · `F` 屋内布置 · `Tab` 功能全览 · `C` 课程 · `G` 任务 · `T` 聊天 · `O` 在线朋友 · `M` 地图 · `H` 回家

---

## 目录结构

```
.
├── index.html              # 单页入口：登录/注册、HUD、各面板挂载点
├── package.json            # 仅定义 start/dev 脚本，无第三方依赖
├── Dockerfile              # 容器化部署
├── scripts/
│   ├── serve.mjs           # 唯一的后端：静态服务 + AI 代理 + 联机 API（SSE）
│   ├── ai-config.example.json  # AI 配置模板（复制为 ai-config.json 后填写）
│   ├── ai-config.json      # 真实密钥，已被 .gitignore 忽略，不要提交
│   ├── mp-admins.json      # 管理员名单与 getop 口令（运行时生成，已忽略）
│   └── mp-bans.json        # 封禁名单（运行时生成，已忽略）
├── src/
│   ├── main.js             # 前端入口，装配各子系统
│   ├── core/               # auth 账号、db 存储、net 联机适配、save 存档、audio 音效
│   ├── data/               # 课程、任务、家具、办公室、成长数值等静态数据
│   ├── engine/             # pylite（Python 子集解释器）、minisql（迷你 SQL）
│   ├── game/               # 场景绘制：城镇、室内、办公室、精灵、昼夜、像素工具
│   └── ui/                 # HUD、课程、面板、助手、社交、办公系统等界面
└── styles/                 # main / assistant / lesson / office 四套样式
```

---

## 快速开始

```bash
# 1. 进入项目目录
cd 261108v1

# 2. 直接启动（无需 npm install，本项目没有第三方依赖）
npm start
# 等价于：node scripts/serve.mjs

# 3. 浏览器打开
# http://localhost:5173
```

首次进入先注册一个角色（角色名 + 密码，密码至少 6 位），账号与进度都保存在本机浏览器里。

> 不配置 AI 密钥也能玩：课程、关卡、家具、任务、联机全部可用，只是「芋丸」对话、AI 面试、AI 出题会退回到内置的本地题库与提示文案。

---

## 配置 AI（可选）

服务端从两个地方读密钥，**环境变量优先**：

| 用途 | 环境变量 | 说明 |
| --- | --- | --- |
| 文本对话（芋丸 / 办公室） | `SUB2API_API_KEY` | OpenAI 兼容接口的 API Key |
| 办公 AI 出题、面试 | `OFFICE_API_KEY` | 不填则复用 `SUB2API_API_KEY` 所在配置 |
| 语音合成（TTS） | `MIMO_API_KEY` | 返回 base64 wav 的 TTS 接口 |

### 方式一：环境变量（推荐，适合服务器）

```bash
export SUB2API_API_KEY="sk-xxxxxxxx"
export OFFICE_API_KEY="sk-xxxxxxxx"
export MIMO_API_KEY="sk-xxxxxxxx"
export PORT=5173
node scripts/serve.mjs
```

### 方式二：配置文件（适合本地开发）

```bash
cp scripts/ai-config.example.json scripts/ai-config.json
# 然后编辑 scripts/ai-config.json，填入 baseUrl / apiKey / model
```

配置文件结构：

```json
{
  "text":   { "baseUrl": "https://your-llm-endpoint/v1", "apiKey": "", "model": "your-model" },
  "tts":    { "baseUrl": "https://your-tts-endpoint/v1", "apiKey": "", "model": "your-tts-model", "voice": "your-voice" },
  "office": { "baseUrl": "https://your-llm-endpoint/v1", "apiKey": "", "model": "your-model" }
}
```

接口要求：OpenAI 兼容的 `POST {baseUrl}/chat/completions`；TTS 需要返回 `choices[0].message.audio.data`（base64）。

> ⚠️ `scripts/ai-config.json` 已在 `.gitignore` 中，**请勿提交**。仓库里只保留 `ai-config.example.json` 模板。

---

## 部署

### 通用要求

- 一个常驻的 Node.js 进程（**不能只用静态托管**：AI 代理和联机 API 都靠这个进程，且联机是长连接 SSE）
- 反向代理需要放行 SSE：关闭缓冲、延长读超时
- 单实例部署。联机房间数据保存在进程内存中，多实例需要额外的共享状态与粘性会话

### 1. 直接运行

```bash
PORT=8080 node scripts/serve.mjs
```

### 2. PM2 守护

```bash
npm i -g pm2
PORT=8080 SUB2API_API_KEY=sk-xxx MIMO_API_KEY=sk-xxx pm2 start scripts/serve.mjs --name mossbrook
pm2 save && pm2 startup
```

### 3. systemd

`/etc/systemd/system/mossbrook.service`：

```ini
[Unit]
Description=Mossbrook Code Town
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/mossbrook
Environment=PORT=8080
Environment=SUB2API_API_KEY=sk-xxx
Environment=MIMO_API_KEY=sk-xxx
Environment=MOSS_GETOP_PASSWORD=change-me
ExecStart=/usr/bin/node scripts/serve.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now mossbrook
```

### 4. Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 联机使用 SSE，必须关闭缓冲并延长超时
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        proxy_set_header Connection "";
    }
}
```

### 5. Docker

```bash
docker build -t mossbrook .
docker run -d --name mossbrook -p 8080:8080 \
  -e SUB2API_API_KEY=sk-xxx \
  -e MIMO_API_KEY=sk-xxx \
  -e MOSS_GETOP_PASSWORD=change-me \
  mossbrook
```

> 联机房间、封禁名单等运行时状态写在容器内的 `scripts/` 下，需要持久化时挂载目录：
> `-v $(pwd)/data:/app/scripts`（请先准备 `mp-admins.json` / `mp-bans.json`）。

### 环境变量一览

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `5173` | 监听端口 |
| `SUB2API_API_KEY` | 空 | 文本模型密钥 |
| `OFFICE_API_KEY` | 空 | 办公 AI 密钥 |
| `MIMO_API_KEY` | 空 | TTS 密钥 |
| `MOSS_GETOP_PASSWORD` | `123456` | 联机管理员口令，**上线前务必修改** |

---

## 后端接口

| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/assistant` | POST | 芋丸对话与主动提示（`mode=chat\|tip`） |
| `/api/assistant/tts` | POST | 文本转语音，返回 base64 wav |
| `/api/office/interview` | POST | AI 面试开场与评分 |
| `/api/office/task` | POST | AI 生成编程题目（Python / Web） |
| `/api/office/npc` | POST | 办公室 NPC 小剧情 |
| `/api/auth/status` | POST | 查询角色是否被封禁 |
| `/api/multiplayer/hello` | POST | 进入小镇，领取会话 token |
| `/api/multiplayer/events?token=` | GET | SSE 长连接，推送玩家快照与事件 |
| `/api/multiplayer/state` `/chat` `/invite` `/room` `/tp` … | POST | 位置同步、聊天、邀请串门、传送、管理与封禁 |

`/scripts/` 目录与任何以 `.` 开头的路径都不可通过静态服务访问，密钥文件不会被下载。

---

## 数据与存储

- **账号与进度**：浏览器 IndexedDB（库名 `mossbrook_town`），不可用时降级 localStorage。换浏览器 / 清缓存会丢档，属于预期行为。
- **联机状态**：服务端内存（`Map`），重启即清空；玩家 30 秒无心跳自动下线，最多同时 24 人。
- **管理员名单 / 封禁名单**：`scripts/mp-admins.json`、`scripts/mp-bans.json`，运行时会自动写入。

## 安全提示

1. 不要把 `scripts/ai-config.json` 提交到公开仓库；生产环境优先用环境变量注入密钥。
2. `MOSS_GETOP_PASSWORD` 默认值是 `123456`，上线前必须改掉，否则任何人都能拿到管理员权限。
3. 联机接口只做了基础的频率限制与长度校验，公网大规模使用建议在前面加一层网关与 HTTPS。
4. 本项目面向学习演示，账号体系是本地存储，不适合存放真实敏感信息。

## 常见问题

**Q：页面打开一片空白 / 模块加载失败？**
A：必须通过 `http://` 访问（`file://` 打开会被 ES Module 的跨域策略拦截），并且请用 `node scripts/serve.mjs` 启动，不要只双击 `index.html`。

**Q：联机看不到别人？**
A：确认访问的是同一个服务地址（同一域名/端口），并检查反向代理是否关闭了 SSE 缓冲；浏览器控制台里 `/api/multiplayer/events` 应是 `200` 长连接。

**Q：AI 一直不回话？**
A：看服务端日志是否有 `401 / 404 / 429`。`401` 多为密钥无效，`404` 多为模型名不对，`429` 是上游限流（服务端会自动重试 3 次后回落本地题库）。

**Q：需要数据库吗？**
A：不需要。单机进度在浏览器里，联机状态在内存里，没有外部依赖。

## 许可

仅用于学习与交流。项目内的像素美术、课程文本与剧情均由本项目自行绘制 / 编写。
