from datetime import datetime, timezone, timedelta
from typing import Tuple, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models.exchange_rate_cache import ExchangeRateCache

# Standard FX benchmark rates relative to 1 USD
BASE_FX_RATES: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.925000,
    "GBP": 0.790000,
    "CAD": 1.360000,
    "AUD": 1.520000,
    "JPY": 155.500000,
    "CHF": 0.910000,
    "CNY": 7.230000,
    "INR": 83.500000,
    "SGD": 1.350000,
    "NZD": 1.640000,
}

SUPPORTED_CURRENCIES = set(BASE_FX_RATES.keys())


def is_valid_currency(currency_code: str) -> bool:
    if not currency_code or len(currency_code) != 3:
        return False
    return currency_code.upper() in SUPPORTED_CURRENCIES


def get_exchange_rate(
    db: Session, base_currency: str, target_currency: str
) -> Tuple[float, bool]:
    """
    Returns (rate, is_cached).
    Checks DB cache for valid non-expired rate with 15-minute TTL.
    """
    base = base_currency.upper()
    target = target_currency.upper()

    if not is_valid_currency(base):
        raise HTTPException(
            status_code=400, detail=f"Unsupported base currency: {base}"
        )
    if not is_valid_currency(target):
        raise HTTPException(
            status_code=400, detail=f"Unsupported target currency: {target}"
        )

    if base == target:
        return 1.0, True

    now = datetime.now(timezone.utc)

    # 1. Check database cache
    cached_entry = (
        db.query(ExchangeRateCache)
        .filter(
            ExchangeRateCache.base_currency == base,
            ExchangeRateCache.target_currency == target,
            ExchangeRateCache.expires_at > now,
        )
        .first()
    )

    if cached_entry:
        return float(cached_entry.rate), True

    # 2. Calculate rate via USD anchor
    usd_to_base = BASE_FX_RATES[base]
    usd_to_target = BASE_FX_RATES[target]
    calculated_rate = round(usd_to_target / usd_to_base, 6)

    # 3. Store in DB cache with 15-minute TTL
    expires = now + timedelta(minutes=15)
    try:
        existing = (
            db.query(ExchangeRateCache)
            .filter(
                ExchangeRateCache.base_currency == base,
                ExchangeRateCache.target_currency == target,
            )
            .first()
        )

        if existing:
            existing.rate = calculated_rate
            existing.expires_at = expires
        else:
            new_cache = ExchangeRateCache(
                base_currency=base,
                target_currency=target,
                rate=calculated_rate,
                expires_at=expires,
            )
            db.add(new_cache)
        db.commit()
    except Exception:
        db.rollback()

    return calculated_rate, False


def convert_currency(
    db: Session, amount: float, source_currency: str, target_currency: str
) -> Tuple[float, float]:
    """
    Returns (converted_amount, exchange_rate)
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    rate, _ = get_exchange_rate(db, source_currency, target_currency)
    converted = round(amount * rate, 2)
    return converted, rate
