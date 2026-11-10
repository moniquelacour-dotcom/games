/* Hub warm-ups: reading puzzles the whole team works on together, on one
   shared board. They run on their own while the coach sets up: instructions
   are on screen, kids only tap, and late kids just join in.
   The coach's page keeps the board (and where the team stopped), so the next
   session picks up in the same spot. Only animals travel, never names.      */
(function(){
"use strict";

var WS = [
  {t:"Animals",  w:["HORSE","TIGER","ZEBRA","PANDA","KOALA","OTTER","EAGLE","SHARK"]},
  {t:"Food",     w:["PIZZA","TACO","APPLE","BREAD","CHEESE","MANGO","SALAD","COOKIE"]},
  {t:"Space",    w:["MOON","STAR","COMET","ROCKET","PLANET","ORBIT","ALIEN","EARTH"]},
  {t:"Ocean",    w:["WHALE","WAVE","CRAB","CORAL","SQUID","SHELL","SAND","TIDE"]},
  {t:"Weather",  w:["RAIN","SNOW","CLOUD","STORM","WINDY","SUNNY","FROST","THUNDER"]},
  {t:"Sports",   w:["BALL","GOAL","KICK","TEAM","SWIM","RACE","JUMP","SKATE"]},
  {t:"Camping",  w:["TENT","FIRE","CAMP","TRAIL","LAKE","HIKE","CANOE","SMORES"]},
  {t:"Music",    w:["DRUM","SONG","PIANO","FLUTE","BAND","BEAT","GUITAR","SING"]}
];
var STORIES = [
  {t:"The Windy Day", s:["Max put on his red hat.","The wind blew hard.","His hat flew up into a tree.","A bird sat down in the hat.","Max waited and waited.","At last the bird flew away, and Max got his hat back."]},
  {t:"Pancake Morning", s:["Mia got out a big bowl.","She mixed the eggs, milk, and flour.","Dad heated the pan.","They poured in the batter.","The pancake bubbled, and Dad flipped it.","Mia ate it with lots of syrup."]},
  {t:"The Snow Fort", s:["It snowed all night.","In the morning, Sam ran outside.","He rolled big balls of snow.","He stacked them into walls.","His friends came to help with the roof.","Then they had a snowball fight from inside the fort."]},
  {t:"Splash!", s:["A puppy found a blue ball.","She pushed it with her nose.","The ball rolled down the hill.","The puppy ran after it.","Splash! The ball landed in a pond.","The puppy jumped in and swam back with it."]},
  {t:"Blast Off", s:["The astronaut put on her space suit.","She climbed into the rocket.","Three, two, one, blast off!","The rocket zoomed past the clouds.","She looked back and saw Earth far away.","Then she landed softly on the moon."]},
  {t:"The Sunflower", s:["Jo dug a small hole.","She dropped a seed inside.","She watered it every day.","A tiny green sprout popped up.","It grew taller and taller.","One morning, a big yellow sunflower opened."]},
  {t:"The Sleepover", s:["Kai packed his bag for the sleepover.","He walked to his friend's house.","They built a blanket fort.","They told funny stories with a flashlight.","Their eyes got heavy.","They fell asleep inside the fort."]},
  {t:"Lost and Found", s:["Nina could not find her cat.","She looked under the bed.","She looked behind the couch.","Then she heard a tiny meow.","It came from the laundry basket.","Her cat was asleep on the warm towels."]}
];
var LIST = [
  {id:"ws", name:"Team Word Search", icon:"🔎"},
  {id:"ss", name:"Story Scramble", icon:"📜"}
];

function rng(seed){ var a = (seed * 2654435761) >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

/* ---------- word search ---------- */
var N = 9, DIRS = [[0,1],[1,0],[1,1]];
var gridCache = {};
function grid(p){
  if(gridCache[p]) return gridCache[p];
  var puz = WS[p % WS.length], r = rng(p + 7), g = [], at = {}, i, j;
  for(i = 0; i < N; i++){ g.push([]); for(j = 0; j < N; j++) g[i].push(""); }
  puz.w.slice().sort(function(a, b){ return b.length - a.length; }).forEach(function(w){
    for(var tries = 0; tries < 400; tries++){
      var d = DIRS[Math.floor(r() * DIRS.length)], r0 = Math.floor(r() * N), c0 = Math.floor(r() * N), ok = true, k;
      if(r0 + d[0] * (w.length - 1) >= N || c0 + d[1] * (w.length - 1) >= N) continue;
      for(k = 0; k < w.length; k++){ var ch = g[r0 + d[0] * k][c0 + d[1] * k]; if(ch && ch !== w[k]){ ok = false; break; } }
      if(!ok) continue;
      var cells = [];
      for(k = 0; k < w.length; k++){ g[r0 + d[0] * k][c0 + d[1] * k] = w[k]; cells.push((r0 + d[0] * k) * N + c0 + d[1] * k); }
      at[w] = cells; return;
    }
  });
  var AB = "ABCDEFGHIJKLMNOPRSTUVWY";
  for(i = 0; i < N; i++) for(j = 0; j < N; j++) if(!g[i][j]) g[i][j] = AB[Math.floor(r() * AB.length)];
  return (gridCache[p] = {g:g, at:at, words:Object.keys(at), title:puz.t});
}
function line(a, b){
  var r0 = Math.floor(a / N), c0 = a % N, r1 = Math.floor(b / N), c1 = b % N, dr = r1 - r0, dc = c1 - c0;
  if(!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  var n = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc), out = [];
  for(var k = 0; k <= n; k++) out.push((r0 + sr * k) * N + c0 + sc * k);
  return out;
}

/* ---------- the coach's side: holds the board ---------- */
function fresh(id){ return id === "ss" ? {id:"ss", p:0, n:0, by:[]} : {id:"ws", p:0, f:[]}; }
function total(st){ return st.id === "ss" ? STORIES[st.p % STORIES.length].s.length : grid(st.p).words.length; }
function isDone(st){ return st.id === "ss" ? st.n >= total(st) : st.f.length >= total(st); }
/* A student's tap arrives here. Returns true if the board changed. */
function apply(st, a, av){
  if(isDone(st)) return false;
  if(st.id === "ws" && a.k === "found"){
    var G = grid(st.p);
    if(G.words.indexOf(a.w) < 0 || st.f.some(function(f){ return f[0] === a.w; })) return false;
    st.f.push([a.w, av]); return true;
  }
  if(st.id === "ss" && a.k === "place" && a.i === st.n){ st.by.push(av); st.n++; return true; }
  return false;
}
function next(st){ st.p++; if(st.id === "ss"){ st.n = 0; st.by = []; } else st.f = []; }
function progress(st){ var info = st.id === "ss" ? STORIES[st.p % STORIES.length].t : grid(st.p).title; return info + ": " + (st.id === "ss" ? st.n : st.f.length) + " of " + total(st); }

/* ---------- the student's side ---------- */
function render(host, st, send, me){
  if(!st){ host.innerHTML = ""; return; }
  host.dataset.key = host.dataset.key || "";
  if(st.id === "ws") return renderWS(host, st, send, me);
  return renderSS(host, st, send, me);
}
function renderWS(host, st, send, me){
  var G = grid(st.p), foundBy = {}, cellBy = {};
  st.f.forEach(function(f){ foundBy[f[0]] = f[1]; (G.at[f[0]] || []).forEach(function(c){ cellBy[c] = f[1]; }); });
  var key = "ws" + st.p;
  if(host.dataset.key !== key){
    host.dataset.key = key; host._sel = null;
    var h = '<div class="wu-head"><div class="wu-title">🔎 Team Word Search: ' + esc(G.title) + '</div>' +
      '<div class="wu-how">Find the hidden words with your team. Tap the <b>first</b> letter, then the <b>last</b> letter.</div></div>' +
      '<div class="wu-ws"><div class="wu-grid" role="grid">';
    for(var i = 0; i < N * N; i++) h += '<button type="button" class="wu-c" data-i="' + i + '">' + G.g[Math.floor(i / N)][i % N] + '</button>';
    h += '</div><ul class="wu-words"></ul></div><div class="wu-msg" aria-live="polite"></div>';
    host.innerHTML = h;
    host.querySelectorAll(".wu-c").forEach(function(b){
      b.addEventListener("click", function(){
        var i = +b.dataset.i, msg = host.querySelector(".wu-msg");
        if(host._sel === null){ host._sel = i; paint(); return; }
        var L = line(host._sel, i), start = host._sel; host._sel = null;
        if(!L || L.length < 2){ paint(); return; }
        var w = L.map(function(c){ return G.g[Math.floor(c / N)][c % N]; }).join(""), rev = w.split("").reverse().join("");
        var hit = G.words.indexOf(w) >= 0 ? w : G.words.indexOf(rev) >= 0 ? rev : "";
        if(hit && !foundBy[hit]){ send({k:"found", w:hit}); msg.textContent = "You found " + hit + "! 🎉"; }
        else if(hit){ msg.textContent = hit + " is already found. Keep looking!"; }
        else { msg.textContent = "Not a hidden word. Try again!"; }
        paint(); void start;
      });
    });
  }
  host._paint = paint;
  function paint(){
    host.querySelectorAll(".wu-c").forEach(function(b){
      var i = +b.dataset.i; b.classList.toggle("found", !!cellBy[i]); b.classList.toggle("sel", host._sel === i);
    });
    host.querySelector(".wu-words").innerHTML = G.words.slice().sort().map(function(w){
      return '<li class="' + (foundBy[w] ? "got" : "") + '">' + (foundBy[w] ? '<span class="wu-by">' + esc(foundBy[w]) + '</span> ' : "") + esc(w) + '</li>';
    }).join("");
    if(isDone(st)) host.querySelector(".wu-msg").textContent = "Your team found them all! 🎉 A new puzzle is coming…";
  }
  paint();
}
function renderSS(host, st, send, me){
  var S = STORIES[st.p % STORIES.length], key = "ss" + st.p;
  if(host.dataset.key !== key){
    host.dataset.key = key;
    var r = rng(st.p + 3), order = S.s.map(function(_, i){ return i; });
    for(var i = order.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
    host._order = order;
    host.innerHTML = '<div class="wu-head"><div class="wu-title">📜 Story Scramble: ' + esc(S.t) + '</div>' +
      '<div class="wu-how">The story got mixed up! Read the strips. Tap the one that comes <b>next</b>. Your team builds the story together.</div></div>' +
      '<ol class="wu-board"></ol><div class="wu-strips"></div><div class="wu-msg" aria-live="polite"></div>';
  }
  var board = host.querySelector(".wu-board"), strips = host.querySelector(".wu-strips"), msg = host.querySelector(".wu-msg");
  board.innerHTML = S.s.slice(0, st.n).map(function(x, i){ return '<li><span class="wu-by">' + esc(st.by[i] || "") + '</span> ' + esc(x) + '</li>'; }).join("") +
    (st.n < S.s.length ? '<li class="wu-next">What happens next?</li>' : "");
  strips.innerHTML = host._order.filter(function(i){ return i >= st.n; }).map(function(i){
    return '<button type="button" class="wu-strip" data-i="' + i + '">' + esc(S.s[i]) + '</button>';
  }).join("");
  strips.querySelectorAll(".wu-strip").forEach(function(b){
    b.addEventListener("click", function(){
      var i = +b.dataset.i;
      if(i === st.n){ send({k:"place", i:i}); b.disabled = true; msg.textContent = "Yes! 🎉"; }
      else { b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); msg.textContent = st.n ? "Not yet. What happens right after the last strip?" : "Not yet. Which strip starts the story?"; }
    });
  });
  if(isDone(st)) msg.textContent = "Your team put the whole story together! 🎉 A new story is coming…";
}

var CSS = [
".wu-head{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}",
".wu-title{font:800 26px/1.2 'Baloo 2',system-ui,sans-serif}",
".wu-how{font-size:18px;color:var(--muted)}",
".wu-ws{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}",
".wu-grid{display:grid;grid-template-columns:repeat(9,1fr);gap:4px;width:min(100%,440px)}",
".wu-c{aspect-ratio:1;font:800 clamp(16px,4.6vw,24px)/1 'Atkinson Hyperlegible',system-ui,sans-serif;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:8px;padding:0;cursor:pointer}",
".wu-c.found{background:var(--okSoft);border-color:var(--ok)}",
".wu-c.sel{background:var(--accent);color:var(--accentInk);border-color:var(--accent)}",
".wu-words{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;font-size:20px;font-weight:700;min-width:150px}",
".wu-words li.got{text-decoration:line-through;color:var(--muted)}",
".wu-by{text-decoration:none;display:inline-block}",
".wu-msg{min-height:1.5em;font-size:20px;font-weight:700;margin-top:10px}",
".wu-board{display:flex;flex-direction:column;gap:6px;padding-left:28px;margin:0 0 14px;font-size:21px;line-height:1.4}",
".wu-board li{background:var(--okSoft);border-radius:10px;padding:6px 10px}",
".wu-board li.wu-next{background:none;border:2px dashed var(--line);color:var(--muted)}",
".wu-strips{display:flex;flex-direction:column;gap:8px}",
".wu-strip{text-align:left;font:700 20px/1.4 'Atkinson Hyperlegible',system-ui,sans-serif;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:10px 14px;cursor:pointer}",
".wu-strip.shake{animation:wu-sh .4s}",
"@keyframes wu-sh{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}",
"@media (prefers-reduced-motion:reduce){.wu-strip.shake{animation:none}}"
].join("\n");
(function(){ var s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); })();

window.HubWarm = {LIST:LIST, fresh:fresh, apply:apply, next:next, isDone:isDone, progress:progress, render:render};
})();
