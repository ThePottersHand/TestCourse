import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    'literature_checks', Path(__file__).resolve().parent.parent / 'scripts' / 'literature_checks.py')
lit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lit)


def test_multiset_counterexample():
    lit.check_a()


def test_theorem_411_counterexample():
    lit.check_c()
