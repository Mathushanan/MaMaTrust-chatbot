"""DOB validation and conservative filtering of dataset age labels.

Ranges in months/years use completed calendar months, including both ends.
Unclear labels are retained: age metadata is not proof of clinical suitability.
Safety-flagged chunks are always retained. The original records are not edited.
"""
import calendar
import re
from datetime import date, datetime
from zoneinfo import ZoneInfo


def perth_today():
    # tzdata supplies this timezone on Windows.
    return datetime.now(ZoneInfo("Australia/Perth")).date()


def calculate_age(baby_dob: date, today=None):
    today = today or perth_today()
    if baby_dob > today:
        raise ValueError("Baby's date of birth cannot be in the future.")
    months = (today.year - baby_dob.year) * 12 + today.month - baby_dob.month
    anniversary_day = min(baby_dob.day, calendar.monthrange(today.year, today.month)[1])
    if today.day < anniversary_day:
        months -= 1
    return {"age_months": months, "age_days": (today - baby_dob).days}


def age_label_matches(label, age):
    """Keep unknown labels rather than silently guessing their meaning."""
    label = str(label or "").strip().lower().replace("–", "-").replace("—", "-")
    label = re.sub(r"\s+", "", label)
    range_match = re.fullmatch(r"(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(mo|y)", label)
    if range_match:
        lower, upper, unit = range_match.groups()
        factor = 12 if unit == "y" else 1
        return float(lower) * factor <= age["age_months"] <= float(upper) * factor
    onward = re.fullmatch(r"(\d+)(mo)(?:\+|onward)", label)
    if onward:
        return age["age_months"] >= int(onward.group(1))
    exact = re.fullmatch(r"(\d+)mo", label)
    if exact:
        return age["age_months"] == int(exact.group(1))
    if label == "firstweek":
        return age["age_days"] < 7
    # 'around 6mo', 'first days-weeks', prenatal/lactation, general,
    # preterm infant, and unfamiliar labels need context; retain them.
    return True


def filter_chunks_for_age(chunks, age):
    if age is None:
        return list(chunks)
    return [chunk for chunk in chunks if chunk.get("escalation_flag")
            or age_label_matches(chunk.get("age_range"), age)]
