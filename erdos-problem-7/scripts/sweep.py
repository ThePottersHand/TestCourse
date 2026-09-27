"""Certify that no odd N in (X/3, X] is a covering number, hence none <= X.

For every odd abundant N in (X/3, X] (odd non-abundant N are never covering numbers) try,
in order: (1) the Shearer certificate for N; (2) slice certificates over primes q || N;
(3) prime-power tree certificates over q^f || N.  Every odd n <= X divides some odd
N = 3^k n in (X/3, X], and divisors of non-covering numbers are non-covering, so if every
odd abundant N in (X/3, X] is certified then there is no odd covering number <= X.
"""
import argparse
import json
import sys
from pathlib import Path
import time
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from oddcover.arith import enumerate_odd_abundant
from oddcover.shearer import certify_factorization
from oddcover.slices import slice_certificate, tree_certificate


def certify_one(fac):
    c = certify_factorization(fac)
    if c.certified:
        return 'shearer', {'z1': str(c.uncovered_lower_bound)}
    for q, e in sorted(fac, key=lambda t: t[0]):
        if e == 1:
            sc = slice_certificate(fac, q)
            if sc is not None and sc.certified:
                return 'slice', {'q': q, 'big': sc.big_items, 'small': str(sc.small_sum), 'bins': sc.bins_upper_bound}
    for q, e in sorted(fac, key=lambda t: t[0]):
        tc = tree_certificate(fac, q)
        if tc is not None and tc.certified:
            return 'tree', {'q': q, 'f': tc.f, 'lhs': str(tc.lhs), 'rhs': tc.rhs}
    return None, {'z1': str(c.uncovered_lower_bound)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('X', type=float)
    ap.add_argument('--lo', type=float, default=None, help='default X/3')
    ap.add_argument('--out', default=None)
    args = ap.parse_args()
    X = int(args.X)
    lo = int(args.lo) if args.lo is not None else X // 3
    t0 = time.time()
    counts = Counter()
    special = []
    for N, fac in enumerate_odd_abundant(lo, X):
        method, info = certify_one(fac)
        counts[method] += 1
        if method != 'shearer':
            special.append({'N': N, 'factorization': fac, 'method': method, **info})
    special.sort(key=lambda r: r['N'])
    summary = {'X': X, 'lo': lo, 'counts': dict(counts), 'uncertified': [r['N'] for r in special if r['method'] is None],
               'seconds': round(time.time() - t0, 1)}
    print(json.dumps(summary))
    for r in special:
        print(r['N'], r['factorization'], r['method'], {k: v for k, v in r.items() if k not in ('N', 'factorization', 'method')})
    if args.out:
        with open(args.out, 'w') as fh:
            json.dump({'summary': summary, 'non_shearer': special}, fh, indent=1)


if __name__ == '__main__':
    main()
