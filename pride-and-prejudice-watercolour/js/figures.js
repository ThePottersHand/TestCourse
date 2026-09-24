// Regency silhouette figures, drawn as smooth profiles facing +x.
// Local units: H (crown -> chin) = 1; painters take a Canvas2D context `g` and a scale `s`
// (px per H) and fill every primitive separately so overlapping curls always union.
(function (WC) {
  'use strict';

  const F = WC.figures = {};

  // ---------------------------------------------------------------- Elizabeth
  F.lizzyBody = [
    [0.330, 0.095], [0.402, 0.205], [0.437, 0.320], [0.450, 0.402],          // forehead -> brow
    [0.437, 0.462], [0.458, 0.525], [0.494, 0.598], [0.523, 0.640],           // nasion -> dorsum -> tip
    [0.513, 0.668], [0.470, 0.682, 'c'], [0.466, 0.712], [0.487, 0.750],       // under tip, subnasale, philtrum, upper lip
    [0.461, 0.780, 'c'], [0.477, 0.806], [0.451, 0.850], [0.461, 0.902],       // stomion, lower lip, sulcus, chin
    [0.443, 0.957], [0.388, 0.990], [0.300, 1.004], [0.218, 1.030],           // chin underside -> throat
    [0.192, 1.120], [0.198, 1.225], [0.232, 1.330], [0.305, 1.455],           // neck -> décolleté
    [0.392, 1.600], [0.452, 1.760], [0.438, 1.920], [0.402, 2.040],           // bust, empire waist
    [0.430, 2.40], [-0.62, 2.40],                                              // off the bottom
    [-0.585, 1.95], [-0.520, 1.640], [-0.420, 1.440], [-0.310, 1.295],       // back
    [-0.238, 1.150], [-0.212, 1.000], [-0.238, 0.860], [-0.338, 0.715],       // neck back, nape
    [-0.418, 0.545], [-0.430, 0.375], [-0.378, 0.200], [-0.270, 0.075],       // skull
    [-0.120, 0.008], [0.050, -0.002], [0.200, 0.030],
  ];

  F.lizzyCap = [
    [0.356, 0.175], [0.340, 0.075], [0.270, -0.018], [0.130, -0.066], [-0.030, -0.074],
    [-0.195, -0.036], [-0.340, 0.056], [-0.445, 0.215], [-0.472, 0.415], [-0.435, 0.595],
    [-0.345, 0.755], [-0.262, 0.815], [-0.200, 0.750], [-0.120, 0.640], [-0.030, 0.575],
    [0.060, 0.540], [0.150, 0.470], [0.215, 0.388], [0.265, 0.300], [0.312, 0.236],
  ];

  F.lizzyBun = { x: -0.262, y: -0.050, r: 0.172 };
  F.lizzyFlower = { x: -0.070, y: -0.105 };

  F.lizzy = {
    body(g, s) { WC.fillSpline(g, F.lizzyBody, true, s); },

    hair(g, s, rnd) {
      rnd = rnd || WC.rng(7);
      WC.fillSpline(g, F.lizzyCap, true, s);
      // curly outer edge (front hairline -> crown -> back -> nape)
      const outer = F.lizzyCap.slice(0, 12);
      WC.scallops(g, outer, false, s, 0.036 * s, 0.026 * s, 0.050 * s, 0.35, rnd);
      // Grecian knot high on the crown
      const b = F.lizzyBun;
      WC.fillCircle(g, b.x * s, b.y * s, b.r * s);
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + rnd() * 0.2;
        const rr = b.r * (0.86 + rnd() * 0.12);
        WC.fillCircle(g, (b.x + Math.cos(a) * rr) * s, (b.y + Math.sin(a) * rr) * s, (0.040 + rnd() * 0.022) * s);
      }
      // temple curls clustered along the front hairline
      [[0.352, 0.070, 0.044], [0.378, 0.135, 0.040], [0.366, 0.200, 0.036], [0.334, 0.258, 0.034],
       [0.296, 0.310, 0.032], [0.255, 0.360, 0.030]].forEach(([x, y, r]) => WC.fillCircle(g, x * s, y * s, r * s));
      // ringlets
      g.strokeStyle = g.fillStyle;
      WC.ringlet(g, 0.262 * s, 0.34 * s, 0.33 * s, 0.050 * s, 0.022 * s, 2.6, 0.020 * s, 0.01 * s);
      WC.ringlet(g, 0.205 * s, 0.37 * s, 0.26 * s, 0.044 * s, 0.020 * s, 2.2, 0.018 * s, -0.02 * s);
      WC.ringlet(g, -0.420 * s, 0.10 * s, 0.80 * s, 0.066 * s, 0.026 * s, 3.8, 0.030 * s, 0.10 * s);
      WC.ringlet(g, -0.480 * s, 0.12 * s, 0.62 * s, 0.060 * s, 0.024 * s, 3.2, 0.030 * s, -0.02 * s);
      WC.ringlet(g, -0.350 * s, 0.14 * s, 0.84 * s, 0.056 * s, 0.022 * s, 4.0, 0.026 * s, 0.14 * s);
      WC.fillLock(g, -0.215 * s, 0.74 * s, -0.175 * s, 0.95 * s, 0.035 * s, 0.35);
    },

    // curl highlights, lifted out of the wet hair wash
    hairLights(g, s) {
      g.lineCap = 'round';
      const arc = (x, y, r, a0, a1, w) => { g.lineWidth = w * s; g.beginPath(); g.arc(x * s, y * s, r * s, a0, a1); g.stroke(); };
      arc(-0.262, -0.050, 0.10, 3.6, 5.6, 0.016);
      arc(-0.262, -0.050, 0.05, 3.2, 5.9, 0.012);
      arc(0.05, 0.08, 0.20, 3.9, 4.9, 0.014);
      arc(-0.14, 0.18, 0.22, 3.5, 4.4, 0.013);
      arc(-0.30, 0.38, 0.12, 4.2, 5.3, 0.012);
      arc(0.30, 0.16, 0.04, 3.5, 5.5, 0.010);
      arc(0.34, 0.08, 0.04, 3.5, 5.5, 0.010);
    },

    ribbon(g, s) {
      const band = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        band.push([0.335 - t * 0.66, 0.040 - Math.sin(t * Math.PI) * 0.075 + t * 0.12]);
      }
      const w = 0.040;
      WC.fillSpline(g, band.map(([x, y]) => [x, y - w / 2]).concat(band.map(([x, y]) => [x, y + w / 2]).reverse()), true, s);
      WC.fillLock(g, -0.330 * s, 0.150 * s, -0.575 * s, 0.560 * s, 0.070 * s, -0.20, 0.30);
      WC.fillLock(g, -0.320 * s, 0.160 * s, -0.470 * s, 0.660 * s, 0.060 * s, 0.16, 0.30);
      WC.fillEllipse(g, -0.395 * s, 0.100 * s, 0.078 * s, 0.036 * s, -0.7);
      WC.fillEllipse(g, -0.312 * s, 0.182 * s, 0.072 * s, 0.033 * s, 0.9);
      WC.fillCircle(g, -0.345 * s, 0.145 * s, 0.028 * s);
    },

    flowerPetals(g, s, rnd) {
      const f = F.lizzyFlower;
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + 0.2;
        g.save(); g.translate(f.x * s, f.y * s); g.rotate(a); g.scale(1, 0.62 + 0.3 * Math.abs(Math.sin(a)));
        const p = F.petal(new Path2D(), 0.095 * s, 0.034 * s); g.fill(p); g.restore();
      }
    },
    flowerHeart(g, s) { const f = F.lizzyFlower; WC.fillCircle(g, f.x * s, f.y * s, 0.028 * s); },

    lips(g, s) {
      WC.fillSpline(g, [[0.470, 0.742], [0.489, 0.752], [0.463, 0.781, 'c'], [0.479, 0.806], [0.462, 0.824], [0.436, 0.800], [0.444, 0.760]], true, s);
    },
    cheek(g, s) { WC.fillEllipse(g, 0.300 * s, 0.655 * s, 0.085 * s, 0.062 * s, 0.2); },
    earring(g, s) { WC.fillCircle(g, 0.030 * s, 0.640 * s, 0.011 * s); WC.fillEllipse(g, 0.030 * s, 0.695 * s, 0.018 * s, 0.030 * s, 0); },

    eye: {
      strokes: [
        { pts: [[0.358, 0.489], [0.384, 0.478], [0.410, 0.482], [0.425, 0.495]], w: 0.010 },   // upper lid
        { pts: [[0.394, 0.507], [0.411, 0.509], [0.421, 0.501]], w: 0.004 },                  // lower lid
        { pts: [[0.410, 0.481], [0.421, 0.468], [0.430, 0.464]], w: 0.005 },                  // lashes
        { pts: [[0.417, 0.485], [0.430, 0.477], [0.438, 0.476]], w: 0.005 },
        { pts: [[0.401, 0.479], [0.408, 0.466], [0.415, 0.460]], w: 0.004 },
        { pts: [[0.343, 0.437], [0.376, 0.423], [0.409, 0.423], [0.434, 0.433]], w: 0.008 },  // brow
      ],
      iris: { x: 0.412, y: 0.494, r: 0.012 },
    },
  };

  // ---------------------------------------------------------------- Darcy
  F.darcyBody = [
    [0.345, 0.110], [0.425, 0.230], [0.460, 0.335], [0.479, 0.410],          // forehead -> brow ridge
    [0.451, 0.470], [0.483, 0.540], [0.527, 0.615], [0.556, 0.652],           // nasion, dorsum, tip
    [0.541, 0.688], [0.478, 0.703, 'c'], [0.477, 0.742], [0.492, 0.772],       // under tip, subnasale, philtrum, lip
    [0.468, 0.795, 'c'], [0.479, 0.818], [0.453, 0.858], [0.478, 0.918],       // stomion, lower lip, sulcus, chin
    [0.462, 0.975], [0.405, 1.000],                                            // chin underside
    [0.420, 1.050], [0.487, 1.120], [0.503, 1.215], [0.466, 1.300],           // cravat bulge
    [0.455, 1.380], [0.520, 1.480], [0.585, 1.660], [0.605, 1.900],           // coat front
    [0.610, 2.40], [-0.800, 2.40],                                             // off the bottom
    [-0.810, 1.800], [-0.760, 1.470], [-0.620, 1.300], [-0.450, 1.160],       // broad shoulder
    [-0.360, 0.960], [-0.305, 0.860, 'c'],                                     // high coat collar at the nape
    [-0.360, 0.780], [-0.440, 0.600], [-0.458, 0.400], [-0.400, 0.200],       // back of skull
    [-0.275, 0.060], [-0.100, -0.002], [0.100, -0.004], [0.250, 0.040],
  ];

  F.darcyCap = [
    [0.365, 0.140], [0.356, 0.060], [0.250, -0.030], [0.080, -0.062], [-0.100, -0.060],
    [-0.265, -0.015], [-0.390, 0.090], [-0.455, 0.250], [-0.466, 0.450], [-0.432, 0.630],
    [-0.372, 0.770], [-0.312, 0.805], [-0.250, 0.735], [-0.120, 0.680], [0.000, 0.655],
    [0.100, 0.650], [0.172, 0.680, 'c'], [0.214, 0.640], [0.222, 0.500], [0.262, 0.362],
    [0.312, 0.262], [0.350, 0.200],
  ];

  F.darcy = {
    body(g, s) { WC.fillSpline(g, F.darcyBody, true, s); },

    hair(g, s, rnd) {
      rnd = rnd || WC.rng(11);
      WC.fillSpline(g, F.darcyCap, true, s);
      WC.scallops(g, F.darcyCap.slice(1, 12), false, s, 0.045 * s, 0.022 * s, 0.040 * s, 0.55, rnd);
      // forward-swept "Brutus" locks over the brow
      [[0.10, -0.05, 0.415, 0.085, 0.09, 0.14], [0.20, 0.00, 0.435, 0.175, 0.07, 0.16],
       [0.28, 0.09, 0.425, 0.270, 0.05, 0.20], [-0.10, -0.07, 0.20, -0.055, 0.075, 0.22],
       [0.22, 0.24, 0.285, 0.390, 0.04, 0.20], [-0.30, -0.01, -0.06, -0.085, 0.07, 0.20],
       [-0.43, 0.16, -0.36, -0.010, 0.06, -0.22], [-0.46, 0.52, -0.49, 0.320, 0.05, -0.20],
       [-0.39, 0.75, -0.47, 0.600, 0.05, -0.20]]
        .forEach(([ax, ay, bx, by, w, bend]) => WC.fillLock(g, ax * s, ay * s, bx * s, by * s, w * s, bend, 0.2));
    },

    hairLights(g, s) {
      g.lineCap = 'round';
      const arc = (x, y, r, a0, a1, w) => { g.lineWidth = w * s; g.beginPath(); g.arc(x * s, y * s, r * s, a0, a1); g.stroke(); };
      arc(0.12, 0.18, 0.22, 4.1, 5.2, 0.014);
      arc(-0.10, 0.20, 0.24, 3.8, 4.7, 0.013);
      arc(-0.30, 0.42, 0.14, 4.0, 5.1, 0.012);
      arc(-0.25, 0.10, 0.18, 3.6, 4.6, 0.012);
      arc(0.20, 0.05, 0.12, 3.8, 5.0, 0.011);
      arc(-0.36, 0.60, 0.10, 4.3, 5.4, 0.011);
      arc(-0.05, 0.46, 0.20, 3.9, 4.8, 0.012);
      arc(-0.18, 0.30, 0.10, 3.5, 4.9, 0.010);
    },

    coatCollar(g, s) {
      WC.fillSpline(g, [
        [-0.305, 0.860, 'c'], [-0.200, 0.950], [-0.020, 1.080], [0.160, 1.215], [0.300, 1.330],
        [0.420, 1.395], [0.475, 1.470], [0.540, 1.600], [0.575, 1.700, 'c'], [0.420, 1.735, 'c'],
        [0.230, 1.540], [0.020, 1.300], [-0.180, 1.100], [-0.330, 1.000], [-0.372, 0.960],
      ], true, s);
    },

    // White shapes left as bare paper: cravat round the neck + a shirt point up the cheek.
    cravat(g, s) {
      WC.fillSpline(g, [
        [0.405, 1.000], [0.420, 1.050], [0.487, 1.120], [0.503, 1.215], [0.466, 1.300], [0.455, 1.380],
        [0.380, 1.410], [0.290, 1.380], [0.130, 1.262], [-0.030, 1.118], [-0.170, 0.985], [-0.232, 0.880],
        [-0.120, 0.832], [0.000, 0.800], [0.120, 0.880], [0.262, 0.952], [0.362, 0.990],
      ], true, s);
      WC.fillSpline(g, [[0.140, 0.910, 'c'], [0.180, 0.830], [0.222, 0.742, 'c'], [0.270, 0.860], [0.340, 0.985, 'c']], true, s);
    },
    cravatShade(g, s) {
      WC.fillSpline(g, [[-0.232, 0.880], [-0.120, 0.840], [0.040, 0.860], [0.160, 0.960], [0.200, 1.100],
        [0.160, 1.260], [0.110, 1.268], [-0.030, 1.118], [-0.170, 0.985]], true, s);
    },

    eye: {
      strokes: [
        { pts: [[0.372, 0.492], [0.396, 0.485], [0.419, 0.489], [0.433, 0.499]], w: 0.010 },
        { pts: [[0.401, 0.511], [0.419, 0.512], [0.429, 0.505]], w: 0.004 },
        { pts: [[0.348, 0.454], [0.381, 0.441], [0.418, 0.446], [0.449, 0.465]], w: 0.014 },  // stern brow
      ],
      iris: { x: 0.421, y: 0.499, r: 0.012 },
    },
  };


  // Closed, dreamy eye: lid curves down, lashes fall.
  F.inkEyeClosed = function (g, eye, s) {
    const x = eye.iris.x, y = eye.iris.y;
    g.lineCap = 'round';
    const lid = WC.sampleSpline([[x - 0.052, y - 0.004], [x - 0.02, y + 0.012], [x + 0.012, y + 0.010], [x + 0.022, y - 0.002]], false, s, 10);
    for (let i = 1; i < lid.length; i++) { g.lineWidth = 0.009 * s * (0.4 + 0.6 * Math.sin(Math.PI * i / lid.length)); g.beginPath(); g.moveTo(lid[i - 1][0], lid[i - 1][1]); g.lineTo(lid[i][0], lid[i][1]); g.stroke(); }
    g.lineWidth = 0.004 * s;
    [[-0.02, 0.012], [-0.004, 0.013], [0.01, 0.01]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo((x + dx) * s, (y + dy) * s); g.lineTo((x + dx + 0.008) * s, (y + dy + 0.018) * s); g.stroke(); });
    const brow = eye.strokes[eye.strokes.length - 1];
    g.lineWidth = brow.w * s * 0.8; g.beginPath(); brow.pts.forEach(([bx, by], i) => (i ? g.lineTo(bx * s, (by - 0.006) * s) : g.moveTo(bx * s, (by - 0.006) * s))); g.stroke();
  };

  // ---------------------------------------------------------------- Props
  // Daisy petal (long, slightly notched) pointing +x from the origin, length L, width W.
  F.petal = function (p, L, W) {
    WC.spline(p, [
      [0, 0, 'c'], [0.25 * L, -0.46 * W], [0.62 * L, -0.52 * W], [0.93 * L, -0.30 * W],
      [1.0 * L, -0.08 * W], [0.955 * L, 0.0, 'c'], [1.0 * L, 0.10 * W], [0.93 * L, 0.32 * W],
      [0.62 * L, 0.52 * W], [0.25 * L, 0.44 * W],
    ], true, 1);
    return p;
  };

  // Draw ink strokes of a figure's eye into a context already transformed to the figure.
  F.inkEye = function (g, eye, s) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    eye.strokes.forEach((st) => {
      const pts = st.pts;
      // taper: draw the polyline as progressively thinner segments
      const N = 16;
      const samp = WC.sampleSpline(pts, false, s, N);
      for (let i = 1; i < samp.length; i++) {
        const t = i / samp.length;
        g.lineWidth = st.w * s * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.1)));
        g.beginPath(); g.moveTo(samp[i - 1][0], samp[i - 1][1]); g.lineTo(samp[i][0], samp[i][1]); g.stroke();
      }
    });
    WC.fillCircle(g, eye.iris.x * s, eye.iris.y * s, eye.iris.r * s);
  };
})(window.WC = window.WC || {});
