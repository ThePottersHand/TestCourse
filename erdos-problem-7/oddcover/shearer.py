r"""Shearer (optimal Lovász Local Lemma) certificates for congruence systems.

Setting
-------
Let N be a positive integer and D = {d : d | N, d > 1}.  Choose, for each d in D,
a residue class A_d = a_d + dZ.  View Z/NZ as a probability space with the uniform
measure; by the Chinese Remainder Theorem it is the product of the spaces
Z/p^e Z (p^e || N), and the event A_d depends only on the coordinates p | d.
Hence A_d is mutually independent of {A_d' : gcd(d, d') = 1}: the graph G_N on D
with d ~ d' iff gcd(d, d') > 1 is a dependency graph, and P(A_d) = 1/d.

Shearer's theorem.  Write Z_W(-p) = sum over independent sets I of G[W] of
prod_{i in I} (-p_i).  If Z_W(-p) > 0 for every W, then
    P(no A_d occurs) >= Z_D(-p) > 0.
Scott and Sokal showed (and it is elementary, see README) that this hypothesis is
equivalent to  Z_D(-lambda p) > 0  for all 0 <= lambda <= 1.

Block formula.  Independent sets of G_N are sets of pairwise coprime divisors.
Grouping them by the supports of their elements (a partial partition pi of the set
of primes of N) gives
    Z_D(-lambda p) = F_lambda(x) := sum_{pi} prod_{B in pi} ( -lambda prod_{p in B} x_p ),
where x_p = x_p(e) = sum_{i=1}^{e} p^{-i} (p^e || N).  For fixed lambda this is
multi-affine in (x_p), so its minimum over a box prod_p [0, X_p] is attained at a
corner: this is what lets one certify *infinite* families of N at once.

Consequently: if F_lambda(x) > 0 for all lambda in [0, 1], then NO choice of
residues a_d (d | N, d > 1) covers the integers, and every such system leaves a
set of density at least F_1(x) uncovered.

All arithmetic in this module is exact.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from typing import Dict, List, Optional, Sequence, Tuple

from .arith import Factorization, factorize, prime_power_weight
from .poly import positive_on_unit_interval

Poly = List[int]  # integer coefficients, index = power of lambda


# ---------------------------------------------------------------------------
# Independence polynomial in block form
# ---------------------------------------------------------------------------

def _block_counts_int(us: Sequence[int], vs: Sequence[int]) -> List[int]:
    """Return integer coefficients C_j such that, with x_i = us[i]/vs[i] and
    V = prod vs, V * c_j = C_j where c_j = sum over partial partitions of {0..k-1}
    into j blocks of prod_{blocks} prod_{i in block} x_i."""
    k = len(us)
    full = (1 << k) - 1
    uT = [1] * (1 << k)
    for m in range(1, 1 << k):
        low = (m & -m).bit_length() - 1
        uT[m] = uT[m & (m - 1)] * us[low]
    Q: List[Optional[List[int]]] = [None] * (1 << k)
    Q[0] = [1]
    for S in range(1, 1 << k):
        i = (S & -S).bit_length() - 1
        Sp = S & ~(1 << i)
        size = bin(S).count("1") + 1
        res = [0] * size
        for j, c in enumerate(Q[Sp]):
            res[j] += vs[i] * c
        T = Sp
        while True:
            w = us[i] * uT[T]
            for j, c in enumerate(Q[Sp & ~T]):
                res[j + 1] += w * c
            if T == 0:
                break
            T = (T - 1) & Sp
        Q[S] = res
    return Q[full]


@dataclass(frozen=True)
class ShearerPoly:
    """Z(lambda) = sum_j coeffs[j] * lambda^j / denom  (exact)."""

    coeffs: Tuple[int, ...]
    denom: int

    def at(self, lam: Fraction) -> Fraction:
        v = Fraction(0)
        for c in reversed(self.coeffs):
            v = v * lam + c
        return v / self.denom

    @property
    def z1(self) -> Fraction:
        return Fraction(sum(self.coeffs), self.denom)


def shearer_poly_from_weights(xs: Sequence[Fraction]) -> ShearerPoly:
    """Z(lambda) = F_lambda(x) for prime weights x (one per prime)."""
    us = [x.numerator for x in xs]
    vs = [x.denominator for x in xs]
    V = 1
    for v in vs:
        V *= v
    C = _block_counts_int(us, vs)
    coeffs = tuple(((-1) ** j) * c for j, c in enumerate(C))
    return ShearerPoly(coeffs, V)


def prime_weights(fac: Factorization) -> List[Fraction]:
    return [prime_power_weight(p, e) for p, e in fac]


def shearer_poly(N: int) -> ShearerPoly:
    """Z_{D_{>1}(N)}(-lambda p) as a polynomial in lambda."""
    return shearer_poly_from_weights(prime_weights(factorize(N)))


def shearer_poly_blocks(k: int, s: Dict[int, Fraction]) -> ShearerPoly:
    """General block form: s[mask] is the total weight (sum of 1/m, with multiplicity)
    of the events whose prime support is the set `mask` (k primes, masks 1..2^k-1).

    Used for multisets of moduli (e.g. fibres/slices).  Independent sets pick at most
    one event per support and pairwise disjoint supports, so
        Z(-lambda p) = sum_{pi} prod_{B in pi} (-lambda s_B).
    """
    den = 1
    for v in s.values():
        den = den * v.denominator // _gcd(den, v.denominator)
    S = {m: int(v * den) for m, v in s.items()}
    # Q(S) polynomial in mu with coefficients scaled by den^{#blocks}; to keep a single
    # denominator we scale block weights by den and track powers of den per block count.
    Q: List[Optional[List[int]]] = [None] * (1 << k)
    Q[0] = [1]
    for mask in range(1, 1 << k):
        i = (mask & -mask).bit_length() - 1
        Sp = mask & ~(1 << i)
        size = bin(mask).count("1") + 1
        res = [0] * size
        for j, c in enumerate(Q[Sp]):
            res[j] += c
        T = Sp
        while True:
            w = S.get(T | (1 << i), 0)
            if w:
                for j, c in enumerate(Q[Sp & ~T]):
                    res[j + 1] += w * c
            if T == 0:
                break
            T = (T - 1) & Sp
        Q[mask] = res
    top = Q[(1 << k) - 1]
    n = len(top) - 1
    # coefficient of lambda^j is (-1)^j top[j] / den^j ; bring to common denominator den^n
    coeffs = tuple(((-1) ** j) * c * den ** (n - j) for j, c in enumerate(top))
    return ShearerPoly(coeffs, den ** n)


def shearer_poly_moduli(moduli: Sequence[int]) -> ShearerPoly:
    """Shearer polynomial for an arbitrary (multi)set of moduli, grouped by prime support."""
    primes: List[int] = sorted({p for m in moduli for p, _ in factorize(m)})
    idx = {p: i for i, p in enumerate(primes)}
    s: Dict[int, Fraction] = {}
    for m in moduli:
        mask = 0
        for p, _ in factorize(m):
            mask |= 1 << idx[p]
        s[mask] = s.get(mask, Fraction(0)) + Fraction(1, m)
    return shearer_poly_blocks(len(primes), s)


def _gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Certificate:
    N: int
    factorization: Factorization
    certified: bool
    uncovered_lower_bound: Fraction  # Z_D(-p) = F_1(x); meaningful only if certified


def certify(N: int) -> Certificate:
    """Shearer certificate for a single modulus bound N."""
    fac = factorize(N)
    P = shearer_poly_from_weights(prime_weights(fac))
    ok = positive_on_unit_interval(P.coeffs)
    return Certificate(N, fac, ok, P.z1)


def certify_factorization(fac: Factorization) -> Certificate:
    P = shearer_poly_from_weights(prime_weights(fac))
    N = 1
    for p, e in fac:
        N *= p ** e
    return Certificate(N, fac, positive_on_unit_interval(P.coeffs), P.z1)


def certify_box(xmax: Sequence[Fraction]) -> Tuple[bool, Fraction]:
    """Certify every N whose sorted prime weights are dominated by xmax.

    xmax[i] is an upper bound for the weight of the i-th prime (in any order; the block
    polynomial is symmetric).  Returns (ok, min over corners of F_1).  By multi-affinity,
    ok implies: for every weight vector 0 <= x <= xmax (coordinatewise) and every lambda
    in [0,1], F_lambda(x) >= min over corners > 0.
    """
    k = len(xmax)
    ok = True
    worst: Optional[Fraction] = None
    for mask in range(1 << k):
        xs = [xmax[i] for i in range(k) if mask >> i & 1]
        P = shearer_poly_from_weights(xs)
        if not positive_on_unit_interval(P.coeffs):
            ok = False
        z = P.z1
        worst = z if worst is None or z < worst else worst
    return ok, worst  # type: ignore[return-value]
