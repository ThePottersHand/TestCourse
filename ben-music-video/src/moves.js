/* Dance moves & poses as functions of musical time. Return partial pose objects to merge into drawKid/drawRusty. */
(function (RV) {
  'use strict';
  const { TAU, clamp, fract } = RV;

  // natural blinking
  RV.blink = (t, seed = 0) => {
    const f = fract(t * 0.23 + RV.hash(seed * 7.1));
    return f < 0.035 ? Math.sin((f / 0.035) * Math.PI) : 0;
  };

  const S = (x) => Math.sin(x * TAU);

  RV.move = function (name, t, seed = 0, amt = 1) {
    const b = RV.beat(t) + seed * 0.5;
    const h = b / 2;                 // half notes (kick)
    const ph = fract(h);
    const down = 0.5 + 0.5 * Math.cos(ph * TAU); // 1 on the kick
    const n = Math.floor(h);
    const P = { blink: RV.blink(t, seed) };
    switch (name) {
      case 'idle':
        P.bob = 4 * down * amt;
        P.armL = [0.28 + 0.04 * S(h * 0.5), 0.15];
        P.armR = [0.28 - 0.04 * S(h * 0.5), 0.15];
        P.headTilt = 0.05 * S(h * 0.25 + seed);
        break;
      case 'bounce':
        P.bob = 16 * down * amt;
        P.armL = [0.5 + 0.35 * S(h), 0.5];
        P.armR = [0.5 - 0.35 * S(h), 0.5];
        P.headTilt = 0.08 * S(h * 0.5);
        P.lean = 0.04 * S(h * 0.5);
        break;
      case 'cheer':
        P.jump = 46 * Math.abs(Math.sin(Math.PI * h)) * amt;
        P.armL = [2.65 + 0.2 * S(h), 0.15];
        P.armR = [2.65 - 0.2 * S(h), 0.15];
        P.footL = [0, 14 * Math.abs(Math.sin(Math.PI * h))];
        P.footR = [0, 14 * Math.abs(Math.sin(Math.PI * h))];
        P.eyes = 'happy'; P.mouth = 'grin';
        break;
      case 'wave':
        P.bob = 8 * down * amt;
        P.lean = 0.1 * Math.sin(Math.PI * h);
        P.armL = [2.45 + 0.35 * Math.sin(Math.PI * h), 0.35];
        P.armR = [2.45 - 0.35 * Math.sin(Math.PI * h), 0.35];
        P.headTilt = 0.1 * Math.sin(Math.PI * h);
        break;
      case 'twist':
        P.bob = 18 * down * amt;
        P.lean = 0.14 * Math.sin(Math.PI * b);
        P.hipX = 10 * Math.sin(Math.PI * b);
        P.armL = [1.2, -1.3 + 0.3 * Math.sin(Math.PI * b)];
        P.armR = [1.2, -1.3 - 0.3 * Math.sin(Math.PI * b)];
        P.footL = [0, 18 * Math.max(0, Math.sin(Math.PI * b))];
        P.footR = [0, 18 * Math.max(0, -Math.sin(Math.PI * b))];
        break;
      case 'disco': {
        // Saturday-night point: up-right, then down-left across the body
        const up = n % 2 === 0;
        const e = RV.ease.outBack(clamp(ph * 3), 2);
        P.bob = 10 * down * amt;
        P.lean = (up ? 0.12 : -0.08) * e;
        P.armR = up ? [2.6 * e + 0.3 * (1 - e), 0] : [0.9, -0.2];
        P.armL = up ? [0.9, -1.6] : [0.2 + 0.5 * e, 0.6];
        P.headTilt = up ? -0.12 : 0.1;
        P.footR = [up ? 14 : 0, up ? 0 : 10];
        break;
      }
      case 'robot': {
        const k = Math.floor(b) % 4;
        const poses = [[[1.57, 1.57], [0.3, 0]], [[0.3, 0], [1.57, -1.57]], [[1.57, -1.57], [1.57, 1.57]], [[2.9, 0], [0.2, 0]]];
        P.armL = poses[k][0]; P.armR = poses[k][1];
        P.headTilt = [0.15, -0.15, 0, 0.1][k];
        P.bob = [0, 8, 0, 8][k];
        P.lean = [-0.05, 0.05, 0, 0][k];
        break;
      }
      case 'clap': {
        const c = Math.abs(Math.cos(Math.PI * b));
        P.bob = 8 * down;
        P.armL = [0.9 + 0.5 * c, -1.5 + 0.3 * c];
        P.armR = [0.9 + 0.5 * c, -1.5 + 0.3 * c];
        P.eyes = 'happy';
        break;
      }
      case 'march':
      case 'walk':
        P.bob = 6 * Math.abs(Math.sin(Math.PI * b)) * amt;
        P.footL = [0, 22 * Math.max(0, Math.sin(Math.PI * b)) * amt];
        P.footR = [0, 22 * Math.max(0, -Math.sin(Math.PI * b)) * amt];
        P.armL = [0.35 + 0.35 * Math.sin(Math.PI * b), 0.25];
        P.armR = [0.35 - 0.35 * Math.sin(Math.PI * b), 0.25];
        break;
      case 'hips':
        P.bob = 10 * down;
        P.lean = 0.1 * Math.sin(Math.PI * h);
        P.hipX = 14 * Math.sin(Math.PI * h);
        P.armL = [0.8, -1.9]; P.armR = [0.8, -1.9];
        break;
      case 'swim':
        P.bob = 10 * down;
        P.armL = [1.6 + 1.1 * Math.sin(Math.PI * b), 0.4];
        P.armR = [1.6 - 1.1 * Math.sin(Math.PI * b), 0.4];
        P.lean = 0.06 * Math.sin(Math.PI * b);
        break;
      case 'spin':
        P.bob = 10 * down;
        P.turn = Math.sin(t * 7);
        P.face = Math.cos(t * 7) > 0 ? 1 : -1;
        P.armL = [1.7, 0.2]; P.armR = [1.7, 0.2];
        break;
      default:
        break;
    }
    return P;
  };

  // Rusty's upright dance moves (front legs are "arms")
  RV.rustyMove = function (name, t, seed = 0) {
    const b = RV.beat(t) + seed * 0.5;
    const h = b / 2, ph = fract(h), n = Math.floor(h);
    const down = 0.5 + 0.5 * Math.cos(ph * TAU);
    const P = { pose: 'stand', blink: RV.blink(t, seed + 3), wag: 1 };
    switch (name) {
      case 'disco': {
        const up = n % 2 === 0;
        const e = RV.ease.outBack(clamp(ph * 3), 2);
        P.bob = 10 * down;
        P.armR = up ? [2.7 * e + 0.3 * (1 - e), 0] : [0.9, -0.3];
        P.armL = up ? [0.8, -1.4] : [0.3 + 0.4 * e, 0.4];
        P.headTilt = up ? -0.15 : 0.12;
        P.footR = [0, up ? 0 : 16];
        P.mouth = 'tongue';
        break;
      }
      case 'cheer':
        P.jump = 50 * Math.abs(Math.sin(Math.PI * h));
        P.armL = [2.6 + 0.25 * S(h), 0.2]; P.armR = [2.6 - 0.25 * S(h), 0.2];
        P.mouth = 'open'; P.open = 0.8; P.eyes = 'happy';
        break;
      case 'wave':
        P.bob = 8 * down;
        P.armL = [2.4 + 0.35 * Math.sin(Math.PI * h), 0.3]; P.armR = [2.4 - 0.35 * Math.sin(Math.PI * h), 0.3];
        P.headTilt = 0.12 * Math.sin(Math.PI * h);
        P.mouth = 'tongue';
        break;
      case 'twist':
        P.bob = 16 * down;
        P.armL = [1.3, -1.2 + 0.3 * Math.sin(Math.PI * b)]; P.armR = [1.3, -1.2 - 0.3 * Math.sin(Math.PI * b)];
        P.footL = [0, 18 * Math.max(0, Math.sin(Math.PI * b))]; P.footR = [0, 18 * Math.max(0, -Math.sin(Math.PI * b))];
        P.headTilt = 0.15 * Math.sin(Math.PI * b);
        P.mouth = 'tongue';
        break;
      case 'howl':
        P.bob = 4 * down;
        P.armL = [0.5, 0.3]; P.armR = [0.5, 0.3];
        P.headTilt = 0; P.mouth = 'howl'; P.eyes = 'closed';
        break;
      default:
        P.bob = 8 * down;
        P.armL = [0.5 + 0.3 * S(h), 0.4]; P.armR = [0.5 - 0.3 * S(h), 0.4];
        P.headTilt = 0.1 * S(h * 0.5);
        P.mouth = 'tongue';
    }
    return P;
  };

  // convenience: draw the three kids as a group with per-kid overrides
  RV.drawKids = function (ctx, t, spots, fnPose) {
    RV.KID_IDS.forEach((id, i) => {
      const s = spots[i];
      if (!s) return;
      const base = { x: s[0], y: s[1], s: s[2] || 1, t };
      const pose = Object.assign(base, fnPose ? fnPose(id, i) : {});
      RV.shadow(ctx, pose.x, pose.y + 4, 70 * (pose.s || 1), 0.22);
      RV.drawKid(ctx, id, pose);
    });
  };
})(globalThis.RV);
