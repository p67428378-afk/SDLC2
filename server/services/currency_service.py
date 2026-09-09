from datetime import datetime, timezone, timedelta
from typing import Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException
from server.models import ExchangeRateCache

SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD"]

DEFAULT_USD_RATES = {
    "USD": 1.0,
    "EUR": 0.9250,
    "GBP": 0.7950,
    "JPY": 155.20,
    "CAD": 1.3650,
}


def validate_currency(currency: str) -> str:
    curr = currency.upper().strip()
    if curr not in SUPPORTED_CURRENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported currency '{currency}'. Supported currencies: {', '.join(SUPPORTED_CURRENCIES)}",
        )
    return curr


def get_exchange_rate(
    db: Session, base_currency: str = "USD", target_currency: str = "USD"
) -> float:
    base = validate_currency(base_currency)
    target = validate_currency(target_currency)

    if base == target:
        return 1.0

    now = datetime.now(timezone.utc)
    # Check cache for USD to target
    cache_entry = (
        db.query(ExchangeRateCache)
        .filter(
            ExchangeRateCache.base_currency == "USD",
            ExchangeRateCache.target_currency == target,
        )
        .first()
    )

    target_rate_usd = DEFAULT_USD_RATES.get(target, 1.0)
    if cache_entry:
        expires_at = cache_entry.expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at and expires_at > now:
            target_rate_usd = cache_entry.rate
        else:
            # Refresh cache entry
            cache_entry.rate = target_rate_usd
            cache_entry.expires_at = now + timedelta(minutes=15)
            db.commit()
    else:
        # Create cache entry with 15-min TTL
        new_entry = ExchangeRateCache(
            base_currency="USD",
            target_currency=target,
            rate=target_rate_usd,
            expires_at=now + timedelta(minutes=15),
        )
        db.add(new_entry)
        db.commit()

    # If base is not USD, convert from USD rate
    base_rate_usd = DEFAULT_USD_RATES.get(base, 1.0)
    rate = target_rate_usd / base_rate_usd
    return round(rate, 4)


def get_all_rates(db: Session, base_currency: str = "USD") -> Dict[str, float]:
    base = validate_currency(base_currency)
    rates = {}
    for target in SUPPORTED_CURRENCIES:
        rates[target] = get_exchange_rate(db, base, target)
    return rates
