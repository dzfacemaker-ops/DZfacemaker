// عرض الوجوه: الكل / PES 17 / PES 21  (بدون لمس script.js)
// كل وجه في script.js يعتبر PES 17، إلا إذا زدت فيه:  game: "21"
const src17 = Object.assign({}, database);
const src21 = (typeof database21 !== 'undefined') ? database21 : {};
function tagGame(src, def) {
  Object.keys(src).forEach(l => Object.keys(src[l]).forEach(c => (src[l][c] || []).forEach(p => { if (!p.game) p.game = def; })));
}
tagGame(src17, '17'); tagGame(src21, '21');
window.currentGame = 'all';

function buildDb(g) {
  const out = {};
  [src21, src17].forEach(src => Object.keys(src).forEach(l => Object.keys(src[l]).forEach(c =>
    (src[l][c] || []).forEach(p => {
      if (g !== 'all' && String(p.game) !== g) return;
      out[l] = out[l] || {}; out[l][c] = out[l][c] || []; out[l][c].push(p);
    }))));
  return out;
}
const NAMES = { all: 'PES\u00a017 & 21', '17': 'PES\u00a017', '21': 'PES\u00a021' };
const EYES = { all: 'PES 2017 & 2021', '17': 'PES 2017', '21': 'PES 2021' };
function setGame(g) {
  window.currentGame = g;
  Object.keys(database).forEach(k => delete database[k]);
  Object.assign(database, buildDb(g));
  document.querySelectorAll('.game-tabs button').forEach(b => {
    const on = b.dataset.g === g; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  });
  const n = document.getElementById('game-name'); if (n) n.textContent = NAMES[g];
  const e = document.getElementById('game-eyebrow'); if (e) e.textContent = EYES[g] + ' \u00b7 Face Packs';
  document.title = 'DZfacemaker | Premium ' + NAMES[g].replace('\u00a0', ' ') + ' Faces Database';
  document.getElementById('player-modal').style.display = 'none';
  init();
  if (window.onGameChange) window.onGameChange();
  try { history.replaceState(null, '', g === 'all' ? location.pathname + location.search : '#pes' + g); } catch (err) {}
}
document.querySelectorAll('.game-tabs button').forEach(b => { b.onclick = () => setGame(b.dataset.g); });
setGame(location.hash === '#pes21' ? '21' : location.hash === '#pes17' ? '17' : 'all');
