import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Integer, Text, SmallInteger, Date, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    email = Column(String(100))
    business_type = Column(String(50), default="retail")
    plan = Column(String(20), default="trial")
    plan_price = Column(Numeric(10, 0), default=0)
    status = Column(String(20), default="active")
    trial_ends_at = Column(DateTime(timezone=True))
    sub_ends_at = Column(DateTime(timezone=True))
    settings = Column(JSONB, default={})
    logo_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="tenant")
    categories = relationship("Category", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    customers = relationship("Customer", back_populates="tenant")
    orders = relationship("Order", back_populates="tenant")


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="staff")
    avatar_url = Column(String(500))
    commission_rate = Column(Numeric(5, 2), default=0)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="users")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    color = Column(String(7))
    icon = Column(String(50))
    sort_order = Column(SmallInteger, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="categories")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    code = Column(String(50))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    unit = Column(String(30), default="cai")
    price = Column(Numeric(12, 0), default=0)
    price_2 = Column(Numeric(12, 0))
    cost = Column(Numeric(12, 0), default=0)
    track_stock = Column(Boolean, default=False)
    stock_qty = Column(Numeric(10, 2), default=0)
    min_stock = Column(Numeric(10, 2), default=0)
    is_service = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    image_url = Column(String(500))
    sort_order = Column(SmallInteger, default=0)
    extra_data = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="products")
    category = relationship("Category", back_populates="products")


class Customer(Base):
    __tablename__ = "customers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(Text)
    birthday = Column(Date)
    gender = Column(String(1))
    debt = Column(Numeric(12, 0), default=0)
    total_spent = Column(Numeric(12, 0), default=0)
    visit_count = Column(Integer, default=0)
    last_visit_at = Column(DateTime(timezone=True))
    note = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="customers")


class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    order_no = Column(String(20), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"))
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    status = Column(String(20), default="completed")
    subtotal = Column(Numeric(12, 0), default=0)
    discount_amount = Column(Numeric(12, 0), default=0)
    discount_pct = Column(Numeric(5, 2), default=0)
    total = Column(Numeric(12, 0), default=0)
    paid_amount = Column(Numeric(12, 0), default=0)
    debt_amount = Column(Numeric(12, 0), default=0)
    payment_method = Column(String(20), default="cash")
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    staff_name = Column(String(100))
    note = Column(Text)
    source = Column(String(20), default="pos")
    is_deleted = Column(Boolean, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant = relationship("Tenant", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"))
    product_name = Column(String(200), nullable=False)
    product_code = Column(String(50))
    unit = Column(String(30))
    qty = Column(Numeric(10, 2), default=1)
    price = Column(Numeric(12, 0), default=0)
    discount_amount = Column(Numeric(12, 0), default=0)
    total = Column(Numeric(12, 0), default=0)
    cost = Column(Numeric(12, 0), default=0)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    staff_name = Column(String(100))
    note = Column(Text)

    order = relationship("Order", back_populates="items")
