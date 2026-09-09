# 📦 Smeak Android APK（debug 版）

`Smeak-v0.19-debug.apk` 是用 **Capacitor** 把当前网页版打包成的 Android 应用（同一个前端，功能一致）。
用 **debug 签名**构建，适合自己手机侧载安装测试（无需上架）。

## 安装
1. 把 `Smeak-v0.19-debug.apk` 传到 Android 手机（微信/网盘/USB 都行）；
2. 点开安装 → 系统提示"未知来源"时允许（仅此一次）；
3. 或在电脑用数据线：`adb install Smeak-v0.19-debug.apk`。

## ⚠️ 用之前必读：手机需要能连到"后端"
App 里语音要用到你的 Gemini Key，Key 在 server.py 后端里。**手机连不上你电脑的本地后端 = 用不了**。三种接法：

1. **同一 Wi-Fi（最快测试）**
   - Mac 上启动：`cd smeak && source .venv/bin/activate && python server.py`
   - App 里：设置（底部展开）→「后端地址」填 `http://<你Mac的局域网IP>:8000` → 保存
   - 手机 Mac 须在同一 Wi-Fi；Mac 不能关终端（或用下方第 2 种常驻方式）。

2. **让后端常驻 + 随时随地访问（推荐，长期用）**
   - 用 macOS `launchd` 让 server.py 开机自启、后台运行（不用开终端）；
   - 再用 **Cloudflare Tunnel**（`cloudflared tunnel`）给本机后端一个 https 网址；
   - App「后端地址」填那个 https 网址 → 手机在任何网络都能练。

3. **直连 Key（仅自用兜底）**
   - App 设置里直接填 Google API Key。⚠️ 手机需要能直连 Google（国内网络可能需代理），且 Key 存手机上，不适合分享。

> 手机权限：第一次点「开始对话」会弹出**麦克风权限**，请允许（Capacitor 会自动请求）。

## 以后怎么重新打包
环境已配好（JDK 21 + Android SDK + 阿里云镜像）。
```bash
cd /Users/holland/Documents/Codex/2026-09-08/wo-k/outputs/smeak
npx cap sync android          # 把最新网页同步进 App
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
./gradlew assembleDebug       # 产物：android/app/build/outputs/apk/debug/app-debug.apk
```

## 说明
- debug 版每次安装包名固定 `com.smeak.practice`，可直接覆盖安装。
- 以后想发给别人/上架：需要 **release 签名**（keystore）+ 可选 Google Play（$25 一次性）。到那步我再给你完整流程。
