/* Reading Hub highlighters: students mark first, then answer.
   Two kinds so far:
   - "word": mark letters inside one word (Middles: the rime), then TYPE the word into its family box.
   - "passage": mark sentences with colored markers (Grade 3 characters), then answer at the NEXT ⭐ checkpoint
     with the marks still showing. Missed jumps give no reading stop, so it doesn't take too long.
   Everything here is public practice content: no student names. Marks stay on the student's laptop;
   only "right on the first try" goes to the coach, scrambled, like every hub answer. */
(function(){
"use strict";

/* ---------------------------------------------------------------- content */
/* Middles: short-vowel word families. Words have blends or digraphs in front so the rime sits inside the word. */
var RIMES = {
  at:{ex:["cat","hat","mat"], w:["splat","flat","chat","that","brat"]},
  an:{ex:["can","fan","man"], w:["plan","scan","than","bran"]},
  ap:{ex:["cap","map","nap"], w:["snap","strap","clap","trap","scrap"]},
  ig:{ex:["big","dig","pig"], w:["twig","sprig"]},
  "in":{ex:["bin","pin","win"], w:["spin","grin","twin","chin","thin"]},
  ip:{ex:["dip","hip","lip"], w:["ship","flip","strip","trip","chip"]},
  op:{ex:["hop","mop","top"], w:["shop","stop","drop","chop","flop"]},
  ot:{ex:["dot","hot","pot"], w:["spot","plot","trot","shot","slot"]},
  ug:{ex:["bug","hug","rug"], w:["plug","shrug","snug","slug"]},
  un:{ex:["bun","fun","sun"], w:["spun","stun"]},
  ell:{ex:["bell","sell","tell"], w:["spell","shell","smell","dwell"]},
  est:{ex:["best","nest","rest"], w:["chest","crest"]},
  ack:{ex:["back","pack","sack"], w:["snack","track","black","stack","crack"]},
  ick:{ex:["kick","pick","sick"], w:["brick","stick","trick","click","thick"]},
  ock:{ex:["lock","rock","sock"], w:["clock","block","flock","shock"]},
  ump:{ex:["bump","jump","lump"], w:["stump","plump","clump"]},
  ing:{ex:["king","ring","sing"], w:["spring","thing","swing","sting","bring"]},
  ink:{ex:["pink","sink","wink"], w:["blink","drink","think","stink","shrink"]}
};

/* Grade 3 characters. Original passages. Each sentence: [text, marker] with marker
   a = what the character does, f = what they feel, s = what they say, t = what they think, "" = none. */
var CHAR_MARKERS = [
  {k:"a", name:"Does", color:"#7cc4ff", ink:"#06263f"},
  {k:"s", name:"Says", color:"#ffd866", ink:"#3d2e00"},
  {k:"t", name:"Thinks", color:"#8be0a4", ink:"#0b3a1a"},
  {k:"f", name:"Feels", color:"#ff9ec7", ink:"#45061f"}
];
var CHAR = [
  /* Each sentence: [text, marker, newParagraph]. Feelings are mostly SHOWN (body, imagery), like the tests.
     qs: test-style questions (Grade 3 sweep, 12 Nov). The right answer is always first in c. */
  {title:"The Lost Kite", who:"Omar", s:[
    ["The wind grabbed Omar's red kite and carried it into the old oak tree.", ""],
    ["Omar's mouth dropped open, and his eyes filled with tears.", "f"],
    ["\"That was my birthday kite!\" he cried.", "s"],
    ["He walked around the tree three times, looking for a low branch.", "a", 1],
    ["Maybe my wagon will make me tall enough, he thought.", "t"],
    ["He pulled his wagon over and climbed on top of it carefully.", "a"],
    ["The string still dangled out of reach.", ""],
    ["Omar's face felt as hot as a stove.", "f", 1],
    ["Then he spotted Grandpa's shed, and a smile crept across his face.", "f"],
    ["\"I'll ask Grandpa for his long rake,\" he said.", "s"]],
   qs:[
    {q:"What do Omar's actions in paragraph 2 show about him?",
     c:["He keeps trying when something is hard.", "He is afraid of tall trees.", "He wants a new kite.", "He is angry at Grandpa."]},
    {q:"Read this sentence from paragraph 3: \"Omar's face felt as hot as a stove.\" This sentence helps the reader know that Omar feels —",
     c:["frustrated", "sleepy", "proud", "cold"]},
    {q:"What is the most likely reason Omar smiles at the end of the story?",
     c:["He has an idea for getting his kite back.", "The wind blows the kite down.", "Grandpa buys him a new kite.", "He is tired of flying kites."]}]},
  {title:"Bo Bakes Muffins", who:"Bo", s:[
    ["The bake sale was on Saturday, and every table needed something sweet.", ""],
    ["Bo the bear's paws shook as he opened the cookbook.", "f"],
    ["\"What if nobody buys them?\" he thought.", "t"],
    ["He read the muffin recipe twice before he started.", "a", 1],
    ["He measured the flour slowly and wiped up every spill.", "a"],
    ["\"Do these look okay?\" he asked his sister.", "s"],
    ["When the muffins came out golden, Bo stood up tall and grinned from ear to ear.", "f", 1],
    ["He wrapped each one in a napkin and drew a tiny smile on it.", "a"]],
   qs:[
    {q:"Which word best describes Bo?", c:["careful", "lazy", "bossy", "silly"]},
    {q:"In paragraph 1, Bo's paws shook. This helps the reader know that Bo feels —", c:["nervous", "angry", "bored", "sleepy"]},
    {q:"How does Bo change from the beginning to the end of the story?",
     c:["He goes from worried to proud.", "He goes from happy to sad.", "He goes from busy to bored.", "He goes from proud to angry."]}]},
  {title:"First Day", who:"Rosa", s:[
    ["Rosa's family had just moved to a new town.", ""],
    ["On her first day, she felt as small as a mouse in the big classroom.", "f"],
    ["At lunch, she sat alone at the end of a long table.", "a"],
    ["Will anyone ever talk to me? she wondered.", "t"],
    ["A girl named Kim slid her tray next to Rosa's.", "", 1],
    ["\"Do you want half of my orange?\" Kim asked.", ""],
    ["Rosa smiled and took a piece.", "a"],
    ["\"Thanks! I like the drawing on your folder,\" Rosa said.", "s"],
    ["By the end of lunch, the knot in Rosa's stomach was gone.", "f", 1]],
   qs:[
    {q:"How does Rosa change from the beginning to the end of the story?",
     c:["She goes from shy to more comfortable.", "She goes from happy to sad.", "She stays angry the whole time.", "She goes from hungry to sleepy."]},
    {q:"Which sentence best describes Rosa and Kim's relationship at the end of the story?",
     c:["They are becoming friends.", "They are angry at each other.", "They are sisters.", "They do not like to share."]},
    {q:"Why does Rosa tell Kim she likes the drawing on her folder?",
     c:["She wants to be friendly to Kim.", "She wants Kim's folder.", "She wants Kim to leave.", "She wants to draw instead of eat."]}]},
  {title:"The Wallet", who:"Tess", s:[
    ["A brown wallet was lying on the sidewalk near the park.", ""],
    ["Tess picked it up and looked inside.", "a"],
    ["There were ten dollars and a library card with a name on it.", ""],
    ["Ten dollars could buy a lot of stickers, Tess thought.", "t", 1],
    ["Then she pictured someone searching their pockets again and again.", "t"],
    ["Her stomach twisted.", "f"],
    ["\"Someone must be looking everywhere for this,\" she told her dad.", "s"],
    ["They walked to the library and handed the wallet to the librarian.", "a", 1],
    ["All the way home, Tess felt as light as a balloon.", "f"]],
   qs:[
    {q:"What do Tess's actions show about her?",
     c:["She is honest and cares about others.", "She wants to buy stickers.", "She does not like the library.", "She is scared of her dad."]},
    {q:"Which sentence shows that Tess thinks about how the owner feels?",
     c:["Then she pictured someone searching their pockets again and again.", "Tess picked it up and looked inside.", "There were ten dollars and a library card with a name on it.", "They walked to the library and handed the wallet to the librarian."]},
    {q:"What is the most likely reason Tess and her dad take the wallet to the library?",
     c:["The library card can help find the owner.", "Tess wants to read a book.", "Her dad needs a new card.", "Tess wants to keep the money."]}]}
];

var SETS = {
  "mid-rimes":{name:"Middles: mark the rime, type the word", kind:"word"},
  "g3-char":{name:"Grade 3 characters: does, says, thinks, feels", kind:"passage", markers:CHAR_MARKERS, items:CHAR}
};

/* ---------------------------------------------------------------- helpers */
function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function escH(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
function firstVowel(w){ for(var i = 0; i < w.length; i++) if("aeiou".indexOf(w[i]) >= 0) return i; return -1; }

var css = document.createElement("style");
css.textContent =
".mk-letters{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}" +
".mk-letters button{font:800 40px/1 'Atkinson Hyperlegible',system-ui,sans-serif;min-width:52px;padding:10px 6px;border:3px solid var(--line);border-radius:14px;background:var(--card);color:inherit;cursor:pointer}" +
".mk-letters button.on{background:#7cc4ff;color:#06263f;border-color:#2e86c9}" +
".mk-letters button.miss{outline:3px dashed #2e86c9;outline-offset:2px}" +
".mk-letters button.bad{text-decoration:line-through;opacity:.7}" +
".mk-pens{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}" +
".mk-pens button{font:700 17px 'Atkinson Hyperlegible',system-ui,sans-serif;border:3px solid transparent;border-radius:999px;padding:8px 14px;cursor:pointer}" +
".mk-pens button.sel{border-color:currentColor;box-shadow:0 0 0 3px rgba(0,0,0,.15)}" +
".mk-pass{font:18px/1.7 'Atkinson Hyperlegible',system-ui,sans-serif;background:var(--soft,rgba(127,127,127,.08));border-radius:14px;padding:12px 14px;max-height:42vh;overflow:auto}" +
".mk-pass p{margin:0 0 6px}.mk-pass .pn{font:800 12px system-ui,sans-serif;color:var(--muted);margin-right:6px;vertical-align:2px}" +
".mk-pass h3{margin:0 0 6px;font:800 19px 'Baloo 2',system-ui,sans-serif}" +
".mk-sent{cursor:pointer;border-radius:5px;padding:1px 2px;-webkit-tap-highlight-color:transparent}" +
".mk-pass.lock .mk-sent{cursor:default}" +
".mk-sent.miss{outline:2px dashed currentColor;outline-offset:1px}" +
".mk-sent.bad{text-decoration:line-through}" +
".mk-tag{font:800 11px 'Atkinson Hyperlegible',system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;padding:0 5px;border-radius:6px;margin-right:4px;vertical-align:2px}" +
".mk-boxes{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
"@media (max-width:480px){.mk-boxes{grid-template-columns:1fr}}" +
".mk-box{border:3px solid var(--line);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px}" +
".mk-box b{font:800 28px 'Baloo 2',system-ui,sans-serif;text-align:center}" +
".mk-box .ex{text-align:center;color:var(--muted);font-size:17px}" +
".mk-box input{font:700 22px 'Atkinson Hyperlegible',system-ui,sans-serif;padding:8px 10px;border:2px solid var(--line);border-radius:10px;width:100%;box-sizing:border-box;background:var(--card);color:inherit}" +
".mk-box.right{border-color:var(--ok);background:var(--okSoft)}" +
".mk-box.wrong{border-color:var(--bad);background:var(--badSoft)}" +
".mk-legend{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;font-size:15px}" +
".mk-btn{font:700 18px 'Atkinson Hyperlegible',system-ui,sans-serif;border:0;border-radius:999px;padding:10px 18px;cursor:pointer;background:#5b3fc4;color:#fff}" +
".mk-btn[disabled]{opacity:.45;cursor:not-allowed}" +
".mk-btn.ghost{background:transparent;color:inherit;border:2px solid var(--line)}";
document.head.appendChild(css);

/* ---------------------------------------------------------------- word: mark the rime, type the word */
function askWord(o){
  var fams = Object.keys(RIMES), rime = pick(fams), word = pick(RIMES[rime].w);
  var other = pick(fams.filter(function(f){ return f !== rime && f.replace(/[^aeiou]/g, "") !== rime.replace(/[^aeiou]/g, ""); }));
  var v = firstVowel(word), want = {}; for(var i = v; i < word.length; i++) want[i] = 1;
  var marked = {}, stage = "mark", tries = 0, done = false, box = o.box;
  o.setQ({prompt:"Mark the rime in " + word + ", then type the word into its word family box.", show:word, choices:[]});
  box.innerHTML = '<div class="qtitle">' + escH(o.title) + '</div>' +
    '<div class="qprompt" id="mkP">Mark the rime: tap the vowel and every letter after it.</div>' +
    '<div class="mk-letters" id="mkL">' + word.split("").map(function(c, i){ return '<button type="button" data-i="' + i + '" aria-pressed="false">' + escH(c) + '</button>'; }).join("") + '</div>' +
    '<div class="qrow"><button class="say" id="mkSay">🔊 Hear the word</button><button class="mk-btn" id="mkCheck" disabled>Check my rime</button></div>' +
    '<div class="qmsg" id="qMsg" aria-live="polite"></div><div id="mkBoxes"></div><div class="qrow" id="qAfter"></div>';
  o.open();
  var $ = function(id){ return box.querySelector("#" + id); };
  $("mkSay").onclick = function(){ o.speak(word); };
  setTimeout(function(){ o.speak(word); }, 250);
  box.querySelectorAll("#mkL button").forEach(function(b){
    b.onclick = function(){
      if(stage !== "mark") return;
      var i = +b.dataset.i; if(marked[i]) delete marked[i]; else marked[i] = 1;
      b.classList.toggle("on", !!marked[i]); b.setAttribute("aria-pressed", marked[i] ? "true" : "false");
      $("mkCheck").disabled = !Object.keys(marked).length;
    };
  });
  $("mkCheck").onclick = function(){
    stage = "type";
    var ok = Object.keys(marked).length === Object.keys(want).length && Object.keys(want).every(function(i){ return marked[i]; });
    box.querySelectorAll("#mkL button").forEach(function(b){
      var i = +b.dataset.i; b.classList.toggle("on", !!want[i]); b.classList.toggle("miss", !!want[i] && !marked[i]); b.classList.toggle("bad", !want[i] && !!marked[i]);
    });
    $("mkCheck").hidden = true;
    $("qMsg").textContent = ok ? "Yes! The rime is -" + rime + ". 🎉" : "The rime is -" + rime + ": the vowel and the letters after it.";
    var order = shuffle([rime, other]);
    $("mkP").textContent = "Type " + word + " into its word family box.";
    $("mkBoxes").innerHTML = '<div class="mk-boxes">' + order.map(function(f){
      return '<div class="mk-box" data-f="' + f + '"><b>-' + escH(f) + '</b><div class="ex">' + RIMES[f].ex.map(escH).join(" · ") + '</div>' +
        '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type the word into the -' + escH(f) + ' box">' +
        '<button type="button" class="mk-btn">Put it here</button></div>';
    }).join("") + '</div>';
    box.querySelectorAll(".mk-box").forEach(function(bx){
      var inp = bx.querySelector("input"), go = function(){
        if(done) return;
        var typed = inp.value.trim().toLowerCase(); if(!typed) return;
        var right = bx.dataset.f === rime && typed === word; tries++;
        if(tries === 1) o.first(right);
        if(right){ bx.classList.add("right"); $("qMsg").textContent = tries === 1 ? "Yes! " + word + " goes with -" + rime + ". 🎉" : "You got it! 👍"; done = true; setTimeout(function(){ o.close(tries === 1); }, 1100); return; }
        bx.classList.add("wrong"); setTimeout(function(){ bx.classList.remove("wrong"); }, 900);
        if(tries === 1){ $("qMsg").textContent = bx.dataset.f !== rime ? "Not that box. Which box has your rime?" : "Check your spelling. Look at the word."; return; }
        done = true;
        box.querySelector('.mk-box[data-f="' + rime + '"]').classList.add("right");
        box.querySelector('.mk-box[data-f="' + rime + '"] input').value = word;
        $("qMsg").textContent = word + " goes in the -" + rime + " box.";
        $("qAfter").innerHTML = '<button class="btn main" id="qGo">Keep going</button>'; $("qGo").onclick = function(){ o.close(false); };
      };
      bx.querySelector("button").onclick = go;
      inp.onkeydown = function(e){ if(e.key === "Enter"){ e.preventDefault(); go(); } };
    });
    var first = box.querySelector('.mk-box input'); if(first) first.focus();
  };
  return {skip:function(){ if(!done){ done = true; o.close(null); } }};
}

/* ---------------------------------------------------------------- passage: mark at one ⭐, answer at the next */
function passageHtml(set, P, marks, opts){
  var pen = {}; set.markers.forEach(function(m){ pen[m.k] = m; });
  return '<div class="mk-pass' + (opts.lock ? " lock" : "") + '" id="mkPass"><h3>' + escH(P.title) + '</h3><p><span class="pn">1</span>' + P.s.map(function(s, i){
    var m = marks[i] && pen[marks[i]], st = m ? ' style="background:' + m.color + ';color:' + m.ink + '"' : "";
    var extra = "";
    if(opts.check){
      var want = s[1];
      if(want && marks[i] !== want){ var w = pen[want]; st = ' style="background:' + w.color + ';color:' + w.ink + '"'; extra = " miss"; }
      else if(!want && marks[i]){ extra = " bad"; }
    }
    var tag = opts.check && (marks[i] || s[1]) ? '<span class="mk-tag" style="background:' + pen[s[1] || marks[i]].color + ';color:' + pen[s[1] || marks[i]].ink + '">' + escH(s[1] ? pen[s[1]].name : "not " + pen[marks[i]].name) + '</span>' : "";
    var brk = s[2] ? '</p><p><span class="pn">' + (P.s.slice(0, i + 1).filter(function(x){ return x[2]; }).length + 1) + '</span>' : "";
    return brk + '<span class="mk-sent' + extra + '" data-i="' + i + '"' + st + '>' + tag + escH(s[0]) + '</span> ';
  }).join("") + '</p></div>';
}
function askPassage(o, set){
  if(o.kind !== "ckpt") return "later";
  var key = "mk-" + o.set, S = o.store(key) || {i:Math.floor(Math.random() * set.items.length), step:"mark", marks:{}};
  if(!set.items[S.i]) S.i = 0;
  var P = set.items[S.i], box = o.box, done = false, $ = function(id){ return box.querySelector("#" + id); };
  var legend = '<div class="mk-legend">' + set.markers.map(function(m){ return '<span><span class="mk-tag" style="background:' + m.color + ';color:' + m.ink + '">' + escH(m.name) + '</span></span>'; }).join("") + '</div>';
  var readAll = P.s.map(function(s){ return s[0]; }).join(" ");

  if(S.step === "mark"){
    var marks = {}, pen = "";
    o.setQ({prompt:"Mark what " + P.who + " does, says, thinks and feels in \"" + P.title + "\".", show:"", choices:[]});
    box.innerHTML = '<div class="qtitle">⭐ Reading stop</div>' +
      '<div class="qprompt">Mark what <b>' + escH(P.who) + '</b> does, says, thinks and feels.</div>' +
      '<div class="mk-pens" id="mkPens">' + set.markers.map(function(m){ return '<button type="button" data-k="' + m.k + '" style="background:' + m.color + ';color:' + m.ink + '">' + escH(m.name) + '</button>'; }).join("") + '</div>' +
      '<div class="small" id="mkHint" style="text-align:center">Pick a marker, then tap a sentence. Tap again to undo.</div>' +
      passageHtml(set, P, marks, {}) +
      '<div class="qrow"><button class="say" id="mkRead">🔊 Read it to me</button><button class="mk-btn" id="mkDone" disabled>Done marking</button></div>' +
      '<div class="qmsg" id="qMsg" aria-live="polite"></div><div class="qrow" id="qAfter"></div>';
    o.open();
    $("mkRead").onclick = function(){ o.speak(readAll); };
    var paint = function(){ $("mkPass").outerHTML = passageHtml(set, P, marks, {}); bind(); $("mkDone").disabled = !Object.keys(marks).length; };
    var bind = function(){ box.querySelectorAll(".mk-sent").forEach(function(sp){ sp.onclick = function(){
      if(done) return;
      var i = +sp.dataset.i;
      if(!pen){ $("mkHint").textContent = "Pick a marker first: Does, Says, Thinks or Feels."; return; }
      if(marks[i] === pen) delete marks[i]; else marks[i] = pen;
      paint();
    }; }); };
    box.querySelectorAll("#mkPens button").forEach(function(b){ b.onclick = function(){
      pen = b.dataset.k; box.querySelectorAll("#mkPens button").forEach(function(x){ x.classList.toggle("sel", x === b); });
      $("mkHint").textContent = "Now tap the sentences where " + P.who + " " + {a:"does something", s:"says something", t:"thinks something", f:"shows a feeling"}[pen] + ".";
    }; });
    bind();
    $("mkDone").onclick = function(){
      if(done) return; done = true;
      var need = P.s.filter(function(s){ return s[1]; }).length, found = P.s.filter(function(s, i){ return s[1] && marks[i] === s[1]; }).length;
      $("mkPass").outerHTML = passageHtml(set, P, marks, {check:true, lock:true});
      box.querySelector("#mkPens").hidden = true; $("mkHint").hidden = true; $("mkDone").hidden = true;
      $("qMsg").textContent = "You found " + found + " of " + need + "." + (found < need ? " The dashed ones are the ones you missed." : " 🎉") + " Your question about this story comes at the next ⭐.";
      var full = {}; P.s.forEach(function(s, i){ if(s[1]) full[i] = s[1]; });
      o.store(key, {i:S.i, n:S.n || 0, step:"answer", marks:full});
      $("qAfter").innerHTML = '<button class="btn main" id="qGo">Keep climbing</button>'; $("qGo").onclick = function(){ o.close(true); };
    };
    return {skip:function(){ if(!done){ done = true; o.close(null); } }};
  }

  /* answer step: same passage, marks showing, one question */
  /* questions rotate: each time round the passages, the next question type */
  var Q = P.qs[Math.floor((S.n || 0) / set.items.length) % P.qs.length];
  var choices = shuffle(Q.c), ans = Q.c[0], tries = 0;
  o.setQ({prompt:Q.q, show:"", choices:choices});
  box.innerHTML = '<div class="qtitle">⭐ Reading stop</div>' +
    '<div class="qprompt">' + escH(Q.q) + '</div>' + legend +
    passageHtml(set, P, S.marks || {}, {lock:true}) +
    '<div class="qrow"><button class="say" id="mkRead">🔊 Read it to me</button></div>' +
    '<div class="qchoices long">' + choices.map(function(c, i){ return '<button type="button" data-i="' + i + '">' + escH(c) + '</button>'; }).join("") + '</div>' +
    '<div class="qmsg" id="qMsg" aria-live="polite"></div><div class="qrow" id="qAfter"></div>';
  o.open();
  $("mkRead").onclick = function(){ o.speak(readAll + " " + Q.q); };
  var next = function(){ o.store(key, {i:(S.i + 1) % set.items.length, n:(S.n || 0) + 1, step:"mark", marks:{}}); };
  box.querySelectorAll(".qchoices button").forEach(function(b){ b.onclick = function(){
    if(done || b.classList.contains("wrong")) return;
    var right = choices[+b.dataset.i] === ans; tries++;
    if(tries === 1) o.first(right);
    if(right){ b.classList.add("right"); $("qMsg").textContent = tries === 1 ? "Yes! Your marks showed it. 🎉" : "You got it! 👍"; done = true; next(); setTimeout(function(){ o.close(tries === 1); }, 1100); return; }
    b.classList.add("wrong");
    if(tries === 1){ $("qMsg").textContent = "Not quite. Look at your marks and try again."; return; }
    done = true; next();
    box.querySelectorAll(".qchoices button").forEach(function(x){ if(choices[+x.dataset.i] === ans) x.classList.add("right"); });
    $("qMsg").textContent = "The answer is: " + ans;
    $("qAfter").innerHTML = '<button class="btn main" id="qGo">Keep climbing</button>'; $("qGo").onclick = function(){ o.close(false); };
  }; });
  return {skip:function(){ if(!done){ done = true; o.close(null); } }};
}

window.HubMark = {
  SETS:SETS,
  LIST:Object.keys(SETS).map(function(k){ return {id:k, name:SETS[k].name}; }),
  has:function(id){ return !!SETS[id]; },
  /* o: {box, title, set, kind:"miss"|"ckpt", store(k[,v]), speak, setQ(q), first(ok), open(), close(v)}
     returns {skip} when it shows a stop, or "later" when this kind has no stop here. */
  ask:function(o){ var set = SETS[o.set]; return set.kind === "word" ? askWord(o) : askPassage(o, set); }
};
})();
