// Inside the pit.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, circleD, rng, lerp, clamp, shape, paintFilter } from '../lib/core.js';
import { kf, on2, win, wob, step, camTransform } from '../lib/anim.js';
import { P } from '../lib/palette.js';
import { stage, camera, charScale, inPitSet, tint, SKY } from './common.js';
import { sky } from '../env/garden.js';
import { narrator, narratorFront, SIT } from '../chars/narrator.js';
import { puppy } from '../chars/puppy.js';
import { shoe } from '../props/shoe.js';
import { ladder } from '../props/misc.js';

const BASE = { f: 1700, H: -0.8, cx: 820, cy: 566 };
const D = 1.6;
const HIP = [0.92, 3.05];               // where he sits (X, Z)
// aim a camera (same position) so world point lands at screen (sx, sy)
function aim(f, X, Y, Z, sx = 960, sy = 540, H = BASE.H) {
  return camera({ f, H, cx: sx - X * f / Z, cy: sy - (H - Y) * f / Z });
}
// the sitting man, facing left so his left (shoeless) foot is towards us
const SITPOSE = { ...SIT, flip: -1, lean: -1, head: -1, tuft: true, armN: [-8, -62, -10, 1], armF: [-4, -64, 0, 1] };

function pitScene(svg, cam, { mode = 'overcast', fence = true, twigs = true } = {}) {
  const { defs, root } = stage(svg);
  const L = inPitSet(defs, cam, { mode, twigs });
  const world = g({}); root.appendChild(world);
  world.append(L.sky, L.twigs);
  if (fence) world.appendChild(L.fence);
  world.append(el('rect', { x: -3000, y: cam.p(0, -D, 2.4)[1] - 2, width: 8000, height: 4000, fill: '#30261e' }), L.back, L.shade);
  const back = g({}), mid = g({}), front = g({});
  world.append(back, mid, front, L.rim);
  return { defs, root, world, L, back, mid, front };
}
function addPup(defs, layer, cam, X, Z, view, pose, seed, q = {}, harold = false) {
  const p = puppy(defs, { view, pose, seed, harold });
  const [x, y] = cam.p(X, -D, Z), sc = charScale(cam, Z);
  const sh = el('path', { d: ellipseD(x, y + 1, 36 * sc, 8 * sc), fill: '#0f0a08', opacity: 0.5 });
  layer.append(sh, p.root);
  return { p, sh, base: { x, y, scale: sc, ...q } };
}
function glassesOnFloor(layer, cam, X, Z) {
  const [x, y] = cam.p(X, -D, Z), s = charScale(cam, Z) * 1.1;
  layer.appendChild(g({ transform: `translate(${x} ${y}) scale(${s})` },
    el('path', { d: 'M-24 -6 L-4 -5 C-4 1, -10 4, -15 4 C-20 4, -24 0, -24 -6Z M2 -5 L22 -6 C22 0, 18 4, 13 4 C8 4, 2 1, 2 -5Z', fill: '#dfe3df', 'fill-opacity': 0.25, stroke: '#3b302a', 'stroke-width': 2 }),
    el('path', { d: 'M-4 -4 L2 -4 M-24 -5 L-34 -12 M22 -5 L30 -14', stroke: '#3b302a', 'stroke-width': 1.8 })));
}

// ------------------------------------------------------------------ noRescue
// "The second thing I noticed was that the puppies had no interest in rescuing
// me. They regarded my arrival as an entertainment package."
export async function noRescue(svg, ctx) {
  const cam = camera(BASE);
  const S = pitScene(svg, cam);
  const { defs, back, mid, front } = S;
  glassesOnFloor(back, cam, -0.35, 3.2);
  const [nx, ny] = cam.p(HIP[0], -D, HIP[1]), ns = charScale(cam, HIP[1]);
  const n = narrator(defs, { seed: 17 });
  mid.appendChild(n.root);
  // a semicircle of spectators, all facing him
  const spect = [
    addPup(defs, back, cam, -1.45, 3.62, 'side', 'sit', 3, { headRot: -10 }),
    addPup(defs, back, cam, -0.9, 3.66, 'side', 'stand', 7, { headRot: -14 }),
    addPup(defs, back, cam, -0.35, 3.64, 'front', 'sit', 4, { look: 2.5, lookY: 0.4 }),
    addPup(defs, back, cam, 0.15, 3.68, 'side', 'sit', 2, { headRot: -18 }),
    addPup(defs, back, cam, -1.15, 3.28, 'side', 'sit', 11, { headRot: -8 }),
    addPup(defs, back, cam, -0.6, 3.22, 'front', 'sit', 1, { look: 2.6, lookY: 0.2 }),
    addPup(defs, front, cam, -0.25, 2.86, 'side', 'sit', 9, { headRot: -12 }),
    addPup(defs, front, cam, -1.35, 2.9, 'side', 'sit', 6, { headRot: -6 }, true),
    addPup(defs, front, cam, 0.25, 2.78, 'side', 'stand', 5, { headRot: -10 }),
  ];
  const tFun = ctx.W(13, 'they') - ctx.shot.start + 0.2;
  return {
    update(t) {
      S.world.setAttribute('transform', camTransform(lerp(960, 1080, win(t, 0, ctx.dur)), lerp(540, 600, win(t, 0, ctx.dur)), kf(t, [[0, 1.0], [ctx.dur, 1.07, 'sine']])));
      const tt = on2(t);
      const look = kf(tt, [[1.2, 0], [2.0, -4, 'io'], [5.5, -4], [6.2, 2, 'io']]);
      n.set({ ...SITPOSE, x: nx, y: ny, scale: ns, head: -1 + look, eyes: (tt % 3.1) > 2.95 ? 'closed' : 'open', brow: tt > tFun ? 2 : 0 });
      const fun = win(tt, tFun, tFun + 0.3);
      spect.forEach(({ p, sh, base }, i) => {
        const hop = fun * Math.max(0, Math.sin(tt * (8 + i % 3) + i * 1.9)) * 34 * base.scale;
        const q = { ...base, y: base.y - hop, wag: Math.sin(tt * (4 + fun * 12) + i) * (6 + fun * 24), earRot: fun * Math.sin(tt * 9 + i) * 10 };
        if (i === 8 || i === 1) { // runners: loop about in front of him once the fun starts
          const u = (tt - tFun) * (i === 8 ? 0.55 : 0.42) + (i === 1 ? 0.3 : 0);
          if (fun > 0) { q.x = base.x + Math.sin(u * 2 * Math.PI) * (i === 8 ? 330 : 260) * base.scale; q.flip = Math.cos(u * 2 * Math.PI) > 0 ? 1 : -1; q.trot = tt * 3; q.y = base.y; }
        }
        p.set(q);
        sh.setAttribute('transform', `translate(${(q.x - base.x).toFixed(1)} 0)`);
      });
    },
  };
}

// ------------------------------------------------------------------ coat
// "One climbed into my coat."
export async function coat(svg, ctx) {
  const cam = aim(3300, HIP[0] - 0.12, -D + 0.62, HIP[1], 1000, 560);
  const S = pitScene(svg, cam, { fence: false, twigs: false });
  const { defs, mid, front } = S;
  const [nx, ny] = cam.p(HIP[0], -D, HIP[1]), ns = charScale(cam, HIP[1]);
  const n = narrator(defs, { seed: 17 });
  const inCoat = puppy(defs, { view: 'front', pose: 'sit', seed: 2 });
  n.slots.chest.appendChild(inCoat.root);
  mid.appendChild(n.root);
  const climber = puppy(defs, { view: 'side', pose: 'beg', seed: 2 });
  front.appendChild(climber.root);
  const tIn = ctx.W(14, 'coat') - ctx.shot.start + 0.1;
  return {
    update(t) {
      S.world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.0], [ctx.dur, 1.04, 'sine']])));
      const tt = on2(t);
      const inside = tt >= tIn;
      n.set({ ...SITPOSE, x: nx, y: ny, scale: ns, chestPup: inside, eyes: (tt > 1.6 && tt < 1.75) ? 'closed' : 'open', head: -1 - (inside ? 3 : 0) });
      // climber scrambles up his front from his lap, then vanishes into the coat
      const up = kf(tt, [[0, 0], [tIn - 0.1, 1, 'io']]);
      const scr = Math.sin(tt * 20) * 4 * (1 - up);
      climber.set({ x: nx - 118 * ns + up * 40 * ns, y: ny - 30 * ns - up * 125 * ns + scr, scale: ns * 0.95, flip: 1, headRot: -10 + scr, rot: 14 - up * 20, wag: Math.sin(tt * 14) * 30 });
      climber.root.style.display = inside ? 'none' : '';
      inCoat.root.style.display = inside ? '' : 'none';
      // head pops out of the coat, looks about, settles
      const pop = kf(tt, [[tIn, 0], [tIn + 0.35, 1, 'back']]);
      inCoat.set({ x: 10, y: 52 + (1 - pop) * 40, scale: 0.9, headRot: -10 + Math.sin(tt * 3) * 4, look: kf(tt, [[tIn + 0.5, 2.4], [tIn + 0.9, -1.5, 'io']]), lookY: -1 });
    },
  };
}

// ------------------------------------------------------------------ shoe
// "Another removed my left shoe."
async function shoeShot(svg, ctx) {
  // his feet: legs out to the left (he faces left); the near foot is his left
  const cam = aim(3000, HIP[0] - 0.95, -D + 0.12, HIP[1] - 0.05, 900, 620);
  const S = pitScene(svg, cam, { fence: false, twigs: false });
  const { defs, back, mid, front } = S;
  const [nx, ny] = cam.p(HIP[0], -D, HIP[1]), ns = charScale(cam, HIP[1]);
  const n = narrator(defs, { seed: 17 });
  mid.appendChild(n.root);
  const thief = puppy(defs, { view: 'side', pose: 'stand', seed: 5 });
  const theShoe = shoe(defs);
  const shoeG = g({}, theShoe);
  front.append(thief.root, shoeG);
  const tOff = ctx.W(15, 'shoe') - ctx.shot.start;
  // where his left foot is (screen), from the rig: legs straight out, foot at ~ hip + 370 units along -x
  const footX = nx - 372 * ns, footY = ny - 30 * ns;
  return {
    update(t) {
      S.world.setAttribute('transform', camTransform(960, 560, kf(t, [[0, 1.0], [ctx.dur, 1.03, 'sine']])));
      const tt = on2(t);
      const off = tt >= tOff;
      // two tugs before it comes off (the foot jerks with each)
      const tug = tt < tOff ? Math.max(0, Math.sin((tt - 0.4) * 9)) * win(tt, 0.4, 0.6) : 0;
      n.set({ ...SITPOSE, x: nx, y: ny, scale: ns, shoeless: off, footN: -8 - tug * 6, thighN: -84 + tug * 1.5 });
      // thief: comes in from the left, grabs the heel, leans back, then trots off left with the prize
      const arrive = kf(tt, [[0, -260], [0.45, 0, 'out']]);
      const away = off ? kf(tt, [[tOff + 0.15, 0], [ctx.dur, -900, 'in']]) : 0;
      const lean = off ? 0 : tug * 22;
      const px = footX - 120 * ns + arrive + away - lean;
      thief.set({ x: px, y: footY + 150 * ns, scale: ns * 1.05, flip: off ? -1 : 1, headRot: off ? -6 : 18 - tug * 8, rot: off ? 0 : -tug * 6,
        trot: (tt < 0.45 || off) ? tt * 3.2 : null, wag: Math.sin(tt * 16) * 30 });
      if (off) {
        // shoe in its mouth, heel first
        shoeG.style.display = '';
        shoeG.setAttribute('transform', `translate(${px - 58 * ns * 1.05} ${footY + 150 * ns - 64 * ns * 1.05}) scale(${-ns * 0.95} ${ns * 0.95}) rotate(-20)`);
      } else shoeG.style.display = 'none';
    },
  };
}
export { shoeShot as shoe };

// ------------------------------------------------------------------ onHead
// "A third sat on my head and began barking directly into the future."
// Low, close, looking up: his profile at the bottom of the frame, the sky above.
function lowHead(svg, ctx, mode = 'overcast') {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  world.appendChild(sky(defs, { seed: 30, ...SKY[mode] }));
  // the far wall's top and the rim, behind his head
  const rimY = 350;
  const r = rng(12);
  const fr = [];
  for (let x = -300; x < 2200; x += 3 + r() * 4) {
    const h = 18 + r() * 46, lean = (r() - 0.5) * 24;
    fr.push(`M${(x - 3).toFixed(1)} ${rimY} Q${(x + lean * 0.5).toFixed(1)} ${rimY + h * 0.5} ${(x + lean).toFixed(1)} ${rimY + h} Q${(x + lean * 0.5 + 3).toFixed(1)} ${rimY + h * 0.4} ${(x + 3).toFixed(1)} ${rimY}Z`);
  }
  const roots = [];
  for (let i = 0; i < 40; i++) {
    const x = -300 + r() * 2500; let d = `M${x} ${rimY + 20}`, cx = x, cy = rimY + 20;
    for (let k = 0; k < 5; k++) { cx += (r() - 0.5) * 20; cy += 10 + r() * 30; d += ` L${cx.toFixed(0)} ${cy.toFixed(0)}`; }
    roots.push(d);
  }
  const wall = g({},
    el('rect', { x: -400, y: rimY, width: 2800, height: 1200, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#4b3c2e'], [0.25, '#5d4938'], [1, '#2a2019']]) }),
    el('rect', { x: -400, y: rimY, width: 2800, height: 60, fill: '#3a3526' }),
    el('path', { d: roots.join(''), stroke: '#8a765c', 'stroke-width': 2.2, fill: 'none', opacity: 0.7 }),
    el('path', { d: fr.join(''), fill: '#58623f' }),
    el('rect', { x: -400, y: rimY - 4, width: 2800, height: 8, fill: '#5d6843' }));
  const tex = el('filter', { id: 'lhTex' + ctx.shot.id, x: 0, y: 0, width: 1, height: 1 },
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.03 0.012', numOctaves: 3, seed: 6, result: 'n' }),
    el('feColorMatrix', { in: 'n', type: 'matrix', values: '0.44 0 0 0 0.28 0.44 0 0 0 0.28 0.44 0 0 0 0.28 0 0 0 0 1', result: 'm' }),
    el('feBlend', { in: 'm', in2: 'SourceGraphic', mode: 'soft-light', result: 'b' }),
    el('feComposite', { in: 'b', in2: 'SourceGraphic', operator: 'in' }));
  defs.appendChild(tex);
  world.appendChild(g({ filter: `url(#lhTex${ctx.shot.id})` }, wall));
  world.appendChild(el('rect', { x: -400, y: rimY, width: 2800, height: 900, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#0f0a08', 0.4], [0.3, '#0f0a08', 0], [1, '#0f0a08', 0.25]]) }));
  const n = narrator(defs, { seed: 17 });
  world.appendChild(n.root);
  return { defs, root, world, n };
}

export async function onHead(svg, ctx) {
  const S = lowHead(svg, ctx);
  const { defs, world, n } = S;
  const hp = puppy(defs, { view: 'side', pose: 'sit', seed: 6, harold: true });   // Harold, as it turns out
  const climbing = puppy(defs, { view: 'side', pose: 'beg', seed: 6, harold: true });
  n.slots.head.appendChild(hp.root);
  world.appendChild(climbing.root);
  const tSat = ctx.W(16, 'sat') - ctx.shot.start;
  const tBark = ctx.W(16, 'barking') - ctx.shot.start;
  const beats = [0, 0.26, 0.5, 0.84, 1.1, 1.36, 1.7, 1.94, 2.2, 2.56].map(b => tBark + b);
  return {
    update(t) {
      world.setAttribute('transform', camTransform(1000, 540, kf(t, [[0, 1.0], [ctx.dur, 1.05, 'sine']])));
      const tt = on2(t);
      const seated = tt >= tSat;
      n.set({ ...SITPOSE, x: 1130, y: 1640, scale: 3.3, head: -1, eyes: (tt > 3.2 && tt < 3.35) ? 'closed' : 'open', chestPup: true });
      // the climber scrambles up his back, then becomes the one sitting on his head
      const up = kf(tt, [[0.1, 0], [tSat, 1, 'io']]);
      climbing.set({ x: 1330 - up * 120, y: 1320 - up * 720 + Math.sin(tt * 20) * 5 * (1 - up), scale: 2.0, flip: -1, headRot: -12, rot: -18 + up * 20, wag: Math.sin(tt * 14) * 24 });
      climbing.root.style.display = seated ? 'none' : '';
      hp.root.style.display = seated ? '' : 'none';
      const barking = beats.some(b => tt >= b && tt < b + 0.14);
      const lift = kf(tt, [[tBark - 0.4, 0], [tBark, 1, 'out']]);
      hp.set({ x: 4, y: 12, scale: 0.95, flip: 1, headRot: -8 - lift * 34 - (barking ? 3 : 0), bark: barking, earRot: barking ? 16 : 6, wag: Math.sin(tt * 10) * 14 });
    },
  };
}

// "I said, 'No, Colin. I'm in a puppy pit.'"
export async function reply(svg, ctx) {
  const S = lowHead(svg, ctx);
  const { defs, world, n } = S;
  const hp = puppy(defs, { view: 'side', pose: 'sit', seed: 6, harold: true });
  n.slots.head.appendChild(hp.root);
  const words = ['no', 'colin', "i'm", 'in', 'a', 'puppy', 'pit'].map(w => [ctx.W(19, w) - ctx.shot.start, ctx.W(19, w, 'e') - ctx.shot.start]);
  return {
    update(t) {
      world.setAttribute('transform', camTransform(1000, 560, kf(t, [[0, 1.0], [ctx.dur, 1.04, 'sine']])));
      const tt = on2(t);
      const talking = words.some(([a, b]) => tt >= a && tt < Math.max(b, a + 0.12));
      const phase = Math.sin(tt * 26) > 0 ? 1 : 0.4;
      n.set({ ...SITPOSE, x: 1130, y: 1640, scale: 3.3, head: -16, talk: talking ? phase : 0, chestPup: true, brow: 1, shoeless: true, buttons: 4 });
      hp.set({ x: 4, y: 12, scale: 0.95, flip: 1, headRot: -30, earRot: 4, wag: Math.sin(tt * 3) * 6 });
    },
  };
}

// "I told her that, at my age, comedy was mostly a matter of losing balance in public."
export async function wisdom(svg, ctx) {
  const S = lowHead(svg, ctx, 'dusk');
  const { defs, root, world, n } = S;
  const hp = puppy(defs, { view: 'side', pose: 'lie', seed: 6, harold: true });   // asleep on his head now
  n.slots.head.appendChild(hp.root);
  // the ladder's rail behind him
  world.insertBefore(g({ transform: 'translate(420 1500) rotate(4) scale(1.6)' }, ladder(defs, { len: 3 })), n.root);
  root.appendChild(tint(defs, 'dusk'));
  const ws = ['told', 'her', 'that', 'at', 'my', 'age', 'comedy', 'was', 'mostly', 'a', 'matter', 'of', 'losing', 'balance', 'in', 'public', 'i']
    .map(w => { try { return [ctx.W(29, w) - ctx.shot.start, ctx.W(29, w, 'e') - ctx.shot.start]; } catch { return null; } }).filter(Boolean);
  return {
    update(t) {
      world.setAttribute('transform', camTransform(1040, 600, kf(t, [[0, 1.0], [ctx.dur, 1.12, 'sine']])));
      const tt = on2(t);
      const talking = ws.some(([a, b]) => tt >= a && tt < Math.max(b, a + 0.12));
      const phase = Math.sin(tt * 24) > 0 ? 1 : 0.35;
      n.set({ ...SITPOSE, x: 1130, y: 1640, scale: 3.3, head: -14, talk: talking ? phase : 0, chestPup: true, brow: 0,
        eyes: (tt > 2.4 && tt < 2.55) ? 'closed' : 'open' });
      hp.set({ x: 2, y: 8, scale: 0.85, flip: 1, headRot: 10, blink: true, wag: 0 });
    },
  };
}

// ------------------------------------------------------------------ notRope
// "Not a rope. Not a ladder. His phone." — he looks at us.
export async function notRope(svg, ctx) {
  const { defs, root } = stage(svg);
  const world = g({}); root.appendChild(world);
  world.appendChild(el('rect', { x: -400, y: -400, width: 2800, height: 2000, fill: linGrad(defs, 0, 0, 0, 1, [[0, '#6d5846'], [0.5, '#5a4636'], [1, '#2e241c']]) }));
  const tex = el('filter', { id: 'nrTex', x: 0, y: 0, width: 1, height: 1 },
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.02 0.008', numOctaves: 3, seed: 13, result: 'n' }),
    el('feColorMatrix', { in: 'n', type: 'matrix', values: '0.44 0 0 0 0.28 0.44 0 0 0 0.28 0.44 0 0 0 0.28 0 0 0 0 1', result: 'm' }),
    el('feBlend', { in: 'm', in2: 'SourceGraphic', mode: 'soft-light', result: 'b' }),
    el('feComposite', { in: 'b', in2: 'SourceGraphic', operator: 'in' }));
  defs.appendChild(tex);
  world.lastChild.setAttribute('filter', 'url(#nrTex)');
  const r = rng(22);
  const roots = [];
  for (let i = 0; i < 22; i++) { const x = r() * 1920; let d = `M${x} -20`, cx = x, cy = -20; for (let k = 0; k < 5; k++) { cx += (r() - 0.5) * 24; cy += 20 + r() * 40; d += ` L${cx.toFixed(0)} ${cy.toFixed(0)}`; } roots.push(d); }
  world.appendChild(el('path', { d: roots.join(''), stroke: '#8a765c', 'stroke-width': 2.4, fill: 'none', opacity: 0.6 }));
  const nf = narratorFront(defs, { seed: 73 });
  const hp = puppy(defs, { view: 'front', pose: 'sit', seed: 6, harold: true });
  const cp = puppy(defs, { view: 'front', pose: 'sit', seed: 2 });
  const flapTex = paintFilter(defs, { freq: [0.07, 0.012], strength: 0.2, tooth: 0.1, seed: 77 });
  const flap = g({ filter: flapTex },
    shape('M-46 2 C-30 10, -12 18, 0 22 C12 18, 30 10, 46 2 L48 96 L-48 96Z', P.coat, { r: { amp: 0.8, wl: 14, seed: 5 }, line: '#1f2626', lw: 1.4 }),
    el('path', { d: 'M0 22 L0 96', stroke: P.coatDark, 'stroke-width': 2.4, opacity: 0.8 }));
  const cpG = g({ transform: 'translate(960 800) scale(1.75)' }, g({ transform: 'translate(0 40)' }, cp.root), g({ transform: 'translate(0 -14)' }, flap));
  world.append(nf.root, cpG);
  const hpG = g({}, hp.root); world.appendChild(hpG);
  world.appendChild(el('rect', { x: -400, y: -400, width: 2800, height: 2000, fill: radGrad(defs, 0.5, 0.25, 0.75, [[0, '#f3e4c8', 0.1], [1, '#0a0705', 0.45]]) }));
  const b1 = ctx.W(22, 'not') - ctx.shot.start, b2 = ctx.W(23, 'not') - ctx.shot.start, b3 = ctx.W(24, 'his') - ctx.shot.start;
  return {
    update(t) {
      const z = step(t, [[0, 1.0], [b2, 1.06], [b3, 1.13]]);
      world.setAttribute('transform', camTransform(960, 470, z));
      const tt = on2(t);
      nf.set({ x: 960, y: 1620, scale: 1.75, tuft: false, nButtons: 5, look: [0, 0], brow: 0 });
      hpG.setAttribute('transform', 'translate(960 358)');
      hp.set({ x: 0, y: 0, scale: 1.55, headRot: 0, look: 0, lookY: 0, wag: Math.sin(tt * 2) * 5 });
      cp.set({ x: 0, y: 0, scale: 1.0, headRot: -4, look: 0, lookY: 0 });
    },
  };
}

// ------------------------------------------------------------------ twenty
// "For twenty minutes I remained down there, trying to maintain dignity while
// being climbed by creatures with the confidence of small landlords."
// Time-lapse: he never moves; the light goes; the puppies occupy him.
export async function twenty(svg, ctx) {
  const cam = camera(BASE);
  const { defs, root } = stage(svg);
  const L = inPitSet(defs, cam, { mode: 'overcast' });
  const world = g({}); root.appendChild(world);
  const skyDusk = sky(defs, { seed: 8, ...SKY.dusk });
  const skyLate = sky(defs, { seed: 8, ...SKY.late });
  world.append(L.sky, skyLate, skyDusk, L.twigs, L.fence, L.back, L.shade);
  const back = g({}), mid = g({}), front = g({});
  world.append(back, mid, front, L.rim);
  glassesOnFloor(back, cam, -0.35, 3.2);
  const [nx, ny] = cam.p(HIP[0], -D, HIP[1]), ns = charScale(cam, HIP[1]);
  const n = narrator(defs, { seed: 17 });
  mid.appendChild(n.root);
  const onHeadP = puppy(defs, { view: 'side', pose: 'sit', seed: 6, harold: true });
  const onHeadL = puppy(defs, { view: 'side', pose: 'lie', seed: 6, harold: true });
  n.slots.head.append(onHeadP.root, onHeadL.root);
  const inCoat = puppy(defs, { view: 'front', pose: 'sit', seed: 2 });
  n.slots.chest.appendChild(inCoat.root);
  // the other seven, re-arranged between jumps; each state lists [X, Z, view, pose, flip, headRot, extraY]
  const cast = [3, 7, 4, 1, 9, 5, 11].map((seed, i) => ({ seed, views: {} }));
  const STATES = [
    [[-1.45, 3.62, 'side', 'sit', 1, -10], [-0.9, 3.66, 'side', 'stand', 1, -14], [-0.35, 3.64, 'front', 'sit'], [0.15, 3.3, 'side', 'sit', 1, -18], [-1.15, 3.28, 'side', 'lie', 1, 0], [-0.6, 3.22, 'front', 'sit'], [-0.25, 2.86, 'side', 'sit', 1, -12]],
    [[-1.2, 3.6, 'side', 'lie', 1, 10], [0.2, 3.02, 'side', 'lie', -1, 12], [-0.1, 3.05, 'front', 'sit'], [0.45, 3.05, 'side', 'sit', -1, -6], [-0.8, 3.3, 'side', 'lie', -1, 8], [-1.5, 3.55, 'front', 'sit'], [0.7, 3.4, 'side', 'stand', -1, -4]],
    [[-0.05, 3.05, 'side', 'sit', -1, -4, 0], [0.22, 3.05, 'side', 'sit', -1, -6, 0], [0.48, 3.05, 'side', 'sit', -1, -2, 0], [-1.4, 3.6, 'side', 'lie', 1, 10], [-0.9, 3.4, 'side', 'lie', -1, 14], [0.75, 3.1, 'front', 'sit'], [-0.6, 3.66, 'side', 'sit', 1, -8]],
    [[-0.08, 3.04, 'front', 'sit', 1, 0, 0], [0.2, 3.04, 'front', 'sit', 1, 0, 0], [0.48, 3.04, 'front', 'sit', 1, 0, 0], [0.74, 3.08, 'side', 'sit', -1, -10], [-1.2, 3.6, 'side', 'lie', 1, 8], [-0.7, 3.5, 'side', 'lie', -1, 12], [-0.3, 3.62, 'side', 'sit', 1, -6]],
  ];
  // build every (view, pose) each puppy needs, show one at a time
  STATES.forEach(st => st.forEach(([X, Z, view, pose], i) => {
    const key = view + pose;
    if (!cast[i].views[key]) {
      const p = puppy(defs, { view, pose, seed: cast[i].seed });
      const sh = el('path', { d: ellipseD(0, 1, 36, 8), fill: '#0f0a08', opacity: 0.5 });
      const holder = g({}, sh, p.root);
      front.appendChild(holder);
      cast[i].views[key] = { p, holder, sh };
    }
  }));
  // light: overcast -> late afternoon -> dusk
  const late = tint(defs, 'late'), dusk = tint(defs, 'dusk');
  root.append(late, dusk);
  const cuts = [0, 2.3, 4.6, ctx.W(26, 'confidence') - ctx.shot.start - 0.35];
  return {
    update(t) {
      const tt = on2(t);
      const k = cuts.filter(c => t >= c).length - 1;
      world.setAttribute('transform', camTransform(1000, 560, 1.03));
      const lateA = kf(t, [[0, 0], [4.6, 1, 'lin'], [ctx.dur, 0.4]]), duskA = kf(t, [[2.3, 0], [ctx.dur, 1, 'lin']]);
      late.setAttribute('opacity', lateA); dusk.setAttribute('opacity', duskA);
      skyLate.setAttribute('opacity', lateA); skyDusk.setAttribute('opacity', duskA);
      // him: perfectly still, very upright
      n.set({ ...SITPOSE, x: nx, y: ny, scale: ns, lean: -3, head: -1, chestPup: true, armN: [-6, -66, -14, 1], armF: [-2, -68, 0, 1],
        eyes: (t % 2.7) > 2.58 ? 'closed' : 'open', brow: k >= 3 ? -1 : 0, shoeless: true, buttons: 5 - k });
      onHeadP.root.style.display = k === 1 ? 'none' : '';
      onHeadL.root.style.display = k === 1 ? '' : 'none';
      onHeadP.set({ x: 4, y: 12, scale: 0.92, flip: 1, headRot: k === 3 ? -18 : -6, wag: Math.sin(tt * 3) * 6 });
      onHeadL.set({ x: 2, y: 8, scale: 0.85, flip: 1, headRot: 10, blink: true });
      inCoat.set({ x: 10, y: 52, scale: 0.9, headRot: -10, look: k === 3 ? 0 : 2.4, lookY: -1, blink: k === 1 });
      STATES[k].forEach(([X, Z, view, pose, flip = 1, hr = 0, lift], i) => {
        Object.entries(cast[i].views).forEach(([key, v]) => v.holder.style.display = key === view + pose ? '' : 'none');
        const v = cast[i].views[view + pose];
        const [x, y0] = cam.p(X, -D, Z), sc = charScale(cam, Z);
        // "extraY" places a puppy up on his legs / lap
        const y = lift === undefined ? y0 : ny - 58 * ns;
        v.sh.setAttribute('transform', `translate(${x} ${y}) scale(${sc})`);
        v.sh.style.display = lift === undefined ? '' : 'none';
        const q = { x, y, scale: sc * (lift === undefined ? 1 : 0.95), headRot: hr, wag: Math.sin(tt * 5 + i) * (pose === 'lie' ? 2 : 10), blink: pose === 'lie' };
        if (view === 'side') q.flip = flip; else { q.look = k === 3 ? 0 : 2.2; q.lookY = 0; }
        v.p.set(q);
      });
    },
  };
}

// ------------------------------------------------------------------ lifted
// "They lifted me out." — up the ladder, out of the top of the frame
export async function lifted(svg, ctx) {
  const cam = camera({ ...BASE, cx: 900, cy: 700 });
  const S = pitScene(svg, cam, { mode: 'dusk', fence: true });
  const { defs, root, back, mid, front } = S;
  const [lx, ly] = cam.p(0.2, -D, 3.72), lsc = charScale(cam, 3.72);
  back.appendChild(g({ transform: `translate(${lx} ${ly}) rotate(-6) scale(${lsc})` }, ladder(defs, { len: 2.4 })));
  const n = narrator(defs, { seed: 17 });
  mid.appendChild(n.root);
  const pups = [
    addPup(defs, front, cam, -1.1, 3.3, 'side', 'sit', 3, { headRot: -34 }),
    addPup(defs, front, cam, -0.55, 3.25, 'front', 'sit', 4, { look: 1.5, lookY: -2.6 }),
    addPup(defs, front, cam, 0.7, 3.3, 'side', 'sit', 9, { headRot: -36, flip: -1 }),
  ];
  root.appendChild(tint(defs, 'dusk'));
  return {
    update(t) {
      const tt = on2(t);
      const climb = kf(tt, [[0, 0], [ctx.dur, 1, 'in']]);
      const ph = tt * 3.2;
      const [x, y] = cam.p(0.2, -D + climb * 2.2, 3.55);
      n.set({ x, y, scale: lsc, flip: -1, lean: 4, head: -10, shoeless: true, tuft: true, buttons: 2,
        thighN: -40 + Math.sin(ph * Math.PI) * 30, shinN: 50 - Math.sin(ph * Math.PI) * 30, footN: -10,
        thighF: -40 - Math.sin(ph * Math.PI) * 30, shinF: 50 + Math.sin(ph * Math.PI) * 30, footF: -10,
        armN: [-160, 10, 0, 1], armF: [-150, 0, 0, 1] });
      pups.forEach(({ p, base }, i) => p.set({ ...base, wag: Math.sin(tt * 8 + i) * 14 }));
    },
  };
}
