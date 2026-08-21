import os, uuid
from datetime import datetime, date
from datetime import datetime as dt

def to_date(s):
    """Convert 'YYYY-MM-DD' string to Python date — tránh lỗi psycopg3 date >= varchar"""
    if isinstance(s, date): return s
    return datetime.strptime(s, '%Y-%m-%d').date()

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import create_engine, Column, String, Boolean, DateTime, Numeric, Integer, Text, SmallInteger, Date, ForeignKey, func, or_, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

load_dotenv()

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY", "localpos-dev-secret-2026-change-in-prod")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
CORS(app, origins="*")
jwt = JWTManager(app)

# ===== DATABASE =====
DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres123@localhost:5432/localpos_dev")
# Neon dùng postgresql:// -> cần đổi sang postgresql+psycopg://
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DB_URL.startswith("postgresql://") and "+" not in DB_URL:
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)
engine = create_engine(DB_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)

class Base(DeclarativeBase): pass

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200))
    phone = Column(String(20))
    address = Column(Text)
    business_type = Column(String(50), default="retail")
    plan = Column(String(20), default="trial")
    status = Column(String(20), default="active")
    trial_ends_at = Column(DateTime(timezone=True))
    settings = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Shop settings
    open_time = Column(String(5), default="08:00")
    close_time = Column(String(5), default="20:00")
    slot_interval = Column(Integer, default=30)
    phone = Column(String(20))
    logo_url = Column(String(500))
    slug = Column(String(50), unique=True)

class User(Base):
    __tablename__ = "users"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(100))
    phone = Column(String(20))
    password_hash = Column(String(255))
    role = Column(String(20), default="staff")
    commission_rate = Column(Numeric(5, 2), default=0)
    is_active = Column(Boolean, default=True)
    notify_upcoming = Column(Boolean, default=False, server_default='false')
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"))
    name = Column(String(100))
    color = Column(String(7))
    sort_order = Column(SmallInteger, default=0)
    is_active = Column(Boolean, default=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    code = Column(String(50))
    name = Column(String(200))
    unit = Column(String(30), default="cai")
    price = Column(Numeric(12, 0), default=0)
    cost = Column(Numeric(12, 0), default=0)
    track_stock = Column(Boolean, default=False)
    stock_qty = Column(Numeric(10, 2), default=0)
    min_stock = Column(Numeric(10, 2), default=0)
    is_service = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(SmallInteger, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"))
    name = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    debt = Column(Numeric(12, 0), default=0)
    total_spent = Column(Numeric(12, 0), default=0)
    visit_count = Column(Integer, default=0)
    last_visit_at = Column(DateTime(timezone=True))
    note = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"))
    order_no = Column(String(20))
    customer_id = Column(PGUUID(as_uuid=True), ForeignKey("customers.id"))
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    status = Column(String(20), default="completed")
    subtotal = Column(Numeric(12, 0), default=0)
    discount_amount = Column(Numeric(12, 0), default=0)
    total = Column(Numeric(12, 0), default=0)
    paid_amount = Column(Numeric(12, 0), default=0)
    debt_amount = Column(Numeric(12, 0), default=0)
    payment_method = Column(String(20), default="cash")
    staff_name = Column(String(100))
    note = Column(Text)
    is_deleted = Column(Boolean, default=False)
    created_by = Column(PGUUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(PGUUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"))
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"))
    product_id = Column(PGUUID(as_uuid=True))
    product_name = Column(String(200))
    unit = Column(String(30))
    qty = Column(Numeric(10, 2), default=1)
    price = Column(Numeric(12, 0), default=0)
    discount_amount = Column(Numeric(12, 0), default=0)
    total = Column(Numeric(12, 0), default=0)
    cost = Column(Numeric(12, 0), default=0)
    staff_name = Column(String(100))

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    customer_id = Column(PGUUID(as_uuid=True), ForeignKey("customers.id"))
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    # Map tên Python → tên cột DB thực tế
    stylist_id = Column(PGUUID(as_uuid=True))          # cột mới đã ADD
    stylist_name = Column(String(100))                  # cột mới đã ADD
    service_name = Column(String(200))                  # cột mới đã ADD
    service_id = Column(PGUUID(as_uuid=True))           # cột mới đã ADD
    appointment_time = Column('scheduled_at', DateTime(timezone=True), nullable=False)  # map → scheduled_at
    duration_minutes = Column(Integer)                  # cột mới đã ADD
    status = Column(String(20), default="pending")
    note = Column(Text)
    created_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reminder_sent = Column(Boolean, default=False, server_default='false')

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    product_id = Column(PGUUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200))
    transaction_type = Column(String(20), default="import")  # import / export / adjust
    qty = Column(Numeric(10, 2), default=0)
    qty_before = Column(Numeric(10, 2), default=0)
    qty_after = Column(Numeric(10, 2), default=0)
    unit_cost = Column(Numeric(12, 0), default=0)
    note = Column(Text)
    created_by = Column(PGUUID(as_uuid=True))
    created_by_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ===== HELPER =====
def get_db():
    return Session()

def current_user_info():
    identity = get_jwt_identity()
    claims = get_jwt()
    return identity, claims.get("tenant_id"), claims.get("role")

# ===== HEALTH CHECK =====
@app.get("/api/health")
def health_check():
    return ok({"status": "ok", "version": "1.0.0"})

def gen_order_no(db, tenant_id):
    date_str = datetime.now().strftime("%Y%m%d")
    count = db.query(func.count(Order.id)).filter(
        Order.tenant_id == tenant_id,
        func.date(Order.created_at) == date.today()
    ).scalar() or 0
    return f"HD{date_str}{str(count + 1).zfill(3)}"

def ok(data): return jsonify(data), 200
def err(msg, code=400): return jsonify({"error": msg}), code

# ===== AUTH =====
@app.post("/api/auth/login")
def login():
    d = request.json
    db = get_db()
    try:
        # Hỗ trợ cả tenant_id lẫn slug
        tenant = None
        if d.get("tenant_id"):
            tenant = db.query(Tenant).filter(Tenant.id == d["tenant_id"]).first()
        elif d.get("slug"):
            tenant = db.query(Tenant).filter(Tenant.slug == d["slug"]).first()
        if not tenant:
            return err("Không tìm thấy cửa hàng", 404)
        user = db.query(User).filter(
            User.tenant_id == tenant.id,
            User.phone == d["phone"],
            User.is_active == True
        ).first()
        if not user or not check_password_hash(user.password_hash, d["password"]):
            return err("Sai số điện thoại hoặc mật khẩu", 401)
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        
        if tenant.status != "active" and tenant.status != "trial":
            # Nếu hết hạn thì cập nhật lại status (nếu chưa cập nhật)
            if tenant.trial_ends_at and tenant.trial_ends_at < now:
                tenant.status = "expired"
                db.commit()
            return err("Cửa hàng đã hết hạn hoặc bị khóa. Vui lòng liên hệ Admin.", 403)
            
        if tenant.trial_ends_at and tenant.trial_ends_at < now:
            tenant.status = "expired"
            db.commit()
            return err("Cửa hàng đã hết hạn sử dụng. Vui lòng liên hệ Admin.", 403)
            
        user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        token = create_access_token(
            identity=str(user.id),
            additional_claims={"tenant_id": str(user.tenant_id), "role": user.role}
        )
        return ok({
            "access_token": token,
            "token_type": "bearer",
            "user_name": user.name,
            "user_role": user.role,
            "tenant_name": tenant.name if tenant else "",
            "tenant_slug": tenant.slug if tenant else "",
        })
    finally:
        db.close()

SUPER_ADMIN_PASSWORD = os.environ.get("SUPER_ADMIN_PASSWORD", "")

# ===== SUPER ADMIN =====
@app.post("/api/super/login")
def super_login():
    d = request.json
    if d.get("password") != SUPER_ADMIN_PASSWORD:
        return err("Sai mật khẩu quản trị", 401)
    token = create_access_token(
        identity="superadmin",
        additional_claims={"tenant_id": "system", "role": "superadmin"}
    )
    return ok({
        "access_token": token,
        "token_type": "bearer",
        "user_name": "Super Admin",
        "user_role": "superadmin",
        "tenant_name": "System",
        "tenant_slug": "system",
    })

@app.get("/api/super/tenants")
@jwt_required()
def super_get_tenants():
    _, _, role = current_user_info()
    if role != "superadmin": return err("Không có quyền truy cập", 403)
    db = get_db()
    try:
        tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
        res = []
        for t in tenants:
            owner = db.query(User).filter(User.tenant_id == t.id, User.role == "owner").first()
            res.append({
                "id": str(t.id),
                "name": t.name,
                "slug": t.slug,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "status": t.status,
                "trial_ends_at": t.trial_ends_at.isoformat() if t.trial_ends_at else None,
                "owner_name": owner.name if owner else "",
                "owner_phone": owner.phone if owner else ""
            })
        return ok(res)
    finally:
        db.close()

@app.post("/api/super/tenants")
@jwt_required()
def super_create_tenant():
    _, _, role = current_user_info()
    if role != "superadmin": return err("Không có quyền truy cập", 403)
    d = request.json
    db = get_db()
    try:
        if db.query(Tenant).filter(Tenant.slug == d["slug"]).first():
            return err("Đường dẫn (slug) đã tồn tại", 400)
        
        import datetime
        t = Tenant(
            name=d["tenant_name"],
            slug=d["slug"],
            trial_ends_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        )
        db.add(t)
        db.flush()
        
        u = User(
            tenant_id=t.id,
            name=d["owner_name"],
            phone=d["owner_phone"],
            password_hash=generate_password_hash(d["owner_password"]),
            role="owner"
        )
        db.add(u)
        db.commit()
        return ok({"message": "Tạo tiệm thành công", "tenant_id": str(t.id), "slug": t.slug})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()

@app.put("/api/super/tenants/<tenant_id>")
@jwt_required()
def super_update_tenant(tenant_id):
    _, _, role = current_user_info()
    if role != "superadmin": return err("Không có quyền truy cập", 403)
    d = request.json
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not t: return err("Không tìm thấy cửa hàng", 404)
        
        # Check slug duplicate
        if "slug" in d and d["slug"] != t.slug:
            if db.query(Tenant).filter(Tenant.slug == d["slug"]).first():
                return err("Đường dẫn (slug) đã tồn tại", 400)
            t.slug = d["slug"]
            
        if "name" in d: t.name = d["name"]
        if "status" in d: t.status = d["status"] # active or locked
        
        owner = db.query(User).filter(User.tenant_id == tenant_id, User.role == "owner").first()
        if owner:
            if "owner_name" in d: owner.name = d["owner_name"]
            if "owner_phone" in d: owner.phone = d["owner_phone"]
            if d.get("owner_password"):
                from app.services.auth import get_password_hash
                owner.password_hash = get_password_hash(d["owner_password"])
        
        db.commit()
        return ok({"message": "Cập nhật thành công"})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()

@app.post("/api/super/tenants/<tenant_id>/extend")
@jwt_required()
def super_extend_tenant(tenant_id):
    _, _, role = current_user_info()
    if role != "superadmin": return err("Không có quyền truy cập", 403)
    d = request.json
    months = int(d.get("months", 1))
    
    months_to_add = months
    if months == 6: months_to_add = 7
    elif months == 12: months_to_add = 14
    elif months == 24: months_to_add = 30
    
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not t: return err("Không tìm thấy cửa hàng", 404)
        
        # Tính toán ngày hết hạn mới
        import datetime
        from dateutil.relativedelta import relativedelta
        
        now = datetime.datetime.now(datetime.timezone.utc)
        current_expiry = t.trial_ends_at
        
        if current_expiry and current_expiry > now:
            # Vẫn còn hạn -> Cộng dồn
            new_expiry = current_expiry + relativedelta(months=months_to_add)
        else:
            # Đã hết hạn hoặc chưa có -> Tính từ hôm nay
            new_expiry = now + relativedelta(months=months_to_add)
            
        t.trial_ends_at = new_expiry
        t.status = "active" # Tự động mở khoá
        
        db.commit()
        return ok({"message": f"Đã gia hạn thành công (cộng {months_to_add} tháng)", "new_expiry": new_expiry.isoformat()})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()

# ===== PUBLIC SHOP LOOKUP (không cần auth) =====
@app.get("/api/public/shop/<slug>")
def public_get_shop(slug):
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.slug == slug, Tenant.status == 'active').first()
        if not t: return err("Không tìm thấy tiệm", 404)
        return ok({
            "tenant_id": str(t.id),
            "name": t.name,
            "slug": t.slug,
            "address": t.address or "",
            "phone": t.phone or "",
        })
    finally:
        db.close()

# ===== SHOP SETTINGS =====
@app.get("/api/settings")
@jwt_required()
def get_settings():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not t: return err("Tenant not found", 404)
        return ok({
            "name": t.name,
            "address": t.address or "",
            "phone": t.phone or "",
            "slug": t.slug or "",
            "open_time": t.open_time or "08:00",
            "close_time": t.close_time or "20:00",
            "slot_interval": t.slot_interval or 30,
        })
    finally:
        db.close()

@app.put("/api/settings")
@jwt_required()
def update_settings():
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"):
        return err("Không có quyền chỉnh sửa cài đặt", 403)
    d = request.json
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not t: return err("Tenant not found", 404)
        for field in ["name", "address", "phone", "open_time", "close_time", "slot_interval", "slug"]:
            if field in d:
                setattr(t, field, d[field])
        db.commit()
        return ok({"message": "Cập nhật thành công"})
    finally:
        db.close()

@app.post("/api/auth/setup-user")
def setup_user():
    """Endpoint tạo user - dùng lần đầu setup"""
    d = request.json
    db = get_db()
    try:
        existing = db.query(User).filter(
            User.tenant_id == d["tenant_id"],
            User.phone == d["phone"]
        ).first()
        if existing:
            # Nếu đã có, cập nhật password
            existing.password_hash = generate_password_hash(d["password"])
            db.commit()
            return ok({"message": "Đã cập nhật mật khẩu", "user_id": str(existing.id)})
        user = User(
            tenant_id=d["tenant_id"],
            name=d["name"],
            phone=d["phone"],
            password_hash=generate_password_hash(d["password"]),
            role=d.get("role", "staff")
        )
        db.add(user)
        db.commit()
        return ok({"message": "Tạo tài khoản thành công", "user_id": str(user.id)})
    finally:
        db.close()

# ===== PRODUCTS =====
@app.get("/api/products")
@jwt_required()
def list_products():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        q = db.query(Product, Category.name.label("cat_name")).outerjoin(
            Category, Product.category_id == Category.id
        ).filter(
            Product.tenant_id == tenant_id,
            Product.is_active == True
        )
        search = request.args.get("q")
        if search:
            q = q.filter(or_(Product.name.ilike(f"%{search}%"), Product.code.ilike(f"%{search}%")))
        cat_id = request.args.get("category_id")
        if cat_id:
            q = q.filter(Product.category_id == int(cat_id))
        results = q.order_by(Product.sort_order, Product.name).all()
        return ok([{
            "id": str(p.id), "category_id": p.category_id, "category_name": cat_name,
            "code": p.code, "name": p.name, "unit": p.unit,
            "price": float(p.price), "cost": float(p.cost),
            "is_service": p.is_service, "track_stock": p.track_stock,
            "stock_qty": float(p.stock_qty), "min_stock": float(p.min_stock)
        } for p, cat_name in results])
    finally:
        db.close()

@app.post("/api/products")
@jwt_required()
def create_product():
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        p = Product(tenant_id=tenant_id, **{k: v for k, v in d.items()
            if k in ["category_id","code","name","unit","price","cost","is_service","track_stock","stock_qty","min_stock"]})
        db.add(p)
        db.commit()
        return ok({"id": str(p.id), "message": "Tạo sản phẩm thành công"})
    finally:
        db.close()

@app.put("/api/products/<product_id>")
@jwt_required()
def update_product(product_id):
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        p = db.query(Product).filter(Product.id == product_id, Product.tenant_id == tenant_id).first()
        if not p: return err("Không tìm thấy sản phẩm", 404)
        for k, v in d.items():
            if hasattr(p, k): setattr(p, k, v)
        db.commit()
        return ok({"message": "Cập nhật thành công"})
    finally:
        db.close()

@app.delete("/api/products/<product_id>")
@jwt_required()
def delete_product(product_id):
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        p = db.query(Product).filter(Product.id == product_id, Product.tenant_id == tenant_id).first()
        if not p: return err("Không tìm thấy sản phẩm", 404)
        p.is_active = False
        db.commit()
        return ok({"message": "Đã xóa sản phẩm"})
    finally:
        db.close()

# ===== ORDERS =====
@app.get("/api/orders")
@jwt_required()
def list_orders():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        q = db.query(Order).filter(Order.tenant_id == tenant_id, Order.is_deleted == False)
        if request.args.get("status"): q = q.filter(Order.status == request.args["status"])
        if request.args.get("date_from"): q = q.filter(func.date(Order.created_at) >= to_date(request.args["date_from"]))
        if request.args.get("date_to"): q = q.filter(func.date(Order.created_at) <= to_date(request.args["date_to"]))
        orders = q.order_by(Order.created_at.desc()).limit(int(request.args.get("limit", 50))).all()
        return ok([{
            "id": str(o.id), "order_no": o.order_no, "customer_name": o.customer_name,
            "status": o.status, "total": float(o.total), "paid_amount": float(o.paid_amount),
            "debt_amount": float(o.debt_amount), "payment_method": o.payment_method,
            "created_at": o.created_at.isoformat() if o.created_at else None
        } for o in orders])
    finally:
        db.close()

@app.post("/api/orders")
@jwt_required()
def create_order():
    user_id, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        items = d.get("items", [])
        subtotal = sum(i["qty"] * i["price"] - i.get("discount_amount", 0) for i in items)
        discount = float(d.get("discount_amount", 0))
        total = subtotal - discount
        paid = float(d.get("paid_amount", total))
        pay_method = d.get("payment_method", "cash")
        debt = max(0, total - paid) if pay_method != "debt" else total
        status = "debt" if debt > 0 else "completed"

        # Lấy tên user
        user = db.query(User).filter(User.id == user_id).first()
        staff_name = user.name if user else ""

        order = Order(
            tenant_id=tenant_id,
            order_no=gen_order_no(db, tenant_id),
            customer_id=d.get("customer_id"),
            customer_name=d.get("customer_name"),
            customer_phone=d.get("customer_phone"),
            status=status,
            subtotal=subtotal,
            discount_amount=discount,
            total=total,
            paid_amount=paid if pay_method != "debt" else 0,
            debt_amount=debt,
            payment_method=pay_method,
            staff_name=staff_name,
            note=d.get("note"),
            created_by=user_id
        )
        db.add(order)
        db.flush()

        for item in items:
            oi = OrderItem(
                order_id=order.id, tenant_id=tenant_id,
                product_id=item.get("product_id"),
                product_name=item["product_name"],
                unit=item.get("unit", "cai"),
                qty=item["qty"], price=item["price"],
                discount_amount=item.get("discount_amount", 0),
                total=item["qty"] * item["price"] - item.get("discount_amount", 0),
                cost=item.get("cost", 0),
                staff_name=item.get("staff_name", staff_name)
            )
            db.add(oi)
            # Cập nhật tồn kho
            if item.get("product_id"):
                p = db.query(Product).filter(Product.id == item["product_id"]).first()
                if p and p.track_stock:
                    p.stock_qty = float(p.stock_qty) - float(item["qty"])

        # Cập nhật công nợ khách hàng
        if d.get("customer_id") and debt > 0:
            c = db.query(Customer).filter(Customer.id == d["customer_id"]).first()
            if c:
                c.debt = float(c.debt) + debt
                c.total_spent = float(c.total_spent) + paid
                c.visit_count += 1
                c.last_visit_at = datetime.now()

        db.commit()
        return ok({"id": str(order.id), "order_no": order.order_no,
                   "total": float(order.total), "debt_amount": float(order.debt_amount),
                   "status": order.status, "message": "Tạo hóa đơn thành công"})
    finally:
        db.close()

@app.get("/api/orders/<order_id>")
@jwt_required()
def get_order(order_id):
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        o = db.query(Order).filter(Order.id == order_id, Order.tenant_id == tenant_id).first()
        if not o: return err("Không tìm thấy hóa đơn", 404)
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        return ok({
            "id": str(o.id), "order_no": o.order_no, "customer_name": o.customer_name,
            "status": o.status, "subtotal": float(o.subtotal),
            "discount_amount": float(o.discount_amount), "total": float(o.total),
            "paid_amount": float(o.paid_amount), "debt_amount": float(o.debt_amount),
            "payment_method": o.payment_method, "note": o.note,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items": [{"product_name": i.product_name, "unit": i.unit,
                       "qty": float(i.qty), "price": float(i.price), "total": float(i.total)} for i in items]
        })
    finally:
        db.close()

@app.put("/api/orders/<order_id>/cancel")
@jwt_required()
def cancel_order(order_id):
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        o = db.query(Order).filter(Order.id == order_id, Order.tenant_id == tenant_id).first()
        if not o: return err("Không tìm thấy hóa đơn", 404)
        o.is_deleted = True
        o.status = "cancelled"
        db.commit()
        return ok({"message": "Đã hủy hóa đơn"})
    finally:
        db.close()

# ===== REPORTS =====
@app.get("/api/reports/today")
@jwt_required()
def report_today():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        today = date.today()
        q = db.query(
            func.count(Order.id).label("total_orders"),
            func.coalesce(func.sum(Order.total), 0).label("total_revenue"),
            func.coalesce(func.sum(Order.paid_amount), 0).label("total_paid"),
            func.coalesce(func.sum(Order.debt_amount), 0).label("total_debt"),
        ).filter(Order.tenant_id == tenant_id, func.date(Order.created_at) == today,
                 Order.is_deleted == False, Order.status != "cancelled").first()
        new_customers = db.query(func.count(Customer.id)).filter(
            Customer.tenant_id == tenant_id, func.date(Customer.created_at) == today).scalar() or 0
        low_stock = db.query(Product).filter(
            Product.tenant_id == tenant_id, Product.track_stock == True,
            Product.stock_qty <= Product.min_stock, Product.is_active == True).count()
        return ok({
            "date": today.isoformat(),
            "total_orders": q.total_orders or 0,
            "total_revenue": float(q.total_revenue or 0),
            "total_paid": float(q.total_paid or 0),
            "total_debt": float(q.total_debt or 0),
            "new_customers": new_customers,
            "low_stock_count": low_stock
        })
    finally:
        db.close()

@app.get("/api/reports/top-products")
@jwt_required()
def top_products():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        q = db.query(
            OrderItem.product_name,
            func.sum(OrderItem.qty).label("tong_so_luong"),
            func.sum(OrderItem.total).label("tong_tien")
        ).join(Order, OrderItem.order_id == Order.id).filter(
            OrderItem.tenant_id == tenant_id, Order.is_deleted == False, Order.status != "cancelled"
        )
        if request.args.get("date_from"): q = q.filter(func.date(Order.created_at) >= to_date(request.args["date_from"]))
        if request.args.get("date_to"): q = q.filter(func.date(Order.created_at) <= to_date(request.args["date_to"]))
        rows = q.group_by(OrderItem.product_name).order_by(func.sum(OrderItem.total).desc()).limit(10).all()
        return ok([{"product_name": r.product_name, "tong_so_luong": float(r.tong_so_luong or 0),
                    "tong_tien": float(r.tong_tien or 0)} for r in rows])
    finally:
        db.close()

@app.get("/api/reports/debt")
@jwt_required()
def report_debt():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        customers = db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.debt > 0).order_by(Customer.debt.desc()).all()
        return ok([{"id": str(c.id), "name": c.name, "phone": c.phone, "debt": float(c.debt)} for c in customers])
    finally:
        db.close()

@app.get("/api/customers")
@jwt_required()
def list_customers():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        q = db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.is_active == True)
        if request.args.get("q"):
            sq = request.args["q"]
            q = q.filter(or_(Customer.name.ilike(f"%{sq}%"), Customer.phone.ilike(f"%{sq}%")))
        customers = q.order_by(Customer.name).limit(50).all()
        return ok([{"id": str(c.id), "name": c.name, "phone": c.phone,
                    "debt": float(c.debt), "total_spent": float(c.total_spent),
                    "visit_count": c.visit_count, "note": c.note} for c in customers])
    finally:
        db.close()

# ===== CATEGORIES =====
@app.get("/api/categories")
@jwt_required()
def list_categories():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        cats = db.query(Category).filter(Category.tenant_id == tenant_id, Category.is_active == True).order_by(Category.sort_order, Category.name).all()
        return ok([{"id": c.id, "name": c.name, "color": c.color, "sort_order": c.sort_order} for c in cats])
    finally:
        db.close()

@app.post("/api/categories")
@jwt_required()
def create_category():
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        c = Category(tenant_id=tenant_id, name=d["name"], color=d.get("color", "#1677ff"), sort_order=d.get("sort_order", 0))
        db.add(c)
        db.commit()
        return ok({"id": c.id, "message": "Tạo danh mục thành công"})
    finally:
        db.close()

@app.put("/api/categories/<int:cat_id>")
@jwt_required()
def update_category(cat_id):
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        c = db.query(Category).filter(Category.id == cat_id, Category.tenant_id == tenant_id).first()
        if not c: return err("Không tìm thấy danh mục", 404)
        for k, v in d.items():
            if hasattr(c, k): setattr(c, k, v)
        db.commit()
        return ok({"message": "Cập nhật thành công"})
    finally:
        db.close()

@app.delete("/api/categories/<int:cat_id>")
@jwt_required()
def delete_category(cat_id):
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        c = db.query(Category).filter(Category.id == cat_id, Category.tenant_id == tenant_id).first()
        if not c: return err("Không tìm thấy danh mục", 404)
        c.is_active = False
        db.commit()
        return ok({"message": "Đã xóa danh mục"})
    finally:
        db.close()

# ===== STAFF MANAGEMENT =====
@app.get("/api/staff")
@jwt_required()
def list_staff():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        users = db.query(User).filter(User.tenant_id == tenant_id).order_by(User.role, User.name).all()
        return ok([{
            "id": str(u.id), "name": u.name, "phone": u.phone,
            "role": u.role, "commission_rate": float(u.commission_rate or 0),
            "is_active": u.is_active,
            "notify_upcoming": bool(u.notify_upcoming),
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None
        } for u in users])
    finally:
        db.close()

@app.post("/api/staff")
@jwt_required()
def create_staff():
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        existing = db.query(User).filter(User.tenant_id == tenant_id, User.phone == d["phone"]).first()
        if existing: return err("Số điện thoại đã tồn tại", 400)
        u = User(
            tenant_id=tenant_id,
            name=d["name"],
            phone=d["phone"],
            password_hash=generate_password_hash(d.get("password", "123456")),
            role=d.get("role", "staff"),
            commission_rate=d.get("commission_rate", 0),
            is_active=True
        )
        db.add(u)
        db.commit()
        return ok({"id": str(u.id), "message": "Tạo nhân viên thành công"})
    finally:
        db.close()

@app.put("/api/staff/<user_id>")
@jwt_required()
def update_staff(user_id):
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
        if not u: return err("Không tìm thấy nhân viên", 404)
        if "name" in d: u.name = d["name"]
        if "phone" in d: u.phone = d["phone"]
        if "role" in d: u.role = d["role"]
        if "commission_rate" in d: u.commission_rate = d["commission_rate"]
        if "is_active" in d: u.is_active = d["is_active"]
        if "notify_upcoming" in d: u.notify_upcoming = bool(d["notify_upcoming"])
        if d.get("password"): u.password_hash = generate_password_hash(d["password"])
        db.commit()
        return ok({"message": "Cập nhật thành công"})
    finally:
        db.close()

@app.delete("/api/staff/<user_id>")
@jwt_required()
def delete_staff(user_id):
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
        if not u: return err("Không tìm thấy nhân viên", 404)
        u.is_active = False
        db.commit()
        return ok({"message": "Đã vô hiệu hóa tài khoản"})
    finally:
        db.close()

@app.get("/api/staff/<user_id>/commission")
@jwt_required()
def staff_commission(user_id):
    """Báo cáo hoa hồng nhân viên theo khoảng thời gian"""
    _, tenant_id, _ = current_user_info()
    date_from = request.args.get("date_from", datetime.now().strftime("%Y-%m-01"))
    date_to = request.args.get("date_to", datetime.now().strftime("%Y-%m-%d"))
    db = get_db()
    try:
        u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
        if not u: return err("Không tìm thấy nhân viên", 404)
        rows = db.query(
            OrderItem.product_name,
            func.sum(OrderItem.qty).label("tong_sl"),
            func.sum(OrderItem.total).label("tong_tien"),
        ).join(Order, OrderItem.order_id == Order.id).filter(
            OrderItem.staff_name == u.name,
            OrderItem.tenant_id == tenant_id,
            Order.is_deleted == False,
            Order.status != "cancelled",
            func.date(Order.created_at) >= to_date(date_from),
            func.date(Order.created_at) <= to_date(date_to)
        ).group_by(OrderItem.product_name).all()
        tong_doanh_thu = sum(float(r.tong_tien or 0) for r in rows)
        hoa_hong = tong_doanh_thu * float(u.commission_rate or 0) / 100
        return ok({
            "staff_name": u.name,
            "commission_rate": float(u.commission_rate or 0),
            "date_from": date_from,
            "date_to": date_to,
            "tong_doanh_thu": tong_doanh_thu,
            "hoa_hong_duoc_huong": hoa_hong,
            "chi_tiet": [{"product_name": r.product_name, "so_luong": float(r.tong_sl or 0), "tong_tien": float(r.tong_tien or 0)} for r in rows]
        })
    finally:
        db.close()


# ===== THÔNG BÁO UPCOMING APPOINTMENTS =====

@app.get("/api/notifications/upcoming")
@jwt_required()
def get_upcoming_notifications():
    """
    Trả về lịch hẹn sắp đến trong vòng X phút tới,
    CHỈ của các nhân viên đã bật notify_upcoming = True.
    Frontend dùng để polling và hiện chuông thông báo.
    """
    import datetime as dt_module
    _, tenant_id, _ = current_user_info()
    minutes = int(request.args.get("minutes", 30))  # mặc định 30 phút
    db = get_db()
    try:
        now = datetime.now()
        window_end = now + dt_module.timedelta(minutes=minutes)

        # Lấy danh sách nhân viên bật thông báo
        notified_staff = db.query(User).filter(
            User.tenant_id == tenant_id,
            User.notify_upcoming == True,
            User.is_active == True
        ).all()

        if not notified_staff:
            return ok([])

        notified_ids = {str(u.id) for u in notified_staff}
        notified_map = {str(u.id): u for u in notified_staff}

        # Lấy lịch hẹn sắp tới trong window
        apts = db.query(Appointment).filter(
            Appointment.tenant_id == tenant_id,
            Appointment.appointment_time >= now,
            Appointment.appointment_time <= window_end,
            Appointment.status.notin_(["cancelled", "done"]),
        ).order_by(Appointment.appointment_time).all()

        results = []
        for apt in apts:
            # Chỉ lấy lịch của thợ đã bật thông báo
            if str(apt.stylist_id) not in notified_ids:
                continue
            stylist = notified_map.get(str(apt.stylist_id))
            minutes_left = int((apt.appointment_time - now).total_seconds() / 60)
            results.append({
                "id": str(apt.id),
                "customer_name": apt.customer_name or "Khách",
                "customer_phone": apt.customer_phone or "",
                "stylist_id": str(apt.stylist_id) if apt.stylist_id else "",
                "stylist_name": apt.stylist_name or (stylist.name if stylist else ""),
                "service_name": apt.service_name or "",
                "appointment_time": apt.appointment_time.isoformat(),
                "appointment_time_fmt": apt.appointment_time.strftime("%H:%M"),
                "minutes_left": minutes_left,
                "status": apt.status,
                "duration_minutes": apt.duration_minutes or 30,
                "note": apt.note or "",
            })

        return ok(results)
    finally:
        db.close()


@app.patch("/api/staff/<user_id>/notify-toggle")
@jwt_required()
def toggle_staff_notify(user_id):
    """Bật/tắt thông báo upcoming cho 1 nhân viên"""
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Không có quyền", 403)
    db = get_db()
    try:
        u = db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()
        if not u: return err("Không tìm thấy", 404)
        u.notify_upcoming = not u.notify_upcoming
        db.commit()
        return ok({"notify_upcoming": u.notify_upcoming, "name": u.name})
    finally:
        db.close()



# ===== APPOINTMENTS =====

@app.get("/api/appointments/availability")
@jwt_required()
def check_availability():
    """Trả về các slot 30 phút bị bận trong ngày, theo từng thợ"""
    _, tenant_id, _ = current_user_info()
    date_str = request.args.get("date")
    stylist_id = request.args.get("stylist_id")
    db = get_db()
    try:
        from datetime import timedelta
        q = db.query(Appointment).filter(
            Appointment.tenant_id == tenant_id,
            func.date(Appointment.appointment_time) == to_date(date_str),
            Appointment.status.notin_(["cancelled"])
        )
        if stylist_id:
            q = q.filter(Appointment.stylist_id == stylist_id)
        apts = q.all()

        # Tính busy slots (từng block 30 phút)
        busy = {}  # { "HH:MM": [stylist_id, ...] }
        for a in apts:
            start = a.appointment_time
            dur = a.duration_minutes or 60
            t = start
            sid = str(a.stylist_id) if a.stylist_id else "__any__"
            while t < start + timedelta(minutes=dur):
                slot = t.strftime("%H:%M")
                if slot not in busy:
                    busy[slot] = []
                busy[slot].append(sid)
                t += timedelta(minutes=30)

        return ok({"busy": busy})
    finally:
        db.close()

@app.get("/api/appointments")
@jwt_required()
def list_appointments():
    user_id, tenant_id, role = current_user_info()
    db = get_db()
    try:
        q = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)
        # Nếu là staff thì chỉ xem lịch của mình
        if role == "staff":
            # Lấy tên của user hiện tại
            me = db.query(User).filter(User.id == user_id).first()
            if me:
                q = q.filter(Appointment.stylist_id == user_id)
        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")
        stylist_id = request.args.get("stylist_id")
        status = request.args.get("status")
        if date_from: q = q.filter(func.date(Appointment.appointment_time) >= to_date(date_from))
        if date_to:   q = q.filter(func.date(Appointment.appointment_time) <= to_date(date_to))
        if stylist_id: q = q.filter(Appointment.stylist_id == stylist_id)
        if status:     q = q.filter(Appointment.status == status)
        apts = q.order_by(Appointment.appointment_time).all()
        return ok([{
            "id": str(a.id),
            "customer_name": a.customer_name,
            "customer_phone": a.customer_phone,
            "stylist_id": str(a.stylist_id) if a.stylist_id else None,
            "stylist_name": a.stylist_name,
            "service_name": a.service_name,
            "appointment_time": a.appointment_time.isoformat() if a.appointment_time else None,
            "duration_minutes": a.duration_minutes,
            "status": a.status,
            "note": a.note,
        } for a in apts])
    finally:
        db.close()

@app.post("/api/appointments")
@jwt_required()
def create_appointment():
    user_id, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        # Parse thời gian
        apt_time_str = d.get("appointment_time")
        apt_time = datetime.fromisoformat(apt_time_str)
        duration = int(d.get("duration_minutes", 60))

        stylist_id = d.get("stylist_id")
        stylist_name = d.get("stylist_name")

        # Tự động phân công thợ nếu không chỉ định
        if not stylist_id:
            apt_end = apt_time + __import__("datetime").timedelta(minutes=duration)
            # Lấy tất cả thợ (role=staff) của tiệm
            all_stylists = db.query(User).filter(
                User.tenant_id == tenant_id,
                User.role == "staff",
                User.is_active == True
            ).all()

            # Tìm thợ chưa có lịch trong khung giờ đó
            free_stylists = []
            for stylist in all_stylists:
                conflict = db.query(Appointment).filter(
                    Appointment.stylist_id == stylist.id,
                    Appointment.status.notin_(["cancelled", "done"]),
                    Appointment.appointment_time < apt_end,
                    Appointment.appointment_time + func.cast(
                        func.concat(Appointment.duration_minutes, " minutes"),
                        __import__("sqlalchemy").types.Interval
                    ) > apt_time
                ).first()
                if not conflict:
                    free_stylists.append(stylist)

            if free_stylists:
                import random
                chosen = random.choice(free_stylists)
                stylist_id = str(chosen.id)
                stylist_name = chosen.name
            elif all_stylists:
                # Nếu tất cả bận, chọn ngẫu nhiên (vẫn đặt được, thợ sắp xếp lại)
                import random
                chosen = random.choice(all_stylists)
                stylist_id = str(chosen.id)
                stylist_name = chosen.name + " (có thể bận)"

        # Lấy thông tin sản phẩm/dịch vụ nếu có
        service_name = d.get("service_name", "")
        if d.get("service_id") and not service_name:
            svc = db.query(Product).filter(Product.id == d["service_id"]).first()
            if svc: service_name = svc.name

        apt = Appointment(
            tenant_id=tenant_id,
            customer_name=d.get("customer_name"),
            customer_phone=d.get("customer_phone"),
            stylist_id=stylist_id,
            stylist_name=stylist_name,
            service_name=service_name,
            service_id=d.get("service_id"),
            appointment_time=apt_time,
            duration_minutes=duration,
            status="pending",
            note=d.get("note"),
            created_by=user_id
        )
        db.add(apt)
        db.commit()
        return ok({
            "id": str(apt.id),
            "stylist_name": apt.stylist_name,
            "appointment_time": apt.appointment_time.isoformat(),
            "message": f"Dat lich thanh cong! Tho: {apt.stylist_name or 'Chua xac dinh'}"
        })
    finally:
        db.close()

@app.put("/api/appointments/<apt_id>")
@jwt_required()
def update_appointment(apt_id):
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        a = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.tenant_id == tenant_id).first()
        if not a: return err("Khong tim thay lich", 404)
        for field in ["status", "note", "stylist_id", "stylist_name", "duration_minutes"]:
            if field in d: setattr(a, field, d[field])
        if "appointment_time" in d:
            a.appointment_time = datetime.fromisoformat(d["appointment_time"])
        db.commit()
        return ok({"message": "Cap nhat thanh cong"})
    finally:
        db.close()

@app.delete("/api/appointments/<apt_id>")
@jwt_required()
def cancel_appointment(apt_id):
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        a = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.tenant_id == tenant_id).first()
        if not a: return err("Khong tim thay lich", 404)
        a.status = "cancelled"
        db.commit()
        return ok({"message": "Da huy lich"})
    finally:
        db.close()

@app.get("/api/appointments/stylists")
@jwt_required()
def list_stylists():
    """Danh sach tho co the dat lich"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        stylists = db.query(User).filter(
            User.tenant_id == tenant_id,
            User.role.in_(["staff", "owner"]),
            User.is_active == True
        ).all()
        return ok([{"id": str(s.id), "name": s.name, "role": s.role} for s in stylists])
    finally:
        db.close()

@app.get("/")
def root():
    return ok({"message": "LocalPOS API dang chay!", "version": "1.0.0"})


# ===== REPORTS - CHART & STAFF SUMMARY =====
@app.get("/api/reports/chart")
@jwt_required()
def report_chart():
    """Doanh thu theo ngày trong khoảng thời gian"""
    _, tenant_id, _ = current_user_info()
    date_from = request.args.get("date_from", datetime.now().strftime("%Y-%m-01"))
    date_to = request.args.get("date_to", datetime.now().strftime("%Y-%m-%d"))
    db = get_db()
    try:
        rows = db.execute(text("""
            SELECT
                DATE(created_at) as ngay,
                COUNT(*) as so_hd,
                COALESCE(SUM(total), 0) as doanh_thu,
                COALESCE(SUM(paid_amount), 0) as da_thu,
                COALESCE(SUM(debt_amount), 0) as cong_no
            FROM orders
            WHERE tenant_id = :tid
              AND is_deleted = false
              AND status != 'cancelled'
              AND DATE(created_at) >= :df
              AND DATE(created_at) <= :dt
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        """), {"tid": tenant_id, "df": date_from, "dt": date_to}).fetchall()
        return ok([{
            "ngay": str(r.ngay),
            "so_hd": r.so_hd,
            "doanh_thu": float(r.doanh_thu),
            "da_thu": float(r.da_thu),
            "cong_no": float(r.cong_no)
        } for r in rows])
    finally:
        db.close()


@app.get("/api/reports/staff-summary")
@jwt_required()
def report_staff_summary():
    """Tổng hợp doanh thu & hoa hồng tất cả nhân viên"""
    _, tenant_id, _ = current_user_info()
    date_from = request.args.get("date_from", datetime.now().strftime("%Y-%m-01"))
    date_to = request.args.get("date_to", datetime.now().strftime("%Y-%m-%d"))
    db = get_db()
    try:
        # Lấy tất cả nhân viên
        staff_list = db.query(User).filter(
            User.tenant_id == tenant_id,
            User.is_active == True
        ).all()

        result = []
        for u in staff_list:
            rows = db.query(
                func.sum(OrderItem.total).label("tong_tien"),
                func.count(func.distinct(OrderItem.order_id)).label("so_don")
            ).join(Order, OrderItem.order_id == Order.id).filter(
                OrderItem.staff_name == u.name,
                OrderItem.tenant_id == tenant_id,
                Order.is_deleted == False,
                Order.status != "cancelled",
                func.date(Order.created_at) >= to_date(date_from),
                func.date(Order.created_at) <= to_date(date_to)
            ).first()
            tong = float(rows.tong_tien or 0)
            hoa_hong = tong * float(u.commission_rate or 0) / 100
            result.append({
                "id": str(u.id),
                "name": u.name,
                "role": u.role,
                "commission_rate": float(u.commission_rate or 0),
                "so_don": rows.so_don or 0,
                "tong_doanh_thu": tong,
                "hoa_hong": hoa_hong
            })
        result.sort(key=lambda x: x["tong_doanh_thu"], reverse=True)
        return ok(result)
    finally:
        db.close()


# ===== CUSTOMERS - Chi tiết & Thu nợ =====
@app.get("/api/customers/<customer_id>")
@jwt_required()
def get_customer(customer_id):
    """Chi tiết khách hàng + lịch sử đơn hàng"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        c = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant_id).first()
        if not c: return err("Không tìm thấy khách hàng", 404)
        orders = db.query(Order).filter(
            Order.customer_id == customer_id,
            Order.tenant_id == tenant_id,
            Order.is_deleted == False
        ).order_by(Order.created_at.desc()).limit(20).all()
        return ok({
            "id": str(c.id), "name": c.name, "phone": c.phone,
            "address": c.address, "note": c.note,
            "debt": float(c.debt), "total_spent": float(c.total_spent),
            "visit_count": c.visit_count,
            "last_visit_at": c.last_visit_at.isoformat() if c.last_visit_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "orders": [{
                "id": str(o.id), "order_no": o.order_no,
                "total": float(o.total), "paid_amount": float(o.paid_amount),
                "debt_amount": float(o.debt_amount), "status": o.status,
                "payment_method": o.payment_method,
                "created_at": o.created_at.isoformat() if o.created_at else None
            } for o in orders]
        })
    finally:
        db.close()


@app.post("/api/customers/<customer_id>/pay-debt")
@jwt_required()
def pay_customer_debt(customer_id):
    """Thu nợ khách hàng"""
    user_id, tenant_id, _ = current_user_info()
    d = request.json
    amount = float(d.get("amount", 0))
    if amount <= 0: return err("Số tiền thu phải lớn hơn 0", 400)
    db = get_db()
    try:
        c = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant_id).first()
        if not c: return err("Không tìm thấy khách hàng", 404)
        if float(c.debt) <= 0: return err("Khách hàng không có nợ", 400)
        pay = min(amount, float(c.debt))

        # Cập nhật công nợ khách
        c.debt = float(c.debt) - pay
        c.total_spent = float(c.total_spent) + pay

        # Tìm & cập nhật các đơn nợ (FIFO)
        debt_orders = db.query(Order).filter(
            Order.customer_id == customer_id,
            Order.tenant_id == tenant_id,
            Order.debt_amount > 0,
            Order.is_deleted == False
        ).order_by(Order.created_at).all()

        remaining = pay
        for o in debt_orders:
            if remaining <= 0: break
            reduce = min(float(o.debt_amount), remaining)
            o.debt_amount = float(o.debt_amount) - reduce
            o.paid_amount = float(o.paid_amount) + reduce
            if float(o.debt_amount) <= 0:
                o.status = "completed"
            remaining -= reduce

        db.commit()
        return ok({
            "message": f"Đã thu {pay:,.0f}đ công nợ",
            "paid": pay,
            "remaining_debt": float(c.debt)
        })
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()


@app.post("/api/customers")
@jwt_required()
def create_customer():
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        existing = db.query(Customer).filter(Customer.tenant_id == tenant_id, Customer.phone == d.get("phone")).first()
        if existing: return err("Số điện thoại đã tồn tại", 400)
        c = Customer(
            tenant_id=tenant_id,
            name=d["name"], phone=d.get("phone"),
            address=d.get("address"), note=d.get("note")
        )
        db.add(c)
        db.commit()
        return ok({"id": str(c.id), "message": "Tạo khách hàng thành công"})
    finally:
        db.close()


@app.put("/api/customers/<customer_id>")
@jwt_required()
def update_customer(customer_id):
    _, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        c = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant_id).first()
        if not c: return err("Không tìm thấy khách hàng", 404)
        for field in ["name", "phone", "address", "note"]:
            if field in d: setattr(c, field, d[field])
        db.commit()
        return ok({"message": "Cập nhật thành công"})
    finally:
        db.close()


# ===== INVENTORY =====
@app.post("/api/inventory/import")
@jwt_required()
def inventory_import():
    """Nhập kho: tăng stock_qty sản phẩm"""
    user_id, tenant_id, role = current_user_info()
    d = request.json
    db = get_db()
    try:
        p = db.query(Product).filter(Product.id == d["product_id"], Product.tenant_id == tenant_id).first()
        if not p: return err("Không tìm thấy sản phẩm", 404)
        qty = float(d["qty"])
        if qty <= 0: return err("Số lượng nhập phải > 0", 400)

        qty_before = float(p.stock_qty or 0)
        p.stock_qty = qty_before + qty
        p.track_stock = True
        if d.get("cost"): p.cost = d["cost"]

        user = db.query(User).filter(User.id == user_id).first()
        tx = InventoryTransaction(
            tenant_id=tenant_id,
            product_id=p.id,
            product_name=p.name,
            transaction_type="import",
            qty=qty,
            qty_before=qty_before,
            qty_after=float(p.stock_qty),
            unit_cost=d.get("cost", float(p.cost or 0)),
            note=d.get("note", ""),
            created_by=user_id,
            created_by_name=user.name if user else ""
        )
        db.add(tx)
        db.commit()
        return ok({"message": f"Đã nhập {qty} {p.unit} {p.name}. Tồn kho: {float(p.stock_qty)}"})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()


@app.post("/api/inventory/adjust")
@jwt_required()
def inventory_adjust():
    """Điều chỉnh kho (kiểm kê)"""
    user_id, tenant_id, _ = current_user_info()
    d = request.json
    db = get_db()
    try:
        p = db.query(Product).filter(Product.id == d["product_id"], Product.tenant_id == tenant_id).first()
        if not p: return err("Không tìm thấy sản phẩm", 404)
        qty_before = float(p.stock_qty or 0)
        new_qty = float(d["new_qty"])
        diff = new_qty - qty_before
        p.stock_qty = new_qty

        user = db.query(User).filter(User.id == user_id).first()
        tx = InventoryTransaction(
            tenant_id=tenant_id,
            product_id=p.id,
            product_name=p.name,
            transaction_type="adjust",
            qty=diff,
            qty_before=qty_before,
            qty_after=new_qty,
            note=d.get("note", "Kiểm kê kho"),
            created_by=user_id,
            created_by_name=user.name if user else ""
        )
        db.add(tx)
        db.commit()
        return ok({"message": f"Đã điều chỉnh tồn kho {p.name}: {qty_before} → {new_qty}"})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()


@app.get("/api/inventory/transactions")
@jwt_required()
def inventory_transactions():
    """Lịch sử nhập/xuất/điều chỉnh kho"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        q = db.query(InventoryTransaction).filter(InventoryTransaction.tenant_id == tenant_id)
        if request.args.get("product_id"):
            q = q.filter(InventoryTransaction.product_id == request.args["product_id"])
        if request.args.get("type"):
            q = q.filter(InventoryTransaction.transaction_type == request.args["type"])
        txs = q.order_by(InventoryTransaction.created_at.desc()).limit(100).all()
        return ok([{
            "id": str(t.id),
            "product_name": t.product_name,
            "transaction_type": t.transaction_type,
            "qty": float(t.qty),
            "qty_before": float(t.qty_before or 0),
            "qty_after": float(t.qty_after or 0),
            "unit_cost": float(t.unit_cost or 0),
            "note": t.note,
            "created_by_name": t.created_by_name,
            "created_at": t.created_at.isoformat() if t.created_at else None
        } for t in txs])
    finally:
        db.close()


@app.get("/api/inventory/stock")
@jwt_required()
def inventory_stock():
    """Danh sách tồn kho hiện tại"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        products = db.query(Product).filter(
            Product.tenant_id == tenant_id,
            Product.track_stock == True,
            Product.is_active == True
        ).order_by(Product.name).all()
        return ok([{
            "id": str(p.id), "name": p.name, "code": p.code,
            "unit": p.unit, "stock_qty": float(p.stock_qty or 0),
            "min_stock": float(p.min_stock or 0),
            "cost": float(p.cost or 0), "price": float(p.price or 0),
            "is_low": float(p.stock_qty or 0) <= float(p.min_stock or 0)
        } for p in products])
    finally:
        db.close()


# ===== ORDERS - Print =====
@app.get("/api/orders/<order_id>/print")
@jwt_required()
def get_order_print(order_id):
    """Dữ liệu đầy đủ để in hóa đơn"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        o = db.query(Order).filter(Order.id == order_id, Order.tenant_id == tenant_id).first()
        if not o: return err("Không tìm thấy hóa đơn", 404)
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        return ok({
            "shop_name": tenant.name if tenant else "LocalPOS",
            "shop_address": tenant.address if tenant else "",
            "shop_phone": tenant.phone if tenant else "",
            "order_no": o.order_no,
            "customer_name": o.customer_name or "Khách lẻ",
            "customer_phone": o.customer_phone or "",
            "staff_name": o.staff_name or "",
            "payment_method": o.payment_method,
            "status": o.status,
            "note": o.note or "",
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items": [{
                "product_name": i.product_name, "unit": i.unit,
                "qty": float(i.qty), "price": float(i.price),
                "discount_amount": float(i.discount_amount or 0),
                "total": float(i.total)
            } for i in items],
            "subtotal": float(o.subtotal),
            "discount_amount": float(o.discount_amount),
            "total": float(o.total),
            "paid_amount": float(o.paid_amount),
            "debt_amount": float(o.debt_amount)
        })
    finally:
        db.close()



# ===== EXPENSE MODEL =====
class Expense(Base):
    __tablename__ = "expenses"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(PGUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    category = Column(String(50), default="other")  # rent, electric, water, salary, supplies, other
    description = Column(Text)
    amount = Column(Numeric(12, 0), default=0)
    expense_date = Column(Date, default=date.today)
    created_by = Column(PGUUID(as_uuid=True))
    created_by_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Tạo bảng nếu chưa có
try:
    Expense.__table__.create(engine, checkfirst=True)
except Exception:
    pass


# ===== DASHBOARD API =====
@app.get("/api/dashboard/summary")
@jwt_required()
def dashboard_summary():
    """All-in-one summary cho Dashboard chủ tiệm"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        today = date.today()
        import datetime as dt_module

        # === Today stats ===
        today_q = db.query(
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
            func.coalesce(func.sum(Order.paid_amount), 0).label("paid"),
            func.coalesce(func.sum(Order.debt_amount), 0).label("debt"),
        ).filter(
            Order.tenant_id == tenant_id,
            func.date(Order.created_at) == today,
            Order.is_deleted == False,
            Order.status != "cancelled"
        ).first()

        new_customers_today = db.query(func.count(Customer.id)).filter(
            Customer.tenant_id == tenant_id,
            func.date(Customer.created_at) == today
        ).scalar() or 0

        appointments_today = db.query(func.count(Appointment.id)).filter(
            Appointment.tenant_id == tenant_id,
            func.date(Appointment.appointment_time) == today,
            Appointment.status.notin_(["cancelled"])
        ).scalar() or 0

        low_stock_count = db.query(Product).filter(
            Product.tenant_id == tenant_id,
            Product.track_stock == True,
            Product.stock_qty <= Product.min_stock,
            Product.is_active == True
        ).count()

        debt_customers_count = db.query(Customer).filter(
            Customer.tenant_id == tenant_id,
            Customer.debt > 0
        ).count()

        # === 7 days chart ===
        seven_days_ago = today - dt_module.timedelta(days=6)
        chart_rows = db.execute(text("""
            SELECT DATE(created_at) as ngay,
                   COUNT(*) as so_hd,
                   COALESCE(SUM(total), 0) as doanh_thu,
                   COALESCE(SUM(paid_amount), 0) as da_thu
            FROM orders
            WHERE tenant_id = :tid AND is_deleted = false AND status != 'cancelled'
              AND DATE(created_at) >= :df AND DATE(created_at) <= :dt
            GROUP BY DATE(created_at) ORDER BY ngay
        """), {"tid": tenant_id, "df": str(seven_days_ago), "dt": str(today)}).fetchall()

        # === This month ===
        month_start = today.replace(day=1)
        month_q = db.query(
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
            func.coalesce(func.sum(Order.paid_amount), 0).label("paid"),
            func.count(Order.id).label("orders"),
        ).filter(
            Order.tenant_id == tenant_id,
            func.date(Order.created_at) >= month_start,
            func.date(Order.created_at) <= today,
            Order.is_deleted == False,
            Order.status != "cancelled"
        ).first()

        # Chi phí tháng này
        month_expenses = db.query(
            func.coalesce(func.sum(Expense.amount), 0)
        ).filter(
            Expense.tenant_id == tenant_id,
            Expense.expense_date >= month_start,
            Expense.expense_date <= today
        ).scalar() or 0

        # === Top 5 services this month ===
        top_services = db.query(
            OrderItem.product_name,
            func.sum(OrderItem.qty).label("qty"),
            func.sum(OrderItem.total).label("tong")
        ).join(Order, OrderItem.order_id == Order.id).filter(
            OrderItem.tenant_id == tenant_id,
            Order.is_deleted == False,
            Order.status != "cancelled",
            func.date(Order.created_at) >= month_start,
            func.date(Order.created_at) <= today
        ).group_by(OrderItem.product_name).order_by(func.sum(OrderItem.total).desc()).limit(5).all()

        # === Staff commission this month ===
        staff_list = db.query(User).filter(
            User.tenant_id == tenant_id, User.is_active == True
        ).all()
        staff_summary = []
        for u in staff_list:
            r = db.query(func.sum(OrderItem.total).label("t")).join(
                Order, OrderItem.order_id == Order.id
            ).filter(
                OrderItem.staff_name == u.name,
                OrderItem.tenant_id == tenant_id,
                Order.is_deleted == False, Order.status != "cancelled",
                func.date(Order.created_at) >= month_start,
                func.date(Order.created_at) <= today
            ).first()
            tong = float(r.t or 0)
            hoa_hong = tong * float(u.commission_rate or 0) / 100
            staff_summary.append({
                "name": u.name, "role": u.role,
                "commission_rate": float(u.commission_rate or 0),
                "tong_doanh_thu": tong, "hoa_hong": hoa_hong
            })
        staff_summary.sort(key=lambda x: x["tong_doanh_thu"], reverse=True)
        total_commission = sum(s["hoa_hong"] for s in staff_summary)

        return ok({
            "today": {
                "orders": today_q.orders or 0,
                "revenue": float(today_q.revenue or 0),
                "paid": float(today_q.paid or 0),
                "debt": float(today_q.debt or 0),
                "new_customers": new_customers_today,
                "appointments": appointments_today,
            },
            "alerts": {
                "low_stock": low_stock_count,
                "debt_customers": debt_customers_count,
            },
            "month": {
                "revenue": float(month_q.revenue or 0),
                "paid": float(month_q.paid or 0),
                "orders": month_q.orders or 0,
                "expenses": float(month_expenses),
                "profit_est": float(month_q.paid or 0) - float(month_expenses),
                "total_commission": total_commission,
            },
            "chart_7days": [{"ngay": str(r.ngay), "doanh_thu": float(r.doanh_thu), "da_thu": float(r.da_thu), "so_hd": r.so_hd} for r in chart_rows],
            "top_services": [{"name": r.product_name, "qty": float(r.qty or 0), "tong": float(r.tong or 0)} for r in top_services],
            "staff": staff_summary[:5],
        })
    finally:
        db.close()


# ===== EXPENSES API =====
EXPENSE_CATEGORIES = {
    "rent": "💼 Mặt bằng",
    "electric": "⚡ Điện",
    "water": "💧 Nước",
    "salary": "👥 Lương",
    "supplies": "🧴 Vật tư",
    "equipment": "🔧 Thiết bị",
    "marketing": "📢 Marketing",
    "other": "📌 Khác",
}

@app.get("/api/expenses")
@jwt_required()
def list_expenses():
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        q = db.query(Expense).filter(Expense.tenant_id == tenant_id)
        if request.args.get("date_from"):
            q = q.filter(Expense.expense_date >= to_date(request.args["date_from"]))
        if request.args.get("date_to"):
            q = q.filter(Expense.expense_date <= to_date(request.args["date_to"]))
        if request.args.get("category"):
            q = q.filter(Expense.category == request.args["category"])
        expenses = q.order_by(Expense.expense_date.desc(), Expense.created_at.desc()).limit(200).all()
        return ok([{
            "id": str(e.id),
            "category": e.category,
            "category_label": EXPENSE_CATEGORIES.get(e.category, e.category),
            "description": e.description,
            "amount": float(e.amount),
            "expense_date": str(e.expense_date),
            "created_by_name": e.created_by_name,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        } for e in expenses])
    finally:
        db.close()

@app.post("/api/expenses")
@jwt_required()
def create_expense():
    user_id, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"):
        return err("Không có quyền thêm chi phí", 403)
    d = request.json
    db = get_db()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        e = Expense(
            tenant_id=tenant_id,
            category=d.get("category", "other"),
            description=d.get("description", ""),
            amount=float(d.get("amount", 0)),
            expense_date=to_date(d.get("expense_date", str(date.today()))),
            created_by=user_id,
            created_by_name=user.name if user else ""
        )
        db.add(e)
        db.commit()
        return ok({"id": str(e.id), "message": "Đã ghi nhận chi phí"})
    except Exception as ex:
        db.rollback()
        return err(str(ex), 500)
    finally:
        db.close()

@app.delete("/api/expenses/<expense_id>")
@jwt_required()
def delete_expense(expense_id):
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"):
        return err("Không có quyền xóa", 403)
    db = get_db()
    try:
        e = db.query(Expense).filter(Expense.id == expense_id, Expense.tenant_id == tenant_id).first()
        if not e: return err("Không tìm thấy", 404)
        db.delete(e)
        db.commit()
        return ok({"message": "Đã xóa"})
    finally:
        db.close()

@app.get("/api/expenses/summary")
@jwt_required()
def expense_summary():
    """Tổng chi phí theo tháng và theo danh mục"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        date_from = request.args.get("date_from", str(date.today().replace(day=1)))
        date_to = request.args.get("date_to", str(date.today()))
        rows = db.query(
            Expense.category,
            func.sum(Expense.amount).label("total")
        ).filter(
            Expense.tenant_id == tenant_id,
            Expense.expense_date >= to_date(date_from),
            Expense.expense_date <= to_date(date_to)
        ).group_by(Expense.category).all()
        total_all = sum(float(r.total or 0) for r in rows)
        return ok({
            "total": total_all,
            "by_category": [{
                "category": r.category,
                "label": EXPENSE_CATEGORIES.get(r.category, r.category),
                "amount": float(r.total or 0)
            } for r in rows]
        })
    finally:
        db.close()


# ===== ORDERS - Get items for a customer order =====
@app.get("/api/orders/<order_id>/items")
@jwt_required()
def get_order_items(order_id):
    """Lấy chi tiết các items của một đơn hàng"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        o = db.query(Order).filter(Order.id == order_id, Order.tenant_id == tenant_id).first()
        if not o: return err("Không tìm thấy hóa đơn", 404)
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        return ok({
            "order_no": o.order_no,
            "total": float(o.total),
            "paid_amount": float(o.paid_amount),
            "debt_amount": float(o.debt_amount),
            "payment_method": o.payment_method,
            "status": o.status,
            "staff_name": o.staff_name,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "note": o.note or "",
            "items": [{
                "product_name": i.product_name,
                "unit": i.unit,
                "qty": float(i.qty),
                "price": float(i.price),
                "discount_amount": float(i.discount_amount or 0),
                "total": float(i.total),
                "staff_name": i.staff_name or "",
            } for i in items]
        })
    finally:
        db.close()



# ===== SMS / ZALO NHẮC LỊCH HẸN =====

def send_sms_speedsms(phone, message_text, api_key):
    """Gửi SMS qua SpeedSMS API (trả phí ~500đ/SMS)"""
    import urllib.request, json as jsonlib
    url = "https://api.speedsms.vn/index.php/sms/send"
    data = jsonlib.dumps({
        "to": [phone], "content": message_text,
        "sms_type": 4, "sender": ""
    }).encode("utf-8")
    headers = {
        "Authorization": "Basic " + __import__("base64").b64encode(f"{api_key}:x".encode()).decode(),
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = jsonlib.loads(resp.read().decode())
            return result.get("status") == "success"
    except Exception as e:
        print(f"SpeedSMS Error: {e}")
        return False


def send_sms_esms(phone, message_text, api_key, secret_key):
    """Gửi SMS qua ESMS API (trả phí)"""
    import urllib.request, urllib.parse, json as jsonlib
    url = "http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?"
    params = urllib.parse.urlencode({
        "ApiKey": api_key, "Content": message_text, "Phone": phone,
        "SecretKey": secret_key, "IsUnicode": 0, "Brandname": "", "SmsType": 2,
    })
    try:
        with urllib.request.urlopen(url + params, timeout=10) as resp:
            result = jsonlib.loads(resp.read().decode())
            return result.get("CodeResult") == "100"
    except Exception as e:
        print(f"ESMS Error: {e}")
        return False


# ==========================================
# MIỄN PHÍ: ZALO OA
# ==========================================
def send_zalo_oa(user_id, message_text, access_token):
    """Gửi tin nhắn qua Zalo OA API (Đồng bộ - miễn phí)
    
    CÁCH DÙNG:
    1. Vào business.zalo.me → tạo Official Account (miễn phí)
    2. Vào Quản lý ứng dụng → tạo ứng dụng → lấy Access Token
    3. Khách hàng phải FOLLOW OA của bạn trước
    4. Lấy user_id Zalo của khách qua webhook hoặc khi họ nhắn tin vào OA
    
    user_id: Zalo user_id của khách (không phải số điện thoại!)
    """
    import urllib.request, json as jsonlib
    url = "https://openapi.zalo.me/v3.0/oa/message/cs"
    payload = {
        "recipient": {"user_id": user_id},
        "message": {"text": message_text}
    }
    data = jsonlib.dumps(payload).encode("utf-8")
    headers = {
        "access_token": access_token,
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = jsonlib.loads(resp.read().decode())
            return result.get("error") == 0
    except Exception as e:
        print(f"Zalo OA Error: {e}")
        return False


# ==========================================
# MIỄN PHÍ: TELEGRAM BOT
# ==========================================
def send_telegram(chat_id, message_text, bot_token):
    """Gửi tin qua Telegram Bot (miễn phí 100%, không giới hạn)
    
    CÁCH DÙNG:
    1. Nhắn @BotFather trên Telegram → /newbot → lấy Bot Token
    2. Khách hàng cần nhắn /start cho bot 1 lần
    3. Lấy chat_id của khách từ webhook hoặc API getUpdates
    
    chat_id: Telegram chat_id của khách (số nguyên, ví dụ: 123456789)
    """
    import urllib.request, urllib.parse, json as jsonlib
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    params = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "HTML"
    })
    try:
        with urllib.request.urlopen(f"{url}?{params}", timeout=10) as resp:
            result = jsonlib.loads(resp.read().decode())
            return result.get("ok") == True
    except Exception as e:
        print(f"Telegram Error: {e}")
        return False


def get_telegram_updates(bot_token):
    """Lấy danh sách chat_id từ khách đã nhắn bot (dùng để lưu chat_id)"""
    import urllib.request, json as jsonlib
    url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return jsonlib.loads(resp.read().decode())
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ==========================================
# MIỄN PHÍ: GMAIL / EMAIL
# ==========================================
def send_email_gmail(to_email, subject, body, gmail_user, gmail_app_password):
    """Gửi email qua Gmail SMTP (miễn phí)
    
    CÁCH DÙNG:
    1. Bật 2-Step Verification trên tài khoản Gmail
    2. Vào myaccount.google.com → Security → App Passwords
    3. Tạo App Password cho 'Mail' → copy 16 ký tự
    4. Diền gmail_user = 'tenban@gmail.com', gmail_app_password = '16 ký tự đó'
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = gmail_user
        msg['To'] = to_email
        # Plain text
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        # HTML version (đẹp hơn)
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:16px;border-radius:12px;text-align:center;margin-bottom:16px">
            <h2 style="color:#fff;margin:0">📅 Nhắc lịch hẹn</h2>
          </div>
          <p style="font-size:15px;color:#333;line-height:1.6">{body.replace(chr(10), '<br/>')}</p>
          <hr style="border:1px solid #f0f0f0;margin:16px 0">
          <p style="font-size:12px;color:#999">Tin nhắn tự động từ hệ thống LocalPOS</p>
        </div>
        """
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_user, gmail_app_password)
            server.sendmail(gmail_user, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Gmail Error: {e}")
        return False


def do_send_reminder(apt_id, tenant_id, phone, message_text, customer_email=None):
    """Thực thi gửi thông báo và update reminder_sent"""
    db = get_db()
    try:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        sms_cfg = (tenant.settings or {}).get("sms", {})
        provider = sms_cfg.get("provider", "demo")
        api_key  = sms_cfg.get("api_key", "")
        secret_key = sms_cfg.get("secret_key", "")

        success = False

        # ── SMS trả phí ──────────────────────────────
        if provider == "speedsms" and api_key:
            success = send_sms_speedsms(phone, message_text, api_key)

        elif provider == "esms" and api_key and secret_key:
            success = send_sms_esms(phone, message_text, api_key, secret_key)

        # ── MIỄN PHÍ: Zalo OA ──────────────────────
        elif provider == "zalo_oa" and api_key:
            # api_key = Zalo OA Access Token
            # secret_key = Zalo user_id của khách (lưu khi họ nhắn OA)
            zalo_user_id = sms_cfg.get("zalo_user_id_field", "")
            # Thực tế: zalo_user_id lấy từ DB của khách hàng
            # ᴔm đây số điện thoại là phone, cần map sang Zalo user_id
            if secret_key:  # dùng secret_key để lưu zalo_user_id trong trường hợp đơn giản
                success = send_zalo_oa(secret_key, message_text, api_key)
            else:
                print(f"[Zalo OA] Thiếu Zalo user_id cho khách {phone}")
                success = False

        # ── MIỄN PHÍ: Telegram Bot ──────────────────
        elif provider == "telegram" and api_key:
            # api_key = Bot Token
            # secret_key = chat_id của khách
            if secret_key:
                success = send_telegram(secret_key, message_text, api_key)
            else:
                print(f"[Telegram] Thiếu chat_id cho khách {phone}")
                success = False

        # ── MIỄN PHÍ: Gmail SMTP ─────────────────────
        elif provider == "gmail" and api_key:
            # api_key = gmail address (ten@gmail.com)
            # secret_key = App Password (16 ký tự)
            to_email = customer_email or sms_cfg.get("test_email", "")
            subject = sms_cfg.get("email_subject", "Nhắc lịch hẹn")
            if to_email and secret_key:
                success = send_email_gmail(to_email, subject, message_text, api_key, secret_key)
            else:
                print(f"[Gmail] Thiếu email khách hoặc App Password")
                success = False

        # ── Demo mode ─────────────────────────────────
        else:
            print(f"[DEMO] Provider={provider} | To={phone} | Msg={message_text}")
            success = True  # demo luôn success

        if success:
            apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
            if apt:
                apt.reminder_sent = True
                db.commit()
        return success
    except Exception as e:
        print(f"Reminder error: {e}")
        return False
    finally:
        db.close()


def check_and_send_reminders():
    """Job chạy mỗi 15 phút: tìm lịch hẹn sắp đến và gửi nhắc"""
    import datetime as dt_module
    db = get_db()
    try:
        now = datetime.now()
        # Tìm lịch hẹn trong 60-90 phút tới, chưa gửi nhắc, có SĐT
        window_start = now + dt_module.timedelta(minutes=55)
        window_end = now + dt_module.timedelta(minutes=95)

        apts = db.query(Appointment, Tenant).join(
            Tenant, Appointment.tenant_id == Tenant.id
        ).filter(
            Appointment.appointment_time >= window_start,
            Appointment.appointment_time <= window_end,
            Appointment.reminder_sent == False,
            Appointment.status.notin_(["cancelled", "done"]),
            Appointment.customer_phone.isnot(None),
            Appointment.customer_phone != ""
        ).all()

        for apt, tenant in apts:
            sms_settings = (tenant.settings or {}).get("sms", {})
            if not sms_settings.get("enabled", False):
                continue
            template = sms_settings.get("template",
                "Xin chào {name}! {shop} nhắc bạn có lịch hẹn lúc {time} hôm nay. Xin vui lòng đến đúng giờ. Cảm ơn!")
            msg = template.replace("{name}", apt.customer_name or "Quý khách")
            msg = msg.replace("{shop}", tenant.name or "Tiệm")
            msg = msg.replace("{time}", apt.appointment_time.strftime("%H:%M"))
            msg = msg.replace("{service}", apt.service_name or "")
            msg = msg.replace("{stylist}", apt.stylist_name or "")

            print(f"[Reminder] Sending to {apt.customer_phone} for apt {apt.id}")
            do_send_reminder(str(apt.id), str(apt.tenant_id), apt.customer_phone, msg)

    except Exception as e:
        print(f"Reminder job error: {e}")
    finally:
        db.close()


# Khởi tạo APScheduler (nếu có)
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_send_reminders, 'interval', minutes=15, id='sms_reminder')
    scheduler.start()
    print("[Scheduler] SMS reminder job started (every 15 minutes)")
except ImportError:
    print("[Scheduler] APScheduler not installed – SMS auto-reminder disabled. Run: pip install apscheduler")
    scheduler = None


# ─── API: Gửi nhắc thủ công ──────────────────────────
@app.post("/api/appointments/<apt_id>/send-reminder")
@jwt_required()
def send_manual_reminder(apt_id):
    """Gửi SMS nhắc lịch thủ công cho 1 lịch hẹn cụ thể"""
    _, tenant_id, _ = current_user_info()
    db = get_db()
    try:
        apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.tenant_id == tenant_id).first()
        if not apt: return err("Không tìm thấy lịch hẹn", 404)
        if not apt.customer_phone: return err("Lịch hẹn này không có số điện thoại", 400)

        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        sms_settings = (tenant.settings or {}).get("sms", {})
        template = sms_settings.get("template",
            "Xin chào {name}! {shop} nhắc bạn có lịch hẹn lúc {time} hôm nay. Xin vui lòng đến đúng giờ. Cảm ơn!")
        msg = template.replace("{name}", apt.customer_name or "Quý khách")
        msg = msg.replace("{shop}", tenant.name or "Tiệm")
        msg = msg.replace("{time}", apt.appointment_time.strftime("%H:%M"))
        msg = msg.replace("{service}", apt.service_name or "")
        msg = msg.replace("{stylist}", apt.stylist_name or "")

        success = do_send_reminder(apt_id, tenant_id, apt.customer_phone, msg)
        if success:
            return ok({"message": f"Đã gửi SMS tới {apt.customer_phone}"})
        else:
            return err("Gửi SMS thất bại. Kiểm tra API key trong Cài đặt.", 500)
    finally:
        db.close()


# ─── API: Lấy & cập nhật cài đặt SMS ─────────────────
@app.get("/api/settings/sms")
@jwt_required()
def get_sms_settings():
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Không có quyền", 403)
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        sms = (t.settings or {}).get("sms", {})
        return ok({
            "enabled":       sms.get("enabled", False),
            "provider":      sms.get("provider", "demo"),
            "api_key":       sms.get("api_key", ""),
            "secret_key":    sms.get("secret_key", ""),
            "test_email":    sms.get("test_email", ""),
            "email_subject": sms.get("email_subject", "Nhắc lịch hẹn"),
            "template": sms.get("template",
                "Xin chào {name}! {shop} nhắc bạn có lịch hẹn lúc {time} hôm nay. Xin vui lòng đến đúng giờ. Cảm ơn!"),
        })
    finally:
        db.close()


@app.put("/api/settings/sms")
@jwt_required()
def update_sms_settings():
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Không có quyền", 403)
    d = request.json
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        current_settings = dict(t.settings or {})
        cur = dict(t.settings or {})
        cur["sms"] = {
            "enabled":       d.get("enabled", False),
            "provider":      d.get("provider", "demo"),
            "api_key":       d.get("api_key", ""),
            "secret_key":    d.get("secret_key", ""),
            "test_email":    d.get("test_email", ""),
            "email_subject": d.get("email_subject", "Nhắc lịch hẹn"),
            "template":      d.get("template", "Xin chào {name}! {shop} nhắc bạn có lịch hẹn lúc {time} hôm nay."),
        }
        t.settings = cur
        db.commit()
        return ok({"message": "Đã cập nhật cài đặt thông báo"})
    except Exception as e:
        db.rollback()
        return err(str(e), 500)
    finally:
        db.close()


@app.post("/api/settings/sms/test")
@jwt_required()
def test_notification():
    """Gửi thông báo test"""
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Không có quyền", 403)
    d = request.json or {}
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        sms = (t.settings or {}).get("sms", {})
        provider   = sms.get("provider", "demo")
        api_key    = sms.get("api_key", "")
        secret_key = sms.get("secret_key", "")
        test_msg = f"[TEST] {t.name} - Đây là tin nhắn kiểm tra. Nếu nhận được, tính năng nhắc lịch đã hoạt động!"
        success = False
        detail = "demo mode"

        if provider == "telegram" and api_key:
            chat_id = d.get("chat_id") or secret_key
            if not chat_id: return err("Nhập chat_id Telegram vào Secret Key", 400)
            success = send_telegram(chat_id, test_msg, api_key)
            detail = f"Telegram chat_id={chat_id}"
        elif provider == "zalo_oa" and api_key:
            zalo_uid = d.get("zalo_user_id") or secret_key
            if not zalo_uid: return err("Nhập Zalo user_id vào Secret Key", 400)
            success = send_zalo_oa(zalo_uid, test_msg, api_key)
            detail = f"Zalo user_id={zalo_uid}"
        elif provider == "gmail" and api_key and secret_key:
            email = d.get("email") or sms.get("test_email", "")
            if not email: return err("Nhập email test", 400)
            success = send_email_gmail(email, "[TEST] Nhắc lịch hẹn", test_msg, api_key, secret_key)
            detail = f"email={email}"
        elif provider in ("speedsms", "esms") and api_key:
            phone = d.get("phone", "")
            if not phone: return err("Nhập số điện thoại test", 400)
            success = send_sms_speedsms(phone, test_msg, api_key) if provider == "speedsms" else send_sms_esms(phone, test_msg, api_key, secret_key)
            detail = f"phone={phone}"
        else:
            print(f"[TEST DEMO] {test_msg}")
            success = True

        if success:
            return ok({"message": f"Đã gửi test! ({detail})"})
        else:
            return err("Gửi thất bại. Kiểm tra lại API key.", 500)
    finally:
        db.close()


@app.get("/api/settings/telegram-updates")
@jwt_required()
def telegram_get_updates():
    """Lấy danh sách users đã nhắn bot"""
    _, tenant_id, role = current_user_info()
    if role not in ("owner", "manager"): return err("Không có quyền", 403)
    db = get_db()
    try:
        t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        sms = (t.settings or {}).get("sms", {})
        if sms.get("provider") != "telegram": return err("Chưa chọn Telegram", 400)
        bot_token = sms.get("api_key", "")
        if not bot_token: return err("Chưa nhập Bot Token", 400)
        result = get_telegram_updates(bot_token)
        if not result.get("ok"): return err("Lỗi kết nối Telegram", 500)
        seen, users = set(), []
        for upd in result.get("result", []):
            m = upd.get("message") or upd.get("channel_post") or {}
            chat = m.get("chat", {})
            cid = chat.get("id")
            if cid and cid not in seen:
                seen.add(cid)
                users.append({"chat_id": cid, "name": (chat.get("first_name","") + " " + chat.get("last_name","")).strip(), "username": chat.get("username","")})
        return ok(users)
    finally:
        db.close()


if __name__ == "__main__":
    app.run(debug=True, port=8000, host="0.0.0.0")
