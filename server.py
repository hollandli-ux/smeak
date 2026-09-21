#!/usr/bin/env python3
"""Smeak 后端：托管前端，签发 Gemini Live 临时令牌并生成自定义场景。"""
import datetime
import mimetypes
import os
from pathlib import Path

from aiohttp import web
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.environ.get("PORT", "8000"))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

client = None
SDK_UNAVAILABLE_REASON = None

if not GEMINI_API_KEY:
    SDK_UNAVAILABLE_REASON = "未配置 GEMINI_API_KEY（请在 .env 中填入，或设置环境变量）"
    print(f"⚠️  {SDK_UNAVAILABLE_REASON}")
    print("    前端仍可运行；直连模式下可在页面底部填入 Key 测试。")
else:
    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY, http_options={"api_version": "v1alpha"})
    except Exception as exc:  # pragma: no cover
        SDK_UNAVAILABLE_REASON = f"加载 google-genai SDK 失败：{exc}"
        print(f"⚠️  {SDK_UNAVAILABLE_REASON}。/api/token 将不可用。")

FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"


async def api_token(request):
    """签发一个 30 分钟有效的临时令牌（仅一次会话使用）。"""
    if client is None:
        return web.json_response({"error": SDK_UNAVAILABLE_REASON or "server missing google-genai SDK"}, status=500)
    try:
        now = datetime.datetime.now(tz=datetime.timezone.utc)
        expire_time = now + datetime.timedelta(minutes=30)
        token = client.auth_tokens.create(
            config={
                "uses": 1,
                "expire_time": expire_time.isoformat(),
                "new_session_expire_time": (now + datetime.timedelta(minutes=1)).isoformat(),
                "http_options": {"api_version": "v1alpha"},
            }
        )
        return web.json_response({"token": token.name, "expires_at": expire_time.isoformat()})
    except Exception as exc:
        return web.json_response({"error": str(exc)}, status=500)


SCENARIO_MODEL = "gemini-3.6-flash"  # 自定义场景文本模型（2.5-flash 已下线）


async def api_scenario(request):
    """根据用户主题生成一个即兴口语场景（文本模型，费用极低）。"""
    if client is None:
        return web.json_response({"error": SDK_UNAVAILABLE_REASON or "server missing google-genai SDK"}, status=500)
    try:
        data = await request.json()
    except Exception:
        data = {}
    topic = (data.get("topic") or "").strip()
    if not topic:
        return web.json_response({"error": "缺少话题 topic"}, status=400)
    if len(topic) > 80:
        return web.json_response({"error": "话题太长了"}, status=400)
    prompt = (
        "你是口语练习 App「Smeak」的场景设计师。根据用户想聊的主题，设计 1 个即兴对话场景。"
        "只输出严格 JSON（不要代码块、不要多余文字），格式："
        '{"title":"中文场景名","en":"English name","emoji":"一个emoji",'
        '"role":"AI 扮演的角色（中文，2-8字）","place":"地点（中文）",'
        '"openingEn":"AI 的英文开场白（一句自然口语）",'
        '"warmup":[["一句英文", "中文意思"],["一句英文", "中文意思"]]}\n'
        f"用户主题：{topic}"
    )
    try:
        resp = client.models.generate_content(model=SCENARIO_MODEL, contents=prompt)
        text = (resp.text or "").strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            text = text.rsplit("```", 1)[0]
        start, end = text.find("{"), text.rfind("}")
        if start < 0 or end < 0:
            return web.json_response({"error": "模型返回格式不正确"}, status=500)
        import json as _json
        scenario = _json.loads(text[start:end + 1])
        scenario["id"] = "custom"
        scenario["category"] = "custom"
        if not scenario.get("emoji"):
            scenario["emoji"] = "✨"
        return web.json_response(scenario)
    except Exception as exc:
        return web.json_response({"error": str(exc)}, status=500)


import asyncio
import json as _json
from urllib.parse import quote


def _live_setup(cfg):
    model = cfg.get("model") or "gemini-3.1-flash-live-preview"
    setup = {
        "model": f"models/{model}",
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "temperature": float(cfg.get("temperature") or 1.0),
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": cfg.get("voice") or "Aoede"}}},
        },
        "systemInstruction": {"parts": [{"text": cfg.get("systemInstruction") or ""}]},
        "inputAudioTranscription": {},
        "outputAudioTranscription": {},
    }
    vad = int(cfg.get("vadMs") or 0)
    # 灵敏度调低：更不容易被背景说话/杂音触发（宿舍场景）
    setup["realtimeInputConfig"] = {
        "automaticActivityDetection": {
            "disabled": False,
            "silenceDurationMs": vad if vad > 0 else 900,
            "prefixPaddingMs": 300,
            "endOfSpeechSensitivity": "END_SENSITIVITY_LOW",
            "startOfSpeechSensitivity": "START_SENSITIVITY_LOW",
        },
        "activityHandling": "ACTIVITY_HANDLING_UNSPECIFIED",
    }
    return setup


async def ws_relay(request):
    """语音中转：手机只连本服务，由本服务直连 Google Live（无需手机能访问 Google）。"""
    ws = web.WebSocketResponse(heartbeat=30)
    await ws.prepare(request)
    if client is None:
        await ws.close(message="backend-unconfigured")
        return ws
    try:
        start = await ws.receive_json(timeout=20)
    except Exception:
        await ws.close(message="missing-start")
        return ws
    cfg = start.get("config", start)
    if not cfg.get("systemInstruction"):
        await ws.close(message="missing-config")
        return ws
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    expire = now + datetime.timedelta(minutes=30)
    token = client.auth_tokens.create(
        config={
            "uses": 1, "expire_time": expire.isoformat(),
            "new_session_expire_time": (now + datetime.timedelta(minutes=1)).isoformat(),
            "http_options": {"api_version": "v1alpha"},
        }
    )
    url = ("wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha."
           f"GenerativeService.BidiGenerateContentConstrained?access_token={quote(token.name)}")
    import aiohttp
    try:
        async with aiohttp.ClientSession() as sess:
            async with sess.ws_connect(url, max_msg_size=8 * 1024 * 1024) as gw:
                await gw.send_str(_json.dumps({"setup": _live_setup(cfg)}))

                async def browser_to_google():
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            await gw.send_str(msg.data)
                        elif msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.ERROR):
                            break

                async def google_to_browser():
                    async for msg in gw:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            await ws.send_str(msg.data)
                        elif msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.ERROR):
                            break

                t1 = asyncio.ensure_future(browser_to_google())
                t2 = asyncio.ensure_future(google_to_browser())
                try:
                    await asyncio.gather(t1, t2)
                finally:
                    t1.cancel(); t2.cancel()
    except Exception as exc:
        try:
            await ws.send_str(_json.dumps({"relayError": str(exc)}))
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass
    return ws


async def serve_static(request):
    path = request.match_info.get("path", "index.html").lstrip("/")
    if not path or path == "/":
        path = "index.html"
    if ".." in path:
        return web.Response(text="Invalid path", status=400)
    file_path = (FRONTEND_DIR / path).resolve()
    if not str(file_path).startswith(str(FRONTEND_DIR.resolve())) or not file_path.is_file():
        return web.Response(text="Not found", status=404)
    content_type, _ = mimetypes.guess_type(str(file_path))
    if content_type is None:
        content_type = "application/octet-stream"
    return web.Response(body=file_path.read_bytes(), content_type=content_type)


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        return web.Response(status=204, headers=CORS_HEADERS)
    resp = await handler(request)
    resp.headers.update(CORS_HEADERS)
    return resp


def main():
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_post("/api/token", api_token)
    app.router.add_post("/api/scenario", api_scenario)
    app.router.add_get("/ws", ws_relay)
    app.router.add_get("/", serve_static)
    app.router.add_get("/{path:.*}", serve_static)
    web.run_app(app, host="0.0.0.0", port=PORT)
    print(f"\n📱 SpeakMate: http://localhost:{PORT}")


if __name__ == "__main__":
    main()
