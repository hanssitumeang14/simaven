import pytest

from app.adapters.pdf.renderer import rupiah, terbilang


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (0, "nol"),
        (11, "sebelas"),
        (17, "tujuh belas"),
        (100, "seratus"),
        (1500, "seribu lima ratus"),
        (173_531_000, "seratus tujuh puluh tiga juta lima ratus tiga puluh satu ribu"),
    ],
)
def test_terbilang(value: int, expected: str) -> None:
    assert terbilang(value) == expected


def test_rupiah_format() -> None:
    assert rupiah(173531000) == "Rp 173.531.000,00"
