// End card: the line the recording doesn't say.
import { el } from '../lib/core.js';
import { kf } from '../lib/anim.js';
import { stage } from './common.js';

export async function endcard(svg, ctx) {
  const { root } = stage(svg);
  root.appendChild(el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: '#060403' }));
  const line = el('text', { x: 960, y: 548, 'text-anchor': 'middle', 'font-family': 'EB Garamond', 'font-style': 'italic', 'font-size': 58, fill: '#e9dfcb', 'letter-spacing': '0.5' },
    document.createTextNode('They’re waiting for the sequel.'));
  root.appendChild(line);
  return {
    update(t) {
      line.setAttribute('opacity', kf(t, [[0.9, 0], [2.0, 1, 'sine'], [4.9, 1], [5.9, 0, 'sine']]));
    },
  };
}
