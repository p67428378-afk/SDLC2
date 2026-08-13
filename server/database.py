import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# For SQLite, we need check_same_thread: False
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    # Import models here to register them on Base.metadata
    Base.metadata.create_all(bind=engine)


def seed_data(db):
    from server.models import SKU, Scenario
    from sqlalchemy.exc import IntegrityError

    # Seed SKUs
    initial_skus = [
        {
            "sku_id": "SKU-10042",
            "product_name": "Clover Valley Potato Chips, 8oz",
            "sales": 4520.00,
            "units_sold": 1250,
            "sales_per_linear_ft": 85.20,
            "is_private_brand": True,
            "status": "GROW",
        },
        {
            "sku_id": "SKU-89211",
            "product_name": "Doritos Nacho Cheese, 9.25oz",
            "sales": 8100.00,
            "units_sold": 1800,
            "sales_per_linear_ft": 112.50,
            "is_private_brand": False,
            "status": "MAINTAIN",
        },
        {
            "sku_id": "SKU-34098",
            "product_name": "Generic Pretzels, 12oz",
            "sales": 1200.00,
            "units_sold": 400,
            "sales_per_linear_ft": 30.00,
            "is_private_brand": False,
            "status": "REDUCE",
        },
        {
            "sku_id": "SKU-55210",
            "product_name": "Clover Valley Trail Mix, 6oz",
            "sales": 2100.00,
            "units_sold": 700,
            "sales_per_linear_ft": 55.00,
            "is_private_brand": True,
            "status": "SWAP",
        },
    ]

    for sku_data in initial_skus:
        existing = db.query(SKU).filter(SKU.sku_id == sku_data["sku_id"]).first()
        if not existing:
            sku = SKU(**sku_data)
            db.add(sku)

    # Seed Scenarios
    initial_scenarios = [
        {
            "name": "Conservative",
            "projected_sales_growth_pct": 5.00,
            "projected_private_brand_pct": 24.00,
            "projected_in_stock_rate": 97.00,
            "projected_shelf_capacity_pct": 90.00,
        },
        {
            "name": "Balanced",
            "projected_sales_growth_pct": 12.00,
            "projected_private_brand_pct": 25.50,
            "projected_in_stock_rate": 95.80,
            "projected_shelf_capacity_pct": 92.00,
        },
        {
            "name": "Aggressive",
            "projected_sales_growth_pct": 18.00,
            "projected_private_brand_pct": 28.00,
            "projected_in_stock_rate": 92.50,
            "projected_shelf_capacity_pct": 95.00,
        },
    ]

    for scenario_data in initial_scenarios:
        existing = (
            db.query(Scenario).filter(Scenario.name == scenario_data["name"]).first()
        )
        if not existing:
            scenario = Scenario(**scenario_data)
            db.add(scenario)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
