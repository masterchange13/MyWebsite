# Raspberrypi Console

运行在树莓派上的个人聚合空间 — Vue 3 + Django 全栈项目。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 3 · Vue Router · Pinia · Element Plus · Vite |
| 后端 | Django 5 · Channels (WebSocket) · MySQL · Redis |
| 部署 | Nginx · Docker · daphne (ASGI) |
| PWA | Manifest · Service Worker · iOS 支持 |

## 项目结构

```
MyWebsite/              前端 (Vue 3)
├── src/
│   ├── Components/     页面组件
│   ├── api/            API 模块
│   ├── stores/         Pinia 状态管理
│   ├── utils/          工具函数
│   ├── websocket/      WebSocket 管理
│   └── route/          路由配置
└── public/             静态资源 (PWA 图标/manifest/sw.js)

MyWebsiteBackend/       后端 (Django)
├── users/              用户/导航/应用启动器
├── chat/               聊天 (WebSocket + Redis 在线状态)
├── decisionHelper/     决策助手历史
├── emailer/            邮件发送 (SMTP + 附件)
├── document/           文档
├── music/              音乐
├── to_do_list/         待办
├── agent/              智能助手
├── qi_men_dun_jia/     奇门遁甲
└── config/             站点设置/反馈
```

## 开发环境

```sh
# 前端 (5173 端口)
npm install
npm run dev

# 后端 (8084 端口，需 Redis 运行在 6379)
cd MyWebsiteBackend
daphne -b 0.0.0.0 -p 8084 MyWebsiteBackend.asgi:application
```

WebSocket 需要 daphne (ASGI) 启动，普通 runserver 不支持。

## 生产部署

```sh
# 前端构建
npm run build   # 产物在 dist/，上传到服务器

# 后端（服务器上）
cd MyWebsiteBackend
daphne -b 0.0.0.0 -p 8083 MyWebsiteBackend.asgi:application

# Nginx 配置参考项目根目录 nginx.conf
```

## 功能清单

- 🎬 Media Hub — 视频 / 音乐 / 文档 / 文件传输 / 待办清单
- 🧭 Navigator — 常用网站快捷入口
- 🚀 App Launcher — 桌面软件启动器（协议链接 + 命令行）
- 💬 Chat — WebSocket 实时聊天（在线状态/未读/通知）
- 🤖 Agent — AI 智能助手
- 📧 Email — SMTP 邮件发送（附件/拖拽/Ctrl+V 粘贴）
- 🎲 Decision Helper — 抛硬币/掷骰子/随机数/多选一
- ⏱️ Timer — 倒计时/秒表（全局运行）
- 🧮 Calculator — 表达式计算器
- 🔮 QiMenDunJia — 奇门遁甲排盘
- 📊 Site Settings — 主题/密度/字号定制
- 📱 PWA — 添加到主屏幕，离线可用（iOS/Android）

## 未来计划 (Roadmap)

### 1. 系统监控面板 🖥️
树莓派状态监控：CPU 温度、内存、磁盘、网络、运行时间。
后端 `psutil` 采集，前端仪表盘 + WebSocket 实时推送。

### 2. 首页 Dashboard 概览 📊
登录后的总览页：在线用户数、待办数量、系统状态卡片、
最近聊天、快捷入口聚合。

### 3. 日历/日程 📅
带时间维度的日程管理，复用现有 Timer 提醒机制。

### 4. 相册 📷
图片网格浏览 + 时间线，配合 Transfer 上传使用。

### 5. Web 终端 💻
xterm.js + WebSocket SSH，网页直连树莓派终端（注意权限控制）。

### 6. 番茄钟 🍅
Timer 加专注模式：25 分钟工作 + 5 分钟休息循环。

## 已知注意事项

- WebSocket 组名只允许 ASCII 字母数字、`-`、`_`、`.`（新版 channels_redis 校验）
- 邮件密码使用 SMTP 授权码而非登录密码
- natapp 免费隧道可能不支持 WebSocket，部署时需确认
- 前端 HTTP 轮询已移除，在线状态全走 WebSocket 推送
