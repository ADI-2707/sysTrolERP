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


def get_safe_zoneinfo(tz_name: str | None) -> ZoneInfo | None:
    if not tz_name or not isinstance(tz_name, str):
        return None
    try:
        return ZoneInfo(tz_name.strip())
    except Exception:
        return None


def get_effective_today(
    client_tz_name: str | None = None,
    project_tz_name: str | None = None,
) -> date:
    today = company_today()
    now_utc = timezone.now()
    for candidate in (client_tz_name, project_tz_name):
        zi = get_safe_zoneinfo(candidate)
        if zi:
            cand_today = now_utc.astimezone(zi).date()
            if cand_today > today:
                today = cand_today
    return today


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
