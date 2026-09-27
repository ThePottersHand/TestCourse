"""Elementary arithmetic used throughout: primes, factorisation, divisors, abundancy.

Everything here is exact (Python integers / ``fractions.Fraction``); nothing
depends on floating point.
"""

from __future__ import annotations

from fractions import Fraction
from functools import lru_cache
from typing import Dict, Iterator, List, Tuple

Factorization = Tuple[Tuple[int, int], ...]  # ((p1, e1), (p2, e2), ...) with p1 < p2 < ...


def primes_upto(n: int) -> List[int]:
    """All primes <= n (sieve of Eratosthenes)."""
    if n < 2:
        return []
    sieve = bytearray([1]) * (n + 1)
    sieve[0] = sieve[1] = 0
    for i in range(2, int(n ** 0.5) + 1):
        if sieve[i]:
            sieve[i * i :: i] = bytearray(len(sieve[i * i :: i]))
    return [i for i in range(n + 1) if sieve[i]]


def factorize(n: int) -> Factorization:
    """Prime factorisation of n >= 1 by trial division (fine for n < 10^12)."""
    if n < 1:
        raise ValueError("n must be positive")
    out = []
    d = 2
    while d * d <= n:
        if n % d == 0:
            e = 0
            while n % d == 0:
                n //= d
                e += 1
            out.append((d, e))
        d += 1 if d == 2 else 2
    if n > 1:
        out.append((n, 1))
    return tuple(out)


def from_factorization(fac: Factorization) -> int:
    n = 1
    for p, e in fac:
        n *= p ** e
    return n


def divisors(n: int) -> List[int]:
    """Sorted list of all positive divisors of n."""
    divs = [1]
    for p, e in factorize(n):
        divs = [d * p ** k for d in divs for k in range(e + 1)]
    return sorted(divs)


def sigma(n: int) -> int:
    """Sum of divisors."""
    s = 1
    for p, e in factorize(n):
        s *= (p ** (e + 1) - 1) // (p - 1)
    return s


def abundancy(n: int) -> Fraction:
    """h(n) = sigma(n)/n."""
    return Fraction(sigma(n), n)


def is_abundant(n: int) -> bool:
    """sigma(n) > 2n.  A covering number (distinct moduli > 1 dividing n) must be abundant:
    the moduli have density at most h(n) - 1, and a distinct covering cannot be exact
    (Davenport-Mirsky-Newman-Rado), so h(n) - 1 > 1."""
    return sigma(n) > 2 * n


def prime_power_weight(p: int, e: int) -> Fraction:
    """x_p(e) = sum_{i=1}^{e} p^{-i} = (p^e - 1) / ((p - 1) p^e).

    This is the total density of the moduli p, p^2, ..., p^e.
    """
    return Fraction(p ** e - 1, (p - 1) * p ** e)


def support(n: int) -> Tuple[int, ...]:
    return tuple(p for p, _ in factorize(n))


def _max_odd_abundancy_below(n: int) -> Fraction:
    """max h(M) over odd M < n (exact)."""
    return max(abundancy(m) for m in range(1, n, 2))


def largest_prime_bound(hi: int) -> int:
    """Every prime factor of an odd abundant N <= hi is <= this bound.

    Let q be the largest prime factor of N and q^e || N.  If N/q^e >= 945 then
    q <= q^e <= hi/945.  Otherwise M = N/q^e is odd and < 945, so
    h(M) <= H := max{h(M) : M odd, M < 945} < 2 (945 is the least odd abundant
    number), and 2 < h(N) < H q/(q-1) forces q < 2/(2-H).
    """
    H = _max_odd_abundancy_below(945)
    assert H < 2
    q_small = int(Fraction(2) / (2 - H)) + 1
    return max(hi // 945, q_small)


def enumerate_odd_abundant(lo: int, hi: int) -> Iterator[Tuple[int, Factorization]]:
    """Yield every odd abundant N with lo < N <= hi, together with its factorisation.

    Depth-first search over odd primes in increasing order.  A branch with current
    value N (largest prime used p) is pruned when even the most favourable extension
    within the budget hi // N cannot make the abundancy exceed 2: an extension m by
    primes > p with m <= hi // N has at most k distinct prime factors, where k is the
    largest number of consecutive admissible primes whose product fits in the budget,
    and h(m) < prod_{q | m} q/(q-1) <= the product of q/(q-1) over the k smallest
    admissible primes.  All comparisons are exact; completeness of the prime list
    follows from ``largest_prime_bound``.
    """
    primes = [p for p in primes_upto(largest_prime_bound(hi)) if p > 2]
    two = Fraction(2)

    def bound_ext(N: int, h: Fraction, idx: int) -> Fraction:
        budget = hi // N
        r = h
        prod = 1
        j = idx
        while j < len(primes) and prod * primes[j] <= budget:
            prod *= primes[j]
            r *= Fraction(primes[j], primes[j] - 1)
            j += 1
        return r

    stack: List[Tuple[int, int, Fraction, Factorization]] = [(1, 0, Fraction(1), ())]
    while stack:
        N, idx, h, fac = stack.pop()
        if N > lo and h > two:
            yield N, fac
        for j in range(idx, len(primes)):
            p = primes[j]
            if N * p > hi:
                break
            if bound_ext(N, h, j) <= two:
                break
            q, e = p, 1
            while N * q <= hi:
                hq = h * Fraction(q * p - 1, q * (p - 1))
                stack.append((N * q, j + 1, hq, fac + ((p, e),)))
                q *= p
                e += 1


@lru_cache(maxsize=None)
def odd_primes_from(start: int, count: int) -> Tuple[int, ...]:
    """The first `count` odd primes >= start."""
    out: List[int] = []
    n = max(3, start)
    if n % 2 == 0:
        n += 1
    while len(out) < count:
        if all(n % p for p in range(3, int(n ** 0.5) + 1, 2)):
            out.append(n)
        n += 2
    return tuple(out)
