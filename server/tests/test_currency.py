from datetime import datetime, timezone, timedelta
from server.services.currency_service import get_exchange_rate, convert_currency
from server.models.exchange_rate_cache import ExchangeRateCache


def test_currency_conversion_same_currency(db_session):
    converted, rate = convert_currency(db_session, 100.0, "USD", "USD")
    assert converted == 100.0
    assert rate == 1.0


def test_currency_conversion_usd_to_eur(db_session):
    converted, rate = convert_currency(db_session, 100.0, "USD", "EUR")
    assert rate == 0.925
    assert converted == 92.50


def test_currency_rate_caching_and_ttl(db_session):
    # 1. Fetch rate first time (should find seeded or compute)
    rate1, is_cached1 = get_exchange_rate(db_session, "USD", "GBP")
    assert rate1 == 0.79

    # 2. Fetch again -> must be cached
    rate2, is_cached2 = get_exchange_rate(db_session, "USD", "GBP")
    assert rate2 == rate1
    assert is_cached2 is True


def test_currency_cache_expiration_refresh(db_session):
    # Set an expired cache entry
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=20)
    existing = (
        db_session.query(ExchangeRateCache)
        .filter(
            ExchangeRateCache.base_currency == "USD",
            ExchangeRateCache.target_currency == "JPY",
        )
        .first()
    )
    if existing:
        existing.expires_at = expired_time
        db_session.commit()

    rate, is_cached = get_exchange_rate(db_session, "USD", "JPY")
    assert rate == 155.5
    # Since cache was expired, it recomputed
    assert is_cached is False


def test_invalid_currency_code(client):
    res = client.get("/api/v1/payments/rates?base=XYZ&target=USD")
    assert res.status_code == 400
