// Inside the pit.
import { el, g, T, mix, blurFilter, linGrad, radGrad, ellipseD, circleD, rng, lerp, clamp, shape, paintFilter } from '../lib/core.js';
import { kf, on2, win, wob, step, camTransform, EASE } from '../lib/anim.js';
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
  // the grass fringe of the far rim goes behind everyone: anything in the pit is nearer than the far wall
  world.append(el('rect', { x: -3000, y: cam.p(0, -D, 2.4)[1] - 2, width: 8000, height: 4000, fill: '#30261e' }), L.back, L.shade, L.rim);
  const back = g({}), mid = g({}), front = g({});
  world.append(back, mid, front);
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
// "One climbed into my coat." Up on his lap, paws on his chest, a sniff at the
// front of the coat, then nose-first in under the lapel, tail last. The coat
// heaves while it turns round in there, and a head comes out.
export async function coat(svg, ctx) {
  const cam = aim(3300, HIP[0] - 0.12, -D + 0.62, HIP[1], 1000, 560);
  const S = pitScene(svg, cam, { fence: false, twigs: false });
  const { defs, world, mid, front } = S;
  const [nx, ny] = cam.p(HIP[0], -D, HIP[1]), ns = charScale(cam, HIP[1]);
  const n = narrator(defs, { seed: 17 });
  const inCoat = puppy(defs, { view: 'front', pose: 'sit', seed: 2 });
  n.slots.chest.appendChild(inCoat.root);
  mid.appendChild(n.root);
  const climber = puppy(defs, { view: 'side', pose: 'beg', seed: 2 });
  const climbG = g({}, climber.root);
  // the coat heaving while the puppy turns round inside it
  const lump = shape(ellipseD(0, 0, 16, 26), P.coat, { r: { amp: 0.6, wl: 14, seed: 31 }, line: '#1f2626', lw: 1.6 });
  const lumpG = g({ style: 'display:none' }, g({ filter: paintFilter(defs, { freq: [0.07, 0.012], strength: 0.2, tooth: 0.1, seed: 17 }) }, lump));
  front.append(climbG, lumpG);
  const tDive = ctx.W(14, 'climbed') - ctx.shot.start + 0.12;  // nose goes in
  const tGone = tDive + 0.46;                                   // tail's in
  const tIn = ctx.W(14, 'coat') - ctx.shot.start + 0.1;        // head out
  const pose = tt => ({ ...SITPOSE, x: nx, y: ny, scale: ns, chestPup: tt >= tIn, eyes: (tt > tGone + 0.05 && tt < tGone + 0.2) ? 'closed' : 'open', head: -1 - (tt >= tIn ? 3 : 0) });
  // the front edge of his coat, lap to chest, in world space
  n.set(pose(0));
  const rel = e => world.getCTM().inverse().multiply(e.getCTM());
  const M = rel(n.torsoG);
  const edge = [[60, 22], [57, -10], [58, -50], [55, -100], [47, -145], [40, -165]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(M));
  const [top, bot] = [edge[edge.length - 1], edge[0]];
  // outside the coat: in front of that edge, and anything below it (his lap)
  const outD = `M-5000 -5000 L${top.x} -5000 ` + edge.slice().reverse().map(p => `L${p.x.toFixed(1)} ${p.y.toFixed(1)} `).join('') + `L5000 ${bot.y} L5000 5000 L-5000 5000Z`;
  defs.appendChild(el('clipPath', { id: 'coatOutside' }, el('path', { d: outD })));
  const along = u => {
    const k = Math.min(edge.length - 2, Math.floor(u * (edge.length - 1))), f = u * (edge.length - 1) - k;
    const a = edge[k], b = edge[k + 1];
    return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), ang: Math.atan2(b.x - a.x, -(b.y - a.y)) * 180 / Math.PI };
  };
  const chest = along(0.72);                   // where it goes in (and comes out)
  const s = ns * 0.95;
  const lapY = ny - 58 * ns;                   // top of his thighs, under the coat skirt
  return {
    update(t) {
      S.world.setAttribute('transform', camTransform(960, 540, kf(t, [[0, 1.0], [ctx.dur, 1.04, 'sine']])));
      const tt = on2(t);
      n.set(pose(tt));
      // standing on his lap, paws up on his chest; then up and in, head first
      const dive = kf(tt, [[tDive, 0], [tGone, 1, 'in']]);
      const sniff = tt < tDive ? Math.sin(tt * 19) * 2.5 : 0;
      const bob = tt < tDive ? Math.abs(Math.sin(tt * 7)) * 4 * ns : 0;
      const px = chest.x - 40 * s + dive * 62 * ns, py = lapY - bob - dive * 70 * ns;
      climber.set({ x: px, y: py, scale: s, flip: 1, rot: 4 + dive * 26, headRot: -4 + sniff + dive * 10, wag: Math.sin(tt * (tt < tDive ? 14 : 26)) * (18 + dive * 14) });
      if (tt >= tDive) climbG.setAttribute('clip-path', 'url(#coatOutside)'); else climbG.removeAttribute('clip-path');
      climbG.style.display = tt < tGone ? '' : 'none';
      // the coat heaves and wobbles at his chest while it turns round in there
      const wr = tt >= tGone - 0.04 && tt < tIn + 0.05;
      lumpG.style.display = wr ? '' : 'none';
      const w = Math.sin((tt - tGone) * 34);
      lumpG.setAttribute('transform', `translate(${chest.x} ${chest.y + w * 3 * ns}) rotate(${chest.ang + w * 8}) translate(${-6 * ns} ${8 * ns}) scale(${ns * (0.85 + Math.abs(w) * 0.08)} ${ns * 0.9})`);
      // head pops out of the coat, looks about, settles
      inCoat.root.style.display = tt >= tIn ? '' : 'none';
      const pop = kf(tt, [[tIn, 0], [tIn + 0.35, 1, 'back']]);
      inCoat.set({ x: 10, y: 52 + (1 - pop) * 40, scale: 0.9, headRot: -10 + Math.sin(tt * 3) * 4, look: kf(tt, [[tIn + 0.5, 2.4], [tIn + 0.9, -1.5, 'io']]), lookY: -1 });
    },
  };
}

// ------------------------------------------------------------------ shoe
// "Another removed my left shoe." A small tug-of-war: the puppy has the toe of
// the shoe; three tugs, the foot pointing a little further each time, the heel
// slipping, and on "shoe" it comes away and the puppy sits down hard with it.
async function shoeShot(svg, ctx) {
  // his feet: legs out to the left (he faces left); the near foot is his left
  const cam = aim(3000, HIP[0] - 0.95, -D + 0.12, HIP[1] - 0.05, 900, 620);
  const S = pitScene(svg, cam, { fence: false, twigs: false });
  const { defs, world, mid, front } = S;
  const [nx, ny] = cam.p(HIP[0], -D, HIP[1]), ns = charScale(cam, HIP[1]);
  const n = narrator(defs, { seed: 17 });
  mid.appendChild(n.root);
  const thief = puppy(defs, { view: 'side', pose: 'stand', seed: 5 });
  const ps = ns * 1.05;
  const shoeG = g({}, shoe(defs));
  const pupShadow = el('path', { d: ellipseD(0, 0, 38 * ps, 7 * ps), fill: '#0f0a08', opacity: 0.45 });
  front.append(pupShadow, shoeG, thief.root);
  const floorY = ny;
  const T0 = ctx.W(15, 'shoe') - ctx.shot.start;          // it comes off on "shoe"
  const TUGS = [[0.2, 0.52, 0.4], [0.62, 0.98, 0.7], [1.06, T0, 1]];
  const rel = e => world.getCTM().inverse().multiply(e.getCTM());
  const mat = m => `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(v => +v.toFixed(4)).join(' ')})`;
  const TOE = new DOMPoint(56, 4);        // grip point on the shoe (ankle space)
  const MOUTH = new DOMPoint(42, -19);    // grip point in the puppy's head space
  // how hard it is pulling (0..1) and how far the shoe has slid off the heel (ankle units)
  function tug(tt) {
    let pull = 0;
    TUGS.forEach(([a, b, k], i) => {
      const u = win(tt, a, b);
      if (u > 0 && u < 1) pull = Math.max(pull, (i < 2 ? Math.pow(Math.sin(u * Math.PI), 0.8) : EASE.in(u)) * k);
    });
    const slide = kf(tt, [[0.3, 0], [0.45, 4, 'out'], [0.75, 5], [0.9, 16, 'out'], [1.1, 17], [T0, 44, 'in']]);
    return { pull, slide };
  }
  function footPose(tt) {
    const { pull, slide } = tug(tt);
    // after it lets go the foot springs back and wiggles its toes in the sock
    const after = tt > T0 ? Math.exp(-(tt - T0) * 7) * Math.sin((tt - T0) * 26) * 10 : 0;
    const footN = tt < T0 ? -8 + pull * 36 + (slide > 10 ? 6 : 0) : -8 + after;
    n.set({ ...SITPOSE, x: nx, y: ny, scale: ns, shoeless: true, footN, thighN: -84 + pull * 1.8, shinN: 2 - pull * 1.2,
      head: -1 + (tt > T0 ? kf(tt, [[T0, 0], [T0 + 0.3, 6, 'out']]) : 0), brow: tt > T0 + 0.1 ? 1 : 0 });
    return { pull, slide };
  }
  // feet on the floor, leaning back as it pulls; the neck bends and the body
  // slides so that its mouth stays on the toe of the shoe
  const pupFloor = floorY + 10;
  function gripPup(tt, pull, toe) {
    const q = { x: toe.x - 70 * ps, y: pupFloor, scale: ps, flip: 1, rot: 5 * pull, headRot: 20, wag: Math.sin(tt * 16) * 26, earRot: pull * 10 };
    for (let k = 0; k < 6; k++) {
      thief.set(q);
      const piv = new DOMPoint(0, 0).matrixTransform(rel(thief.headRot));
      const m = MOUTH.matrixTransform(rel(thief.headRot));
      const L = Math.hypot(m.x - piv.x, m.y - piv.y);
      q.headRot = clamp(q.headRot + (toe.y - m.y) / (L * Math.PI / 180), -45, 62);
      q.x += toe.x - m.x;
    }
    q.headRot += Math.sin(tt * 30) * 1.5 * pull;
    thief.set(q);
    return q;
  }
  const shoeAt = slide => rel(n.legN.ankle).translate(slide, -slide * 0.08).rotate(slide * 0.35);
  // the shoe's pose inside the puppy's head at the moment it comes away
  footPose(T0 - 1e-3);
  const { slide: s0 } = tug(T0 - 1e-3);
  const toe0 = TOE.matrixTransform(shoeAt(s0));
  const q0 = gripPup(T0, 1, toe0);
  const inMouth = rel(thief.headRot).inverse().multiply(shoeAt(s0));
  const px0 = q0.x, py0 = q0.y, hr0 = q0.headRot;
  thief.headRot.insertBefore(g({ class: 'carried' }), thief.headRot.firstChild);
  const carried = thief.headRot.firstChild;
  return {
    update(t) {
      S.world.setAttribute('transform', camTransform(960, 560, kf(t, [[0, 1.0], [ctx.dur, 1.03, 'sine']])));
      const tt = on2(t);
      const { pull, slide } = footPose(tt);
      if (tt < T0) {
        const toe = TOE.matrixTransform(shoeAt(slide));
        const px = gripPup(tt, pull, toe).x;
        if (shoeG.parentNode !== front) front.insertBefore(shoeG, thief.root);
        shoeG.setAttribute('transform', mat(shoeAt(slide)));
        pupShadow.setAttribute('transform', `translate(${px} ${floorY})`);
      } else {
        // lands on its bottom, shakes the prize, turns, and trots off with it
        const dt = tt - T0;
        const recoil = kf(dt, [[0, 0], [0.16, 1, 'out']]);
        const turned = dt > 0.42;
        const away = turned ? EASE.in(win(dt, 0.42, 1.1)) * 900 : 0;
        const px = px0 - recoil * 34 * ps - away, py = py0 - (turned ? Math.abs(Math.sin(dt * 18)) * 3 * ps : 0);
        const shake = dt > 0.16 && dt < 0.42 ? Math.sin(dt * 55) * 9 : 0;
        const settle = kf(dt, [[0, hr0], [0.3, -2, 'out']]);
        thief.set({ x: px, y: py, scale: ps, flip: turned ? -1 : 1, rot: turned ? 0 : lerp(5, -14, recoil) * (1 - win(dt, 0.25, 0.42)),
          headRot: turned ? -2 : settle + shake, wag: Math.sin(tt * 18) * 30, trot: turned ? tt * 3.4 : null, earRot: 8 });
        if (shoeG.parentNode !== carried) carried.appendChild(shoeG);
        // held by the toe, it swings down to dangle from the mouth (and sways as it trots)
        const swing = kf(dt, [[0, 0], [0.32, 1, 'back']]) * 128 + (turned ? Math.sin(dt * 18) * 6 : 0);
        shoeG.setAttribute('transform', mat(new DOMMatrix().translate(MOUTH.x, MOUTH.y).rotate(swing).translate(-MOUTH.x, -MOUTH.y).multiply(inMouth)));
        pupShadow.setAttribute('transform', `translate(${px} ${floorY})`);
      }
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
  // the climber lives in the same head slot at the same scale, so it can't change size on arrival
  const climbing = puppy(defs, { view: 'side', pose: 'beg', seed: 6, harold: true });
  n.slots.head.append(climbing.root, hp.root);
  const tSat = ctx.W(16, 'sat') - ctx.shot.start;
  const tBark = ctx.W(16, 'barking') - ctx.shot.start;
  const beats = [0, 0.26, 0.5, 0.84, 1.1, 1.36, 1.7, 1.94, 2.2, 2.56].map(b => tBark + b);
  return {
    update(t) {
      world.setAttribute('transform', camTransform(1000, 540, kf(t, [[0, 1.0], [ctx.dur, 1.05, 'sine']])));
      const tt = on2(t);
      const seated = tt >= tSat;
      n.set({ ...SITPOSE, x: 1130, y: 1640, scale: 3.3, head: -1, eyes: (tt > 3.2 && tt < 3.35) ? 'closed' : 'open', chestPup: true });
      // the climber scrambles up the back of his coat and over his head (slot units:
      // +x is forward, toward his face; +y is down), then settles as the one sitting there
      const up = kf(tt, [[0, 0], [tSat - 0.12, 1, 'io']]);
      const scr = Math.sin(tt * 20) * 3 * (1 - up);
      climbing.set({ x: lerp(-58, 2, up), y: lerp(215, 14, up) + scr, scale: 0.95, flip: 1, headRot: lerp(-24, -6, up) + scr, rot: lerp(-30, -8, up), wag: Math.sin(tt * 14) * 24 });
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
  world.append(L.sky, skyLate, skyDusk, L.twigs, L.fence, L.back, L.shade, L.rim);
  const back = g({}), mid = g({}), front = g({});
  world.append(back, mid, front);
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
  const cuts = [0, 1.6, ctx.W(26, 'climbed') - ctx.shot.start - 0.1, ctx.W(26, 'confidence') - ctx.shot.start - 0.35];
  return {
    update(t) {
      const tt = on2(t);
      const k = cuts.filter(c => t >= c).length - 1;
      world.setAttribute('transform', camTransform(1000, 560, 1.03));
      const lateA = kf(t, [[0, 0.15], [cuts[2], 1, 'lin'], [ctx.dur, 0.4]]), duskA = kf(t, [[cuts[1], 0], [ctx.dur, 1, 'lin']]);
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
