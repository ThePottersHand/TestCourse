"""Heuristic experiment (not a proof of anything): how much does a simple greedy leave uncovered?

For each divisor d > 1 of N in increasing order, choose the residue class mod d that covers the
most still-uncovered residues mod N.  Compare with Shearer's lower bound F_1 on the uncovered
density (which is only a valid bound when the certificate holds).

    python3 scripts/greedy_experiment.py 80405325
"""
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from oddcover.arith import divisors
from oddcover.exact import covered_count
from oddcover.shearer import certify


def greedy(N):
    unc = np.arange(N, dtype=np.int64)
    system = []
    for d in sorted(d for d in divisors(N) if d > 1):
        counts = np.bincount(unc % d, minlength=d)
        a = int(np.argmax(counts))
        system.append((a, d))
        if counts[a]:
            unc = unc[unc % d != a]
    return system, len(unc)


if __name__ == '__main__':
    for N in [int(a) for a in sys.argv[1:]] or [945, 675675, 80405325]:
        t = time.time()
        system, left = greedy(N)
        assert N - covered_count(system, N) == left
        c = certify(N)
        print('N = %d: greedy leaves %.4f%% uncovered; Shearer F_1 = %.4f%% (%s)  [%.1fs]'
              % (N, 100 * left / N, 100 * float(c.uncovered_lower_bound),
                 'valid lower bound' if c.certified else 'not a valid bound here', time.time() - t))
