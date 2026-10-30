/* Viking Sudoku — plain JS, no modules, works from file:// */
(function () {
  'use strict';
  var RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᛝ','ᛞ','ᛟ'];
  var LEVELS = { easy: [40, 45], medium: [32, 36], hard: [26, 30] };
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ok(g, i, v) {
    var r = Math.floor(i / 9), c = i % 9, br = r - r % 3, bc = c - c % 3, k;
    for (k = 0; k < 9; k++) {
      if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
      if (g[(br + Math.floor(k / 3)) * 9 + bc + k % 3] === v) return false;
    }
    return true;
  }
  function fill(g) {
    var i = g.indexOf(0); if (i < 0) return true;
    var vals = shuffle([1,2,3,4,5,6,7,8,9]);
    for (var n = 0; n < 9; n++) { if (ok(g, i, vals[n])) { g[i] = vals[n]; if (fill(g)) return true; g[i] = 0; } }
    return false;
  }
  function count(g, limit) {
    var best = -1, bestN = 10, i, v, n;
    for (i = 0; i < 81; i++) if (!g[i]) {
      n = 0; for (v = 1; v <= 9; v++) if (ok(g, i, v)) n++;
      if (n < bestN) { bestN = n; best = i; if (n === 0) return 0; }
    }
    if (best < 0) return 1;
    var total = 0;
    for (v = 1; v <= 9 && total < limit; v++) if (ok(g, best, v)) { g[best] = v; total += count(g, limit - total); g[best] = 0; }
    return total;
  }
  function generate(level) {
    var range = LEVELS[level] || LEVELS.easy;
    var target = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
    var sol, puz, givens;
    for (var attempt = 0; attempt < 20; attempt++) {
      sol = new Array(81).fill(0); fill(sol);
      puz = sol.slice(); givens = 81;
      var order = shuffle(Array.from({ length: 81 }, function (_, k) { return k; }));
      for (var k = 0; k < order.length && givens > target; k++) {
        var i = order[k], keep = puz[i]; puz[i] = 0;
        if (count(puz.slice(), 2) !== 1) puz[i] = keep; else givens--;
      }
      if (givens <= range[1]) break;
    }
    return { puzzle: puz, solution: sol, givens: givens };
  }
  function conflicts(g) {
    var bad = {}, i, j;
    for (i = 0; i < 81; i++) if (g[i]) for (j = i + 1; j < 81; j++) if (g[j] === g[i]) {
      var ri = Math.floor(i / 9), rj = Math.floor(j / 9), ci = i % 9, cj = j % 9;
      if (ri === rj || ci === cj || (Math.floor(ri / 3) === Math.floor(rj / 3) && Math.floor(ci / 3) === Math.floor(cj / 3))) { bad[i] = bad[j] = true; }
    }
    return bad;
  }
  function isSolved(g) {
    if (g.length !== 81) return false;
    for (var i = 0; i < 81; i++) if (!(g[i] >= 1 && g[i] <= 9)) return false;
    return Object.keys(conflicts(g)).length === 0;
  }
  var API = { RUNES: RUNES, LEVELS: LEVELS, generate: generate, isSolved: isSolved, conflicts: conflicts, count: count };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }

  var gridEl = document.getElementById('grid'), barEl = document.getElementById('bar'), statusEl = document.getElementById('status');
  var state = { level: 'easy', grid: [], given: [], sel: 1, won: false }, cells = [], tiles = [];
  for (var i = 0; i < 81; i++) {
    var d = document.createElement('div'); d.className = 'cell' + ((i % 9 === 2 || i % 9 === 5) ? ' c3' : '') + ((Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5) ? ' r3' : '');
    d.dataset.i = i; d.addEventListener('click', onCell); gridEl.appendChild(d); cells.push(d);
  }
  for (var v = 1; v <= 10; v++) {
    var t = document.createElement('button'); var val = v === 10 ? 0 : v;
    t.className = 'tile' + (val ? '' : ' blank'); t.textContent = val ? RUNES[val - 1] : 'erase';
    t.title = val ? 'Rune ' + val : 'Blank (erase)'; t.dataset.v = val;
    t.addEventListener('click', function () { state.sel = +this.dataset.v; render(); }); barEl.appendChild(t); tiles.push(t);
  }
  function onCell() {
    var i = +this.dataset.i; if (state.won || state.given[i]) return;
    state.grid[i] = state.sel; render();
    if (isSolved(state.grid)) { state.won = true; render(); }
  }
  function newGame() {
    var p = generate(state.level); state.grid = p.puzzle.slice(); state.given = p.puzzle.map(Boolean); state.won = false; render();
  }
  function render() {
    var bad = conflicts(state.grid), counts = [0,0,0,0,0,0,0,0,0,0];
    for (var i = 0; i < 81; i++) {
      var g = state.grid[i], c = cells[i]; counts[g]++;
      c.textContent = g ? RUNES[g - 1] : '';
      c.classList.toggle('given', state.given[i]); c.classList.toggle('user', !!g && !state.given[i]);
      c.classList.toggle('conflict', !!bad[i]); c.classList.toggle('same', !!g && g === state.sel);
    }
    tiles.forEach(function (t) { var v = +t.dataset.v; t.classList.toggle('sel', v === state.sel); t.classList.toggle('done', v > 0 && counts[v] >= 9); });
    gridEl.classList.toggle('won', state.won);
    document.querySelectorAll('.level').forEach(function (b) { b.classList.toggle('active', b.dataset.level === state.level); });
    statusEl.classList.toggle('win', state.won);
    var filled = counts.slice(1).reduce(function (a, b) { return a + b; }, 0);
    statusEl.textContent = state.won ? 'ᛋᚴᚨᛚ! Victory — the grid is complete. Well fought, Viking!'
      : (state.level[0].toUpperCase() + state.level.slice(1)) + ' · ' + state.given.filter(Boolean).length + ' given runes · ' + (81 - filled) + ' empty';
  }
  document.querySelectorAll('.level').forEach(function (b) { b.addEventListener('click', function () { state.level = b.dataset.level; newGame(); }); });
  document.getElementById('newgame').addEventListener('click', newGame);
  newGame();
})();
