/* Pokémon Ultimate — Championship Arena engine */
(function () {
'use strict';

var GEN_RANGES = {1:[1,151],2:[152,251],3:[252,386],4:[387,493]};
var ALL_TYPES = ['normal','fire','water','electric','grass','ice','fighting',
  'poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
var TYPE_EMOJI = {
  normal:'●',fire:'▲',water:'◆',electric:'⚡',
  grass:'♣',ice:'❄',fighting:'◈',poison:'☠',
  ground:'▆',flying:'☁',psychic:'◇',bug:'※',
  rock:'▣',ghost:'◌',dragon:'◈',dark:'☽',
  steel:'⚙',fairy:'✦'
};
var TC = {
  normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',
  grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',
  ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',
  rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',
  steel:'#B7B7CE',fairy:'#D685AD'
};
var SC = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6'];
var SL = ['HP','ATK','DEF','SPA','SPD','SPE'];
var TYPE_CHART = {
  fire:['grass','bug','steel','ice'],water:['fire','ground','rock'],
  grass:['water','ground','rock'],electric:['water','flying'],
  ice:['grass','ground','flying','dragon'],fighting:['normal','rock','steel','ice','dark'],
  poison:['grass','fairy'],ground:['fire','electric','poison','rock','steel'],
  flying:['grass','fighting','bug'],psychic:['fighting','poison'],
  bug:['grass','psychic','dark'],rock:['fire','ice','flying','bug'],
  ghost:['psychic','ghost'],dragon:['dragon'],dark:['psychic','ghost'],
  steel:['ice','rock','fairy'],fairy:['fighting','dragon','dark']
};
var MEGA_NAMES = [
  'venusaur-mega','charizard-mega-x','charizard-mega-y','blastoise-mega',
  'alakazam-mega','gengar-mega','kangaskhan-mega','pinsir-mega','gyarados-mega',
  'aerodactyl-mega','mewtwo-mega-x','mewtwo-mega-y','ampharos-mega','scizor-mega',
  'heracross-mega','houndoom-mega','tyranitar-mega','blaziken-mega','gardevoir-mega',
  'mawile-mega','aggron-mega','medicham-mega','manectric-mega','banette-mega',
  'absol-mega','latias-mega','latios-mega','salamence-mega','metagross-mega',
  'rayquaza-mega','sceptile-mega','swampert-mega','sharpedo-mega','camerupt-mega',
  'glalie-mega','pidgeot-mega','slowbro-mega','steelix-mega','lucario-mega',
  'garchomp-mega','abomasnow-mega','gallade-mega','audino-mega','lopunny-mega',
  'kyogre-primal','groudon-primal','deoxys-attack','deoxys-defense','deoxys-speed',
  'giratina-origin','shaymin-sky','rotom-heat','rotom-wash','rotom-frost',
  'rotom-fan','rotom-mow','castform-sunny','castform-rainy','castform-snowy',
  'wormadam-sandy','wormadam-trash'
];

var _pokeCache = {};
function fetchPoke(id) {
  if (_pokeCache[id]) return Promise.resolve(_pokeCache[id]);
  var attempts = 0;
  function tryFetch() {
    return fetch('https://pokeapi.co/api/v2/pokemon/' + id)
      .then(function(r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function(d) { _pokeCache[id] = d; return d; })
      .catch(function(e) {
        attempts++;
        if (attempts >= 3) throw e;
        return new Promise(function(res) { setTimeout(res, 500 * attempts); }).then(tryFetch);
      });
  }
  return tryFetch();
}

function animUrl(id) {
  if (!id || id >= 10000) return null;
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/' + id + '.gif';
}
function imgUrl(id) {
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + id + '.png';
}
function imgFb(id) {
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + id + '.png';
}
function spriteChain(id, flip) {
  var anim = animUrl(id);
  var art = imgUrl(id);
  var fb = imgFb(id);
  var flipCls = flip ? ' flipped' : '';
  if (anim) {
    return '<img class="fighter-sprite' + flipCls + '" src="' + anim + '" alt=""'
      + ' onerror="this.onerror=null;this.src=\'' + art + '\';this.onerror=function(){this.onerror=null;this.src=\'' + fb + '\';};">';
  }
  return '<img class="fighter-sprite' + flipCls + '" src="' + art + '" alt=""'
    + ' onerror="this.onerror=null;this.src=\'' + fb + '\'">';
}
function allIds(genSet) {
  var ids = [];
  genSet.forEach(function(g) {
    var r = GEN_RANGES[g];
    for (var i = r[0]; i <= r[1]; i++) ids.push(i);
  });
  return ids;
}
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function bst(stats) { return stats.reduce(function(s, x) { return s + x.base_stat; }, 0); }
function genLbl(id) {
  var keys = Object.keys(GEN_RANGES);
  for (var i = 0; i < keys.length; i++) {
    var r = GEN_RANGES[keys[i]];
    if (id >= r[0] && id <= r[1]) return ['I','II','III','IV'][keys[i]-1];
  }
  return 'MEGA';
}
function cleanName(name) {
  if (!name) return '';
  var p = name.split('-');
  if (p.length > 1 && p[p.length-1] === 'mega') return 'MEGA ' + p.slice(0,-1).join(' ').toUpperCase();
  if (p.length > 1 && p[1] === 'mega') return 'MEGA ' + p[0].toUpperCase() + (p[2] ? ' ' + p[2].toUpperCase() : '');
  if (p.length > 1 && p[p.length-1] === 'primal') return 'PRIMAL ' + p.slice(0,-1).join(' ').toUpperCase();
  return p.join(' ').toUpperCase();
}
function fetchMegaPool(typeSet) {
  var result = []; var promise = Promise.resolve();
  var B = 6;
  for (var i = 0; i < MEGA_NAMES.length; i += B) {
    (function(batch) {
      promise = promise.then(function() {
        return Promise.all(batch.map(function(name) {
          return fetchPoke(name).then(function(d) {
            if (!typeSet || typeSet.size === 0 ||
                d.types.some(function(t) { return typeSet.has(t.type.name); })) {
              result.push(d);
            }
          }).catch(function() {});
        })).then(function() {
          return new Promise(function(r) { setTimeout(r, 30); });
        });
      });
    })(MEGA_NAMES.slice(i, i + B));
  }
  return promise.then(function() { return result; });
}

var WIN_KEY = 'poke_wins_v1';
var RIVALRY_KEY = 'poke_rivals_v1';
var HOF_KEY = 'poke_hof_v1';
var STATS_KEY = 'poke_stats_v1';
var SAVE_KEY = 'poke_save_v1';

function getWins() { try { return JSON.parse(localStorage.getItem(WIN_KEY)||'{}'); } catch(e) { return {}; } }
function recordWin(id) { try { var w=getWins(); w[id]=(w[id]||0)+1; localStorage.setItem(WIN_KEY,JSON.stringify(w)); } catch(e) {} }
function getWinCount(id) { return getWins()[id] || 0; }
function getRivals() { try { return JSON.parse(localStorage.getItem(RIVALRY_KEY)||'{}'); } catch(e) { return {}; } }
function recordMatchup(wId, lId) {
  try {
    var r = getRivals();
    var key = Math.min(wId,lId) + '_' + Math.max(wId,lId);
    if (!r[key]) r[key] = {a:wId, b:lId, aWins:0, bWins:0};
    if (wId === r[key].a) r[key].aWins++; else r[key].bWins++;
    localStorage.setItem(RIVALRY_KEY, JSON.stringify(r));
  } catch(e) {}
}
function getRivalryText(pA, pB) {
  try {
    var r = getRivals();
    var key = Math.min(pA.id,pB.id) + '_' + Math.max(pA.id,pB.id);
    if (!r[key]) return null;
    var d = r[key]; var total = d.aWins + d.bWins;
    if (total < 2) return null;
    var aW = pA.id===d.a ? d.aWins : d.bWins;
    var bW = pA.id===d.b ? d.aWins : d.bWins;
    if (aW > bW) return cleanName(pA.name)+' leads '+aW+'-'+bW;
    if (bW > aW) return cleanName(pB.name)+' leads '+bW+'-'+aW;
    return 'Tied '+aW+'-'+bW;
  } catch(e) { return null; }
}

function getHOF() { try { return JSON.parse(localStorage.getItem(HOF_KEY)||'[]'); } catch(e) { return []; } }
function recordChampion(poke, mode) {
  try {
    var h = getHOF();
    var path = [];
    if (T && T.bracket) {
      T.bracket.forEach(function(round) {
        round.forEach(function(match) {
          if (match.winner && match.winner.id === poke.id && match.a && match.b) {
            var defeated = match.winner.id === match.a.id ? match.b : match.a;
            path.push({id: defeated.id, name: cleanName(defeated.name)});
          }
        });
      });
    }
    var runnerUp = null;
    if (T && T.bracket && T.bracket.length > 0) {
      var finalRound = T.bracket[T.bracket.length-1];
      if (finalRound && finalRound[0]) {
        var f = finalRound[0];
        if (f.a && f.b && f.winner) {
          var lo = f.winner.id === f.a.id ? f.b : f.a;
          runnerUp = {id: lo.id, name: cleanName(lo.name), bst: bst(lo.stats)};
        }
      }
    }
    var entry = {
      id: poke.id, name: cleanName(poke.name),
      bst: bst(poke.stats), mode: mode,
      date: new Date().toLocaleDateString(),
      path: path, runnerUp: runnerUp,
      matches: _tourneyMatches || 0,
      upsets: _tourneyUpsets || 0,
      twoP: _twoPlayer ? {p1:_p1name, p2:_p2name, p1w:_p1wins, p2w:_p2wins} : null
    };
    h.unshift(entry);
    if (h.length > 30) h = h.slice(0, 30);
    localStorage.setItem(HOF_KEY, JSON.stringify(h));
  } catch(e) {}
}
function openHOF() { renderHOF(); go('hof-screen'); }
function renderHOF() {
  var h = getHOF();
  var el = document.getElementById('hof-list');
  if (!el) return;
  if (!h.length) {
    el.innerHTML = '<div style="text-align:center;color:#5d6b7e;padding:40px;font-size:14px">No champions yet.<br>Win a tournament first.</div>';
    return;
  }
  el.innerHTML = '';
  h.forEach(function(e, i) {
    var div = document.createElement('div');
    div.className = 'hof-entry';
    div.style.animationDelay = (i * 0.04) + 's';
    var detailHint = (e.path && e.path.length) ? ' · Tap for vault' : '';
    div.innerHTML = '<div class="hof-rank">' + (i === 0 ? '★' : (i+1)) + '</div>'
      + '<img class="hof-img" src="' + imgFb(e.id) + '" alt="' + e.name + '">'
      + '<div class="hof-info"><div class="hof-name">' + e.name + '</div>'
      + '<div class="hof-meta">' + e.mode.toUpperCase() + ' · ' + e.date + detailHint + '</div></div>'
      + '<div class="hof-bst">' + e.bst + '<br><span style="font-size:10px;color:#5d6b7e">BST</span></div>';
    div.onclick = function() { openVaultEntry(i); };
    el.appendChild(div);
  });
}
function openVaultEntry(idx) {
  var h = getHOF();
  var e = h[idx]; if (!e) return;
  var el = document.getElementById('vault-detail');
  if (!el) return;
  var pathH = '';
  if (e.path && e.path.length) {
    pathH = '<div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#5d6b7e;margin-bottom:8px">Defeated ' + e.path.length + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">';
    e.path.forEach(function(p) {
      pathH += '<div style="display:flex;flex-direction:column;align-items:center;width:64px">'
        + '<img src="' + imgFb(p.id) + '" alt="" style="width:44px;height:44px;object-fit:contain;image-rendering:pixelated;opacity:.75">'
        + '<div style="font-size:9px;color:#9aa6b8;text-align:center;margin-top:3px">' + p.name + '</div></div>';
    });
    pathH += '</div>';
  }
  var runnerH = '';
  if (e.runnerUp) {
    runnerH = '<div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#5d6b7e;margin-bottom:6px">Runner up</div>'
      + '<div style="display:flex;align-items:center;gap:10px;background:#101828;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 12px;margin-bottom:14px">'
      + '<img src="' + imgFb(e.runnerUp.id) + '" style="width:44px;height:44px;object-fit:contain;image-rendering:pixelated">'
      + '<div style="flex:1"><div style="font-weight:700">' + e.runnerUp.name + '</div>'
      + '<div style="font-size:12px;color:#9aa6b8">BST ' + (e.runnerUp.bst || '?') + '</div></div></div>';
  }
  var twoPH = '';
  if (e.twoP) {
    var winner = e.twoP.p1w > e.twoP.p2w ? e.twoP.p1 : e.twoP.p2w > e.twoP.p1w ? e.twoP.p2 : 'TIE';
    twoPH = '<div style="background:rgba(126,200,255,.08);border:1px solid rgba(126,200,255,.25);border-radius:14px;padding:12px;margin-bottom:14px;font-size:13px;text-align:center">'
      + '<div style="letter-spacing:0.1em;text-transform:uppercase;font-weight:700;margin-bottom:6px;color:#7ec8ff">2 Player Game</div>'
      + '<span style="color:#7ec8ff">' + e.twoP.p1 + ': ' + e.twoP.p1w + '</span>'
      + ' · <span style="color:#3dcf8e">' + e.twoP.p2 + ': ' + e.twoP.p2w + '</span>'
      + (winner !== 'TIE' ? '<div style="margin-top:6px;color:#f0c14b">Winner: ' + winner + '</div>' : '<div style="margin-top:6px">Tie game</div>')
      + '</div>';
  }
  el.innerHTML = '<div style="text-align:center;margin-bottom:16px">'
    + '<img src="' + imgUrl(e.id) + '" onerror="this.onerror=null;this.src=\'' + imgFb(e.id) + '\'" style="width:150px;height:150px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 0 24px rgba(240,193,75,.45))">'
    + '<div style="font-family:Bricolage Grotesque,Georgia,serif;font-size:34px;color:#f0c14b;letter-spacing:-0.03em;margin-top:6px">' + e.name + '</div>'
    + '<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5d6b7e;margin-top:4px">' + e.mode + ' champion · ' + e.date + '</div>'
    + '<div style="font-size:14px;color:#f0c14b;margin-top:6px;font-weight:700">BST ' + e.bst + '</div></div>'
    + '<div style="background:#101828;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:16px">'
    + twoPH + runnerH + pathH
    + '<div style="display:flex;justify-content:space-around;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5d6b7e;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)">'
    + '<div>Battles <span style="color:#f0c14b">' + (e.matches||'?') + '</span></div>'
    + '<div>Upsets <span style="color:#f0c14b">' + (e.upsets||0) + '</span></div></div></div>';
  go('vault-screen');
}
function clearHOF() {
  if (confirm('Clear Hall of Fame?')) {
    localStorage.removeItem(HOF_KEY);
    renderHOF();
  }
}

function saveTournament() {
  try {
    if (!T || !T.bracket || T.bracket.length === 0) return;
    var data = {
      bracket: T.bracket, round: T.round, match: T.match, mode: T.mode,
      twoPlayer: _twoPlayer,
      p1name: _p1name, p2name: _p2name,
      p1wins: _p1wins, p2wins: _p2wins, twoPturn: _twoPturn,
      streak: _streak,
      tStart: _tourneyStartTime, tMatches: _tourneyMatches, tUpsets: _tourneyUpsets,
      ts: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch(e) {}
}
function hasSavedTournament() {
  try {
    var s = localStorage.getItem(SAVE_KEY); if (!s) return null;
    var d = JSON.parse(s);
    if (Date.now() - d.ts > 7*24*60*60*1000) { localStorage.removeItem(SAVE_KEY); return null; }
    return d;
  } catch(e) { return null; }
}
function resumeTournament() {
  var d = hasSavedTournament(); if (!d) return;
  T = {bracket:d.bracket, round:d.round, match:d.match, mode:d.mode};
  _twoPlayer = !!d.twoPlayer;
  _p1name = d.p1name || 'PLAYER 1';
  _p2name = d.p2name || 'PLAYER 2';
  _p1wins = d.p1wins||0; _p2wins = d.p2wins||0;
  _twoPturn = d.twoPturn || 'p1';
  _streak = d.streak || {id:null, count:0};
  _tourneyStartTime = d.tStart || Date.now();
  _tourneyMatches = d.tMatches || 0; _tourneyUpsets = d.tUpsets || 0;
  _prevState = null; _canUndo = false;
  if (_twoPlayer) { update2PBar(); } else { hide2PBar(); }
  var btn = document.getElementById('two-p-btn');
  if (btn) {
    btn.textContent = _twoPlayer ? '2P: On' : '2P Mode';
  }
  _replayFn = d.mode === 'mega' ? launchMega : d.mode === 'mini' ? launchMini : null;
  go('battle-screen');
  renderCurrentBattle();
}
function clearSavedTournament() { try { localStorage.removeItem(SAVE_KEY); } catch(e) {} }
function showResumeBanner() {
  var slot = document.getElementById('resume-slot');
  if (!slot) return;
  slot.innerHTML = '';
  var d = hasSavedTournament(); if (!d) return;
  var realInRound = d.bracket[d.round].filter(function(m){return m.a&&m.b;}).length;
  var doneInRound = d.bracket[d.round].filter(function(m){return m.a&&m.b&&m.winner!==null;}).length;
  var ago = Math.round((Date.now()-d.ts)/60000);
  var agoText = ago < 1 ? 'just now' : ago < 60 ? (ago+'m ago') : ago < 1440 ? (Math.round(ago/60)+'h ago') : (Math.round(ago/1440)+'d ago');
  var modeLabel = d.mode === 'mega' ? 'Mega' : d.mode === 'mini' ? 'Mini' : 'Tournament';
  var banner = document.createElement('div');
  banner.id = 'resume-banner';
  banner.innerHTML = '<div style="font-size:28px">⏵</div>'
    + '<div style="flex:1;text-align:left">'
    + '<div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:#fff">Resume ' + modeLabel + '</div>'
    + '<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:3px">'
    + 'Round ' + (d.round+1) + ' · Match ' + (doneInRound+1) + '/' + realInRound + ' · ' + agoText + '</div></div>'
    + '<button type="button" style="background:transparent;border:none;color:rgba(255,255,255,.7);font-size:22px;cursor:pointer;padding:4px 8px">×</button>';
  banner.querySelector('button').onclick = function(ev) {
    ev.stopPropagation();
    clearSavedTournament();
    showResumeBanner();
  };
  banner.onclick = function() { resumeTournament(); };
  slot.appendChild(banner);
}

function getLifeStats() { try { return JSON.parse(localStorage.getItem(STATS_KEY)||'{"picks":0,"tournaments":0,"upsets":0}'); } catch(e) { return {picks:0,tournaments:0,upsets:0}; } }
function recordPick() { try { var s=getLifeStats(); s.picks++; localStorage.setItem(STATS_KEY,JSON.stringify(s)); } catch(e) {} }
function recordTournament() { try { var s=getLifeStats(); s.tournaments++; localStorage.setItem(STATS_KEY,JSON.stringify(s)); } catch(e) {} }
function recordUpset() { try { var s=getLifeStats(); s.upsets++; localStorage.setItem(STATS_KEY,JSON.stringify(s)); } catch(e) {} }
function openStats() {
  var s = getLifeStats();
  var w = getWins();
  var wArr = Object.keys(w).map(function(k) { return {id:k, wins:w[k]}; });
  wArr.sort(function(a,b) { return b.wins - a.wins; });
  var el = document.getElementById('stats-list');
  if (!el) return;
  el.innerHTML = '';
  var items = [
    {label:'Total picks', val: s.picks, sub:'All time'},
    {label:'Tournaments', val: s.tournaments, sub:'Completed'},
    {label:'Upsets', val: s.upsets, sub:'Low seed beats high seed'},
    {label:'Pokémon tracked', val: wArr.length, sub:'With at least 1 win'}
  ];
  if (wArr.length > 0) {
    items.push({label:'Most wins', val: '#' + wArr[0].id, sub: wArr[0].wins + ' career wins'});
  }
  items.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'stat-card';
    div.innerHTML = '<div class="stat-card-label">' + item.label + '</div>'
      + '<div class="stat-card-val">' + item.val + '</div>'
      + '<div class="stat-card-sub">' + item.sub + '</div>';
    el.appendChild(div);
  });
  go('stats-screen');
}
function clearStats() {
  if (confirm('Clear all stats?')) {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(WIN_KEY);
    localStorage.removeItem(RIVALRY_KEY);
    openStats();
  }
}

var _audioOn = true; var _audioCtx = null;
function getACtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}
function playTone(freq, type, dur, vol, delay) {
  if (!_audioOn) return;
  try {
    var ctx = getACtx(); if (!ctx) return;
    var o = ctx.createOscillator(); var g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type || 'square'; o.frequency.value = freq;
    var t = ctx.currentTime + (delay || 0);
    g.gain.setValueAtTime(vol || 0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  } catch(e) {}
}
function playPickSound() {
  try {
    var rlen = T.bracket[T.round] ? T.bracket[T.round].length : 99;
    if (rlen === 1) { playFanfare(); return; }
    playTone(523,'square',.08,.07);
    playTone(659,'square',.08,.07,.1);
    playTone(784,'square',.12,.07,.2);
  } catch(e) {}
}
function playFanfare() {
  try {
    var n = [523,659,784,1047,784,1047,1319];
    n.forEach(function(f, i) { playTone(f,'square',.18,.09,i*.12); });
  } catch(e) {}
}
function playUpsetSound() {
  try {
    playTone(300,'square',.05,.08);
    playTone(400,'square',.05,.08,.08);
    playTone(600,'square',.05,.08,.16);
    playTone(900,'square',.2,.1,.26);
  } catch(e) {}
}
function playImpactSound() {
  try {
    playTone(120,'sawtooth',.08,.05);
    playTone(80,'square',.12,.06,.05);
  } catch(e) {}
}
function toggleAudio() {
  _audioOn = !_audioOn;
  var btn = document.getElementById('audio-btn');
  if (btn) btn.textContent = _audioOn ? 'Sound On' : 'Sound Off';
}
var _cryAudio = null;
function playCry(poke) {
  if (!_audioOn || !poke) return;
  try {
    var url = poke.cries && (poke.cries.latest || poke.cries.legacy);
    if (!url) return;
    if (_cryAudio) { try { _cryAudio.pause(); } catch(e) {} }
    _cryAudio = new Audio(url);
    _cryAudio.volume = 0.4;
    _cryAudio.play().catch(function(){});
  } catch(e) {}
}

function seedPokes(pokes) {
  var seen = {}; var unique = [];
  pokes.forEach(function(p) {
    if (p && !seen[p.id]) { seen[p.id] = true; unique.push(p); }
  });
  var groups = {};
  unique.forEach(function(p) {
    var w = getWinCount(p.id);
    if (!groups[w]) groups[w] = [];
    groups[w].push(p);
  });
  Object.keys(groups).forEach(function(w) { groups[w] = shuffle(groups[w]); });
  var levels = Object.keys(groups).map(Number).sort(function(a,b) { return b-a; });
  var result = [];
  levels.forEach(function(w) { groups[w].forEach(function(p) { result.push(p); }); });
  return result;
}
function buildSeedOrder(size) {
  if (size === 1) return [1];
  var half = size / 2;
  var left = buildSeedOrder(half);
  var result = [];
  for (var i = 0; i < left.length; i++) {
    result.push(left[i]);
    result.push(size + 1 - left[i]);
  }
  return result;
}
function mkBracketRound(pokes) {
  var n = pokes.length;
  if (n === 0) return [];
  var sz = 1; while (sz < n) sz *= 2;
  var seedOrder = buildSeedOrder(sz);
  var slots = [];
  for (var i = 0; i < sz; i++) {
    var seed = seedOrder[i];
    slots.push(seed <= n ? pokes[seed-1] : null);
  }
  var matches = [];
  for (var i = 0; i < slots.length; i += 2) {
    var a = slots[i]; var b = slots[i+1];
    var winner = (a && !b) ? a : (!a && b) ? b : null;
    matches.push({a:a, b:b, winner:winner, bye: winner !== null});
  }
  return matches;
}

var CHROME_HIDE = { 'home-screen': true, 'battle-screen': true, 'pickerBattle': true, 'clash-screen': true, 'loading-screen': true, 'champ-screen': true };
function go(id) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
  var chrome = document.getElementById('app-chrome');
  if (chrome) {
    if (CHROME_HIDE[id]) chrome.classList.add('hidden');
    else chrome.classList.remove('hidden');
  }
  window.scrollTo(0, 0);
  if (id === 'home-screen') {
    showResumeBanner();
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('GET_CACHE_SIZE');
    }
  }
}

var state = {
  pickerGens:  new Set([1,2,3,4]), pickerTypes:  new Set(), pickerMegas:  false,
  miniGens:    new Set([1,2,3,4]), miniTypes:    new Set(), miniSize: 8,  miniMegas:   false,
  megaGens:    new Set([1,2,3,4]), megaTypes:    new Set(),              megaMegas:   false,
  clashGens:   new Set([1,2,3,4]), clashTypeA:   new Set(), clashTypeB:  new Set(),
  clashRounds: 5,                  clashMegas:   false
};
var T = {bracket:[], round:0, match:0, mode:'mini'};
var _prevState  = null;
var _canUndo    = false;
var _replayFn   = null;
var _twoPlayer  = false;
var _p1wins     = 0;
var _p2wins     = 0;
var _p1name     = 'PLAYER 1';
var _p2name     = 'PLAYER 2';
var _twoPturn   = 'p1';
var _streak     = {id:null, count:0};
var _tourneyStartTime = 0;
var _tourneyMatches   = 0;
var _tourneyUpsets    = 0;
var _battleBusy = false;

function buildGenBtns(containerId, stateKey, onChange) {
  var el = document.getElementById(containerId); if (!el) return; el.innerHTML = '';
  [1,2,3,4].forEach(function(g) {
    var b = document.createElement('button'); b.className = 'gen-btn';
    if (state[stateKey].has(g)) b.classList.add('on');
    b.textContent = 'Gen ' + ['I','II','III','IV'][g-1];
    b.onclick = function() {
      if (state[stateKey].has(g)) {
        if (state[stateKey].size === 1) return;
        state[stateKey].delete(g); b.classList.remove('on');
      } else {
        state[stateKey].add(g); b.classList.add('on');
      }
      if (onChange) onChange();
    };
    el.appendChild(b);
  });
}
function buildTypeBtns(containerId, stateKey, single, excludeKey, onChange) {
  var el = document.getElementById(containerId); if (!el) return; el.innerHTML = '';
  ALL_TYPES.forEach(function(t) {
    var c = TC[t] || '#888';
    var excluded = excludeKey && state[excludeKey].has(t);
    var on = state[stateKey].has(t);
    var b = document.createElement('button'); b.className = 'type-btn';
    b.disabled = excluded;
    b.style.borderColor = on ? c : (excluded ? '#1a1a2e' : 'rgba(255,255,255,0.08)');
    b.style.background  = on ? (c + '22') : (excluded ? '#0d0d1a' : 'rgba(255,255,255,0.03)');
    b.style.color       = on ? c : (excluded ? '#333' : '#9aa6b8');
    b.innerHTML = '<span class="type-emoji">' + TYPE_EMOJI[t] + '</span><span>' + t + '</span>';
    b.onclick = function() {
      if (excluded) return;
      if (single) {
        state[stateKey].clear();
        buildTypeBtns(containerId, stateKey, single, excludeKey, onChange);
        state[stateKey].add(t);
        buildTypeBtns(containerId, stateKey, single, excludeKey, onChange);
        if (excludeKey) {
          if (stateKey === 'clashTypeA') buildTypeBtns('cb-types','clashTypeB',true,'clashTypeA',onChange);
          else buildTypeBtns('ca-types','clashTypeA',true,'clashTypeB',onChange);
        }
      } else {
        if (on) state[stateKey].delete(t); else state[stateKey].add(t);
        buildTypeBtns(containerId, stateKey, single, excludeKey, onChange);
      }
      if (onChange) onChange();
    };
    el.appendChild(b);
  });
}
function buildSizeBtns(containerId, stateKey, sizes, onChange) {
  var el = document.getElementById(containerId); if (!el) return; el.innerHTML = '';
  sizes.forEach(function(item) {
    var b = document.createElement('button'); b.className = 'sz-btn';
    if (state[stateKey] === item.v) b.classList.add('on');
    b.textContent = item.l;
    b.onclick = function() {
      state[stateKey] = item.v;
      var btns = el.querySelectorAll('.sz-btn');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('on');
      b.classList.add('on');
      if (onChange) onChange();
    };
    el.appendChild(b);
  });
}
function buildMegaToggle(containerId, stateKey) {
  var el = document.getElementById(containerId); if (!el) return; el.innerHTML = '';
  var on = state[stateKey];
  var btn = document.createElement('button');
  btn.className = 'mega-toggle-btn';
  btn.style.border = '1px solid ' + (on ? 'rgba(240,193,75,.45)' : 'rgba(255,255,255,.08)');
  btn.style.background = on ? 'rgba(240,193,75,.1)' : 'rgba(255,255,255,.03)';
  btn.style.color = on ? '#f0c14b' : '#9aa6b8';
  btn.innerHTML = '<span style="font-size:18px">⚡</span>'
    + '<div><div style="font-weight:700;margin-bottom:2px">' + (on ? 'On · ' : '') + 'Megas & special forms</div>'
    + '<div style="font-size:11px;opacity:.7">61 Mega Evolutions, Primals & alt forms</div></div>';
  btn.onclick = function() {
    state[stateKey] = !state[stateKey];
    buildMegaToggle(containerId, stateKey);
    updateMegaCount();
  };
  el.appendChild(btn);
}
function updateMegaCount() {
  var n = allIds(state.megaGens).length;
  var extra = state.megaMegas ? 61 : 0;
  var total = n + extra;
  var sz = 1; while (sz < total) sz *= 2;
  var el = document.getElementById('mega-count'); if (!el) return;
  var extraText = extra ? ' (+' + extra + ' megas)' : '';
  el.innerHTML = state.megaTypes.size
    ? 'Type filter on — count at load time'
    : 'All <b>' + total + '</b> Pokémon' + extraText + ' · Bracket: <b>' + sz + '</b> slots';
}
function validateClash() {
  var a = [...state.clashTypeA][0]; var b = [...state.clashTypeB][0];
  var w = document.getElementById('clash-warn');
  var btn = document.getElementById('clash-start-btn');
  if (!a || !b) { if(w)w.textContent='Select a type for each side'; if(btn)btn.disabled=true; }
  else if (a === b) { if(w)w.textContent='Types must be different'; if(btn)btn.disabled=true; }
  else { if(w)w.textContent=''; if(btn)btn.disabled=false; }
}
function initFilters() {
  buildGenBtns('ps-gens','pickerGens');
  buildTypeBtns('ps-types','pickerTypes',false,null,null);
  buildMegaToggle('ps-mega','pickerMegas');
  buildSizeBtns('mini-sizes','miniSize',[{v:8,l:'8'},{v:16,l:'16'},{v:32,l:'32'},{v:64,l:'64'}],null);
  buildGenBtns('ms-gens','miniGens');
  buildTypeBtns('ms-types','miniTypes',false,null,null);
  buildMegaToggle('ms-mega','miniMegas');
  buildGenBtns('xs-gens','megaGens',updateMegaCount);
  buildTypeBtns('xs-types','megaTypes',false,null,updateMegaCount);
  buildMegaToggle('xs-mega','megaMegas');
  buildGenBtns('cc-gens','clashGens');
  buildTypeBtns('ca-types','clashTypeA',true,'clashTypeB',validateClash);
  buildTypeBtns('cb-types','clashTypeB',true,'clashTypeA',validateClash);
  buildSizeBtns('clash-rounds','clashRounds',[{v:3,l:'Best of 3'},{v:5,l:'Best of 5'},{v:7,l:'Best of 7'},{v:999,l:'All rounds'}],validateClash);
  buildMegaToggle('cc-mega','clashMegas');
  updateMegaCount();
}

function renderFighter(el, poke, flip) {
  if (!el || !poke) return;
  var ac = TC[poke.types[0] && poke.types[0].type.name] || '#f0c14b';
  var typeH = poke.types.map(function(t) {
    var c = TC[t.type.name] || '#888';
    return '<span class="type-badge" style="background:' + c + '22;color:' + c + ';border-color:' + c + '44">'
      + TYPE_EMOJI[t.type.name] + ' ' + t.type.name + '</span>';
  }).join('');
  var statH = poke.stats.map(function(s, i) {
    return '<div class="stat-row">'
      + '<span class="stat-lbl">' + SL[i] + '</span>'
      + '<div class="stat-bg"><div class="stat-fill" style="background:' + SC[i] + '" data-val="' + s.base_stat + '"></div></div>'
      + '<span class="stat-num">' + s.base_stat + '</span></div>';
  }).join('');
  var numLabel = poke.id < 10000
    ? '#' + String(poke.id).padStart(3,'0') + ' · Gen ' + genLbl(poke.id)
    : genLbl(poke.id);
  el.innerHTML = '<div class="sprite-wrap">'
    + spriteChain(poke.id, !!flip)
    + '<div class="fighter-shadow"></div></div>'
    + '<div class="fighter-hud" style="box-shadow:0 0 0 1px ' + ac + '33 inset">'
    + '<div class="poke-num">' + numLabel + '</div>'
    + '<div class="poke-name">' + cleanName(poke.name) + '</div>'
    + '<div class="poke-types">' + typeH + '</div>'
    + '<div class="poke-stats">' + statH + '</div>'
    + '<div class="poke-bst">Total <span>' + bst(poke.stats) + '</span></div>'
    + '</div>';
  el.classList.remove('winner','loser','locked','p1-card','p2-card','final-card');
  setTimeout(function() {
    var bars = el.querySelectorAll('.stat-fill');
    for (var i = 0; i < bars.length; i++) {
      bars[i].style.width = Math.min(100, (parseInt(bars[i].dataset.val) / 255) * 100) + '%';
    }
  }, 80);
}
function setLoad(text, pct) {
  var el = document.getElementById('load-text'); if (el) el.innerHTML = text.replace(/\n/g,'<br>');
  var bar = document.getElementById('load-bar'); if (bar) bar.style.width = (pct * 100) + '%';
}
function triggerFlash() {
  var el = document.getElementById('pick-flash'); if (!el) return;
  el.style.display = 'block'; el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'screenFlash .45s ease forwards';
  setTimeout(function() { el.style.display = 'none'; }, 480);
}
function showTypeAdv(pA, pB) {
  var el = document.getElementById('type-adv-bar'); if (!el) return;
  var aT = pA.types.map(function(t){return t.type.name;});
  var bT = pB.types.map(function(t){return t.type.name;});
  var aStrong = false; var bStrong = false;
  aT.forEach(function(at) { if(TYPE_CHART[at]) TYPE_CHART[at].forEach(function(bt){if(bT.indexOf(bt)>-1)aStrong=true;}); });
  bT.forEach(function(bt) { if(TYPE_CHART[bt]) TYPE_CHART[bt].forEach(function(at){if(aT.indexOf(at)>-1)bStrong=true;}); });
  if (aStrong && !bStrong) {
    var c = TC[aT[0]] || '#f0c14b';
    el.textContent = cleanName(pA.name) + ' has type advantage';
    el.style.cssText = 'display:block;text-align:center;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;padding:7px 14px;margin:4px auto 10px;border-radius:999px;max-width:520px;background:' + c + '22;color:' + c + ';border:1px solid ' + c + '55;';
  } else if (bStrong && !aStrong) {
    var c2 = TC[bT[0]] || '#f0c14b';
    el.textContent = cleanName(pB.name) + ' has type advantage';
    el.style.cssText = 'display:block;text-align:center;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;padding:7px 14px;margin:4px auto 10px;border-radius:999px;max-width:520px;background:' + c2 + '22;color:' + c2 + ';border:1px solid ' + c2 + '55;';
  } else {
    el.style.display = 'none';
  }
}

function resetArena(arenaId) {
  var arena = document.getElementById(arenaId);
  if (!arena) return;
  arena.classList.remove('battling','resolving','impact','shake');
}
function playBattleCinematic(arenaId, fa, fb, side, winnerType, done) {
  var arena = document.getElementById(arenaId);
  if (!arena) { if (done) done(); return; }
  resetArena(arenaId);
  fa.classList.add('locked');
  fb.classList.add('locked');
  void arena.offsetWidth;
  arena.classList.add('battling');
  setTimeout(function() {
    arena.classList.add('impact','shake');
    triggerFlash();
    playImpactSound();
    spawnTypeFX(winnerType, arena);
    setTimeout(function() {
      arena.classList.remove('battling');
      arena.classList.add('resolving');
      fa.classList.add(side==='a' ? 'winner' : 'loser');
      fb.classList.add(side==='b' ? 'winner' : 'loser');
      setTimeout(function() {
        arena.classList.remove('impact','shake');
        if (done) done();
      }, 900);
    }, 360);
  }, 620);
}

function spawnTypeFX(type, originEl) {
  if (!originEl) return;
  try {
    var rect = originEl.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height * 0.45;
    var color = TC[type] || '#f0c14b';
    for (var i = 0; i < 16; i++) {
      (function(idx) {
        setTimeout(function() {
          var p = document.createElement('div');
          var angle = (idx / 16) * Math.PI * 2 + Math.random() * 0.4;
          var dist = 70 + Math.random() * 90;
          var dx = Math.cos(angle) * dist;
          var dy = Math.sin(angle) * dist - 10;
          if (idx % 4 === 0) {
            p.style.cssText = 'position:fixed;left:' + (cx-28) + 'px;top:' + (cy-28) + 'px;width:56px;height:56px;border-radius:50%;border:3px solid ' + color + ';pointer-events:none;z-index:90;animation:rippleOut ' + (0.7+idx*0.05) + 's ease-out forwards;';
          } else {
            p.style.cssText = 'position:fixed;left:' + cx + 'px;top:' + cy + 'px;width:' + (6+Math.random()*8) + 'px;height:' + (6+Math.random()*8) + 'px;border-radius:50%;background:' + color + ';box-shadow:0 0 12px ' + color + ';pointer-events:none;z-index:90;--dx:' + dx + 'px;--dy:' + dy + 'px;animation:particleOut ' + (0.55+Math.random()*0.4) + 's ease-out forwards;';
          }
          document.body.appendChild(p);
          setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 1800);
        }, idx * 28);
      })(i);
    }
  } catch(e) {}
}
function spawnConfetti() {
  var cols = ['#f0c14b','#e63b2e','#7ec8ff','#3dcf8e','#F95587','#EE8130'];
  for (var i = 0; i < 32; i++) {
    (function(idx) {
      setTimeout(function() {
        var c = document.createElement('div');
        c.style.cssText = 'position:fixed;top:-20px;left:' + Math.floor(Math.random()*100) + '%;'
          + 'width:' + (6+Math.floor(Math.random()*7)) + 'px;height:' + (6+Math.floor(Math.random()*7)) + 'px;'
          + 'background:' + cols[idx%6] + ';border-radius:2px;z-index:300;pointer-events:none;'
          + 'animation:confettiDrop ' + (1.4+Math.random()) + 's ease forwards;';
        document.body.appendChild(c);
        setTimeout(function() { if (c.parentNode) c.parentNode.removeChild(c); }, 3000);
      }, idx * 45);
    })(i);
  }
}

function startTournament(pokes, mode) {
  var seeded = seedPokes(pokes);
  var r1 = mkBracketRound(seeded);
  T = {bracket:[r1], round:0, match:0, mode:mode};
  _prevState = null; _canUndo = false;
  _p1wins = 0; _p2wins = 0; _twoPturn = 'p1';
  if (_twoPlayer) { update2PBar(); } else { hide2PBar(); }
  _streak = {id:null, count:0};
  _tourneyStartTime = Date.now();
  _tourneyMatches = 0; _tourneyUpsets = 0;
  _battleBusy = false;
  var m = 0;
  while (m < r1.length && (r1[m].winner !== null || !r1[m].a || !r1[m].b)) m++;
  T.match = m;
  var btn = document.getElementById('two-p-btn');
  if (btn) { btn.textContent = '2P Mode'; }
  go('battle-screen');
  renderCurrentBattle();
}
function renderCurrentBattle() {
  _battleBusy = false;
  resetArena('battle-arena');
  var safety = 0;
  while (safety < 20) {
    safety++;
    var round = T.bracket[T.round];
    if (!round) return;
    while (T.match < round.length && (round[T.match].winner !== null || !round[T.match].a || !round[T.match].b)) {
      T.match++;
    }
    if (T.match < round.length) break;
    var seen = {};
    var winners = round.map(function(m){return m.winner;}).filter(function(w){
      if (!w || seen[w.id]) return false; seen[w.id] = true; return true;
    });
    if (winners.length === 1) { showChampion(winners[0]); return; }
    if (winners.length === 0) return;
    var nextRound = mkBracketRound(seedPokes(winners));
    T.bracket.push(nextRound); T.round++; T.match = 0;
  }
  round = T.bracket[T.round];
  var match = round[T.match];
  if (!match || !match.a || !match.b) return;
  var rlen = round.length;
  var rname = rlen===1 ? 'Grand Final' : rlen===2 ? 'Semi-Finals' : rlen===4 ? 'Quarter-Finals' : rlen<=8 ? 'Round of '+(rlen*2) : 'Round '+(T.round+1);
  var real = round.filter(function(m) { return m.a && m.b; });
  var done = real.filter(function(m) { return m.winner !== null; }).length;
  document.getElementById('round-name').textContent = rname;
  document.getElementById('round-info').textContent = 'Match ' + (done+1) + ' of ' + real.length;
  var fa = document.getElementById('fighter-a');
  var fb = document.getElementById('fighter-b');
  renderFighter(fa, match.a, true);
  renderFighter(fb, match.b, false);
  fa.onclick = function() { pickWinner('a'); };
  fb.onclick = function() { pickWinner('b'); };
  var battleEl = document.getElementById('battle-arena');
  if (battleEl) {
    battleEl.classList.remove('stage-r1','stage-r2','stage-r3','stage-r4','stage-final');
    var stageClass = rlen===1?'stage-final':rlen===2?'stage-r4':rlen===4?'stage-r3':rlen<=8?'stage-r2':'stage-r1';
    battleEl.classList.add(stageClass);
  }
  if (_twoPlayer) {
    var isFinal = round.length === 1;
    if (isFinal) {
      fa.classList.add('final-card'); fb.classList.add('final-card');
      var hint = document.getElementById('battle-hint');
      if (hint) hint.innerHTML = '<span class="two-p-final-banner">Grand Final</span>';
    } else if (_twoPturn === 'p1') {
      fa.classList.add('p1-card'); fb.classList.add('p1-card');
    } else {
      fa.classList.add('p2-card'); fb.classList.add('p2-card');
    }
    update2PBar();
  }
  showTypeAdv(match.a, match.b);
  var riv = getRivalryText(match.a, match.b);
  var hintEl = document.getElementById('battle-hint');
  if (hintEl && !( _twoPlayer && round.length === 1)) {
    hintEl.textContent = riv ? ('Rivalry: ' + riv) : 'Tap a Pokémon to pick the winner';
  }
  updateUndoBtn();
}
function updateUndoBtn() {
  var controls = document.getElementById('battle-controls'); if (!controls) return;
  var ex = document.getElementById('undo-btn');
  if (ex) ex.parentNode.removeChild(ex);
  if (_canUndo) {
    var b = document.createElement('button');
    b.id = 'undo-btn'; b.className = 'btn'; b.textContent = 'Undo';
    b.onclick = handleUndo;
    controls.insertBefore(b, controls.firstChild);
  }
}
function pickWinner(side) {
  if (_battleBusy) return;
  var match = T.bracket[T.round][T.match];
  if (!match || match.winner) return;
  _battleBusy = true;
  var fa = document.getElementById('fighter-a');
  var fb = document.getElementById('fighter-b');
  fa.onclick = null; fb.onclick = null;
  var winner = side==='a' ? match.a : match.b;
  var loser  = side==='a' ? match.b : match.a;
  var winnerType = winner.types[0] && winner.types[0].type.name;

  playBattleCinematic('battle-arena', fa, fb, side, winnerType, function() {
    try { playPickSound(); } catch(e) {}
    try { playCry(winner); } catch(e) {}

    if (_streak.id === winner.id) _streak.count++; else _streak = {id:winner.id, count:1};
    if (_streak.count >= 3) {
      var badge = document.createElement('div');
      badge.className = 'streak-badge';
      var n = _streak.count;
      badge.textContent = n + ' streak';
      badge.style.background = n>=7 ? '#e63b2e' : n>=5 ? '#3dcf8e' : '#1a2a44';
      (side==='a' ? fa : fb).appendChild(badge);
    }
    var matchIdx = T.bracket[T.round].indexOf(match);
    var winnerSeedPos = side==='a' ? matchIdx*2 : matchIdx*2+1;
    var loserSeedPos  = side==='a' ? matchIdx*2+1 : matchIdx*2;
    var isUpset = loserSeedPos < winnerSeedPos && (winnerSeedPos - loserSeedPos) >= 4;
    if (isUpset) { showUpset(); _tourneyUpsets++; }

    _prevState = {bracket: JSON.parse(JSON.stringify(T.bracket)), round: T.round, match: T.match};
    _canUndo = true; updateUndoBtn();
    recordWin(winner.id);
    recordMatchup(winner.id, loser.id);
    recordPick();
    if (isUpset) { recordUpset(); }
    _tourneyMatches++;
    T.bracket[T.round][T.match].winner = winner;
    saveTournament();

    var round = T.bracket[T.round];
    var next = T.match + 1;
    while (next < round.length && (round[next].winner !== null || !round[next].a || !round[next].b)) next++;
    if (next < round.length) {
      if (_twoPlayer) {
        if (_twoPturn === 'p1') _p1wins++; else _p2wins++;
        _twoPturn = _twoPturn === 'p1' ? 'p2' : 'p1';
      }
      T.match = next;
      setTimeout(function() { renderCurrentBattle(); }, 420);
      return;
    }
    var seen = {}; var winners = round.map(function(m){return m.winner;}).filter(function(w){
      if (!w || seen[w.id]) return false; seen[w.id] = true; return true;
    });
    if (winners.length === 1) { showChampion(winners[0]); return; }
    var nextRound = mkBracketRound(seedPokes(winners));
    T.bracket.push(nextRound); T.round++;
    if (_twoPlayer) {
      if (_twoPturn === 'p1') _p1wins++; else _p2wins++;
      _twoPturn = _twoPturn === 'p1' ? 'p2' : 'p1';
    }
    _prevState = null; _canUndo = false; updateUndoBtn();
    var nm = 0;
    while (nm < nextRound.length && (nextRound[nm].winner !== null || !nextRound[nm].a || !nextRound[nm].b)) nm++;
    T.match = nm;
    var rl = nextRound.filter(function(m){return m.a&&m.b;}).length;
    var lbl = rl===1?'Grand Final':rl===2?'Semi-Finals':rl===4?'Quarter-Finals':'Next Round';
    document.getElementById('trans-label').textContent = lbl;
    document.getElementById('round-transition').classList.add('visible');
    setTimeout(function() {
      document.getElementById('round-transition').classList.remove('visible');
      renderCurrentBattle();
    }, 1400);
  });
}
function handleUndo() {
  if (!_prevState || _battleBusy) return;
  T.bracket = JSON.parse(JSON.stringify(_prevState.bracket));
  T.round = _prevState.round; T.match = _prevState.match;
  _prevState = null; _canUndo = false;
  renderCurrentBattle();
}
function showUpset() {
  var el = document.getElementById('upset-banner'); if (!el) return;
  el.style.display = 'flex';
  try { playUpsetSound(); } catch(e) {}
  setTimeout(function() {
    el.style.display = 'none';
    spawnConfetti();
  }, 1000);
}
function toggle2Player() {
  if (!_twoPlayer) {
    var n1 = prompt('Player 1 name (blue side):');
    if (n1 === null) return;
    if (!n1.trim()) n1 = 'PLAYER 1';
    var n2 = prompt('Player 2 name (green side):');
    if (n2 === null) return;
    if (!n2.trim()) n2 = 'PLAYER 2';
    _p1name = n1.trim().toUpperCase().slice(0,12);
    _p2name = n2.trim().toUpperCase().slice(0,12);
    _twoPlayer = true;
    _p1wins = 0; _p2wins = 0;
    _twoPturn = 'p1';
    update2PBar();
  } else {
    _twoPlayer = false;
    hide2PBar();
  }
  var btn = document.getElementById('two-p-btn');
  if (btn) btn.textContent = _twoPlayer ? '2P: On' : '2P Mode';
  renderCurrentBattle();
}
function update2PBar() {
  var bar = document.getElementById('two-p-bar');
  if (!bar) return;
  if (!_twoPlayer) { bar.style.display='none'; return; }
  bar.style.display = 'block';
  var p1el = document.getElementById('two-p-p1-name');
  var p2el = document.getElementById('two-p-p2-name');
  var p1pts = document.getElementById('two-p-p1-pts');
  var p2pts = document.getElementById('two-p-p2-pts');
  var turnEl = document.getElementById('two-p-turn');
  if (p1el) p1el.textContent = _p1name;
  if (p2el) p2el.textContent = _p2name;
  if (p1pts) p1pts.textContent = _p1wins;
  if (p2pts) p2pts.textContent = _p2wins;
  var ownerName = _twoPturn === 'p1' ? _p1name : _p2name;
  var ownerColor = _twoPturn === 'p1' ? '#7ec8ff' : '#3dcf8e';
  var round = T.bracket[T.round];
  var rlen = round ? round.length : 2;
  if (turnEl) {
    turnEl.textContent = rlen===1
      ? 'Grand Final — ' + ownerName + ' picks'
      : ownerName + "'s turn — tap your Pokémon";
    turnEl.style.color = ownerColor;
  }
}
function hide2PBar() {
  var bar = document.getElementById('two-p-bar');
  if (bar) bar.style.display = 'none';
}

var _bracketViewRound = 0;
var _bracketFromScreen = 'battle-screen';
function viewBracket() {
  _bracketFromScreen = 'battle-screen';
  _bracketViewRound = T.round;
  renderBracketView();
  go('bracket-screen');
}
function renderBracketView() {
  var el = document.getElementById('bracket-inner'); if (!el) return;
  el.innerHTML = '';
  var totalRounds = T.bracket.length;
  var round = T.bracket[_bracketViewRound];
  if (!round) return;
  var rlen = round.length;
  var rname = rlen===1?'Grand Final':rlen===2?'Semi-Finals':rlen===4?'Quarter-Finals':rlen<=8?'Round of '+(rlen*2):'Round '+(_bracketViewRound+1);
  var nav = document.createElement('div'); nav.className = 'b-round-nav';
  var prev = document.createElement('button'); prev.className = 'btn btn-ghost'; prev.textContent = 'Prev';
  prev.disabled = _bracketViewRound <= 0;
  prev.onclick = function() { if (_bracketViewRound > 0) { _bracketViewRound--; renderBracketView(); } };
  var title = document.createElement('div'); title.className = 'b-round-title'; title.textContent = rname;
  var next = document.createElement('button'); next.className = 'btn btn-ghost'; next.textContent = 'Next';
  next.disabled = _bracketViewRound >= totalRounds - 1;
  next.onclick = function() { if (_bracketViewRound < totalRounds-1) { _bracketViewRound++; renderBracketView(); } };
  nav.appendChild(prev); nav.appendChild(title); nav.appendChild(next);
  var sub = document.createElement('div');
  sub.style.cssText = 'font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5d6b7e;text-align:center;margin-bottom:8px;';
  sub.textContent = 'Round ' + (_bracketViewRound+1) + ' of ' + totalRounds;
  el.appendChild(sub); el.appendChild(nav);
  var backBtn = document.getElementById('bracket-back-btn');
  if (backBtn) { backBtn.onclick = function() { go(_bracketFromScreen); }; }
  var realMatches = round.filter(function(m) { return m.a && m.b; });
  var byeCount = round.filter(function(m) { return m.bye; }).length;
  var isCurrent = _bracketViewRound === T.round;
  realMatches.forEach(function(match) {
    var div = document.createElement('div'); div.className = 'b-matchup';
    if (isCurrent && !match.winner) div.classList.add('current');
    function makeSlot(poke, won, lost) {
      var slot = document.createElement('div'); slot.className = 'b-slot';
      if (won) slot.classList.add('won');
      if (lost) slot.classList.add('lost');
      var wins = getWinCount(poke.id);
      slot.innerHTML = '<img class="b-slot-img" src="' + imgFb(poke.id) + '" alt="">'
        + '<span class="b-slot-name">' + cleanName(poke.name) + '</span>'
        + (wins > 0 ? '<span class="b-slot-wins">' + wins + 'W</span>' : '')
        + (won ? ' <span style="color:#f0c14b">★</span>' : '');
      return slot;
    }
    var aWon = match.winner && match.winner.id === match.a.id;
    var bWon = match.winner && match.winner.id === match.b.id;
    var vs = document.createElement('div'); vs.className = 'b-vs'; vs.textContent = 'VS';
    div.appendChild(makeSlot(match.a, aWon, bWon));
    div.appendChild(vs);
    div.appendChild(makeSlot(match.b, bWon, aWon));
    el.appendChild(div);
  });
  if (byeCount > 0) {
    var byeDiv = document.createElement('div'); byeDiv.className = 'b-bye-note';
    byeDiv.textContent = byeCount + ' bye' + (byeCount>1?'s':'') + ' — top seeds auto-advanced';
    el.appendChild(byeDiv);
  }
}

function showChampion(poke) {
  clearSavedTournament();
  recordChampion(poke, T.mode);
  recordTournament();
  _battleBusy = false;
  var typeH = poke.types.map(function(t) {
    var c = TC[t.type.name] || '#888';
    return '<span class="type-badge" style="background:'+c+'22;color:'+c+';border-color:'+c+'44">'
      + TYPE_EMOJI[t.type.name] + ' ' + t.type.name + '</span>';
  }).join('');
  document.getElementById('champ-title').textContent = 'Champion!';
  var sub;
  if (_twoPlayer) {
    hide2PBar();
    var btn = document.getElementById('two-p-btn');
    if (btn) btn.textContent = '2P Mode';
    sub = _p1wins > _p2wins
      ? _p1name + ' wins! (' + _p1wins + ' vs ' + _p2wins + ')'
      : _p2wins > _p1wins
      ? _p2name + ' wins! (' + _p2wins + ' vs ' + _p1wins + ')'
      : 'Tie game! ' + _p1wins + '-' + _p2wins;
  } else {
    sub = T.mode==='mega' ? 'Mega Tournament Champion' : 'Tournament Winner';
  }
  document.getElementById('champ-sub').textContent = sub;
  document.getElementById('champ-card').innerHTML =
    '<div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#5d6b7e">' + (poke.id<10000?'#'+String(poke.id).padStart(3,'0')+' · Gen '+genLbl(poke.id):genLbl(poke.id)) + '</div>'
    + '<img class="champ-img" src="' + (animUrl(poke.id) || imgUrl(poke.id)) + '" alt="' + cleanName(poke.name) + '"'
    + ' onerror="this.onerror=null;this.src=\'' + imgUrl(poke.id) + '\';this.onerror=function(){this.src=\'' + imgFb(poke.id) + '\';};">'
    + '<div class="champ-name">' + cleanName(poke.name) + '</div>'
    + '<div class="poke-types" style="justify-content:center">' + typeH + '</div>'
    + '<div style="font-size:14px;color:#f0c14b;font-weight:700;margin-top:8px">BST ' + bst(poke.stats) + '</div>';
  var mins = Math.round((Date.now() - _tourneyStartTime) / 60000);
  var statsLine = _tourneyMatches + ' battles · ' + mins + ' min' + (_tourneyUpsets>0 ? ' · ' + _tourneyUpsets + ' upsets' : '');
  document.getElementById('champ-btns').innerHTML =
    '<button class="btn btn-primary" onclick="if(_replayFn)_replayFn()">Rematch</button>'
    + '<button class="btn btn-ghost" onclick="_bracketFromScreen=\'champ-screen\';renderBracketView();go(\'bracket-screen\')">Bracket</button>'
    + '<button class="btn btn-ghost" onclick="openHOF()">Hall of Fame</button>'
    + '<button class="btn btn-ghost" onclick="go(\'home-screen\')">Home</button>'
    + '<div style="width:100%;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#5d6b7e;margin-top:8px">' + statsLine + '</div>';
  go('champ-screen');
  spawnConfetti();
  try { playFanfare(); } catch(e) {}
  setTimeout(function(){ try { playCry(poke); } catch(e) {} }, 900);
}

var _pickerBusy = false;
function launchPicker() {
  if (_pickerBusy) return;
  _pickerBusy = true;
  go('pickerBattle');
  resetArena('picker-arena');
  var ph = '<div class="sprite-wrap" style="align-items:center"><div class="load-orb" style="width:48px;height:48px"></div></div>';
  var pa = document.getElementById('pick-a'); var pb = document.getElementById('pick-b');
  pa.innerHTML = ph; pb.innerHTML = ph; pa.classList.add('locked'); pb.classList.add('locked');
  document.getElementById('picker-result').textContent = '';
  var ids = shuffle(allIds(state.pickerGens));
  var filtered = []; var limit = (state.pickerTypes.size || state.pickerMegas) ? 80 : 2;
  var promise = Promise.resolve();
  ids.forEach(function(id) {
    promise = promise.then(function() {
      if (!state.pickerMegas && !state.pickerTypes.size && filtered.length >= 2) return;
      if (filtered.length >= limit) return;
      return fetchPoke(id).then(function(d) {
        if (!state.pickerTypes.size || d.types.some(function(t){return state.pickerTypes.has(t.type.name);})) {
          filtered.push(d);
        }
      }).catch(function(){});
    });
  });
  if (state.pickerMegas) {
    promise = promise.then(function() { return fetchMegaPool(state.pickerTypes); })
      .then(function(megas) { megas.forEach(function(m){filtered.push(m);}); });
  }
  promise.then(function() {
    _pickerBusy = false;
    if (filtered.length < 2) {
      document.getElementById('picker-result').textContent = 'Not enough Pokémon — change filters.';
      return;
    }
    var sh = shuffle(filtered); var p1 = sh[0]; var p2 = sh[1];
    renderFighter(pa, p1, true); renderFighter(pb, p2, false);
    pa.classList.remove('locked'); pb.classList.remove('locked');
    pa.onclick = function() { pickerPick('a', p1, p2); };
    pb.onclick = function() { pickerPick('b', p1, p2); };
    var t1 = bst(p1.stats); var t2 = bst(p2.stats);
    document.getElementById('picker-result').textContent =
      t1>t2 ? cleanName(p1.name)+' has more base stats ('+t1+' vs '+t2+')' :
      t2>t1 ? cleanName(p2.name)+' has more base stats ('+t2+' vs '+t1+')' :
      'Perfectly matched — both have '+t1+' base stats';
  }).catch(function() {
    _pickerBusy = false;
    document.getElementById('picker-result').textContent = 'Error — check connection.';
  });
}
function pickerPick(side, p1, p2) {
  var pa = document.getElementById('pick-a'); var pb = document.getElementById('pick-b');
  if (pa.classList.contains('winner') || pa.classList.contains('loser') || _battleBusy) return;
  _battleBusy = true;
  pa.onclick = null; pb.onclick = null;
  var winner = side==='a' ? p1 : p2;
  var winnerType = winner.types[0] && winner.types[0].type.name;
  playBattleCinematic('picker-arena', pa, pb, side, winnerType, function() {
    recordWin(winner.id); recordPick();
    try { playPickSound(); } catch(e) {}
    try { playCry(winner); } catch(e) {}
    _battleBusy = false;
  });
}

function launchMini() {
  go('loading-screen'); setLoad('Picking fighters…',0);
  var ids = shuffle(allIds(state.miniGens)); var chosen = [];
  var promise = Promise.resolve();
  ids.forEach(function(id) {
    promise = promise.then(function() {
      if (chosen.length >= state.miniSize * 3) return;
      return fetchPoke(id).then(function(d) {
        if (!state.miniTypes.size || d.types.some(function(t){return state.miniTypes.has(t.type.name);})) {
          chosen.push(d);
        }
        setLoad('Loading '+Math.min(chosen.length,state.miniSize)+' / '+state.miniSize, Math.min(chosen.length/state.miniSize,.85));
      }).catch(function(){});
    });
  });
  if (state.miniMegas) {
    promise = promise.then(function() { setLoad('Loading megas…',.88); return fetchMegaPool(state.miniTypes); })
      .then(function(megas) { megas.forEach(function(m){chosen.push(m);}); });
  }
  promise.then(function() {
    var final = shuffle(chosen).slice(0, state.miniSize);
    if (final.length < 2) { alert('Not enough Pokémon! Adjust filters.'); go('miniSetup'); return; }
    setLoad('Ready!', 1); _replayFn = launchMini;
    setTimeout(function() { startTournament(final, 'mini'); }, 300);
  }).catch(function() { setLoad('Error — check connection.', 0); setTimeout(function(){go('miniSetup');},2000); });
}

function launchMega() {
  go('loading-screen'); setLoad('Loading all Pokémon…',0);
  var uniqueIds = [];
  var seen = {};
  allIds(state.megaGens).forEach(function(id) { if (!seen[id]) { seen[id]=true; uniqueIds.push(id); } });
  var result = []; var seenResult = {}; var B = 8;
  var promise = Promise.resolve();
  for (var i = 0; i < uniqueIds.length; i += B) {
    (function(batch, idx) {
      promise = promise.then(function() {
        return Promise.all(batch.map(function(id) {
          return fetchPoke(id).then(function(d) {
            if (!seenResult[d.id]) {
              seenResult[d.id] = true;
              if (!state.megaTypes.size || d.types.some(function(t){return state.megaTypes.has(t.type.name);})) {
                result.push(d);
              }
            }
          }).catch(function(){});
        })).then(function() {
          setLoad('Loading '+Math.round((idx+B)/uniqueIds.length*100)+'%\n'+result.length+' Pokémon found', Math.min((idx+B)/uniqueIds.length,.9));
          return new Promise(function(r){setTimeout(r,10);});
        });
      });
    })(uniqueIds.slice(i, i+B), i);
  }
  if (state.megaMegas) {
    promise = promise.then(function() { setLoad('Loading megas…',.92); return fetchMegaPool(state.megaTypes); })
      .then(function(megas) { megas.forEach(function(m){if(!seenResult[m.id]){seenResult[m.id]=true;result.push(m);}}); });
  }
  promise.then(function() {
    if (result.length < 2) { alert('Not enough Pokémon! Adjust filters.'); go('megaSetup'); return; }
    setLoad(result.length + ' Pokémon ready!', 1); _replayFn = launchMega;
    setTimeout(function() { startTournament(result, 'mega'); }, 400);
  }).catch(function() { setLoad('Error — check connection.',0); setTimeout(function(){go('megaSetup');},2500); });
}

var _clash = {poolA:[],poolB:[],cycleA:[],cycleB:[],posA:0,posB:0,cycleNumA:1,cycleNumB:1,score:{a:0,b:0,round:0},done:false};
function buildClashCycle(pool) {
  var groups = {};
  pool.forEach(function(p) { var w=getWinCount(p.id); if(!groups[w])groups[w]=[]; groups[w].push(p); });
  Object.keys(groups).forEach(function(w){groups[w]=shuffle(groups[w]);});
  var levels = Object.keys(groups).map(Number).sort(function(a,b){return b-a;});
  var cycle = [];
  levels.forEach(function(w){groups[w].forEach(function(p){cycle.push(p);});});
  return cycle;
}
function launchClash() {
  var tA = [...state.clashTypeA][0]; var tB = [...state.clashTypeB][0];
  if (!tA || !tB || tA===tB) return;
  go('loading-screen'); setLoad(tA.toUpperCase()+' VS '+tB.toUpperCase()+'\nLoading…',0);
  var ids = allIds(state.clashGens); var pA=[]; var pB=[]; var B=8;
  var promise = Promise.resolve();
  for (var i = 0; i < ids.length; i += B) {
    (function(batch, idx) {
      promise = promise.then(function() {
        return Promise.all(batch.map(function(id) {
          return fetchPoke(id).then(function(d) {
            var types = d.types.map(function(t){return t.type.name;});
            if (types.indexOf(tA) > -1) pA.push(d);
            if (types.indexOf(tB) > -1) pB.push(d);
          }).catch(function(){});
        })).then(function() {
          setLoad('Loading '+Math.round((idx+B)/ids.length*100)+'%', (idx+B)/ids.length);
          return new Promise(function(r){setTimeout(r,10);});
        });
      });
    })(ids.slice(i, i+B), i);
  }
  if (state.clashMegas) {
    promise = promise.then(function(){return fetchMegaPool(new Set());}).then(function(megas){
      megas.forEach(function(m){
        var types=m.types.map(function(t){return t.type.name;});
        if(types.indexOf(tA)>-1)pA.push(m);
        if(types.indexOf(tB)>-1)pB.push(m);
      });
    });
  }
  promise.then(function() {
    if (!pA.length || !pB.length) { alert('Not enough Pokémon for one or both types!'); go('clashSetup'); return; }
    var cycA = buildClashCycle(pA); var cycB = buildClashCycle(pB);
    _clash = {poolA:pA,poolB:pB,cycleA:cycA,cycleB:cycB,posA:0,posB:0,cycleNumA:1,cycleNumB:1,score:{a:0,b:0,round:0},done:false};
    renderClashRound(cycA[0], cycB[0]); go('clash-screen');
  }).catch(function(){setLoad('Error — check connection.',0);setTimeout(function(){go('clashSetup');},2000);});
}
function renderClashRound(pA, pB) {
  _battleBusy = false;
  resetArena('clash-arena');
  var tA=[...state.clashTypeA][0]||''; var tB=[...state.clashTypeB][0]||'';
  var cA=TC[tA]||'#888'; var cB=TC[tB]||'#888';
  var maxR = state.clashRounds===999 ? Math.max(_clash.poolA.length,_clash.poolB.length) : state.clashRounds;
  var cycA = _clash.cycleNumA>1 ? ' [C'+_clash.cycleNumA+']' : '';
  var cycB = _clash.cycleNumB>1 ? ' [C'+_clash.cycleNumB+']' : '';
  document.getElementById('clash-score').innerHTML =
    '<span style="color:'+cA+'">'+tA.toUpperCase()+cycA+' '+_clash.score.a+'</span>'
    +'  ·  Round '+(_clash.score.round+1)+(state.clashRounds===999?'':'/'+maxR)
    +'  ·  <span style="color:'+cB+'">'+_clash.score.b+' '+tB.toUpperCase()+cycB+'</span>';
  document.getElementById('clash-types-row').innerHTML =
    '<span class="type-badge" style="background:'+cA+'22;color:'+cA+';border-color:'+cA+'44;padding:5px 12px">'+TYPE_EMOJI[tA]+' '+tA+'</span>'
    +'<span style="font-family:Bricolage Grotesque,Georgia,serif;color:#5d6b7e">VS</span>'
    +'<span class="type-badge" style="background:'+cB+'22;color:'+cB+';border-color:'+cB+'44;padding:5px 12px">'+TYPE_EMOJI[tB]+' '+tB+'</span>';
  var ca=document.getElementById('clash-a'); var cb=document.getElementById('clash-b');
  renderFighter(ca, pA, true); renderFighter(cb, pB, false);
  ca.onclick=function(){handleClashPick('a');}; cb.onclick=function(){handleClashPick('b');};
  var hint=document.getElementById('clash-hint');
  if(hint){hint.style.color='';hint.textContent='Tap your favourite to win the round';}
}
function handleClashPick(side) {
  if (_clash.done || _battleBusy) return;
  _battleBusy = true;
  var ca=document.getElementById('clash-a'); var cb=document.getElementById('clash-b');
  ca.onclick=null; cb.onclick=null;
  var clashWinner = side==='a' ? _clash.cycleA[_clash.posA] : _clash.cycleB[_clash.posB];
  var ct = clashWinner.types[0] && clashWinner.types[0].type.name;
  playBattleCinematic('clash-arena', ca, cb, side, ct, function() {
    try { playCry(clashWinner); } catch(e) {}
    var tA=[...state.clashTypeA][0]; var tB=[...state.clashTypeB][0];
    _clash.score.a+=(side==='a'?1:0); _clash.score.b+=(side==='b'?1:0); _clash.score.round++;
    var maxR=state.clashRounds===999?Math.max(_clash.poolA.length,_clash.poolB.length):state.clashRounds;
    var need=state.clashRounds===999?Infinity:Math.ceil(state.clashRounds/2);
    if (_clash.score.a>=need||_clash.score.b>=need||_clash.score.round>=maxR) {
      _clash.done=true;
      var wt=_clash.score.a>_clash.score.b?tA:_clash.score.b>_clash.score.a?tB:'TIE';
      var hint=document.getElementById('clash-hint');
      if(hint){hint.style.color=TC[wt]||'#f0c14b';hint.textContent=wt==='TIE'?'It\'s a tie! '+_clash.score.a+'-'+_clash.score.b:wt.toUpperCase()+' wins! '+_clash.score.a+'-'+_clash.score.b;}
      setTimeout(function(){showClashResult(wt,_clash.score.a,_clash.score.b,tA,tB);},1200);
      return;
    }
    try { playPickSound(); } catch(e) {}
    setTimeout(function() {
      _clash.posA++;
      if (_clash.posA>=_clash.cycleA.length){_clash.cycleA=buildClashCycle(_clash.poolA);_clash.posA=0;_clash.cycleNumA++;}
      _clash.posB++;
      if (_clash.posB>=_clash.cycleB.length){_clash.cycleB=buildClashCycle(_clash.poolB);_clash.posB=0;_clash.cycleNumB++;}
      renderClashRound(_clash.cycleA[_clash.posA],_clash.cycleB[_clash.posB]);
    }, 500);
  });
}
function showClashResult(wt, sA, sB, tA, tB) {
  var col = TC[wt] || '#f0c14b';
  document.getElementById('champ-title').textContent = wt==='TIE' ? 'Tie Game!' : 'Type Wins!';
  document.getElementById('champ-sub').textContent = 'Type Clash Result';
  document.getElementById('champ-card').innerHTML =
    '<div style="font-family:Bricolage Grotesque,Georgia,serif;font-size:42px;color:'+col+';letter-spacing:-0.03em;margin:12px 0">'+(wt==='TIE'?"It's a Tie":wt.toUpperCase())+'</div>'
    +'<div style="font-size:14px;color:#9aa6b8;margin-top:8px">'
    +tA.toUpperCase()+' <b style="color:#f0c14b">'+sA+'</b> — <b style="color:#f0c14b">'+sB+'</b> '+tB.toUpperCase()+'</div>';
  document.getElementById('champ-btns').innerHTML =
    '<button class="btn btn-primary" onclick="launchClash()">Rematch</button>'
    +'<button class="btn btn-ghost" onclick="go(\'clashSetup\')">New Clash</button>'
    +'<button class="btn btn-ghost" onclick="go(\'home-screen\')">Home</button>';
  go('champ-screen');
  spawnConfetti();
}

function rotateHeroSprites() {
  var pool = [6,9,25,94,130,143,149,150,248,373,376,445,448,483,487];
  var a = pool[Math.floor(Math.random()*pool.length)];
  var b = pool[Math.floor(Math.random()*pool.length)];
  while (b === a) b = pool[Math.floor(Math.random()*pool.length)];
  var left = document.getElementById('hero-left');
  var right = document.getElementById('hero-right');
  if (left) { left.style.display=''; left.src = animUrl(a); }
  if (right) { right.style.display=''; right.src = animUrl(b); }
}

window.go = go;
window.launchPicker = launchPicker;
window.launchMini = launchMini;
window.launchMega = launchMega;
window.launchClash = launchClash;
window.pickWinner = pickWinner;
window.handleClashPick = handleClashPick;
window.viewBracket = viewBracket;
window.renderBracketView = renderBracketView;
window.toggle2Player = toggle2Player;
window.toggleAudio = toggleAudio;
window.openHOF = openHOF;
window.openStats = openStats;
window.clearHOF = clearHOF;
window.clearStats = clearStats;
window.renderHOF = renderHOF;
window.resumeTournament = resumeTournament;
window.clearSavedTournament = clearSavedTournament;
window.showResumeBanner = showResumeBanner;
Object.defineProperty(window, '_replayFn', {
  get: function() { return _replayFn; },
  set: function(v) { _replayFn = v; }
});
Object.defineProperty(window, '_bracketFromScreen', {
  get: function() { return _bracketFromScreen; },
  set: function(v) { _bracketFromScreen = v; }
});

initFilters();
showResumeBanner();
rotateHeroSprites();
setInterval(rotateHeroSprites, 8000);
})();
