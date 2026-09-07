from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, date
from typing import Optional
from app.database import get_db
from app.models.models import Order, OrderItem, Product, Customer
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/today")
def report_today(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = date.today()
    q = db.query(
        func.count(Order.id).label("total_orders"),
        func.coalesce(func.sum(Order.total), 0).label("total_revenue"),
        func.coalesce(func.sum(Order.paid_amount), 0).label("total_paid"),
        func.coalesce(func.sum(Order.debt_amount), 0).label("total_debt"),
    ).filter(
        Order.tenant_id == current_user.tenant_id,
        func.date(Order.created_at) == today,
        Order.is_deleted == False,
        Order.status != "cancelled"
    ).first()

    # Đếm khách mới hôm nay
    new_customers = db.query(func.count(Customer.id)).filter(
        Customer.tenant_id == current_user.tenant_id,
        func.date(Customer.created_at) == today
    ).scalar() or 0

    # Sản phẩm sắp hết hàng
    low_stock = db.query(Product).filter(
        Product.tenant_id == current_user.tenant_id,
        Product.track_stock == True,
        Product.stock_qty <= Product.min_stock,
        Product.is_active == True
    ).count()

    return {
        "date": today.isoformat(),
        "total_orders": q.total_orders or 0,
        "total_revenue": float(q.total_revenue or 0),
        "total_paid": float(q.total_paid or 0),
        "total_debt": float(q.total_debt or 0),
        "new_customers": new_customers,
        "low_stock_count": low_stock
    }


@router.get("/revenue")
def report_revenue(
    date_from: str,
    date_to: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    rows = db.query(
        func.date(Order.created_at).label("ngay"),
        func.count(Order.id).label("so_hoa_don"),
        func.sum(Order.total).label("doanh_thu"),
        func.sum(Order.paid_amount).label("da_thu"),
    ).filter(
        Order.tenant_id == current_user.tenant_id,
        func.date(Order.created_at) >= date_from,
        func.date(Order.created_at) <= date_to,
        Order.is_deleted == False,
        Order.status != "cancelled"
    ).group_by(func.date(Order.created_at)).order_by(func.date(Order.created_at)).all()

    return [
        {
            "ngay": str(r.ngay),
            "so_hoa_don": r.so_hoa_don,
            "doanh_thu": float(r.doanh_thu or 0),
            "da_thu": float(r.da_thu or 0)
        }
        for r in rows
    ]


@router.get("/top-products")
def top_products(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(
        OrderItem.product_name,
        func.sum(OrderItem.qty).label("tong_so_luong"),
        func.sum(OrderItem.total).label("tong_tien")
    ).join(Order, OrderItem.order_id == Order.id).filter(
        OrderItem.tenant_id == current_user.tenant_id,
        Order.is_deleted == False,
        Order.status != "cancelled"
    )
    if date_from:
        q = q.filter(func.date(Order.created_at) >= date_from)
    if date_to:
        q = q.filter(func.date(Order.created_at) <= date_to)

    rows = q.group_by(OrderItem.product_name).order_by(
        func.sum(OrderItem.total).desc()
    ).limit(limit).all()

    return [
        {
            "product_name": r.product_name,
            "tong_so_luong": float(r.tong_so_luong or 0),
            "tong_tien": float(r.tong_tien or 0)
        }
        for r in rows
    ]


@router.get("/debt")
def report_debt(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    customers = db.query(Customer).filter(
        Customer.tenant_id == current_user.tenant_id,
        Customer.debt > 0
    ).order_by(Customer.debt.desc()).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "phone": c.phone,
            "debt": float(c.debt)
        }
        for c in customers
    ]
