from datetime import timedelta
from typing import List, Dict, Tuple
from sqlalchemy.orm import Session

from server.models import ExchangeRateCache, get_utc_now

SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD"]

DEFAULT_RATES: Dict[Tuple[str, str], float] = {
    ("USD", "USD"): 1.0,
    ("USD", "EUR"): 0.9250,
    ("USD", "GBP"): 0.7850,
    ("USD", "JPY"): 155.20,
    ("USD", "CAD"): 1.3650,
    ("EUR", "USD"): 1.0810,
    ("EUR", "EUR"): 1.0,
    ("GBP", "USD"): 1.2738,
    ("GBP", "GBP"): 1.0,
    ("JPY", "USD"): 0.00644,
    ("JPY", "JPY"): 1.0,
    ("CAD", "USD"): 0.7326,
    ("CAD", "CAD"): 1.0,
}


class CurrencyService:
    @classmethod
    def get_rate(cls, base: str, target: str, db: Session) -> float:
        base = base.upper()
        target = target.upper()

        if base == target:
            return 1.0

        if base not in SUPPORTED_CURRENCIES or target not in SUPPORTED_CURRENCIES:
            if (base, target) in DEFAULT_RATES:
                return DEFAULT_RATES[(base, target)]
            return 1.0

        now = get_utc_now()

        cached = (
            db.query(ExchangeRateCache)
            .filter(
                ExchangeRateCache.base_currency == base,
                ExchangeRateCache.target_currency == target,
                ExchangeRateCache.expires_at > now,
            )
            .first()
        )

        if cached:
            return float(cached.rate)

        if (base, target) in DEFAULT_RATES:
            rate = DEFAULT_RATES[(base, target)]
        elif (base, "USD") in DEFAULT_RATES and ("USD", target) in DEFAULT_RATES:
            rate = round(
                DEFAULT_RATES[(base, "USD")] * DEFAULT_RATES[("USD", target)], 4
            )
        elif (target, base) in DEFAULT_RATES and DEFAULT_RATES[(target, base)] > 0:
            rate = round(1.0 / DEFAULT_RATES[(target, base)], 4)
        else:
            rate = 1.0

        try:
            expires = now + timedelta(minutes=15)
            existing = (
                db.query(ExchangeRateCache)
                .filter(
                    ExchangeRateCache.base_currency == base,
                    ExchangeRateCache.target_currency == target,
                )
                .first()
            )
            if existing:
                existing.rate = rate
                existing.expires_at = expires
            else:
                db.add(
                    ExchangeRateCache(
                        base_currency=base,
                        target_currency=target,
                        rate=rate,
                        expires_at=expires,
                        created_at=now,
                    )
                )
            db.commit()
        except Exception:
            db.rollback()

        return float(rate)

    @classmethod
    def convert_amount(
        cls, amount: float, base: str, target: str, db: Session
    ) -> Tuple[float, float]:
        rate = cls.get_rate(base, target, db)
        converted = round(amount * rate, 2 if target != "JPY" else 0)
        return converted, rate

    @classmethod
    def get_all_rates(cls, base: str, db: Session) -> List[dict]:
        base = base.upper()
        results = []
        now = get_utc_now()
        for target in SUPPORTED_CURRENCIES:
            rate = cls.get_rate(base, target, db)
            results.append(
                {
                    "base_currency": base,
                    "target_currency": target,
                    "rate": rate,
                    "timestamp": now.isoformat(),
                }
            )
        return results
