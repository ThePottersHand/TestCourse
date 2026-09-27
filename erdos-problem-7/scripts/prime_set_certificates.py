"""Theorems A and B: odd covering systems need many primes (all exponents at once).

Theorem A.  If the moduli of a system of congruences are distinct odd integers > 1 whose
lcm has at most 4 distinct prime factors, then the system misses a set of integers of
density >= 1/32.  In particular an odd covering system uses at least 5 primes.

Theorem B.  If an odd covering system uses exactly 5 primes, they are 3, 5, 7, 11, 13 and
each of 3, 5, 7 divides the lcm to at least the second power.

Run:  python3 scripts/prime_set_certificates.py
"""
import heapq
import sys
from pathlib import Path
import time
from fractions import Fraction
from itertools import combinations, product

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from oddcover.families import (box_certified, caps, family_slice_certified, family_tree_certified,
                               uncertified_sets)
from oddcover.shearer import certify_box, certify_factorization
from oddcover.slices import slice_certificate, tree_certificate


def theorem_A():
    ok, worst = certify_box(caps((3, 5, 7, 11)))
    assert ok and worst == Fraction(1, 32)
    bad4, _ = uncertified_sets(4)
    assert bad4 == []
    print('Theorem A: every set of <= 4 odd primes is Shearer-certified for all exponents;')
    print('           worst case {3,5,7,11}: every system misses density >= %s' % worst)


def theorem_B():
    bad5, maximal5 = uncertified_sets(5)
    print('5-sets of odd primes not Shearer-certified (all exponents):', bad5)
    assert bad5 == [(3, 5, 7, 11, 13), (3, 5, 7, 11, 17), (3, 5, 7, 11, 19)]
    for P, q in (((3, 5, 7, 11, 17), 17), ((3, 5, 7, 11, 19), 19)):
        ok, T, thr = family_tree_certified(P, (q,))
        print('  %s: %d-adic tree bound over base {3,5,7,11}: T = %.4f <= %s  -> %s'
              % (P, q, float(T), thr, 'certified' if ok else 'FAILED'))
        assert ok
    P = (3, 5, 7, 11, 13)
    for q in (3, 5, 7):
        ok, bins = family_slice_certified(P, q)
        print('  %s with %d || N: slice bound, at most %d of the %d slices coverable -> %s'
              % (P, q, bins, q - 1, 'certified' if ok else 'FAILED'))
        assert ok
    print('  %s: remaining tree bounds (not certified):' % (P,))
    for Q in [(3,), (5,), (7,), (11,), (13,), (11, 13)]:
        ok, T, thr = family_tree_certified(P, Q)
        print('      Q=%s: T = %.3f vs threshold %.3f %s' % (Q, float(T), float(thr), 'certified' if ok else ''))
    print('Theorem B: an odd covering system with exactly 5 primes has lcm 3^a 5^b 7^c 11^d 13^e,'
          ' a, b, c >= 2.')


def certified_finite(fac):
    if certify_factorization(fac).certified:
        return 'shearer'
    for q, e in fac:
        if e == 1:
            c = slice_certificate(fac, q)
            if c is not None and c.certified:
                return 'slice(%d)' % q
    for q, e in fac:
        t = tree_certificate(fac, q)
        if t is not None and t.certified:
            return 'tree(%d^%d)' % (q, e)
    return None


def smallest_uncertified_5prime(count=5, cap=10 ** 14):
    """Smallest N = 3^a 5^b 7^c 11^d 13^e (a,b,c >= 2; d,e >= 1) not certified by the
    finite Shearer / slice / tree certificates."""
    ps = (3, 5, 7, 11, 13)
    start = (2, 2, 2, 1, 1)
    val = lambda es: 3 ** es[0] * 5 ** es[1] * 7 ** es[2] * 11 ** es[3] * 13 ** es[4]
    heap = [(val(start), start)]
    seen = {start}
    found = []
    while heap and len(found) < count:
        N, es = heapq.heappop(heap)
        if N > cap:
            break
        fac = tuple(zip(ps, es))
        if certified_finite(fac) is None:
            found.append((N, es))
        for i in range(5):
            t = es[:i] + (es[i] + 1,) + es[i + 1:]
            if t not in seen:
                seen.add(t)
                heapq.heappush(heap, (val(t), t))
    return found


if __name__ == '__main__':
    t0 = time.time()
    theorem_A()
    theorem_B()
    print('smallest 5-prime candidates not excluded by the finite certificates:')
    for N, es in smallest_uncertified_5prime():
        print('   ', N, '= 3^%d 5^%d 7^%d 11^%d 13^%d' % es)
    print('(%.1fs)' % (time.time() - t0))
