# 🧩 JavaScript Store

油猴脚本（Tampermonkey/Greasemonkey）合集，旨在提升常用网站的使用体验。

## 📦 脚本列表

### 1. V2EX 每日活跃度助手 ([`v2ex_daily_activity_helper.js`](./v2ex_daily_activity_helper.js))

自动完成 V2EX 的每日活跃度任务，帮助获取铜币奖励。

**特性：**
- 🚀 完全自动化，无需手动点击按钮
- 📊 在活跃度条上显示当前百分比
- ⏱️ 智能刷新间隔（5～50 秒），进度越高频率越低
- 🔁 状态持久化，页面刷新后可继续未完成的任务
- 🛡️ 使用 `GM_xmlhttpRequest` 避免 CORS 问题
- ⏰ 每天 08:00 后自动启动（遵守 V2EX 规则）
- 🧹 达到 100% 或奖励领取后自动停止并清理

**安装：** [点击安装](https://github.com/sdise/javascript-store/raw/main/v2ex_daily_activity_helper.js)  
**详情：** 见脚本内注释

---

### 2. Telegram Web K 表情包彻底抹除 ([`telegram/NoSticker-telegram.js`](./telegram/NoSticker-telegram.js))

只隐藏纯表情包消息，保留包含文字或图片的正常消息。

**特性：**
- 🎯 精确识别：仅当消息气泡被官方标记为 `is-sticker` 或不含文字区域 (`.message`) 时才隐藏
- 🚀 高性能：纯 CSS 实现，由浏览器内核直接处理，无 JS 监听器
- 🔄 动态适配：新消息自动应用规则，无延迟
- 🧹 不留空白：使用 `display: none`，后续消息自动上移

**安装：** [点击安装](https://github.com/sdise/javascript-store/raw/main/telegram/NoSticker-telegram.js)  
**详情：** 参见 [`telegram/README.md`](./telegram/README.md)

---

### 3. Edge Tunnel ([`edgetunel.js`](./edgetunel.js))

**⚠️ 高级网络工具，仅供学习研究使用。**  
实现基于 Cloudflare Workers 的代理/隧道功能，支持 WebSocket、gRPC、XHTTP 等协议，并内置 Web 管理界面。

**主要功能：**
- 🌐 多协议代理（VLESS / Trojan / SS）
- 🔁 智能反代 IP 轮换与故障转移
- 📡 WebSocket 与 gRPC 传输支持
- 🧩 订阅生成器（Clash / Sing-box / Surge 等格式）
- 🗄️ 配置持久化（KV 存储）

**部署要求：**
- Cloudflare Workers 环境
- 需要绑定 KV 命名空间

> 详细配置请阅读脚本内部注释及作者文档。

---