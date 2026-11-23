from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from django.conf import settings
from django.utils import timezone

def get_company_timezone() -> ZoneInfo:
    tz_name = getattr(settings, "TIME_ZONE", "Asia/Kolkata")
    return ZoneInfo(tz_name)

def company_now() -> datetime:
    tz = get_company_timezone()
    return timezone.now().astimezone(tz)

def company_today() -> date:
    return company_now().date()

def week_bounds(target: date | datetime | None = None) -> tuple[date, date]:
    if target is None:
        target = company_today()
    elif isinstance(target, datetime):
        tz = get_company_timezone()
        if timezone.is_naive(target):
            target = target.replace(tzinfo=tz)
        else:
            target = target.astimezone(tz)
        target = target.date()

    start_date = target - timedelta(days=target.weekday())
    end_date = start_date + timedelta(days=6)
    return start_date, end_date
