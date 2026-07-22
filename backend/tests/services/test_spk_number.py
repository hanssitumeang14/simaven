from datetime import date

from app.service_layer.services.spk import SpkService


def test_number_format() -> None:
    assert SpkService.format_number(1, date(2026, 7, 22)) == "001/SPK/VII/2026"
    assert SpkService.format_number(42, date(2026, 1, 5)) == "042/SPK/I/2026"
    assert SpkService.format_number(128, date(2026, 12, 31)) == "128/SPK/XII/2026"
