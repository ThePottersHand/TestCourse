from oddcover.families import family_slice_certified, family_tree_certified, uncertified_sets


def test_four_prime_sets_all_certified():
    bad, _ = uncertified_sets(4)
    assert bad == []


def test_five_prime_sets():
    bad, maximal = uncertified_sets(5)
    assert bad == [(3, 5, 7, 11, 13), (3, 5, 7, 11, 17), (3, 5, 7, 11, 19)]
    assert maximal == [(3, 5, 7, 11, 19)]


def test_theorem_B_pieces():
    assert family_tree_certified((3, 5, 7, 11, 17), (17,))[0]
    assert family_tree_certified((3, 5, 7, 11, 19), (19,))[0]
    for q in (3, 5, 7):
        assert family_slice_certified((3, 5, 7, 11, 13), q)[0]
