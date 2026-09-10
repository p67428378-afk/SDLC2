import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from server.models import Base, User, Sku, ClusterMetric, ScenarioConfig

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
TESTING = os.getenv("TESTING", "").lower() in ("true", "1")

if TESTING or DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_data(db: Session):
    # 1. Seed users (idempotent)
    test_users = [
        {
            "email": "test@example.com",
            "password": "testpassword",
            "role": "user",
        },
        {
            "email": "admin@example.com",
            "password": "adminpassword",
            "role": "admin",
        },
    ]
    for u_data in test_users:
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if not existing:
            user = User(
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["password"]),
                role=u_data["role"],
                is_active=True,
                is_verified=True,
            )
            db.add(user)

    # 2. Seed Cluster Metrics (idempotent)
    existing_metrics = (
        db.query(ClusterMetric)
        .filter(
            ClusterMetric.cluster_name == "Small Town Value Cluster",
            ClusterMetric.category == "Snacks",
        )
        .first()
    )
    if not existing_metrics:
        cm = ClusterMetric(
            cluster_name="Small Town Value Cluster",
            category="Snacks",
            sales_per_linear_ft=450.00,
            private_brand_pct=28.00,
            in_stock_rate_pct=96.50,
            shelf_capacity_pct=92.00,
        )
        db.add(cm)

    # 3. Seed SKUs (idempotent)
    skus_data = [
        {
            "sku_code": "SKU-10492",
            "product_name": "DG Value Pretzels 12oz",
            "category": "Snacks",
            "weekly_velocity": 142.5,
            "margin_pct": 34.2,
            "linear_feet": 1.5,
            "is_private_brand": True,
            "status_badge": "GROW",
        },
        {
            "sku_code": "SKU-8821",
            "product_name": "Slow Chips 6oz",
            "category": "Snacks",
            "weekly_velocity": 18.0,
            "margin_pct": 12.5,
            "linear_feet": 2.0,
            "is_private_brand": False,
            "status_badge": "SWAP",
        },
        {
            "sku_code": "SKU-9041",
            "product_name": "DG Trail Mix 8oz",
            "category": "Snacks",
            "weekly_velocity": 98.0,
            "margin_pct": 29.5,
            "linear_feet": 1.0,
            "is_private_brand": True,
            "status_badge": "MAINTAIN",
        },
        {
            "sku_code": "SKU-7712",
            "product_name": "Salty Pretzel Sticks 10oz",
            "category": "Snacks",
            "weekly_velocity": 22.0,
            "margin_pct": 15.0,
            "linear_feet": 1.5,
            "is_private_brand": False,
            "status_badge": "REDUCE",
        },
        {
            "sku_code": "SKU-10111",
            "product_name": "DG Butter Popcorn 5oz",
            "category": "Snacks",
            "weekly_velocity": 115.0,
            "margin_pct": 36.0,
            "linear_feet": 1.5,
            "is_private_brand": True,
            "status_badge": "GROW",
        },
        {
            "sku_code": "SKU-10112",
            "product_name": "DG Cheddar Cheese Puffs 8oz",
            "category": "Snacks",
            "weekly_velocity": 130.0,
            "margin_pct": 33.5,
            "linear_feet": 1.5,
            "is_private_brand": True,
            "status_badge": "GROW",
        },
        {
            "sku_code": "SKU-10113",
            "product_name": "DG Kettle Cooked Chips 8.5oz",
            "category": "Snacks",
            "weekly_velocity": 105.0,
            "margin_pct": 31.0,
            "linear_feet": 1.5,
            "is_private_brand": True,
            "status_badge": "GROW",
        },
        {
            "sku_code": "SKU-20221",
            "product_name": "National Brand Tortilla Chips 13oz",
            "category": "Snacks",
            "weekly_velocity": 85.0,
            "margin_pct": 22.0,
            "linear_feet": 2.0,
            "is_private_brand": False,
            "status_badge": "MAINTAIN",
        },
        {
            "sku_code": "SKU-20222",
            "product_name": "Crispy Potato Crisps Original 5.2oz",
            "category": "Snacks",
            "weekly_velocity": 78.0,
            "margin_pct": 24.0,
            "linear_feet": 1.5,
            "is_private_brand": False,
            "status_badge": "MAINTAIN",
        },
        {
            "sku_code": "SKU-20223",
            "product_name": "Roasted Peanuts Salted 16oz",
            "category": "Snacks",
            "weekly_velocity": 65.0,
            "margin_pct": 26.5,
            "linear_feet": 1.0,
            "is_private_brand": False,
            "status_badge": "MAINTAIN",
        },
        {
            "sku_code": "SKU-30331",
            "product_name": "Generic Corn Chips 9oz",
            "category": "Snacks",
            "weekly_velocity": 72.0,
            "margin_pct": 28.0,
            "linear_feet": 1.0,
            "is_private_brand": False,
            "status_badge": "MAINTAIN",
        },
        {
            "sku_code": "SKU-40441",
            "product_name": "Low Margin Brand Cheese Dips 8oz",
            "category": "Snacks",
            "weekly_velocity": 15.0,
            "margin_pct": 10.0,
            "linear_feet": 1.0,
            "is_private_brand": False,
            "status_badge": "SWAP",
        },
    ]

    for item in skus_data:
        existing_sku = db.query(Sku).filter(Sku.sku_code == item["sku_code"]).first()
        if not existing_sku:
            sku = Sku(**item)
            db.add(sku)

    # 4. Seed Scenario Configurations (idempotent)
    scenarios_data = [
        {
            "scenario_type": "Conservative",
            "projected_sales_delta_pct": 3.2,
            "projected_pb_share_pct": 26.5,
            "projected_margin_delta_pct": 0.8,
            "recommended_sku_actions_json": {"GROW": 2, "MAINTAIN": 8, "SWAP": 1, "REDUCE": 1},
            "is_default": False,
        },
        {
            "scenario_type": "Balanced",
            "projected_sales_delta_pct": 5.8,
            "projected_pb_share_pct": 28.0,
            "projected_margin_delta_pct": 1.5,
            "recommended_sku_actions_json": {"GROW": 4, "MAINTAIN": 5, "SWAP": 2, "REDUCE": 1},
            "is_default": True,
        },
        {
            "scenario_type": "Aggressive",
            "projected_sales_delta_pct": 8.5,
            "projected_pb_share_pct": 31.2,
            "projected_margin_delta_pct": 2.4,
            "recommended_sku_actions_json": {"GROW": 6, "MAINTAIN": 3, "SWAP": 2, "REDUCE": 1},
            "is_default": False,
        },
    ]

    for s_data in scenarios_data:
        existing_s = db.query(ScenarioConfig).filter(ScenarioConfig.scenario_type == s_data["scenario_type"]).first()
        if not existing_s:
            s_obj = ScenarioConfig(**s_data)
            db.add(s_obj)

    try:
        db.commit()
    except Exception:
        db.rollback()
