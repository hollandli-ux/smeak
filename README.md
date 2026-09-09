# Smeak

AI 口语陪练：与场景角色实时语音对话，吉祥物「晚晚」在对话中适时纠错与优化。单次练习 5/10/15 分钟，适合碎片时间练口语。

## 功能

- 30+ 生活场景 + 自定义场景（AI 按主题现场生成）
- 与 Google Gemini Live 全双工实时语音对话，可随时打断
- 难度分级（初/中/高），字幕开关（纯听力模式）
- 对话中纠错/优化由吉祥物「晚晚」触发（基于系统提示词，非独立模块）
- 练习自动存录音，可反复回听；历史/统计/连续打卡
- 网页版 + Android App（Capacitor 打包）

## 架构

```
浏览器 / Android WebView (frontend/)
        │  HTTP + WebSocket(本地中转)
        ▼
server.py (Python aiohttp)
   ├─ /           静态托管 frontend/
   ├─ /api/token  签发 Gemini Live 临时令牌（Key 只在服务端）
   ├─ /api/scenario 用文本模型生成自定义场景
   └─ /ws          WebSocket 中继（可选，供手机直连后端时使用）
        │
        ▼
Google Gemini API（语音需能访问 Google）
```

## 目录结构

```
frontend/    Web 前端（原生 JS，无框架）
server.py    后端服务
requirements.txt
android/     Capacitor Android 工程
capacitor.config.json
```

## 快速开始（网页版）

1. 到 [Google AI Studio](https://aistudio.google.com/apikey) 创建 API Key。
2. 配置密钥：

   ```bash
   cp .env.example .env   # 填入 GEMINI_API_KEY
   ```

3. 安装依赖并启动：

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python server.py
   ```

4. 浏览器打开 `http://localhost:8000`。

> 语音由 Google 提供服务，运行环境需能访问 Google（国内网络通常需要代理）。

后台运行（无需保持终端）：

```bash
nohup .venv/bin/python server.py > server.log 2>&1 &
```

macOS 常驻可注册为 launchd 服务（参考仓库内 `deploy/` 示例，或直接使用 `launchctl`）。

## Android App

```bash
npm install                 # 首次
npx cap sync android        # 把 frontend 同步进原生工程
cd android
./gradlew assembleDebug     # 产物在 app/build/outputs/apk/debug/
```

安装后：手机与后端同网时填后端地址；单机直连可填入 API Key（需手机能访问 Google）。

## 隐私

- 录音只保存在本机，不上传。
- API Key 只存于服务端（后端模式）或本机（直连模式），不随安装包分发。
- 语音内容发送给 Google Gemini 处理。

## License

MIT
