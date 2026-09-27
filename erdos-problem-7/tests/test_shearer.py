from fractions import Fraction
from itertools import combinations
from math import gcd

from oddcover.arith import divisors
from oddcover.poly import positive_on_unit_interval, ratio_upper_bound
from oddcover.shearer import certify, certify_box, shearer_poly, shearer_poly_moduli


def brute_independence_poly(moduli):
    """Coefficients of Z(lambda) = sum over pairwise coprime subsets S of prod(-lambda/m)."""
    coeffs = [Fraction(0)] * (len(moduli) + 1)
    for r in range(len(moduli) + 1):
        for S in combinations(moduli, r):
            if all(gcd(a, b) == 1 for a, b in combinations(S, 2)):
                w = Fraction((-1) ** r)
                for m in S:
                    w /= m
                coeffs[r] += w
    while len(coeffs) > 1 and coeffs[-1] == 0:
        coeffs.pop()
    return coeffs


def test_block_formula_matches_brute_force():
    for N in (945, 3 * 5 * 7 * 11, 3 ** 2 * 5 ** 2 * 7, 2 ** 3 * 3 * 5, 12):
        P = shearer_poly(N)
        got = [Fraction(c, P.denom) for c in P.coeffs]
        want = brute_independence_poly([d for d in divisors(N) if d > 1])
        got += [Fraction(0)] * (len(want) - len(got))
        assert got[: len(want)] == want and all(c == 0 for c in got[len(want):])


def test_multiset_block_form():
    moduli = [3, 3, 5, 15, 9, 7]
    P = shearer_poly_moduli(moduli)
    got = [Fraction(c, P.denom) for c in P.coeffs]
    want = brute_independence_poly(moduli)
    got += [Fraction(0)] * (len(want) - len(got))
    assert got[: len(want)] == want


def test_known_values():
    c = certify(945)
    assert c.certified and c.uncovered_lower_bound == Fraction(179, 945)
    assert not certify(12).certified  # 12 is a covering number
    assert not certify(11486475).certified  # first odd abundant N outside the Shearer region


def test_theorem_A_box():
    ok, worst = certify_box([Fraction(1, p - 1) for p in (3, 5, 7, 11)])
    assert ok and worst == Fraction(1, 32)
    ok5, _ = certify_box([Fraction(1, p - 1) for p in (3, 5, 7, 11, 13)])
    assert not ok5


def test_positivity_and_ratio():
    assert positive_on_unit_interval([1, -1, Fraction(1, 5)])  # 1 - t + t^2/5 > 0
    assert not positive_on_unit_interval([1, -2, 1])  # (1-t)^2 vanishes at 1
    assert not positive_on_unit_interval([1, -3, 2])  # (1-t)(1-2t)
    ub = ratio_upper_bound([0, 1], [1, Fraction(-1, 2)])  # t/(1-t/2), max 2 at t=1
    assert 2 <= ub <= 2 * (1 + Fraction(1, 10 ** 6))
