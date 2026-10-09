// إحصائيات الهيرو (تحسب تلقائياً من database)
(function () {
  const L = Object.keys(database); let c = 0, f = 0;
  L.forEach(l => { const k = Object.keys(database[l]); c += k.length; k.forEach(x => f += (database[l][x] || []).length); });
  const s = (i, v) => { const e = document.getElementById(i); if (e) e.textContent = v; };
  s('st-faces', f); s('st-clubs', c); s('st-leagues', L.length);
})();

let db = null, me = null, curPlayer = null, offs = [], lastPost = 0;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  firebase.auth().onAuthStateChanged(u => { me = u; if (curPlayer) renderSocial(curPlayer); });
  firebase.auth().signInAnonymously().catch(e => console.error('AUTH ERROR:', e.code, e.message));
} catch (e) { console.error('FIREBASE INIT ERROR:', e); db = null; }

const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt) e.textContent = txt; return e; };

const _open = openPlayerModal;
openPlayerModal = function (p, c) { _open(p, c); curPlayer = p; renderSocial(p); };
document.getElementById('close-modal-btn').addEventListener('click', () => { curPlayer = null; offs.forEach(f => f()); offs = []; });

function renderSocial(p) {
  offs.forEach(f => f()); offs = [];
  let box = document.getElementById('social-box');
  if (!box) { box = el('div'); box.id = 'social-box'; document.querySelector('.modal-info').appendChild(box); }
  box.innerHTML = '';
  if (!db) { box.appendChild(el('p', 'cm-empty', 'Likes & comments are not available here. Open the live website.')); return; }
  const id = slug(p.name);

  // الإعجاب
  const likeBtn = el('button', 'like-btn', '♡ 0');
  box.appendChild(likeBtn);
  const lr = db.ref('likes/' + id);
  const lh = lr.on('value', s => {
    const liked = me && s.hasChild(me.uid);
    likeBtn.textContent = (liked ? '♥ ' : '♡ ') + s.numChildren();
    likeBtn.classList.toggle('liked', !!liked);
    likeBtn.onclick = () => { if (!me) { alert('Login error. Please refresh the page (Ctrl+Shift+R).'); return; } liked ? lr.child(me.uid).remove() : lr.child(me.uid).set(true); };
  });
  offs.push(() => lr.off('value', lh));

  // التعليقات
  box.appendChild(el('h4', 'cm-title', 'Comments'));
  const name = el('input'); name.placeholder = 'Your name'; name.maxLength = 30;
  const text = el('textarea'); text.placeholder = 'Write a comment...'; text.maxLength = 300; text.rows = 2;
  const send = el('button', 'cm-send', 'Post comment');
  const list = el('ul', 'cm-list');
  box.append(name, text, send, list);
  send.onclick = () => {
    const n = name.value.trim(), t = text.value.trim();
    if (!me || !n || !t || Date.now() - lastPost < 15000) return;
    lastPost = Date.now();
    db.ref('comments/' + id).push({ name: n, text: t, uid: me.uid, ts: firebase.database.ServerValue.TIMESTAMP })
      .then(() => { text.value = ''; }).catch(() => { lastPost = 0; });
  };
  const cr = db.ref('comments/' + id).orderByChild('ts').limitToLast(50);
  const ch = cr.on('value', s => {
    list.innerHTML = ''; const arr = [];
    s.forEach(c => { arr.push(c.val()); });
    if (!arr.length) list.appendChild(el('li', 'cm-empty', 'No comments yet. Be the first.'));
    arr.reverse().forEach(c => {
      const li = el('li'); li.append(el('strong', '', c.name), el('span', 'cm-date', ' ' + new Date(c.ts).toLocaleDateString()), el('p', '', c.text));
      list.appendChild(li);
    });
  });
  offs.push(() => cr.off('value', ch));
}

// طلب وجه (الكتابة فقط، الزوار ما يقروش الطلبات)
document.getElementById('submit-request-btn').addEventListener('click', () => {
  const i = document.getElementById('player-input'), v = i.value.trim();
  if (!v || v.length > 60) { alert("Please write a player's name (max 60 characters)."); return; }
  if (!db) { alert('Not available here. Please use the live website.'); return; }
  db.ref('requests').push({ name: v, date: new Date().toISOString().slice(0, 10) })
    .then(() => { alert('Your request has been sent successfully! 🚀'); i.value = ''; })
    .catch(e => alert('Error sending request: ' + (e.code || e.message)));
});


/* ============ ميزات إضافية: التحميلات، الأكثر إعجاباً، شارة NEW ============ */
const NEW_DAYS = 14; // الوجه يعتبر "جديد" لهذي المدة (بالأيام)

// فهرس اللاعبين من database تاع script.js (بدون لمسه)
const idx = {}, byName = {};
Object.keys(database).forEach(lg => Object.keys(database[lg]).forEach(club =>
  (database[lg][club] || []).forEach(p => { const o = { p, club }; idx[slug(p.name)] = o; byName[p.name] = o; })));

// 1) عدّاد التحميلات
let dlOff = null;
const _open2 = openPlayerModal;
openPlayerModal = function (p, c) {
  _open2(p, c);
  if (!db) return;
  if (dlOff) { dlOff(); dlOff = null; }
  const a = document.getElementById('download-link');
  let tag = document.getElementById('dl-count');
  if (!tag) { tag = el('span', 'dl-count'); tag.id = 'dl-count'; a.after(tag); }
  tag.textContent = '';
  const r = db.ref('downloads/' + slug(p.name));
  const h = r.on('value', s => { tag.textContent = '⬇ ' + (s.val() || 0) + ' downloads'; }, () => {});
  dlOff = () => r.off('value', h);
  a.onclick = () => { if (me) r.transaction(n => (n || 0) + 1); };
};

// 2) الأكثر إعجاباً (تظهر في الصفحة الرئيسية فقط)
const topBox = document.getElementById('top-box'), backBtn = document.getElementById('back-to-home');
let likeData = {};
const isHome = () => backBtn.style.display === 'none';
function renderTop() {
  topBox.innerHTML = '';
  if (!isHome()) { topBox.style.display = 'none'; return; }
  const rows = Object.keys(likeData).map(k => ({ k, n: Object.keys(likeData[k] || {}).length }))
    .filter(x => x.n > 0 && idx[x.k]).sort((a, b) => b.n - a.n).slice(0, 6);
  if (!rows.length) { topBox.style.display = 'none'; return; }
  topBox.style.display = 'block';
  topBox.appendChild(el('h3', 'top-title', '🔥 Most Liked Faces'));
  const g = el('div', 'top-grid');
  rows.forEach(x => {
    const { p, club } = idx[x.k];
    const c = el('div', 'face-card top-card');
    const h = el('div', 'card-img-holder'); const im = el('img'); im.src = p.img; im.alt = p.name; h.appendChild(im);
    const d = el('div', 'card-details'); const w = el('div');
    w.append(el('h3', '', p.name), el('p', 'card-club', '♥ ' + x.n + ' · ' + club));
    d.appendChild(w); c.append(h, d);
    c.onclick = () => openPlayerModal(p, club);
    g.appendChild(c);
  });
  topBox.appendChild(g);
}
if (db) db.ref('likes').on('value', s => { likeData = s.val() || {}; renderTop(); }, () => {});
new MutationObserver(renderTop).observe(backBtn, { attributes: true, attributeFilter: ['style'] });

// 3) شارة NEW (من حقل added: "2026-10-03" أو من تاريخ اسم الصورة)
function addedDate(p) {
  const m = (p.added || p.img || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function badges() {
  document.querySelectorAll('#display-grid .face-card').forEach(card => {
    if (card.querySelector('.new-badge')) return;
    const h = card.querySelector('h3'), o = h && byName[h.textContent];
    const d = o && addedDate(o.p);
    if (d && (Date.now() - d) / 864e5 <= NEW_DAYS) card.querySelector('.card-img-holder').appendChild(el('span', 'new-badge', 'NEW'));
  });
}
new MutationObserver(badges).observe(document.getElementById('display-grid'), { childList: true });
badges();
