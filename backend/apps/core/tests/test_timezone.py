from datetime import date, datetime
from zoneinfo import ZoneInfo
import pytest
import time_machine
from apps.core.timezone import company_now, company_today, week_bounds

def test_company_now_uses_configured_timezone():
    with time_machine.travel("2026-11-24 10:00:00Z", tick=False):
        now = company_now()
        assert str(now.tzinfo) == "Asia/Kolkata"
        assert now.hour == 15
        assert now.minute == 30

def test_company_today():
    with time_machine.travel("2026-11-24 20:00:00Z", tick=False):
        assert company_today() == date(2026, 11, 25)

def test_week_bounds_for_current_date():
    with time_machine.travel("2026-11-24 05:00:00Z", tick=False):
        start, end = week_bounds()
        assert start == date(2026, 11, 23)
        assert end == date(2026, 11, 29)
        assert start.weekday() == 0
        assert end.weekday() == 6

def test_week_bounds_for_given_date():
    target = date(2026, 1, 14)
    start, end = week_bounds(target)
    assert start == date(2026, 1, 12)
    assert end == date(2026, 1, 18)

def test_week_bounds_for_given_datetime():
    target = datetime(2026, 1, 18, 23, 59, 59, tzinfo=ZoneInfo("Asia/Kolkata"))
    start, end = week_bounds(target)
    assert start == date(2026, 1, 12)
    assert end == date(2026, 1, 18)
