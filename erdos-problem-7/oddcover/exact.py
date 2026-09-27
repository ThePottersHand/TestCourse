"""Exact (brute-force / CP-SAT) computations on small instances.

These are used to cross-check the certificates, never as part of a proof of a
large result.  ``covered_count`` is a direct, independent verifier.
"""

from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np

from .arith import divisors

System = Sequence[Tuple[int, int]]  # [(residue, modulus), ...]


def lcm_of(moduli: Iterable[int]) -> int:
    from math import gcd

    L = 1
    for m in moduli:
        L = L * m // gcd(L, m)
    return L


def covered_mask(system: System, L: Optional[int] = None) -> np.ndarray:
    """Boolean array over Z/L marking the residues covered by the system."""
    if L is None:
        L = lcm_of(m for _, m in system)
    mask = np.zeros(L, dtype=bool)
    for a, m in system:
        if L % m:
            raise ValueError("modulus %d does not divide L=%d" % (m, L))
        mask[a % m :: m] = True
    return mask


def covered_count(system: System, L: Optional[int] = None) -> int:
    return int(covered_mask(system, L).sum())


def is_covering(system: System) -> bool:
    return bool(covered_mask(system).all())


def max_coverage(
    N: int,
    moduli: Optional[Sequence[int]] = None,
    time_limit: float = 60.0,
    workers: int = 4,
) -> Tuple[int, int, str, Dict[int, int]]:
    """Maximum number of residues mod N coverable by one class for each modulus in `moduli`
    (default: all divisors d > 1 of N).  Uses OR-tools CP-SAT.

    Returns (best_found, proven_upper_bound, status_name, residues).
    """
    from ortools.sat.python import cp_model

    if moduli is None:
        moduli = [d for d in divisors(N) if d > 1]
    moduli = list(moduli)
    model = cp_model.CpModel()
    x: Dict[Tuple[int, int], object] = {}
    for idx, d in enumerate(moduli):
        vs = [model.NewBoolVar("x_%d_%d" % (idx, a)) for a in range(d)]
        for a, v in enumerate(vs):
            x[(idx, a)] = v
        model.AddExactlyOne(vs)
    # translation symmetry: fix the residue of the first modulus
    model.Add(x[(0, 0)] == 1)
    y = [model.NewBoolVar("y_%d" % n) for n in range(N)]
    for n in range(N):
        model.AddBoolOr([x[(idx, n % d)] for idx, d in enumerate(moduli)] + [y[n].Not()])
    model.Maximize(sum(y))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.num_workers = workers
    status = solver.Solve(model)
    res: Dict[int, int] = {}
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for idx, d in enumerate(moduli):
            for a in range(d):
                if solver.Value(x[(idx, a)]):
                    res[idx] = a
        best = int(round(solver.ObjectiveValue()))
    else:
        best = -1
    return best, int(round(solver.BestObjectiveBound())), solver.StatusName(status), {moduli[i]: a for i, a in res.items()}
