from fractions import Fraction

from oddcover.arith import (abundancy, divisors, enumerate_odd_abundant, factorize, is_abundant,
                            largest_prime_bound, prime_power_weight, sigma)


def test_factorize_and_sigma():
    assert factorize(945) == ((3, 3), (5, 1), (7, 1))
    assert sigma(945) == 1920
    assert abundancy(12) == Fraction(7, 3)
    assert divisors(12) == [1, 2, 3, 4, 6, 12]


def test_prime_power_weight():
    assert prime_power_weight(3, 2) == Fraction(1, 3) + Fraction(1, 9)


def test_enumerator_matches_brute_force():
    got = sorted(n for n, _ in enumerate_odd_abundant(0, 30000))
    assert got == [n for n in range(1, 30001, 2) if is_abundant(n)]
    assert got[0] == 945


def test_enumerator_window():
    got = sorted(n for n, _ in enumerate_odd_abundant(200000, 260000))
    assert got == [n for n in range(200001, 260001, 2) if is_abundant(n)]


def test_largest_prime_bound():
    for hi in (10 ** 4, 10 ** 5):
        b = largest_prime_bound(hi)
        for n, fac in enumerate_odd_abundant(0, hi):
            assert fac[-1][0] <= b
