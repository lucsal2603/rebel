/* ═══════════════════════════════════════════════
   REBEL® — motore animazioni
   GSAP + ScrollTrigger + Lenis
   ═══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  || new URLSearchParams(location.search).has('static');
const TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const MOBILE = window.matchMedia('(max-width: 700px)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ── Lenis (smooth scroll) ─────────────────── */
let lenis = null;
if (!REDUCE) {
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

/* ── util: split testo ─────────────────────── */
function splitWords(el) {
  // parole mascherate (.w > .wi) per reveal dal basso
  if (el.dataset.splitDone) return $$('.wi', el);
  const frag = document.createDocumentFragment();
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const w = document.createElement('span'); w.className = 'w';
        const wi = document.createElement('span'); wi.className = 'wi';
        wi.textContent = part; w.append(wi); frag.append(w);
      });
    } else if (n.nodeName === 'BR') {
      frag.append(document.createElement('br'));
    } else {
      const w = document.createElement('span'); w.className = 'w';
      const wi = document.createElement('span'); wi.className = 'wi';
      wi.append(n.cloneNode(true)); w.append(wi); frag.append(w);
    }
  });
  el.innerHTML = ''; el.append(frag); el.dataset.splitDone = '1';
  return $$('.wi', el);
}

function splitPlain(el) {
  // parole semplici (.sw) per reveal in opacità legato allo scroll
  if (el.dataset.splitDone) return $$('.sw', el);
  const frag = document.createDocumentFragment();
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const s = document.createElement('span'); s.className = 'sw';
        s.textContent = part; frag.append(s);
      });
    } else { frag.append(n.cloneNode(true)); }
  });
  el.innerHTML = ''; el.append(frag); el.dataset.splitDone = '1';
  return $$('.sw', el);
}

/* ── util: disegno tratti SVG ──────────────── */
function prepDraw(svg) {
  return $$('[data-draw]', svg).map(p => {
    const L = p.getTotalLength();
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
    return p;
  });
}

/* ═════════ MODALITÀ RIDOTTA: pagina statica ═════════ */
if (REDUCE) {
  document.documentElement.classList.add('reduced');
  const ld = $('#loader'); if (ld) ld.remove();
  $$('svg [data-draw]').forEach(p => { p.style.strokeDasharray = 'none'; });
} else {

/* ═════════ LOADER ═════════ */
document.body.classList.add('is-locked');
if (lenis) lenis.stop();

const counterObj = { v: 0 };
const loaderTl = gsap.timeline({ paused: true });
loaderTl
  .to('.ld', { y: 0, duration: 0.85, ease: 'expo.out', stagger: 0.07 }, 0.1)
  .to('.loader-tag', { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.5)
  .to(counterObj, {
    v: 100, duration: 1.05, ease: 'power2.inOut',
    onUpdate: () => { $('#loadNum').textContent = Math.round(counterObj.v); }
  }, 0)
  .to('.loader-word, .loader-tag, .loader-count', { yPercent: -30, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, '+=0.15')
  .to('#loader', {
    yPercent: -100, duration: 0.85, ease: 'expo.inOut',
    onComplete: () => {
      $('#loader').remove();
      document.body.classList.remove('is-locked');
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
      heroIntro.play();
    }
  }, '-=0.1');

/* parte quando i font sono pronti (fallback di sicurezza) */
document.fonts.ready.then(() => loaderTl.play());
setTimeout(() => { if (loaderTl.progress() === 0 && !loaderTl.isActive()) loaderTl.play(); }, 1600);

/* ═════════ HERO — intro ═════════ */
const heroDoodles = ['.strike', '.hero-arrow', '.hero-x1', '.hero-x2'].map(s => $(s)).filter(Boolean);
heroDoodles.forEach(prepDraw);

const heroIntro = gsap.timeline({ paused: true });
heroIntro
  .from('.hl', { yPercent: 130, rotation: 8, duration: 1.05, ease: 'expo.out', stagger: 0.065 }, 0)
  .from('.hero-media', { scale: 0.55, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, 0.35)
  .from('.hero-kicker', { y: 30, autoAlpha: 0, duration: 0.8, ease: 'expo.out' }, 0.55)
  .from('.hero-para', { y: 30, autoAlpha: 0, duration: 0.8, ease: 'expo.out' }, 0.65)
  .from('.hero-scrawl', { scale: 0.6, rotation: 4, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.2)' }, 0.8)
  .from('.hero-spark', { scale: 0.4, autoAlpha: 0, rotation: -90, duration: 0.7, ease: 'back.out(2)' }, 1)
  .from('.pen-note--arrow', { autoAlpha: 0, y: 12, duration: 0.5, ease: 'power2.out' }, 1.15)
  .from('.scroll-ind', { autoAlpha: 0, y: 14, duration: 0.6, ease: 'power2.out' }, 1.2);

heroDoodles.forEach((svg, i) => {
  heroIntro.to($$('[data-draw]', svg), {
    strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.12
  }, 0.7 + i * 0.18);
});

/* parole del paragrafo hero: pronte per lo scrub */
const heroWords = splitPlain($('.hero-para'));
gsap.set(heroWords, { opacity: 0.14 });

/* ═════════ HERO — scrub pinnato (lettere che esplodono) ═════════ */
const heroScrub = gsap.timeline({
  scrollTrigger: { trigger: '.hero-pin', start: 'top top', end: '+=130%', pin: true, scrub: 1 }
});
heroScrub
  .to(heroWords, { opacity: 1, stagger: 0.012, ease: 'none', duration: 0.15 }, 0)
  .to('.hl', {
    y: i => (i % 2 ? -1 : 1) * (140 + i * 55),
    x: i => (i - 2.5) * 44,
    rotation: i => (i % 2 ? 1 : -1) * (10 + i * 4),
    ease: 'power1.in', duration: 1
  }, 0.05)
  .to('.hero-media', { scale: 1.42, y: '-6vh', ease: 'none', duration: 1 }, 0)
  .to('.hero-scrawl', { y: -110, rotation: -11, ease: 'none', duration: 1 }, 0)
  .to('.hero-spark', { rotation: 140, ease: 'none', duration: 1 }, 0)
  .to('.scroll-ind', { autoAlpha: 0, duration: 0.15 }, 0.05)
  .to('.hero-kicker', { autoAlpha: 0, y: -40, duration: 0.3 }, 0.55)
  .to('.hero-para', { autoAlpha: 0, y: -50, duration: 0.25 }, 0.72);

/* ═════════ MANIFESTO — bande giganti in scrub ═════════ */
const bandMoves = [ { from: 6, to: -30 }, { from: -32, to: 4 }, { from: 4, to: -26 } ];
$$('.mband').forEach((band, i) => {
  gsap.fromTo(band, { xPercent: bandMoves[i].from }, {
    xPercent: bandMoves[i].to, ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
  });
});

/* ═════════ 01 LOGHI — flip pinnato in 3 stadi ═════════ */
const stages = $$('.logo-stage');
gsap.set(stages.slice(1), { autoAlpha: 0, scale: 0.92, yPercent: 6 });

const stageNumEl = $('#stageNum');
const loghiTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.loghi-pin', start: 'top top', end: '+=280%', pin: true, scrub: 1,
    onUpdate: self => {
      const idx = Math.min(3, 1 + Math.floor(self.progress * 3));
      stageNumEl.textContent = String(idx).padStart(2, '0');
    }
  }
});

stages.forEach((stage, i) => {
  const old = $('.flip-old', stage);
  const neu = $('.flip-new', stage);
  const wrap = $('.flip-wrap', stage);
  const base = i * 1.4;

  if (i > 0) {
    loghiTl
      .to(stages[i - 1], { autoAlpha: 0, scale: 0.9, yPercent: -6, duration: 0.25, ease: 'power2.in' }, base - 0.28)
      .to(stage, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 0.25, ease: 'power2.out' }, base - 0.05);
  }
  loghiTl
    .fromTo(old, { rotationY: 0 }, { rotationY: -180, duration: 1, ease: 'power2.inOut' }, base + 0.2)
    .fromTo(neu, { rotationY: 180 }, { rotationY: 0, duration: 1, ease: 'power2.inOut' }, base + 0.2)
    .fromTo([old, neu], { filter: 'blur(0px)' }, { filter: 'blur(7px)', duration: 0.5, ease: 'power1.in' }, base + 0.2)
    .to([old, neu], { filter: 'blur(0px)', duration: 0.5, ease: 'power1.out' }, base + 0.7)
    .fromTo(wrap, { scale: 1 }, { scale: 0.94, duration: 0.5, ease: 'power1.in' }, base + 0.2)
    .to(wrap, { scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, base + 0.7);
});

/* ═════════ 02 PACKAGING — rotazione pinnata ═════════ */
const packRotor = $('#packRotor');
const packTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.pack-pin', start: 'top top', end: '+=220%', pin: true, scrub: 1,
    onUpdate: self => packRotor.classList.toggle('is-new', self.progress >= 0.5)
  }
});
packTl
  .fromTo('.pack-obj', { rotationY: 0 }, { rotationY: 720, duration: 3, ease: 'none' }, 0)
  .from('.pack-list--old li', { x: -70, autoAlpha: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out', immediateRender: true }, 0.1)
  .from('.pack-list--new li', { x: 70, autoAlpha: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out', immediateRender: true }, 0.35)
  .to('.pack-list--old li', { autoAlpha: 0.25, x: -24, stagger: 0.08, duration: 0.5 }, 1.9)
  .to('.pack-note', { autoAlpha: 0, duration: 0.3 }, 2.5);

/* ═════════ 03 CAMPAGNE — arrivano da ogni direzione ═════════ */
if (!MOBILE) {
  const campTl = gsap.timeline({
    scrollTrigger: { trigger: '.camp-field', start: 'top 92%', end: 'bottom 55%', scrub: 1.2 }
  });
  campTl
    .from('.ci-poster', { x: '-70vw', rotation: -32, duration: 0.62, ease: 'power2.out', immediateRender: true }, 0)
    .from('.ci-social', { x: '70vw', rotation: 30, duration: 0.62, ease: 'power2.out', immediateRender: true }, 0.1)
    .from('.ci-desk', { y: '75vh', rotation: 16, duration: 0.65, ease: 'power2.out', immediateRender: true }, 0.2)
    .from('.ci-billboard', { y: '-65vh', x: '25vw', rotation: -20, duration: 0.65, ease: 'power2.out', immediateRender: true }, 0.34)
    .from('.ci-merch', { x: '-60vw', y: '30vh', rotation: 24, duration: 0.62, ease: 'power2.out', immediateRender: true }, 0.48);
  prepDraw($('.camp-spring'));
  gsap.to($$('.camp-spring [data-draw]'), {
    strokeDashoffset: 0, duration: 1, ease: 'power2.inOut',
    scrollTrigger: { trigger: '.camp-field', start: 'top 70%' }
  });
} else {
  /* mobile: colonna singola, reveal semplice dal basso */
  $$('.camp-item').forEach(item => {
    gsap.from(item, {
      y: 50, autoAlpha: 0, duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: item, start: 'top 90%', once: true }
    });
  });
}

/* ═════════ TAPE — marquee infiniti ═════════ */
$$('.tape').forEach(tape => {
  const inner = $('.tape-in', tape);
  const dir = tape.classList.contains('tape--neon') ? 1 : -1;
  gsap.fromTo(inner, { xPercent: dir === 1 ? -50 : 0 }, {
    xPercent: dir === 1 ? 0 : -50, duration: 24, ease: 'none', repeat: -1
  });
});

/* ═════════ CASI — colore pagina + prima/dopo + wipe ═════════ */
$$('[data-bg]').forEach(sec => {
  const bg = sec.dataset.bg, ink = sec.dataset.ink;
  ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onEnter: () => gsap.to('body', { backgroundColor: bg, color: ink, duration: 0.7, ease: 'power2.out', overwrite: 'auto' }),
    onEnterBack: () => gsap.to('body', { backgroundColor: bg, color: ink, duration: 0.7, ease: 'power2.out', overwrite: 'auto' })
  });
});

$$('.ba').forEach(ba => {
  const before = $('.ba-before', ba);
  const line = $('.ba-line', ba);
  gsap.timeline({
    scrollTrigger: { trigger: ba, start: 'top 80%', end: 'bottom 35%', scrub: 1, invalidateOnRefresh: true }
  })
    .fromTo(before, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', ease: 'none' }, 0)
    .fromTo(line, { x: 0 }, { x: () => ba.clientWidth - 3, ease: 'none' }, 0)
    .fromTo($('.ba-tag--before', ba), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.18 }, 0.62);
});

/* contatori animati */
$$('[data-count]').forEach(el => {
  const final = parseFloat(el.dataset.count);
  const obj = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 88%', once: true,
    onEnter: () => gsap.to(obj, {
      v: final, duration: 1.6, ease: 'expo.out',
      onUpdate: () => { el.textContent = Math.round(obj.v); }
    })
  });
});

/* ═════════ PORTFOLIO ORIZZONTALE ═════════ */
const track = $('#folioTrack');
const folioDist = () => track.scrollWidth - window.innerWidth;
const folioTween = gsap.to(track, {
  x: () => -folioDist(), ease: 'none',
  scrollTrigger: {
    trigger: '.folio', start: 'top top',
    end: () => '+=' + folioDist(),
    pin: true, scrub: 1, invalidateOnRefresh: true,
    onUpdate: self => gsap.set('#folioBar', { scaleX: self.progress })
  }
});
/* parallasse interna alle card */
$$('.fcard .ph-in').forEach(inner => {
  gsap.fromTo(inner, { xPercent: -4 }, {
    xPercent: 4, ease: 'none',
    scrollTrigger: {
      trigger: inner.closest('.fcard'), containerAnimation: folioTween,
      start: 'left right', end: 'right left', scrub: true
    }
  });
});
prepDraw($('.fcard--last .doodle'));
gsap.to($$('.fcard--last [data-draw]'), {
  strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut',
  scrollTrigger: {
    trigger: '.fcard--last', containerAnimation: folioTween, start: 'left 85%'
  }
});

/* ═════════ FINALE ═════════ */
const finWords = splitPlain($('.finale-title'));
gsap.set(finWords, { opacity: 0.12 });
gsap.to(finWords, {
  opacity: 1, stagger: 0.06, ease: 'none',
  scrollTrigger: { trigger: '.finale-title', start: 'top 80%', end: 'top 30%', scrub: 1 }
});

prepDraw($('.finale-circle'));
const siTl = gsap.timeline({
  scrollTrigger: { trigger: '.finale-si', start: 'top 75%', once: true }
});
siTl
  .from('.finale-scrawl', { scale: 0.4, rotation: -22, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.4)' })
  .to($$('.finale-circle [data-draw]'), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.25);

gsap.from('.btn-cta', {
  y: 60, autoAlpha: 0, duration: 1, ease: 'expo.out',
  scrollTrigger: { trigger: '.btn-cta', start: 'top 88%', once: true }
});

/* footer: gigante in parallasse */
gsap.from('.foot-giant', {
  yPercent: 42, ease: 'none',
  scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 }
});

/* ═════════ REVEAL GENERICI ═════════ */
$$('[data-reveal]').forEach(el => {
  gsap.from(el, {
    y: 44, autoAlpha: 0, duration: 1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 90%', once: true }
  });
});

$$('[data-split]').forEach(el => {
  const words = splitWords(el);
  gsap.from(words, {
    yPercent: 118, rotation: 5, duration: 1.05, ease: 'expo.out', stagger: 0.055,
    scrollTrigger: { trigger: el, start: 'top 86%', once: true }
  });
});

/* doodle generici (fuori da hero/finale, già gestiti) */
$$('.num-under').forEach(svg => {
  prepDraw(svg);
  gsap.to($$('[data-draw]', svg), {
    strokeDashoffset: 0, duration: 1, ease: 'power2.inOut',
    scrollTrigger: { trigger: svg, start: 'top 92%', once: true }
  });
});

} /* fine !REDUCE */

/* ═════════ CURSORE CUSTOM + MAGNETICI + SCIA ═════════ */
if (!TOUCH && !REDUCE) {
  const dot = $('#cursorDot'), label = $('#cursorLabel');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const dotPos = { ...pos }, labelPos = { ...pos };
  let cursorOn = false;

  const dotScale = v => gsap.to(dot, { scale: v, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });

  /* il pallino cambia colore da solo ogni ~2s, in loop, sui colori del brand */
  const CURSOR_COLORS = [
    { c: '#4dff00', glow: 'rgba(77,255,0,.65)' },
    { c: '#004fe4', glow: 'rgba(0,79,228,.65)' },
    { c: '#ff8fd8', glow: 'rgba(255,143,216,.65)' },
    { c: '#ffd900', glow: 'rgba(255,217,0,.65)' }
  ];
  gsap.set(dot, { backgroundColor: CURSOR_COLORS[0].c, boxShadow: `0 0 16px ${CURSOR_COLORS[0].glow}` });
  const colorTl = gsap.timeline({ repeat: -1 });
  CURSOR_COLORS.forEach((_, i) => {
    const next = CURSOR_COLORS[(i + 1) % CURSOR_COLORS.length];
    colorTl.to(dot, {
      backgroundColor: next.c, boxShadow: `0 0 16px ${next.glow}`,
      duration: 0.7, ease: 'power2.inOut'
    }, '+=1.3');
  });

  window.addEventListener('mousemove', e => {
    pos.x = e.clientX; pos.y = e.clientY;
    if (!cursorOn) {
      cursorOn = true;
      gsap.to(dot, { opacity: 1, duration: 0.3 });
      dotPos.x = labelPos.x = pos.x; dotPos.y = labelPos.y = pos.y;
    }
    spawnTrail(e.clientX, e.clientY);
  }, { passive: true });

  gsap.ticker.add(() => {
    dotPos.x += (pos.x - dotPos.x) * 0.42; dotPos.y += (pos.y - dotPos.y) * 0.42;
    labelPos.x += (pos.x - labelPos.x) * 0.16; labelPos.y += (pos.y - labelPos.y) * 0.16;
    gsap.set(dot, { x: dotPos.x - 9, y: dotPos.y - 9 });
    gsap.set(label, { x: labelPos.x + 20, y: labelPos.y + 20 });
  });

  /* stati hover del cursore */
  document.addEventListener('mouseover', e => {
    const tagged = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button, .ph');
    if (tagged) {
      label.textContent = tagged.dataset.cursor;
      gsap.to(label, { opacity: 1, duration: 0.25 });
      dotScale(2.8);
    } else if (link) {
      dotScale(1.7);
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('[data-cursor]')) {
      gsap.to(label, { opacity: 0, duration: 0.2 });
    }
    dotScale(1);
  });

  /* ── scia del mouse ── */
  const trailBox = $('#trail');
  const COLORS = ['#4dff00', '#004fe4', '#ff8fd8', '#ffd900', '#111111'];
  const SHAPES = [
    c => `<svg width="100%" height="100%" viewBox="0 0 24 24"><path d="M4,4 L20,20 M20,4 L4,20" stroke="${c}" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`,
    c => `<svg width="100%" height="100%" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="${c}" stroke-width="3" fill="none"/></svg>`,
    c => `<svg width="100%" height="100%" viewBox="0 0 24 24"><path d="M12,1 L14,10 L23,12 L14,14 L12,23 L10,14 L1,12 L10,10 Z" fill="${c}"/></svg>`,
    c => `<svg width="100%" height="100%" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="${c}"/></svg>`,
    c => `<svg width="100%" height="100%" viewBox="0 0 28 16"><path d="M2,12 Q8,2 14,9 T26,6" stroke="${c}" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`
  ];
  let lastX = -100, lastY = -100, shapeIdx = 0;

  function spawnTrail(x, y) {
    if (Math.hypot(x - lastX, y - lastY) < 34) return;
    lastX = x; lastY = y;
    if (trailBox.children.length > 30) trailBox.firstChild.remove();

    const el = document.createElement('div');
    el.className = 'tr-el';
    const size = gsap.utils.random(13, 26);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.width = el.style.height = size + 'px';
    el.innerHTML = SHAPES[shapeIdx++ % SHAPES.length](color);
    trailBox.append(el);

    const r0 = gsap.utils.random(-40, 40);
    gsap.fromTo(el,
      { x: x - size / 2, y: y - size / 2, scale: 0.45, rotation: r0, opacity: 1 },
      { scale: 1, rotation: r0 + gsap.utils.random(-50, 50), duration: 0.28, ease: 'power2.out' }
    );
    gsap.to(el, {
      opacity: 0, scale: 0.3, y: '+=' + gsap.utils.random(20, 44),
      duration: 0.55, delay: 0.16, ease: 'power2.in',
      onComplete: () => el.remove()
    });
  }

  /* ── bottoni magnetici ── */
  $$('[data-magnet]').forEach(btn => {
    const strength = parseFloat(btn.dataset.magnet) || 0.3;
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength);
      yTo((e.clientY - r.top - r.height / 2) * strength);
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ═════════ MENU MOBILE (hamburger) ═════════ */
const burger = $('#headBurger');
if (burger) {
  const closeNav = () => {
    document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $('#headNav')?.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
  window.__closeNav = closeNav;
}

/* ═════════ ANCORE con Lenis ═════════ */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (window.__closeNav) window.__closeNav();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ═════════ refresh dopo font e load ═════════ */
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
