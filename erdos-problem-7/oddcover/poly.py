"""Exact polynomial utilities on [0, 1] via Bernstein coefficients.

A polynomial is a sequence of coefficients (index = degree) of ints or Fractions.
On a subinterval the Bernstein coefficients enclose the range of the polynomial,
and de Casteljau subdivision refines the enclosure; everything is exact.
"""

from __future__ import annotations

from fractions import Fraction
from math import comb
from typing import List, Optional, Sequence, Tuple

Bern = List[Fraction]


def to_bernstein(coeffs: Sequence, degree: int | None = None) -> Bern:
    """Bernstein coefficients on [0,1] of sum coeffs[j] t^j (degree-elevated to `degree`)."""
    n = len(coeffs) - 1 if degree is None else degree
    a = [Fraction(c) for c in coeffs] + [Fraction(0)] * (n + 1 - len(coeffs))
    return [sum(Fraction(comb(k, j), comb(n, j)) * a[j] for j in range(k + 1)) for k in range(n + 1)]


def split(b: Bern) -> Tuple[Bern, Bern]:
    """de Casteljau split at the midpoint: Bernstein coefficients on both halves."""
    left, right = [b[0]], [b[-1]]
    cur = list(b)
    while len(cur) > 1:
        cur = [(cur[i] + cur[i + 1]) / 2 for i in range(len(cur) - 1)]
        left.append(cur[0])
        right.append(cur[-1])
    return left, right[::-1]


def positive_on_unit_interval(coeffs: Sequence, max_depth: int = 40) -> bool:
    """True iff sum coeffs[j] t^j > 0 for every t in the closed interval [0, 1]."""
    if not coeffs:
        return False
    stack = [(to_bernstein(coeffs), 0)]
    while stack:
        b, depth = stack.pop()
        if b[0] <= 0 or b[-1] <= 0:  # value at an endpoint of the subinterval
            return False
        if all(c > 0 for c in b):
            continue
        if depth >= max_depth:
            raise RuntimeError("Bernstein subdivision did not terminate (polynomial nearly touches 0)")
        l, r = split(b)
        stack.append((l, depth + 1))
        stack.append((r, depth + 1))
    return True


def nonnegative_on_unit_interval(coeffs: Sequence, max_depth: int = 30) -> bool:
    """Sufficient test (may return False spuriously for touching roots) for p >= 0 on [0, 1]."""
    stack = [(to_bernstein(coeffs), 0)]
    while stack:
        b, depth = stack.pop()
        if b[0] < 0 or b[-1] < 0:
            return False
        if all(c >= 0 for c in b):
            continue
        if depth >= max_depth:
            return False
        l, r = split(b)
        stack.append((l, depth + 1))
        stack.append((r, depth + 1))
    return True


def ratio_upper_bound(num: Sequence, den: Sequence, rel_tol: Fraction = Fraction(1, 10 ** 6), max_depth: int = 30) -> Fraction:
    """Rigorous upper bound for max_{t in [0,1]} num(t)/den(t), assuming den > 0 on [0,1].

    Branch and bound over de Casteljau subdivisions; on each subinterval
    num/den <= max(Bern(num)) / min(Bern(den)) (or / max(Bern(den)) if the numerator
    enclosure is negative).  Stops refining an interval once its enclosure is within
    rel_tol of the best value found at a sample point.
    """
    n = max(len(num), len(den)) - 1
    bn0, bd0 = to_bernstein(num, n), to_bernstein(den, n)
    if bd0[0] <= 0 or bd0[-1] <= 0:
        raise ValueError("denominator not positive on [0,1]")

    def enclose(bn: Bern, bd: Bern) -> Optional[Fraction]:
        lo_d = min(bd)
        if lo_d <= 0:
            return None  # enclosure too coarse: subdivide
        hi_n = max(bn)
        return hi_n / lo_d if hi_n >= 0 else hi_n / max(bd)

    # lower bound from endpoint values (Bernstein end coefficients are exact values)
    best_val = max(bn0[0] / bd0[0], bn0[-1] / bd0[-1])
    stack = [(bn0, bd0, 0)]
    upper = Fraction(0)
    first = True
    while stack:
        bn, bd, depth = stack.pop()
        if bd[0] <= 0 or bd[-1] <= 0:
            raise ValueError("denominator not positive on [0,1]")
        best_val = max(best_val, bn[0] / bd[0], bn[-1] / bd[-1])
        ub = enclose(bn, bd)
        if ub is None:
            if depth >= max_depth:
                raise ValueError("denominator not provably positive on a subinterval")
        elif ub <= best_val * (1 + rel_tol) or depth >= max_depth:
            upper = ub if first else max(upper, ub)
            first = False
            continue
        ln, rn = split(bn)
        ld, rd = split(bd)
        stack.append((ln, ld, depth + 1))
        stack.append((rn, rd, depth + 1))
    return max(upper, best_val)


def poly_mul(a: Sequence, b: Sequence) -> List:
    out = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                out[i + j] += x * y
    return out


def poly_eval(a: Sequence, t) -> Fraction:
    v = Fraction(0)
    for c in reversed(a):
        v = v * t + c
    return v
