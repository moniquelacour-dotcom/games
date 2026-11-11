/* Hub question sets: tap-to-choose, 4 answers each.
   One file for every hub game, so a new skill is a new list here and every
   game gets it. The coach can also write her own questions on the hub page.
   Nothing a student does is stored here.                                   */
(function(){
"use strict";

var SETS = {
  "long-a": {name:"Long a", mark:"ā",
    pats:{ai:["rain","train","paint","snail","chain","brain","grain","trail"], ay:["day","play","stay","gray","tray","spray","clay","away"],
          a_e:["cake","game","late","make","name","plate","shape","gave","snake","lake"], eigh:["eight","sleigh","neighbor"], ey:["they","obey"]},
    not:["cat","hat","said","have","plan","flag","black","any","was","snack","bath","many"]},
  "long-e": {name:"Long e", mark:"ē",
    pats:{ee:["tree","feet","green","sheep","seed","sleep","free","queen"], ea:["eat","team","seat","beach","clean","dream","leaf","peach"],
          e_e:["these","theme","complete"], y:["happy","funny","baby","candy","puppy","sunny"], ie:["field","chief","shield"], e:["me","he","we","she","be"]},
    not:["bed","red","pet","head","bread","great","egg","ten","best","said","when","step"]},
  "long-i": {name:"Long i", mark:"ī",
    pats:{igh:["night","light","bright","fight","tight","flight"], i_e:["bike","kite","time","five","ride","smile","slide","shine"],
          y:["my","fly","sky","cry","try","why"], ie:["pie","tie","lie"], i:["find","kind","mind","child","wild"]},
    not:["sit","pig","fish","big","win","give","live","him","gift","milk","swim","trip"]},
  "long-o": {name:"Long o", mark:"ō",
    pats:{oa:["boat","coat","soap","goat","toast","float","coach","load"], ow:["snow","grow","slow","show","bowl","glow","window"],
          o_e:["home","rope","bone","stone","hope","smoke","joke","note"], o:["go","so","open","over"], ol:["cold","gold","told","old","most"]},
    not:["hot","dog","top","cow","now","how","love","some","done","pot","frog","stop"]},
  "long-u": {name:"Long u", mark:"ū",
    pats:{u_e:["cute","mule","tube","flute","huge","rule","cube","use"], ue:["glue","true","clue","rescue","argue"], ew:["few","grew","chew","stew","drew","crew"]},
    not:["cup","bus","sun","put","push","fun","jump","much","duck","run","bug","truck"]}
};
/* Words that sound like another real word: never used for "hear and choose". */
var HOMO = ["rain","tail","mail","wait","plain","pain","sail","made","plane","eight","sleigh","way","see","sea","seem","meet","week","read","peach","right","night","fight","bight","tie","lie","pie","by","why","so","no","road","rode","blue","new","few","flu","grew","chew","crew","knew","dew","due","threw","through","be","we","hi","high","eye","won","one","rows","nose","toe","hole","coat","rope","sow","close","cue","queue","use","yew","you","flew","tea","tee","feet","heal","heel","seed","cede","sole","soul","main","mane","pail","pale","stake","steak","break","brake","weigh","whey","they","obey","stair","stare","bowl","tide","tied","cell","sell","told","tolled","gate","flower","flour","stew","sew","bread","bred","lead","led","be","bee","cheap","beach","beech","fair","fare","grown","groan","road","night","knight","know","mind","mined","kind"];

var ALL = {}; Object.keys(SETS).forEach(function(k){ var s = SETS[k]; Object.keys(s.pats).forEach(function(p){ s.pats[p].forEach(function(w){ ALL[w] = 1; }); }); });

function rnd(n){ return Math.floor(Math.random() * n); }
function pick(a){ return a[rnd(a.length)]; }
function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function sample(a, n, not){ return shuffle(a.filter(function(x){ return !not || not.indexOf(x) < 0; })).slice(0, n); }
function words(set){ var out = []; Object.keys(set.pats).forEach(function(p){ set.pats[p].forEach(function(w){ out.push({w:w, p:p}); }); }); return out; }
function vowel(c){ return "aeiou".indexOf(c) >= 0; }

/* Split a word into what comes before, the spelling, and what comes after. */
function parts(w, p){
  if(p.indexOf("_") > 0){ var m = new RegExp("^(.*)" + p[0] + "([^aeiouy]{1,2})" + p[2] + "$").exec(w); return m ? {pre:m[1], mid:m[2], post:"", split:true} : null; }
  if(p.length === 1 && p !== "y"){ var i0 = w.indexOf(p); return i0 < 0 ? null : {pre:w.slice(0, i0), mid:"", post:w.slice(i0 + 1)}; }
  var i = w.lastIndexOf(p); if(i < 0) return null;
  return {pre:w.slice(0, i), mid:"", post:w.slice(i + p.length)};
}
function respell(pt, q){
  if(q.indexOf("_") > 0){
    if(pt.split) return pt.pre + q[0] + pt.mid + "e";
    if(/^[^aeiouy]{1,2}$/.test(pt.post)) return pt.pre + q[0] + pt.post + "e";
    return null;
  }
  if(q.length === 1 && q !== "y" && !pt.split) return null;
  return pt.pre + q + (pt.split ? pt.mid : pt.post);
}
function blanks(n){ var s = []; for(var i = 0; i < n; i++) s.push("_"); return s.join(" "); }

/* "finish" never asks about these spellings, and never offers a spelling that can make more than one sound. */
var FIN_OUT = ["ol", "i", "o", "e"], AMBIG = ["ie", "y", "ey", "ea"];
var KINDS = ["says", "odd", "finish", "hear"];
function make(setId, kind){
  if(GEN[setId]) return GEN[setId].make();
  var set = SETS[setId]; if(!set) return null;
  var ws = words(set), canHear = typeof speechSynthesis !== "undefined";
  kind = kind || pick(KINDS);
  if(kind === "hear" && !canHear) kind = "says";
  var q;
  if(kind === "says"){
    var right = pick(ws).w, wrong = sample(set.not, 3);
    q = {prompt:"Which word has the " + set.name.toLowerCase() + " sound (" + set.mark + ")?", choices:[right].concat(wrong), ans:right};
  } else if(kind === "odd"){
    var odd = pick(set.not), same = sample(ws.map(function(x){ return x.w; }), 3);
    q = {prompt:"Which word does NOT have the " + set.name.toLowerCase() + " sound?", choices:same.concat([odd]), ans:odd};
  } else if(kind === "finish"){
    var cand = shuffle(ws).filter(function(x){ return FIN_OUT.indexOf(x.p) < 0 && parts(x.w, x.p); })[0], pt = parts(cand.w, cand.p);
    var others = [];
    Object.keys(SETS).forEach(function(k){ if(k !== setId) Object.keys(SETS[k].pats).forEach(function(p){
      if((p.indexOf("_") > 0) === !!pt.split && p.length > 1 && FIN_OUT.indexOf(p) < 0 && AMBIG.indexOf(p) < 0 && !set.pats[p] && others.indexOf(p) < 0) others.push(p); }); });
    var lab = function(p){ return p.indexOf("_") > 0 ? p[0] + " … " + p[2] : p; };
    var show = pt.split ? pt.pre + " _ " + pt.mid + " _" : pt.pre + " " + blanks(cand.p.length) + " " + pt.post;
    q = {prompt:"Which letters finish the word with the " + set.name.toLowerCase() + " sound?", show:show.replace(/\s+/g, " ").trim(),
         choices:[lab(cand.p)].concat(sample(others, 3).map(lab)), ans:lab(cand.p)};
  } else {
    var pool = shuffle(ws).filter(function(x){ return HOMO.indexOf(x.w) < 0 && parts(x.w, x.p); });
    if(!pool.length) return make(setId, "says");
    var c = pool[0], ptc = parts(c.w, c.p), miss = [];
    Object.keys(set.pats).forEach(function(p){ if(p === c.p) return; var r = respell(ptc, p); if(r && r !== c.w && !ALL[r] && miss.indexOf(r) < 0) miss.push(r); });
    if(vowel(c.p[0])){ var sh = ptc.pre + c.p[0] + (ptc.split ? ptc.mid : ptc.post); if(sh !== c.w && miss.indexOf(sh) < 0) miss.push(sh); }
    miss = shuffle(miss).slice(0, 3);
    while(miss.length < 3){ var f = pick(ws).w; if(f !== c.w && miss.indexOf(f) < 0) miss.push(f); }
    q = {prompt:"Tap 🔊 and listen. Which spelling is right?", say:c.w, choices:[c.w].concat(miss), ans:c.w};
  }
  q.choices = shuffle(q.choices);
  q.kind = kind; q.set = setId;
  return q;
}

/* Fluency sets. The sentences come from Read the Signs and Read in Scoops (Grade 2 level). */
var FLU = {"PICKS":[{"t":"The orange cat is sleeping on the warm, fuzzy rug","a":"."},{"t":"Where did you put my red hat","a":"?"},{"t":"Watch out, the puppy is running right at us","a":"!"},{"t":"We had pancakes for breakfast today","a":"."},{"t":"Could you please help me carry this heavy box","a":"?"},{"t":"Wow, that is the biggest fish I have ever seen","a":"!"},{"t":"Frogs can jump very far","a":"."},{"t":"What time does the yellow school bus come","a":"?"},{"t":"Hooray, our team finally won the big game","a":"!"},{"t":"The sun goes down behind the hills at night","a":"."},{"t":"Is it going to rain again this afternoon","a":"?"},{"t":"Ouch, I stubbed my toe on the bottom step","a":"!"},{"t":"My sister likes to draw horses","a":"."},{"t":"How many legs does a garden spider have","a":"?"},{"t":"Yay, it is finally snowing outside","a":"!"},{"t":"Bees make honey in their hives","a":"."},{"t":"Did you feed the fish today","a":"?"},{"t":"Oh no, the milk spilled all over the table","a":"!"}],"LINES":["The little brown dog | ran across the yard.","My big sister | likes to read | at night.","A spider spins a web | in the corner | of the barn.","After lunch, | we went outside | to play.","The baby bird | opened its mouth | for a worm.","Giant whales swim | in the deep blue ocean.","On a hot day, | the snowman melted | into a puddle.","The bees flew | from flower | to flower.","My friend and I | built a fort | out of blankets.","The moon came up | over the dark hills.","A turtle carries its heavy shell | everywhere it goes.","When it rains, | the worms come up | out of the ground."]};
var SIGNS = {".":". period","?":"? question mark","!":"! exclamation mark"};
function makeSigns(){
  var p = pick(FLU.PICKS);
  return {prompt:"Which sign goes at the end?", show:p.t + " ___", choices:shuffle([SIGNS["."], SIGNS["?"], SIGNS["!"]]), ans:SIGNS[p.a], kind:"signs", set:"signs"};
}
var GLUE = ["the","a","an","my","his","her","its","our","their","of","to","in","on","at","for","from","and","into","out","up","over","with"];
function joinBreaks(ws, br){ var out = []; ws.forEach(function(w, i){ out.push(w); if(i < ws.length - 1 && br[i]) out.push("/"); }); return out.join(" "); }
function makeScoops(){
  var line = pick(FLU.LINES), ps = line.split("|").map(function(x){ return x.trim(); }), ws = ps.join(" ").split(/\s+/), nat = {}, n = 0;
  ps.forEach(function(p, k){ n += p.split(/\s+/).length; if(k < ps.length - 1) nat[n - 1] = 1; });
  var right = joinBreaks(ws, nat), robot = ws.join(" / "), wrong = [], tries = 0;
  var bad = []; for(var i = 0; i < ws.length - 1; i++) if(!nat[i]) bad.push(i);
  var glue = bad.filter(function(i){ return GLUE.indexOf(ws[i].toLowerCase().replace(/[^a-z]/g, "")) >= 0; });
  while(wrong.length < 2 && tries++ < 40){
    var br = {}, k = Object.keys(nat).length || 1, pool = shuffle(glue.length ? glue.concat(bad) : bad);
    pool.slice(0, k).forEach(function(i){ br[i] = 1; });
    var s = joinBreaks(ws, br);
    if(s !== right && s !== robot && wrong.indexOf(s) < 0 && Object.keys(br).length) wrong.push(s);
  }
  return {prompt:"Which one is read in scoops, like talking?", choices:shuffle([right, robot].concat(wrong)), ans:right, kind:"scoops", set:"scoops"};
}
var GEN = {signs:{name:"Read the signs (punctuation)", make:makeSigns}, scoops:{name:"Read in scoops (phrasing)", make:makeScoops}};
var LIST = Object.keys(SETS).map(function(k){ return {id:k, name:SETS[k].name + " vowel"}; }).concat(Object.keys(GEN).map(function(k){ return {id:k, name:GEN[k].name}; }));
/* A coach-written question: {p, c:[4], r:index} */
function fromOwn(list){
  if(!list || !list.length) return null;
  var o = pick(list), right = o.c[o.r];
  return {prompt:o.p, show:o.s || "", choices:shuffle(o.c.filter(function(x){ return x !== ""; })), ans:right, kind:"own"};
}
function speak(w){
  try{ speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(w); u.rate = 0.8; u.lang = "en-US"; speechSynthesis.speak(u); }catch(e){}
}
window.HubQ = {SETS:SETS, LIST:LIST, make:make, fromOwn:fromOwn, speak:speak, shuffle:shuffle};
})();
