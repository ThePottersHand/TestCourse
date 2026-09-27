"""Exact checks of three statements from the recent literature (see README, section 3).

(a) McNew-Setty, "On the densities of covering numbers and abundant numbers", Lemma 4.10,
    states: for ANY set or multiset M of moduli, the proportion covered by any residue system
    with moduli M is at most  B(M) = sum_{S subset M, S != {}, S pairwise coprime} (-1)^{|S|+1}/lcm S.
    A multiset counterexample: M = {2,2,2,3,3,3,3}.
(b) The same statement fails for sets of distinct moduli: M = {2,3,4,6,12} u {5k : k in K},
    K = the integers coprime to 6 below a bound x with sum 1/(5k) > 1.  Here all pairwise
    coprime subsets have size <= 3, so B(M) also equals the truncated bound of
    Harrington-Klein-Lowrance-Trifonov, Theorem 1.9 -- this answers their Problem 4
    (whether Theorem 1.9 holds without the condition L = 2^a 3^b 5^c) negatively.
(c) McNew-Setty, Theorem 4.11, fails as stated for n = 960 = 64 * 15 with ell = 64.

In each case the system {0 mod 2, 0 mod 3, 1 mod 4, 1 mod 6, 11 mod 12} (or a subsystem)
covers Z, while the claimed upper bound on the covered proportion is < 1.
"""
import sys
from pathlib import Path
from fractions import Fraction
from itertools import combinations
from math import gcd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from oddcover.exact import is_covering

CLASSIC = [(0, 2), (0, 3), (1, 4), (1, 6), (11, 12)]


def pairwise_coprime_bound_bruteforce(moduli):
    """B(M) by brute force over all subsets (only for small M)."""
    total = Fraction(0)
    n = len(moduli)
    for r in range(1, n + 1):
        for S in combinations(range(n), r):
            ms = [moduli[i] for i in S]
            if all(gcd(a, b) == 1 for a, b in combinations(ms, 2)):
                L = 1
                for m in ms:
                    L *= m
                total += Fraction((-1) ** (r + 1), L)
    return total


def check_a():
    M = [2, 2, 2, 3, 3, 3, 3]
    B = pairwise_coprime_bound_bruteforce(M)
    covers = is_covering([(0, 2), (1, 2)])  # uses two of the three copies of 2
    print('(a) multiset M =', M, ' claimed bound B(M) =', B, ' but {0,1 mod 2} covers Z:', covers)
    assert B == Fraction(5, 6) and covers


def check_b():
    assert is_covering(CLASSIC)
    C1 = [2, 3, 4, 6, 12]
    # D = {5k : k coprime to 6, k <= x}, all pairwise non-coprime (common factor 5) and coprime to C1.
    S = Fraction(0)
    k = 0
    count = 0
    while S <= 1:
        k += 1
        if gcd(k, 6) == 1:
            S += Fraction(1, 5 * k)
            count += 1
    # Pairwise coprime subsets of C1 u D: those of C1 ({2},{3},{4},{6},{12},{2,3},{3,4}),
    # each optionally together with exactly one element of D.  Hence
    # B(M) = e1 - e2 + e3 with e1 = 4/3 + S, e2 = 1/4 + (4/3) S, e3 = S/4.
    e1 = Fraction(4, 3) + S
    e2 = Fraction(1, 4) + Fraction(4, 3) * S
    e3 = S / 4
    B = e1 - e2 + e3
    assert B == Fraction(13, 12) - S / 12
    # sanity check of the subset structure on a small initial piece of D by brute force
    small_D = [5 * j for j in range(1, 30) if gcd(j, 6) == 1][:4]
    Sd = sum(Fraction(1, d) for d in small_D)
    assert pairwise_coprime_bound_bruteforce(C1 + small_D) == Fraction(13, 12) - Sd / 12
    print('(b) distinct moduli: C1 = {2,3,4,6,12} plus %d moduli 5k (k <= %d, gcd(k,6)=1, largest %d);' % (count, k, 5 * k))
    print('    S = sum over D of 1/d = 1 + %.3e > 1, so B(M) = 13/12 - S/12 = 1 - %.3e < 1,' % (float(S - 1), float(1 - B)))
    print('    yet C1 alone covers Z.')
    assert B < 1


def stirling2(n, k):
    if n == k:
        return 1
    if k == 0 or k > n:
        return 0
    return k * stirling2(n - 1, k) + stirling2(n - 1, k - 1)


def Bgen(r, n):
    """B(r, n) = - sum_{k=1}^n (-r)^k S2(n, k)   (McNew-Setty, Section 4.2)."""
    return -sum((-r) ** k * stirling2(n, k) for k in range(1, n + 1))


def check_c():
    ell, b = 64, 15
    n = ell * b
    # 64 is almost-covering: classes 1 mod 2, 2 mod 4, ..., 32 mod 64 miss only 0 mod 64
    almost = [(2 ** (i - 1), 2 ** i) for i in range(1, 7)]
    from oddcover.exact import covered_count
    assert covered_count(almost, 64) == 63  # and 64 is not covering since sum 1/2^i < 1
    tau = 7
    divs = [3, 5, 15]
    omega = {3: 1, 5: 1, 15: 2}
    bound = 1 + Fraction(ell - 1, ell) + Fraction(1, ell) * sum(Fraction(Bgen(tau, omega[d]), d) for d in divs)
    covering_960 = is_covering(CLASSIC) and all(n % m == 0 for _, m in CLASSIC)
    print('(c) Theorem 4.11 with n = 960, ell = 64, b = 15 gives c(960) <= %s = %.6f < 2,' % (bound, float(bound)))
    print('    but 960 is a covering number (12 | 960), i.e. c(960) = 2:', covering_960)
    assert bound < 2 and covering_960


if __name__ == '__main__':
    check_a()
    check_b()
    check_c()
