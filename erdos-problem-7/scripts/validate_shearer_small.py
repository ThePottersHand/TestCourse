"""Cross-check Shearer's lower bound on the uncovered density against exact optima.

For many small N (odd and even) and random subsets of the divisors > 1 of N, compute the
exact maximum number of residues mod N that one class per modulus can cover (CP-SAT, proven
optimal) and check it never exceeds N * (1 - Z), whenever the Shearer certificate applies.
"""
import random
import sys
from pathlib import Path
import time
from fractions import Fraction

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from oddcover.arith import divisors
from oddcover.exact import covered_count, max_coverage
from oddcover.poly import positive_on_unit_interval
from oddcover.shearer import shearer_poly_moduli


def check(N, moduli, time_limit=30):
    P = shearer_poly_moduli(moduli)
    cert = positive_on_unit_interval(P.coeffs)
    best, ub, status, res = max_coverage(N, moduli, time_limit=time_limit)
    assert covered_count([(a, d) for d, a in res.items()], N) == best
    bound = N * (1 - P.z1)
    ok = (not cert) or (status == 'OPTIMAL' and best <= bound) or (status != 'OPTIMAL' and ub <= bound)
    return cert, best, ub, status, bound, ok


def main(seed=1, rounds=150):
    rng = random.Random(seed)
    Ns = [n for n in range(6, 400) if len(divisors(n)) >= 4]
    tight = 0
    tested = 0
    t0 = time.time()
    for r in range(rounds):
        N = rng.choice(Ns)
        divs = [d for d in divisors(N) if d > 1]
        k = rng.randint(1, len(divs))
        moduli = sorted(rng.sample(divs, k))
        cert, best, ub, status, bound, ok = check(N, moduli)
        if status != 'OPTIMAL':
            continue
        tested += 1
        if cert and best == bound:
            tight += 1
        if not ok:
            print('VIOLATION', N, moduli, best, float(bound))
            return 1
    print('checked %d instances (proven optima); Shearer bound attained exactly in %d certified cases; %.1fs'
          % (tested, tight, time.time() - t0))
    return 0


if __name__ == '__main__':
    sys.exit(main(*(int(a) for a in sys.argv[1:])))
