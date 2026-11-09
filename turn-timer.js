/* Turn Timer: a silent, shared countdown for reading groups.
   The coach runs the clock on turn-timer.html#coach. Each student's screen
   shows the same countdown and tells them when their turn is coming.
   No names travel over the relay: students pick a turn NUMBER, and the
   coach's turn labels stay on the coach's own computer.
   Any games-site page can show the timer as a small floating card with:
     <script src="turn-timer.js" data-float></script>                      */
(function(){
"use strict";
var RELAY = "wss://broker.emqx.io:8084/mqtt";      // free public MQTT relay (same as Fernbrook)
var TOPIC = "aa-turn-timer/v1/room/";
var MQTT_SRC = "https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js";
var LETTERS = "BCDFGHJKLMNPRSTVWXZ";                // no vowels, so a code never spells a word
var NO_BC = /[?&]nobc\b/.test(location.search);     // test switch: prove the relay alone carries it
var me = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

var THEMES = {
  cat:    {who:"🐈", goal:"🐟", done:"Nom nom!",      lines:["Fish… fish… fish…","Tiptoe, tiptoe","Are we there yet?","I smell lunch!","Is that a laser dot?"]},
  snail:  {who:"🐌", goal:"🍃", done:"Crunch!",       lines:["Slow and steady…","Zoooom (slowly)","Nice shell, right?","Almost there… not really","Leaf, I'm coming!"]},
  rocket: {who:"🚀", goal:"🌙", done:"Moon landing!", lines:["Wave at the stars!","Beep boop","Space is BIG","Is that a comet?","Next stop: Moon"], spin:true},
  dog:    {who:"🐕", goal:"🦴", done:"Chomp!",        lines:["Sniff sniff","Was that a squirrel?","Wag wag wag","Bone, here I come!","Who's a good reader?"]},
  turtle: {who:"🐢", goal:"🏖️", done:"Beach day!",   lines:["Paddle paddle","Sandy toes soon","Shell-ebrate!","Who's faster? Me.","Surf's up… soon"]}
};

function store(k, v){ try{ if(v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); }catch(e){ return null; } }
function newCode(){ var s = ""; for(var i = 0; i < 4; i++) s += LETTERS[Math.floor(Math.random() * LETTERS.length)]; return s; }
function fmt(ms){ var s = Math.ceil(Math.max(0, ms) / 1000); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

/* ---------- relay ---------- */
function loadMqtt(cb){
  if(typeof mqtt !== "undefined") return cb(true);
  var s = document.querySelector("script[data-tt-mqtt]"), done = false;
  if(!s){ s = document.createElement("script"); s.src = MQTT_SRC; s.async = true; s.setAttribute("data-tt-mqtt", ""); document.head.appendChild(s); }
  function fin(){ if(!done){ done = true; cb(typeof mqtt !== "undefined"); } }
  s.addEventListener("load", fin); s.addEventListener("error", fin);
  setTimeout(fin, 9000);
}

function Room(code, h){
  var self = {code:code, status:"connecting", closed:false}, sock = null, bc = null;
  var stateT = TOPIC + code, hiT = TOPIC + code + "/hi", xT = TOPIC + code + "/x";   // x = partner moves inside games
  function setStatus(s){ if(self.status !== s){ self.status = s; if(h.onStatus) h.onStatus(s); } }
  function deliver(raw){
    var m; try{ m = JSON.parse(raw); }catch(e){ return; }
    if(!m || m.from === me) return;
    if(m.kind === "state" && h.onState) h.onState(m);
    if(m.kind === "hi" && h.onHi) h.onHi(m);
    if(m.kind === "x" && h.onX) h.onX(m);
  }
  if(!NO_BC){ try{ bc = new BroadcastChannel("aa-turn-timer-" + code); bc.onmessage = function(e){ deliver(e.data); }; }catch(e){} }
  loadMqtt(function(ok){
    if(self.closed) return;
    if(!ok){ setStatus("blocked"); return; }
    try{
      sock = mqtt.connect(RELAY, {clientId:"tt_" + me.slice(0, 14), clean:true, reconnectPeriod:3000, connectTimeout:7000, keepalive:30});
      sock.on("connect", function(){
        sock.subscribe([stateT, hiT, xT], {qos:0}, function(err){ setStatus(err ? "blocked" : "open"); if(!err && h.onOpen) h.onOpen(); });
      });
      sock.on("message", function(t, p){ deliver(p.toString()); });
      sock.on("error", function(){ if(self.status !== "open") setStatus("blocked"); });
      sock.on("offline", function(){ setStatus("reconnecting"); });
    }catch(e){ setStatus("blocked"); }
    setTimeout(function(){ if(self.status === "connecting") setStatus("blocked"); }, 11000);
  });
  self.send = function(kind, obj, retain){
    obj.kind = kind; obj.from = me;
    var raw = JSON.stringify(obj);
    try{ if(bc) bc.postMessage(raw); }catch(e){}
    try{ if(sock && sock.connected) sock.publish(kind === "hi" ? hiT : kind === "x" ? xT : stateT, raw, {qos:0, retain:!!retain}); }catch(e){}
  };
  self.close = function(){ self.closed = true; try{ if(bc) bc.close(); }catch(e){} try{ if(sock) sock.end(true); }catch(e){} };
  return self;
}

/* ---------- styles ---------- */
var CSS = [
".tt{--tt-bg:#fffaf0;--tt-ink:#2a2233;--tt-muted:#6b6275;--tt-line:#eadfcb;--tt-track:#f3e8d3;--tt-mine:#e3f6e8;--tt-mineInk:#1f6b35;--tt-next:#fff1c9;--tt-nextInk:#7a5600;--tt-done:#ece6ff;--tt-btn:#5b3fc4;--tt-btnInk:#fff;",
"font-family:'Atkinson Hyperlegible',system-ui,sans-serif;color:var(--tt-ink);background:var(--tt-bg);border:1px solid var(--tt-line);border-radius:20px;box-sizing:border-box;transition:background .4s}",
"@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .tt{--tt-bg:#1d1828;--tt-ink:#efeaf7;--tt-muted:#b3aac3;--tt-line:#3a3150;--tt-track:#2b2440;--tt-mine:#173822;--tt-mineInk:#8fe0a6;--tt-next:#3a2f12;--tt-nextInk:#f4d27a;--tt-done:#2e2650;--tt-btn:#9d86ff;--tt-btnInk:#160f2b}}",
":root[data-theme=dark] .tt{--tt-bg:#1d1828;--tt-ink:#efeaf7;--tt-muted:#b3aac3;--tt-line:#3a3150;--tt-track:#2b2440;--tt-mine:#173822;--tt-mineInk:#8fe0a6;--tt-next:#3a2f12;--tt-nextInk:#f4d27a;--tt-done:#2e2650;--tt-btn:#9d86ff;--tt-btnInk:#160f2b}",
".tt *{box-sizing:border-box}",
".tt[hidden]{display:none!important}",
".tt.tone-mine{background:var(--tt-mine)} .tt.tone-next{background:var(--tt-next)} .tt.tone-done{background:var(--tt-done)}",
".tt button{font:inherit;cursor:pointer}",
".tt-full{padding:22px;display:flex;flex-direction:column;gap:14px}",
".tt-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}",
".tt-chip{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:1px solid var(--tt-line);border-radius:999px;padding:3px 10px;color:var(--tt-muted)}",
".tt-link{background:none;border:none;color:var(--tt-btn);text-decoration:underline;font-size:14px;padding:2px 4px}",
".tt-track{position:relative;height:96px;background:var(--tt-track);border-radius:16px;overflow:visible}",
".tt-goal,.tt-who{position:absolute;bottom:14px;font-size:52px;line-height:1}",
".tt-goal{left:12px}",
".tt-who{left:calc(12px + (1 - var(--p,0)) * (100% - 24px - 1.1em));transition:left .25s linear}",
".tt-face{display:inline-block}",
".tt-spin .tt-face{transform:rotate(-135deg)}",
".tt-hurry .tt-face{animation:tt-wig .35s ease-in-out infinite alternate}",
".tt-spin.tt-hurry .tt-face{animation:tt-wigr .35s ease-in-out infinite alternate}",
"@keyframes tt-wig{from{transform:rotate(-8deg) translateY(0)}to{transform:rotate(8deg) translateY(-6px)}}",
"@keyframes tt-wigr{from{transform:rotate(-143deg)}to{transform:rotate(-127deg)}}",
".tt-arrive .tt-goal{animation:tt-bounce .6s ease-in-out 3}",
"@keyframes tt-bounce{50%{transform:translateY(-14px) scale(1.15)}}",
".tt-bub{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;white-space:nowrap;font-size:14px;font-weight:700;background:var(--tt-bg);border:1px solid var(--tt-line);border-radius:12px;padding:3px 9px;opacity:0;transition:opacity .3s;pointer-events:none}",
".tt-bub.on{opacity:1}",
".tt-time{font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;font-size:72px;line-height:1;font-variant-numeric:tabular-nums;text-align:center}",
".tt-msg{font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;font-size:30px;line-height:1.15;text-align:center;text-wrap:balance}",
".tt.tone-mine .tt-msg{color:var(--tt-mineInk)} .tt.tone-next .tt-msg{color:var(--tt-nextInk)}",
".tt-sub{text-align:center;color:var(--tt-muted);font-size:18px;text-wrap:balance}",
".tt-warn{text-align:center;color:var(--tt-nextInk);font-size:15px}",
".tt-flash{animation:tt-flash 0.9s ease-in-out 3}",
"@keyframes tt-flash{50%{box-shadow:0 0 0 8px var(--tt-btn)}}",
/* join form */
".tt-join{display:flex;flex-direction:column;gap:12px;align-items:stretch}",
".tt-title{font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;font-size:28px;text-align:center}",
".tt-code{font:800 34px 'Baloo 2',system-ui,sans-serif;letter-spacing:.3em;text-align:center;text-transform:uppercase;width:100%;border:2px solid var(--tt-line);border-radius:14px;padding:6px;background:var(--tt-bg);color:var(--tt-ink)}",
".tt-q{font-weight:700;text-align:center}",
".tt-turns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}",
".tt-turns button{min-width:56px;font-size:22px;font-weight:700;border:2px solid var(--tt-line);border-radius:14px;padding:8px 12px;background:var(--tt-bg);color:var(--tt-ink)}",
".tt-turns button[aria-pressed=true]{border-color:var(--tt-btn);background:var(--tt-btn);color:var(--tt-btnInk)}",
".tt-turns button.tt-ns{font-size:16px}",
".tt-go{font-size:22px;font-weight:700;border:none;border-radius:999px;padding:12px 24px;background:var(--tt-btn);color:var(--tt-btnInk)}",
".tt-err{color:var(--tt-nextInk);text-align:center;min-height:1.2em}",
".tt-me{font-size:30px;line-height:1}",
".tt-act{display:flex;flex-direction:column;gap:10px;align-items:center}",
".tt-act:empty{display:none}",
".tt-open{display:inline-block;text-decoration:none;font:800 22px 'Baloo 2',system-ui,sans-serif;background:var(--tt-btn);color:var(--tt-btnInk);border-radius:999px;padding:12px 26px;text-align:center}",
".tt-float .tt-open{font-size:16px;padding:7px 14px}",
".tt-cue{font-weight:700;font-size:20px;text-align:center;text-wrap:balance}",
".tt-part{font-family:'Atkinson Hyperlegible',system-ui,sans-serif;font-size:34px;line-height:1.5;font-weight:700;text-align:center;background:var(--tt-track);border-radius:16px;padding:18px 22px;width:100%;text-wrap:pretty}",
".tt-of{font-size:14px;color:var(--tt-muted)}",
".tt-sharedwait .tt-track,.tt-sharedwait .tt-time{display:none}",
".tt-avs button{font-size:34px;min-width:64px;padding:6px 10px}",
".tt-float .tt-avs button{font-size:24px;min-width:46px}",
".tt-float .tt-me{font-size:22px}",
/* floating card for game pages */
".tt-float{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(300px,calc(100vw - 24px));padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 6px 24px rgba(0,0,0,.18)}",
".tt-float .tt-track{height:52px;border-radius:12px}",
".tt-float .tt-goal,.tt-float .tt-who{font-size:30px;bottom:9px}",
".tt-float .tt-time{font-size:34px}",
".tt-float .tt-msg{font-size:19px}",
".tt-float .tt-sub{font-size:14px}",
".tt-float .tt-title{font-size:20px}",
".tt-float .tt-code{font-size:24px}",
".tt-float .tt-turns button{min-width:40px;font-size:17px;padding:5px 9px}",
".tt-float .tt-go{font-size:17px;padding:8px 16px}",
".tt-float .tt-bub{font-size:12px}",
".tt-min{margin-left:auto;border:1px solid var(--tt-line);background:var(--tt-bg);color:var(--tt-ink);border-radius:10px;padding:0 10px;font-size:18px;line-height:28px}",
".tt-pill{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;border-radius:999px;padding:8px 16px;font:800 20px 'Baloo 2',system-ui,sans-serif;font-variant-numeric:tabular-nums;box-shadow:0 6px 24px rgba(0,0,0,.18)}",
"@media (prefers-reduced-motion:reduce){.tt *{animation:none!important;transition:none!important}}"
].join("\n");
function injectCss(){
  if(document.getElementById("tt-css")) return;
  var s = document.createElement("style"); s.id = "tt-css"; s.textContent = CSS; document.head.appendChild(s);
  if(!document.querySelector('link[href*="Baloo+2"]')){
    var l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Baloo+2:wght@600;800&display=swap";
    document.head.appendChild(l);
  }
}

/* ---------- what a student sees ---------- */
/* Every student has one animal for the year. Only animals travel over the
   relay; which child is which animal lives only on the coach's computer. */
var AVATARS = ["🦊","🐸","🐼","🦄","🐯","🐨","🐵","🐧","🦉","🐙","🦋","🐢","🦁","🐰","🐻","🐷","🐮","🐔","🦖","🐳","🐬","🦈","🐝","🐞","🦜","🦩","🦒","🐘","🦔","🦦","🦥","🐿️","🦝","🐹","🐲","🦕","🐠","🦀","🐌","🦓","🦘","🐊","🦚","🐺","🐑","🐫"];

/* Today's practice: the coach picks one; every student's page offers it. */
var ACTS = {
  signs:  {name:"Read the Signs", url:"read-the-signs.html", icon:"🚦"},
  trail:  {name:"Fluency Trail",  url:"fluency-home.html",   icon:"🥾"},
  words:  {name:"Word Stage",     url:"word-stage.html",     icon:"🎭"},
  parts:  {name:"Word Parts (partners)", url:"word-parts.html", icon:"🧩"},
  shared: {name:"Shared Reading", url:"turn-timer.html",     icon:"📖"}
};
function onPage(url){ var p = location.pathname.split("/").pop() || "index.html"; return p === url; }

function together(list){ return list.join(" + ") + (list.length > 1 ? " are" : " is"); }
function words(st, my, remaining, stale){
  var out = {big:"", sub:"", tone:"work"};
  if(!st){ out.big = "Waiting for your coach's timer…"; out.sub = "Keep working. It will show up here."; return out; }
  var t = st.t || [], cur = t[st.i] || [], nxt = t[st.i + 1] || [];
  var mine = !!my && cur.indexOf(my) >= 0, isNext = !!my && nxt.indexOf(my) >= 0, at = -1;
  t.forEach(function(turn, k){ if(my && turn.indexOf(my) >= 0) at = k; });
  if(st.ph === "wait" && st.act === "shared"){ out.big = "Shared Reading 📖"; out.sub = ""; }
  else if(st.ph === "wait"){ out.big = "Get ready!"; out.sub = "Your coach will start the timer soon."; }
  else if(st.ph === "done"){ out.big = "Practice is over! 🎉"; out.sub = "Come back to Zoom for share-out."; out.tone = "done"; }
  else if(st.ph === "turn"){
    if(mine){ out.big = my + " It's your turn! Unmute 🎤"; out.sub = "Read with your coach. Have fun!"; out.tone = "mine"; }
    else if(isNext && remaining <= 60000){ out.big = my + " You're next up! 👀"; out.sub = "Finish what you're doing and get ready to unmute."; out.tone = "next"; }
    else {
      out.big = "Keep practicing!";
      out.sub = cur.length ? together(cur) + " reading with your coach." : "Your coach is reading with a group.";
      if(at > st.i) out.sub += " Your turn is coming.";
      if(at >= 0 && at < st.i) out.sub += " You already had your turn. Nice reading!";
    }
    if(!st.run) out.sub += " (Timer is paused.)";
  }
  else if(st.ph === "switch"){
    if(st.i >= t.length - 1){ out.big = "Time's up!"; out.sub = "Your coach will tell you what's next."; }
    else if(isNext){ out.big = my + " Switch! You're up 🎤"; out.sub = "Unmute when your coach calls you."; out.tone = "next"; }
    else { out.big = "Switch!"; out.sub = "Keep working. " + nxt.join(" + ") + " " + (nxt.length > 1 ? "are" : "is") + " next."; }
  }
  if(stale && st.ph !== "done") out.warn = "Can't reach your coach's timer right now. Keep working and watch Zoom.";
  return out;
}

function mountStudent(host, opts){
  opts = opts || {};
  injectCss();
  var isFloat = !!opts.float, preview = !!opts.preview;
  var saved = preview ? {code:"", av:""} : (store("tt-join2") || {code:"", av:""});
  var hash = (location.hash || "").replace("#", "").toUpperCase();
  var fromLink = !preview && /^[A-Z]{4}$/.test(hash);
  if(fromLink && saved.code !== hash) saved = {code:hash, av:""};
  var recent = saved.at && Date.now() - saved.at < 90 * 60000;

  var root = document.createElement("div");
  root.className = "tt " + (isFloat ? "tt-float" : "tt-full");
  root.setAttribute("role", "region"); root.setAttribute("aria-label", "Turn timer");
  host.appendChild(root);
  var pill = null;
  if(isFloat){ pill = document.createElement("button"); pill.type = "button"; pill.className = "tt tt-pill"; pill.hidden = true; pill.setAttribute("aria-label", "Show the turn timer"); host.appendChild(pill); }

  var room = null, st = null, lastMsg = 0, localEnd = 0, prevKey = "", collapsed = !!(isFloat && store("tt-collapsed") !== false);
  var view = "code";   // code → pick → main
  var bubUntil = 0, nextBub = Date.now() + 12000, bubText = "", hiTimer = null, tickTimer = null, autoMain = recent && !!saved.av;
  var minBtn = isFloat ? '<button type="button" class="tt-min" aria-label="Hide">–</button>' : "";

  function showCode(){
    view = "code"; if(isFloat) collapsed = false;   // not joined yet: show the join form, not a bubble
    if(room){ room.close(); room = null; }
    root.className = "tt " + (isFloat ? "tt-float" : "tt-full");
    root.innerHTML = '<div class="tt-top"><span class="tt-title">Turn Timer ⏳</span>' + minBtn + '</div>' +
      '<div class="tt-join"><label class="tt-q" for="tt-code-in">Room code from your coach</label>' +
      '<input id="tt-code-in" class="tt-code" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + esc(saved.code || "") + '">' +
      '<button type="button" class="tt-go">Next</button><div class="tt-err" aria-live="polite"></div></div>';
    var inp = root.querySelector(".tt-code");
    inp.addEventListener("input", function(){ inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4); });
    function go(){
      if(inp.value.length !== 4){ root.querySelector(".tt-err").textContent = "The code has 4 letters."; return; }
      if(inp.value !== saved.code) saved = {code:inp.value, av:""};
      connect();
    }
    root.querySelector(".tt-go").addEventListener("click", go);
    inp.addEventListener("keydown", function(e){ if(e.key === "Enter") go(); });
    wireMin();
  }

  function showPick(){
    view = "pick"; if(isFloat) collapsed = false;
    var g = (st && st.g) || [];
    root.className = "tt " + (isFloat ? "tt-float" : "tt-full");
    root.innerHTML = '<div class="tt-top"><span class="tt-title">Turn Timer ⏳</span>' + minBtn + '</div>' +
      '<div class="tt-join">' + (g.length
        ? '<div class="tt-q">Tap your animal</div><div class="tt-turns tt-avs">' +
          g.map(function(a){ return '<button type="button" data-a="' + esc(a) + '" aria-label="' + esc(a) + '">' + esc(a) + '</button>'; }).join("") + '</div>'
        : '<div class="tt-q">Finding your coach\'s timer…</div>') +
      '<div class="tt-err" aria-live="polite">' + (room && room.status === "blocked" ? "This network may be blocking the timer. Tell your coach." : "") + '</div>' +
      '<button type="button" class="tt-link tt-change">Different room code</button></div>';
    root.querySelectorAll(".tt-avs button").forEach(function(b){
      b.addEventListener("click", function(){ saved.av = b.dataset.a; saved.at = Date.now(); store("tt-join2", saved); showMain(); });
    });
    root.querySelector(".tt-change").addEventListener("click", showCode);
    wireMin();
  }

  function showMain(){
    view = "main";
    root.innerHTML =
      '<div class="tt-top">' + (preview ? '<span class="tt-chip">What students see</span>' :
        '<span class="tt-me" aria-label="Your animal">' + esc(saved.av) + '</span><span class="tt-chip">Room ' + esc(saved.code) + '</span><button type="button" class="tt-link tt-change">change</button>') +
        minBtn + '</div>' +
      '<div class="tt-track" aria-hidden="true"><span class="tt-goal"></span><span class="tt-who"><span class="tt-face"></span><span class="tt-bub"></span></span></div>' +
      '<div class="tt-time" aria-hidden="true">–:––</div><div class="tt-msg" aria-live="polite"></div><div class="tt-sub"></div><div class="tt-warn"></div><div class="tt-act"></div>';
    var ch = root.querySelector(".tt-change"); if(ch) ch.addEventListener("click", function(){ saved.av = ""; showPick(); });
    wireMin(); prevKey = ""; render(); sayHi();
    (changed || []).forEach(function(f){ try{ f(); }catch(e){} });
  }

  function wireMin(){
    if(!isFloat) return;
    var m = root.querySelector(".tt-min");
    if(m) m.addEventListener("click", function(){ collapsed = true; store("tt-collapsed", true); applyCollapse(); });
    applyCollapse();
  }
  function applyCollapse(){ if(!isFloat) return; root.hidden = collapsed; pill.hidden = !collapsed; }
  if(pill) pill.addEventListener("click", function(){ collapsed = false; store("tt-collapsed", false); applyCollapse(); });

  var changed = [], xs = [];
  function onState(m){
    if(!m || m.v !== 2) return;
    var hadGroup = st && (st.g || []).join("");
    st = m; lastMsg = Date.now(); localEnd = Date.now() + (m.ms || 0);
    var inGroup = saved.av && (m.g || []).indexOf(saved.av) >= 0;
    if(view === "pick"){
      if(autoMain && inGroup){ autoMain = false; showMain(); }
      else if(hadGroup !== (m.g || []).join("")) showPick();
    } else if(view === "main" && !preview && !inGroup){ saved.av = ""; showPick(); }
    else if(view === "main") render();
    changed.forEach(function(f){ try{ f(); }catch(e){} });
  }

  function connect(){
    store("tt-join2", saved);
    st = null; lastMsg = 0;
    if(room) room.close();
    room = Room(saved.code, {onState:onState, onX:function(m){ xs.forEach(function(f){ try{ f(m); }catch(e){} }); }, onStatus:function(){ if(view === "pick") showPick(); else render(); }, onOpen:sayHi});
    showPick();
    clearInterval(hiTimer); hiTimer = setInterval(sayHi, 10000);
  }
  function sayHi(){ if(room && view === "main" && saved.av) room.send("hi", {a:saved.av}, false); }

  function render(){
    if(view !== "main") return;
    var now = Date.now(), stale = !preview && st && lastMsg && (now - lastMsg > 90000 || (room && room.status !== "open" && now - lastMsg > 15000));
    var remaining = !st ? 0 : (st.ph === "turn" && st.run ? Math.max(0, localEnd - now) : (st.ms || 0));
    if(st && st.ph === "wait") remaining = st.dur;
    if(st && st.ph === "turn" && st.run && remaining <= 0){ st = Object.assign({}, st, {ph:"switch", run:false, ms:0}); }
    var p = (!st || st.ph === "wait") ? 0 : (st.ph === "turn" ? 1 - remaining / (st.dur || 1) : 1);
    p = Math.max(0, Math.min(1, p));
    var th = THEMES[(st && st.th) || "cat"] || THEMES.cat;
    var w = words(st, saved.av, remaining, stale);

    var face = root.querySelector(".tt-face");
    if(face){
      face.textContent = th.who;
      root.querySelector(".tt-goal").textContent = th.goal;
      root.querySelector(".tt-who").style.setProperty("--p", p);
      root.querySelector(".tt-time").textContent = st && st.ph !== "done" ? fmt(remaining) : (st ? "🎉" : "–:––");
      root.querySelector(".tt-msg").textContent = w.big;
      root.querySelector(".tt-sub").textContent = w.sub;
      root.querySelector(".tt-warn").textContent = w.warn || "";
      root.classList.toggle("tt-spin", !!th.spin);
      root.classList.toggle("tt-hurry", !!(st && st.ph === "turn" && st.run && remaining <= 30000 && remaining > 0));
      root.classList.toggle("tt-arrive", !!(st && st.ph === "switch"));
      ["mine", "next", "done", "work"].forEach(function(t){ root.classList.toggle("tone-" + t, w.tone === t); });
      var bub = root.querySelector(".tt-bub");
      if(st && st.ph === "switch"){ bubText = th.done; bubUntil = now + 1000; }
      else if(st && st.ph === "turn" && st.run && remaining <= 30000 && remaining > 0){ bubText = "Hurry hurry!"; bubUntil = now + 1000; }
      else if(st && st.ph === "turn" && st.run && now >= nextBub){ bubText = th.lines[Math.floor(Math.random() * th.lines.length)]; bubUntil = now + 4000; nextBub = now + 16000 + Math.random() * 8000; }
      bub.textContent = bubText; bub.classList.toggle("on", now < bubUntil);
    }
    var box = root.querySelector(".tt-act");
    if(box){
      var act = st && ACTS[st.act], sr = (st && st.sr) || {}, parts = sr.parts || [], k = Math.min(sr.k || 0, Math.max(0, parts.length - 1));
      var shared = !!(st && st.act === "shared" && parts.length && onPage("turn-timer.html") && !isFloat);
      root.classList.toggle("tt-sharedwait", shared && st.ph === "wait");
      var cue = "";
      if(shared){
        var curTurn = (st.t || [])[st.i] || [], mineNow = st.ph === "turn" && saved.av && curTurn.indexOf(saved.av) >= 0;
        cue = sr.cue === "listen" ? "👂 Listen and follow along while your coach reads." :
              sr.cue === "together" ? "🗣️ Now read it out loud together! Keep your mic muted." :
              mineNow ? saved.av + " Your turn! Unmute and read this part with your coach." :
              "🔁 Whisper-read this part again while you wait.";
      }
      var akey = !act ? "" : shared ? "S|" + k + "|" + cue + "|" + parts[k] + "|" + parts.length : (onPage(act.url) ? "" : "B|" + st.act);
      if(box.dataset.key !== akey){
        box.dataset.key = akey;
        if(!akey) box.innerHTML = "";
        else if(shared) box.innerHTML = '<div class="tt-cue">' + esc(cue) + '</div><div class="tt-part">' + esc(parts[k]) + '</div><div class="tt-of">Part ' + (k + 1) + ' of ' + parts.length + '</div>';
        else box.innerHTML = '<a class="tt-open" href="' + act.url + '">' + act.icon + ' ' + (isFloat ? "Go to today's practice" : "Open today's practice: " + esc(act.name)) + '</a>';
      }
    }
    if(pill){ pill.textContent = (saved.av || th.who) + " " + (st && st.ph !== "done" ? fmt(remaining) : "⏳") + (w.tone === "mine" ? " 🎤" : w.tone === "next" ? " 👀" : ""); pill.className = "tt tt-pill tone-" + w.tone; }

    var key = st ? st.ph + ":" + st.i + ":" + w.tone : "";
    if(prevKey && key !== prevKey){
      var target = collapsed ? pill : root;
      target.classList.remove("tt-flash"); void target.offsetWidth; target.classList.add("tt-flash");
      if(isFloat && collapsed && (w.tone === "mine" || w.tone === "next")){ collapsed = false; applyCollapse(); }
    }
    prevKey = key;
  }

  tickTimer = setInterval(render, 250);
  if(preview) showMain();
  else if(saved.code && (fromLink || recent)) connect();
  else showCode();

  return {
    /* for games: who am I, who is my partner, and a private line to them */
    me:function(){ return view === "main" ? saved.av : ""; },
    state:function(){ return st; },
    partners:function(){
      if(view !== "main" || !st || !saved.av) return [];
      var mine = (st.t || []).filter(function(t){ return t.indexOf(saved.av) >= 0; })[0] || [];
      return mine.filter(function(a){ return a !== saved.av; });
    },
    onChange:function(f){ changed.push(f); },
    open:function(){ collapsed = false; store("tt-collapsed", false); applyCollapse(); var i = root.querySelector("input"); if(i) i.focus(); },
    onX:function(f){ xs.push(f); },
    sendX:function(obj){ if(room) room.send("x", obj, false); },
    feed:function(m){ st = m; lastMsg = Date.now(); localEnd = Date.now() + (m.ms || 0); render(); },
    destroy:function(){ clearInterval(tickTimer); clearInterval(hiTimer); if(room) room.close(); root.remove(); if(pill) pill.remove(); }
  };
}

window.TurnTimer = {ACTS:ACTS, Room:Room, mountStudent:mountStudent, THEMES:THEMES, AVATARS:AVATARS, newCode:newCode, fmt:fmt, store:store, esc:esc, injectCss:injectCss};

var me_script = document.currentScript;
if(me_script && me_script.hasAttribute("data-float")){
  var start = function(){ window.TurnTimer.card = mountStudent(document.body, {float:true}); };
  if(document.body) start(); else document.addEventListener("DOMContentLoaded", start);
}
})();
