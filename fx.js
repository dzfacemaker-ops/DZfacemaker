/* ===== DZfacemaker FX: تأثيرات وحياة للموقع (بدون لمس script.js) ===== */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  document.documentElement.classList.add('fx');

  const all = () => { const o = []; [src21, src17].forEach(src => Object.keys(src).forEach(l => Object.keys(src[l]).forEach(c => (src[l][c] || []).forEach(p => o.push({ p, club: c }))))); return o; };
  const latest = () => all().map((x, i) => ({ ...x, i })).sort((a, b) => String(b.p.added || '').localeCompare(String(a.p.added || '')) || a.i - b.i);

  // شريط التقدم عند السكرول
  const bar = el('div'); bar.id = 'progress'; document.body.appendChild(bar);
  addEventListener('scroll', () => { const h = document.documentElement; bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%'; }, { passive: true });

  // شريط آخر الإضافات
  const news = latest().slice(0, 10);
  if (news.length) {
    const t = el('div', 'ticker'), inn = el('div', 'ticker-in');
    for (let k = 0; k < 2; k++) news.forEach(x => {
      const s = el('span', 'tk', ''); s.append(el('b', '', 'PES ' + (x.p.game || '17')), document.createTextNode(' ' + x.p.name + ' · ' + x.club));
      s.onclick = () => openPlayerModal(x.p, x.club); inn.appendChild(s);
    });
    t.appendChild(inn); $('.hero').before(t);
  }

  // الهيرو: الإحصائيات تحت النص + عرض الوجوه 3D + زر مفاجأة
  const grid = $('.hero-grid'), left = grid.firstElementChild, stats = $('.stats');
  if (stats) left.appendChild(stats);
  const rnd = el('button', 'cta ghost', 'Surprise me'); rnd.type = 'button';
  $('.cta').after(rnd);
  rnd.onclick = () => { const a = all(); const x = a[Math.floor(Math.random() * a.length)]; if (x) openPlayerModal(x.p, x.club); };

  const feat = latest().filter(x => x.p.img).slice(0, 6), n = feat.length;
  if (n) {
    const show = el('div', 'showcase'); grid.appendChild(show);
    const cards = feat.map((x, i) => {
      const c = el('div', 'sc-card g' + (x.p.game || '17'));
      const im = el('img'); im.src = x.p.img; im.alt = x.p.name; im.loading = 'lazy';
      const cap = el('div', 'sc-cap'); cap.append(el('b', '', x.p.name), el('span', '', x.club));
      c.append(im, cap); show.appendChild(c);
      c.onclick = () => { if (c.dataset.d === '0') openPlayerModal(x.p, x.club); else { cur = i; lay(); } };
      return c;
    });
    let cur = 0, hold = false;
    function lay() { cards.forEach((c, i) => { let d = (i - cur + n) % n; if (d > n / 2) d -= n; c.dataset.d = Math.abs(d) <= 1 ? d : 'x'; }); }
    lay();
    show.addEventListener('pointerenter', () => hold = true);
    show.addEventListener('pointerleave', () => { hold = false; show.style.setProperty('--rx', '0deg'); show.style.setProperty('--ry', '0deg'); });
    show.addEventListener('pointermove', e => { const r = show.getBoundingClientRect(); show.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 14 + 'deg'); show.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 10 + 'deg'); });
    if (!reduce) setInterval(() => { if (!hold && !document.hidden) { cur = (cur + 1) % n; lay(); } }, 3200);
  }

  // خلفية جزيئات متحركة
  const cv = el('canvas', 'fx-canvas'); grid.prepend(cv);
  const g = cv.getContext('2d'); let W, H, P = [], vis = true;
  function size() { W = cv.width = grid.clientWidth; H = cv.height = grid.clientHeight; const N = W < 700 ? 22 : 44; P = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 })); }
  size(); addEventListener('resize', size);
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(grid);
  (function draw() {
    if (vis && !reduce) {
      g.clearRect(0, 0, W, H);
      P.forEach((a, i) => {
        a.x = (a.x + a.vx + W) % W; a.y = (a.y + a.vy + H) % H;
        g.fillStyle = 'rgba(46,232,138,.55)'; g.beginPath(); g.arc(a.x, a.y, 1.6, 0, 7); g.fill();
        for (let j = i + 1; j < P.length; j++) { const b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 120) { g.strokeStyle = 'rgba(46,232,138,' + (.22 * (1 - d / 120)) + ')'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } }
      });
    }
    requestAnimationFrame(draw);
  })();

  // عدّاد الأرقام
  function animStats() {
    if (reduce) return;
    $$('.stats b').forEach(b => { const t = +b.textContent || 0; if (!t) return; const t0 = performance.now(); (function f(now) { const k = Math.min(1, (now - t0) / 1000); b.textContent = Math.round(t * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); });
  }
  const _us = updateStats; updateStats = function () { _us(); animStats(); }; animStats();

  // ظهور البطاقات عند السكرول + لمعان وميلان عند الماوس
  const dg = $('#display-grid');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); setTimeout(() => e.target.style.transitionDelay = '', 900); } }), { threshold: .06, rootMargin: '0px 0px -20px 0px' });
  function watch() { $$('.face-card:not([data-w])', dg).forEach((c, i) => { c.dataset.w = 1; c.style.transitionDelay = (i % 6) * 55 + 'ms'; io.observe(c); }); }
  new MutationObserver(watch).observe(dg, { childList: true }); watch();
  dg.addEventListener('pointermove', e => {
    const c = e.target.closest('.face-card'); if (!c || e.pointerType === 'touch') return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    if (!reduce) c.style.transform = 'perspective(700px) rotateX(' + ((.5 - y) * 7) + 'deg) rotateY(' + ((x - .5) * 7) + 'deg) translateY(-6px)';
  });
  dg.addEventListener('pointerout', e => { const c = e.target.closest('.face-card'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });

  // بحث فوري مع صور
  const sw = $('.search-wrapper'), inp = $('#search-input'), dd = el('div', 'sdrop'); sw.appendChild(dd);
  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase(); dd.innerHTML = '';
    if (q.length < 2) { dd.style.display = 'none'; return; }
    const res = all().filter(x => (x.p.name + ' ' + x.club).toLowerCase().includes(q)).slice(0, 6);
    res.forEach(x => {
      const r = el('div', 'sd-row'); const im = el('img'); im.src = x.p.img; im.alt = '';
      const tx = el('div'); tx.append(el('b', '', x.p.name), el('span', '', x.club + ' · PES ' + (x.p.game || '17')));
      r.append(im, tx); r.onmousedown = e => { e.preventDefault(); dd.style.display = 'none'; openPlayerModal(x.p, x.club); }; dd.appendChild(r);
    });
    dd.style.display = res.length ? 'block' : 'none';
  });
  document.addEventListener('click', e => { if (!sw.contains(e.target)) dd.style.display = 'none'; });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') dd.style.display = 'none';
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); inp.focus(); }
  });
})();
