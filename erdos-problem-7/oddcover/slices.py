r"""Slice certificates: Shearer's bound applied fibrewise over a prime q with q || N.

Write N = qM with gcd(q, M) = 1.  Every modulus d | N, d > 1, is either a divisor
of M ("base" modulus) or d = qm with m | M ("top" modulus).  Identify
Z/N = Z/q x Z/M.  A base class is (all of Z/q) x (class mod d); a top class
a + qmZ lies entirely in the slice {a mod q} x Z/M, where it is a class mod m.

Suppose the system covers Z/N; w.l.o.g. every divisor > 1 of N is used (adding classes
never hurts).  Then every slice s in Z/q is covered by the base classes together with the
top classes assigned to s.  At most one slice receives m = 1 (the modulus q itself).

Linearised Shearer bound in one slice.  Let F(mu) be the Shearer polynomial of the base
(all divisors > 1 of M), assumed positive on [0, 1] (i.e. M is Shearer-certified), and
for a set B of primes of M let G_B(mu) be the Shearer polynomial of the base divisors
coprime to B.  Adding the top events e of a slice one at a time and using
    Z_{W+e} = Z_W - mu p_e Z_{W \ N(e)},   Z_{W \ N(e)} <= Z_{base \ N(e)} = G_{supp(e)},
(monotonicity inside the Shearer region, justified by the continuity argument in the
README) gives  Z_slice(mu) >= F(mu) - mu * sum_e G_{supp e}(mu) / m_e.  Hence a covered
slice must satisfy, with
    K_B := max_{mu in [0,1]} mu G_B(mu) / F(mu),
    sum_{top moduli qm in the slice} K_{supp m} / m  >=  1.
So the q - 1 slices without m = 1 need disjoint sets of "items" m | M, m > 1, of sizes
K_{supp m}/m, each of total size >= 1.  A bin either contains an item of size >= 1 or
at least 1 worth of smaller items, so the number of such bins is at most
    #{items of size >= 1} + floor(sum of the sizes < 1).
If this is < q - 1, N is not a covering number.

All quantities are computed exactly; K_B is replaced by a rigorous upper bound.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from math import floor
from typing import Dict, List, Optional, Sequence, Tuple

from .arith import Factorization, divisors, factorize, from_factorization, prime_power_weight
from .poly import positive_on_unit_interval, ratio_upper_bound
from .shearer import shearer_poly_from_weights


def _poly_fracs(P) -> List[Fraction]:
    return [Fraction(c, P.denom) for c in P.coeffs]


def block_K_bounds(Mfac: Factorization, rel_tol: Fraction = Fraction(1, 10 ** 6)) -> Optional[Dict[int, Fraction]]:
    """Upper bounds K_B for every nonempty set B of primes of M (bitmask over Mfac order).

    Returns None if M is not Shearer-certified (F not positive on [0,1])."""
    xs = [prime_power_weight(p, e) for p, e in Mfac]
    k = len(xs)
    Fp = shearer_poly_from_weights(xs)
    if not positive_on_unit_interval(Fp.coeffs):
        return None
    F = _poly_fracs(Fp)
    K: Dict[int, Fraction] = {}
    for mask in range(1, 1 << k):
        sub = [xs[i] for i in range(k) if not mask >> i & 1]
        G = _poly_fracs(shearer_poly_from_weights(sub))
        num = [Fraction(0)] + G  # mu * G(mu)
        K[mask] = ratio_upper_bound(num, F, rel_tol=rel_tol)
    return K


@dataclass(frozen=True)
class SliceCertificate:
    N: int
    q: int
    certified: bool
    big_items: int
    small_sum: Fraction
    bins_upper_bound: int  # max number of slices (other than the one with m = 1) that can be covered


def slice_certificate(fac: Factorization, q: int) -> Optional[SliceCertificate]:
    """Try to certify that N (given by its factorisation) is not a covering number by slicing over q."""
    fd = dict(fac)
    if fd.get(q) != 1:
        return None
    Mfac = tuple((p, e) for p, e in fac if p != q)
    K = block_K_bounds(Mfac)
    if K is None:
        return None
    primes = [p for p, _ in Mfac]
    M = from_factorization(Mfac)
    big = 0
    small = Fraction(0)
    for m in divisors(M):
        if m == 1:
            continue
        mask = 0
        for i, p in enumerate(primes):
            if m % p == 0:
                mask |= 1 << i
        size = K[mask] / m
        if size >= 1:
            big += 1
        else:
            small += size
    bins = big + floor(small)
    return SliceCertificate(from_factorization(fac), q, bins < q - 1, big, small, bins)


def best_slice_certificate(fac: Factorization) -> Optional[SliceCertificate]:
    """Try every prime q with q || N; return the first certificate found (or the last attempt)."""
    last = None
    for q, e in sorted(fac, key=lambda t: -t[0]):
        if e != 1:
            continue
        c = slice_certificate(fac, q)
        if c is None:
            continue
        if c.certified:
            return c
        last = c
    return last


@dataclass(frozen=True)
class TreeCertificate:
    N: int
    q: int
    f: int
    certified: bool
    lhs: Fraction  # ((q^f-1)/(q-1)) * (B + S_small): total capped load available to the leaves
    rhs: int       # q^f - (q^f-1)/(q-1): leaves that must carry load >= 1


def tree_certificate(fac: Factorization, q: int) -> Optional[TreeCertificate]:
    r"""Prime-power version of the slice argument, for q^f || N (f >= 1).

    Leaves are the q^f residues y mod q^f.  A top modulus q^j m (1 <= j <= f, m | M) is
    active on the q^{f-j} leaves y = a (mod q^j) and there restricts to a class mod m.
    A leaf not killed by a class mod q^j (m = 1) needs linear load
    l(y) = sum_{active (j,m), m>1} K_{supp m}/m >= 1.  Killers remove at most
    sum_{j=1}^f q^{f-j} leaves.  Since min(1, a+b) <= min(1,a) + min(1,b),
        sum_y min(1, l(y)) <= sum_j q^{f-j} sum_{m>1} min(1, K_{supp m}/m),
    so a covering needs  ((q^f-1)/(q-1)) (B + S_small) >= q^f - (q^f-1)/(q-1).
    """
    fd = dict(fac)
    f = fd.get(q)
    if not f:
        return None
    Mfac = tuple((p, e) for p, e in fac if p != q)
    K = block_K_bounds(Mfac)
    if K is None:
        return None
    primes = [p for p, _ in Mfac]
    M = from_factorization(Mfac)
    capped = Fraction(0)
    for m in divisors(M):
        if m == 1:
            continue
        mask = 0
        for i, p in enumerate(primes):
            if m % p == 0:
                mask |= 1 << i
        capped += min(Fraction(1), K[mask] / m)
    reach = (q ** f - 1) // (q - 1)
    lhs = reach * capped
    rhs = q ** f - reach
    return TreeCertificate(from_factorization(fac), q, f, lhs < rhs, lhs, rhs)
