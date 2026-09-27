"""Soundness check: the certificates must never 'certify' a known covering number.

The primitive covering numbers below 10^6 are taken from McNew-Setty, Table 2 (all even;
773500 is listed there as unknown and omitted).  Every multiple of a covering number is a
covering number.  We run the Shearer, slice and tree certificates on all these numbers and
on many of their multiples and check that none of them fires.  We also re-verify a few of
them directly by constructing an explicit covering with CP-SAT.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from oddcover.arith import factorize
from oddcover.shearer import certify_factorization
from oddcover.slices import slice_certificate, tree_certificate

PRIMITIVE = [12, 80, 90, 210, 280, 378, 448, 1386, 1650, 2200, 2464, 5346, 9750, 11264, 11466, 13000,
             14994, 18954, 20384, 23166, 26656, 27846, 30294, 31122, 33150, 33858, 36608, 37050, 37674,
             44200, 44850, 49400, 49504, 53248, 53900, 55328, 59800, 63750, 66976, 71250, 72930, 85000,
             95000, 95744, 97240, 100100, 107008, 107406, 112112, 117306, 120042, 131274, 142002, 145314,
             192500, 208544, 223074, 242250, 252448, 272272, 293250, 311168, 318500, 323000, 369750,
             385434, 391000, 395250, 423500, 431250, 450846, 452608, 485982, 493000, 505856, 519498,
             527000, 568458, 575000, 612352, 617526, 654500, 660114, 685216, 731500, 735150, 747954,
             785850, 863968, 885500, 896610, 909568, 923552, 980200]


def any_certificate(fac):
    if certify_factorization(fac).certified:
        return 'shearer'
    for q, e in fac:
        if e == 1:
            c = slice_certificate(fac, q)
            if c is not None and c.certified:
                return 'slice q=%d' % q
        t = tree_certificate(fac, q)
        if t is not None and t.certified:
            return 'tree q=%d' % q
    return None


def main():
    tested = 0
    for n in PRIMITIVE:
        for k in (1, 2, 3, 5, 7, 9, 11, 13, 15, 21):
            N = n * k
            if N > 10 ** 7:
                continue
            fac = factorize(N)
            r = any_certificate(fac)
            tested += 1
            if r is not None:
                print('UNSOUND: covering number', N, fac, 'certified by', r)
                return 1
    print('no certificate fired on %d known covering numbers' % tested)

    from oddcover.exact import max_coverage
    for n in [12, 80, 90, 210, 280, 378, 448]:
        best, ub, status, res = max_coverage(n, time_limit=60)
        print('  explicit covering found for %d: %s' % (n, best == n))
        assert best == n
    return 0


if __name__ == '__main__':
    sys.exit(main())
