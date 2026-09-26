// Looking straight down into the pit.
import { el, g, T, blurFilter, lerp } from '../lib/core.js';
import { kf, on2, win } from '../lib/anim.js';
import { stage, topPitSet, tint } from './common.js';
import { puppy } from '../chars/puppy.js';
import { shoeTop } from '../props/shoe.js';

const K = 1.75; // puppy scale in the top views
// a sleeping heap in the middle of the floor [X, G, rot]; index 4 is Harold
const HEAP = [
  [-0.3, 0.3, -35], [0.08, 0.38, 15], [0.44, 0.2, 55],
  [-0.48, -0.04, -75], [-0.04, 0.02, 5], [0.38, -0.2, 100],
  [-0.24, -0.4, -130], [0.14, -0.46, 165], [-0.62, 0.44, -20],
];
// present day: eight of them (Harold has a home now), gathered below him
const GATHER = [
  [-0.46, 0.36, -6], [-0.04, 0.44, 4], [0.38, 0.34, 8],
  [-0.62, -0.02, -8], [-0.22, 0.04, 2], [0.18, -0.02, -4], [0.58, -0.06, 6],
  [-0.06, -0.4, 0],
];

function cast(set, defs, layout, { harold = 4, seedOff = 0 } = {}) {
  const pups = [];
  const order = layout.map((v, i) => [v, i]).sort((a, b) => b[0][1] - a[0][1]);
  order.forEach(([[X, G, rot], i]) => {
    const p = puppy(defs, { view: 'top', seed: i + 1 + seedOff, harold: i === harold });
    const [x, y, sc] = set.floorAt(X, G);
    const sh = el('ellipse', { rx: 34 * sc * K, ry: 42 * sc * K, fill: '#0e0a07', opacity: 0.32, filter: blurFilter(defs, 6) });
    set.cast.appendChild(sh);
    set.cast.appendChild(p.root);
    pups.push({ p, i, x, y, sc: sc * K, rot, sh, X, G });
  });
  return pups;
}
const place = (q, x, y, rot) => { q.sh.setAttribute('cx', x); q.sh.setAttribute('cy', y + 8 * q.sc); q.sh.setAttribute('transform', `rotate(${rot} ${x} ${y})`); };

// "Not a metaphorical pit. Not a difficult period in my life." — descending into the dark
export async function abyss(svg, ctx) {
  const { defs, root } = stage(svg);
  const set = topPitSet(defs, { mode: 'golden', cordonOn: true, seed: 5 });
  root.appendChild(set.root);
  root.appendChild(tint(defs, 'golden', { sun: [-300, 300] }));
  const dark = el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#050303', opacity: 0 });
  root.appendChild(dark);
  return {
    update(t) {
      set.update(kf(t, [[0, 7.0], [ctx.dur, 0.3, 'io']]));
      dark.setAttribute('opacity', kf(t, [[0, 0], [ctx.dur * 0.45, 0.18, 'in'], [ctx.dur - 0.5, 0.97, 'io'], [ctx.dur, 1]]));
    },
  };
}

// "An actual hole in the ground, containing puppies. There were nine of them, all golden and enthusiastic,"
export async function reveal(svg, ctx) {
  const { defs, root } = stage(svg);
  const set = topPitSet(defs, { mode: 'overcast', seed: 7 });
  const pups = cast(set, defs, HEAP);
  root.appendChild(set.root);
  const black = el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#050303' });
  root.appendChild(black);
  const wake = ctx.W(3, 'puppies') - ctx.shot.start;
  const keen = ctx.W(4, 'golden') - ctx.shot.start;
  return {
    update(t) {
      black.setAttribute('opacity', kf(t, [[0, 1], [0.7, 0, 'out']]));
      set.update(kf(t, [[0, 2.6], [ctx.dur, 1.9, 'sine']]));
      const tt = on2(t);
      pups.forEach((q, j) => {
        const { p, i, x, y, sc, rot } = q;
        const tw = wake + (j % 3) * 0.08 + Math.floor(j / 3) * 0.06;
        const awake = tt >= tw;
        const lift = awake ? kf(tt, [[tw, 0], [tw + 0.25, 1, 'out']]) : 0;
        const ex = win(tt, keen, keen + 0.6);
        const hop = ex * Math.max(0, Math.sin(tt * 9 + i * 1.7)) * 5 * (i % 2);
        // once awake they turn their faces up to us (and straighten a little)
        const r = awake ? lerp(rot, rot * 0.35, lift) + ex * Math.sin(tt * 5 + i) * 5 : rot;
        p.set({ x, y: y - hop, scale: sc, rot: r, sleep: !awake, up: true, headS: 0.93 + lift * 0.07,
          wag: awake ? Math.sin(tt * (10 + ex * 12) + i) * (10 + ex * 22) : Math.sin(tt * 0.8 + i) * 3, earRot: ex * Math.sin(tt * 9 + i) * 6 });
        place(q, x, y - hop, r);
      });
    },
  };
}

// "The puppies were unharmed."
export async function unharmed(svg, ctx) {
  const { defs, root } = stage(svg);
  const set = topPitSet(defs, { mode: 'dusk', seed: 9 });
  const pups = cast(set, defs, HEAP);
  const chew = pups.find(q => q.i === 7);
  const a = (chew.rot + 20) * Math.PI / 180;
  const shoeG = g({ transform: `translate(${chew.x + Math.sin(a) * 66 * chew.sc} ${chew.y - Math.cos(a) * 66 * chew.sc}) rotate(${chew.rot + 20 + 90}) scale(${chew.sc * 0.85})` }, shoeTop(defs));
  set.cast.insertBefore(shoeG, chew.p.root);
  root.appendChild(set.root);
  root.appendChild(tint(defs, 'dusk'));
  return {
    update(t) {
      set.update(kf(t, [[0, 2.1], [ctx.dur, 2.0]]));
      const tt = on2(t);
      pups.forEach(q => {
        const { p, i, x, y, sc, rot } = q;
        const busy = q === chew;
        const r = busy ? rot + 20 : rot * 0.35 + Math.sin(tt * 0.9 + i) * 8;
        p.set({ x, y, scale: sc, rot: r, up: !busy, wag: Math.sin(tt * 8 + i * 2) * 14, look: Math.sin(tt * 1.3 + i) * 1.6, headRot: busy ? Math.sin(tt * 14) * 6 : 0 });
        place(q, x, y, r);
      });
    },
  };
}

// ---------------------------------------------------------------- present day
function presentPit(svg, ctx, seed, layout = GATHER) {
  const { defs, root } = stage(svg);
  const set = topPitSet(defs, { mode: 'golden', cordonOn: true, seed });
  const pups = cast(set, defs, layout, { harold: -1, seedOff: 20 });
  const shoeG = g({}, shoeTop(defs));
  set.cast.appendChild(shoeG);
  root.appendChild(set.root);
  root.appendChild(tint(defs, 'golden', { sun: [-300, 300] }));
  return { defs, root, set, pups, shoeG };
}
// playing: wandering, wrestling, one worrying the shoe (positions relative to GATHER homes)
function play(q, tt) {
  const r = q.i * 1.37;
  const dx = Math.sin(tt * 1.1 + r) * 70 + Math.sin(tt * 2.3 + r * 2) * 16;
  const dy = Math.cos(tt * 0.9 + r * 1.3) * 60;
  const vx = Math.cos(tt * 1.1 + r) * 77, vy = -Math.sin(tt * 0.9 + r * 1.3) * 54;
  return { x: q.x + dx, y: q.y + dy, rot: Math.atan2(vx, -vy) * 180 / Math.PI };
}
const LEAD = 5;
function carryShoe(shoeG, q, pos) {
  const a = pos.rot * Math.PI / 180;
  shoeG.setAttribute('transform', `translate(${pos.x + Math.sin(a) * 70 * q.sc} ${pos.y - Math.cos(a) * 70 * q.sc}) rotate(${pos.rot + 90}) scale(${q.sc * 0.8})`);
}

export async function watch(svg, ctx) {
  const { set, pups, shoeG } = presentPit(svg, ctx, 11);
  return {
    update(t) {
      set.update(kf(t, [[0, 2.5], [ctx.dur, 2.3, 'sine']]));
      const tt = on2(t) + 3;
      pups.forEach(q => {
        const pos = play(q, tt);
        q.p.set({ x: pos.x, y: pos.y, scale: q.sc, rot: pos.rot, up: false, wag: Math.sin(tt * 16 + q.i) * 26, headRot: Math.sin(tt * 7 + q.i) * 10 });
        place(q, pos.x, pos.y, pos.rot);
        if (q.i === LEAD) carryShoe(shoeG, q, pos);
      });
    },
  };
}

// "They remember me. Whenever I arrive, they look up with that same bright expression."
export async function remember(svg, ctx) {
  const { set, pups, shoeG } = presentPit(svg, ctx, 11);
  const freeze = ctx.W(40, 'remember') - ctx.shot.start;
  const bright = ctx.W(41, 'bright') - ctx.shot.start;
  const cont = ctx.shot.start - (ctx.W(39, 'and') - 0.21) + 3; // continue the play clock from "watch"
  return {
    update(t) {
      set.update(kf(t, [[0, 2.3], [freeze + 0.4, 2.3], [ctx.dur, 1.35, 'io']]));
      const tt = on2(t);
      pups.forEach((q, j) => {
        const tf = freeze + (j % 3) * 0.05;
        const frozen = play(q, Math.min(tt, tf) + cont);
        // after they look up, they shuffle in together beneath him
        const u = kf(tt, [[tf + 0.5, 0], [tf + 2.6, 1, 'io']]);
        const step = Math.floor(u * 6) / 6;
        const x = lerp(frozen.x, q.x, step), y = lerp(frozen.y, q.y, step);
        const up = tt >= tf;
        const rot = up ? lerp(frozen.rot, q.rot, Math.min(1, u * 1.5)) : frozen.rot;
        q.p.set({ x, y: y - (up && u > 0 && u < 1 ? Math.abs(Math.sin(tt * 14 + j)) * 3 : 0), scale: q.sc, rot, up,
          wag: up ? Math.sin(tt * 3 + q.i) * 4 : Math.sin(tt * 16 + q.i) * 26, headRot: up ? 0 : Math.sin(tt * 7 + q.i) * 10,
          shine: tt >= bright + (j % 4) * 0.07 });
        place(q, x, y, rot);
        if (q.i === LEAD) { if (!up) carryShoe(shoeG, q, frozen); else if (tt < tf + 0.1) carryShoe(shoeG, q, frozen); }
      });
    },
  };
}

// "Recognition."
export async function recognition(svg, ctx) {
  const { set, pups, shoeG } = presentPit(svg, ctx, 11);
  shoeG.setAttribute('transform', 'translate(-9999 0)');
  return {
    update(t) {
      set.update(kf(t, [[0, 0.62], [ctx.dur, 0.5, 'sine']]), [0, -30]);
      pups.forEach((q, j) => {
        q.p.set({ x: q.x, y: q.y, scale: q.sc, rot: q.rot, up: true, shine: true, wag: Math.sin(t * 2.5 + q.i) * 3, look: 0 });
        place(q, q.x, q.y, q.rot);
      });
    },
  };
}
