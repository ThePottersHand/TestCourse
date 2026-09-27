"""The certificates must never fire on a covering number, and Shearer's bound must hold."""
import random

import pytest

from oddcover.arith import divisors, factorize
from oddcover.exact import covered_count, is_covering, max_coverage
from oddcover.poly import positive_on_unit_interval
from oddcover.shearer import certify_factorization, shearer_poly_moduli
from oddcover.slices import slice_certificate, tree_certificate

COVERING = [12, 80, 90, 210, 280, 378, 448, 960, 1386, 1650, 2200, 2464, 5346, 9750, 11264]


def fires(fac):
    if certify_factorization(fac).certified:
        return True
    for q, e in fac:
        if e == 1:
            c = slice_certificate(fac, q)
            if c is not None and c.certified:
                return True
        t = tree_certificate(fac, q)
        if t is not None and t.certified:
            return True
    return False


@pytest.mark.parametrize('n', COVERING)
def test_no_certificate_on_covering_numbers(n):
    for k in (1, 3, 5):
        assert not fires(factorize(n * k))


def test_classic_covering():
    assert is_covering([(0, 2), (0, 3), (1, 4), (1, 6), (11, 12)])


def test_certificates_fire_on_odd_examples():
    for N in (11486475, 34459425, 43648605):
        assert fires(factorize(N))


def test_shearer_bound_against_exact_optimum():
    rng = random.Random(7)
    checked = 0
    for _ in range(12):
        N = rng.choice([30, 36, 45, 60, 63, 75, 90, 105, 135])
        divs = [d for d in divisors(N) if d > 1]
        moduli = sorted(rng.sample(divs, rng.randint(2, len(divs))))
        P = shearer_poly_moduli(moduli)
        best, ub, status, res = max_coverage(N, moduli, time_limit=20)
        assert covered_count([(a, d) for d, a in res.items()], N) == best
        if status == 'OPTIMAL' and positive_on_unit_interval(P.coeffs):
            assert best <= N * (1 - P.z1)
            checked += 1
    assert checked >= 3
