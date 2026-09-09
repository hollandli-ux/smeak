# 🎙️ Smeak — AI 口语陪练（Web 原型）

利用碎片时间（5/10/15 分钟）和 AI 实时语音对话练口语。
每次随机展示 6 个场景 → 不满意可「换一批」→ 选难度 → 开始 → 像打电话一样和 AI 对话 → 结束收到小结。

- 语音引擎：**Gemini Live API（全双工实时语音）**，可随时打断、低延迟
- 架构：服务端签发**临时令牌**，浏览器直连 Google，**API Key 不暴露**
- 场景 / 难度 / 时长全部通过 **system prompt** 实现，改文案即可加新场景
- **人性化 AI**：像真人一样说话，会安慰、鼓励、帮你"递话"；卡壳时可用中文求助
- **吉祥物晚晚 🐱（银渐层小猫）**：对话中实时纠错/优化——明显错误或表达不够地道时，AI 跳出角色、自我介绍后给建议，再回到角色继续
- **字幕开关**：可开启"纯听力模式"练耳朵（对话中也能随时切换）
- 结束练习：AI 只简短道别，不再长篇总结；小结以晚晚的记录 + 鼓励语呈现在结束页
- **练习历史与打卡**：自动记录每次练习，首页可回顾；结束页显示连续打卡天数 + 近 7 天总时长
- **体验细节**：Toast 轻提示替代弹窗、记住上次难度/时长选择、开始按钮防连点
- **自动重连 + 打字兜底**：断线自动重连（最多 2 次）；识别不到或开不了麦时可打字和 AI 对话
- **静音 & 自定义话题 & 近 7 天柱状图**：会话中可随时静音；可输入自定义话题让 AI 引导；历史区展示近 7 天练习时长
- **场景分类筛选**：生活 / 出行 / 职场 / 健康 / 社交，按类选场景，不再全靠随机
- **跟读练习模式**：AI 教练晚晚带读，一句一句跟读，自动按水平出句
- **练习回放**：结束页可回听本次你与 AI 的完整对话（本地录制，不离开设备）
- **练前预热卡**：选好场景先看 2 个关键表达再开口
- **会话中提示按钮**：卡壳点「💡 提示」，晚晚给"接下来可以怎么说"
- **冷场引导**：沉默约 8 秒 AI 会自动温柔引导开口
- **每日目标**：设定每天练几分钟，首页实时显示今日进度
- **深色模式**：首页右上角一键切换 🌙/☀️
- **音色试听**：选音色旁一键试听（真实调用语音 API）
- **PWA**：可"添加到主屏幕"当半个 App 用（图标/离线缓存已配好）
- **导出**：结束页导出对话文本(.txt)、历史页导出全部数据(.json)
- **语速/音量**：AI 语速三档（慢/正常/快，本地变速不额外计费）、音量滑杆
- **停顿识别**：可调"说多久算说完"（更灵敏/默认/更宽松）
- **月历热力图**：历史区按月查看每天练了多久
- **练习报告**：一键生成连续天数/周月时长/常练场景 TOP3/薄弱建议
- **场景搜索**：直接搜场景名或英文关键词，如「面试 / coffee」
- **自定义生成场景**：输入主题 → AI 现场生成专属场景（角色/地点/开场/预热句），可移除；刷新后保留
- **场景库扩充**：内置场景已扩到 38 个（新增理发店/超市/看房/租车/海关/绩效面谈/离职沟通/看牙医/配眼镜/约打球等）
- **收藏复习**：晚晚建议可 ⭐ 收藏，首页可回顾/复习/导出
- **练习提醒**：开启后当日没练够目标，练完会收到桌面通知

## 界面预览

| 手机端 | 桌面端 |
|---|---|
| ![mobile](docs/preview-mobile.png) | ![desktop](docs/preview-desktop.png) |

## 界面流程

1. 选场景：内置 **25 个场景**，每次展示 6 个（咖啡厅点单 ☕ / 机场值机 ✈️ / 求职面试 💼 / 看医生 🩺 / 商务会议 🗣️ / 售后投诉 😤 …）
2. 不满意？点 **🔄 换一批**，换成另外 6 个
3. 选难度：初级 / 中级 / 高级
4. 选时长：5 / 10 / 15 分钟（到时 AI 自动小结收尾）
5. 语音对话（带实时字幕），随时可「结束练习」

## 一、申请密钥（1 分钟，免费）

1. 打开 <https://aistudio.google.com>（用你的 Google 账号登录）
2. 点 **「Get API key」** → **「Create API key」** → 复制生成的 Key（形如 `AIza...`）
3. 免费层无需绑卡；个人原型足够用

> 你订阅的 Google AI Pro（原 Google One AI Premium）让 AI Studio 网页额度更宽松、原型阶段计费可豁免，但 **API Key 仍需单独创建**。

## 二、申请完密钥后怎么做？

**第 1 步：进入项目目录**
```bash
cd /Users/holland/Documents/Codex/2026-09-08/wo-k/outputs/smeak
```

**第 2 步：创建并填写 .env**
```bash
cp .env.example .env
open -e .env      # 或手动编辑
```
把文件改成（等号后直接粘贴，**不要加引号/空格**）：
```
GEMINI_API_KEY=AIza你的密钥
```

**第 3 步：安装依赖（只需第一次）**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**第 4 步：启动**
```bash
python server.py
```
看到 `http://localhost:8000` 后，**用 Chrome 或 Safari 打开** <http://localhost:8000>。

**第 5 步：开练**
1. 页面出现 6 个场景，不喜欢就点「换一批」
2. 选难度、时长 → 点 **🎤 开始对话**
3. 浏览器弹出**麦克风权限** → 点允许
4. 听到 AI 先开口后，直接说话；说完停顿一下，AI 就会回应

**常见问题**
- 启动时提示 `未检测到 GEMINI_API_KEY` → 检查 `.env` 是否在 `smeak/` 目录下、文件名是否就叫 `.env`、内容是否 `GEMINI_API_KEY=AIza...`，改完**重启 server.py**
- 点开始没反应/提示没有 Key → 参考上面的第 2 步
- 提示连接失败 → 检查 Key 是否复制完整、是否申请成功
- 说话没反应 → 确认麦克风已允许、浏览器标签页没被静音

## 备选：纯静态直连模式（仅自用快速试）

不装依赖、不起 Python 后端：
```bash
python3 -m http.server 8000 --directory frontend
```
打开 <http://localhost:8000>，在页面底部「API Key（直连模式）」填入 Key（只存本机浏览器）。
⚠️ 此模式下 Key 在浏览器里，**仅限自己本机试用**；分享给别人请用上面的 server.py 模式。

## 在 iPhone 上测试（可选）

- 同一 WiFi 下，iPhone Safari 打开 `http://<你 Mac 的局域网 IP>:8000`。
- ⚠️ 非 localhost 的 http 页面，浏览器**会禁止麦克风**。临时办法：用 HTTPS 隧道拿到 https 地址再打开，例如
  `ngrok http 8000` 或 `cloudflared tunnel --url http://localhost:8000`。
- 以后做成 iOS App 时是原生麦克风权限，没有这个问题。

## 技术要点

| 项 | 说明 |
|---|---|
| 模型 | `gemini-3.1-flash-live-preview`（可用 `?model=` 覆盖） |
| 语音 | Gemini Live 预置音色，默认 `Aoede`（`frontend/app.js` 里 `VOICE` 可改：Puck/Charon/Kore/Fenrir/Aoede） |
| 音频 | 16 kHz PCM，AudioWorklet 采集/播放 |
| 字幕 | 开启 input/output transcription，实时显示双方说了什么 |
| 会话 | AI 主动开场；说完停顿即轮到 AI（Google 端 VAD）；可随时打断 |
| 场景 | 25 个场景池，每次随机 6 个，「换一批」从其余场景再抽 6 个（`SCENARIOS_POOL` / `shuffleScenarios()`） |

## 目录结构
```
smeak/
├── server.py            # 静态托管 + 签发临时令牌（POST /api/token）
├── requirements.txt
├── .env.example         # GEMINI_API_KEY、PORT
├── docs/                # 界面预览截图
└── frontend/
    ├── index.html       # 三个页面：选场景 / 对话 / 总结
    ├── style.css
    ├── app.js           # 25 个场景、system prompt、会话状态机、计时
    ├── gemini-live.js   # Gemini Live 客户端（临时令牌 / 直连 Key 双模式）
    └── audio-processors/ # 麦克风采集 + 播放 AudioWorklet
```

## 已知限制 & 下一步
- 字幕来自 Google 的转写，可能有轻微延迟/误差；转写仅供参考，不影响对话本身。
- 「一句话说多长算说完」由 Google 端 VAD 决定；如需更灵敏/更迟钝可在 setup 里加 `realtimeInputConfig` 调参。
- 下一步可选：iOS App（SwiftUI / Expo 封装）、对话历史与评分报告、自定义场景、多语言、用户系统后分享给朋友。

## 注意
- `.env` 已 gitignore，**不要把 API Key 提交到任何仓库**。
- Gemini Live API 有免费额度；超出或正式商用按量计费（AI Pro 订阅者在原型阶段有豁免/扩展额度）。


## 📦 Android APK
已可打包成 APK（Capacitor 方案）：见 **README-APK.md**，当前产物为 `Smeak-v0.1-debug.apk`。
