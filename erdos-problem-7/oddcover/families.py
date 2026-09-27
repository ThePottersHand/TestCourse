r"""Certificates for infinite families: all N whose prime factors lie in a fixed set P,
with arbitrary exponents.

Two ingredients make this possible.

1. Multi-affinity.  For fixed lambda the block polynomial F_lambda(x) is affine in each
   prime weight x_p separately, and x_p = sum_{i=1}^{e} p^{-i} ranges over [0, 1/(p-1))
   as the exponent e ranges over 0, 1, 2, ...  Hence F_lambda is minimised over the box
   prod_p [0, 1/(p-1)] at a corner, and positivity at the 2^|P| corners (for all lambda)
   certifies every N with prime factors in P (Shearer box certificate).

2. Linear-fractional monotonicity.  For fixed lambda the ratio lambda*G_B(x)/F(x) of two
   multi-affine functions is linear-fractional, hence monotone, in each coordinate, so its
   maximum over the box is also attained at a corner.  This gives constants K_B valid for
   every exponent vector at once, and hence family versions of the slice / tree bounds of
   ``slices.py``:

   Tree bound for a set Q of primes (all exponents f_q >= 1) over a base with primes
   R = P \ Q (all exponents).  Leaves are the residues mod prod q^{f_q}.  Covering forces
       T >= (2 - h_Q) / (h_Q - 1),   h_Q = prod_q sigma(q^{f_q}) / q^{f_q},
   where T = sum_{m > 1, supp m in R} min(1, K_{supp m} / m).  Since h_Q < prod q/(q-1) and
   (2-h)/(h-1) decreases in h, the family is certified if T <= (2-H)/(H-1) with
   H = prod_{q in Q} q/(q-1).  For Q = {q} this reads T <= q - 2.

   Slice bound for q || N (exponent exactly 1): covering forces
       #{items of size >= 1} + floor(sum of item sizes < 1) >= q - 1.
"""

from __future__ import annotations

from fractions import Fraction
from itertools import product
from math import floor
from typing import Dict, Iterable, List, Sequence, Tuple

from .arith import primes_upto
from .poly import positive_on_unit_interval, ratio_upper_bound
from .shearer import certify_box, shearer_poly_from_weights


def caps(ps: Sequence[int]) -> List[Fraction]:
    return [Fraction(1, p - 1) for p in ps]


def box_certified(ps: Sequence[int]) -> bool:
    """Shearer box certificate for all N with prime factors in ps (any exponents)."""
    return certify_box(caps(ps))[0]


def uncertified_sets(k: int, limit: int = 10000) -> Tuple[List[Tuple[int, ...]], List[Tuple[int, ...]]]:
    """All k-sets of odd primes <= limit that are NOT box-certified, and the maximal ones.

    Box certification is monotone: if (p_1 < ... < p_k) is certified then so is every
    (q_1 < ... < q_k) with q_i >= p_i (the caps shrink and F is symmetric), so the
    non-certified sets form a down-set, found by breadth-first search from the k smallest
    odd primes moving one coordinate at a time to the next prime.
    """
    odd = [p for p in primes_upto(limit) if p > 2]
    nxt = {p: q for p, q in zip(odd, odd[1:])}
    start = tuple(odd[:k])

    def succ(s):
        out = []
        for i in range(k):
            q = nxt.get(s[i])
            if q is None or (i + 1 < k and q >= s[i + 1]):
                continue
            out.append(s[:i] + (q,) + s[i + 1:])
        return out

    seen = {start}
    frontier = [start]
    bad: List[Tuple[int, ...]] = []
    while frontier:
        new = []
        for s in frontier:
            if box_certified(s):
                continue
            bad.append(s)
            for t in succ(s):
                if t not in seen:
                    seen.add(t)
                    new.append(t)
        frontier = new
    badset = set(bad)
    maximal = [s for s in bad if not any(t in badset for t in succ(s))]
    return sorted(bad), sorted(maximal)


def family_K(ps: Sequence[int], rel_tol: Fraction = Fraction(1, 10 ** 5)) -> Dict[int, Fraction]:
    """K_B upper bounds valid for every exponent vector on the primes ps (bitmask B).

    Requires every corner of the box to be Shearer-positive (checked)."""
    k = len(ps)
    cp = caps(ps)
    Kbar: Dict[int, Fraction] = {}
    for corner in product([0, 1], repeat=k):
        xs = [cp[i] if corner[i] else Fraction(0) for i in range(k)]
        F = shearer_poly_from_weights(xs)
        if not positive_on_unit_interval(F.coeffs):
            raise ValueError("base family not Shearer-certified at corner %s" % (corner,))
        Ff = [Fraction(c, F.denom) for c in F.coeffs]
        for mask in range(1, 1 << k):
            sub = [xs[i] for i in range(k) if not mask >> i & 1]
            G = shearer_poly_from_weights(sub)
            num = [Fraction(0)] + [Fraction(c, G.denom) for c in G.coeffs]
            val = ratio_upper_bound(num, Ff, rel_tol=rel_tol)
            if mask not in Kbar or val > Kbar[mask]:
                Kbar[mask] = val
    return Kbar


def _small_moduli_with_support(ps: Sequence[int], bound: Fraction) -> Tuple[int, Fraction]:
    """(number of m <= bound with supp(m) = set(ps), sum of 1/m over them)."""
    cnt = 0
    s = Fraction(0)

    def rec(i: int, m: int) -> None:
        nonlocal cnt, s
        if i == len(ps):
            cnt += 1
            s += Fraction(1, m)
            return
        mm = m * ps[i]
        while mm <= bound:
            rec(i + 1, mm)
            mm *= ps[i]

    rec(0, 1)
    return cnt, s


def family_items(ps: Sequence[int]) -> Tuple[int, Fraction]:
    """(#items of size >= 1, total size of items < 1) over ALL moduli m > 1 with prime
    factors in ps (any exponents), with sizes K_B/m, K_B from ``family_K``.  These dominate
    the corresponding quantities for every finite exponent vector."""
    K = family_K(ps)
    big = 0
    small = Fraction(0)
    for mask, Kb in K.items():
        sub = [p for i, p in enumerate(ps) if mask >> i & 1]
        xcap = Fraction(1)
        for p in sub:
            xcap *= Fraction(1, p - 1)
        cnt, s = _small_moduli_with_support(sub, Kb)
        big += cnt
        small += Kb * (xcap - s)
    return big, small


def family_tree_certified(P: Sequence[int], Q: Sequence[int]) -> Tuple[bool, Fraction, Fraction]:
    """Certify all N with q | N for every q in Q (any exponents) and other primes in P \\ Q."""
    R = [p for p in P if p not in Q]
    H = Fraction(1)
    for q in Q:
        H *= Fraction(q, q - 1)
    if H >= 2:
        return False, Fraction(0), Fraction(0)
    thr = (2 - H) / (H - 1)
    big, small = family_items(R)
    T = big + small
    return T <= thr, T, thr


def family_slice_certified(P: Sequence[int], q: int) -> Tuple[bool, int]:
    """Certify all N with q || N (exponent exactly 1) and other primes in P \\ {q}."""
    R = [p for p in P if p != q]
    big, small = family_items(R)
    bins = big + floor(small)
    return bins < q - 1, bins
