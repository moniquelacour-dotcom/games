/* Summit Climb: a 3D climbing game for the hub.
   Jump from ledge to ledge up the mountain. Miss a jump and you fall: answer
   your skill question to get back on. Every 5th ledge is a ⭐ checkpoint with
   a question too. Friends' animals climb the same mountain.
   Only "🦊 is on ledge 12" travels. If the computer can't do 3D, the same
   game runs flat.                                                          */
(function(){
"use strict";
var THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
var R = 5.2, STEP = 0.52, RISE = 1.35, TOL = 0.62, AMP = 1.7, PER_MTN = 30;

function loadThree(cb){
  if(window.THREE) return cb(true);
  var s = document.createElement("script"), done = false;
  s.src = THREE_SRC; s.async = true;
  function fin(){ if(!done){ done = true; cb(!!window.THREE); } }
  s.onload = fin; s.onerror = fin; document.head.appendChild(s); setTimeout(fin, 12000);
}
function webgl(){ try{ var c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); }catch(e){ return false; } }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

var CSS = [
".cl{position:relative;width:100%;height:min(72vh,640px);min-height:380px;border-radius:18px;overflow:hidden;background:linear-gradient(#9fd3ff,#e9f6ff);touch-action:manipulation;user-select:none}",
".cl canvas{display:block;width:100%;height:100%}",
".cl-hud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;gap:8px;padding:10px 12px;pointer-events:none;font:800 20px 'Baloo 2',system-ui,sans-serif;color:#1d2a3a;text-shadow:0 1px 0 #fff}",
".cl-bot{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px}",
".cl-bar{position:relative;width:min(340px,80%);height:18px;border-radius:999px;background:rgba(255,255,255,.75);border:2px solid #1d2a3a33}",
".cl-zone{position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);border-radius:999px;background:#5ccf7a}",
".cl-dot{position:absolute;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#1d2a3a}",
".cl-jump{font:800 26px 'Baloo 2',system-ui,sans-serif;border:none;border-radius:999px;padding:10px 40px;background:#5b3fc4;color:#fff;box-shadow:0 4px 0 #3b2690;cursor:pointer}",
".cl-jump:active{transform:translateY(2px);box-shadow:0 2px 0 #3b2690}",
".cl-tip{font-size:16px;font-weight:700;color:#1d2a3a;background:rgba(255,255,255,.8);border-radius:999px;padding:3px 12px}",
".cl-banner{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font:800 34px 'Baloo 2',system-ui,sans-serif;color:#fff;background:#1d2a3acc;border-radius:18px;padding:10px 22px;text-align:center;opacity:0;transition:opacity .3s;pointer-events:none}",
".cl-banner.on{opacity:1}",
".cl-how{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#1d2a3a99;z-index:5;padding:12px}",
".cl-how>div{background:#fff;color:#1d2a3a;border-radius:18px;padding:18px 24px;max-width:430px;text-align:center;font:600 18px/1.4 system-ui,sans-serif;display:flex;flex-direction:column;gap:10px;align-items:center}",
".cl-how .k{display:inline-block;border:2px solid #1d2a3a;border-bottom-width:4px;border-radius:8px;padding:0 8px;font-weight:800}",
".cl-how h3{margin:0;font:800 26px 'Baloo 2',system-ui,sans-serif}",
".cl-flat{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font:800 28px 'Baloo 2',system-ui,sans-serif;color:#1d2a3a}",
".cl-flat .cl-me{font-size:72px;transition:transform .3s}",
".cl-friends{font-size:22px;max-width:90%;text-align:center}"
].join("\n");

function start(host, api){
  if(!document.getElementById("cl-css")){ var st = document.createElement("style"); st.id = "cl-css"; st.textContent = CSS; document.head.appendChild(st); }
  host.innerHTML = '<div class="cl"><div class="cl-hud"><span class="cl-where"></span><span class="cl-stars"></span></div>' +
    '<div class="cl-banner"></div><div class="cl-bot"><div class="cl-bar"><div class="cl-zone"></div><div class="cl-dot"></div></div>' +
    '<button type="button" class="cl-jump">Jump!</button><div class="cl-tip">A / D: step · Space or W: jump when the dot is in the green.</div></div>' +
    '<div class="cl-how"><div><h3>How to climb</h3>' +
    '<div><span class="k">A</span> and <span class="k">D</span> step left and right on your ledge to line up with the next one.</div>' +
    '<div>Press <span class="k">Space</span> or <span class="k">W</span> (or click <b>Jump!</b>) when the dot is in the <b style="color:#2c8a3f">green</b>.</div>' +
    '<div>Miss and you fall: answer a question to get back on.</div>' +
    '<div>Each new mountain is faster, and the green gets smaller.</div>' +
    '<button type="button" class="cl-jump cl-go">Start (Space)</button></div></div></div>';
  var box = host.querySelector(".cl"), whereEl = host.querySelector(".cl-where"), starsEl = host.querySelector(".cl-stars"),
      dot = host.querySelector(".cl-dot"), zone = host.querySelector(".cl-zone"), banner = host.querySelector(".cl-banner"), jumpBtn = host.querySelector(".cl-jump");
  var how = host.querySelector(".cl-how");
  /* Harder each mountain: the green zone shrinks 10% per mountain, down to 60%. Speed also rises each ledge (speed()). */
  function tol(i){ return TOL * Math.max(0.6, 1 - 0.1 * Math.floor(i / PER_MTN)); }
  function sizeZone(){ zone.style.width = (tol(cur) / AMP * 50) + "%"; }
  function go(){ if(how){ how.remove(); how = null; t0 = performance.now(); } }
  host.querySelector(".cl-go").addEventListener("click", go);

  var saved = api.load() || {n:0, stars:0};
  var cur = saved.n || 0, stars = saved.stars || 0, t0 = performance.now(), busy = false, anim = null, stopped = false, raf = 0, lastPos = 0;
  var view = null;
  /* dx = where you stand on your ledge, screen right = +. In 3D, +tangent shows as screen LEFT, so the ledge at
     tangent offset `off` sits at screen -off, and you sit at tangent -dx. The jump lands if |dx + off| < tol.
     The dot shows you relative to the next ledge: D moves it right, A moves it left. */
  var dx = 0, LIM = 1.0, STEPX = 0.25;

  function speed(i){ return 1.5 + Math.min(i, 60) * 0.035; }
  function offset(now){ return AMP * Math.sin((now - t0) / 1000 * speed(cur)); }
  function mtn(i){ return Math.floor(i / PER_MTN) + 1; }
  function hud(){ whereEl.textContent = "Ledge " + (cur % PER_MTN) + " of " + PER_MTN + " · Mountain " + mtn(cur); starsEl.textContent = "⭐ " + stars; }
  function save(){ api.save({n:cur, stars:stars}); }
  function show(msg, ms){ banner.innerHTML = msg; banner.classList.add("on"); clearTimeout(show.t); show.t = setTimeout(function(){ banner.classList.remove("on"); }, ms || 1600); }
  hud(); sizeZone();

  function jump(){
    if(busy || anim || stopped || how) return;
    var now = performance.now(), off = offset(now), rel = off + dx, ok = Math.abs(rel) < tol(cur);
    anim = {t:now, ok:ok, off:off, rel:rel, dx:dx, from:cur};
    if(view) view.jump(ok, off);
  }
  function landed(){
    var ok = anim.ok; anim = null; dx = 0;
    if(ok){
      cur++; t0 = performance.now() + 200; hud(); save(); api.pos(cur); if(view) view.land(cur);
      if(cur % PER_MTN === 0){ stars += 3; hud(); save(); sizeZone(); show("🏔️ Summit! +3 ⭐<br>Mountain " + mtn(cur) + ": faster, smaller green!", 2800); }
      else if(cur % 5 === 0){
        busy = true;
        api.ask("⭐ Checkpoint! Answer to earn a star.", function(right){ busy = false; if(right){ stars++; hud(); save(); show("⭐ +1 star!"); } });
      }
    } else {
      busy = true;
      api.ask("Oops, you fell! Answer to get back on.", function(){ busy = false; if(view) view.respawn(cur); t0 = performance.now() + 300; });
    }
  }

  function onKey(e){
    if(api.modal()) return;
    var t = e.target && e.target.tagName; if(t === "INPUT" || t === "TEXTAREA") return;
    var step = (e.code === "KeyA" || e.key === "ArrowLeft") ? -1 : (e.code === "KeyD" || e.key === "ArrowRight") ? 1 : 0;
    if(step){ e.preventDefault(); if(!how && !anim && !busy) dx = Math.max(-LIM, Math.min(LIM, dx + step * STEPX)); return; }
    if(e.repeat) return;
    if(e.code === "Space" || e.key === "Enter" || e.code === "KeyW" || e.key === "ArrowUp"){ e.preventDefault(); if(how) go(); else jump(); }
  }
  document.addEventListener("keydown", onKey);
  jumpBtn.addEventListener("click", jump);

  function loop(now){
    if(stopped) return;
    raf = requestAnimationFrame(loop);
    var off = anim ? anim.off : offset(now);
    var rel = anim ? anim.rel : off + dx;
    dot.style.left = Math.max(0, Math.min(100, 50 + rel / AMP * 50)) + "%";
    if(anim && now - anim.t > (anim.ok ? 520 : 1100)) landed();
    if(now - lastPos > 3000){ lastPos = now; api.pos(cur); }
    if(view) view.frame(now, off, anim);
  }

  function flatView(){
    var f = document.createElement("div"); f.className = "cl-flat";
    f.innerHTML = '<div class="cl-me">' + esc(api.me) + '</div><div class="cl-friends"></div>';
    box.insertBefore(f, banner);
    var meEl = f.querySelector(".cl-me"), fr = f.querySelector(".cl-friends");
    return {
      jump:function(ok){ meEl.style.transform = ok ? "translateY(-40px)" : "translateY(40px) rotate(90deg)"; },
      land:function(){ meEl.style.transform = ""; }, respawn:function(){ meEl.style.transform = ""; },
      frame:function(){ if(!anim) meEl.style.marginLeft = (dx * 60) + "px"; var F = api.friends(); fr.textContent = Object.keys(F).map(function(a){ return a + " ledge " + (F[a] % PER_MTN); }).join("   "); }
    };
  }

  function threeView(){
    var T = window.THREE, w = box.clientWidth, h = box.clientHeight;
    var renderer = new T.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.setSize(w, h);
    box.insertBefore(renderer.domElement, box.firstChild);
    var scene = new T.Scene(); scene.background = new T.Color(0xbfe3ff); scene.fog = new T.Fog(0xbfe3ff, 18, 60);
    var cam = new T.PerspectiveCamera(55, w / h, 0.1, 200);
    scene.add(new T.HemisphereLight(0xffffff, 0x7a8aa0, 0.9));
    var sun = new T.DirectionalLight(0xffffff, 0.7); sun.position.set(8, 20, 6); scene.add(sun);
    var COL = [0x8b7d6b, 0x6f8f72, 0x8a7aa8, 0xa07862, 0x6b8aa8];
    var rockMat = new T.MeshLambertMaterial({color:COL[0], flatShading:true});
    var rock = new T.Mesh(new T.CylinderGeometry(R - 1.6, R - 1.2, 90, 9, 12), rockMat); scene.add(rock);
    var ground = new T.Mesh(new T.CircleGeometry(60, 24), new T.MeshLambertMaterial({color:0x9ccf8a})); ground.rotation.x = -Math.PI / 2; ground.position.y = -1; scene.add(ground);
    var ledgeGeo = new T.BoxGeometry(2.3, 0.45, 2.3), ledges = {};
    var mats = {n:new T.MeshLambertMaterial({color:0xd9c7a3}), c:new T.MeshLambertMaterial({color:0xffcf4a}), s:new T.MeshLambertMaterial({color:0xffffff})};
    function base(i){ var a = i * STEP; return {x:Math.cos(a) * R, z:Math.sin(a) * R, y:i * RISE, a:a}; }
    function tangent(i){ var a = i * STEP; return {x:-Math.sin(a), z:Math.cos(a)}; }
    function ledge(i){
      if(ledges[i]) return ledges[i];
      var m = new T.Mesh(ledgeGeo, i % PER_MTN === 0 && i > 0 ? mats.s : i % 5 === 0 && i > 0 ? mats.c : mats.n), b = base(i);
      m.position.set(b.x, b.y, b.z); m.rotation.y = -b.a; scene.add(m);
      if(i % PER_MTN === 0 && i > 0){
        var pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2), new T.MeshLambertMaterial({color:0x555555})); pole.position.set(0.6, 1.2, 0.6); m.add(pole);
        var flag = new T.Mesh(new T.PlaneGeometry(0.9, 0.55), new T.MeshLambertMaterial({color:0xe84b4b, side:T.DoubleSide})); flag.position.set(1.05, 1.9, 0.6); m.add(flag);
      }
      return (ledges[i] = m);
    }
    function trim(){ Object.keys(ledges).forEach(function(k){ k = +k; if(k < cur - 8 || k > cur + 14){ scene.remove(ledges[k]); delete ledges[k]; } }); for(var i = Math.max(0, cur - 6); i <= cur + 12; i++) ledge(i); }
    function sprite(txt, size){
      var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d");
      g.font = "96px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 64, 72);
      var s = new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c), transparent:true})); s.scale.set(size, size, 1); return s;
    }
    var me = sprite(api.me, 1.7); scene.add(me);
    var friends = {};
    var pos = new T.Vector3(), camPos = new T.Vector3(), look = new T.Vector3(), jumpFrom = null;
    function onLedge(i, dx){ var b = base(i), tg = tangent(i); return new T.Vector3(b.x + tg.x * (dx || 0), b.y + 1.05, b.z + tg.z * (dx || 0)); }
    pos.copy(onLedge(cur)); trim();
    camPos.set(Math.cos(cur * STEP) * (R + 9), cur * RISE + 4, Math.sin(cur * STEP) * (R + 9));
    function resize(){ var W = box.clientWidth, H = box.clientHeight; if(!W || !H) return; renderer.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix(); }
    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("click", jump);
    return {
      jump:function(){ jumpFrom = pos.clone(); },
      land:function(i){ rockMat.color.setHex(COL[(mtn(i) - 1) % COL.length]); trim(); },
      respawn:function(i){ pos.copy(onLedge(i)); },
      frame:function(now, off, a){
        var nx = ledge(cur + 1), b1 = base(cur + 1), tg = tangent(cur + 1);
        nx.position.set(b1.x + tg.x * off, b1.y, b1.z + tg.z * off);
        if(a){
          var k = Math.min(1, (now - a.t) / 520), target = onLedge(cur + 1, a.off);
          if(!a.ok) target = onLedge(cur + 1, -a.dx);
          if(k < 1){ pos.lerpVectors(jumpFrom, target, k); pos.y += Math.sin(k * Math.PI) * 1.6; }
          else if(!a.ok){ pos.y -= 0.18; }
          else pos.copy(target);
        } else if(!busy){ pos.lerp(onLedge(cur, -dx), 0.35); }
        me.position.copy(pos);
        var ca = Math.atan2(pos.z, pos.x) - 0.35;
        look.lerp(new T.Vector3(pos.x * 0.6, pos.y + 1.2, pos.z * 0.6), 0.08);
        camPos.lerp(new T.Vector3(Math.cos(ca) * (R + 9), pos.y + 3.6, Math.sin(ca) * (R + 9)), 0.06);
        cam.position.copy(camPos); cam.lookAt(look);
        rock.position.y = pos.y;
        var F = api.friends();
        Object.keys(friends).forEach(function(av){ if(!(av in F)){ scene.remove(friends[av]); delete friends[av]; } });
        Object.keys(F).forEach(function(av, j){
          if(!friends[av]){ friends[av] = sprite(av, 1.3); scene.add(friends[av]); }
          var p = onLedge(F[av], ((j % 3) - 1) * 0.7); friends[av].position.copy(p);
        });
        renderer.render(scene, cam);
      },
      destroy:function(){ window.removeEventListener("resize", resize); try{ renderer.dispose(); }catch(e){} }
    };
  }

  if(webgl()) loadThree(function(ok){ if(stopped) return; try{ view = ok ? threeView() : flatView(); }catch(e){ view = flatView(); } });
  else view = flatView();
  raf = requestAnimationFrame(loop);
  api.pos(cur);

  return {stop:function(){ stopped = true; cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); if(view && view.destroy) view.destroy(); host.innerHTML = ""; }};
}

window.HubGames = window.HubGames || {};
window.HubGames.climb = {name:"Summit Climb", icon:"🏔️", start:start};
})();
