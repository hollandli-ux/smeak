"use strict";

/* ================= 配置 ================= */
const MODEL = new URLSearchParams(location.search).get("model") || "gemini-3.1-flash-live-preview";
const VOICE = "Aoede"; // 可选: Puck / Charon / Kore / Fenrir / Aoede

/* ================= 场景 / 难度 / 时长 ================= */
const SCENARIOS_POOL = [
  { id: "coffee", emoji: "☕", title: "咖啡厅点单", en: "At a café", role: "咖啡师", place: "西雅图街角咖啡厅", openingEn: "Hi there! What can I get for you today?" },
  { id: "airport", emoji: "✈️", title: "机场值机", en: "Airport check-in", role: "值机柜台工作人员", place: "国际机场航站楼", openingEn: "Good morning! May I see your passport and ticket, please?" },
  { id: "hotel", emoji: "🏨", title: "酒店入住", en: "Hotel check-in", role: "前台接待员", place: "市中心商务酒店", openingEn: "Welcome to our hotel! Do you have a reservation with us?" },
  { id: "interview", emoji: "💼", title: "求职面试", en: "Job interview", role: "面试官", place: "一家科技公司的会议室", openingEn: "Thanks for coming in. So, tell me a little about yourself." },
  { id: "smalltalk", emoji: "🧑‍🤝‍🧑", title: "认识新朋友", en: "Meeting someone new", role: "一位友善的本地朋友", place: "朋友聚会 / 城市漫步", openingEn: "Hey! I don't think we've met — I'm Alex. How do you know everyone here?" },
  { id: "free", emoji: "🌍", title: "自由聊天", en: "Free conversation", role: "一位聊得来的语伴", place: "随便聊你感兴趣的话题", openingEn: "Hey, great to chat with you! What's been on your mind lately?" },
  { id: "restaurant", emoji: "🍜", title: "餐厅点餐", en: "Ordering at a restaurant", role: "餐厅服务员", place: "一家意大利餐厅", openingEn: "Good evening! Here's our menu. Can I start you with something to drink?" },
  { id: "taxi", emoji: "🚕", title: "打车去酒店", en: "Taking a taxi", role: "出租车司机", place: "机场开往市区的路上", openingEn: "Where to, buddy? First time in the city?" },
  { id: "shopping", emoji: "🛍️", title: "商场退换货", en: "Returning an item", role: "商场导购", place: "一家品牌服装店", openingEn: "Hi! How can I help you today — looking for something, or here for a return?" },
  { id: "doctor", emoji: "🩺", title: "看医生", en: "Seeing a doctor", role: "医生", place: "社区诊所", openingEn: "Come in, have a seat. So what brings you in today?" },
  { id: "bank", emoji: "🏦", title: "银行开户", en: "Opening a bank account", role: "银行柜员", place: "市中心的一家银行", openingEn: "Good morning! What can I do for you today?" },
  { id: "pharmacy", emoji: "💊", title: "药店买药", en: "At the pharmacy", role: "药剂师", place: "24 小时药店", openingEn: "Hi there! What symptoms are you dealing with?" },
  { id: "directions", emoji: "🗺️", title: "街头问路", en: "Asking for directions", role: "热心的路人", place: "陌生城市的街头", openingEn: "Hey, you look a bit lost — are you looking for somewhere?" },
  { id: "phone", emoji: "📞", title: "电话订座", en: "Reserving by phone", role: "餐厅接线员", place: "一通电话里", openingEn: "Thank you for calling Bella Trattoria. How may I help you?" },
  { id: "travel", emoji: "🧳", title: "规划旅行", en: "Planning a trip", role: "旅行社顾问", place: "旅行社柜台", openingEn: "Welcome! Planning a getaway? Where were you thinking of going?" },
  { id: "meeting", emoji: "🗣️", title: "商务会议发言", en: "Business meeting", role: "客户方经理", place: "客户公司会议室", openingEn: "Thanks for joining. Let's start — can you walk us through your proposal?" },
  { id: "presentation", emoji: "📊", title: "产品演示", en: "Product demo", role: "潜在客户", place: "客户公司", openingEn: "Great, we're ready. Go ahead and show us what your product can do." },
  { id: "negotiation", emoji: "🤝", title: "价格谈判", en: "Negotiating a price", role: "供应商销售", place: "线上视频会议", openingEn: "Thanks for the quote. Before we sign, I'd like to talk about the price a little." },
  { id: "class", emoji: "🎓", title: "小组讨论作业", en: "Group study", role: "同班同学", place: "大学图书馆", openingEn: "Hey, you're in my English class, right? Want to work on the group presentation together?" },
  { id: "roommate", emoji: "🏠", title: "和室友分账单", en: "Talking with a roommate", role: "新室友", place: "合租公寓", openingEn: "Hey! Nice to finally meet you. Should we sort out how to split the bills?" },
  { id: "gym", emoji: "🏋️", title: "健身房办卡", en: "Joining a gym", role: "健身房顾问", place: "健身房前台", openingEn: "Welcome to FitZone! Are you interested in a membership today?" },
  { id: "movie", emoji: "🎬", title: "约朋友看电影", en: "Making weekend plans", role: "朋友", place: "周末的下午", openingEn: "Hey! Are you free this weekend? I heard a great movie just came out." },
  { id: "complaint", emoji: "😤", title: "售后投诉", en: "Making a complaint", role: "客服专员", place: "客服电话的另一端", openingEn: "Thank you for calling. I understand you're upset — can you tell me what happened?" },
  { id: "party", emoji: "🎂", title: "生日聚会邀请", en: "Inviting to a party", role: "朋友", place: "电话 / 聊天里", openingEn: "Hey! It's my birthday this Friday — are you free to come over?" },
  { id: "museum", emoji: "🖼️", title: "逛博物馆", en: "At a museum", role: "讲解员", place: "一座艺术博物馆", openingEn: "Welcome to the museum! Would you like to join the guided tour?" },
];
const DIFFICULTIES = [
  { id: "beginner", label: "初级", desc: "简单词句 · 放慢语速 · 中文提示" },
  { id: "intermediate", label: "中级", desc: "自然语速 · 英文轻纠错" },
  { id: "advanced", label: "高级", desc: "母语级表达 · 结束再点评" },
];
const DURATIONS = [5, 10, 15];

/* 场景池：每次展示 6 个，不满意可「换一批」 */
function drawN(arr, n) {
  const a = [...arr];
  const out = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}
function initScenarioDeck() {
  S.visibleScenarios = drawN(SCENARIOS_POOL, 6);
  if (!S.visibleScenarios.some((sc) => sc.id === S.scenario.id)) S.scenario = S.visibleScenarios[0];
}
function shuffleScenarios() {
  const rest = SCENARIOS_POOL.filter((sc) => !S.visibleScenarios.some((v) => v.id === sc.id));
  S.visibleScenarios = drawN(rest, 6);
  if (!S.visibleScenarios.some((sc) => sc.id === S.scenario.id)) S.scenario = S.visibleScenarios[0];
  renderSetup();
}

/* ================= 系统提示词 ================= */
function buildSystemInstruction(sc, diff, minutes) {
  return [
    `你是「Smeak」里的一位英语口语陪练伙伴。请用英语扮演角色，与练习者完成一次真实、自然的对话练习。`,
    ``,
    `【场景】${sc.title} (${sc.en})`,
    `【地点】${sc.place}`,
    `【你的角色】${sc.role}`,
    `【学习者水平】${diff.label}`,
    `【目标时长】约 ${minutes} 分钟`,
    ``,
    `【开场】自然地主动开启话题（例如: "${sc.openingEn}"），不要等对方先开口。`,
    ``,
    `【按水平调整】`,
    diff.id === "beginner"
      ? `- 初级：只用简单高频词汇和短句，语速放慢；练习者卡壳时主动提示或换更简单的问题；出现明显错误时，用一句中文简短指出正确说法，再继续用英语对话。`
      : diff.id === "intermediate"
        ? `- 中级：自然语速、日常表达；明显语法或用词错误用英语简短纠正一次后继续，不打断流畅感。`
        : `- 高级：像母语者一样自然交流，可用地道表达；对话中不打断纠错，留到最后统一点评。`,
    ``,
    `【通用规则】`,
    `- 全程保持角色身份，贴近真实场景，自然推进话题（点单、办理、寒暄、追问细节等）。`,
    `- 主要使用英语；除初级允许简短中文提示外，不要用中文闲聊。`,
    `- 当练习者表示要结束（例如 "That's all for today"）时，用 2-3 句话总结这次对话，并给 1 条最值得改进的建议，然后自然收尾。`,
  ].join("\n");
}

/* ================= 音频采集（16kHz PCM → base64） ================= */
class AudioCapture {
  constructor(onAudioBase64) {
    this.onAudioBase64 = onAudioBase64;
    this.ctx = null;
    this.node = null;
    this.stream = null;
    this.source = null;
    this.running = false;
  }
  async start() {
    if (this.running) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.stream = stream;
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    await ctx.audioWorklet.addModule("audio-processors/capture.worklet.js");
    const node = new AudioWorkletNode(ctx, "audio-capture-processor");
    node.port.onmessage = (ev) => {
      if (!this.running) return;
      if (ev.data && ev.data.type === "audio") {
        const pcm = toPCM16Base64(ev.data.data);
        if (pcm) this.onAudioBase64(pcm);
      }
    };
    if (ctx.state === "suspended") await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    source.connect(node);
    this.ctx = ctx; this.node = node; this.source = source;
    this.running = true;
  }
  stop() {
    this.running = false;
    try { this.source && this.source.disconnect(); } catch (e) {}
    try { if (this.ctx && this.ctx.state === "running") this.ctx.suspend(); } catch (e) {}
    try { if (this.stream) this.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    this.source = null; this.stream = null;
  }
  destroy() { this.stop(); try { this.ctx && this.ctx.close(); } catch (e) {} this.ctx = null; }
}

/* ================= 音频播放（base64 PCM → 扬声器） ================= */
class AudioPlayer {
  constructor() { this.ctx = null; this.node = null; this.gain = null; this.ready = false; }
  async init() {
    if (this.ready) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    await ctx.audioWorklet.addModule("audio-processors/playback.worklet.js");
    const node = new AudioWorkletNode(ctx, "pcm-processor");
    const gain = ctx.createGain(); gain.gain.value = 1.0;
    node.connect(gain); gain.connect(ctx.destination);
    this.ctx = ctx; this.node = node; this.gain = gain; this.ready = true;
  }
  async play(b64) {
    await this.init();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const i16 = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
    this.node.port.postMessage(f32);
  }
  interrupt() { if (this.node) this.node.port.postMessage("interrupt"); }
  destroy() { try { if (this.ctx) this.ctx.close(); } catch (e) {} this.ctx = null; this.node = null; this.ready = false; }
}

function toPCM16Base64(float32Array) {
  const i16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    i16[i] = s * 0x7fff;
  }
  const bytes = new Uint8Array(i16.buffer);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/* ================= 会话状态 ================= */
const S = {
  scenario: SCENARIOS_POOL[0],
  visibleScenarios: [],
  difficulty: DIFFICULTIES[0],
  minutes: 10,
  client: null, capture: null, player: null,
  timer: null, secondsLeft: 0, startedAt: 0,
  userTurns: 0, aiTurns: 0,
  wrapRequested: false, ended: false,
  activeBubble: null,
  turnHadOutputTx: false,
  lastAiFinal: "",
};

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

/* ================= 首页渲染 ================= */
function renderSetup() {
  const grid = $("scenarioGrid");
  grid.innerHTML = "";
  (S.visibleScenarios || SCENARIOS_POOL.slice(0, 6)).forEach((sc) => {
    const card = el("button", "scenario-card" + (sc.id === S.scenario.id ? " selected" : ""));
    card.innerHTML = `<span class="sc-emoji">${sc.emoji}</span><span class="sc-title">${sc.title}</span><span class="sc-en">${sc.en}</span>`;
    card.onclick = () => { S.scenario = sc; renderSetup(); };
    grid.appendChild(card);
  });

  const diffWrap = $("difficultyOptions");
  diffWrap.innerHTML = "";
  DIFFICULTIES.forEach((d) => {
    const b = el("button", "opt-btn" + (d.id === S.difficulty.id ? " selected" : ""), d.label);
    b.title = d.desc;
    b.onclick = () => { S.difficulty = d; renderSetup(); };
    diffWrap.appendChild(b);
  });

  const durWrap = $("durationOptions");
  durWrap.innerHTML = "";
  DURATIONS.forEach((m) => {
    const b = el("button", "opt-btn" + (m === S.minutes ? " selected" : ""), `${m} 分钟`);
    b.onclick = () => { S.minutes = m; renderSetup(); };
    durWrap.appendChild(b);
  });

  $("roleHint").textContent = `AI 将扮演：${S.scenario.role} @ ${S.scenario.place}（${S.difficulty.label} · ${S.minutes} 分钟）`;
  $("diffDesc").textContent = S.difficulty.desc;
  const key = localStorage.getItem("gmKey");
  $("keyInput").value = key || "";
}

/* ================= 屏幕切换 ================= */
function showScreen(name) {
  ["setup", "session", "summary"].forEach((n) => {
    $(`screen-${n}`).classList.toggle("active", n === name);
  });
}

/* ================= 会话界面 ================= */
function resetSessionUI() {
  $("transcript").innerHTML = "";
  $("sessionBadge").textContent = `${S.scenario.emoji} ${S.scenario.title} · ${S.difficulty.label}`;
  setStatus("正在连接 AI…", "connecting");
  $("timerText").textContent = fmtTime(S.minutes * 60);
  S.activeBubble = null; S.userTurns = 0; S.aiTurns = 0;
  S.wrapRequested = false; S.ended = false; S.lastAiFinal = ""; S.turnHadOutputTx = false;
}

function setStatus(text, cls) {
  const pill = $("statusPill");
  pill.textContent = text;
  pill.className = "status-pill " + (cls || "");
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function addBubble(side, text) {
  const row = el("div", `bubble-row ${side}`);
  const who = el("div", "bubble-who", side === "user" ? "你" : S.scenario.role);
  const bub = el("div", `bubble ${side}`);
  bub.textContent = text || "…";
  row.appendChild(who); row.appendChild(bub);
  $("transcript").appendChild(row);
  S.activeBubble = { side, el: bub };
  scrollTranscript();
  return bub;
}

function scrollTranscript() {
  const t = $("transcript");
  t.scrollTop = t.scrollHeight;
}

function upsertBubble(side, text, finished) {
  if (!S.activeBubble || S.activeBubble.side !== side) {
    addBubble(side, "");
  }
  S.activeBubble.el.textContent = text;
  if (finished) S.activeBubble = null;
  scrollTranscript();
}

function startCountdown(totalSeconds) {
  S.secondsLeft = totalSeconds;
  $("timerText").textContent = fmtTime(totalSeconds);
  clearInterval(S.timer);
  S.timer = setInterval(() => {
    S.secondsLeft--;
    $("timerText").textContent = fmtTime(Math.max(0, S.secondsLeft));
    if (S.secondsLeft <= 0 && !S.wrapRequested && !S.ended) {
      S.wrapRequested = true;
      setStatus("时间到，AI 正在收尾…", "wrapping");
      sendWrapUp();
    }
  }, 1000);
}

function sendWrapUp() {
  S.client && S.client.sendText(
    "(Time is up for today's practice.) Could you give me a very short summary of this conversation and ONE tip to improve? Then please end the session. Thanks!"
  );
  // 保险：15 秒内没有收到收尾回合就强制结束
  setTimeout(() => { if (!S.ended) endSession(); }, 15000);
}

/* ================= 会话主流程 ================= */
async function startSession() {
  showScreen("session");
  resetSessionUI();

  S.startedAt = Date.now();
  S.player = new AudioPlayer();
  S.capture = new AudioCapture((b64) => { S.client && S.client.sendAudioBase64(b64); });

  // 1) 尝试后端临时令牌；失败则退回直连 Key（本机自用）
  let token = null, apiKey = null;
  try {
    const resp = await fetch("/api/token", { method: "POST" });
    if (resp.ok) {
      const j = await resp.json();
      if (j.token) token = j.token;
    }
  } catch (e) { /* 静态服务器没有 /api/token，走直连 */ }
  if (!token) {
    apiKey = (localStorage.getItem("gmKey") || "").trim();
    if (!apiKey) {
      showScreen("setup");
      alert("还没有配置 API Key。\n\n推荐方式：先运行 server.py（会读取 .env 里的 GEMINI_API_KEY）自动走临时令牌。\n\n如果只想用静态服务器测试，请展开页面底部「API Key（直连模式）」填入你的 Key。");
      return;
    }
  }

  const systemInstruction = buildSystemInstruction(S.scenario, S.difficulty, S.minutes);
  const client = new GeminiLiveClient({
    token, apiKey, model: MODEL, voice: VOICE,
    systemInstruction, onEvent: handleLiveEvent,
  });
  S.client = client;

  try {
    await client.connect();
  } catch (err) {
    showScreen("setup");
    alert(err.message || "连接失败");
    return;
  }
  // 真正就绪由 SETUP_COMPLETE 事件驱动（见 handleLiveEvent）
}

function handleLiveEvent(r) {
  if (S.ended) return;
  switch (r.type) {
    case LIVE_RESP.SETUP_COMPLETE: {
      setStatus("对话已就绪，AI 先开口 👋", "ready");
      startCountdown(S.minutes * 60);
      S.capture.start().catch((e) => {
        console.error(e);
        alert("无法访问麦克风：请允许麦克风权限后重试。");
        endSession();
      });
      // 让 AI 主动开场
      setTimeout(() => S.client && S.client.askModelToRespond(), 500);
      break;
    }
    case LIVE_RESP.INPUT_TRANSCRIPTION: {
      setStatus("正在听你说…", "listening");
      upsertBubble("user", r.data.text || "…", r.data.finished);
      if (r.data.finished && r.data.text && r.data.text.trim()) S.userTurns++;
      break;
    }
    case LIVE_RESP.OUTPUT_TRANSCRIPTION: {
      setStatus("AI 正在说…", "speaking");
      S.turnHadOutputTx = true;
      upsertBubble("ai", r.data.text || "…", r.data.finished);
      if (r.data.finished) {
        if (r.data.text && r.data.text.trim()) { S.aiTurns++; S.lastAiFinal = r.data.text; }
        S.turnHadOutputTx = false;
      }
      break;
    }
    case LIVE_RESP.TEXT: {
      // 输出转写未开启时的兜底（通常不会走到）
      if (!S.turnHadOutputTx) {
        upsertBubble("ai", r.data || "…", false);
      }
      break;
    }
    case LIVE_RESP.AUDIO: {
      S.player && S.player.play(r.data).catch(console.error);
      break;
    }
    case LIVE_RESP.INTERRUPTED: {
      S.player && S.player.interrupt();
      setStatus("你可以说了（直接开口即可）", "ready");
      break;
    }
    case LIVE_RESP.TURN_COMPLETE: {
      if (S.activeBubble && S.activeBubble.side === "ai") S.activeBubble = null;
      setStatus("你可以说了（直接开口即可）", "ready");
      if (S.wrapRequested) endSession();
      break;
    }
    case LIVE_RESP.ERROR: {
      if (!S.ended) { alert("连接出错，请重试。"); endSession(); }
      break;
    }
    case LIVE_RESP.CLOSE: {
      if (!S.ended && S.wrapRequested) endSession();
      break;
    }
  }
}

/* ================= 结束与总结 ================= */
function endSession() {
  if (S.ended) return;
  S.ended = true;
  clearInterval(S.timer);
  try { S.capture && S.capture.destroy(); } catch (e) {}
  try { S.player && S.player.destroy(); } catch (e) {}
  try { S.client && S.client.close(); } catch (e) {}
  S.client = null;

  const secs = Math.round((Date.now() - S.startedAt) / 1000);
  $("sumDuration").textContent = fmtTime(secs);
  $("sumUser").textContent = `${S.userTurns} 次`;
  $("sumAi").textContent = `${S.aiTurns} 次`;
  const tip = S.lastAiFinal || "坚持每天开口几分钟，比一次练很久更有效。加油！";
  $("sumTip").textContent = tip;
  $("sumBadge").textContent = `${S.scenario.emoji} ${S.scenario.title} · ${S.difficulty.label} · ${S.minutes} 分钟`;
  showScreen("summary");
}

/* ================= 事件绑定 ================= */
initScenarioDeck();
$("btnShuffle").onclick = () => shuffleScenarios();
$("btnStart").onclick = () => { if (S.minutes) startSession(); };
$("btnEnd").onclick = () => {
  if (S.ended) return;
  if (!S.wrapRequested) {
    S.wrapRequested = true;
    setStatus("正在请 AI 小结…", "wrapping");
    sendWrapUp();
  } else {
    endSession();
  }
};
$("btnAgain").onclick = () => { startSession(); };
$("btnHome").onclick = () => { showScreen("setup"); renderSetup(); };
$("keySave").onclick = () => {
  const v = $("keyInput").value.trim();
  if (v) localStorage.setItem("gmKey", v); else localStorage.removeItem("gmKey");
  alert("已保存（仅存于本机浏览器，用于无后端直连模式）。");
};

renderSetup();
showScreen("setup");
