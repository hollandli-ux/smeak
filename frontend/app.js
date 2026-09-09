"use strict";

/* ================= 配置 ================= */
const MODEL = new URLSearchParams(location.search).get("model") || "gemini-3.1-flash-live-preview";
const VOICE = "Aoede";
const MASCOT_NAME = "晚晚";
const MASCOT_EMOJI = "🐱";

/* ================= 线性图标库（SVG） ================= */
const ICON_PATHS = {
  mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  refresh: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chev: '<polyline points="9 18 15 12 9 6"/>',
};
function icon(name, size) {
  const sz = size || 20;
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ""}</svg>`;
}
function installIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.getAttribute("data-icon");
    const size = parseInt(el.getAttribute("data-size") || "20", 10);
    if (ICON_PATHS[name]) el.innerHTML = icon(name, size);
  });
}

/* ================= 调试日志 ================= */
const DEBUG_LINES = [];
function log(msg) {
  const t = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const line = `[${t}] ${msg}`;
  DEBUG_LINES.push(line);
  if (DEBUG_LINES.length > 300) DEBUG_LINES.shift();
  console.log("[Smeak]", msg);
  const el = document.getElementById("debugLog");
  if (el) { el.textContent = DEBUG_LINES.join("\n"); el.scrollTop = el.scrollHeight; }
}
window.addEventListener("error", (e) => log("JS错误: " + e.message));
window.addEventListener("unhandledrejection", (e) => log("Promise错误: " + (e.reason && e.reason.message ? e.reason.message : e.reason)));

/* ================= 场景池（25 个，每次展示 6 个） ================= */
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
  { id: "barber", emoji: "💈", title: "理发店", en: "At the barber shop", role: "发型师", place: "一家理发店", openingEn: "Good morning! How would you like your hair cut today?" },
  { id: "supermarket", emoji: "🛒", title: "超市自助结账", en: "Self-checkout", role: "超市店员", place: "超市收银区", openingEn: "Hi! Everything okay with the self-checkout? Need a hand?" },
  { id: "postoffice", emoji: "📦", title: "邮局寄包裹", en: "Sending a parcel", role: "邮局职员", place: "邮局柜台", openingEn: "Good morning! What can I do for you today?" },
  { id: "petshop", emoji: "🐾", title: "宠物店", en: "At the pet shop", role: "宠物店员", place: "一家宠物用品店", openingEn: "Hey there! Are you looking for anything special for your pet?" },
  { id: "apartment", emoji: "🏢", title: "租房看房", en: "Viewing an apartment", role: "房东", place: "一套出租公寓", openingEn: "Hi, welcome! Come on in — let me show you around." },
  { id: "carrental", emoji: "🚗", title: "租车", en: "Renting a car", role: "租车行店员", place: "机场租车柜台", openingEn: "Welcome! What kind of car were you thinking of?" },
  { id: "customs", emoji: "🛂", title: "过海关", en: "Going through customs", role: "海关官员", place: "机场海关", openingEn: "Good evening. Could you open your bag, please? Anything to declare?" },
  { id: "subway", emoji: "🚇", title: "地铁问路", en: "Subway directions", role: "地铁站工作人员", place: "地铁站台", openingEn: "Hi! Are you headed downtown? The green line is over there." },
  { id: "performance", emoji: "📈", title: "绩效面谈", en: "Performance review", role: "你的上级", place: "公司办公室", openingEn: "Thanks for coming in — let's talk about how this year went for you." },
  { id: "resignation", emoji: "🚪", title: "离职沟通", en: "Resigning", role: "你的上级", place: "公司办公室", openingEn: "Come in and have a seat — I heard you wanted to talk?" },
  { id: "dentist", emoji: "🦷", title: "看牙医", en: "At the dentist", role: "牙医助理", place: "牙科诊所", openingEn: "Hi, please have a seat. What seems to be the problem?" },
  { id: "optician", emoji: "👓", title: "配眼镜", en: "Getting new glasses", role: "眼镜店店员", place: "眼镜店", openingEn: "Welcome! Are you looking for new glasses or an eye test?" },
  { id: "sports", emoji: "🏸", title: "约人打球", en: "Playing badminton", role: "球友", place: "周末的体育馆", openingEn: "Hey! Want to play badminton this weekend? I booked a court." },
];
const SCENARIO_CAT = {
  coffee: "life", restaurant: "life", phone: "life", shopping: "life", bank: "life",
  movie: "life", party: "life", roommate: "life", gym: "health",
  airport: "travel", hotel: "travel", taxi: "travel", directions: "travel", travel: "travel", museum: "travel",
  interview: "work", meeting: "work", presentation: "work", negotiation: "work", complaint: "work",
  doctor: "health", pharmacy: "health",
  smalltalk: "social", class: "social", free: "life",
  barber: "life", supermarket: "life", postoffice: "life", petshop: "life", apartment: "life",
  carrental: "travel", customs: "travel", subway: "travel",
  performance: "work", resignation: "work",
  dentist: "health", optician: "health",
  sports: "social",
};
const CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "life", label: "生活" },
  { id: "travel", label: "出行" },
  { id: "work", label: "职场" },
  { id: "health", label: "健康" },
  { id: "social", label: "社交" },
];

const WARMUPS = {
  coffee: [["I'd like a latte, please.", "我要一杯拿铁。"], ["For here or to go?", "在这儿喝还是带走？"]],
  airport: [["I'd like to check in for my flight.", "我想办理登机手续。"], ["Window or aisle seat?", "靠窗还是靠过道？"]],
  hotel: [["I have a reservation under Smith.", "我用 Smith 的名字订了房。"], ["What time is check-out?", "几点退房？"]],
  interview: [["I've been working in this field for three years.", "我在这个领域工作三年了。"], ["My greatest strength is...", "我最大的优势是……"]],
  smalltalk: [["What do you do for fun?", "你平时喜欢做什么？"], ["That sounds really interesting!", "那听起来很有意思！"]],
  free: [["What's been on your mind lately?", "你最近在想什么？"], ["Tell me more about that.", "多跟我说说那个。"]],
  restaurant: [["Could I see the menu, please?", "能给我看下菜单吗？"], ["I'll have the pasta.", "我要意面。"]],
  taxi: [["Could you take me to this address?", "能送我去这个地址吗？"], ["How long will it take?", "大概要多久？"]],
  shopping: [["I'd like to return this.", "我想退货。"], ["Do you have this in a larger size?", "这个有大一号的吗？"]],
  doctor: [["I've been feeling unwell since yesterday.", "我从昨天开始不舒服。"], ["Where does it hurt?", "哪里疼？"]],
  bank: [["I'd like to open an account.", "我想开个账户。"], ["What documents do I need?", "需要什么证件？"]],
  pharmacy: [["I have a bad cough.", "我咳得厉害。"], ["How often should I take this?", "这个多久吃一次？"]],
  directions: [["Excuse me, how do I get to the station?", "请问去车站怎么走？"], ["Is it far from here?", "离这儿远吗？"]],
  phone: [["I'd like to book a table for two.", "我想订两个人的位子。"], ["Could you hold on a moment?", "能稍等一下吗？"]],
  travel: [["I'm planning a trip to Kyoto.", "我在计划去京都的旅行。"], ["What's the best time to visit?", "什么时候去最好？"]],
  meeting: [["Let's start with the agenda.", "我们从议程开始吧。"], ["Could you clarify that point?", "能说明一下这一点吗？"]],
  presentation: [["Today I'll walk you through our product.", "今天我给大家介绍我们的产品。"], ["Any questions so far?", "到目前为止有问题吗？"]],
  negotiation: [["The price is a bit higher than we expected.", "价格比我们预期高一些。"], ["Can we meet in the middle?", "我们能折中一下吗？"]],
  class: [["Let's divide the work between us.", "我们分工吧。"], ["I can take the first part.", "我可以负责第一部分。"]],
  roommate: [["How should we split the bills?", "账单怎么分？"], ["Is it okay if I use the kitchen now?", "我现在用厨房可以吗？"]],
  gym: [["I'd like to sign up for a membership.", "我想办会员。"], ["What classes do you offer?", "你们都开什么课？"]],
  movie: [["What kind of movies do you like?", "你喜欢什么类型的电影？"], ["How about we catch the 7 pm show?", "我们看晚上七点那场怎么样？"]],
  complaint: [["I'd like to make a complaint.", "我要投诉。"], ["This isn't what I ordered.", "这不是我点的东西。"]],
  party: [["Are you free this Friday?", "你这周五有空吗？"], ["It's my birthday — you should come!", "我生日，你得来！"]],
  museum: [["What's the most famous piece here?", "这里最有名的展品是什么？"], ["Is photography allowed?", "可以拍照吗？"]],
  barber: [["Could you trim it a little on the sides?", "两侧稍微修短一点。"], ["How much is a haircut?", "剪头发多少钱？"]],
  supermarket: [["Where can I weigh these vegetables?", "这些蔬菜在哪里称重？"], ["Do you accept mobile payment?", "可以用手机支付吗？"]],
  postoffice: [["I'd like to send this parcel abroad.", "我想寄这个包裹到国外。"], ["How long will it take to arrive?", "多久能到？"]],
  petshop: [["I'm looking for food for my cat.", "我在找猫粮。"], ["Do you have anything for fleas?", "有除跳蚤的东西吗？"]],
  apartment: [["How much is the rent per month?", "一个月房租多少？"], ["Does it include utilities?", "包含水电费吗？"]],
  carrental: [["I'd like to rent a car for three days.", "我想租三天车。"], ["Is insurance included?", "包含保险吗？"]],
  customs: [["I have nothing to declare.", "我没有需要申报的东西。"], ["How long are you staying?", "你打算待多久？"]],
  subway: [["Which line goes to the city center?", "哪条线去市中心？"], ["Where do I transfer?", "在哪里换乘？"]],
  performance: [["I'd like to discuss my goals for next year.", "我想聊聊明年的目标。"], ["What could I improve on?", "我有哪些可以改进的？"]],
  resignation: [["I've decided to move on to a new opportunity.", "我决定去新的机会。"], ["How much notice should I give?", "我需要提前多久提出？"]],
  dentist: [["I have a toothache.", "我牙疼。"], ["Will this hurt?", "这会疼吗？"]],
  optician: [["I'd like to get my eyes tested.", "我想测一下视力。"], ["Can I see these frames?", "我能看看这些镜框吗？"]],
  sports: [["What time should we meet?", "我们几点见？"], ["I'm a bit out of practice!", "我好久没打了！"]],
};
const GOALS = [5, 10, 15, 20];
const SPEEDS = [{ v: 0.85, label: "慢速" }, { v: 1, label: "正常" }, { v: 1.15, label: "快速" }];
const VAD_MODES = [{ v: 0, label: "默认" }, { v: 1200, label: "更灵敏" }, { v: 3500, label: "更宽松" }];
const DIFFICULTIES = [
  { id: "beginner", label: "初级", desc: "简单词句 · 放慢语速 · 卡壳时中文帮一把" },
  { id: "intermediate", label: "中级", desc: "自然语速 · 明显错误才打断" },
  { id: "advanced", label: "高级", desc: "母语级表达 · 少打断，结束点评" },
];
const DURATIONS = [5, 10, 15];

function scenarioPool() {
  if (S.category === "custom") return S.customScenario ? [S.customScenario] : [];
  let base = S.category === "all"
    ? [...SCENARIOS_POOL]
    : SCENARIOS_POOL.filter((sc) => SCENARIO_CAT[sc.id] === S.category);
  return base;
}
function ensureCustomVisible() {
  if (S.category === "custom" && S.customScenario && !S.visibleScenarios.some((x) => x.id === "custom")) {
    S.visibleScenarios = [S.customScenario];
  }
}
function refreshDeck() {
  let pool = scenarioPool();
  if (!pool.length) pool = [...SCENARIOS_POOL];
  S.visibleScenarios = drawN(pool, Math.min(6, pool.length));
  if (!S.visibleScenarios.some((sc) => sc.id === S.scenario.id)) S.scenario = S.visibleScenarios[0];
}
function drawN(arr, n) {
  const a = [...arr];
  const out = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}
function initScenarioDeck() { refreshDeck(); ensureCustomVisible(); }
function shuffleScenarios() {
  let rest = scenarioPool().filter((sc) => !S.visibleScenarios.some((v) => v.id === sc.id));
  if (!rest.length) rest = [...scenarioPool()];
  S.visibleScenarios = drawN(rest, Math.min(6, rest.length));
  if (!S.visibleScenarios.some((sc) => sc.id === S.scenario.id)) S.scenario = S.visibleScenarios[0];
  renderSetup();
}
function applyCategory(cat) {
  S.category = cat;
  refreshDeck();
  renderSetup();
}

/* ================= 跟读模式提示词 ================= */
function buildRepeatInstruction(sc, diff, minutes) {
  return [
    `你是「Smeak」的跟读教练——吉祥物晚晚（🐱，一只银渐层小猫），带用户做跟读练习（这不是角色扮演）。`,
    ``,
    `【主题】围绕「${sc.title} (${sc.en})」的实用词汇和句子`,
    `【学习者水平】${diff.label}`,
    `【目标时长】约 ${minutes} 分钟`,
    ``,
    `【流程】每次只说 1 句简短英文（贴合主题、符合水平），说完用中文说"请跟我读～"；等用户跟读后：`,
    `- 读得基本正确 → 先夸一句（Great! / Perfect!），再出下一句；`,
    `- 有明显读错/发音不准 → 温和指出正确读法，可拆成半句带读，请他再读一次，然后继续；`,
    `- 用户卡壳或不会读 → 给提示、拆半句、多鼓励，不要给他压力。`,
    ``,
    `【句子难度】${diff.id === "beginner" ? "初级：每次 ≤6 词，放慢语速，先短后长" : diff.id === "intermediate" ? "中级：每次 ≤12 词" : "高级：句子可以更长更自然"}。`,
    `【教学语言】句子用英文，提示/解释可用中文。不要角色扮演、不要跑题。`,
    `【特殊信号】`,
    `- 收到 "(HINT_REQUEST)"：给一句当前该练的示范句并带读。`,
    `- 收到 "(LEARNER_SILENT)"：学习者没开口，温柔说一句示范句请他跟读。`,
    ``,
    `【结束】用户表示结束时，用 1-2 句温暖道别即可，不做长篇总结。`,
  ].join("\n");
}

/* ================= 系统提示词（人性化 + 晚晚纠错/优化） ================= */
function buildSystemInstruction(sc, diff, minutes, topic) {
  return [
    `你是「Smeak」的 AI 口语陪练。你有两种身份：`,
    `1. 场景角色：按所选场景扮演（例如${sc.role}），让学习者沉浸在真实对话里。`,
    `2. 助教晚晚（🐱，Smeak 的吉祥物——一只可爱的银渐层小猫）：只在需要指出问题时短暂出场。`,
    ``,
    `【当前设置】`,
    `场景：${sc.title} (${sc.en}) @ ${sc.place}`,
    `你的角色：${sc.role}`,
    `学习者水平：${diff.label}`,
    `目标时长：约 ${minutes} 分钟`,
    topic ? `【自定义话题】用户想聊：${topic}（请在角色扮演中自然地引导到这个话题，而不是生硬切换）` : null,
    ``,
    `【一、说话要像真人，不要像机器人/客服】`,
    `- 语气自然、温暖、有朋友感；可以带口语词（Well…, Hmm…, you know, actually），用短句，别一口气说很长。`,
    `- 学习者口语不好、说不明白、卡壳或沉默求助时，先以角色身份温柔安抚一句（"That's totally fine!" / "别急，慢慢说"），然后立刻切换成晚晚，按【二】的模板把话"递"给他（给出说法→带读→鼓励），再回到角色继续。`,
    `- 学习者用中文求助或直接说中文时：先用中文温柔安慰并给出对应的英文说法，请他试着跟读，再回到英语继续。`,
    `- 让这里成为"安全区"：犯错非常正常，永远不要批评、不要嘲笑、不要冷场，多用鼓励（Good job! / Nice! / You're doing great!）。`,
    ``,
    `【二、纠错与优化 —— 必须由晚晚完成，且发生在对话中途】`,
    `- 铁律：任何纠错或优化都必须【跳出场景角色】、切换成吉祥物晚晚来说；绝对禁止用场景角色身份点评，也绝对禁止留到对话结束时才说（结束时没有任何点评环节）。`,
    `- 什么时候切换晚晚：`,
    `  1) 纠错：学习者刚说完，出现明显影响理解的语法/用词/发音错误，或反复错同一个点，或明显卡壳说不出来时 → 立刻切晚晚纠正，不要等。`,
    `  2) 优化：学习者说得没错、但明显不自然/不地道（例如中式直译）时 → 切晚晚给 1 个更地道的说法。`,
    `  3) 互斥：同一句话有明显错误就只纠错；没错误但不地道才优化；同一个回合最多出场一次，别连环打断。`,
    `- 频率：只要"明显问题/明显卡壳"就及时出场（${diff.id === "beginner" ? "初级：几乎每次明显错误都纠正，用中文解释并带读" : diff.id === "intermediate" ? "中级：只纠正明显错误，用英文简短说明" : "高级：很少打断，仅在严重错误时用英文提醒"}）；不要因为怕打断而憋到后面。`,
    `- 晚晚出场模板（严格按顺序）：`,
    `  第1句 自我介绍："嗨，我是${MASCOT_NAME}～Smeak 的吉祥物，一只银渐层小猫，喵～"（同一次对话再次出场可简化为"是我，${MASCOT_NAME}～"）`,
    `  第2句 指出问题或给更地道的说法（简短 1-2 句；初级用中文解释并给出英文句子，中级/高级以英文为主）`,
    `  第3句 请学习者跟读一遍，听到尝试后立刻夸一句（"很棒！" / "Perfect!"）`,
    `  第4句 回到角色："好啦，我们继续～" + 一句贴合场景的话（如"服务员还等着你点单呢 😊"）`,
    `- 示例：学习者说 "I go to airport yesterday."，晚晚应立刻说："嗨，我是晚晚～……这里要用 I went to the airport yesterday，因为是昨天发生的。来，跟我读：I went to the airport yesterday。……很棒！那我们继续办理值机吧 😊" 然后继续扮演值机员。`,
    ``,
    `【特殊信号】`,
    `- 收到 "(HINT_REQUEST)"：立刻切换成晚晚，用英文给出 1-2 句"接下来可以怎么说"并附中文意思，然后回到角色继续。`,
    `- 收到 "(LEARNER_SILENT)"：学习者冷场了，请温柔主动引导他开口（给个简单问题或示范句），不要干等。`,
    ``,
    `【三、结束】`,
    `当学习者表示结束（如 "That's all for today" 或收到练习结束信号）时，只需要以场景角色用 1-2 句温暖地道别（例如 "It was great talking with you. Have a wonderful day!"），不要长篇总结，不要额外点评。`,
  ].join("\n");
}

/* ================= 音频采集（输入 16kHz） ================= */
class AudioCapture {
  constructor(onAudioBase64) {
    this.onAudioBase64 = onAudioBase64;
    this.ctx = null;
    this.node = null;
    this.stream = null;
    this.source = null;
    this.running = false;
    this.initPromise = null;
  }
  init() {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        await ctx.audioWorklet.addModule("audio-processors/capture.worklet.js");
        const node = new AudioWorkletNode(ctx, "audio-capture-processor");
        node.port.onmessage = (ev) => {
          if (!this.running) return;
          if (ev.data && ev.data.type === "audio") {
            const b64 = toPCM16Base64(ev.data.data);
            if (b64 && this.onAudioBase64) this.onAudioBase64(b64);
          }
        };
        this.ctx = ctx;
        this.node = node;
        if (ctx.state === "suspended") { try { await ctx.resume(); } catch (e) { log("采集resume失败: " + e.message); } }
        log("采集上下文: 采样率=" + ctx.sampleRate + " 状态=" + ctx.state);
      })();
    }
    return this.initPromise;
  }
  async start() {
    if (this.running) return;
    await this.init();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.stream = stream;
    if (this.ctx.state === "suspended") { try { await this.ctx.resume(); } catch (e) {} }
    const source = this.ctx.createMediaStreamSource(stream);
    source.connect(this.node);
    this.source = source;
    this.running = true;
  }
  stop() {
    this.running = false;
    try { if (this.source) this.source.disconnect(); } catch (e) {}
    try { if (this.stream) this.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    this.source = null;
    this.stream = null;
  }
  pause() {
    this.running = false;
    try { if (this.source) this.source.disconnect(); } catch (e) {}
    this.source = null;
  }
  async resume() {
    if (!this.ctx || !this.node || !this.stream) { log("麦克风不可用，无法恢复"); return; }
    if (this.ctx.state === "suspended") { try { await this.ctx.resume(); } catch (e) { log("resume失败: " + e.message); } }
    if (!this.source) {
      const source = this.ctx.createMediaStreamSource(this.stream);
      source.connect(this.node);
      this.source = source;
    }
    this.running = true;
  }
  destroy() {
    this.stop();
    try { if (this.ctx && this.ctx.state !== "closed") this.ctx.close(); } catch (e) {}
    this.ctx = null;
    this.node = null;
    this.initPromise = null;
  }
}

/* ================= 音频播放（输出 24kHz） ================= */
const OUTPUT_SAMPLE_RATE = 24000;
class AudioPlayer {
  constructor() {
    this.ctx = null;
    this.node = null;
    this.gain = null;
    this.initPromise = null;
  }
  init() {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
        await ctx.audioWorklet.addModule("audio-processors/playback.worklet.js");
        const node = new AudioWorkletNode(ctx, "pcm-processor");
        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        node.connect(gain);
        gain.connect(ctx.destination);
        this.ctx = ctx;
        this.node = node;
        this.gain = gain;
        if (ctx.state === "suspended") { try { await ctx.resume(); } catch (e) { log("播放resume失败: " + e.message); } }
        log("播放上下文: 采样率=" + ctx.sampleRate + " 状态=" + ctx.state);
      })();
    }
    return this.initPromise;
  }
  _resumeIfNeeded() {
    if (this.ctx && this.ctx.state === "suspended") { try { this.ctx.resume(); } catch (e) {} }
  }
  async play(b64) {
    await this.init();
    this._resumeIfNeeded();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const i16 = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
    const f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
    this.node.port.postMessage(f32);
  }
  async playTone() {
    await this.init();
    this._resumeIfNeeded();
    const sr = this.ctx.sampleRate || OUTPUT_SAMPLE_RATE;
    const n = Math.floor(sr * 0.45);
    const f32 = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const env = Math.max(0, Math.min(1, i / (sr * 0.02), (n - i) / (sr * 0.06)));
      f32[i] = 0.5 * Math.sin(2 * Math.PI * 440 * t) * env;
    }
    this.node.port.postMessage(f32);
  }
  setVolume(v) { if (this.gain) this.gain.gain.value = Math.max(0, Math.min(1, v)); }
  async playWithSpeed(b64, speed) {
    await this.init();
    this._resumeIfNeeded();
    let f = decodePCMToFloat(b64);
    if (speed && speed !== 1) f = upsampleAudio(f, 24000, 24000 / speed);
    this.node.port.postMessage(f);
  }
  interrupt() { if (this.node) this.node.port.postMessage("interrupt"); }
  destroy() {
    try { if (this.ctx && this.ctx.state !== "closed") this.ctx.close(); } catch (e) {}
    this.ctx = null;
    this.node = null;
    this.gain = null;
    this.initPromise = null;
  }
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
  captions: true,
  category: "all",
  mode: "chat",
  theme: "light",
  goalMinutes: 10,
  speed: 1,
  volume: 0.8,
  vadMs: 0,
  calMonth: new Date(),
  customScenario: null,
  proxyUrl: null,
  silenceTimer: null,
  silenceFired: false,
  silenceGuided: false,
  voice: VOICE,
  systemInstruction: "",
  reconnectCount: 0,
  reconnecting: false,
  captureReady: false,
  micSuspended: false,
  lastSessionId: null,
  client: null,
  capture: null,
  player: null,
  audioInit: null,
  timer: null,
  secondsLeft: 0,
  startedAt: 0,
  userTurns: 0,
  aiTurns: 0,
  audioRecv: 0,
  audioPlayed: 0,
  gotModelTurn: false,
  wrapRequested: false,
  ended: false,
  muted: false,
  replaySegments: [],
  curUserSeg: null,
  curAiSeg: null,
  replayPlaying: false,
  voicePreviewing: false,
  turnLog: [],
  userLogged: false,
  activeBubble: null,
  aiTurnText: "",
  turnHadOutputTx: false,
  audioAtTurnStart: 0,
  evCount: {},
  coachNotes: [],
  lastCoachText: "",
  turnNudge: null,
};

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

/* ================= 练习历史 / 统计 / Toast ================= */
const SESSIONS_KEY = "smeakSessions";
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch (e) { return []; }
}
function saveSessions(list) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, 50))); } catch (e) {}
}

/* ================= 对话录音：本地持久化（IndexedDB）+ 历史回听 ================= */
const AUDIO_DB = "smeak-db";
const AUDIO_STORE = "audio";
const AUDIO_CAP = 90 * 1024 * 1024;
let audioObjUrl = null;
let audioCurId = null;

function idbOpenAudio() {
  return new Promise((resolve, reject) => {
    try {
      const rq = indexedDB.open(AUDIO_DB, 1);
      rq.onupgradeneeded = () => {
        const db = rq.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE, { keyPath: "id" });
      };
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error || new Error("IndexedDB 打开失败"));
    } catch (e) { reject(e); }
  });
}
function idbTx(mode, fn) {
  return idbOpenAudio().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, mode);
    fn(tx.objectStore(AUDIO_STORE), tx);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error("IndexedDB 错误")); };
  }));
}
async function idbPutAudio(id, blob, durationSec) {
  await idbTx("readwrite", (os) => os.put({ id, blob, durationSec, savedAt: Date.now() }));
}
async function idbGetAudio(id) {
  const db = await idbOpenAudio();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, "readonly");
    const rq = tx.objectStore(AUDIO_STORE).get(id);
    rq.onsuccess = () => { db.close(); resolve(rq.result || null); };
    rq.onerror = () => { db.close(); reject(rq.error); };
  });
}
async function clearAllAudio() {
  try { await idbTx("readwrite", (os) => os.clear()); } catch (e) { log("清空录音失败: " + e.message); }
}
async function pruneAudioDB(cap) {
  try {
    const db = await idbOpenAudio();
    await new Promise((resolve) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      const os = tx.objectStore(AUDIO_STORE);
      const rows = [];
      const cur = os.openCursor();
      cur.onsuccess = () => {
        const c = cur.result;
        if (c) { rows.push({ key: c.primaryKey, size: (c.value.blob && c.value.blob.size) || 0 }); c.continue(); }
        else {
          rows.sort((x, y) => x.key - y.key);
          let total = rows.reduce((a, b) => a + b.size, 0);
          for (const r of rows) { if (total > cap) { os.delete(r.key); total -= r.size; } else break; }
        }
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch (e) {  }
}
function fmtMB(bytes) { return (bytes / (1024 * 1024)).toFixed(1) + "MB"; }

function buildSessionWavBlob(segs) {
  const SR = 24000, GAP = Math.round(SR * 0.12);
  const parts = [];
  let total = 0;
  (segs || []).forEach((seg) => {
    if (!seg || !seg.chunks || !seg.chunks.length) return;
    const raw = concatFloats(seg.chunks.map(decodePCMToFloat));
    const f = seg.spk === "user" ? upsampleAudio(raw, 16000, SR) : raw;
    parts.push(f);
    total += f.length + GAP;
  });
  if (!parts.length) return null;
  const i16 = new Int16Array(total);
  let o = 0;
  parts.forEach((f) => {
    for (let i = 0; i < f.length; i++) {
      const v = Math.max(-1, Math.min(1, f[i]));
      i16[o++] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    o += GAP;
  });
  const dataBytes = i16.length * 2;
  const buf = new ArrayBuffer(44 + dataBytes);
  const dv = new DataView(buf);
  const ws = (off, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i)); };
  ws(0, "RIFF"); dv.setUint32(4, 36 + dataBytes, true); ws(8, "WAVE");
  ws(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, SR, true); dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  ws(36, "data"); dv.setUint32(40, dataBytes, true);
  new Uint8Array(buf, 44).set(new Uint8Array(i16.buffer, 0, dataBytes));
  return new Blob([buf], { type: "audio/wav" });
}

async function saveSessionAudioAsync(id, blob, durSec) {
  try {
    await idbPutAudio(id, blob, durSec);
    await pruneAudioDB(AUDIO_CAP);
    log("本次录音已保存到本机（" + fmtMB(blob.size) + "），可在 设置→历史 里反复回听 🔊");
    toast("录音已保存，可在 设置 → 历史与数据 里回听 🔊", 3400);
  } catch (e) {
    log("录音保存失败: " + e.message);
  }
}
function stopSavedAudio() {
  const a = $("hisAudio"), bar = $("audioBar");
  if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
  if (audioObjUrl) { try { URL.revokeObjectURL(audioObjUrl); } catch (e) {} audioObjUrl = null; }
  audioCurId = null;
  if (bar) bar.classList.add("hidden");
}
async function playSavedAudio(id, title) {
  if (audioCurId === id) { stopSavedAudio(); return; }
  const a = $("hisAudio"), bar = $("audioBar"), t = $("audioBarTitle");
  if (!a || !bar) return;
  try {
    const rec = await idbGetAudio(id);
    if (!rec || !rec.blob) { toast("没有找到这段录音（可能已被清理）"); return; }
    stopSavedAudio();
    audioObjUrl = URL.createObjectURL(rec.blob);
    audioCurId = id;
    if (t) t.textContent = "🔊 " + (title || "对话录音") + " · " + fmtMB(rec.blob.size);
    a.src = audioObjUrl;
    bar.classList.remove("hidden");
    a.play().catch(() => {});
  } catch (e) {
    log("读取录音失败: " + e.message);
    toast("读取录音失败");
  }
}
function dayKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function calcStreak(list) {
  const days = new Set(list.map((x) => dayKey(new Date(x.ts))));
  let streak = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
function weekMinutes(list) {
  const cutoff = Date.now() - 7 * 864e5;
  let sec = 0;
  list.forEach((x) => { if (x.ts >= cutoff) sec += x.actualSecs || 0; });
  return Math.max(0, Math.round(sec / 60));
}
function fmtRel(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return m + " 分钟前";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " 小时前";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function renderWeekBars(list) {
  const wrap = $("weekBars");
  if (!wrap) return;
  const days = [];
  const now = new Date();
  const wd = "日一二三四五六";
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ key: dayKey(d), label: i === 0 ? "今天" : "周" + wd[d.getDay()] });
  }
  const secs = days.map((x) =>
    list.filter((z) => dayKey(new Date(z.ts)) === x.key).reduce((a, b) => a + (b.actualSecs || 0), 0)
  );
  const max = Math.max(...secs, 1);
  wrap.innerHTML = "";
  secs.forEach((sec, i) => {
    const col = el("div", "wb-col");
    col.title = `${days[i].label} ${Math.round(sec / 60)} 分钟`;
    const bar = el("div", "wb-bar" + (sec === 0 ? " zero" : ""));
    bar.style.height = Math.max(4, Math.round((sec / max) * 100)) + "%";
    const lab = el("div", "wb-label", days[i].label);
    col.appendChild(bar);
    col.appendChild(lab);
    wrap.appendChild(col);
  });
}
function renderHistory() {
  const list = loadSessions();
  const wrap = $("historyCard");
  const box = $("historyList");
  const bars = $("weekBars");
  if (!wrap || !box) return;
  if (!list.length) { wrap.classList.add("hidden"); if (bars) bars.classList.add("hidden"); return; }
  wrap.classList.remove("hidden");
  if (bars) { bars.classList.remove("hidden"); renderWeekBars(list); }
  box.innerHTML = "";
  list.slice(0, 10).forEach((x) => {
    const item = el("div", "his-item");
    const head = el("div", "his-head");
    const left = el("span", "his-left", `${x.emoji || "🎙️"} ${x.title} · ${x.difficulty || ""} · ${Math.max(1, Math.round((x.actualSecs || 0) / 60))} 分钟`);
    head.appendChild(left);
    head.appendChild(el("span", "his-time", fmtRel(x.ts)));
    item.appendChild(head);
    if (x.notes && x.notes.length) {
      const notes = el("div", "his-notes");
      x.notes.slice(0, 3).forEach((n) => notes.appendChild(el("div", "his-note", "🐱 " + n)));
      item.appendChild(notes);
    }
    if (x.audio) {
      const play = el("button", "btn-mini his-play", "🔊 回听这段");
      play.type = "button";
      play.onclick = () => playSavedAudio(x.id, `${x.emoji || "🎙️"} ${x.title} · ${x.difficulty || ""}`);
      item.appendChild(play);
    }
    box.appendChild(item);
  });
}

let toastTimer = null;
function toast(msg, ms = 2600) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("closing", "hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.add("closing");
    setTimeout(() => { t.classList.remove("closing"); t.classList.add("hidden"); }, 200);
  }, ms);
}

/* ================= 字幕开关 ================= */
function clearSilenceWatch() {
  if (S.silenceTimer) { clearTimeout(S.silenceTimer); S.silenceTimer = null; }
  S.silenceFired = false;
}
function armSilenceWatch(delayMs) {
  clearSilenceWatch();
  if (S.ended || S.wrapRequested || S.muted) return;
  S.silenceTimer = setTimeout(() => {
    S.silenceTimer = null;
    if (S.ended || S.wrapRequested || S.muted || S.silenceFired) return;
    if (!S.client || !S.client.ws || S.client.ws.readyState !== WebSocket.OPEN) return;
    if (S.silenceGuided) return;
    S.silenceFired = true;
    S.silenceGuided = true;
    log("检测到冷场，AI 主动引导（本次会话仅一次）");
    suspendMicForAi();
    S.client.sendText("(LEARNER_SILENT) 学习者有一会儿没说话了，请温柔地主动引导他：给个简单问题或示范句，帮他开口。");
  }, delayMs);
}
function clearTurnNudge() {
  if (S.turnNudge) { clearTimeout(S.turnNudge); S.turnNudge = null; }
}
function armTurnNudge(ms) {
  if (S.turnNudge) return;
  S.turnNudge = setTimeout(() => {
    S.turnNudge = null;
    if (S.ended || S.wrapRequested) return;
    if (!S.client || !S.client.ws || S.client.ws.readyState !== WebSocket.OPEN) return;
    log("兜底：AI 未回应，补发一次触发");
    try { S.client.askModelToRespond(); } catch (e) {}
  }, ms || 3000);
}
function todayMinutes(list) {
  const k = dayKey(new Date());
  return Math.round(list.filter((x) => dayKey(new Date(x.ts)) === k).reduce((a, b) => a + (b.actualSecs || 0), 0) / 60);
}
function applyVolume(pct) {
  S.volume = Math.max(0, Math.min(100, pct)) / 100;
  if (S.player) S.player.setVolume(S.volume);
  const lab = $("volLabel");
  if (lab) lab.textContent = Math.round(S.volume * 100) + "%";
}
function renderSoundSettings() {
  const speedWrap = $("speedOptions"), vadWrap = $("vadOptions"), vol = $("volRange");
  const speed = parseFloat(localStorage.getItem("smeakSpeed") || "1");
  S.speed = SPEEDS.some((x) => x.v === speed) ? speed : 1;
  const vad = parseInt(localStorage.getItem("smeakVad") || "0", 10);
  S.vadMs = VAD_MODES.some((x) => x.v === vad) ? vad : 0;
  if (speedWrap) {
    speedWrap.innerHTML = "";
    SPEEDS.forEach((x) => {
      const b = el("button", "seg-btn" + (x.v === S.speed ? " selected" : ""), x.label);
      b.type = "button";
      b.onclick = () => { localStorage.setItem("smeakSpeed", String(x.v)); S.speed = x.v; renderSetup(); };
      speedWrap.appendChild(b);
    });
  }
  if (vadWrap) {
    vadWrap.innerHTML = "";
    VAD_MODES.forEach((x) => {
      const b = el("button", "seg-btn" + (x.v === S.vadMs ? " selected" : ""), x.label);
      b.type = "button";
      b.onclick = () => { localStorage.setItem("smeakVad", String(x.v)); S.vadMs = x.v; renderSetup(); };
      vadWrap.appendChild(b);
    });
  }
  if (vol) {
    const saved = parseInt(localStorage.getItem("smeakVolume") || "80", 10);
    vol.value = saved;
    applyVolume(saved);
  }
}
function renderCalendar() {
  const grid = $("calendarGrid"), title = $("calTitle");
  if (!grid || !title) return;
  const y = S.calMonth.getFullYear(), m = S.calMonth.getMonth();
  title.textContent = `${y}年${m + 1}月`;
  const list = loadSessions();
  const today = new Date();
  const minByDay = {};
  list.forEach((x) => {
    const d = new Date(x.ts);
    if (d.getFullYear() === y && d.getMonth() === m) {
      const day = d.getDate();
      minByDay[day] = (minByDay[day] || 0) + Math.round((x.actualSecs || 0) / 60);
    }
  });
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  let html = "";
  ["一", "二", "三", "四", "五", "六", "日"].forEach((d) => { html += `<div class="cal-dow">${d}</div>`; });
  for (let i = 0; i < firstDow; i++) html += '<div class="cal-cell dim"></div>';
  for (let day = 1; day <= days; day++) {
    const min = minByDay[day] || 0;
    const isToday = y === today.getFullYear() && m === today.getMonth() && day === today.getDate();
    const isFuture = new Date(y, m, day) > today;
    let cls = "cal-cell";
    if (isFuture || isToday) cls += " has";
    let lvl = 0;
    if (min > 0) lvl = min < 10 ? 1 : min < 25 ? 2 : min < 45 ? 3 : 4;
    if (lvl > 0) cls += ` l${lvl}`;
    if (isToday) cls += " today";
    if (isFuture) cls += " dim";
    html += `<div class="${cls}" title="${min > 0 ? min + " 分钟" : "未练习"}">${day}</div>`;
  }
  grid.innerHTML = html;
}
function openReport() {
  const body = $("reportBody");
  if (!body) return;
  scheduleSyncNav();
  const list = loadSessions();
  const modal = $("reportModal");
  const mtitle = $("modalTitle");
  if (mtitle) mtitle.textContent = "📊 练习报告";
  if (!list.length) {
    body.innerHTML = "还没有练习记录，先去练一局吧！🎙️";
    layerShow(modal);
    scheduleSyncNav();
    return;
  }
  const weekStart = Date.now() - 7 * 864e5;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const mins = (arr) => Math.round(arr.reduce((a, b) => a + (b.actualSecs || 0), 0) / 60);
  const week = list.filter((x) => x.ts >= weekStart);
  const month = list.filter((x) => x.ts >= monthStart);
  const streak = calcStreak(list);
  const scenCnt = {};
  list.forEach((x) => { scenCnt[x.title] = (scenCnt[x.title] || 0) + 1; });
  const top = Object.entries(scenCnt).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const catCnt = { life: 0, travel: 0, work: 0, health: 0, social: 0 };
  list.forEach((x) => {
    const sc = SCENARIOS_POOL.find((v) => v.title === x.title);
    if (sc && SCENARIO_CAT[sc.id]) catCnt[SCENARIO_CAT[sc.id]]++;
  });
  const leastCat = Object.entries(catCnt).sort((a, b) => a[1] - b[1])[0];
  const catSamples = SCENARIOS_POOL.filter((sc) => SCENARIO_CAT[sc.id] === leastCat[0]).slice(0, 2).map((sc) => sc.title).join("、");
  const diffCnt = {};
  list.forEach((x) => { diffCnt[x.difficulty] = (diffCnt[x.difficulty] || 0) + 1; });
  const leastDiff = Object.entries(diffCnt).sort((a, b) => a[1] - b[1])[0];
  let html = `<div>🔥 连续练习 <b>${streak}</b> 天</div>`;
  html += `<div>近 7 天 <b>${mins(week)}</b> 分钟 · 本月 <b>${mins(month)}</b> 分钟 · 累计 ${list.length} 次</div>`;
  html += `<div class="m-sec"><b>常练场景 TOP3</b><ul>`;
  top.forEach(([t, c]) => { html += `<li>${t} × ${c}</li>`; });
  html += `</ul></div>`;
  html += `<div class="m-sec">💡 <b>薄弱建议</b>：「${CATEGORIES.find((c) => c.id === leastCat[0]).label}」练得最少，试试 <b>${catSamples}</b>；难度上「${leastDiff[0]}」相对少，可以多挑战一下。</div>`;
  body.innerHTML = html;
  layerShow(modal);
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem("smeakSaved") || "[]"); } catch (e) { return []; }
}
function saveSaved(arr) {
  try { localStorage.setItem("smeakSaved", JSON.stringify(arr.slice(0, 100))); } catch (e) {}
}
function renderSaved() {
  const card = $("savedCard"), box = $("savedList");
  if (!card || !box) return;
  const arr = loadSaved();
  if (!arr.length) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");
  box.innerHTML = "";
  arr.slice(0, 30).forEach((t) => {
    const li = el("div", "his-item saved-li");
    const span = el("span", "saved-txt", t);
    const rm = el("button", "star-btn", "✕");
    rm.type = "button";
    rm.title = "删除";
    rm.onclick = () => { saveSaved(loadSaved().filter((x) => x !== t)); renderSaved(); toast("已删除"); };
    li.appendChild(span);
    li.appendChild(rm);
    box.appendChild(li);
  });
}
function openSavedReview() {
  const arr = loadSaved();
  if (!arr.length) { toast("还没有收藏的表达"); return; }
  const title = $("modalTitle"), body = $("reportBody"), modal = $("reportModal");
  title.textContent = "⭐ 收藏复习";
  body.innerHTML = "<ol>" + arr.map((t) => `<li style="margin:7px 0">${t}</li>`).join("") + "</ol>";
  layerShow(modal);
  scheduleSyncNav();
}
function updateRemindUI() {
  const b = $("remindBtn");
  if (!b) return;
  b.textContent = "🔔 练习提醒：" + (S.remind ? "开" : "关");
  b.classList.toggle("on", S.remind);
}
function toggleRemind() {
  if (!S.remind) {
    if (!("Notification" in window)) { toast("此浏览器不支持通知"); return; }
    Notification.requestPermission().then((p) => {
      if (p === "granted") {
        S.remind = true;
        localStorage.setItem("smeakRemind", "1");
        updateRemindUI();
        toast("已开启：练完没达标会提醒你");
        try { new Notification("Smeak", { body: "提醒已开启！每天练到目标，口语进步看得见 💪" }); } catch (e) {}
      } else {
        toast("未获得通知权限");
      }
    });
  } else {
    S.remind = false;
    localStorage.removeItem("smeakRemind");
    updateRemindUI();
    toast("已关闭提醒");
  }
}

function openCustomModal() {
  const err = $("customError");
  if (err) { err.classList.add("hidden"); err.textContent = ""; }
  const cc = $("customClear");
  if (cc) cc.classList.toggle("hidden", !S.customScenario);
  layerShow($("customModal"));
  scheduleSyncNav();
}
async function generateCustomScenario() {
  const ta = $("customTopic"), err = $("customError");
  const topic = (ta && ta.value.trim()) || "";
  if (err) { err.classList.add("hidden"); err.textContent = ""; }
  if (!topic) { if (err) { err.textContent = "先输入一个想练的主题吧～"; err.classList.remove("hidden"); } return; }
  const btn = $("customGo");
  if (btn) { btn.disabled = true; btn.textContent = "生成中…"; }
  try {
    const resp = await apiPost("/api/scenario", { topic });
    const j = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(j.error || ("HTTP " + resp.status));
    const sc = Object.assign({}, j);
    sc.id = "custom";
    localStorage.setItem("smeakCustomScenario", JSON.stringify(sc));
    S.customScenario = sc;
    S.category = "custom";
    refreshDeck();
    S.scenario = sc;
    layerHide($("customModal"));
    renderSetup();
    toast("自定义场景已生成，去开始吧 🎉");
  } catch (e) {
    log("生成失败: " + e.message);
    if (err) { err.textContent = "生成失败：" + e.message + "（需要运行 server.py 且已配置 GEMINI_API_KEY）"; err.classList.remove("hidden"); }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "生成场景 ✨"; }
  }
}
function clearCustomScenario() {
  localStorage.removeItem("smeakCustomScenario");
  S.customScenario = null;
  if (S.category === "custom") S.category = "all";
  refreshDeck();
  ensureCustomVisible();
  renderSetup();
  layerHide($("customModal"));
  toast("已移除自定义场景");
}

function updateHomeStat() {
  const hs = $("homeStat");
  if (!hs) return;
  const list = loadSessions();
  const streak = calcStreak(list);
  const today = todayMinutes(list);
  const goal = Math.max(1, S.goalMinutes || parseInt(localStorage.getItem("smeakGoal") || "10", 10));
  hs.classList.remove("hidden");
  const sn = $("streakNum");
  if (sn) sn.textContent = String(streak);
  const fill = $("goalFill");
  if (fill) fill.style.width = Math.min(100, Math.round((today / goal) * 100)) + "%";
  const gl = $("goalLabel");
  if (gl) gl.textContent = today >= goal ? "今日目标已达成 🎉" : `今日 ${today}/${goal} 分钟`;
}
function renderGoal() {
  const wrap = $("goalOptions");
  if (!wrap) return;
  const goal = parseInt(localStorage.getItem("smeakGoal") || "10", 10);
  S.goalMinutes = goal;
  wrap.innerHTML = "";
  GOALS.forEach((m) => {
    const b = el("button", "seg-btn" + (m === goal ? " selected" : ""), m + " 分钟");
    b.type = "button";
    b.onclick = () => { localStorage.setItem("smeakGoal", String(m)); S.goalMinutes = m; renderSetup(); };
    wrap.appendChild(b);
  });
  const today = todayMinutes(loadSessions());
  const gh = $("goalHint");
  if (gh) {
    gh.textContent = today >= goal
      ? `今日目标 ${goal} 分钟已达成 ✅ 真棒！`
      : `今日已练 ${today}/${goal} 分钟，还差 ${Math.max(0, goal - today)} 分钟`;
  }
}
function renderWarmup() {
  const box = $("warmup"), list = $("warmupList");
  if (!box || !list) return;
  const items = WARMUPS[S.scenario.id] || (S.scenario.warmup && S.scenario.warmup.length ? S.scenario.warmup : null);
  if (!items || !items.length) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  list.innerHTML = "";
  items.forEach((pair) => {
    const li = el("li", "");
    li.innerHTML = `<span class="w-en">${pair[0]}</span> <span class="w-zh">${pair[1]}</span>`;
    list.appendChild(li);
  });
}
function applyTheme(t) {
  S.theme = t;
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("smeakTheme", t); } catch (e) {}
  const b = $("themeToggle");
  if (b) b.innerHTML = icon(t === "dark" ? "sun" : "moon", 19);
}
function suspendMicForAi() {
  if (S.micSuspended) return;
  S.micSuspended = true;
  if (S.capture && S.captureReady) S.capture.pause();
}
function resumeMicAfterAi() {
  if (!S.micSuspended) return;
  S.micSuspended = false;
  if (S.capture && S.captureReady && !S.muted) S.capture.resume().catch(() => {});
}

function setCaptions(on) {
  S.captions = on;
  localStorage.setItem("smeakCaptions", on ? "1" : "0");
  applyCaptionsUI();
}

function setMicUI() {
  const b = $("micToggle");
  if (!b) return;
  b.textContent = S.muted ? "🎙️ 关" : "🎙️ 开";
  b.classList.toggle("on", !S.muted);
  b.classList.toggle("muted", S.muted);
}
function setMuted(m) {
  S.muted = m;
  setMicUI();
  if (S.capture && S.captureReady) {
    if (m) S.capture.pause();
    else S.capture.resume().catch(() => toast("恢复麦克风失败"));
  }
  if (m) setStatus("已静音 · 点 🎙️ 恢复说话", "wrapping");
  else if (S.captureReady) setStatus("麦克风已恢复，直接开口即可", "ready");
}

function backendBase() {
  return (localStorage.getItem("smeakBackend") || "").trim().replace(/\/+$/, "");
}
function backendWsUrl(base) {
  try {
    const u = new URL(base.replace(/\/+$/, ""));
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = "/ws";
    return u.toString();
  } catch (e) { return ""; }
}
async function apiPost(path, payload) {
  const base = backendBase();
  const url = base ? base + path : path;
  const opts = { method: "POST" };
  if (payload !== undefined) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(payload);
  }
  return fetch(url, opts);
}

async function acquireCredential() {
  try {
    const resp = await apiPost("/api/token");
    if (resp.ok) {
      const j = await resp.json();
      if (j.token) { log("模式：后端临时令牌"); return { token: j.token, apiKey: null }; }
      log("后端未返回令牌: " + (j.error || ""));
    } else {
      log("/api/token 返回 HTTP " + resp.status);
    }
  } catch (e) {
    log("无后端令牌，走直连模式");
  }
  const apiKey = (localStorage.getItem("gmKey") || "").trim();
  if (apiKey) { log("模式：直连 Key"); return { token: null, apiKey }; }
  return null;
}
function applyCaptionsUI() {
  const session = $("screen-session");
  if (session) session.classList.toggle("captions-off", !S.captions);
  const onBtn = $("capOn"), offBtn = $("capOff");
  if (onBtn) onBtn.classList.toggle("selected", S.captions);
  if (offBtn) offBtn.classList.toggle("selected", !S.captions);
  const capHint = $("captionHint");
  if (capHint) capHint.classList.toggle("hidden", S.captions);
  const st = $("sessionCapToggle");
  if (st) { st.textContent = "字幕：" + (S.captions ? "开" : "关"); st.classList.toggle("on", S.captions); }
  const hint = $("capHint");
  if (hint) hint.textContent = S.captions
    ? "显示双方文字；想练听力可随时在对话页关掉字幕。"
    : "隐藏字幕 = 纯听力模式，更能锻炼耳朵；对话中也能随时打开。";
}

/* ================= 首页渲染 ================= */
function layerShow(el) { if (!el) return; el.classList.remove("closing", "hidden"); }
function layerHide(el, ms) {
  if (!el || el.classList.contains("hidden") || el.classList.contains("closing")) return;
  el.classList.add("closing");
  setTimeout(() => { el.classList.remove("closing"); el.classList.add("hidden"); scheduleSyncNav(); }, ms || 200);
}

function openLesson(sc) {
  S.scenario = sc;
  try { localStorage.setItem("smeakScenario", sc.id); } catch (e) {}
  renderSetup();
  const em = $("lsEmoji"), t = $("lsTitle"), en = $("lsEn"), warm = $("lsWarm"), wl = $("lsWarmList");
  if (em) em.textContent = sc.emoji;
  if (t) t.textContent = sc.title;
  if (en) en.textContent = sc.en;
  const items = WARMUPS[sc.id] || (sc.warmup && sc.warmup.length ? sc.warmup : null);
  if (warm && wl) {
    if (items && items.length) { warm.classList.remove("hidden"); wl.innerHTML = ""; items.forEach((p) => { const li = el("li", ""); li.innerHTML = `<span class="w-en">${p[0]}</span> <span class="w-zh">${p[1]}</span>`; wl.appendChild(li); }); }
    else warm.classList.add("hidden");
  }
  const sheet = $("lessonSheet"), mask = $("lessonMask");
  layerShow(sheet); layerShow(mask);
  scheduleSyncNav();
}
function closeLesson() {
  const sheet = $("lessonSheet"), mask = $("lessonMask");
  layerHide(sheet); layerHide(mask);
}
function renderSetup() {
  const startBtn = $("btnStart");
  if (startBtn) { startBtn.disabled = false; startBtn.textContent = "🎤 开始对话"; }
  const catWrap = $("categoryRow");
  if (catWrap) {
    catWrap.innerHTML = "";
    CATEGORIES.forEach((c) => {
      const chip = el("button", "chip" + (c.id === S.category ? " selected" : ""), c.label);
      chip.type = "button";
      chip.onclick = () => applyCategory(c.id);
      catWrap.appendChild(chip);
    });
    if (S.customScenario) {
      const cchip = el("button", "chip" + (S.category === "custom" ? " selected" : ""), "✨ 我的自定义");
      cchip.type = "button";
      cchip.onclick = () => applyCategory("custom");
      catWrap.appendChild(cchip);
    }
  }
  const mc = $("modeChat"), mr = $("modeRepeat");
  if (mc) mc.classList.toggle("selected", S.mode === "chat");
  if (mr) mr.classList.toggle("selected", S.mode === "repeat");
  renderGoal();
  renderSoundSettings();
  updateHomeStat();
  updateRemindUI();
  renderSaved();
  const tb = $("themeToggle");
  if (tb) tb.innerHTML = icon(S.theme === "dark" ? "sun" : "moon", 19);
  const grid = $("scenarioGrid");
  grid.innerHTML = "";
  const kw = (($("searchInput") && $("searchInput").value) || "").trim().toLowerCase();
  const clearBtn = $("searchClear");
  if (clearBtn) clearBtn.classList.toggle("hidden", !kw);
  const shufBtn = $("btnShuffle");
  if (shufBtn) shufBtn.classList.toggle("hidden", !!kw);
  const cards = kw
    ? scenarioPool().filter((sc) => sc.title.toLowerCase().includes(kw) || sc.en.toLowerCase().includes(kw))
    : (S.visibleScenarios || SCENARIOS_POOL.slice(0, 6));
  if (!cards.length) {
    const empty = el("p", "hint", "没有匹配的场景，换个关键词试试～");
    empty.style.gridColumn = "1 / -1";
    grid.appendChild(empty);
  }
  cards.forEach((sc) => {
    const cat = SCENARIO_CAT[sc.id] || "other";
    const card = el("button", "lesson" + (sc.id === S.scenario.id ? " selected" : ""));
    card.type = "button";
    card.innerHTML = `<span class="node cat-${cat}">${sc.emoji}</span>
      <span class="lesson-txt"><span class="lesson-title">${sc.title}</span><span class="lesson-en">${sc.en}</span></span>`;
    card.onclick = () => openLesson(sc);
    grid.appendChild(card);
  });

  const diffWrap = $("difficultyOptions");
  diffWrap.innerHTML = "";
  DIFFICULTIES.forEach((d) => {
    const b = el("button", "seg-btn" + (d.id === S.difficulty.id ? " selected" : ""), d.label);
    b.type = "button";
    b.title = d.desc;
    b.onclick = () => { S.difficulty = d; localStorage.setItem("smeakDifficulty", d.id); renderSetup(); };
    diffWrap.appendChild(b);
  });

  const durWrap = $("durationOptions");
  durWrap.innerHTML = "";
  DURATIONS.forEach((m) => {
    const b = el("button", "seg-btn" + (m === S.minutes ? " selected" : ""), `${m} 分钟`);
    b.type = "button";
    b.onclick = () => { S.minutes = m; localStorage.setItem("smeakMinutes", String(m)); renderSetup(); };
    durWrap.appendChild(b);
  });

  $("roleHint").textContent = `${S.scenario.emoji} ${S.scenario.role} @ ${S.scenario.place} · ${S.difficulty.label} · ${S.minutes} 分钟`;
  const dd = $("diffDesc");
  if (dd) dd.textContent = S.difficulty.desc;
  $("keyInput").value = localStorage.getItem("gmKey") || "";
  $("backendInput").value = localStorage.getItem("smeakBackend") || "";
  const savedVoice = localStorage.getItem("smeakVoice");
  if (savedVoice) $("voiceSelect").value = savedVoice;
  applyCaptionsUI();
  renderHistory();
  const cc = $("customClear");
  if (cc) cc.classList.toggle("hidden", !S.customScenario);
}

/* ================= 屏幕切换 ================= */
const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
let navTimer = null, navIgnore = false;
function scheduleSyncNav() {
  if (navTimer) return;
  navTimer = setTimeout(() => { navTimer = null; syncNav(); }, 0);
}
function navHasSlot() { if (IS_NATIVE) return false; try { return !!(history.state && history.state.smeak); } catch (e) { return false; } }
function navPushSlot() { if (IS_NATIVE) return; try { history.pushState({ smeak: 1 }, ""); } catch (e) {} }
function navPopSlot() {
  if (IS_NATIVE || !navHasSlot()) return;
  navIgnore = true;
  try { history.back(); } catch (e) { navIgnore = false; }
}
function navDesired() {
  const vis = (id) => { const e = document.getElementById(id); return !!(e && !e.classList.contains("hidden")); };
  const act = (id) => { const e = document.getElementById(id); return !!(e && e.classList.contains("active")); };
  return vis("customModal") || vis("reportModal") || vis("lessonSheet") || vis("settingsDrawer")
      || act("screen-session") || act("screen-summary");
}
function syncNav() {
  if (navDesired() && !navHasSlot()) navPushSlot();
  else if (!navDesired() && navHasSlot()) navPopSlot();
}
function handleBackCore() {
  const vis = (id) => { const e = document.getElementById(id); return !!(e && !e.classList.contains("hidden")); };
  const act = (id) => { const e = document.getElementById(id); return !!(e && e.classList.contains("active")); };
  try {
    if (vis("customModal")) { const b = $("customClose"); if (b) b.click(); else layerHide($("customModal")); return true; }
    if (vis("reportModal")) { const b = $("reportClose"); if (b) b.click(); else layerHide($("reportModal")); return true; }
    if (vis("lessonSheet")) { const m = $("lessonMask"); if (m) m.click(); else closeLesson(); return true; }
    if (vis("settingsDrawer")) { const m = $("drawerMask"); if (m) m.click(); return true; }
    if (act("screen-summary")) { animateToHome(); return true; }
    if (act("screen-session")) { setTimeout(() => { try { if (typeof endSession === "function") endSession(); } catch (e) {} }, 30); return true; }
  } catch (e) {  }
  return false;
}
function navBack() { if (handleBackCore()) scheduleSyncNav(); }
window.addEventListener("popstate", () => {
  if (navIgnore) { navIgnore = false; scheduleSyncNav(); return; }
  navBack();
});
function initNativeBack() {
  if (!IS_NATIVE) return;
  try {
    const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!App) return;
    App.addListener("backButton", () => {
      if (!handleBackCore()) {
        try { if (App.exitApp) App.exitApp(); else if (App["exitApp"]) App["exitApp"](); } catch (e) {}
      }
    });
    log("原生返回监听已启用");
  } catch (e) { log("返回监听注册失败: " + e.message); }
}

function currentActiveScreen() {
  return ["screen-setup", "screen-session", "screen-summary"]
    .map((id) => document.getElementById(id))
    .find((e) => e && e.classList.contains("active")) || null;
}
function animateToHome() {
  stopSavedAudio();
  const cur = currentActiveScreen();
  if (cur && cur.id === "screen-summary") {
    cur.classList.add("leaving");
    setTimeout(() => {
      cur.classList.remove("leaving");
      showScreen("setup");
      renderSetup();
    }, 150);
  } else {
    showScreen("setup");
    renderSetup();
  }
}

function showScreen(name) {
  const nxt = $(`screen-${name}`);
  if (!nxt) return;
  ["setup", "session", "summary"].forEach((n) => {
    const el = $(`screen-${n}`);
    if (el && el !== nxt && el.classList.contains("active")) el.classList.remove("active");
  });
  nxt.classList.add("active");
  nxt.classList.remove("screen-enter");
  void nxt.offsetWidth;
  nxt.classList.add("screen-enter");
  scheduleSyncNav();
}

/* ================= 会话界面 ================= */
function resetSessionUI() {
  const tx = $("transcript");
  Array.from(tx.children).forEach((c) => { if (c.id !== "captionHint") c.remove(); });
  $("sessionBadge").textContent = `${S.scenario.emoji} ${S.scenario.title} · ${S.difficulty.label}`;
  setStatus("正在连接 AI…", "connecting");
  $("timerText").textContent = fmtTime(S.minutes * 60);
  S.activeBubble = null;
  S.userTurns = 0;
  S.aiTurns = 0;
  S.audioRecv = 0;
  S.audioPlayed = 0;
  S.gotModelTurn = false;
  S.wrapRequested = false;
  S.ended = false;
  S.muted = false;
  S.replaySegments = [];
  S.curUserSeg = null;
  S.curAiSeg = null;
  S.replayPlaying = false;
  S.voicePreviewing = false;
  S.turnLog = [];
  S.userLogged = false;
  clearSilenceWatch();
  S.reconnectCount = 0;
  S.reconnecting = false;
  S.captureReady = false;
  S.aiTurnText = "";
  S.turnHadOutputTx = false;
  S.audioAtTurnStart = 0;
  S.evCount = {};
  S.coachNotes = [];
  S.lastCoachText = "";
  applyCaptionsUI();
  setMicUI();
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

function addBubble(kind, text) {
  const row = el("div", `bubble-row ${kind === "user" ? "user" : "ai"}`);
  const whoTxt = kind === "user" ? "你" : kind === "coach" ? `🐱 ${MASCOT_NAME}` : `${S.scenario.emoji} ${S.scenario.role}`;
  const who = el("div", "bubble-who" + (kind === "coach" ? " coach" : ""), whoTxt);
  const bub = el("div", `bubble ${kind === "user" ? "user" : kind === "coach" ? "coach" : "ai"}`);
  bub.textContent = text || "…";
  row.appendChild(who);
  row.appendChild(bub);
  $("transcript").appendChild(row);
  S.activeBubble = { kind, el: bub };
  scrollTranscript();
}

function scrollTranscript() {
  const t = $("transcript");
  t.scrollTop = t.scrollHeight;
}

function upsertBubble(kind, text, finished) {
  if (!S.captions) return;
  if (!S.activeBubble || S.activeBubble.kind !== kind) addBubble(kind, "");
  S.activeBubble.el.textContent = text;
  if (finished) S.activeBubble = null;
  scrollTranscript();
}

function cleanCoachText(text) {
  return (text || "").replace(/【[^】]*】/g, "").replace(/^[\s:：\-—]+/, "").trim();
}

function mergeTranscript(existing, incoming) {
  if (!incoming) return existing || "";
  if (!existing) return incoming;
  if (incoming.startsWith(existing)) return incoming;
  if (existing.endsWith(incoming)) return existing;
  const sep = /[\s]$/.test(existing) || /^[\s.,!?;:，。！？；：'"-]/.test(incoming) ? "" : " ";
  return existing + sep + incoming;
}

/* ================= 计时 ================= */
function startCountdown(totalSeconds) {
  S.secondsLeft = totalSeconds;
  const timerEl = $("timerText");
  timerEl.textContent = fmtTime(totalSeconds);
  clearInterval(S.timer);
  S.timer = setInterval(() => {
    S.secondsLeft--;
    timerEl.textContent = fmtTime(Math.max(0, S.secondsLeft));
    $("timer").classList.toggle("warn", S.secondsLeft <= 30 && S.secondsLeft > 0);
    if (S.secondsLeft <= 0 && !S.wrapRequested && !S.ended) {
      S.wrapRequested = true;
      setStatus("时间到，正在道别…", "wrapping");
      sendFarewell();
    }
  }, 1000);
}

function sendFarewell() {
  log("发送道别请求");
  suspendMicForAi();
  S.client && S.client.sendText(
    "(Time is up / I need to stop here.) Thank you for the conversation. Please say a warm goodbye in character in 1-2 sentences only — no summary, no feedback. Thanks!"
  );
  setTimeout(() => { if (!S.ended) endSession(); }, 12000);
}

/* ================= 会话主流程 ================= */
async function startSession() {
  closeLesson();
  try { if (typeof closeDrawer === "function") closeDrawer(); } catch (e) {}
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
  const sb = $("btnStart");
  if (sb) { sb.disabled = true; sb.textContent = "连接中…"; }
  showScreen("session");
  resetSessionUI();
  S.silenceGuided = false;
  setStatus("正在连接语音 AI…", "connecting");
  log(`开始会话：${S.mode === "repeat" ? "跟读" : "对话"} / ${S.scenario.title} / ${S.difficulty.label} / ${S.minutes} 分钟 / 字幕${S.captions ? "开" : "关"}`);
  S.startedAt = Date.now();

  S.player = new AudioPlayer();
  S.capture = new AudioCapture((b64) => {
    if (S.client) S.client.sendAudioBase64(b64);
    if (S.curUserSeg) S.curUserSeg.chunks.push(b64);
  });

  S.audioInit = Promise.allSettled([S.player.init(), S.capture.init()]).then((rs) => {
    log("播放初始化: " + (rs[0].status === "fulfilled" ? "OK" : "FAIL " + (rs[0].reason || "")));
    log("采集初始化: " + (rs[1].status === "fulfilled" ? "OK" : "FAIL " + (rs[1].reason || "")));
    if (S.player) S.player.setVolume(S.volume);
  });

  const backendBaseUrl = backendBase();
  let cred = null;
  if (backendBaseUrl) {
    S.proxyUrl = backendWsUrl(backendBaseUrl);
    log("模式：后端中转 " + backendBaseUrl);
  } else {
    cred = await acquireCredential();
    if (!cred) {
      await S.audioInit;
      showScreen("setup");
      renderSetup();
      toast("还没有连接后端：本机版在「连接」填 API Key；手机/远程版填「后端地址」");
      return;
    }
    S.proxyUrl = null;
  }

  const topic = ($("topicInput") && $("topicInput").value.trim()) || "";
  if (topic) log("自定义话题: " + topic);
  const voice = ($("voiceSelect") && $("voiceSelect").value) || VOICE;
  log("音色: " + voice);
  S.voice = voice;
  S.systemInstruction = (S.mode === "repeat")
    ? buildRepeatInstruction(S.scenario, S.difficulty, S.minutes)
    : buildSystemInstruction(S.scenario, S.difficulty, S.minutes, topic);

  const client = S.proxyUrl
    ? new GeminiLiveClient({
        proxyUrl: S.proxyUrl, model: MODEL, voice, vadMs: S.vadMs,
        systemInstruction: S.systemInstruction, onEvent: handleLiveEvent,
      })
    : new GeminiLiveClient({
        token: cred.token, apiKey: cred.apiKey, model: MODEL, voice, vadMs: S.vadMs,
        systemInstruction: S.systemInstruction, onEvent: handleLiveEvent,
      });
  S.client = client;

  try {
    await client.connect();
    log("WebSocket 已打开，等待 AI setupComplete…");
  } catch (err) {
    log("连接失败: " + err.message);
    setStatus("连接失败，请重试或检查连接设置", "wrapping");
    const rb = $("retryBtn");
    if (rb) rb.classList.remove("hidden");
    toast("连接失败：" + (err.message || "网络异常"));
  }
}

function cleanupAfterFail() {
  clearInterval(S.timer);
  try { if (S.capture) S.capture.destroy(); } catch (e) {}
  try { if (S.player) S.player.destroy(); } catch (e) {}
  try { if (S.client) S.client.close(); } catch (e) {}
  S.client = null; S.capture = null; S.player = null; S.audioInit = null;
  S.captureReady = false; S.ended = false; S.reconnectCount = 0;
}

function handleLiveEvent(r) {
  if (S.ended) return;
  S.evCount[r.type] = (S.evCount[r.type] || 0) + 1;
  if (r.type === LIVE_RESP.OUTPUT_TRANSCRIPTION && S.evCount[LIVE_RESP.OUTPUT_TRANSCRIPTION] === 1) log("开始收到 AI 输出转写");
  if (r.type === LIVE_RESP.INPUT_TRANSCRIPTION && S.evCount[LIVE_RESP.INPUT_TRANSCRIPTION] === 1) log("开始收到你的输入转写");
  switch (r.type) {
    case LIVE_RESP.SETUP_COMPLETE: {
      log("AI 会话就绪 (setupComplete)");
      S.reconnecting = false;
      if (!S.timer) startCountdown(S.minutes * 60);
      ensureMic();
      armSilenceWatch(8000);
      break;
    }
    case LIVE_RESP.SPEECH_START: {
      clearTurnNudge();
      clearSilenceWatch();
      S.userLogged = false;
      setStatus("正在听你说…", "listening");
      if (S.captions && (!S.activeBubble || S.activeBubble.kind !== "user")) addBubble("user", "…");
      if (!S.curUserSeg && !S.muted) S.curUserSeg = { chunks: [], spk: "user" };
      break;
    }
    case LIVE_RESP.SPEECH_END: {
      if (S.captions && S.activeBubble && S.activeBubble.kind === "user") {
        if (S.activeBubble.el.textContent === "…") S.activeBubble.el.textContent = "🎤（语音已收到）";
        S.activeBubble = null;
      }
      flushUserSeg();
      if (!S.userLogged) S.turnLog.push({ who: "你", text: "（语音）" });
      S.userTurns++;
      clearTurnNudge();
      armTurnNudge(3000);
      break;
    }
    case LIVE_RESP.INPUT_TRANSCRIPTION: {
      setStatus("正在听你说…", "listening");
      const it = r.data.text || "";
      if (it && S.captions) upsertBubble("user", it, r.data.finished);
      if (r.data.finished && it && it.trim()) {
        const last = S.turnLog[S.turnLog.length - 1];
        if (last && last.who === "你" && last.text === "（语音）") last.text = it.trim();
        else S.turnLog.push({ who: "你", text: it.trim() });
        S.userLogged = true;
      }
      if (r.data.finished) { clearTurnNudge(); armTurnNudge(3000); }
      break;
    }
    case LIVE_RESP.OUTPUT_TRANSCRIPTION: {
      const inc = r.data.text || "";
      S.aiTurnText = mergeTranscript(S.aiTurnText, inc);
      const text = S.aiTurnText;
      const isCoach = text.indexOf(MASCOT_NAME) >= 0;
      if (S.evCount[LIVE_RESP.OUTPUT_TRANSCRIPTION] === 1 && r.data.raw) log("outputTx原始: " + r.data.raw);
      if (text && !S.gotModelTurn) {
        S.gotModelTurn = true;
        clearTurnNudge();
        log("收到 AI 文字: " + text.slice(0, 60) + "…");
      }
      setStatus(isCoach ? `${MASCOT_NAME} 来了 🐱` : "AI 正在说…", "speaking");
      S.turnHadOutputTx = true;
      if (S.captions) upsertBubble(isCoach ? "coach" : "ai", text || "…", false);
      if (r.data.finished) {
        log("AI字幕回合结束 len=" + text.length + " :: " + (text || "(空)").slice(0, 40));
        if (text && text.trim()) S.turnLog.push({ who: isCoach ? "晚晚 🐱" : S.scenario.role, text: text.trim() });
        if (text && text.trim() && isCoach) {
          const note = cleanCoachText(text);
          if (note && note !== S.lastCoachText) {
            S.coachNotes.push(note);
            S.lastCoachText = note;
            log("晚晚记录 +1");
          }
        }
        S.aiTurnText = "";
        S.turnHadOutputTx = false;
        if (S.captions && S.activeBubble && S.activeBubble.kind !== "user") S.activeBubble = null;
      }
      break;
    }
    case LIVE_RESP.TEXT: {
      const inc = r.data || "";
      if (!inc) break;
      S.aiTurnText = mergeTranscript(S.aiTurnText, inc);
      const text = S.aiTurnText;
      if (text && !S.gotModelTurn) { S.gotModelTurn = true; log("收到 AI 文字(TEXT): " + text.slice(0, 60) + "…"); }
      if (!S.turnHadOutputTx && S.captions) upsertBubble(text.indexOf(MASCOT_NAME) >= 0 ? "coach" : "ai", text || "…", false);
      break;
    }
    case LIVE_RESP.AUDIO: {
      clearTurnNudge();
      S.audioRecv++;
      S.gotModelTurn = true;
      if (!S.curAiSeg) S.curAiSeg = { chunks: [], spk: "ai" };
      S.curAiSeg.chunks.push(r.data);
      if (S.audioRecv === 1) log("收到第 1 段 AI 音频");
      if (S.player) {
        S.player.playWithSpeed(r.data, S.speed).then(() => { S.audioPlayed++; }).catch((e) => log("音频播放失败: " + e.message));
      } else {
        log("收到音频但播放器未初始化");
      }
      break;
    }
    case LIVE_RESP.INTERRUPTED: {
      clearTurnNudge();
      if (S.player) S.player.interrupt();
      flushAiSeg();
      S.aiTurnText = "";
      S.turnHadOutputTx = false;
      resumeMicAfterAi();
      setStatus("你可以说了（直接开口即可）", "ready");
      break;
    }
    case LIVE_RESP.TURN_COMPLETE: {
      clearTurnNudge();
      flushAiSeg();
      if (S.audioRecv > S.audioAtTurnStart) S.aiTurns++;
      S.audioAtTurnStart = S.audioRecv;
      S.aiTurnText = "";
      S.turnHadOutputTx = false;
      resumeMicAfterAi();
      if (S.activeBubble && S.activeBubble.kind !== "user") S.activeBubble = null;
      setStatus("你可以说了（直接开口即可）", "ready");
      if (S.wrapRequested) endSession();
      else armSilenceWatch(8000);
      break;
    }
    case LIVE_RESP.GOAWAY: {
      log("服务器 goAway: " + r.data);
      break;
    }
    case LIVE_RESP.RAW: {
      log("未识别消息: " + r.data);
      break;
    }
    case LIVE_RESP.ERROR: {
      log("连接错误: " + r.data);
      if (!S.ended) {
        if (S.wrapRequested) endSession();
        else handleDisconnect("连接出错");
      }
      break;
    }
    case LIVE_RESP.CLOSE: {
      if (!S.ended) {
        log("WebSocket 已关闭: " + r.data);
        if (S.wrapRequested) endSession();
        else handleDisconnect("连接已断开");
      }
      break;
    }
  }
}

/* ================= 回放 ================= */
function flushUserSeg() {
  if (S.curUserSeg) { if (S.curUserSeg.chunks.length) S.replaySegments.push(S.curUserSeg); S.curUserSeg = null; }
}
function flushAiSeg() {
  if (S.curAiSeg) { if (S.curAiSeg.chunks.length) S.replaySegments.push(S.curAiSeg); S.curAiSeg = null; }
}
function decodePCMToFloat(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
  const f = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) f[i] = i16[i] / 32768;
  return f;
}
function concatFloats(arrs) {
  let total = 0;
  arrs.forEach((x) => { total += x.length; });
  const out = new Float32Array(total);
  let o = 0;
  arrs.forEach((x) => { out.set(x, o); o += x.length; });
  return out;
}
function upsampleAudio(f, from, to) {
  if (from === to) return f;
  const ratio = to / from;
  const n = Math.floor(f.length * ratio);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i / ratio;
    const i0 = Math.floor(p);
    const i1 = Math.min(f.length - 1, i0 + 1);
    const frac = p - i0;
    out[i] = f[i0] * (1 - frac) + f[i1] * frac;
  }
  return out;
}
async function playReplay() {
  const segs = S.replaySegments || [];
  if (!segs.length) { toast("本次没有可回放的内容"); return; }
  if (S.replayPlaying) return;
  S.replayPlaying = true;
  const btn = $("btnReplay");
  if (btn) { btn.disabled = true; btn.textContent = "⏸ 回放中…"; }
  const p = new AudioPlayer();
  try {
    await p.init();
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      let f = null;
      try {
        const raw = concatFloats(seg.chunks.map(decodePCMToFloat));
        f = seg.spk === "user" ? upsampleAudio(raw, 16000, 24000) : raw;
      } catch (e) { log("回放解码失败: " + e.message); }
      if (f && f.length) {
        p.node.port.postMessage(new Float32Array(2400));
        p.node.port.postMessage(f);
        await new Promise((r) => setTimeout(r, 150 + Math.round((f.length / 24000) * 1000)));
      } else {
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    toast("回放结束");
  } catch (e) {
    log("回放失败: " + e.message);
    toast("回放失败");
  } finally {
    S.replayPlaying = false;
    try { p.destroy(); } catch (e) {}
    if (btn) { btn.disabled = false; btn.textContent = "🔊 回放本次录音"; }
  }
}

/* ================= 音色试听 / 导出 ================= */
function downloadText(name, text, mime) {
  try {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (e) { log("导出失败: " + e.message); toast("导出失败"); }
}
async function previewVoice() {
  const btn = $("voicePreview");
  if (S.voicePreviewing) return;
  S.voicePreviewing = true;
  if (btn) { btn.disabled = true; btn.textContent = "试听中…"; }
  const voice = ($("voiceSelect") && $("voiceSelect").value) || VOICE;
  let player = null, client = null;
  try {
    const cred = await acquireCredential();
    if (!cred) { toast("未配置 Key，无法试听"); return; }
    log("试听音色: " + voice);
    player = new AudioPlayer();
    await player.init();
    await new Promise((resolve, reject) => {
      let done = false;
      let gotAudio = false;
      const sys = "You are a voice demo. When you receive VOICE_SAMPLE, speak ONLY this one line naturally: \"Hi! I'm Wanwan, your speaking partner from Smeak. Nice to meet you!\"";
      client = new GeminiLiveClient({
        token: cred.token, apiKey: cred.apiKey, model: MODEL, voice,
        systemInstruction: sys,
        onEvent: (r) => {
          if (r.type === LIVE_RESP.AUDIO) { gotAudio = true; if (player) player.play(r.data).catch(() => {}); }
          else if (r.type === LIVE_RESP.SETUP_COMPLETE) { if (client) client.sendText("VOICE_SAMPLE"); }
          else if ((gotAudio && r.type === LIVE_RESP.TURN_COMPLETE) || r.type === LIVE_RESP.ERROR || r.type === LIVE_RESP.CLOSE) {
            if (!done) { done = true; resolve(); }
          }
        },
      });
      client.connect().catch(reject);
      setTimeout(() => { if (!done) { done = true; resolve(); } }, 9000);
    });
    toast("试听完成");
  } catch (e) {
    log("试听失败: " + e.message);
    toast("试听失败，请查看调试日志");
  } finally {
    try { if (client) client.close(); } catch (e) {}
    try { if (player) player.destroy(); } catch (e) {}
    S.voicePreviewing = false;
    if (btn) { btn.disabled = false; btn.textContent = "🔊 试听"; }
  }
}
function exportSessionText() {
  const head =
    `Smeak 练习记录\n` +
    `时间：${new Date().toLocaleString("zh-CN")}\n` +
    `场景：${S.scenario.emoji} ${S.scenario.title} · ${S.difficulty.label} · ${S.mode === "repeat" ? "跟读" : "对话"}\n` +
    `--------------------------------\n`;
  let body = "";
  S.turnLog.forEach((t) => { body += `${t.who}：${t.text}\n`; });
  if (!body) body = "（本次没有可导出的文字记录——练习时开启字幕会记录得更完整）\n";
  const ts = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const name = `Smeak-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}.txt`;
  downloadText(name, head + body);
  toast("已导出对话文本");
}
function exportHistoryJson() {
  const list = loadSessions();
  if (!list.length) { toast("暂无历史可导出"); return; }
  downloadText(`Smeak-history-${Date.now()}.json`, JSON.stringify(list, null, 2), "application/json;charset=utf-8");
  toast("已导出历史数据");
}

/* ================= 连接恢复 / 麦克风 / 打字 ================= */
async function ensureMic() {
  if (!S.capture) return;
  if (S.muted) { setStatus("已静音 · 点 🎙️ 恢复说话", "wrapping"); return; }
  try {
    if (S.captureReady) {
      await S.capture.resume();
    } else {
      await S.audioInit;
      await S.capture.start();
      S.captureReady = true;
    }
    log("麦克风已就绪 —— 请直接说话开始练习");
    setStatus("准备好了！请直接说第一句，例如 Hi! / Hello!", "ready");
  } catch (e) {
    log("麦克风启动失败: " + e.message);
    toast("无法访问麦克风：请在浏览器地址栏允许麦克风权限后重试");
    endSession();
  }
}

function handleDisconnect(msg) {
  if (S.ended || S.wrapRequested) return;
  if (S.reconnecting) return;
  if (S.reconnectCount >= 2) {
    toast(msg + "，未能自动恢复");
    endSession();
    return;
  }
  S.reconnecting = true;
  S.reconnectCount++;
  if (S.capture) S.capture.pause();
  log(`连接中断，自动重连 #${S.reconnectCount}（${msg}）`);
  setStatus(`连接断开，正在重连（${S.reconnectCount}/2）…`, "connecting");
  reconnectSession();
}

async function reconnectSession() {
  try {
    const cred = await acquireCredential();
    if (!cred) throw new Error("无法获取连接凭证");
    const client = S.proxyUrl
      ? new GeminiLiveClient({
          proxyUrl: S.proxyUrl, model: MODEL, voice: S.voice, vadMs: S.vadMs,
          systemInstruction: S.systemInstruction, onEvent: handleLiveEvent,
        })
      : new GeminiLiveClient({
          token: cred.token, apiKey: cred.apiKey, model: MODEL, voice: S.voice, vadMs: S.vadMs,
          systemInstruction: S.systemInstruction, onEvent: handleLiveEvent,
        });
    S.client = client;
    await client.connect();
    log("重连 WebSocket 已打开，等待 setupComplete…");
  } catch (e) {
    log("重连失败: " + e.message);
    if (S.reconnectCount < 2 && !S.ended) {
      S.reconnecting = false;
      handleDisconnect("重连失败");
    } else if (!S.ended) {
      toast("连接已断开，未能自动恢复");
      endSession();
    }
  }
}

function sendTyped() {
  const inp = $("textInput");
  const text = (inp && inp.value.trim()) || "";
  if (!text) return;
  if (!S.client || !S.client.ws || S.client.ws.readyState !== WebSocket.OPEN) {
    toast("当前未连接，稍后再试");
    return;
  }
  suspendMicForAi();
  S.client.sendText(text);
  S.turnLog.push({ who: "你", text });
  if (S.captions) {
    if (S.activeBubble && S.activeBubble.kind === "user") S.activeBubble = null;
    addBubble("user", text);
    S.activeBubble = null;
  }
  clearSilenceWatch();
  S.userTurns++;
  log("打字发送: " + text.slice(0, 40));
  setStatus("已发送，等 AI 回应…", "ready");
  if (inp) inp.value = "";
}

/* ================= 结束与总结 ================= */
function endSession() {
  if (S.ended) return;
  S.ended = true;
  clearInterval(S.timer);
  clearSilenceWatch();
  flushUserSeg();
  flushAiSeg();
  try { S.capture && S.capture.destroy(); } catch (e) {}
  try { S.player && S.player.destroy(); } catch (e) {}
  try { S.client && S.client.close(); } catch (e) {}
  S.client = null;
  const ec = S.evCount;
  log(`会话结束：收到音频 ${S.audioRecv} 段 / 播放 ${S.audioPlayed} 段 / 你发言 ${S.userTurns} 次`);
  log(`事件统计: setup=${ec[LIVE_RESP.SETUP_COMPLETE] || 0} audio=${ec[LIVE_RESP.AUDIO] || 0} inputTx=${ec[LIVE_RESP.INPUT_TRANSCRIPTION] || 0} outputTx=${ec[LIVE_RESP.OUTPUT_TRANSCRIPTION] || 0} text=${ec[LIVE_RESP.TEXT] || 0} turn=${ec[LIVE_RESP.TURN_COMPLETE] || 0}`);

  const secs = Math.round((Date.now() - S.startedAt) / 1000);
  $("sumDuration").textContent = fmtTime(secs);
  $("sumUser").textContent = `${S.userTurns} 次`;
  $("sumAi").textContent = `${S.aiTurns} 次`;
  $("sumBadge").textContent = `${S.scenario.emoji} ${S.scenario.title} · ${S.difficulty.label} · ${S.minutes} 分钟`;

  const list = $("coachNotes");
  list.innerHTML = "";
  if (S.coachNotes.length) {
    S.coachNotes.forEach((n) => {
      const li = el("li", "");
      const span = el("span", "saved-txt", n);
      const savedArr = loadSaved();
      const btn = el("button", "star-btn", savedArr.includes(n) ? "⭐" : "☆");
      btn.type = "button";
      btn.title = "收藏 / 取消收藏";
      btn.onclick = () => {
        const arr = loadSaved();
        const idx = arr.indexOf(n);
        if (idx >= 0) arr.splice(idx, 1); else arr.unshift(n);
        saveSaved(arr);
        btn.textContent = arr.includes(n) ? "⭐" : "☆";
        toast(arr.includes(n) ? "已收藏 ⭐" : "已取消收藏");
        renderSaved();
      };
      li.appendChild(span);
      li.appendChild(btn);
      list.appendChild(li);
    });
  } else {
    const li = el("li", "empty", "这轮没有需要特别纠正或优化地方，说得不错，继续保持！");
    list.appendChild(li);
  }

  const mins = Math.max(1, Math.round(secs / 60));
  $("sumTip").textContent =
    `今天你开口练了 ${mins} 分钟，已经比昨天的自己更进一步了。` +
    `口语进步靠的是"每天一点点"，不是一次练很久。` +
    (S.coachNotes.length ? `\n\n把上面晚晚提到的 ${S.coachNotes.length} 个点记下来，下次练的时候用上，你会看到变化 💪` : `\n\n下次可以试试更难一点点的场景或难度。`);

  if (S.userTurns > 0 || S.aiTurns > 0 || S.audioRecv > 0) {
    S.lastSessionId = Date.now();
    const rec = {
      id: S.lastSessionId, ts: S.lastSessionId, emoji: S.scenario.emoji, title: S.scenario.title,
      difficulty: S.difficulty.label, minutes: S.minutes, actualSecs: secs,
      userTurns: S.userTurns, aiTurns: S.aiTurns, notes: S.coachNotes.slice(0, 5),
    };
    const all = loadSessions();
    all.unshift(rec);
    saveSessions(all);
    if (S.replaySegments && S.replaySegments.length) {
      try {
        const blob = buildSessionWavBlob(S.replaySegments);
        if (blob && blob.size >= 2048) {
          rec.audio = true;
          rec.durationSec = Math.max(1, Math.round(blob.size / 48000));
          saveSessions(all);
          saveSessionAudioAsync(rec.id, blob, rec.durationSec);
        }
      } catch (e) { log("录音生成失败: " + e.message); }
    }
  }
  const allSessions = loadSessions();
  const srEl = $("sumStreak");
  if (srEl) {
    if (allSessions.length) {
      srEl.textContent = `🔥 已连续练习 ${calcStreak(allSessions)} 天 · 近 7 天共 ${weekMinutes(allSessions)} 分钟`;
      srEl.classList.remove("hidden");
    } else {
      srEl.classList.add("hidden");
    }
  }
  if (S.remind && "Notification" in window && Notification.permission === "granted" && S.userTurns > 0) {
    const todayMin = todayMinutes(allSessions);
    if (todayMin < S.goalMinutes) {
      try {
        new Notification("Smeak · 差一点就达标", { body: `今日已练 ${todayMin}/${S.goalMinutes} 分钟，还差 ${S.goalMinutes - todayMin} 分钟 💪` });
      } catch (e) {}
    }
  }
  showScreen("summary");
}

/* ================= 测试音 ================= */
async function playTestTone() {
  log("▶ 播放测试音…");
  try {
    const p = new AudioPlayer();
    await p.init();
    await p.playTone();
    log("测试音已发送到扬声器 —— 你听到“嘟”的一声了吗？");
  } catch (e) {
    log("测试音失败: " + e.message);
    toast("测试音失败：" + e.message);
  }
}

/* ================= 事件绑定 ================= */
function bindEvents() {
  initScenarioDeck();
  const sd = localStorage.getItem("smeakDifficulty");
  if (sd) { const d = DIFFICULTIES.find((x) => x.id === sd); if (d) S.difficulty = d; }
  const sm = parseInt(localStorage.getItem("smeakMinutes") || "0", 10);
  if (DURATIONS.includes(sm)) S.minutes = sm;
  const smode = localStorage.getItem("smeakMode");
  if (smode === "chat" || smode === "repeat") S.mode = smode;
  $("btnShuffle").onclick = () => shuffleScenarios();
  function handleStartClick() {
    if (!S.minutes) return;
    startSession();
  }
  $("btnStart").onclick = () => { handleStartClick(); };
  const rb = $("retryBtn");
  if (rb) rb.onclick = () => { rb.classList.add("hidden"); cleanupAfterFail(); startSession(); };
  $("btnEnd").onclick = () => {
    if (S.ended) return;
    if (!S.wrapRequested) {
      S.wrapRequested = true;
      setStatus("正在道别…", "wrapping");
      sendFarewell();
    } else {
      endSession();
    }
  };
  $("btnAgain").onclick = () => { startSession(); };
  const rp = $("btnReplay");
  if (rp) rp.onclick = () => {
    if (S.lastSessionId) {
      const hit = loadSessions().find((x) => x.id === S.lastSessionId);
      if (hit && hit.audio) { playSavedAudio(S.lastSessionId, `${hit.emoji || "🎙️"} ${hit.title}`); return; }
    }
    playReplay();
  };
  $("btnHome").onclick = () => { animateToHome(); };
  $("keySave").onclick = () => {
    const v = $("keyInput").value.trim();
    if (v) localStorage.setItem("gmKey", v); else localStorage.removeItem("gmKey");
    toast("已保存（仅存于本机浏览器）");
  };
  $("backendSave").onclick = () => {
    const v = $("backendInput").value.trim();
    if (v) localStorage.setItem("smeakBackend", v); else localStorage.removeItem("smeakBackend");
    toast("后端地址已保存（重开会话生效）");
  };
  const hc = $("historyClear");
  if (hc) hc.onclick = () => {
    if (window.confirm("确定清空全部练习历史吗？录音也会一并删除。")) {
      localStorage.removeItem(SESSIONS_KEY);
      stopSavedAudio();
      clearAllAudio();
      toast("已清空练习历史与录音");
      renderSetup();
    }
  };
  $("modeChat").onclick = () => { S.mode = "chat"; localStorage.setItem("smeakMode", "chat"); renderSetup(); };
  $("modeRepeat").onclick = () => { S.mode = "repeat"; localStorage.setItem("smeakMode", "repeat"); renderSetup(); };
  const openDrawer = () => {
    const d = $("settingsDrawer"), m = $("drawerMask");
    layerShow(d); layerShow(m);
    scheduleSyncNav();
  };
  const closeDrawer = () => {
    const d = $("settingsDrawer"), m = $("drawerMask");
    layerHide(d); layerHide(m);
  };
  $("settingsBtn").onclick = openDrawer;
  $("drawerClose").onclick = closeDrawer;
  $("drawerMask").onclick = closeDrawer;
  $("lessonMask").onclick = closeLesson;
  $("lsClose").onclick = closeLesson;
  const abc = $("audioBarClose");
  if (abc) abc.onclick = stopSavedAudio;
  $("themeToggle").onclick = () => applyTheme(S.theme === "dark" ? "light" : "dark");
  $("voicePreview").onclick = () => previewVoice();
  $("historyExport").onclick = () => exportHistoryJson();
  $("btnExport").onclick = () => exportSessionText();
  const vr = $("volRange");
  if (vr) vr.addEventListener("input", () => {
    const v = parseInt(vr.value, 10);
    localStorage.setItem("smeakVolume", String(v));
    applyVolume(v);
  });
  $("calendarBtn").onclick = () => {
    const w = $("calendarWrap");
    w.classList.toggle("hidden");
    if (!w.classList.contains("hidden")) renderCalendar();
  };
  $("calPrev").onclick = () => { S.calMonth = new Date(S.calMonth.getFullYear(), S.calMonth.getMonth() - 1, 1); renderCalendar(); };
  $("calNext").onclick = () => { S.calMonth = new Date(S.calMonth.getFullYear(), S.calMonth.getMonth() + 1, 1); renderCalendar(); };
  $("reportBtn").onclick = () => openReport();
  $("reportClose").onclick = () => layerHide($("reportModal"));
  const si = $("searchInput");
  if (si) si.addEventListener("input", () => renderSetup());
  $("searchClear").onclick = () => { $("searchInput").value = ""; renderSetup(); };
  $("customBtn").onclick = () => openCustomModal();
  $("customClose").onclick = () => layerHide($("customModal"));
  $("customGo").onclick = () => generateCustomScenario();
  $("customClear").onclick = () => clearCustomScenario();
  $("savedReview").onclick = () => openSavedReview();
  $("savedClear").onclick = () => {
    if (window.confirm("清空全部收藏吗？")) { localStorage.removeItem("smeakSaved"); renderSaved(); toast("已清空收藏"); }
  };
  $("remindBtn").onclick = () => toggleRemind();
  $("micToggle").onclick = () => setMuted(!S.muted);
  $("btnTextToggle").onclick = () => {
    const row = $("textRow");
    row.classList.toggle("hidden");
    if (!row.classList.contains("hidden")) $("textInput").focus();
  };
  $("textSend").onclick = () => sendTyped();
  $("textInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); sendTyped(); }
  });
  $("capOn").onclick = () => setCaptions(true);
  $("capOff").onclick = () => setCaptions(false);
  $("sessionCapToggle").onclick = () => setCaptions(!S.captions);
  const voiceSel = $("voiceSelect");
  if (voiceSel) voiceSel.onchange = () => { localStorage.setItem("smeakVoice", voiceSel.value); log("音色已切换为 " + voiceSel.value + "（下次会话生效）"); };
  $("btnTestSound").onclick = () => playTestTone();
  const fab = $("debugFab");
  if (fab) fab.onclick = () => $("debugPanel").classList.remove("hidden");
  $("debugClose").onclick = () => $("debugPanel").classList.add("hidden");
}

/* ================= 初始化 ================= */
S.captions = localStorage.getItem("smeakCaptions") !== "0";
S.theme = localStorage.getItem("smeakTheme") === "dark" ? "dark" : "light";
S.remind = localStorage.getItem("smeakRemind") === "1";
try {
  const cs = JSON.parse(localStorage.getItem("smeakCustomScenario") || "null");
  if (cs && cs.title) S.customScenario = cs;
} catch (e) {}
applyTheme(S.theme);
bindEvents();
installIcons();
renderSetup();
showScreen("setup");
log("页面已加载，欢迎使用 Smeak 🎙️");
scheduleSyncNav();
initNativeBack();
if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
  navigator.serviceWorker.register("sw.js").catch((e) => log("SW注册失败: " + e.message));
}
const splashEl = $("splash");
if (splashEl) {
  setTimeout(() => {
    splashEl.classList.add("hide");
    setTimeout(() => { splashEl.style.display = "none"; }, 520);
  }, 1500);
}
